import { DashboardHeader } from "@/components/dashboard-header"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_dashboard/events")({
  component: EventsComponent,
})

function EventsComponent() {
  return (
    <>
      <DashboardHeader />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl animate-in space-y-8 duration-700 fade-in slide-in-from-bottom-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Events Management
            </h1>
            <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase opacity-60">
              Manage and monitor all your ticketed events
            </p>
          </div>

          <div className="rounded-3xl border border-border/40 bg-card/30 p-8 text-center text-muted-foreground backdrop-blur-2xl">
            <p>Events list will be displayed here.</p>
          </div>
        </div>
      </main>
    </>
  )
}
