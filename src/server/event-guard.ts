import { db } from "@/database"
import { event, eventDate, ticket, timeSlot } from "@/database/schema"
import { isEventExpired } from "@/lib/event-status"
import { eq } from "drizzle-orm"

export async function assertEventEditable(eventId: string) {
  const result = await db.query.event.findFirst({
    where: eq(event.id, eventId),
    columns: { id: true },
    with: {
      eventDates: {
        columns: { id: true },
        with: {
          timeSlots: { columns: { startTime: true, endTime: true } },
        },
      },
    },
  })

  if (!result) {
    throw new Error("Event not found")
  }
  if (isEventExpired(result.eventDates)) {
    throw new Error("Expired events can't be changed")
  }
}

export async function assertTimeSlotEditable(timeSlotId: string) {
  const [row] = await db
    .select({ eventId: eventDate.eventId })
    .from(timeSlot)
    .innerJoin(eventDate, eq(eventDate.id, timeSlot.eventDateId))
    .where(eq(timeSlot.id, timeSlotId))

  if (!row) {
    throw new Error("Time slot not found")
  }
  await assertEventEditable(row.eventId)
}

export async function assertTicketEditable(ticketId: string) {
  const [row] = await db
    .select({ timeSlotId: ticket.timeSlotId })
    .from(ticket)
    .where(eq(ticket.id, ticketId))

  if (!row) {
    throw new Error("Ticket not found")
  }
  await assertTimeSlotEditable(row.timeSlotId)
}
