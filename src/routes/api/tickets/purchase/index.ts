import { db } from "@/database"
import { customer, purchase } from "@/database/schema"
import { apiSuccess, corsPreflightResponse, privateHandler } from "@/server/api"
import { createFileRoute } from "@tanstack/react-router"
import { desc, eq } from "drizzle-orm"

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

        const purchases = await db.query.purchase.findMany({
          where: eq(purchase.customerId, currentCustomer.id),
          orderBy: [desc(purchase.createdAt)],
          with: {
            ticket: {
              with: {
                timeSlot: {
                  with: {
                    eventDate: {
                      with: {
                        event: true,
                      },
                    },
                  },
                },
              },
            },
          },
        })

        const formattedPurchases = purchases.map((p) => ({
          id: p.id,
          ticketId: p.ticketId,
          qty: p.qty,
          price: p.price,
          isActivated: p.isActivated,
          createdAt: p.createdAt.toISOString(),
          ticket: {
            id: p.ticket.id,
            name: p.ticket.name,
            eventDateId: p.ticket.timeSlot.eventDateId,
          },
          event: {
            id: p.ticket.timeSlot.eventDate.event.id,
            name: p.ticket.timeSlot.eventDate.event.name,
            startDate: p.ticket.timeSlot.eventDate.date.toISOString(),
            endDate: p.ticket.timeSlot.eventDate.date.toISOString(),
          },
        }))

        return apiSuccess({
          results: formattedPurchases,
          total: formattedPurchases.length,
        })
      }),
    },
  },
})
