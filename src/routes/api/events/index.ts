import {
  apiSuccess,
  apiValidationError,
  corsPreflightResponse,
  publicHandler,
} from "@/server/api"
import {
  getEventsFn,
  getEventsValidator,
} from "@/server/actions/get-events.serverFn"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/api/events/")({
  server: {
    handlers: {
      OPTIONS: () => corsPreflightResponse(),

      GET: publicHandler(async ({ request }) => {
        const { searchParams } = new URL(request.url)

        const parsed = getEventsValidator.safeParse({
          search: searchParams.get("search") ?? undefined,
          page:
            searchParams.get("page") !== null
              ? Number(searchParams.get("page"))
              : undefined,
          limit:
            searchParams.get("limit") !== null
              ? Number(searchParams.get("limit"))
              : undefined,
          field: searchParams.get("field") ?? undefined,
          order: searchParams.get("order") ?? undefined,
          eventType: searchParams.get("eventType") ?? undefined,
          scheduleType: searchParams.get("scheduleType") ?? undefined,
          dateFrom: searchParams.get("dateFrom") ?? undefined,
          dateTo: searchParams.get("dateTo") ?? undefined,
        })

        if (!parsed.success) {
          return apiValidationError(parsed.error.flatten())
        }

        const data = await getEventsFn({ data: parsed.data })
        return apiSuccess(data)
      }),
    },
  },
})
