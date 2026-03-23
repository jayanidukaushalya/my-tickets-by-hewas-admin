import { db } from "@/database"
import { ticket } from "@/database/schema"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"

export const increaseTicketQtyAction = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
      addQty: z.number().int().min(1, "Quantity must be at least 1"),
    })
  )
  .handler(async ({ data }) => {
    const existingTicket = await db.query.ticket.findFirst({
      where: eq(ticket.id, data.id),
      columns: { qty: true },
    })

    if (!existingTicket) {
      throw new Error("Ticket not found")
    }

    await db
      .update(ticket)
      .set({ qty: existingTicket.qty + data.addQty })
      .where(eq(ticket.id, data.id))

    return { success: true }
  })
