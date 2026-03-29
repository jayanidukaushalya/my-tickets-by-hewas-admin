import { db } from "@/database"
import { event, eventDate } from "@/database/schema"
import { EventType } from "@/enums/event-type.enum"
import { ScheduleType } from "@/enums/schedule-type.enum"
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

export const getEventsFn = createServerFn({ method: "GET" })
  .inputValidator(getEventsValidator)
  .handler(async ({ data }) => {
    const conditions = []

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
        dateConditions.push(gte(eventDate.date, new Date(data.dateFrom)))
      }
      if (data?.dateTo) {
        const toDate = new Date(data.dateTo)
        toDate.setHours(23, 59, 59, 999)
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

    let orderByClause: any[] = [desc(event.createdAt)]
    if (data?.field && data?.order) {
      const orderFn = data.order === "desc" ? desc : asc
      switch (data.field) {
        case "name":
          orderByClause = [orderFn(event.name)]
          break
        case "createdAt":
        default:
          orderByClause = [orderFn(event.createdAt)]
          break
      }
    }

    const limit = data?.limit || 8
    const offset = data?.page ? (data.page - 1) * limit : 0

    const results = await db.query.event.findMany({
      where,
      orderBy: orderByClause,
      limit,
      offset,
      with: {
        eventDates: {
          with: {
            timeSlots: {
              with: {
                tickets: {
                  with: {
                    purchases: {
                      columns: {
                        qty: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        location: true,
      },
    })

    const [{ count: total }] = await db
      .select({
        count: count(),
      })
      .from(event)
      .where(where)

    return {
      results,
      total,
    }
  })
