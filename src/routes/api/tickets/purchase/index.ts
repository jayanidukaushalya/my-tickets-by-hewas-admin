import { db } from "@/database"
import { customer, order } from "@/database/schema"
import { apiSuccess, corsPreflightResponse, privateHandler } from "@/server/api"
import { createFileRoute } from "@tanstack/react-router"
import { desc, eq } from "drizzle-orm"
import { format } from "date-fns"

export const Route = createFileRoute("/api/tickets/purchase/")({
  server: {
    handlers: {
      OPTIONS: () => corsPreflightResponse(),

      GET: privateHandler(async ({ user }) => {
        const currentCustomer = await db.query.customer.findFirst({
          where: eq(customer.firebaseUid, user.uid),
        })

        if (!currentCustomer) {
          return apiSuccess({
            results: [],
            total: 0,
          })
        }

        const orders = await db.query.order.findMany({
          where: eq(order.customerId, currentCustomer.id),
          orderBy: [desc(order.createdAt)],
          with: {
            orderLines: {
              with: {
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
            },
          },
        })

        const now = new Date()

        const formattedTickets = orders.flatMap((o) =>
          o.orderLines.map((p) => {
            const event = p.ticket.timeSlot.eventDate.event
            const timeSlot = p.ticket.timeSlot

            const venueLabel = [event.location?.venue, event.location?.address]
              .filter(Boolean)
              .join(", ")

            const endDate = timeSlot.endTime ?? timeSlot.startTime
            const status = p.isActivated
              ? "used"
              : endDate < now
                ? "expired"
                : "valid"

            return {
              id: p.id,
              eventId: event.id,
              eventTitle: event.name,
              eventDate: venueLabel
                ? `${format(timeSlot.startTime, "EEE, dd MMM | hh:mm a")} | ${venueLabel}`
                : format(timeSlot.startTime, "EEE, dd MMM | hh:mm a"),
              eventImageUrl: event.image,
              eventLocation: venueLabel,
              userId: currentCustomer.firebaseUid,
              ticketName: p.ticket.name,
              purchaseDate: format(p.createdAt, "dd MMM yyyy"),
              qrCode: null,
              status,
              qty: p.qty,
              price: Number(p.price),
            }
          })
        )

        return apiSuccess({
          results: formattedTickets,
          total: formattedTickets.length,
        })
      }),
    },
  },
})
