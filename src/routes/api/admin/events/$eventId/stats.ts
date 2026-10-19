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

      /**
       * Returns ticket-sale and scan statistics for a single event.
       *
       * Response shape:
       * ```json
       * {
       *   "totalSold": 120,
       *   "totalScanned": 47
       * }
       * ```
       */
      GET: adminHandler(async ({ params }) => {
        const parsed = paramsSchema.safeParse(params)
        if (!parsed.success) {
          return apiValidationError(parsed.error)
        }

        const { eventId } = parsed.data

        // Verify the event exists first so we can return a proper 404.
        const eventExists = await db.query.eventDate.findFirst({
          where: eq(eventDate.eventId, eventId),
        })

        if (!eventExists) {
          return apiError("Event not found", 404)
        }

        /**
         * COUNT(*) for order_line rows joined up to the event.
         * The join path is:  order_line → ticket → time_slot → event_date → event
         */
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
