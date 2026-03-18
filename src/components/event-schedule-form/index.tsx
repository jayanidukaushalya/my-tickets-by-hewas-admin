import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScheduleType } from "@/enums/schedule-type.enum"
import { GOOGLE_MAPS_DEFAULT_CENTER } from "@/integrations/google-maps"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useCallback, useState } from "react"
import { FormProvider, useForm, type FieldPath } from "react-hook-form"
import { STEPS } from "./constants"
import { eventFormSchema, type EventFormValues } from "./schema"
import { StepIndicator } from "./step-indicator"
import { StepBasicInfo } from "./steps/step-basic-info"
import { StepLocation } from "./steps/step-location"
import { StepReview } from "./steps/step-review"
import { StepSchedule } from "./steps/step-schedule"
import { StepTickets } from "./steps/step-tickets"

interface EventScheduleFormProps {
  googleMapsApiKey: string
  googleMapsMapId: string
}

export function EventScheduleForm({
  googleMapsApiKey,
  googleMapsMapId,
}: EventScheduleFormProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: "",
      image: "",
      eventType: "",
      scheduleType: ScheduleType.ONE_TIME,
      languages: "",
      description: "",
      venue: "",
      address: "",
      lat: GOOGLE_MAPS_DEFAULT_CENTER.lat,
      lng: GOOGLE_MAPS_DEFAULT_CENTER.lng,
      eventDates: [
        {
          date: "",
          timeSlots: [
            {
              startTime: "10:30",
              endTime: "12:30",
              tickets: [{ name: "", price: "", qty: "" }],
            },
          ],
        },
      ],
    },
    mode: "onBlur",
  })

  const { handleSubmit, watch, trigger } = form

  const validateStep = useCallback(
    async (step: number): Promise<boolean> => {
      switch (step) {
        case 0:
          return trigger(["name", "image", "eventType", "scheduleType"])
        case 1: {
          const eventDates = watch("eventDates")
          const scheduleType = watch("scheduleType")
          const paths: FieldPath<EventFormValues>[] = []

          // Build paths for specific fields to trigger (excluding nested tickets)
          eventDates.forEach((_, dIdx) => {
            paths.push(`eventDates.${dIdx}.date`)
            eventDates[dIdx].timeSlots.forEach((_, sIdx) => {
              paths.push(`eventDates.${dIdx}.timeSlots.${sIdx}.startTime`)
              paths.push(`eventDates.${dIdx}.timeSlots.${sIdx}.endTime`)
            })
          })

          // Trigger base field validation
          const isValid = await trigger(paths)
          if (!isValid) return false

          // Manual check for array length requirements (matching schema refinements)
          if (scheduleType === ScheduleType.MULTI_TIME) {
            const hasMinSlots = eventDates.every(
              (ed) => ed.timeSlots.length >= 2
            )
            if (!hasMinSlots) {
              await trigger("eventDates") // Trigger to show the array-level errors
              return false
            }
          }

          if (scheduleType === ScheduleType.MULTI_DAY) {
            if (eventDates.length < 2) {
              await trigger("eventDates")
              return false
            }
            const hasMinSlots = eventDates.every(
              (ed) => ed.timeSlots.length >= 2
            )
            if (!hasMinSlots) {
              await trigger("eventDates")
              return false
            }
          }

          return true
        }
        case 2:
          return trigger(["venue"])
        case 3:
          return trigger(["eventDates"])
        default:
          return true
      }
    },
    [trigger, watch]
  )

  const handleNext = useCallback(async () => {
    const isValid = await validateStep(currentStep)
    if (isValid && currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1)
    }
  }, [currentStep, validateStep])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
    }
  }, [currentStep])

  const handleStepClick = useCallback(
    async (step: number) => {
      if (step < currentStep) {
        setCurrentStep(step)
      } else if (step === currentStep + 1) {
        const isValid = await validateStep(currentStep)
        if (isValid) setCurrentStep(step)
      }
    },
    [currentStep, validateStep]
  )

  const onSubmit = (data: EventFormValues) => {
    console.log("Event form data:", data)
    // Server integration to be done later
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Step Indicator */}
        <Card className="overflow-hidden border-border/40 bg-card/30 shadow-lg backdrop-blur-2xl">
          <CardContent className="py-2">
            <StepIndicator
              currentStep={currentStep}
              onStepClick={handleStepClick}
            />
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card className="overflow-visible border-border/40 bg-card/30 shadow-lg backdrop-blur-2xl">
          <CardContent>
            {currentStep === 0 && <StepBasicInfo />}
            {currentStep === 1 && <StepSchedule />}
            {currentStep === 2 && (
              <StepLocation
                googleMapsApiKey={googleMapsApiKey}
                googleMapsMapId={googleMapsMapId}
              />
            )}
            {currentStep === 3 && <StepTickets />}
            {currentStep === 4 && (
              <StepReview
                googleMapsApiKey={googleMapsApiKey}
                googleMapsMapId={googleMapsMapId}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            className="w-24"
            size="lg"
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              className="size-4"
              strokeWidth={2}
            />
            Previous
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button
              type="button"
              size="lg"
              onClick={handleNext}
              className="w-24"
            >
              Next
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="size-4"
                strokeWidth={2}
              />
            </Button>
          ) : (
            <Button type="submit" size="lg">
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                className="size-4"
                strokeWidth={2}
              />
              Create Event
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  )
}
