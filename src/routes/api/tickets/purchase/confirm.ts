import { db } from "@/database"
import { order, orderLine, orderSession } from "@/database/schema"
import {
  findReceivedPayment,
  PaymentVerificationError,
} from "@/integrations/payhere/retrieval"
import { sendPurchasedTicketsConfirmationEmail } from "@/integrations/resend/send-purchased-tickets-email"
import {
  apiError,
  apiSuccess,
  apiValidationError,
  corsPreflightResponse,
  publicHandler,
} from "@/server/api"
import { parseJsonBody } from "@/server/api/handler"
import {
  lockTicketsWithAvailability,
  mergeLineItems,
} from "@/server/ticket-availability"
import { createFileRoute } from "@tanstack/react-router"
import { eq } from "drizzle-orm"
import { z } from "zod"

const confirmSchema = z.object({
  orderSessionId: z.string().min(1, "orderSessionId is required"),
})

class TicketsUnavailableError extends Error {}

type ConfirmedOrder = {
  id: string
  orderLines: Array<typeof orderLine.$inferSelect>
}

function confirmedOrderResponse(result: ConfirmedOrder, status: number) {
  return apiSuccess(
    {
      orderId: result.id,
      purchases: result.orderLines.map((p) => ({
        purchaseId: p.id,
        ticketId: p.ticketId,
        qty: p.qty,
        price: p.price,
        isActivated: p.isActivated,
        createdAt: p.createdAt,
      })),
      count: result.orderLines.length,
    },
    status
  )
}

function findOrderForSession(orderSessionId: string) {
  return db.query.order.findFirst({
    where: eq(order.payhereOrderId, orderSessionId),
    with: { orderLines: true },
  })
}

export const Route = createFileRoute("/api/tickets/purchase/confirm")({
  server: {
    handlers: {
      OPTIONS: () => corsPreflightResponse(),

      POST: publicHandler(async ({ request }) => {
        const body = await parseJsonBody(request)
        const parsed = confirmSchema.safeParse(body)

        if (!parsed.success) {
          return apiValidationError(z.treeifyError(parsed.error))
        }

        const { orderSessionId } = parsed.data

        const existingOrder = await findOrderForSession(orderSessionId)
        if (existingOrder) {
          return confirmedOrderResponse(existingOrder, 200)
        }

        const sessionRow = await db.query.orderSession.findFirst({
          where: eq(orderSession.id, orderSessionId),
          with: {
            orderSessionLines: {
              with: { ticket: true },
            },
          },
        })

        if (!sessionRow || sessionRow.orderSessionLines.length === 0) {
          return apiError("Reservation not found", 404)
        }

        const lines = sessionRow.orderSessionLines
        const totalAmount = lines.reduce(
          (sum, line) =>
            sum + Number.parseFloat(String(line.ticket.price)) * line.qty,
          0
        )

        let payment
        try {
          payment = await findReceivedPayment(orderSessionId, {
            amount: Number(totalAmount.toFixed(2)),
            currency: "LKR",
          })
        } catch (error) {
          if (error instanceof PaymentVerificationError) {
            console.error("[API] Payment verification unavailable:", error)
            return apiError(
              "Unable to verify the payment right now. Please try again.",
              503
            )
          }
          throw error
        }

        if (!payment) {
          return apiError(
            "No completed payment found for this reservation",
            402
          )
        }

        let created: ConfirmedOrder | null
        try {
          created = await db.transaction(async (tx) => {
            const [claimed] = await tx
              .delete(orderSession)
              .where(eq(orderSession.id, orderSessionId))
              .returning({ expireAt: orderSession.expireAt })

            if (!claimed) return null

            const now = new Date()
            if (claimed.expireAt <= now) {
              const lineItems = mergeLineItems(lines)
              const tickets = await lockTicketsWithAvailability(
                tx,
                lineItems.map((l) => l.ticketId),
                now
              )
              for (const item of lineItems) {
                const t = tickets.get(item.ticketId)
                if (!t || item.qty > t.available) {
                  throw new TicketsUnavailableError()
                }
              }
            }

            const [orderResult] = await tx
              .insert(order)
              .values({
                customerId: sessionRow.customerId,
                totalAmount: totalAmount.toFixed(2),
                currency: "LKR",
                payhereOrderId: orderSessionId,
              })
              .returning()

            const insertedLines = await tx
              .insert(orderLine)
              .values(
                lines.map((line) => ({
                  orderId: orderResult.id,
                  ticketId: line.ticketId,
                  qty: line.qty,
                  price: line.ticket.price,
                  isActivated: false,
                }))
              )
              .returning()

            return { id: orderResult.id, orderLines: insertedLines }
          })
        } catch (error) {
          if (error instanceof TicketsUnavailableError) {
            console.error(
              `[API] Paid reservation ${orderSessionId} expired and its tickets are gone; PayHere payment ${payment.payment_id} needs a refund`
            )
            return apiError(
              "Your reservation expired and the tickets are no longer available. Your payment will be refunded.",
              409
            )
          }
          throw error
        }

        if (!created) {
          const confirmed = await findOrderForSession(orderSessionId)
          return confirmed
            ? confirmedOrderResponse(confirmed, 200)
            : apiError("Reservation not found", 404)
        }

        void sendPurchasedTicketsConfirmationEmail(created.id).catch((err) => {
          console.error("[API] Purchase confirmation email (background):", err)
        })

        return confirmedOrderResponse(created, 201)
      }),
    },
  },
})
