import { db } from "@/database"
import { customer, purchase } from "@/database/schema"
import {
  apiSuccess,
  corsPreflightResponse,
  privateHandler,
} from "@/server/api"
import { createFileRoute } from "@tanstack/react-router"
import { desc, eq } from "drizzle-orm"

export const Route = createFileRoute("/api/tickets/purchase/")({
  server: {
    handlers: {
      OPTIONS: () => corsPreflightResponse(),

      /**
       * Returns all confirmed purchases for the authenticated user.
       *
       * Each purchase includes the full chain of context the mobile client
       * needs to render a ticket:
       *   purchase -> ticket -> timeSlot -> eventDate -> event
       */
      GET: privateHandler(async ({ user }) => {
        const currentCustomer = await db.query.customer.findFirst({
          where: eq(customer.firebaseUid, user.uid),
        })

        if (!currentCustomer) {
          return apiSuccess([])
        }

        const purchases = await db.query.purchase.findMany({
          where: eq(purchase.customerId, currentCustomer.id),
          orderBy: [desc(purchase.createdAt)],
          with: {
            ticket: {
              columns: {
                id: true,
                name: true,
                price: true,
              },
              with: {
                timeSlot: {
                  columns: {
                    id: true,
                    startTime: true,
                    endTime: true,
                  },
                  with: {
                    eventDate: {
                      columns: {
                        id: true,
                        date: true,
                      },
                      with: {
                        event: {
                          columns: {
                            id: true,
                            name: true,
                            image: true,
                            eventType: true,
                            scheduleType: true,
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

        return apiSuccess(purchases)
      }),
    },
  },
})

