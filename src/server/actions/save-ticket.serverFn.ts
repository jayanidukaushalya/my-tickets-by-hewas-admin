import { db } from "@/database"
import { ticket } from "@/database/schema"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"

export const saveTicketAction = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    id: z.string().optional(),
    timeSlotId: z.string(),
    name: z.string().min(1, "Name is required"),
    price: z.string(),
    qty: z.number().int().min(1, "Quantity must be at least 1"),
  }))
  .handler(async ({ data }) => {
    if (data.id) {
      await db
        .update(ticket)
        .set({
          name: data.name,
          price: data.price,
          qty: data.qty,
        })
        .where(eq(ticket.id, data.id))
      return { success: true, message: "Ticket updated" }
    } else {
      await db.insert(ticket).values({
        timeSlotId: data.timeSlotId,
        name: data.name,
        price: data.price,
        qty: data.qty,
      })
      return { success: true, message: "Ticket created" }
    }
  })
