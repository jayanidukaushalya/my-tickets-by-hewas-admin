import { LogoutConfirmDialog } from "@/components/logout-confirm-dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { authClient } from "@/integrations/better-auth/auth-client"
import {
  Calendar01Icon,
  DashboardSquare01Icon,
  Logout01Icon,
  ShoppingBag01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link, useLocation, useNavigate } from "@tanstack/react-router"
import { useState } from "react"

export function AppSidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate({ to: "/login", replace: true })
        },
      },
    })
  }

  function isActivePath(currentPathname: string, itemUrl: string): boolean {
    const normalize = (value: string) => value.replace(/\/+$/, "") || "/"
    const path = normalize(currentPathname)
    const url = normalize(itemUrl)

    if (url === "/") {
      return path === url
    }

    return path === url || path.startsWith(url + "/")
  }

  const sections = [
    {
      title: "Overview",
      items: [{ title: "Dashboard", icon: DashboardSquare01Icon, url: "/" }],
    },
    {
      title: "Commerce",
      items: [
        { title: "Events", icon: Calendar01Icon, url: "/events" },
        { title: "Purchases", icon: ShoppingBag01Icon, url: "/purchases" },
        { title: "Customers", icon: UserGroupIcon, url: "/customers" },
      ],
    },
  ]

  return (
    <>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="flex h-16 items-center justify-center border-b border-dashed">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="cursor-default hover:bg-transparent active:bg-transparent"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                  <HugeiconsIcon
                    icon={ShoppingBag01Icon}
                    className="size-5"
                    strokeWidth={2.5}
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-black tracking-tight uppercase">
                    M-Tickets
                  </span>
                  <span className="truncate text-[10px] font-bold tracking-widest text-muted-foreground uppercase opacity-70">
                    Admin Portal
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          {sections.map((section) => (
            <SidebarGroup key={section.title}>
              <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-2">
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={isActivePath(pathname, item.url)}
                        size="lg"
                        className="rounded-xl border border-transparent transition-all duration-200 hover:border-border/40 hover:bg-sidebar-accent/50 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-lg data-[active=true]:shadow-primary/20"
                      >
                        <Link
                          to={item.url}
                          className="flex group-data-[collapsible=icon]:justify-center"
                        >
                          <HugeiconsIcon
                            icon={item.icon}
                            className="size-5 shrink-0"
                            strokeWidth={2}
                          />
                          <span className="font-semibold group-data-[collapsible=icon]:hidden">
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="border-t border-dashed">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                tooltip="Log Out"
                onClick={() => setShowLogoutDialog(true)}
                className="rounded-xl text-destructive transition-all duration-200 group-data-[collapsible=icon]:justify-center hover:bg-destructive/10 hover:text-destructive"
              >
                <HugeiconsIcon
                  icon={Logout01Icon}
                  className="size-5 shrink-0"
                  strokeWidth={2}
                />
                <span className="font-semibold group-data-[collapsible=icon]:hidden">
                  Log Out
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <LogoutConfirmDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={handleLogout}
      />
    </>
  )
}
