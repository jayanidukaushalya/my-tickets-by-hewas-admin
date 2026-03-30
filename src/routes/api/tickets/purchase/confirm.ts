import { db } from "@/database"
import {
  order,
  orderLine,
  orderSession,
  orderSessionLine,
  ticket,
} from "@/database/schema"
import { sendPurchasedTicketsConfirmationEmail } from "@/integrations/resend/send-purchased-tickets-email"
import {
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
  orderSessionId: z.string().min(1, "orderSessionId is required"),
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
       * - Loads all `order_session_line` rows for the given `order_session`.
       * - Creates one `orders` row and one `order_line` per line.
       * - Deletes the `order_session` (cascades to session lines).
       */
      POST: publicHandler(async ({ request }) => {
        const body = await parseJsonBody(request)
        const parsed = confirmSchema.safeParse(body)

        if (!parsed.success) {
          return apiValidationError(z.treeifyError(parsed.error))
        }

        const { orderSessionId } = parsed.data

        const lines = await db.query.orderSessionLine.findMany({
          where: eq(orderSessionLine.orderSessionId, orderSessionId),
          with: {
            orderSession: true,
          },
        })

        const sessionRow = lines[0]!.orderSession

        const ticketIds = [...new Set(lines.map((l) => l.ticketId))]
        const ticketRecords = await db.query.ticket.findMany({
          where: inArray(ticket.id, ticketIds),
        })
        const ticketById = new Map(ticketRecords.map((t) => [t.id, t]))

        const totalAmount = lines.reduce((sum, line) => {
          const tr = ticketById.get(line.ticketId)!
          return sum + Number.parseFloat(String(tr.price)) * line.qty
        }, 0)

        const customerId = sessionRow.customerId

        const result = await db.transaction(async (tx) => {
          const [orderResult] = await tx
            .insert(order)
            .values({
              customerId,
              totalAmount: totalAmount.toFixed(2),
              currency: "LKR",
              payhereOrderId: orderSessionId,
            })
            .returning()

          const insertedLines = []
          for (const line of lines) {
            const ticketRecord = ticketById.get(line.ticketId)!
            const [inserted] = await tx
              .insert(orderLine)
              .values({
                orderId: orderResult.id,
                ticketId: line.ticketId,
                qty: line.qty,
                price: ticketRecord.price,
                isActivated: false,
              })
              .returning()
            insertedLines.push(inserted)
          }

          await tx
            .delete(orderSession)
            .where(eq(orderSession.id, orderSessionId))

          return { order: orderResult, insertedLines }
        })

        void sendPurchasedTicketsConfirmationEmail(result.order.id).catch(
          (err) => {
            console.error(
              "[API] Purchase confirmation email (background):",
              err
            )
          }
        )

        return apiSuccess(
          {
            orderId: result.order.id,
            purchases: result.insertedLines.map((p) => ({
              purchaseId: p.id,
              ticketId: p.ticketId,
              qty: p.qty,
              price: p.price,
              isActivated: p.isActivated,
              createdAt: p.createdAt,
            })),
            count: result.insertedLines.length,
          },
          201
        )
      }),
    },
  },
})
