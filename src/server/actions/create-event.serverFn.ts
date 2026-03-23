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
import { createServerFn } from "@tanstack/react-start"

export const createEventAction = createServerFn({ method: "POST" })
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

    // 1. Create Event
    const [eventResult] = await db
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

    // 2. Create Location
    if (data.venue) {
      await db.insert(locationTable).values({
        eventId: eventResult.id,
        venue: data.venue,
        address: data.address ? data.address : null,
        latitude: data.lat ? data.lat.toString() : null,
        longitude: data.lng ? data.lng.toString() : null,
      })
    }

    // 3. Create Event Dates, Time Slots, and Tickets
    const { eventDates } = data

    for (const ed of eventDates) {
      if (!ed.date) continue

      // Convert date string to Date object
      const [eventDateResult] = await db
        .insert(eventDateTable)
        .values({
          eventId: eventResult.id,
          date: new Date(ed.date),
        })
        .returning({ id: eventDateTable.id })

      for (const ts of ed.timeSlots) {
        if (!ts.startTime) continue

        // Construct full Date objects for startTime and endTime incorporating the ed.date
        const baseDateStr = new Date(ed.date).toISOString().split("T")[0]
        
        const formatTime = (t: string) => t.split(":").length === 2 ? `${t}:00` : t

        const startDatePos = new Date(`${baseDateStr}T${formatTime(ts.startTime)}`)
        let endDatePos = null
        if (ts.endTime) {
          endDatePos = new Date(`${baseDateStr}T${formatTime(ts.endTime)}`)
        }

        const [timeSlotResult] = await db
          .insert(timeSlotTable)
          .values({
            eventDateId: eventDateResult.id,
            startTime: startDatePos,
            endTime: endDatePos,
          })
          .returning({ id: timeSlotTable.id })

        // Insert tickets
        for (const tick of ts.tickets) {
          if (!tick.name || !tick.price || !tick.qty) continue

          await db.insert(ticketTable).values({
            timeSlotId: timeSlotResult.id,
            name: tick.name,
            price: tick.price.toString(),
            qty: parseInt(tick.qty.toString(), 10),
          })
        }
      }
    }

    return { success: true, eventId: eventResult.id }
  })
