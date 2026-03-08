import { relations } from "drizzle-orm"
import { boolean, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { eventDate } from "./event-date.schema"
import { location } from "./location.schema"
import { EventType } from "@/enums/event-type.enum"
import { ScheduleType } from "@/enums/schedule-type.enum"

export const eventTypeEnum = pgEnum("event_type", EventType)
export const scheduleTypeEnum = pgEnum("schedule_type", ScheduleType)

export const event = pgTable("event", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  image: text("image").notNull(),
  eventType: eventTypeEnum("event_type").notNull(),
  scheduleType: scheduleTypeEnum("schedule_type").notNull(),
  languages: text("languages"), // english, sinhala, tamil, hindi, other
  description: text("description"),
  parentId: text("parent_id"), // for recursive events/sub-events
  isSubEvent: boolean("is_sub_event").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const eventRelations = relations(event, ({ one, many }) => ({
  parent: one(event, {
    fields: [event.parentId],
    references: [event.id],
    relationName: "subEvents",
  }),
  subEvents: many(event, { relationName: "subEvents" }),
  locations: many(location),
  eventDates: many(eventDate),
}))
