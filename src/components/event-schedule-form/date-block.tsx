import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScheduleType } from "@/enums/schedule-type.enum"
import { cn } from "@/lib/utils"
import {
  Add01Icon,
  Calendar03Icon,
  Cancel01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { format } from "date-fns"
import { Controller, useFieldArray, useFormContext } from "react-hook-form"
import type { EventFormValues } from "./schema"

export function DateBlock({
  dateIndex,
  onRemoveDate,
  canRemoveDate,
}: {
  dateIndex: number
  onRemoveDate: () => void
  canRemoveDate: boolean
}) {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<EventFormValues>()

  const {
    fields: slotFields,
    append: appendSlot,
    remove: removeSlot,
  } = useFieldArray({ control, name: `eventDates.${dateIndex}.timeSlots` })

  const scheduleType = watch("scheduleType")
  const isOneTime = scheduleType === ScheduleType.ONE_TIME
  const canAddSlot = !isOneTime

  const dateErrors = errors.eventDates?.[dateIndex]

  return (
    <div className="group/date relative overflow-hidden rounded-2xl border border-border/40 bg-card/20 backdrop-blur-xl transition-all hover:border-border/60">
      {/* Date Header */}
      <div className="flex items-center gap-3 border-b border-border/30 bg-muted/20 px-5 py-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <HugeiconsIcon
            icon={Calendar03Icon}
            className="size-4"
            strokeWidth={2}
          />
        </div>
        <div className="flex-1">
          <span className="text-xs font-bold tracking-wider uppercase opacity-60">
            {scheduleType === ScheduleType.MULTI_DAY
              ? `Day ${dateIndex + 1}`
              : "Event Date"}
          </span>
        </div>
        {canRemoveDate && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onRemoveDate}
            className="opacity-0 transition-opacity group-hover/date:opacity-100"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              className="size-3.5"
              strokeWidth={2}
            />
          </Button>
        )}
      </div>

      <div className="space-y-4 p-5">
        {/* Date Picker */}
        <Field orientation="vertical">
          <FieldLabel
            htmlFor={`date-${dateIndex}`}
            className="text-xs font-semibold tracking-tighter uppercase opacity-70"
          >
            Date
          </FieldLabel>
          <FieldContent>
            <Controller
              name={`eventDates.${dateIndex}.date`}
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-10 w-full justify-start border-border/30 bg-background/20 text-left font-normal transition-colors hover:bg-background/30 focus:border-primary/50",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <HugeiconsIcon
                        icon={Calendar03Icon}
                        className="mr-2 size-4"
                        strokeWidth={2}
                      />
                      {field.value ? (
                        format(new Date(field.value), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) =>
                        field.onChange(date?.toISOString() || "")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            <FieldError className="mt-1 text-xs font-medium">
              {dateErrors?.date?.message}
            </FieldError>
          </FieldContent>
        </Field>

        {/* Time Slots */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase opacity-60">
              Time Slots
            </span>
            {canAddSlot && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() =>
                  appendSlot({
                    startTime: "10:30",
                    endTime: "12:30",
                    tickets: [{ name: "", price: "", qty: "" }],
                  })
                }
                className="gap-1 text-primary"
              >
                <HugeiconsIcon
                  icon={Add01Icon}
                  className="size-3"
                  strokeWidth={2}
                />
                Add Slot
              </Button>
            )}
          </div>

          {slotFields.map((slotField, slotIndex) => {
            const slotErrors = dateErrors?.timeSlots?.[slotIndex]
            return (
              <div
                key={slotField.id}
                className="group/slot relative flex items-start gap-3 rounded-xl border border-border/20 bg-background/10 p-3 transition-all hover:border-border/40"
              >
                {!isOneTime && (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-[10px] font-bold text-primary">
                    {slotIndex + 1}
                  </div>
                )}

                <div className="flex flex-1 flex-wrap gap-3">
                  <div className="flex min-w-[140px] flex-1 flex-col gap-1">
                    <label className="text-[10px] font-semibold tracking-wider uppercase opacity-50">
                      Start Time
                    </label>
                    <InputGroup className="h-9 border-border/30 bg-background/20 transition-colors focus-within:border-primary/50">
                      <InputGroupInput
                        type="time"
                        step="1"
                        className="appearance-none text-xs [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                        {...register(
                          `eventDates.${dateIndex}.timeSlots.${slotIndex}.startTime`
                        )}
                      />
                      <InputGroupAddon align="inline-end">
                        <HugeiconsIcon
                          icon={Clock01Icon}
                          className="text-muted-foreground"
                          strokeWidth={2}
                        />
                      </InputGroupAddon>
                    </InputGroup>
                    {slotErrors?.startTime?.message && (
                      <span className="text-[10px] text-destructive">
                        {slotErrors.startTime.message}
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-[140px] flex-1 flex-col gap-1">
                    <label className="text-[10px] font-semibold tracking-wider uppercase opacity-50">
                      End Time (Optional)
                    </label>
                    <InputGroup className="h-9 border-border/30 bg-background/20 transition-colors focus-within:border-primary/50">
                      <InputGroupInput
                        type="time"
                        step="1"
                        className="appearance-none text-xs [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                        {...register(
                          `eventDates.${dateIndex}.timeSlots.${slotIndex}.endTime`
                        )}
                      />
                      <InputGroupAddon
                        align="inline-end"
                        className="gap-1 pr-3.5"
                      >
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          type="button"
                          onClick={() =>
                            setValue(
                              `eventDates.${dateIndex}.timeSlots.${slotIndex}.endTime`,
                              ""
                            )
                          }
                          aria-label="Clear end time"
                        >
                          <HugeiconsIcon
                            icon={Cancel01Icon}
                            className="size-3 text-muted-foreground/70"
                            strokeWidth={2}
                          />
                        </Button>
                        <HugeiconsIcon
                          icon={Clock01Icon}
                          className="pointer-events-none size-4 shrink-0 text-muted-foreground"
                          strokeWidth={2}
                        />
                      </InputGroupAddon>
                    </InputGroup>
                    {slotErrors?.endTime?.message && (
                      <span className="text-[10px] text-destructive">
                        {slotErrors.endTime.message}
                      </span>
                    )}
                  </div>
                </div>

                {slotFields.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-xs"
                    onClick={() => removeSlot(slotIndex)}
                    className="mt-6 shrink-0 opacity-60 group-hover/slot:opacity-80"
                  >
                    <HugeiconsIcon
                      icon={Cancel01Icon}
                      className="size-3"
                      strokeWidth={2}
                    />
                  </Button>
                )}
              </div>
            )
          })}

          {typeof dateErrors?.timeSlots?.message === "string" && (
            <p className="text-xs font-medium text-destructive">
              {dateErrors.timeSlots.message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
