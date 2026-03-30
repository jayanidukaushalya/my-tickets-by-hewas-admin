import { db } from "@/database"
import {
  customer,
  orderSession,
  orderSessionLine,
  orderLine,
  ticket,
} from "@/database/schema"
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
import { PAYHERE_MERCHANT_ID, PAYHERE_MERCHANT_SECRET } from "@/configs/env.config"
import { createFileRoute } from "@tanstack/react-router"
import { and, eq, gt, sql } from "drizzle-orm"
import { z } from "zod"

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const lineItemSchema = z.object({
  ticketId: z.string().min(1, "Ticket ID is required"),
  qty: z.number().int().positive("Quantity must be a positive integer"),
})

const authenticatedReserveSchema = z.object({
  items: z.array(lineItemSchema).min(1, "At least one ticket is required"),
  phone: z.string().min(7, "A valid contact number is required"),
})

const guestReserveSchema = z.object({
  items: z.array(lineItemSchema).min(1, "At least one ticket is required"),
  email: z.email("A valid email address is required"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().min(7, "A valid contact number is required"),
})

// ---------------------------------------------------------------------------
// Availability (sold = paid order lines; reserved = unpaid session lines with live session)
// ---------------------------------------------------------------------------

async function soldQtyForTicket(ticketId: string): Promise<number> {
  const [row] = await db
    .select({
      n: sql<number>`coalesce(sum(${orderLine.qty}), 0)`,
    })
    .from(orderLine)
    .where(eq(orderLine.ticketId, ticketId))
  return Number(row?.n ?? 0)
}

async function reservedQtyForTicket(ticketId: string): Promise<number> {
  const [row] = await db
    .select({
      n: sql<number>`coalesce(sum(${orderSessionLine.qty}), 0)`,
    })
    .from(orderSessionLine)
    .innerJoin(
      orderSession,
      eq(orderSessionLine.orderSessionId, orderSession.id)
    )
    .where(
      and(
        eq(orderSessionLine.ticketId, ticketId),
        gt(orderSession.expireAt, new Date())
      )
    )
  return Number(row?.n ?? 0)
}

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
       * - Creates one `order_session` and one `order_session_line` per cart line.
       * - Verifies availability (sold + active reservations).
       */
      POST: optionalAuthHandler(async ({ request, user }) => {
        try {
          const body = await parseJsonBody(request)

          let customerId: string
          let items: Array<{ ticketId: string; qty: number }>

          if (user) {
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
            const parsed = guestReserveSchema.safeParse(body)

            if (!parsed.success) {
              return apiValidationError(z.treeifyError(parsed.error))
            }

            items = parsed.data.items
            const { email, firstName, lastName } = parsed.data
            const phone = parsed.data.phone.trim()

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

          for (const item of items) {
            const ticketRecord = await db.query.ticket.findFirst({
              where: eq(ticket.id, item.ticketId),
              with: {
                timeSlot: true,
              },
            })

            if (!ticketRecord) {
              return apiError("Ticket not found", 404)
            }

            const effectiveEndDate = 
              ticketRecord.timeSlot.endTime ?? ticketRecord.timeSlot.startTime

            if (new Date(effectiveEndDate) < new Date()) {
              return apiError(
                `Ticket "${ticketRecord.name}" is no longer available (Event expired)`,
                400
              )
            }

            const soldQty = await soldQtyForTicket(item.ticketId)
            const reservedQty = await reservedQtyForTicket(item.ticketId)
            const availableQty = ticketRecord.qty - soldQty - reservedQty

            if (item.qty > availableQty) {
              return apiError(
                availableQty <= 0
                  ? `Ticket "${ticketRecord.name}" is sold out`
                  : `Only ${availableQty} ticket(s) available for "${ticketRecord.name}"`,
                409
              )
            }
          }

          const { session, reservations, totalAmount } = await db.transaction(
            async (tx) => {
              const [s] = await tx
                .insert(orderSession)
                .values({
                  customerId,
                  expireAt,
                })
                .returning()

              const reservations: Array<{
                sessionId: string
                expireAt: Date
                qty: number
                ticket: { id: string; name: string; price: string }
              }> = []
              let totalAmount = 0

              for (const item of items) {
                const ticketRecord = await tx.query.ticket.findFirst({
                  where: eq(ticket.id, item.ticketId),
                })
                if (!ticketRecord) {
                  throw new Error("Ticket not found")
                }

                const [line] = await tx
                  .insert(orderSessionLine)
                  .values({
                    orderSessionId: s.id,
                    ticketId: item.ticketId,
                    qty: item.qty,
                  })
                  .returning()

                reservations.push({
                  sessionId: line.id,
                  expireAt: s.expireAt,
                  qty: line.qty,
                  ticket: {
                    id: ticketRecord.id,
                    name: ticketRecord.name,
                    price: String(ticketRecord.price),
                  },
                })

                totalAmount +=
                  Number.parseFloat(String(ticketRecord.price)) * item.qty
              }

              return { session: s, reservations, totalAmount }
            }
          )

          if (!PAYHERE_MERCHANT_ID || !PAYHERE_MERCHANT_SECRET) {
            return apiError("Payment gateway configuration is missing", 500)
          }

          const payhereOrderId = session.id
          const itemsDescription = reservations
            .map((r) => `${r.qty}x ${r.ticket.name}`)
            .join(", ")

          return apiSuccess(
            {
              orderSessionId: session.id,
              expireAt: session.expireAt,
              qty: reservations.reduce((sum, r) => sum + r.qty, 0),
              totalAmount: totalAmount.toFixed(2),
              payment: {
                provider: "payhere",
                sandbox: true,
                merchantId: PAYHERE_MERCHANT_ID,
                merchantSecret: PAYHERE_MERCHANT_SECRET,
                notifyUrl: `${process.env.SITE_URL ?? "http://localhost:3000"}/api/tickets/purchase/confirm`,
                orderId: payhereOrderId,
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
