import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { SidebarTrigger } from "@/components/ui/sidebar"
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
    </header>
  )
}
