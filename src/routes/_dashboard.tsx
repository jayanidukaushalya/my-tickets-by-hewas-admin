import { AppSidebar } from "@/components/sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { authClient } from "@/integrations/better-auth/auth-client"
import { authMiddleware } from "@/integrations/better-auth/auth-middleware"
import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_dashboard")({
  server: {
    middleware: [authMiddleware],
  },
  component: DashboardLayout,
})

function DashboardLayout() {
  const { data: session } = authClient.useSession()

  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full font-sans antialiased">
        <AppSidebar session={session} />
        <SidebarInset className="relative flex flex-col overflow-hidden bg-background/50 backdrop-blur-3xl">
          <Outlet />
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
