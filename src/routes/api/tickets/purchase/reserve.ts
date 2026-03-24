import { db } from "@/database"
import { customer, purchaseSession, ticket } from "@/database/schema"
import {
  apiError,
  apiSuccess,
  apiValidationError,
  corsPreflightResponse,
  publicHandler,
} from "@/server/api"
import { createFileRoute } from "@tanstack/react-router"
import { and, eq, gt } from "drizzle-orm"
import { z } from "zod/v3"

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const reserveSchema = z.object({
  ticketId: z.string().min(1, "Ticket ID is required"),
  qty: z.number().int().positive("Quantity must be a positive integer"),
  email: z.string().email("A valid email address is required"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/api/tickets/purchase/reserve")({
  server: {
    handlers: {
      OPTIONS: () => corsPreflightResponse(),

      /**
       * Step 1 of 2 in the purchase flow.
       *
       * - Finds or creates a customer record by email (no auth required).
       * - Verifies enough seats are available (unsold + un-reserved).
       * - Locks the requested seats in a `purchaseSession` for 15 minutes.
       *
       * The client must complete payment and call `/api/tickets/purchase/confirm`
       * with the returned `sessionId` before the session expires.
       */
      POST: publicHandler(async ({ request }) => {
        const body = await request.json().catch(() => null)

        if (body === null) {
          return apiError("Request body must be valid JSON", 400)
        }

        const parsed = reserveSchema.safeParse(body)

        if (!parsed.success) {
          return apiValidationError(parsed.error.flatten())
        }

        const { ticketId, qty, email, firstName, lastName } = parsed.data

        // 1. Find or create customer —————————————————————————————————————————
        let currentCustomer = await db.query.customer.findFirst({
          where: eq(customer.email, email),
        })

        if (!currentCustomer) {
          const [created] = await db
            .insert(customer)
            .values({
              email,
              firstName: firstName ?? null,
              lastName: lastName ?? null,
            })
            .returning()
          currentCustomer = created
        }

        // 2. Check ticket availability ————————————————————————————————————————
        const ticketRecord = await db.query.ticket.findFirst({
          where: eq(ticket.id, ticketId),
          with: {
            purchases: { columns: { qty: true } },
            purchaseSessions: {
              where: and(gt(purchaseSession.expireAt, new Date())),
              columns: { qty: true },
            },
          },
        })

        if (!ticketRecord) {
          return apiError("Ticket not found", 404)
        }

        const soldQty = ticketRecord.purchases.reduce(
          (sum, p) => sum + p.qty,
          0
        )
        const reservedQty = ticketRecord.purchaseSessions.reduce(
          (sum, s) => sum + s.qty,
          0
        )
        const availableQty = ticketRecord.qty - soldQty - reservedQty

        if (qty > availableQty) {
          return apiError(
            availableQty <= 0
              ? "This ticket is sold out"
              : `Only ${availableQty} ticket(s) available`,
            409
          )
        }

        // 3. Create purchase session (expires in 15 minutes) ——————————————————
        const expireAt = new Date(Date.now() + 15 * 60 * 1000)

        const [session] = await db
          .insert(purchaseSession)
          .values({
            customerId: currentCustomer.id,
            ticketId,
            qty,
            expireAt,
          })
          .returning()

        return apiSuccess(
          {
            sessionId: session.id,
            expireAt: session.expireAt,
            qty: session.qty,
            ticket: {
              id: ticketRecord.id,
              name: ticketRecord.name,
              price: ticketRecord.price,
            },
          },
          201
        )
      }),
    },
  },
})
