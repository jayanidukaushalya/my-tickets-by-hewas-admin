import { DashboardHeader } from "@/components/dashboard-header"
import { PurchaseFilters } from "@/components/purchases/purchase-filters"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { formatCurrency } from "@/lib/utils"
import { getPurchasesFn } from "@/server/actions/get-purchases.serverFn"
import {
  Calendar01Icon,
  CancelCircleHalfDotIcon,
  CheckmarkBadge01Icon,
  Contact01Icon,
  ShoppingBag01Icon,
  Ticket01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute } from "@tanstack/react-router"
import { format } from "date-fns"
import {
  debounce,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from "nuqs"
import { createStandardSchemaV1 } from "nuqs/server"

const searchParams = {
  search: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(10),
  dateFrom: parseAsString,
  dateTo: parseAsString,
  eventId: parseAsString,
  isActivated: parseAsBoolean,
}

export const Route = createFileRoute("/_dashboard/purchases/")({
  validateSearch: createStandardSchemaV1(searchParams, {
    partialOutput: true,
  }),
  loaderDeps: ({ search }) => ({
    page: search.page ?? 1,
    limit: search.limit ?? 10,
    search: search.search ?? "",
    dateFrom: search.dateFrom ?? undefined,
    dateTo: search.dateTo ?? undefined,
    eventId: search.eventId ?? undefined,
    isActivated: search.isActivated ?? undefined,
  }),
  loader: async ({ deps }) => {
    try {
      const data = await getPurchasesFn({
        data: {
          page: deps.page,
          limit: deps.limit,
          search: deps.search,
          dateFrom: deps.dateFrom,
          dateTo: deps.dateTo,
          eventId: deps.eventId,
          isActivated: deps.isActivated,
        },
      })
      return { data }
    } catch (error) {
      console.error("Failed to load purchases:", error)
      return { data: { results: [], total: 0 } }
    }
  },
  component: PurchasesComponent,
})

function PurchasesComponent() {
  const { data } = Route.useLoaderData()
  const { results = [], total = 0 } = data ?? {}

  const [queryStates, setQueryStates] = useQueryStates(searchParams, {
    clearOnDefault: true,
  })

  const { search, page, limit, dateFrom, dateTo, isActivated, eventId } =
    queryStates
  const filteredEventName = eventId
    ? results[0]?.ticket.timeSlot.eventDate.event.name
    : undefined

  return (
    <>
      <DashboardHeader />
      <main className="relative flex-1 overflow-y-auto p-6">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-[10%] left-[15%] h-64 w-64 rounded-full bg-primary/20 opacity-30 blur-3xl" />
          <div className="absolute right-[15%] bottom-[10%] h-96 w-96 rounded-full bg-secondary/10 opacity-30 blur-3xl" />
        </div>

        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1">
            <h1 className="text-4xl font-black tracking-tight uppercase">
              Purchases
            </h1>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase opacity-70">
              Complete log of all ticketed transactions
            </p>
          </div>
        </div>

        <PurchaseFilters
          search={search}
          dateFrom={dateFrom}
          dateTo={dateTo}
          isActivated={isActivated}
          onSearchChange={(val) =>
            setQueryStates(
              { search: val, page: 1 },
              { limitUrlUpdates: debounce(300) }
            )
          }
          onDateRangeChange={(val) =>
            setQueryStates({
              dateFrom: val?.from || null,
              dateTo: val?.to || null,
              page: 1,
            })
          }
          onIsActivatedChange={(val) =>
            setQueryStates({ isActivated: val, page: 1 })
          }
        />

        {eventId && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-border/40 bg-card/30 px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              Showing purchases for{" "}
              <span className="font-semibold text-foreground">
                {filteredEventName ?? "the selected event"}
              </span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQueryStates({ eventId: null, page: 1 })}
            >
              Show all
            </Button>
          </div>
        )}

        {results.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border/40 bg-card/10">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground">
              <HugeiconsIcon icon={ShoppingBag01Icon} className="size-6" />
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <h3 className="font-semibold tracking-tight">
                No purchases match your filters
              </h3>
              <p className="max-w-xs text-sm text-muted-foreground">
                Try adjusting your search criteria or date range.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 pb-12">
            <div className="flex flex-col gap-4">
              {results.map((purchase) => {
                const event = purchase.ticket.timeSlot.eventDate.event
                const customer = purchase.order.customer
                const customerName =
                  `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim()

                return (
                  <div
                    key={purchase.id}
                    className="group relative flex flex-col gap-6 rounded-3xl border border-border/40 bg-white/5 p-6 backdrop-blur-3xl transition-all hover:bg-white/10 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
                      <div className="flex flex-col gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="line-clamp-1 text-xl font-bold tracking-tight text-foreground">
                              {event.name}
                            </h3>
                            <Badge className="flex items-center gap-1 border-primary/20 bg-primary/10 px-2.5 text-[10px] font-black tracking-widest text-primary uppercase">
                              <HugeiconsIcon
                                icon={Ticket01Icon}
                                className="size-3"
                                strokeWidth={2.5}
                              />
                              <span>×{purchase.qty}</span>
                            </Badge>
                            {purchase.isActivated ? (
                              <Badge
                                variant="default"
                                className="flex h-5 items-center gap-1 bg-emerald-500 px-2 text-[10px] tracking-widest text-white uppercase hover:bg-emerald-600"
                              >
                                <HugeiconsIcon
                                  icon={CheckmarkBadge01Icon}
                                  className="size-3"
                                  strokeWidth={2.5}
                                />
                                <span>Activated</span>
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="flex h-5 items-center gap-1 bg-secondary/20 px-2 text-[10px] tracking-widest text-muted-foreground uppercase"
                              >
                                <HugeiconsIcon
                                  icon={CancelCircleHalfDotIcon}
                                  className="size-3"
                                  strokeWidth={2.5}
                                />
                                <span>Unused</span>
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <HugeiconsIcon
                                icon={Calendar01Icon}
                                className="size-3.5"
                              />
                              {format(
                                new Date(purchase.ticket.timeSlot.startTime),
                                "MMM do, h:mm a"
                              )}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="text-foreground/40">•</span>
                              {purchase.ticket.name}
                            </span>
                          </div>
                        </div>

                        <div className="grid gap-x-6 gap-y-2 rounded-2xl bg-black/10 p-3.5 sm:grid-cols-2">
                          <div className="flex items-center gap-2">
                            <div className="flex size-7 items-center justify-center rounded-full bg-white/5 text-muted-foreground">
                              <HugeiconsIcon
                                icon={UserIcon}
                                className="size-3.5"
                                strokeWidth={2.5}
                              />
                            </div>
                            <div className="flex flex-col overflow-hidden leading-tight">
                              <span className="truncate text-[13px] font-bold text-foreground/90">
                                {customerName || "Anonymous Guest"}
                              </span>
                              <span className="truncate text-[11px] font-semibold text-muted-foreground">
                                {customer.email}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex size-7 items-center justify-center rounded-full bg-white/5 text-muted-foreground">
                              <HugeiconsIcon
                                icon={Contact01Icon}
                                className="size-3.5"
                                strokeWidth={2.5}
                              />
                            </div>
                            <div className="flex flex-col overflow-hidden leading-tight">
                              <span className="text-[11px] font-bold tracking-wider text-muted-foreground/60 uppercase">
                                Contact
                              </span>
                              <span className="font-mono text-[13px] font-medium text-foreground/90">
                                {customer.phone || "No phone"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-row items-center justify-between border-t border-dashed border-border/40 pt-4 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                      <div className="flex flex-col sm:items-end">
                        <p className="text-xs font-black tracking-widest text-muted-foreground uppercase opacity-50">
                          Total Value
                        </p>
                        <span className="text-3xl font-black tracking-tight text-primary">
                          {formatCurrency(
                            Number(purchase.price) * purchase.qty
                          )}
                        </span>
                      </div>

                      <div className="flex flex-col items-end pt-2 text-[10px] font-bold tracking-widest text-muted-foreground/60 uppercase">
                        <span>Ref: {purchase.order.id.slice(-8)}</span>
                        <span>
                          {format(new Date(purchase.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-border/20 pt-4">
              <PaginationControls
                page={page}
                total={total}
                limit={limit}
                setPage={(p) => setQueryStates({ page: p })}
              />
            </div>
          </div>
        )}
      </main>
    </>
  )
}
