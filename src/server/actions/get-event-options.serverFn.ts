import { db } from "@/database"
import { event, eventDate } from "@/database/schema"
import { adminFnMiddleware } from "@/integrations/better-auth/auth-middleware"
import { formatInEventTime } from "@/lib/event-time"
import { createServerFn } from "@tanstack/react-start"
import { desc, eq, min } from "drizzle-orm"

export const getEventOptionsFn = createServerFn({ method: "GET" })
  .middleware([adminFnMiddleware])
  .handler(async () => {
    const rows = await db
      .select({
        id: event.id,
        name: event.name,
        firstDate: min(eventDate.date),
      })
      .from(event)
      .leftJoin(eventDate, eq(eventDate.eventId, event.id))
      .groupBy(event.id, event.name, event.createdAt)
      .orderBy(desc(event.createdAt))

    return rows.map((row) => ({
      id: row.id,
      label: row.firstDate
        ? `${row.name} · ${formatInEventTime(row.firstDate, "MMM d, yyyy")}`
        : row.name,
    }))
  })
