import { NotFound } from "@/components/not-found"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
import { NuqsAdapter } from "nuqs/adapters/tanstack-router"

import appCss from "../styles.css?url"

export const Route = createRootRoute({
  notFoundComponent: () => <NotFound />,
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "TanStack Start Starter",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        <NuqsAdapter>
          <TooltipProvider>{children}</TooltipProvider>
        </NuqsAdapter>
        <Toaster richColors position="top-center" />
        <Scripts />
      </body>
    </html>
  )
}
