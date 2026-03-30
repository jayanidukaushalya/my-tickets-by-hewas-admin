import { relations } from "drizzle-orm"
import { integer, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { ulid } from "ulid"
import { orderSessionLine } from "./order-session.schema"
import { orderLine } from "./order.schema"
import { timeSlot } from "./time-slot.schema"

export const ticket = pgTable("ticket", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => ulid()),
  timeSlotId: text("time_slot_id")
    .notNull()
    .references(() => timeSlot.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  qty: integer("qty").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const ticketRelations = relations(ticket, ({ one, many }) => ({
  timeSlot: one(timeSlot, {
    fields: [ticket.timeSlotId],
    references: [timeSlot.id],
  }),
  orderLines: many(orderLine),
  orderSessionLines: many(orderSessionLine),
}))
