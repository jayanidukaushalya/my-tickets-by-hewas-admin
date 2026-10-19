import { db } from "@/database"
import { orderLine, ticket } from "@/database/schema"
import { adminFnMiddleware } from "@/integrations/better-auth/auth-middleware"
import { createServerFn } from "@tanstack/react-start"
import { eq, sql } from "drizzle-orm"
import { z } from "zod"

export const saveTicketAction = createServerFn({ method: "POST" })
  .middleware([adminFnMiddleware])
  .inputValidator(
    z.object({
      id: z.string().optional(),
      timeSlotId: z.string(),
      name: z.string().min(1, "Name is required"),
      price: z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/, "Price must be a positive amount"),
      qty: z.number().int().min(1, "Quantity must be at least 1"),
    })
  )
  .handler(async ({ data }) => {
    if (data.id) {
      const [{ sold }] = await db
        .select({
          sold: sql<number>`coalesce(sum(${orderLine.qty}), 0)::int`,
        })
        .from(orderLine)
        .where(eq(orderLine.ticketId, data.id))

      if (data.qty < sold) {
        throw new Error(
          `Quantity cannot be lower than the ${sold} ticket(s) already sold`
        )
      }

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
