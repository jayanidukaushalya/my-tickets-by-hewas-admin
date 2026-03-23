import { DashboardHeader } from "@/components/dashboard-header"
import { LocationMap } from "@/components/location-map"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatEnum } from "@/lib/utils"
import { GoogleMapsProvider } from "@/providers/google-maps-provider"
import { getEventFn } from "@/server/actions/get-event.serverFn"
import {
  ArrowLeft01Icon,
  Calendar01Icon,
  Clock01Icon,
  LanguageSkillIcon,
  Location01Icon,
  Ticket01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link, createFileRoute } from "@tanstack/react-router"
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
              <div className="flex items-center gap-4">
                <Link
                  to="/events"
                  className="flex size-10 items-center justify-center rounded-lg border border-border/40 bg-background/50 backdrop-blur-xl transition-colors hover:bg-muted"
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    {event.name}
                  </h1>
                  <p className="text-muted-foreground">
                    Created on {format(new Date(event.createdAt), "PPP")}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge>{formatEnum(event.eventType)}</Badge>
                <Badge>{formatEnum(event.scheduleType)}</Badge>
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-5">
              {/* Left Column - Main Details */}
              <div className="flex flex-col gap-8 md:col-span-3">
                {event.image && (
                  <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/50">
                    <img
                      src={event.image}
                      alt={event.name}
                      className="aspect-video w-full object-cover"
                    />
                  </div>
                )}

                <div className="rounded-2xl border border-border/40 bg-card/50 p-6 backdrop-blur-xl">
                  <h2 className="mb-4 text-xl font-semibold">
                    About this event
                  </h2>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                    {event.description ? (
                      <p className="whitespace-pre-wrap">{event.description}</p>
                    ) : (
                      <p className="italic">No description provided.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Sidebar */}
              <div className="flex flex-col gap-6 md:col-span-2">
                <div className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-xl">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold">
                    <HugeiconsIcon
                      icon={Calendar01Icon}
                      className="size-5 text-primary"
                    />
                    Dates & Times
                  </h3>
                  <div className="flex flex-col gap-4">
                    {event.eventDates.map((ed) => (
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
                                <HugeiconsIcon
                                  icon={Clock01Icon}
                                  className="size-3.5"
                                />
                                <span>
                                  {format(new Date(ts.startTime), "h:mm a")}
                                  {ts.endTime &&
                                    ` - ${format(new Date(ts.endTime), "h:mm a")}`}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {event.location && (
                  <div className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-xl">
                    <h3 className="mb-4 flex items-center gap-2 font-semibold">
                      <HugeiconsIcon
                        icon={Location01Icon}
                        className="size-5 text-primary"
                      />
                      Location
                    </h3>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-foreground">
                        {event.location.venue}
                      </span>
                      {event.location.address && (
                        <span className="text-sm text-muted-foreground">
                          {event.location.address}
                        </span>
                      )}
                      {event.location.latitude && event.location.longitude && (
                        <div className="mt-3 overflow-hidden rounded-lg">
                          <LocationMap
                            lat={parseFloat(event.location.latitude)}
                            lng={parseFloat(event.location.longitude)}
                            className="h-40 w-full"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {event.languages && (
                  <div className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-xl">
                    <h3 className="mb-4 flex items-center gap-2 font-semibold">
                      <HugeiconsIcon
                        icon={LanguageSkillIcon}
                        className="size-5 text-primary"
                      />
                      Languages
                    </h3>
                    <div className="font-medium text-foreground">
                      {event.languages}
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-xl">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold">
                    <HugeiconsIcon
                      icon={Ticket01Icon}
                      className="size-5 text-primary"
                    />
                    Tickets Overview
                  </h3>
                  <div className="flex flex-col gap-3">
                    {event.eventDates.map((ed) =>
                      ed.timeSlots.map((ts) =>
                        ts.tickets.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between rounded-lg border border-border/20 bg-background/50 p-3"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {t.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Qty: {t.qty}
                              </span>
                            </div>
                            <span className="font-semibold">
                              {Number(t.price) === 0
                                ? "Free"
                                : formatCurrency(t.price)}
                            </span>
                          </div>
                        ))
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </GoogleMapsProvider>
    </>
  )
}
