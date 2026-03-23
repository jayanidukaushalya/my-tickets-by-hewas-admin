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

export const purchase = pgTable("purchase", {
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
  price: numeric("price", { precision: 10, scale: 2 }).notNull(), // effective price at time of purchase
  isActivated: boolean("is_activated").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const purchaseRelations = relations(purchase, ({ one }) => ({
  customer: one(customer, {
    fields: [purchase.customerId],
    references: [customer.id],
  }),
  ticket: one(ticket, {
    fields: [purchase.ticketId],
    references: [ticket.id],
  }),
}))
