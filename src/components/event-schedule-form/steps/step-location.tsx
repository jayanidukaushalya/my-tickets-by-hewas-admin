import { LocationPicker } from "@/components/location-picker"
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Controller, useFormContext } from "react-hook-form"
import type { EventFormValues } from "../schema"

  export function StepLocation() {
  const {
    register,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<EventFormValues>()

  return (
    <div className="animate-in space-y-6 duration-500 fade-in slide-in-from-right-4">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">Event Location</h2>
        <p className="text-sm font-medium tracking-wide text-muted-foreground opacity-60">
          Where will your event take place?
        </p>
      </div>

      <FieldGroup className="gap-5">
        {/* Venue Name */}
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

        {/* Address */}
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

        {/* Google Maps picker */}
        <Field orientation="vertical">
          <FieldLabel className="text-xs font-semibold tracking-tighter uppercase opacity-70">
            Pin Location on Map
          </FieldLabel>
          <FieldContent>
            <Controller
              name="lat"
              control={control}
              render={() => (
                <LocationPicker
                  value={undefined}
                  onChange={(loc) => {
                    setValue("lat", loc.lat)
                    setValue("lng", loc.lng)

                    if (!getValues("address") && loc.address) {
                      setValue("address", loc.address)
                    }

                    if (!getValues("venue") && loc.name) {
                      setValue("venue", loc.name ?? "")
                    }
                  }}
                />
              )}
            />
          </FieldContent>
        </Field>
      </FieldGroup>
    </div>
  )
}
