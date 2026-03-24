import { relations } from "drizzle-orm"
import { integer, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { ulid } from "ulid"
import { purchaseSession } from "./purchase-session.schema"
import { purchase } from "./purchase.schema"
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
  purchases: many(purchase),
  purchaseSessions: many(purchaseSession),
}))
