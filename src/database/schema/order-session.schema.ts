import { relations } from "drizzle-orm"
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { ulid } from "ulid"
import { customer } from "./customer.schema"
import { ticket } from "./ticket.schema"

/**
 * One row per checkout / reservation attempt (expires together).
 */
export const orderSession = pgTable("order_session", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => ulid()),
  customerId: text("customer_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),
  expireAt: timestamp("expire_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

/**
 * Line items for an unpaid reservation (mirrors cart lines).
 */
export const orderSessionLine = pgTable("order_session_line", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => ulid()),
  orderSessionId: text("order_session_id")
    .notNull()
    .references(() => orderSession.id, { onDelete: "cascade" }),
  ticketId: text("ticket_id")
    .notNull()
    .references(() => ticket.id),
  qty: integer("qty").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const orderSessionRelations = relations(orderSession, ({ one, many }) => ({
  customer: one(customer, {
    fields: [orderSession.customerId],
    references: [customer.id],
  }),
  orderSessionLines: many(orderSessionLine),
}))

export const orderSessionLineRelations = relations(orderSessionLine, ({ one }) => ({
  orderSession: one(orderSession, {
    fields: [orderSessionLine.orderSessionId],
    references: [orderSession.id],
  }),
  ticket: one(ticket, {
    fields: [orderSessionLine.ticketId],
    references: [ticket.id],
  }),
}))
