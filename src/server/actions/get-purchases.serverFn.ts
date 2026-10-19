import { db } from "@/database"
import {
  customer,
  event,
  eventDate,
  order,
  orderLine,
  ticket,
  timeSlot,
} from "@/database/schema"
import { adminFnMiddleware } from "@/integrations/better-auth/auth-middleware"
import { eventDateTime, toEventDateKey } from "@/lib/event-time"
import { createServerFn } from "@tanstack/react-start"
import { and, count, desc, eq, exists, gte, ilike, lte, or } from "drizzle-orm"
import { z } from "zod"

export const getPurchasesValidator = z.object({
  page: z.number().positive().optional().default(1),
  limit: z.number().positive().optional().default(10),
  search: z.string().optional().nullable(),
  dateFrom: z.string().optional().nullable(),
  dateTo: z.string().optional().nullable(),
  isActivated: z.boolean().optional().nullable(),
})

export const getPurchasesFn = createServerFn({ method: "GET" })
  .middleware([adminFnMiddleware])
  .inputValidator(getPurchasesValidator)
  .handler(async ({ data }) => {
    const conditions = []

    if (data?.search) {
      const searchPattern = `%${data.search}%`
      conditions.push(
        or(
          exists(
            db
              .select({ id: event.id })
              .from(event)
              .innerJoin(eventDate, eq(event.id, eventDate.eventId))
              .innerJoin(timeSlot, eq(eventDate.id, timeSlot.eventDateId))
              .innerJoin(ticket, eq(timeSlot.id, ticket.timeSlotId))
              .where(
                and(
                  eq(ticket.id, orderLine.ticketId),
                  ilike(event.name, searchPattern)
                )
              )
          ),
          exists(
            db
              .select({ id: customer.id })
              .from(customer)
              .innerJoin(order, eq(customer.id, order.customerId))
              .where(
                and(
                  eq(order.id, orderLine.orderId),
                  or(
                    ilike(customer.email, searchPattern),
                    ilike(customer.firstName, searchPattern),
                    ilike(customer.lastName, searchPattern)
                  )
                )
              )
          ),
          ilike(orderLine.id, searchPattern)
        )
      )
    }

    if (data?.dateFrom) {
      conditions.push(
        gte(orderLine.createdAt, eventDateTime(toEventDateKey(data.dateFrom)))
      )
    }

    if (data?.dateTo) {
      const toDate = eventDateTime(toEventDateKey(data.dateTo), "23:59:59.999")
      conditions.push(lte(orderLine.createdAt, toDate))
    }

    if (data?.isActivated !== undefined && data?.isActivated !== null) {
      conditions.push(eq(orderLine.isActivated, data.isActivated))
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined
    const limit = data?.limit || 10
    const offset = data?.page ? (data.page - 1) * limit : 0

    const [results, [{ value: total }]] = await Promise.all([
      db.query.orderLine.findMany({
        where,
        orderBy: [desc(orderLine.createdAt)],
        limit,
        offset,
        with: {
          order: {
            with: {
              customer: true,
            },
          },
          ticket: {
            with: {
              timeSlot: {
                with: {
                  eventDate: {
                    with: {
                      event: {
                        with: {
                          location: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      db.select({ value: count() }).from(orderLine).where(where),
    ])

    return {
      results,
      total,
    }
  })
