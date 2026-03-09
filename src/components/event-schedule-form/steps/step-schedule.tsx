import { Button } from "@/components/ui/button"
import { ScheduleType } from "@/enums/schedule-type.enum"
import { Add01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useFieldArray, useFormContext } from "react-hook-form"
import { DateBlock } from "../date-block"
import type { EventFormValues } from "../schema"

export function StepSchedule() {
  const {
    control,
    formState: { errors },
    watch,
  } = useFormContext<EventFormValues>()
  const scheduleType = watch("scheduleType")
  const {
    fields: dateFields,
    append: appendDate,
    remove: removeDate,
  } = useFieldArray({ control, name: "eventDates" })

  const isMultiTime = scheduleType === ScheduleType.MULTI_TIME
  const isMultiDay = scheduleType === ScheduleType.MULTI_DAY
  const isOneTime = scheduleType === ScheduleType.ONE_TIME

  const canAddDate = isMultiDay

  return (
    <div className="animate-in space-y-6 duration-500 fade-in slide-in-from-right-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight">Event Schedule</h2>
          <p className="text-sm font-medium tracking-wide text-muted-foreground opacity-60">
            {isOneTime
              ? "Set your event date and time"
              : isMultiTime
                ? "Set your event date and multiple time slots"
                : "Set multiple dates with time slots"}
          </p>
        </div>
        {canAddDate && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendDate({
                date: "",
                timeSlots: [
                  {
                    startTime: "10:30",
                    endTime: "12:30",
                    tickets: [{ name: "", price: "", qty: "" }],
                  },
                  {
                    startTime: "10:30",
                    endTime: "12:30",
                    tickets: [{ name: "", price: "", qty: "" }],
                  },
                ],
              })
            }
            className="gap-1.5"
          >
            <HugeiconsIcon
              icon={Add01Icon}
              className="size-3.5"
              strokeWidth={2}
            />
            Add Date
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {dateFields.map((dateField, dateIndex) => (
          <DateBlock
            key={dateField.id}
            dateIndex={dateIndex}
            onRemoveDate={() => removeDate(dateIndex)}
            canRemoveDate={dateFields.length > 1}
          />
        ))}
      </div>

      {errors.eventDates?.message && (
        <p className="text-sm font-medium text-destructive">
          {errors.eventDates.message}
        </p>
      )}
    </div>
  )
}
