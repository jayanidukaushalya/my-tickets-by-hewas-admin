import { DashboardHeader } from "@/components/dashboard-header"
import { authClient } from "@/integrations/better-auth/auth-client"
import { authMiddleware } from "@/integrations/better-auth/auth-middleware"
import {
  Calendar03Icon,
  ShoppingBag01Icon,
  UserGroupIcon,
  Search01Icon,
  Calendar01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute } from "@tanstack/react-router"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const chartData = [
  { day: "Mon", revenue: 4500 },
  { day: "Tue", revenue: 5200 },
  { day: "Wed", revenue: 4800 },
  { day: "Thu", revenue: 6100 },
  { day: "Fri", revenue: 5900 },
  { day: "Sat", revenue: 8400 },
  { day: "Sun", revenue: 7600 },
]

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "oklch(0.627 0.194 149.214)", // Match primary green
  },
} satisfies ChartConfig

const mockPurchases = [
  {
    id: "1",
    customer: "Jayanidu Kaushalya",
    email: "jayanidukaushalya@gmail.com",
    event: "Grand Tour 2026",
    amount: 1200,
    date: "2 mins ago",
  },
  {
    id: "2",
    customer: "Kasun Perera",
    email: "kasun@example.com",
    event: "Tech Conference",
    amount: 4500,
    date: "15 mins ago",
  },
  {
    id: "3",
    customer: "Nimal Silva",
    email: "nimal@test.com",
    event: "Music Festival",
    amount: 800,
    date: "1 hour ago",
  },
  {
    id: "4",
    customer: "Admin User",
    email: "admin@hewas.lk",
    event: "Workshop",
    amount: 2500,
    date: "3 hours ago",
  },
]

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
                color: "bg-emerald-500/10 text-emerald-500",
              },
              {
                label: "Tickets Sold",
                value: "842",
                icon: ShoppingBag01Icon,
                color: "bg-emerald-500/10 text-emerald-500",
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
                    className={`flex size-11 items-center justify-center rounded-2xl border border-border/10 shadow-sm ${stat.color} transition-transform group-hover:scale-110`}
                  >
                    <HugeiconsIcon
                      icon={stat.icon}
                      className="size-5"
                      strokeWidth={2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Chart Area */}
            <div className="flex flex-col gap-4 rounded-3xl border border-border/40 bg-card/30 p-6 backdrop-blur-2xl lg:col-span-2">
              <div className="flex items-center justify-between px-2">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">Revenue Activity</h3>
                  <p className="text-xs font-medium text-muted-foreground uppercase opacity-60">Monthly growth trends</p>
                </div>
                <Badge variant="outline" className="h-6 bg-emerald-500/5 text-emerald-500 border-emerald-500/20">
                  +12.5% this week
                </Badge>
              </div>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <AreaChart data={chartData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    tick={{ fontSize: 11, fontWeight: 600, opacity: 0.5 }}
                  />
                  <YAxis
                    hide
                  />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#fillRevenue)"
                  />
                </AreaChart>
              </ChartContainer>
            </div>

            {/* Recent Purchases Area */}
            <div className="flex flex-col gap-6 rounded-3xl border border-border/40 bg-card/30 p-6 backdrop-blur-2xl">
              <div>
                <h3 className="text-lg font-bold tracking-tight">Recent Sales</h3>
                <p className="text-xs font-medium text-muted-foreground uppercase opacity-60">Live transaction feed</p>
              </div>
              <div className="space-y-5">
                {mockPurchases.map((purchase) => (
                  <div key={purchase.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-white/5 font-bold text-xs uppercase tracking-tighter text-muted-foreground">
                        {purchase.customer.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-foreground/90 leading-none mb-1">
                          {purchase.customer}
                        </span>
                        <span className="text-[11px] font-medium text-muted-foreground/60 line-clamp-1">
                          {purchase.event}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[13px] font-black text-emerald-500">
                        {formatCurrency(purchase.amount)}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground/40 uppercase">
                        {purchase.date}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-4 flex justify-center">
                <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline underline-offset-4">
                  View All Transactions
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
