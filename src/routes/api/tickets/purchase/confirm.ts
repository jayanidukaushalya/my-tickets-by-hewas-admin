import { db } from "@/database"
import { purchase, purchaseSession, ticket } from "@/database/schema"
import {
  apiError,
  apiSuccess,
  apiValidationError,
  corsPreflightResponse,
  publicHandler,
} from "@/server/api"
import { createFileRoute } from "@tanstack/react-router"
import { eq } from "drizzle-orm"
import { z } from "zod"

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const confirmSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
})

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/api/tickets/purchase/confirm")({
  server: {
    handlers: {
      OPTIONS: () => corsPreflightResponse(),

      /**
       * Step 2 of 2 in the purchase flow.
       *
       * - Verifies the session exists and has not expired.
       * - Creates a permanent `purchase` record at the ticket's current price.
       * - Deletes the `purchaseSession` so the reserved seats are released from
       *   reservation tracking and cannot be promoted twice.
       *
       * Call this endpoint after the payment gateway confirms a successful
       * payment, passing the `sessionId` returned by `/reserve`.
       */
      POST: publicHandler(async ({ request }) => {
        const body = await request.json().catch(() => null)

        if (body === null) {
          return apiError("Request body must be valid JSON", 400)
        }

        const parsed = confirmSchema.safeParse(body)

        if (!parsed.success) {
          return apiValidationError(parsed.error.flatten())
        }

        const { sessionId } = parsed.data

        // 1. Load and validate session ————————————————————————————————————————
        const session = await db.query.purchaseSession.findFirst({
          where: eq(purchaseSession.id, sessionId),
        })

        if (!session) {
          return apiError("Purchase session not found", 404)
        }

        if (session.expireAt < new Date()) {
          // Session is unusable after expiry; remove it immediately.
          await db
            .delete(purchaseSession)
            .where(eq(purchaseSession.id, sessionId))
          return apiError("Purchase session has expired. Please start over.", 410)
        }

        // 2. Load ticket for the effective price ——————————————————————————————
        const ticketRecord = await db.query.ticket.findFirst({
          where: eq(ticket.id, session.ticketId),
        })

        if (!ticketRecord) {
          return apiError("Associated ticket no longer exists", 404)
        }

        // 3 & 4. Promote to purchase and consume session atomically ————————————
        const [newPurchase] = await db.transaction(async (tx) => {
          const inserted = await tx
            .insert(purchase)
            .values({
              customerId: session.customerId,
              ticketId: session.ticketId,
              qty: session.qty,
              price: ticketRecord.price, // snapshot the price at confirmation time
              isActivated: false,
            })
            .returning()

          await tx
            .delete(purchaseSession)
            .where(eq(purchaseSession.id, sessionId))

          return inserted
        })

        return apiSuccess(
          {
            purchaseId: newPurchase.id,
            ticketId: newPurchase.ticketId,
            qty: newPurchase.qty,
            price: newPurchase.price,
            isActivated: newPurchase.isActivated,
            createdAt: newPurchase.createdAt,
          },
          201
        )
      }),
    },
  },
})
