import { relations } from "drizzle-orm"
import {
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"
import { ulid } from "ulid"
import { customer } from "./customer.schema"
import { ticket } from "./ticket.schema"

/**
 * Paid order header (one payment / checkout completion).
 * Table name `orders` avoids SQL reserved word `order`.
 */
export const order = pgTable("orders", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => ulid()),
  customerId: text("customer_id")
    .notNull()
    .references(() => customer.id),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("LKR"),
  payhereOrderId: text("payhere_order_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

/**
 * Paid line items (ticket type + qty + unit price snapshot).
 */
export const orderLine = pgTable("order_line", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => ulid()),
  orderId: text("order_id")
    .notNull()
    .references(() => order.id, { onDelete: "cascade" }),
  ticketId: text("ticket_id")
    .notNull()
    .references(() => ticket.id),
  qty: integer("qty").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  isActivated: boolean("is_activated").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const orderRelations = relations(order, ({ one, many }) => ({
  customer: one(customer, {
    fields: [order.customerId],
    references: [customer.id],
  }),
  orderLines: many(orderLine),
}))

export const orderLineRelations = relations(orderLine, ({ one }) => ({
  order: one(order, {
    fields: [orderLine.orderId],
    references: [order.id],
  }),
  ticket: one(ticket, {
    fields: [orderLine.ticketId],
    references: [ticket.id],
  }),
}))
