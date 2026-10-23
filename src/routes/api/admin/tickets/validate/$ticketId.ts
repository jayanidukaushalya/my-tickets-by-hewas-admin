import { db } from "@/database"
import { orderLine } from "@/database/schema"
import { formatInEventTime } from "@/lib/event-time"
import {
  apiError,
  apiValidationError,
  corsPreflightResponse,
} from "@/server/api"
import { CORS_HEADERS } from "@/server/api/cors"
import { adminHandler } from "@/server/api/handler"
import { createFileRoute } from "@tanstack/react-router"
import { and, eq } from "drizzle-orm"
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

      GET: adminHandler(async ({ params, request }) => {
        const parsedParams = validateParamsSchema.safeParse(params)
        if (!parsedParams.success) {
          return apiValidationError(parsedParams.error)
        }

        const { ticketId } = parsedParams.data
        const expectedEventId =
          new URL(request.url).searchParams.get("eventId") || null
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

        const event = line.ticket.timeSlot.eventDate.event
        if (expectedEventId && event.id !== expectedEventId) {
          return apiError(
            `This ticket is for a different event: ${event.name}`,
            409
          )
        }

        const loc = event.location
        const venueLabel = loc
          ? buildVenueLabel({ venue: loc.venue, address: loc.address })
          : ""

        const endDate =
          line.ticket.timeSlot.endTime ?? line.ticket.timeSlot.startTime
        const expired = endDate < now

        let status = line.isActivated ? "used" : expired ? "expired" : "valid"

        if (status === "valid") {
          const activated = await db
            .update(orderLine)
            .set({ isActivated: true })
            .where(
              and(eq(orderLine.id, ticketId), eq(orderLine.isActivated, false))
            )
            .returning({ id: orderLine.id })
          if (activated.length === 0) {
            status = "used"
          }
        }

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
            status,
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
