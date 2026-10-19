import { db } from "@/database"
import { orderLine } from "@/database/schema"
import { inArray, sql } from "drizzle-orm"

type EventWithTickets = {
  eventDates: Array<{
    timeSlots: Array<{
      tickets: Array<{ id: string }>
    }>
  }>
}

type WithSoldQty<T extends EventWithTickets> = Omit<T, "eventDates"> & {
  eventDates: Array<
    Omit<T["eventDates"][number], "timeSlots"> & {
      timeSlots: Array<
        Omit<T["eventDates"][number]["timeSlots"][number], "tickets"> & {
          tickets: Array<
            T["eventDates"][number]["timeSlots"][number]["tickets"][number] & {
              soldQty: number
              usedQty: number
            }
          >
        }
      >
    }
  >
}

export async function attachSoldQty<T extends EventWithTickets>(
  events: Array<T>
): Promise<Array<WithSoldQty<T>>> {
  const ticketIds = events.flatMap((e) =>
    e.eventDates.flatMap((d) =>
      d.timeSlots.flatMap((s) => s.tickets.map((t) => t.id))
    )
  )

  const soldByTicket = new Map<string, number>()
  const usedByTicket = new Map<string, number>()
  if (ticketIds.length > 0) {
    const rows = await db
      .select({
        ticketId: orderLine.ticketId,
        soldQty: sql<number>`coalesce(sum(${orderLine.qty}), 0)::int`,
        usedQty: sql<number>`coalesce(sum(${orderLine.qty}) filter (where ${orderLine.isActivated}), 0)::int`,
      })
      .from(orderLine)
      .where(inArray(orderLine.ticketId, ticketIds))
      .groupBy(orderLine.ticketId)

    for (const row of rows) {
      soldByTicket.set(row.ticketId, row.soldQty)
      usedByTicket.set(row.ticketId, row.usedQty)
    }
  }

  return events.map((e) => ({
    ...e,
    eventDates: e.eventDates.map((d) => ({
      ...d,
      timeSlots: d.timeSlots.map((s) => ({
        ...s,
        tickets: s.tickets.map((t) => ({
          ...t,
          soldQty: soldByTicket.get(t.id) ?? 0,
          usedQty: usedByTicket.get(t.id) ?? 0,
        })),
      })),
    })),
  })) as Array<WithSoldQty<T>>
}
