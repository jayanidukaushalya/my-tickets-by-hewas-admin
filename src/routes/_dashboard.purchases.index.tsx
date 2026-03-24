import { DashboardHeader } from "@/components/dashboard-header"
import { Badge } from "@/components/ui/badge"
import { PaginationControls } from "@/components/ui/pagination-controls"

import { formatCurrency } from "@/lib/utils"
import { getPurchasesFn } from "@/server/actions/get-purchases.serverFn"
import { ShoppingBag01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute } from "@tanstack/react-router"
import { format } from "date-fns"
import { parseAsInteger, useQueryStates } from "nuqs"
import { createStandardSchemaV1 } from "nuqs/server"

const searchParams = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(10),
}

export const Route = createFileRoute("/_dashboard/purchases/")({
  validateSearch: createStandardSchemaV1(searchParams, {
    partialOutput: true,
  }),
  loaderDeps: ({ search }) => ({
    page: search.page ?? 1,
    limit: search.limit ?? 10,
  }),
  loader: async ({ deps }) => {
    try {
      const data = await getPurchasesFn({
        data: {
          page: deps.page,
          limit: deps.limit,
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

  const [{ page, limit }, setQueryStates] = useQueryStates(searchParams, {
    clearOnDefault: true,
  })

  return (
    <>
      <DashboardHeader />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Purchases
            </h1>
            <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase opacity-60">
              View and track all ticketing transactions
            </p>
          </div>
        </div>

        {results.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border/40 bg-card/10">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground">
              <HugeiconsIcon icon={ShoppingBag01Icon} className="size-6" />
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <h3 className="font-semibold tracking-tight">No purchases yet</h3>
              <p className="max-w-xs text-sm text-muted-foreground">
                There are currently no completed transactions to display.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              {results.map((purchase) => {
                const event = purchase.ticket.timeSlot.eventDate.event
                const customerName = `${purchase.customer.firstName ?? ""} ${purchase.customer.lastName ?? ""}`.trim()
                
                return (
                  <div
                    key={purchase.id}
                    className="flex flex-col gap-4 rounded-2xl border border-border/40 bg-card/40 p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-6">
                      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <HugeiconsIcon icon={ShoppingBag01Icon} className="size-6" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-lg line-clamp-1" title={event.name}>
                            {event.name}
                          </span>
                          <Badge variant="secondary" className="px-1.5 font-bold">
                            ×{purchase.qty}
                          </Badge>
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                          {purchase.ticket.name} • {format(new Date(purchase.ticket.timeSlot.startTime), "MMM do, h:mm a")}
                        </span>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground/80">
                            {customerName || "Anonymous User"}
                          </span>
                          <span>({purchase.customer.email})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row items-center justify-between border-t border-dashed border-border/40 pt-4 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                      <span className="text-xl font-bold tracking-tight text-primary">
                        {formatCurrency(Number(purchase.price) * purchase.qty)}
                      </span>
                      <div className="flex flex-col items-end text-xs text-muted-foreground">
                        <span>Order #{purchase.id.slice(-8).toUpperCase()}</span>
                        <span>{format(new Date(purchase.createdAt), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
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
