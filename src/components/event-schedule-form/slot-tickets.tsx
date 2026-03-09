import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScheduleType } from "@/enums/schedule-type.enum"
import { cn } from "@/lib/utils"
import {
  Add01Icon,
  Cancel01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useFieldArray, useFormContext } from "react-hook-form"
import type { EventFormValues } from "./schema"

export function SlotTickets({
  dateIndex,
  slotIndex,
}: {
  dateIndex: number
  slotIndex: number
}) {
  const {
    register,
    watch,
    control,
    formState: { errors },
  } = useFormContext<EventFormValues>()
  const scheduleType = watch("scheduleType")
  const startTime = watch(
    `eventDates.${dateIndex}.timeSlots.${slotIndex}.startTime`
  )
  const endTime = watch(
    `eventDates.${dateIndex}.timeSlots.${slotIndex}.endTime`
  )

  const {
    fields: ticketFields,
    append: appendTicket,
    remove: removeTicket,
  } = useFieldArray({
    control,
    name: `eventDates.${dateIndex}.timeSlots.${slotIndex}.tickets`,
  })

  const ticketErrors =
    errors.eventDates?.[dateIndex]?.timeSlots?.[slotIndex]?.tickets

  return (
    <div className="rounded-xl border border-border/20 bg-background/10 transition-all hover:border-border/40">
      {/* Slot header */}
      <div className="flex items-center justify-between border-b border-border/20 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">
            <HugeiconsIcon
              icon={Clock01Icon}
              className="size-3"
              strokeWidth={2}
            />
          </div>
          <span className="text-xs font-semibold text-foreground/70">
            {scheduleType !== ScheduleType.ONE_TIME &&
              `Slot ${slotIndex + 1}: `}
            <span className="text-foreground">
              {startTime || "--:--"} — {endTime || "--:--"}
            </span>
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => appendTicket({ name: "", price: "", qty: "" })}
          className="gap-1 text-primary"
        >
          <HugeiconsIcon icon={Add01Icon} className="size-3" strokeWidth={2} />
          Add Ticket
        </Button>
      </div>

      {/* Ticket rows */}
      <div className="space-y-2 p-4">
        {ticketFields.map((ticketField, ticketIndex) => {
          const tErrors = ticketErrors?.[ticketIndex]
          return (
            <div
              key={ticketField.id}
              className="group/ticket flex items-start gap-2"
            >
              <div className="grid flex-1 gap-2 sm:grid-cols-3">
                <div className="flex flex-col gap-0.5">
                  {ticketIndex === 0 && (
                    <label className="text-[10px] font-semibold tracking-wider uppercase opacity-50">
                      Ticket Name
                    </label>
                  )}
                  <Input
                    placeholder="e.g. Standard"
                    className="h-9 border-border/30 bg-background/20 text-xs transition-colors focus:border-primary/50"
                    {...register(
                      `eventDates.${dateIndex}.timeSlots.${slotIndex}.tickets.${ticketIndex}.name`
                    )}
                  />
                  {tErrors?.name?.message && (
                    <span className="text-[10px] text-destructive">
                      {tErrors.name.message}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  {ticketIndex === 0 && (
                    <label className="text-[10px] font-semibold tracking-wider uppercase opacity-50">
                      Price (LKR)
                    </label>
                  )}
                  <Input
                    placeholder="3000.00"
                    type="number"
                    step="0.01"
                    min="0"
                    className="h-9 border-border/30 bg-background/20 text-xs transition-colors focus:border-primary/50"
                    {...register(
                      `eventDates.${dateIndex}.timeSlots.${slotIndex}.tickets.${ticketIndex}.price`
                    )}
                  />
                  {tErrors?.price?.message && (
                    <span className="text-[10px] text-destructive">
                      {tErrors.price.message}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  {ticketIndex === 0 && (
                    <label className="text-[10px] font-semibold tracking-wider uppercase opacity-50">
                      Quantity
                    </label>
                  )}
                  <Input
                    placeholder="100"
                    type="number"
                    min="1"
                    className="h-9 border-border/30 bg-background/20 text-xs transition-colors focus:border-primary/50"
                    {...register(
                      `eventDates.${dateIndex}.timeSlots.${slotIndex}.tickets.${ticketIndex}.qty`
                    )}
                  />
                  {tErrors?.qty?.message && (
                    <span className="text-[10px] text-destructive">
                      {tErrors.qty.message}
                    </span>
                  )}
                </div>
              </div>
              {ticketFields.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-xs"
                  onClick={() => removeTicket(ticketIndex)}
                  className={cn(
                    "shrink-0 opacity-60 transition-opacity group-hover/ticket:opacity-80",
                    ticketIndex === 0 ? "mt-6" : "mt-0.5"
                  )}
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

        {typeof ticketErrors?.message === "string" && (
          <p className="text-xs font-medium text-destructive">
            {ticketErrors.message}
          </p>
        )}
      </div>
    </div>
  )
}
