import { getEventFn } from "@/server/actions/get-event.serverFn"
import { Calendar01Icon, Clock01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { format } from "date-fns"

type EventDatesType = NonNullable<
  Awaited<ReturnType<typeof getEventFn>>
>["eventDates"]

export function EventDates({ eventDates }: { eventDates: EventDatesType }) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-xl">
      <h3 className="mb-4 flex items-center gap-2 font-semibold">
        <HugeiconsIcon icon={Calendar01Icon} className="size-5 text-primary" />
        Dates & Times
      </h3>
      <div className="flex flex-col gap-4">
        {eventDates.map((ed) => (
          <div
            key={ed.id}
            className="flex flex-col gap-2 rounded-lg border border-border/20 bg-background/50 p-3"
          >
            <div className="font-medium text-foreground">
              {format(new Date(ed.date), "EEEE, MMMM do, yyyy")}
            </div>
            <div className="flex flex-col gap-1.5 border-l-2 border-primary/20 pl-2">
              {ed.timeSlots.map((ts) => (
                <div
                  key={ts.id}
                  className="flex flex-col gap-1 text-sm text-muted-foreground"
                >
                  <div className="flex items-center gap-1.5">
                    <HugeiconsIcon icon={Clock01Icon} className="size-3.5" />
                    <span>
                      {ts.endTime
                        ? `${format(new Date(ts.startTime), "h:mm a")} — ${format(new Date(ts.endTime), "h:mm a")}`
                        : `${format(new Date(ts.startTime), "h:mm a")} Onwards`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
