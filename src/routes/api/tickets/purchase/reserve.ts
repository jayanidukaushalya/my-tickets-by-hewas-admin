import { db } from "@/database"
import { customer, orderSession, orderSessionLine } from "@/database/schema"
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
import {
  lockTicketsWithAvailability,
  mergeLineItems,
} from "@/server/ticket-availability"
import { PAYHERE_MERCHANT_ID, PAYHERE_SANDBOX } from "@/configs/env.config"
import { createFileRoute } from "@tanstack/react-router"
import { eq } from "drizzle-orm"
import { z } from "zod"

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

class ReservationError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
  }
}

export const Route = createFileRoute("/api/tickets/purchase/reserve")({
  server: {
    handlers: {
      OPTIONS: () => corsPreflightResponse(),

      POST: optionalAuthHandler(async ({ request, user }) => {
        if (!PAYHERE_MERCHANT_ID) {
          return apiError("Payment gateway configuration is missing", 500)
        }

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

          const now = new Date()
          const expireAt = new Date(now.getTime() + 15 * 60 * 1000)
          const lineItems = mergeLineItems(items)

          const { session, reservations, totalAmount } = await db.transaction(
            async (tx) => {
              const tickets = await lockTicketsWithAvailability(
                tx,
                lineItems.map((i) => i.ticketId),
                now
              )

              for (const item of lineItems) {
                const t = tickets.get(item.ticketId)

                if (!t) {
                  throw new ReservationError("Ticket not found", 404)
                }

                if ((t.endTime ?? t.startTime) < now) {
                  throw new ReservationError(
                    `Ticket "${t.name}" is no longer available (Event expired)`,
                    400
                  )
                }

                if (item.qty > t.available) {
                  throw new ReservationError(
                    t.available <= 0
                      ? `Ticket "${t.name}" is sold out`
                      : `Only ${t.available} ticket(s) available for "${t.name}"`,
                    409
                  )
                }
              }

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

              for (const item of lineItems) {
                const t = tickets.get(item.ticketId)!

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
                    id: t.id,
                    name: t.name,
                    price: String(t.price),
                  },
                })

                totalAmount += Number.parseFloat(String(t.price)) * item.qty
              }

              return { session: s, reservations, totalAmount }
            }
          )

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
                sandbox: PAYHERE_SANDBOX,
                merchantId: PAYHERE_MERCHANT_ID,
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
          if (error instanceof ReservationError) {
            return apiError(error.message, error.status)
          }
          if (error instanceof CustomerIdentityConflictError) {
            return apiError(error.message, 409)
          }
          throw error
        }
      }),
    },
  },
})
