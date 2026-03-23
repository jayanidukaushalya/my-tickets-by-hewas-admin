import { EventType } from "@/enums/event-type.enum"
import { ScheduleType } from "@/enums/schedule-type.enum"
import { relations } from "drizzle-orm"
import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { ulid } from "ulid"
import { eventDate } from "./event-date.schema"
import { location } from "./location.schema"

export const eventTypeEnum = pgEnum("event_type", EventType)
export const scheduleTypeEnum = pgEnum("schedule_type", ScheduleType)

export const event = pgTable("event", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => ulid()),
  name: text("name").notNull(),
  image: text("image").notNull(),
  eventType: eventTypeEnum("event_type").notNull(),
  scheduleType: scheduleTypeEnum("schedule_type").notNull(),
  languages: text("languages"), // english, sinhala, tamil, hindi, other
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const eventRelations = relations(event, ({ many, one }) => ({
  location: one(location),
  eventDates: many(eventDate),
}))
