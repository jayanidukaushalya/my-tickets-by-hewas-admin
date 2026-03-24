import { relations } from "drizzle-orm"
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { ulid } from "ulid"
import { customer } from "./customer.schema"
import { ticket } from "./ticket.schema"

export const purchaseSession = pgTable("purchase_session", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => ulid()),
  customerId: text("customer_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),
  ticketId: text("ticket_id")
    .notNull()
    .references(() => ticket.id, { onDelete: "cascade" }),
  qty: integer("qty").notNull(),
  expireAt: timestamp("expire_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const purchaseSessionRelations = relations(purchaseSession, ({ one }) => ({
  customer: one(customer, {
    fields: [purchaseSession.customerId],
    references: [customer.id],
  }),
  ticket: one(ticket, {
    fields: [purchaseSession.ticketId],
    references: [ticket.id],
  }),
}))
