import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import * as TanstackQuery from "./providers/tanstack-provider"
import { routeTree } from "./routeTree.gen"

export function getRouter() {
  const rqContext = TanstackQuery.getTanstackQueryContext()

  const router = createTanStackRouter({
    routeTree,
    context: { ...rqContext },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  })

  return router
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
