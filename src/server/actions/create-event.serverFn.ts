import { eventFormSchema } from "@/components/event-schedule-form/schema"
import { db } from "@/database"
import {
  event,
  eventDate as eventDateTable,
  location as locationTable,
  ticket as ticketTable,
  timeSlot as timeSlotTable,
} from "@/database/schema"
import { EventType } from "@/enums/event-type.enum"
import { ScheduleType } from "@/enums/schedule-type.enum"
import { uploadImage } from "@/integrations/cloudflare-r2/image"
import { adminFnMiddleware } from "@/integrations/better-auth/auth-middleware"
import { eventDateTime, toEventDateKey } from "@/lib/event-time"
import { createServerFn } from "@tanstack/react-start"

export const createEventAction = createServerFn({ method: "POST" })
  .middleware([adminFnMiddleware])
  .inputValidator((formData: FormData) => {
    const payloadStr = formData.get("payload")
    if (typeof payloadStr !== "string") {
      throw new Error("Missing payload")
    }

    const parsed = JSON.parse(payloadStr)
    const imageFile = formData.get("image")

    if (imageFile instanceof File && imageFile.size > 0) {
      parsed.image = [imageFile]
    } else {
      parsed.image = []
    }

    return eventFormSchema.parse(parsed)
  })
  .handler(async ({ data }) => {
    const imageFile = data.image[0] as File

    let imageUrl = ""
    if (imageFile && imageFile.size > 0) {
      const result = await uploadImage(imageFile, "events", {
        format: "webp",
        quality: 85,
        width: 1200,
      })
      imageUrl = result.url
    } else {
      throw new Error("Event image is required")
    }

    const eventId = await db.transaction(async (tx) => {
      const [eventResult] = await tx
        .insert(event)
        .values({
          name: data.name,
          image: imageUrl,
          eventType: data.eventType as EventType,
          scheduleType: data.scheduleType as ScheduleType,
          languages: data.languages ? data.languages : null,
          description: data.description ? data.description : null,
        })
        .returning({ id: event.id })

      if (data.venue) {
        await tx.insert(locationTable).values({
          eventId: eventResult.id,
          venue: data.venue,
          address: data.address ? data.address : null,
          latitude: data.lat ? data.lat.toString() : null,
          longitude: data.lng ? data.lng.toString() : null,
        })
      }

      for (const ed of data.eventDates) {
        if (!ed.date) continue

        const dateKey = toEventDateKey(ed.date)

        const [eventDateResult] = await tx
          .insert(eventDateTable)
          .values({
            eventId: eventResult.id,
            date: eventDateTime(dateKey),
          })
          .returning({ id: eventDateTable.id })

        for (const ts of ed.timeSlots) {
          if (!ts.startTime) continue

          const [timeSlotResult] = await tx
            .insert(timeSlotTable)
            .values({
              eventDateId: eventDateResult.id,
              startTime: eventDateTime(dateKey, ts.startTime),
              endTime: ts.endTime ? eventDateTime(dateKey, ts.endTime) : null,
            })
            .returning({ id: timeSlotTable.id })

          for (const tick of ts.tickets) {
            if (!tick.name || !tick.price || !tick.qty) continue

            await tx.insert(ticketTable).values({
              timeSlotId: timeSlotResult.id,
              name: tick.name,
              price: tick.price.toString(),
              qty: parseInt(tick.qty.toString(), 10),
            })
          }
        }
      }

      return eventResult.id
    })

    return { success: true, eventId }
  })
