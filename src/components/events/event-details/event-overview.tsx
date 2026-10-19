import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { getEventFn } from "@/server/actions/get-event.serverFn"
import { ChartBarLineIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"

type EventType = NonNullable<Awaited<ReturnType<typeof getEventFn>>>

export function EventOverview({ event }: { event: EventType }) {
  const tickets = event.eventDates.flatMap((date) =>
    date.timeSlots.flatMap((slot) => slot.tickets)
  )

  const totalQty = tickets.reduce((sum, t) => sum + t.qty, 0)
  const sold = tickets.reduce((sum, t) => sum + t.soldQty, 0)
  const used = tickets.reduce((sum, t) => sum + t.usedQty, 0)
  const revenue = tickets.reduce(
    (sum, t) => sum + t.soldQty * Number(t.price),
    0
  )

  const stats = [
    { label: "Tickets sold", value: `${sold} / ${totalQty}` },
    { label: "Available", value: String(Math.max(0, totalQty - sold)) },
    { label: "Used", value: `${used} / ${sold}` },
    { label: "Revenue", value: formatCurrency(revenue) },
  ]

  return (
    <div className="rounded-2xl border border-border/40 bg-card/50 p-6 backdrop-blur-xl">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
        <HugeiconsIcon
          icon={ChartBarLineIcon}
          className="size-5 text-primary"
        />
        Overview
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border/20 bg-background/10 p-3"
          >
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-lg font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      <Button asChild variant="secondary" className="mt-4 w-full">
        <Link to="/purchases" search={{ eventId: event.id }}>
          View purchases
        </Link>
      </Button>
    </div>
  )
}
