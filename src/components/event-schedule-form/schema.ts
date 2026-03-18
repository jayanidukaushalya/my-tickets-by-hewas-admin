import { ScheduleType } from "@/enums/schedule-type.enum"
import { z } from "zod/v3"

export const ticketSchema = z.object({
  name: z.string().min(1, "Ticket name is required"),
  price: z.string().min(1, "Price is required"),
  qty: z.string().min(1, "Quantity is required"),
})

export const timeSlotSchema = z.object({
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().optional(),
  tickets: z
    .array(ticketSchema)
    .min(1, "At least one ticket type is required")
    .superRefine((tickets, ctx) => {
      const names = new Set<string>()
      tickets.forEach((ticket, idx) => {
        const nameKey = ticket.name.trim().toLowerCase()
        if (names.has(nameKey)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Ticket names must be unique",
            path: [idx, "name"],
          })
        } else if (nameKey) {
          names.add(nameKey)
        }
      })
    }),
})

export const eventDateSchema = z.object({
  date: z.string().min(1, "Date is required"),
  timeSlots: z
    .array(timeSlotSchema)
    .min(1, "At least one time slot is required"),
})

export const eventFormSchema = z
  .object({
    name: z.string().min(1, "Event name is required"),
    image: z.string().min(1, "Event image URL is required").url("Invalid URL"),
    eventType: z.string().min(1, "Event type is required"),
    scheduleType: z.string().min(1, "Schedule type is required"),
    languages: z.string().optional(),
    description: z.string().optional(),
    venue: z.string().min(1, "Venue is required"),
    address: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    eventDates: z
      .array(eventDateSchema)
      .min(1, "At least one event date is required"),
  })
  .superRefine((data, ctx) => {
    if (data.scheduleType === ScheduleType.MULTI_TIME) {
      data.eventDates.forEach((ed, idx) => {
        if (ed.timeSlots.length < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.too_small,
            minimum: 2,
            type: "array",
            inclusive: true,
            path: ["eventDates", idx, "timeSlots"],
            message: "Multi-time events require at least 2 time slots",
          })
        }
      })
    }

    if (data.scheduleType === ScheduleType.MULTI_DAY) {
      if (data.eventDates.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: 2,
          type: "array",
          inclusive: true,
          path: ["eventDates"],
          message: "Multi-day events require at least 2 dates",
        })
      }
      data.eventDates.forEach((ed, idx) => {
        if (ed.timeSlots.length < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.too_small,
            minimum: 2,
            type: "array",
            inclusive: true,
            path: ["eventDates", idx, "timeSlots"],
            message: "Multi-day events require at least 2 time slots per date",
          })
        }
      })
    }
  })

export type TicketValues = z.infer<typeof ticketSchema>
export type TimeSlotValues = z.infer<typeof timeSlotSchema>
export type EventDateValues = z.infer<typeof eventDateSchema>
export type EventFormValues = z.output<typeof eventFormSchema>
