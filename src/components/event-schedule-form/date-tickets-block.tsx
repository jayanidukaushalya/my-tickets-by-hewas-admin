import { Calendar03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { format } from "date-fns"
import { useFormContext } from "react-hook-form"
import type { EventFormValues } from "./schema"
import { SlotTickets } from "./slot-tickets"

export function DateTicketsBlock({ dateIndex }: { dateIndex: number }) {
  const { watch } = useFormContext<EventFormValues>()
  const dateValue = watch(`eventDates.${dateIndex}.date`)
  const timeSlots = watch(`eventDates.${dateIndex}.timeSlots`) || []

  return (
    <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/20 backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-border/30 bg-muted/20 px-5 py-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <HugeiconsIcon
            icon={Calendar03Icon}
            className="size-4"
            strokeWidth={2}
          />
        </div>
        <span className="text-xs font-bold tracking-wider uppercase opacity-60">
          {dateValue
            ? format(new Date(dateValue), "EEEE, MMMM d, yyyy")
            : `Date ${dateIndex + 1}`}
        </span>
      </div>

      <div className="space-y-4 p-5">
        {timeSlots.map((_, slotIndex) => (
          <SlotTickets
            key={slotIndex}
            dateIndex={dateIndex}
            slotIndex={slotIndex}
          />
        ))}
      </div>
    </div>
  )
}
