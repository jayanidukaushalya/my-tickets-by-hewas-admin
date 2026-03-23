import { db } from "@/database"
import { event } from "@/database/schema"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"

export const getEventFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ eventId: z.string() }))
  .handler(async ({ data }) => {
    const eventResult = await db.query.event.findFirst({
      where: eq(event.id, data.eventId),
      with: {
        eventDates: {
          with: {
            timeSlots: {
              with: {
                tickets: true,
              },
            },
          },
        },
        location: true,
      },
    })

    if (!eventResult) {
      throw new Error("Event not found")
    }

    return eventResult
  })
