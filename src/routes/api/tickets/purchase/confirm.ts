import { db } from "@/database"
import { purchase, purchaseSession, ticket } from "@/database/schema"
import {
  apiError,
  apiSuccess,
  apiValidationError,
  corsPreflightResponse,
  publicHandler,
} from "@/server/api"
import { parseJsonBody } from "@/server/api/handler"
import { createFileRoute } from "@tanstack/react-router"
import { eq, inArray } from "drizzle-orm"
import { z } from "zod"

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const confirmSchema = z.object({
  sessionIds: z.array(z.string().min(1)).min(1, "Session IDs are required"),
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
        const body = await parseJsonBody(request)
        const parsed = confirmSchema.safeParse(body)

        if (!parsed.success) {
          return apiValidationError(z.treeifyError(parsed.error))
        }

        const sessionIds = [...new Set(parsed.data.sessionIds)]

        const sessions = await db.query.purchaseSession.findMany({
          where: inArray(purchaseSession.id, sessionIds),
        })

        if (sessions.length !== sessionIds.length) {
          return apiError("One or more purchase sessions not found", 404)
        }

        const now = new Date()
        const expired = sessions.find((s) => s.expireAt < now)
        if (expired) {
          await db
            .delete(purchaseSession)
            .where(eq(purchaseSession.id, expired.id))
          return apiError(
            "Purchase session has expired. Please start over.",
            410
          )
        }

        const ticketIds = [...new Set(sessions.map((s) => s.ticketId))]
        const ticketRecords = await db.query.ticket.findMany({
          where: inArray(ticket.id, ticketIds),
        })
        const ticketById = new Map(ticketRecords.map((t) => [t.id, t]))

        for (const session of sessions) {
          if (!ticketById.get(session.ticketId)) {
            return apiError("Associated ticket no longer exists", 404)
          }
        }

        const newPurchases = await db.transaction(async (tx) => {
          const insertedAll = []
          for (const session of sessions) {
            const ticketRecord = ticketById.get(session.ticketId)!
            const [inserted] = await tx
              .insert(purchase)
              .values({
                customerId: session.customerId,
                ticketId: session.ticketId,
                qty: session.qty,
                price: ticketRecord.price,
                isActivated: false,
              })
              .returning()
            insertedAll.push(inserted)
          }

          await tx
            .delete(purchaseSession)
            .where(inArray(purchaseSession.id, sessionIds))

          return insertedAll
        })

        return apiSuccess(
          {
            purchases: newPurchases.map((p) => ({
              purchaseId: p.id,
              ticketId: p.ticketId,
              qty: p.qty,
              price: p.price,
              isActivated: p.isActivated,
              createdAt: p.createdAt,
            })),
            count: newPurchases.length,
          },
          201
        )
      }),
    },
  },
})
