CREATE INDEX "event_date_event_id_idx" ON "event_date" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_created_at_idx" ON "event" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "location_event_id_idx" ON "location" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "time_slot_event_date_id_idx" ON "time_slot" USING btree ("event_date_id");--> statement-breakpoint
CREATE INDEX "ticket_time_slot_id_idx" ON "ticket" USING btree ("time_slot_id");--> statement-breakpoint
CREATE INDEX "orders_customer_id_idx" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "order_line_order_id_idx" ON "order_line" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_line_ticket_id_idx" ON "order_line" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "order_line_created_at_idx" ON "order_line" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "order_session_customer_id_idx" ON "order_session" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "order_session_line_order_session_id_idx" ON "order_session_line" USING btree ("order_session_id");--> statement-breakpoint
CREATE INDEX "order_session_line_ticket_id_idx" ON "order_session_line" USING btree ("ticket_id");