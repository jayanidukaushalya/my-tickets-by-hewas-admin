import { AppSidebar } from "@/components/sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { authMiddleware } from "@/integrations/better-auth/auth-middleware"
import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_dashboard")({
  server: {
    middleware: [authMiddleware],
  },
  component: DashboardLayout,
})

function DashboardLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full font-sans antialiased">
        <AppSidebar />
        <SidebarInset className="relative flex flex-col overflow-hidden bg-background/50 backdrop-blur-3xl">
          <Outlet />
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
