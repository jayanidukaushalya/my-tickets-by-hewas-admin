import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { authClient } from "@/integrations/better-auth/auth-client"
import { Link, useLocation } from "@tanstack/react-router"
import React from "react"

interface BreadcrumbItemType {
  label: string
  href?: string
}

interface DashboardHeaderProps {
  breadcrumbs?: BreadcrumbItemType[]
}

export function DashboardHeader({
  breadcrumbs: customBreadcrumbs,
}: DashboardHeaderProps) {
  const { pathname } = useLocation()
  const { data: session } = authClient.useSession()
  const pathSegments = pathname.split("/").filter(Boolean)

  const items = customBreadcrumbs || [
    { label: "Dashboard", href: "/" },
    ...pathSegments.map((segment, index) => ({
      label: segment.replace(/-/g, " "),
      href: "/" + pathSegments.slice(0, index + 1).join("/"),
    })),
  ]

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/40 bg-background/30 px-4 supports-backdrop-filter:backdrop-blur">
      <SidebarTrigger className="-ml-1" />
      <div className="mx-2 h-4 w-px bg-border/40" />

      <Breadcrumb>
        <BreadcrumbList>
          {items.map((item, index) => (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                {index === items.length - 1 ? (
                  <BreadcrumbPage className="capitalize">
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < items.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-3">
        <Avatar className="size-9 overflow-hidden rounded-full border border-border/40 shadow-inner">
          <AvatarFallback className="rounded-full bg-primary/10 font-bold text-primary">
            {session?.user.name?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="hidden text-sm leading-tight sm:grid">
          <span className="truncate font-semibold text-foreground">
            {session?.user.name}
          </span>
          <span className="truncate text-xs text-muted-foreground opacity-70">
            {session?.user.email}
          </span>
        </div>
      </div>
    </header>
  )
}
