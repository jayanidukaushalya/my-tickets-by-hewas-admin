import {
  apiError,
  apiSuccess,
  corsPreflightResponse,
  publicHandler,
} from "@/server/api"
import { getEventFn } from "@/server/actions/get-event.serverFn"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/api/events/$eventId")({
  server: {
    handlers: {
      OPTIONS: () => corsPreflightResponse(),

      GET: publicHandler(async ({ params }) => {
        const { eventId } = params

        try {
          const event = await getEventFn({ data: { eventId } })
          return apiSuccess(event)
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e)
          if (message === "Event not found") {
            return apiError("Event not found", 404)
          }
          throw e
        }
      }),
    },
  },
})
