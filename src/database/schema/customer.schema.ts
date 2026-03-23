import { relations } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { ulid } from "ulid"
import { purchase } from "./purchase.schema"

export const customer = pgTable("customer", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => ulid()),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email").notNull().unique(),
  firebaseUid: text("firebase_uid").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const customerRelations = relations(customer, ({ many }) => ({
  purchases: many(purchase),
}))
