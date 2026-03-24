import {
  getEventsFn,
  getEventsValidator,
} from "@/server/actions/get-events.serverFn"
import {
  apiSuccess,
  apiValidationError,
  corsPreflightResponse,
  publicHandler,
} from "@/server/api"
import { getNumberFromParams } from "@/lib/utils"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/api/events/")({
  server: {
    handlers: {
      OPTIONS: () => corsPreflightResponse(),

      GET: publicHandler(async ({ request }) => {
        const { searchParams } = new URL(request.url)

        const parsed = getEventsValidator.safeParse({
          search: searchParams.get("search"),
          page: getNumberFromParams(searchParams, "page"),
          limit: getNumberFromParams(searchParams, "limit"),
          field: searchParams.get("field"),
          order: searchParams.get("order"),
          eventType: searchParams.get("eventType"),
          scheduleType: searchParams.get("scheduleType"),
          dateFrom: searchParams.get("dateFrom"),
          dateTo: searchParams.get("dateTo"),
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
