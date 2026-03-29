import { db } from "@/database"
import { customer, purchaseSession, ticket } from "@/database/schema"
import {
  apiError,
  apiSuccess,
  apiValidationError,
  corsPreflightResponse,
} from "@/server/api"
import { optionalAuthHandler, parseJsonBody } from "@/server/api/handler"
import {
  CustomerIdentityConflictError,
  ensureAuthCustomer,
} from "@/server/api/ensure-auth-customer"
import { createFileRoute } from "@tanstack/react-router"
import { and, eq, gt } from "drizzle-orm"
import { ulid } from "ulid"
import { z } from "zod"
import { PAYHERE_MERCHANT_ID, PAYHERE_MERCHANT_SECRET } from "@/configs/env.config"

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const lineItemSchema = z.object({
  ticketId: z.string().min(1, "Ticket ID is required"),
  qty: z.number().int().positive("Quantity must be a positive integer"),
})

const authenticatedReserveSchema = z
  .object({
    items: z.array(lineItemSchema).min(1, "At least one ticket is required"),
    phone: z.string().min(7, "A valid contact number is required"),
  })

// Schema for guest users (email required)
const guestReserveSchema = z
  .object({
    items: z.array(lineItemSchema).min(1, "At least one ticket is required"),
    email: z.email("A valid email address is required"),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().min(7, "A valid contact number is required"),
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
       * - Supports both authenticated and guest users.
       * - For authenticated users: extracts Firebase UID from token and finds/creates customer by UID.
       * - For guest users: finds or creates a customer record by email (no auth required).
       * - Verifies enough seats are available (unsold + un-reserved).
       * - Locks the requested seats in a `purchaseSession` for 15 minutes.
       *
       * The client must complete payment and call `/api/tickets/purchase/confirm`
       * with the returned `sessionId` before the session expires.
       */
      POST: optionalAuthHandler(async ({ request, user }) => {
        try {
          const body = await parseJsonBody(request)

          let customerId: string
          let items: Array<{ ticketId: string; qty: number }>

          if (user) {
            // Authenticated user flow
            const parsed = authenticatedReserveSchema.safeParse(body)

            if (!parsed.success) {
              return apiValidationError(z.treeifyError(parsed.error))
            }

            items = parsed.data.items
            const phone = parsed.data.phone.trim()

            const customerRecord = await ensureAuthCustomer(user)
            if (phone && customerRecord.phone !== phone) {
              const [updatedCustomer] = await db
                .update(customer)
                .set({ phone })
                .where(eq(customer.id, customerRecord.id))
                .returning()
              customerId = updatedCustomer.id
            } else {
              customerId = customerRecord.id
            }
          } else {
            // Guest user flow
            const parsed = guestReserveSchema.safeParse(body)

            if (!parsed.success) {
              return apiValidationError(z.treeifyError(parsed.error))
            }

            items = parsed.data.items
            const { email, firstName, lastName } = parsed.data
            const phone = parsed.data.phone.trim()

            // Find or create customer by email
            let customerRecord = await db.query.customer.findFirst({
              where: eq(customer.email, email),
            })

            if (!customerRecord) {
              const [created] = await db
                .insert(customer)
                .values({
                  email,
                  firstName: firstName ?? null,
                  lastName: lastName ?? null,
                  phone,
                })
                .returning()
              customerRecord = created
            } else if (customerRecord.phone !== phone) {
              const [updatedCustomer] = await db
                .update(customer)
                .set({ phone })
                .where(eq(customer.id, customerRecord.id))
                .returning()
              customerRecord = updatedCustomer
            }

            customerId = customerRecord.id
          }

          const expireAt = new Date(Date.now() + 15 * 60 * 1000)
          const reservations: Array<{
            sessionId: string
            expireAt: Date
            qty: number
            ticket: { id: string; name: string; price: string }
          }> = []
          let totalAmount = 0

          for (const item of items) {
            const ticketRecord = await db.query.ticket.findFirst({
              where: eq(ticket.id, item.ticketId),
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

            if (item.qty > availableQty) {
              return apiError(
                availableQty <= 0
                  ? `Ticket "${ticketRecord.name}" is sold out`
                  : `Only ${availableQty} ticket(s) available for "${ticketRecord.name}"`,
                409
              )
            }

            const [session] = await db
              .insert(purchaseSession)
              .values({
                customerId,
                ticketId: item.ticketId,
                qty: item.qty,
                expireAt,
              })
              .returning()

            reservations.push({
              sessionId: session.id,
              expireAt: session.expireAt,
              qty: session.qty,
              ticket: {
                id: ticketRecord.id,
                name: ticketRecord.name,
                price: String(ticketRecord.price),
              },
            })

            totalAmount += Number.parseFloat(String(ticketRecord.price)) * item.qty
          }

          if (!PAYHERE_MERCHANT_ID || !PAYHERE_MERCHANT_SECRET) {
            return apiError("Payment gateway configuration is missing", 500)
          }

          const orderId =
            reservations.length === 1 ? reservations[0].sessionId : ulid()
          const itemsDescription = reservations
            .map((r) => `${r.qty}x ${r.ticket.name}`)
            .join(", ")

          return apiSuccess(
            {
              sessionId: reservations[0]?.sessionId,
              sessionIds: reservations.map((r) => r.sessionId),
              sessions: reservations,
              expireAt: reservations[0]?.expireAt,
              qty: reservations.reduce((sum, r) => sum + r.qty, 0),
              totalAmount: totalAmount.toFixed(2),
              payment: {
                provider: "payhere",
                sandbox: true,
                merchantId: PAYHERE_MERCHANT_ID,
                merchantSecret: PAYHERE_MERCHANT_SECRET,
                notifyUrl: `${process.env.SITE_URL ?? "http://localhost:3000"}/api/tickets/purchase/confirm`,
                orderId,
                itemsDescription,
                currency: "LKR",
                amount: totalAmount.toFixed(2),
              },
            },
            201
          )
        } catch (error) {
          if (error instanceof CustomerIdentityConflictError) {
            return apiError(error.message, 409)
          }
          throw error
        }
      }),
    },
  },
})
