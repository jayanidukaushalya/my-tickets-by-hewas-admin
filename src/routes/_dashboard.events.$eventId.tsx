import { DashboardHeader } from "@/components/dashboard-header"
import { EventBanner } from "@/components/events/event-details/event-banner"
import { EventDates } from "@/components/events/event-details/event-dates"
import { EventDescription } from "@/components/events/event-details/event-description"
import { EventLanguages } from "@/components/events/event-details/event-languages"
import { EventLocation } from "@/components/events/event-details/event-location"
import { EventTickets } from "@/components/events/event-details/event-tickets"
import { Badge } from "@/components/ui/badge"
import { formatEnum } from "@/lib/utils"
import { GoogleMapsProvider } from "@/providers/google-maps-provider"
import { getEventFn } from "@/server/actions/get-event.serverFn"
import { createFileRoute } from "@tanstack/react-router"
import { format } from "date-fns"

export const Route = createFileRoute("/_dashboard/events/$eventId")({
  loader: async ({ params }) => {
    const event = await getEventFn({ data: { eventId: params.eventId } })
    return { event }
  },
  component: EventDetailsPage,
})

function EventDetailsPage() {
  const { event } = Route.useLoaderData()

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Events", href: "/events" },
          { label: event.name },
        ]}
      />
      <GoogleMapsProvider>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col gap-8 pb-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {event.name}
                </h1>
                <p className="text-muted-foreground">
                  Created on {format(new Date(event.createdAt), "PPP")}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge>{formatEnum(event.eventType)}</Badge>
                <Badge>{formatEnum(event.scheduleType)}</Badge>
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-5">
              {/* Left Column - Main Details */}
              <div className="flex flex-col gap-8 md:col-span-3">
                <EventBanner event={event} />
                <EventDescription event={event} />
                <EventTickets eventDates={event.eventDates} />
              </div>

              {/* Right Column - Sidebar */}
              <div className="flex flex-col gap-6 md:col-span-2">
                <EventDates eventDates={event.eventDates} />
                <EventLocation event={event} />
                <EventLanguages event={event} />
              </div>
            </div>
          </div>
        </main>
      </GoogleMapsProvider>
    </>
  )
}
