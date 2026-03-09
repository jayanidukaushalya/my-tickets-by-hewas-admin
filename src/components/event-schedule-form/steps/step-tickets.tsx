import { useFormContext } from "react-hook-form"
import { DateTicketsBlock } from "../date-tickets-block"
import type { EventFormValues } from "../schema"

export function StepTickets() {
  const { watch } = useFormContext<EventFormValues>()
  const eventDates = watch("eventDates")

  return (
    <div className="animate-in space-y-6 duration-500 fade-in slide-in-from-right-4">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">
          Ticket Configuration
        </h2>
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase opacity-60">
          Set up ticket types and pricing for each time slot
        </p>
      </div>

      <div className="space-y-5">
        {eventDates.map((_, dateIndex) => (
          <DateTicketsBlock key={dateIndex} dateIndex={dateIndex} />
        ))}
      </div>
    </div>
  )
}
