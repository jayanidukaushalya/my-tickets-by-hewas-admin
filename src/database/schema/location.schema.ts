import { relations } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { ulid } from "ulid"
import { event } from "./event.schema"

export const location = pgTable("location", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => ulid()),
  eventId: text("event_id")
    .notNull()
    .references(() => event.id, { onDelete: "cascade" }),
  venue: text("venue").notNull(),
  address: text("address"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const locationRelations = relations(location, ({ one }) => ({
  event: one(event, {
    fields: [location.eventId],
    references: [event.id],
  }),
}))
