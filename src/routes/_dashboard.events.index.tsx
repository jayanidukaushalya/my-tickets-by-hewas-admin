import { DashboardHeader } from "@/components/dashboard-header"
import { EmptyEventState } from "@/components/events/empty-event-state"
import { EventCard } from "@/components/events/event-card"
import { EventFilters } from "@/components/events/event-filters"
import { Button } from "@/components/ui/button"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { EventType } from "@/enums/event-type.enum"
import { ScheduleType } from "@/enums/schedule-type.enum"
import { SortOrder } from "@/enums/sort-order.enum"
import { getEventsFn } from "@/server/actions/get-events.serverFn"
import { Add01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from "nuqs"
import { createStandardSchemaV1 } from "nuqs/server"

const searchParams = {
  search: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(8),
  field: parseAsString.withDefault("createdAt"),
  order: parseAsStringEnum<SortOrder>(Object.values(SortOrder)).withDefault(
    SortOrder.DESC
  ),
  eventType: parseAsStringEnum<EventType>(Object.values(EventType)),
  scheduleType: parseAsStringEnum<ScheduleType>(Object.values(ScheduleType)),
  dateFrom: parseAsString,
  dateTo: parseAsString,
}

export const Route = createFileRoute("/_dashboard/events/")({
  validateSearch: createStandardSchemaV1(searchParams, {
    partialOutput: true,
  }),
  loaderDeps: ({ search }) => ({
    page: search.page ?? 1,
    limit: search.limit ?? 8,
    search: search.search ?? "",
    field: search.field ?? "createdAt",
    order: search.order ?? SortOrder.DESC,
    eventType: search.eventType ?? undefined,
    scheduleType: search.scheduleType ?? undefined,
    dateFrom: search.dateFrom ?? undefined,
    dateTo: search.dateTo ?? undefined,
  }),
  loader: async ({ deps }) => {
    try {
      const data = await getEventsFn({
        data: {
          page: deps.page,
          limit: deps.limit,
          search: deps.search,
          field: deps.field,
          order: deps.order,
          eventType: deps.eventType,
          scheduleType: deps.scheduleType,
          dateFrom: deps.dateFrom,
          dateTo: deps.dateTo,
        },
      })
      return { data }
    } catch (error) {
      console.error("Failed to load events:", error)
      return { data: { results: [], total: 0 } }
    }
  },
  component: EventsComponent,
})

function EventsComponent() {
  const { data } = Route.useLoaderData()
  const { results = [], total = 0 } = data ?? {}

  const [queryStates, setQueryStates] = useQueryStates(searchParams, {
    clearOnDefault: true,
  })

  // Destructure for easier use
  const { search, page, limit, eventType, scheduleType, dateFrom, dateTo } =
    queryStates

  const hasFilters = Boolean(
    search || eventType || scheduleType || dateFrom || dateTo
  )

  return (
    <>
      <DashboardHeader />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
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

        <EventFilters
          search={search}
          eventType={eventType}
          scheduleType={scheduleType}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onSearchChange={(val) => setQueryStates({ search: val, page: 1 })}
          onEventTypeChange={(val) =>
            setQueryStates({ eventType: val, page: 1 })
          }
          onScheduleTypeChange={(val) =>
            setQueryStates({ scheduleType: val, page: 1 })
          }
          onDateRangeChange={(val) =>
            setQueryStates({
              dateFrom: val?.from || null,
              dateTo: val?.to || null,
              page: 1,
            })
          }
        />

        {results.length === 0 ? (
          <EmptyEventState hasFilters={hasFilters} />
        ) : (
          <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            <PaginationControls
              page={page}
              total={total}
              limit={limit}
              setPage={(p) => setQueryStates({ page: p })}
            />
          </div>
        )}
      </main>
    </>
  )
}
