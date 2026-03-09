import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Controller, useFormContext } from "react-hook-form"
import { EVENT_TYPE_OPTIONS, SCHEDULE_TYPE_OPTIONS } from "../constants"
import type { EventFormValues } from "../schema"

export function StepBasicInfo() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<EventFormValues>()

  return (
    <div className="animate-in space-y-6 duration-500 fade-in slide-in-from-right-4">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">Event Details</h2>
        <p className="text-sm font-medium tracking-wide text-muted-foreground opacity-60">
          Fill in the basic information about your event
        </p>
      </div>

      <FieldGroup className="gap-5">
        {/* Event Name */}
        <Field orientation="vertical">
          <FieldLabel
            htmlFor="event-name"
            className="text-xs font-semibold tracking-tighter uppercase opacity-70"
          >
            Event Name
          </FieldLabel>
          <FieldContent>
            <Input
              id="event-name"
              placeholder="e.g. Summer Music Festival 2026"
              className="h-10 border-border/30 bg-background/20 transition-colors focus:border-primary/50"
              {...register("name")}
            />
            <FieldError className="mt-1 text-xs font-medium">
              {errors.name?.message}
            </FieldError>
          </FieldContent>
        </Field>

        {/* Event Image URL */}
        <Field orientation="vertical">
          <FieldLabel
            htmlFor="event-image"
            className="text-xs font-semibold tracking-tighter uppercase opacity-70"
          >
            Event Image URL
          </FieldLabel>
          <FieldContent>
            <Input
              id="event-image"
              placeholder="https://example.com/event-banner.jpg"
              className="h-10 border-border/30 bg-background/20 transition-colors focus:border-primary/50"
              {...register("image")}
            />
            <FieldError className="mt-1 text-xs font-medium">
              {errors.image?.message}
            </FieldError>
          </FieldContent>
        </Field>

        {/* Event Type & Schedule Type Row */}
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Event Type */}
          <Field orientation="vertical">
            <FieldLabel
              htmlFor="event-type"
              className="text-xs font-semibold tracking-tighter uppercase opacity-70"
            >
              Event Type
            </FieldLabel>
            <FieldContent>
              <Controller
                name="eventType"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full border-border/30 bg-background/20 transition-colors focus:border-primary/50">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError className="mt-1 text-xs font-medium">
                {errors.eventType?.message}
              </FieldError>
            </FieldContent>
          </Field>

          {/* Languages */}
          <Field orientation="vertical">
            <FieldLabel
              htmlFor="event-languages"
              className="text-xs font-semibold tracking-tighter uppercase opacity-70"
            >
              Languages
            </FieldLabel>
            <FieldContent>
              <Input
                id="event-languages"
                placeholder="e.g. English, Sinhala, Tamil"
                className="h-10 border-border/30 bg-background/20 transition-colors focus:border-primary/50"
                {...register("languages")}
              />
            </FieldContent>
          </Field>
        </div>

        {/* Schedule Type Selector */}
        <Field orientation="vertical">
          <FieldLabel className="text-xs font-semibold tracking-tighter uppercase opacity-70">
            Schedule Type
          </FieldLabel>
          <FieldContent>
            <Controller
              name="scheduleType"
              control={control}
              render={({ field }) => (
                <div className="grid gap-3 sm:grid-cols-3">
                  {SCHEDULE_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => field.onChange(opt.value)}
                      className={cn(
                        "group relative flex flex-col items-start gap-1.5 rounded-xl border-2 p-4 text-left transition-all duration-200",
                        field.value === opt.value
                          ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                          : "border-border/30 bg-background/10 hover:border-border/60 hover:bg-background/30"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "flex size-3 items-center justify-center rounded-full border-2 transition-all",
                            field.value === opt.value
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/30"
                          )}
                        >
                          {field.value === opt.value && (
                            <div className="size-1.5 rounded-full bg-primary-foreground" />
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-sm font-semibold transition-colors",
                            field.value === opt.value
                              ? "text-primary"
                              : "text-foreground"
                          )}
                        >
                          {opt.label}
                        </span>
                      </div>
                      <span className="pl-5 text-[11px] leading-snug text-muted-foreground">
                        {opt.description}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            />
            <FieldError className="mt-1 text-xs font-medium">
              {errors.scheduleType?.message}
            </FieldError>
          </FieldContent>
        </Field>

        {/* Description */}
        <Field orientation="vertical">
          <FieldLabel
            htmlFor="event-description"
            className="text-xs font-semibold tracking-tighter uppercase opacity-70"
          >
            Description
          </FieldLabel>
          <FieldContent>
            <Textarea
              id="event-description"
              placeholder="Describe your event..."
              className="min-h-24 border-border/30 bg-background/20 transition-colors focus-visible:border-primary/50"
              {...register("description")}
            />
          </FieldContent>
        </Field>
      </FieldGroup>
    </div>
  )
}
