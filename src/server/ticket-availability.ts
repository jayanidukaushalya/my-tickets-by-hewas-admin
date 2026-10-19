import { db } from "@/database"
import {
  orderLine,
  orderSession,
  orderSessionLine,
  ticket,
  timeSlot,
} from "@/database/schema"
import { and, eq, gt, inArray, sql } from "drizzle-orm"

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

export type LockedTicket = {
  id: string
  name: string
  qty: number
  price: string
  startTime: Date
  endTime: Date | null
  available: number
}

export async function lockTicketsWithAvailability(
  tx: Transaction,
  ticketIds: Array<string>,
  now = new Date()
): Promise<Map<string, LockedTicket>> {
  if (ticketIds.length === 0) return new Map()

  const rows = await tx
    .select({
      id: ticket.id,
      name: ticket.name,
      qty: ticket.qty,
      price: ticket.price,
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
    })
    .from(ticket)
    .innerJoin(timeSlot, eq(timeSlot.id, ticket.timeSlotId))
    .where(inArray(ticket.id, ticketIds))
    .orderBy(ticket.id)
    .for("update", { of: ticket })

  const [soldRows, reservedRows] = await Promise.all([
    tx
      .select({
        ticketId: orderLine.ticketId,
        qty: sql<number>`coalesce(sum(${orderLine.qty}), 0)::int`,
      })
      .from(orderLine)
      .where(inArray(orderLine.ticketId, ticketIds))
      .groupBy(orderLine.ticketId),
    tx
      .select({
        ticketId: orderSessionLine.ticketId,
        qty: sql<number>`coalesce(sum(${orderSessionLine.qty}), 0)::int`,
      })
      .from(orderSessionLine)
      .innerJoin(
        orderSession,
        eq(orderSession.id, orderSessionLine.orderSessionId)
      )
      .where(
        and(
          inArray(orderSessionLine.ticketId, ticketIds),
          gt(orderSession.expireAt, now)
        )
      )
      .groupBy(orderSessionLine.ticketId),
  ])

  const sold = new Map(soldRows.map((r) => [r.ticketId, r.qty]))
  const reserved = new Map(reservedRows.map((r) => [r.ticketId, r.qty]))

  return new Map(
    rows.map((r) => [
      r.id,
      {
        ...r,
        available: r.qty - (sold.get(r.id) ?? 0) - (reserved.get(r.id) ?? 0),
      },
    ])
  )
}

export function mergeLineItems(
  items: Array<{ ticketId: string; qty: number }>
): Array<{ ticketId: string; qty: number }> {
  const byTicket = new Map<string, number>()
  for (const item of items) {
    byTicket.set(item.ticketId, (byTicket.get(item.ticketId) ?? 0) + item.qty)
  }
  return [...byTicket].map(([ticketId, qty]) => ({ ticketId, qty }))
}
