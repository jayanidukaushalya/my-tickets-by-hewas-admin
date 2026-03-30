import { relations } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { ulid } from "ulid"
import { orderSession } from "./order-session.schema"
import { order } from "./order.schema"

export const customer = pgTable("customer", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => ulid()),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  email: text("email").notNull().unique(),
  firebaseUid: text("firebase_uid").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const customerRelations = relations(customer, ({ many }) => ({
  orderSessions: many(orderSession),
  orders: many(order),
}))
