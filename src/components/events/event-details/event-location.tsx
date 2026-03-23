import { LocationMap } from "@/components/location-map"
import { LocationPicker } from "@/components/location-picker"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { GOOGLE_MAPS_DEFAULT_CENTER } from "@/integrations/google-maps"
import { getEventFn } from "@/server/actions/get-event.serverFn"
import { updateEventAction } from "@/server/actions/update-event.serverFn"
import { zodResolver } from "@hookform/resolvers/zod"
import { Location01Icon, PencilEdit01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod/v3"

const locSchema = z.object({
  venue: z.string().min(1, "Venue Name is required"),
  address: z.string().optional(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
})

type EventType = NonNullable<Awaited<ReturnType<typeof getEventFn>>>

export function EventLocation({ event }: { event: EventType }) {
  const router = useRouter()
  const [isEditingLoc, setIsEditingLoc] = useState(false)
  const locForm = useForm<z.infer<typeof locSchema>>({
    resolver: zodResolver(locSchema),
    defaultValues: {
      venue: event.location?.venue || "",
      address: event.location?.address || "",
      lat: event.location?.latitude
        ? parseFloat(event.location.latitude)
        : GOOGLE_MAPS_DEFAULT_CENTER.lat,
      lng: event.location?.longitude
        ? parseFloat(event.location.longitude)
        : GOOGLE_MAPS_DEFAULT_CENTER.lng,
    },
  })

  const handleSaveLoc = async (data: z.infer<typeof locSchema>) => {
    try {
      const formData = new FormData()
      formData.append(
        "payload",
        JSON.stringify({
          eventId: event.id,
          venue: data.venue,
          address: data.address,
          lat: data.lat,
          lng: data.lng,
        })
      )
      await updateEventAction({ data: formData })
      await router.invalidate()
      setIsEditingLoc(false)
      toast.success("Location updated successfully")
    } catch {
      toast.error("Failed to update location")
    }
  }

  return (
    <div className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold">
          <HugeiconsIcon icon={Location01Icon} className="size-5 text-primary" />
          Location
        </h3>
        {!isEditingLoc && (
          <Button
            variant="ghost"
            size="sm"
            className="size-8 p-0"
            onClick={() => setIsEditingLoc(true)}
          >
            <HugeiconsIcon icon={PencilEdit01Icon} className="size-4" />
          </Button>
        )}
      </div>
      {isEditingLoc ? (
        <form
          onSubmit={locForm.handleSubmit(handleSaveLoc)}
          className="flex flex-col gap-4"
        >
          <FieldGroup className="gap-4">
            <Field orientation="vertical">
              <FieldLabel className="text-xs font-semibold tracking-tighter uppercase opacity-70">
                Venue Name
              </FieldLabel>
              <FieldContent>
                <Input
                  placeholder="e.g. Nelum Pokuna Theatre"
                  className="h-10 border-border/30 bg-background/20 transition-colors focus:border-primary/50"
                  {...locForm.register("venue")}
                />
                <FieldError className="mt-1 text-xs font-medium">
                  {locForm.formState.errors.venue?.message}
                </FieldError>
              </FieldContent>
            </Field>

            <Field orientation="vertical">
              <FieldLabel className="text-xs font-semibold tracking-tighter uppercase opacity-70">
                Address
              </FieldLabel>
              <FieldContent>
                <Textarea
                  placeholder="Full address of the venue"
                  className="min-h-20 border-border/30 bg-background/20 transition-colors focus-visible:border-primary/50"
                  {...locForm.register("address")}
                />
              </FieldContent>
            </Field>

            <Field orientation="vertical">
              <FieldLabel className="text-xs font-semibold tracking-tighter uppercase opacity-70">
                Pin Location on Map
              </FieldLabel>
              <FieldContent>
                <Controller
                  name="lat"
                  control={locForm.control}
                  render={() => (
                    <LocationPicker
                      value={{
                        lat:
                          locForm.getValues("lat") ??
                          GOOGLE_MAPS_DEFAULT_CENTER.lat,
                        lng:
                          locForm.getValues("lng") ??
                          GOOGLE_MAPS_DEFAULT_CENTER.lng,
                        label: locForm.getValues("venue"),
                      }}
                      onChange={(loc) => {
                        locForm.setValue("lat", loc.lat)
                        locForm.setValue("lng", loc.lng)

                        if (!locForm.getValues("address") && loc.address) {
                          locForm.setValue("address", loc.address)
                        }

                        if (!locForm.getValues("venue") && loc.name) {
                          locForm.setValue("venue", loc.name ?? "", {
                            shouldValidate: true,
                          })
                        }
                      }}
                    />
                  )}
                />
              </FieldContent>
            </Field>
          </FieldGroup>

          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsEditingLoc(false)
                locForm.reset()
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={locForm.formState.isSubmitting}
            >
              {locForm.formState.isSubmitting ? "Saving..." : "Save Location"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-foreground">
            {event.location?.venue || "TBD"}
          </span>
          {event.location?.address && (
            <span className="text-sm text-muted-foreground">
              {event.location.address}
            </span>
          )}
          {event.location?.latitude && event.location?.longitude && (
            <div className="mt-3 overflow-hidden rounded-lg">
              <LocationMap
                lat={parseFloat(event.location.latitude)}
                lng={parseFloat(event.location.longitude)}
                className="h-40 w-full"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
