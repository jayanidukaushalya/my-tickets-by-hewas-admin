import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Add01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"

export const Route = createFileRoute("/_dashboard/events/")({
  component: EventsComponent,
})

function EventsComponent() {
  return (
    <>
      <DashboardHeader />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Events Management
            </h1>
            <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase opacity-60">
              Manage and monitor all your ticketed events
            </p>
          </div>
          <Button asChild size="lg">
            <Link to="/events/schedule">
              <HugeiconsIcon
                icon={Add01Icon}
                className="size-4"
                strokeWidth={2}
                data-icon="inline-start"
              />
              Schedule New Event
            </Link>
          </Button>
        </div>

        <div className="rounded-3xl border border-border/40 bg-card/30 p-8 text-center text-muted-foreground backdrop-blur-2xl">
          <p>Events list will be displayed here.</p>
        </div>
      </main>
    </>
  )
}
