import { DashboardHeader } from "@/components/dashboard-header"
import { EventScheduleForm } from "@/components/event-schedule-form"
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_MAP_ID } from "@/configs/env.config"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_dashboard/events/schedule")({
  component: EventScheduleComponent,
  loader: () => ({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    googleMapsMapId: GOOGLE_MAPS_MAP_ID,
  }),
})

function EventScheduleComponent() {
  const { googleMapsApiKey, googleMapsMapId } = Route.useLoaderData()
  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Events", href: "/events" },
          { label: "Schedule Event" },
        ]}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-8 flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Schedule New Event
          </h1>
          <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase opacity-60">
            Create and configure a new ticketed event
          </p>
        </div>

        <EventScheduleForm
          googleMapsApiKey={googleMapsApiKey}
          googleMapsMapId={googleMapsMapId}
        />
      </main>
    </>
  )
}
