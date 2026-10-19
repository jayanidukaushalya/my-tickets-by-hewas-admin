import { db } from "@/database"
import { orderLine } from "@/database/schema"
import {
  apiError,
  apiValidationError,
  corsPreflightResponse,
} from "@/server/api"
import { CORS_HEADERS } from "@/server/api/cors"
import { adminHandler } from "@/server/api/handler"
import { createFileRoute } from "@tanstack/react-router"
import { eq } from "drizzle-orm"
import { formatInEventTime } from "@/lib/event-time"
import { z } from "zod"

const validateParamsSchema = z.object({
  ticketId: z.string().min(1),
})

const buildVenueLabel = (loc: {
  venue?: string | null
  address?: string | null
}) => {
  return [loc.venue, loc.address].filter(Boolean).join(", ")
}

export const Route = createFileRoute("/api/admin/tickets/validate/$ticketId")({
  server: {
    handlers: {
      OPTIONS: () => corsPreflightResponse(),

      /**
       * Admin scanning + ticket status lookup.
       *
       * - Protected by Better Auth bearer token.
       * - If the ticket is currently `valid`, it marks it `used`
       *   (`order_line.is_activated = true`) so lists/labels can update.
       */
      GET: adminHandler(async ({ params }) => {
        const parsedParams = validateParamsSchema.safeParse(params)
        if (!parsedParams.success) {
          return apiValidationError(parsedParams.error)
        }

        const { ticketId } = parsedParams.data
        const now = new Date()

        const line = await db.query.orderLine.findFirst({
          where: eq(orderLine.id, ticketId),
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
        })

        if (!line) {
          return apiError("Ticket not found", 404)
        }

        const loc = line.ticket.timeSlot.eventDate.event.location
        const venueLabel = loc
          ? buildVenueLabel({ venue: loc.venue, address: loc.address })
          : ""

        const endDate =
          line.ticket.timeSlot.endTime ?? line.ticket.timeSlot.startTime
        const expired = endDate < now

        const statusBefore = line.isActivated
          ? "used"
          : expired
            ? "expired"
            : "valid"

        // Activate after determining the label we want to return.
        if (statusBefore === "valid") {
          await db
            .update(orderLine)
            .set({ isActivated: true })
            .where(eq(orderLine.id, ticketId))
        }

        const event = line.ticket.timeSlot.eventDate.event
        const eventDateLabel = venueLabel
          ? `${formatInEventTime(line.ticket.timeSlot.startTime, "EEE, dd MMM | hh:mm a")} | ${venueLabel}`
          : formatInEventTime(
              line.ticket.timeSlot.startTime,
              "EEE, dd MMM | hh:mm a"
            )

        const purchaseDate = formatInEventTime(line.createdAt, "dd MMM yyyy")

        return new Response(
          JSON.stringify({
            id: line.id,
            eventId: event.id,
            eventTitle: event.name,
            eventDate: eventDateLabel,
            eventImageUrl: event.image,
            userId: line.order.customerId,
            ticketName: line.ticket.name,
            purchaseDate,
            qrCode: null,
            status: statusBefore,
            price: Number(line.price),
            qty: line.qty,
            eventLocation: venueLabel,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              ...CORS_HEADERS,
            },
          }
        )
      }),
    },
  },
})
