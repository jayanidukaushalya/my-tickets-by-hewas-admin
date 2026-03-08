import { relations } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { eventDate } from "./event-date.schema"
import { ticket } from "./ticket.schema"

export const timeSlot = pgTable("time_slot", {
  id: text("id").primaryKey(),
  eventDateId: text("event_date_id")
    .notNull()
    .references(() => eventDate.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"), // Optional as seen in some events
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const timeSlotRelations = relations(timeSlot, ({ one, many }) => ({
  eventDate: one(eventDate, {
    fields: [timeSlot.eventDateId],
    references: [eventDate.id],
  }),
  tickets: many(ticket),
}))
