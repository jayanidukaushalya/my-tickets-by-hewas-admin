import { Button } from "@/components/ui/button"
import { formatEnum } from "@/lib/utils"
import { getEventsFn } from "@/server/actions/get-events.serverFn"
import {
  Calendar03Icon,
  Location01Icon,
  Ticket01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"
import { format } from "date-fns"

type EventData = NonNullable<
  Awaited<ReturnType<typeof getEventsFn>>["results"]
>[number]

export function EventCard({ event }: { event: EventData }) {
  const mainDate = event.eventDates?.[0]?.date
  const venue = event.location?.venue ?? "TBD"
  const totalQty =
    event.eventDates?.reduce(
      (acc, dt) =>
        acc +
        dt.timeSlots.reduce(
          (accTs, ts) =>
            accTs + ts.tickets.reduce((accT, t) => accT + t.qty, 0),
          0
        ),
      0
    ) || 0

  const totalSold =
    event.eventDates?.reduce(
      (acc, dt) =>
        acc +
        dt.timeSlots.reduce(
          (accTs, ts) =>
            accTs +
            ts.tickets.reduce(
              (accT, t) =>
                accT +
                t.purchases.reduce(
                  (accP, p: { qty: number }) => accP + p.qty,
                  0
                ),
              0
            ),
          0
        ),
      0
    ) || 0

  const isSoldOut = totalQty > 0 && totalSold >= totalQty

  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl border border-border/40 bg-card/40 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-1 hover:bg-card/60 hover:shadow-md">
      <div className="relative aspect-video w-full overflow-hidden bg-muted/30">
        <img
          src={event.image || "https://placehold.co/600x400?text=No+Image"}
          alt={event.name}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 rounded-full bg-background/80 px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase backdrop-blur-md">
          {formatEnum(event.eventType)}
        </div>
        {isSoldOut && (
          <div className="absolute right-3 top-3 rounded-full bg-destructive/90 px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase text-destructive-foreground shadow-sm backdrop-blur-md">
            Sold Out
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between space-y-4 p-5">
        <div className="space-y-1.5">
          <h3
            className="line-clamp-1 text-lg font-bold tracking-tight"
            title={event.name}
          >
            {event.name}
          </h3>
          {event.languages && (
            <p className="text-xs font-medium text-muted-foreground opacity-80">
              {event.languages}
            </p>
          )}
        </div>

        <div className="space-y-2.5 rounded-xl bg-background/30 p-3">
          <div className="flex items-start gap-2 text-sm text-foreground/80">
            <HugeiconsIcon
              icon={Calendar03Icon}
              className="mt-0.5 size-3.5 shrink-0 text-primary/70"
            />
            <span className="line-clamp-1 text-xs font-medium">
              {mainDate
                ? format(new Date(mainDate), "MMM do, yyyy")
                : "No Date"}
              {event.eventDates.length > 1 &&
                ` (+${event.eventDates.length - 1} more)`}
            </span>
          </div>

          <div className="flex items-start gap-2 text-sm text-foreground/80">
            <HugeiconsIcon
              icon={Location01Icon}
              className="mt-0.5 size-3.5 shrink-0 text-primary/70"
            />
            <span className="line-clamp-1 text-xs font-medium">{venue}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-foreground/80">
            <HugeiconsIcon
              icon={Ticket01Icon}
              className="size-3.5 shrink-0 text-primary/70"
            />
            <span className="text-xs font-medium capitalize">
              {formatEnum(event.scheduleType)}
            </span>
          </div>
        </div>

        <Button
          variant="secondary"
          className="w-full font-semibold shadow-none"
          asChild
        >
          <Link to="/events/$eventId" params={{ eventId: event.id }}>
            View Details
          </Link>
        </Button>
      </div>
    </div>
  )
}
