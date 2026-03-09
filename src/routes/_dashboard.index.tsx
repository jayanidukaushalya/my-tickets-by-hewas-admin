import { DashboardHeader } from "@/components/dashboard-header"
import { authClient } from "@/integrations/better-auth/auth-client"
import { authMiddleware } from "@/integrations/better-auth/auth-middleware"
import {
  Calendar03Icon,
  ShoppingBag01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_dashboard/")({
  server: {
    middleware: [authMiddleware],
  },
  component: DashboardComponent,
})

function DashboardComponent() {
  const { data: session } = authClient.useSession()

  return (
    <>
      <DashboardHeader />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="space-y-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {session?.user.name}
            </h1>
            <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase opacity-60">
              M-Tickets Administrative Dashboard
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Total Events",
                value: "12",
                icon: Calendar03Icon,
                color: "bg-blue-500/10 text-blue-500",
              },
              {
                label: "Tickets Sold",
                value: "842",
                icon: ShoppingBag01Icon,
                color: "bg-green-500/10 text-green-500",
              },
              {
                label: "New Customers",
                value: "156",
                icon: UserGroupIcon,
                color: "bg-purple-500/10 text-purple-500",
              },
              {
                label: "Revenue",
                value: "LKR 42.5K",
                icon: ShoppingBag01Icon,
                color: "bg-orange-500/10 text-orange-500",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-3xl border border-border/40 bg-card/40 p-6 shadow-sm backdrop-blur-xl transition-all hover:bg-card/60 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold tracking-tighter uppercase opacity-60">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold tracking-tight">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`flex size-12 items-center justify-center rounded-2xl border border-border/10 shadow-sm ${stat.color} transition-transform group-hover:scale-110`}
                  >
                    <HugeiconsIcon
                      icon={stat.icon}
                      className="size-6"
                      strokeWidth={2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Placeholder Content Area */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="flex h-[400px] items-center justify-center rounded-3xl border border-border/40 bg-card/30 p-8 text-muted-foreground backdrop-blur-2xl lg:col-span-2">
              Dashboard Activity Graph Placeholder
            </div>
            <div className="flex h-[400px] items-center justify-center rounded-3xl border border-border/40 bg-card/30 p-8 text-muted-foreground backdrop-blur-2xl">
              Recent Purchases Feed Placeholder
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
