import {
  Calendar03Icon,
  Clock01Icon,
  Ticket01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { format } from "date-fns"
import { EVENT_TYPE_OPTIONS, SCHEDULE_TYPE_OPTIONS } from "../constants"
import { ReviewRow, ReviewSection } from "../review-widgets"
import { LocationMap } from "@/components/location-map"

import { useFormContext } from "react-hook-form"
import type { EventFormValues } from "../schema"

export interface StepReviewProps {
  googleMapsApiKey: string
  googleMapsMapId: string
}

export function StepReview({
  googleMapsApiKey,
  googleMapsMapId,
}: StepReviewProps) {
  const { watch } = useFormContext<EventFormValues>()
  const values = watch()

  const scheduleLabel =
    SCHEDULE_TYPE_OPTIONS.find((o) => o.value === values.scheduleType)?.label ||
    values.scheduleType
  const eventTypeLabel =
    EVENT_TYPE_OPTIONS.find((o) => o.value === values.eventType)?.label ||
    values.eventType

  return (
    <div className="animate-in space-y-6 duration-500 fade-in slide-in-from-right-4">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">Review Your Event</h2>
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase opacity-60">
          Double-check all details before creating your event
        </p>
      </div>

      <div className="space-y-4">
        <ReviewSection title="Basic Information">
          <ReviewRow label="Event Name" value={values.name} />
          <ReviewRow label="Event Type" value={eventTypeLabel} />
          <ReviewRow label="Schedule Type" value={scheduleLabel} />
          <ReviewRow label="Languages" value={values.languages || "—"} />
          <ReviewRow label="Description" value={values.description || "—"} />
        </ReviewSection>

        {/* Location */}
        <ReviewSection title="Location">
          <ReviewRow label="Venue" value={values.venue} />
          <ReviewRow label="Address" value={values.address || "—"} />

          {values.lat && values.lng && (
            <LocationMap
              className="mt-4"
              lat={values.lat}
              lng={values.lng}
              googleMapsApiKey={googleMapsApiKey}
              googleMapsMapId={googleMapsMapId}
            />
          )}
        </ReviewSection>

        {/* Schedule & Tickets */}
        <ReviewSection title="Schedule & Tickets">
          {values.eventDates.map((ed, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <HugeiconsIcon
                  icon={Calendar03Icon}
                  className="size-3.5"
                  strokeWidth={2}
                />
                {ed.date
                  ? format(new Date(ed.date), "EEEE, MMMM d, yyyy")
                  : `Date ${idx + 1}`}
              </div>
              {ed.timeSlots.map((ts, tsIdx) => (
                <div
                  key={tsIdx}
                  className="ml-5 space-y-1 rounded-lg border border-border/20 bg-background/5 p-3"
                >
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <HugeiconsIcon
                      icon={Clock01Icon}
                      className="size-3"
                      strokeWidth={2}
                    />
                    {ts.endTime
                      ? `${ts.startTime || "--:--"} — ${ts.endTime}`
                      : `${ts.startTime || "--:--"} Onwards`}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {ts.tickets.map((ticket, tIdx) => (
                      <span
                        key={tIdx}
                        className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[11px] font-semibold text-primary"
                      >
                        <HugeiconsIcon
                          icon={Ticket01Icon}
                          className="size-2.5"
                          strokeWidth={2}
                        />
                        {ticket.name}: LKR {ticket.price} × {ticket.qty}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </ReviewSection>
      </div>
    </div>
  )
}
