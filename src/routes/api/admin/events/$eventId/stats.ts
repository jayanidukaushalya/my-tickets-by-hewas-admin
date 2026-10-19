import { db } from "@/database"
import { eventDate, orderLine, ticket, timeSlot } from "@/database/schema"
import {
  apiError,
  apiSuccess,
  apiValidationError,
  corsPreflightResponse,
} from "@/server/api"
import { adminHandler } from "@/server/api/handler"
import { createFileRoute } from "@tanstack/react-router"
import { and, count, eq } from "drizzle-orm"
import { z } from "zod"

const paramsSchema = z.object({
  eventId: z.string().min(1),
})

export const Route = createFileRoute("/api/admin/events/$eventId/stats")({
  server: {
    handlers: {
      OPTIONS: () => corsPreflightResponse(),

      GET: adminHandler(async ({ params }) => {
        const parsed = paramsSchema.safeParse(params)
        if (!parsed.success) {
          return apiValidationError(parsed.error)
        }

        const { eventId } = parsed.data

        const eventExists = await db.query.eventDate.findFirst({
          where: eq(eventDate.eventId, eventId),
        })

        if (!eventExists) {
          return apiError("Event not found", 404)
        }

        const [totalRow] = await db
          .select({ total: count() })
          .from(orderLine)
          .innerJoin(ticket, eq(orderLine.ticketId, ticket.id))
          .innerJoin(timeSlot, eq(ticket.timeSlotId, timeSlot.id))
          .innerJoin(eventDate, eq(timeSlot.eventDateId, eventDate.id))
          .where(eq(eventDate.eventId, eventId))

        const [scannedRow] = await db
          .select({ total: count() })
          .from(orderLine)
          .innerJoin(ticket, eq(orderLine.ticketId, ticket.id))
          .innerJoin(timeSlot, eq(ticket.timeSlotId, timeSlot.id))
          .innerJoin(eventDate, eq(timeSlot.eventDateId, eventDate.id))
          .where(
            and(eq(eventDate.eventId, eventId), eq(orderLine.isActivated, true))
          )

        return apiSuccess({
          totalSold: totalRow?.total ?? 0,
          totalScanned: scannedRow?.total ?? 0,
        })
      }),
    },
  },
})
