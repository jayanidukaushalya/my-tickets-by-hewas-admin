import { db } from "@/database"
import { event, eventDate, timeSlot } from "@/database/schema"
import { EventType } from "@/enums/event-type.enum"
import { ScheduleType } from "@/enums/schedule-type.enum"
import { adminFnMiddleware } from "@/integrations/better-auth/auth-middleware"
import { attachSoldQty } from "@/server/ticket-sales"
import { eventDateTime, toEventDateKey } from "@/lib/event-time"
import { createServerFn } from "@tanstack/react-start"
import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  gte,
  ilike,
  inArray,
  lte,
  sql,
} from "drizzle-orm"
import { z } from "zod"

export const getEventsValidator = z.object({
  search: z.string().optional().nullable(),
  page: z.number().positive().optional().nullable().default(1),
  limit: z.number().positive().optional().nullable().default(8),
  field: z.string().optional().nullable(),
  order: z.enum(["asc", "desc"]).optional().nullable(),
  eventType: z.array(z.enum(EventType)).optional().nullable(),
  scheduleType: z.enum(ScheduleType).optional().nullable(),
  dateFrom: z.string().optional().nullable(),
  dateTo: z.string().optional().nullable(),
})

export async function findEvents(
  data: z.infer<typeof getEventsValidator>,
  options: { activeOnly?: boolean } = {}
) {
  const conditions = []

  if (options.activeOnly) {
    conditions.push(
      exists(
        db
          .select()
          .from(eventDate)
          .innerJoin(timeSlot, eq(timeSlot.eventDateId, eventDate.id))
          .where(
            and(
              eq(eventDate.eventId, event.id),
              sql`coalesce(${timeSlot.endTime}, ${timeSlot.startTime}) > now()`
            )
          )
      )
    )
  }

  if (data?.search) {
    conditions.push(ilike(event.name, `%${data.search}%`))
  }

  if (data?.eventType && data.eventType.length > 0) {
    conditions.push(inArray(event.eventType, data.eventType))
  }

  if (data?.scheduleType) {
    conditions.push(eq(event.scheduleType, data.scheduleType))
  }

  if (data?.dateFrom || data?.dateTo) {
    const dateConditions = [eq(eventDate.eventId, event.id)]
    if (data?.dateFrom) {
      dateConditions.push(
        gte(eventDate.date, eventDateTime(toEventDateKey(data.dateFrom)))
      )
    }
    if (data?.dateTo) {
      const toDate = eventDateTime(toEventDateKey(data.dateTo), "23:59:59.999")
      dateConditions.push(lte(eventDate.date, toDate))
    }
    conditions.push(
      exists(
        db
          .select()
          .from(eventDate)
          .where(and(...dateConditions))
      )
    )
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const today = eventDateTime(toEventDateKey(new Date().toISOString()))
  const nextDate = sql`(${db
    .select({ value: sql`min(${eventDate.date})` })
    .from(eventDate)
    .where(and(eq(eventDate.eventId, event.id), gte(eventDate.date, today)))})`
  const lastDate = sql`(${db
    .select({ value: sql`max(${eventDate.date})` })
    .from(eventDate)
    .where(eq(eventDate.eventId, event.id))})`

  let orderByClause: any[] = [
    asc(nextDate),
    desc(lastDate),
    desc(event.createdAt),
    desc(event.id),
  ]
  if (data?.field && data.field !== "date" && data?.order) {
    const orderFn = data.order === "desc" ? desc : asc
    switch (data.field) {
      case "name":
        orderByClause = [orderFn(event.name), orderFn(event.id)]
        break
      case "createdAt":
      default:
        orderByClause = [orderFn(event.createdAt), orderFn(event.id)]
        break
    }
  }

  const limit = data?.limit || 8
  const offset = data?.page ? (data.page - 1) * limit : 0

  const [events, [{ count: total }]] = await Promise.all([
    db.query.event.findMany({
      where,
      orderBy: orderByClause,
      limit,
      offset,
      with: {
        eventDates: {
          with: {
            timeSlots: {
              with: {
                tickets: true,
              },
            },
          },
        },
        location: true,
      },
    }),
    db
      .select({
        count: count(),
      })
      .from(event)
      .where(where),
  ])

  const results = await attachSoldQty(events)

  return {
    results,
    total,
  }
}

export const getEventsFn = createServerFn({ method: "GET" })
  .middleware([adminFnMiddleware])
  .inputValidator(getEventsValidator)
  .handler(({ data }) => findEvents(data))
