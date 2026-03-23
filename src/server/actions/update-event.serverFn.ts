import { db } from "@/database"
import { event, location as locationTable } from "@/database/schema"
import { uploadImage } from "@/integrations/cloudflare-r2/image"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod/v3"

const updateEventPartialSchema = z.object({
  eventId: z.string(),
  description: z.string().optional(),
  venue: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  languages: z.string().optional().nullable(),
})

export const updateEventAction = createServerFn({ method: "POST" })
  .inputValidator((formData: FormData) => {
    const payloadStr = formData.get("payload")
    if (typeof payloadStr !== "string") {
      throw new Error("Missing payload")
    }

    const parsed = JSON.parse(payloadStr)
    const imageFile = formData.get("image")

    const validated = updateEventPartialSchema.parse(parsed)

    return {
      ...validated,
      imageFile:
        imageFile instanceof File && imageFile.size > 0 ? imageFile : null,
    }
  })
  .handler(async ({ data }) => {
    let imageUrl: string | undefined

    if (data.imageFile) {
      const result = await uploadImage(data.imageFile, "events", {
        format: "webp",
        quality: 85,
        width: 1200,
      })
      imageUrl = result.url
    }

    // Update event
    const eventUpdates: any = {}
    if (data.description !== undefined) {
      eventUpdates.description = data.description
    }
    if (data.languages !== undefined) {
      eventUpdates.languages = data.languages
    }
    if (imageUrl) {
      eventUpdates.image = imageUrl
    }

    if (Object.keys(eventUpdates).length > 0) {
      await db
        .update(event)
        .set(eventUpdates)
        .where(eq(event.id, data.eventId))
    }

    // Update location
    const locationUpdates: any = {}
    if (data.venue !== undefined) locationUpdates.venue = data.venue
    if (data.address !== undefined) locationUpdates.address = data.address
    if (data.lat !== undefined) {
      locationUpdates.latitude = data.lat ? data.lat.toString() : null
    }
    if (data.lng !== undefined) {
      locationUpdates.longitude = data.lng ? data.lng.toString() : null
    }

    if (Object.keys(locationUpdates).length > 0) {
      const existingLoc = await db.query.location.findFirst({
        where: eq(locationTable.eventId, data.eventId),
      })
      if (existingLoc) {
        await db
          .update(locationTable)
          .set(locationUpdates)
          .where(eq(locationTable.id, existingLoc.id))
      } else {
        await db.insert(locationTable).values({
          eventId: data.eventId,
          venue: locationUpdates.venue || "TBD",
          address: locationUpdates.address,
          latitude: locationUpdates.latitude,
          longitude: locationUpdates.longitude,
        })
      }
    }

    return { success: true }
  })
