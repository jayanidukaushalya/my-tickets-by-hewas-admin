import { relations } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { event } from "./event.schema"
import { timeSlot } from "./time-slot.schema"

export const eventDate = pgTable("event_date", {
  id: text("id").primaryKey(),
  eventId: text("event_id")
    .notNull()
    .references(() => event.id, { onDelete: "cascade" }),
  date: timestamp("event_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const eventDateRelations = relations(eventDate, ({ one, many }) => ({
  event: one(event, {
    fields: [eventDate.eventId],
    references: [event.id],
  }),
  timeSlots: many(timeSlot),
}))
