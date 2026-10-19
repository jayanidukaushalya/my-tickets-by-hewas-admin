import { DashboardHeader } from "@/components/dashboard-header"
import { UserGroupIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_dashboard/customers/")({
  component: CustomersComponent,
})

function CustomersComponent() {
  return (
    <>
      <DashboardHeader />
      <main className="relative flex-1 overflow-y-auto p-6">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-[15%] left-[20%] h-64 w-64 rounded-full bg-primary/20 opacity-30 blur-3xl" />
          <div className="absolute right-[20%] bottom-[15%] h-96 w-96 rounded-full bg-secondary/10 opacity-30 blur-3xl" />
        </div>

        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1">
            <h1 className="text-4xl font-black tracking-tight uppercase">
              Customers
            </h1>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase opacity-70">
              User profiles and engagement analytics
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-6 rounded-3xl border border-border/40 bg-white/5 p-12 text-center backdrop-blur-3xl">
          <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform hover:scale-110">
            <HugeiconsIcon icon={UserGroupIcon} className="size-10" />
          </div>

          <div className="max-w-md space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Coming Soon
            </h2>
            <p className="text-sm leading-relaxed text-balance text-muted-foreground">
              Stay tuned for a powerful management suite.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-1.5 w-8 rounded-full bg-primary/20 odd:bg-primary/40"
              />
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
