import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Location01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useFormContext } from "react-hook-form"
import type { EventFormValues } from "../schema"

export function StepLocation() {
  const {
    register,
    formState: { errors },
  } = useFormContext<EventFormValues>()

  return (
    <div className="animate-in space-y-6 duration-500 fade-in slide-in-from-right-4">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">Event Location</h2>
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase opacity-60">
          Where will your event take place?
        </p>
      </div>

      <FieldGroup className="gap-5">
        <Field orientation="vertical">
          <FieldLabel
            htmlFor="venue"
            className="text-xs font-semibold tracking-tighter uppercase opacity-70"
          >
            Venue Name
          </FieldLabel>
          <FieldContent>
            <Input
              id="venue"
              placeholder="e.g. Nelum Pokuna Theatre"
              className="h-10 border-border/30 bg-background/20 transition-colors focus:border-primary/50"
              {...register("venue")}
            />
            <FieldError className="mt-1 text-xs font-medium">
              {errors.venue?.message}
            </FieldError>
          </FieldContent>
        </Field>

        <Field orientation="vertical">
          <FieldLabel
            htmlFor="address"
            className="text-xs font-semibold tracking-tighter uppercase opacity-70"
          >
            Address
          </FieldLabel>
          <FieldContent>
            <Textarea
              id="address"
              placeholder="Full address of the venue"
              className="min-h-20 border-border/30 bg-background/20 transition-colors focus-visible:border-primary/50"
              {...register("address")}
            />
          </FieldContent>
        </Field>

        {/* Google Maps Placeholder */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold tracking-tighter uppercase opacity-70">
            Pin Location on Map
          </span>
          <div className="flex h-48 items-center justify-center rounded-xl border-2 border-dashed border-border/30 bg-muted/10">
            <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
              <HugeiconsIcon
                icon={Location01Icon}
                className="size-8"
                strokeWidth={1.5}
              />
              <span className="text-xs font-medium">
                Google Maps integration coming soon
              </span>
            </div>
          </div>
        </div>
      </FieldGroup>
    </div>
  )
}
