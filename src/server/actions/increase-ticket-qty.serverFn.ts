import { db } from "@/database"
import { ticket } from "@/database/schema"
import { adminFnMiddleware } from "@/integrations/better-auth/auth-middleware"
import { assertTicketEditable } from "@/server/event-guard"
import { createServerFn } from "@tanstack/react-start"
import { eq, sql } from "drizzle-orm"
import { z } from "zod"

export const increaseTicketQtyAction = createServerFn({ method: "POST" })
  .middleware([adminFnMiddleware])
  .inputValidator(
    z.object({
      id: z.string(),
      addQty: z.number().int().min(1, "Quantity must be at least 1"),
    })
  )
  .handler(async ({ data }) => {
    await assertTicketEditable(data.id)

    const updated = await db
      .update(ticket)
      .set({ qty: sql`${ticket.qty} + ${data.addQty}` })
      .where(eq(ticket.id, data.id))
      .returning({ id: ticket.id })

    if (updated.length === 0) {
      throw new Error("Ticket not found")
    }

    return { success: true }
  })
