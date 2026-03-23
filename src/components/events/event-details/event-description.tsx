import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { getEventFn } from "@/server/actions/get-event.serverFn"
import { updateEventAction } from "@/server/actions/update-event.serverFn"
import { zodResolver } from "@hookform/resolvers/zod"
import { PencilEdit01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod/v3"

const descSchema = z.object({
  description: z.string().optional(),
})

type EventType = NonNullable<Awaited<ReturnType<typeof getEventFn>>>

export function EventDescription({ event }: { event: EventType }) {
  const router = useRouter()
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const descForm = useForm<z.infer<typeof descSchema>>({
    resolver: zodResolver(descSchema),
    defaultValues: { description: event.description || "" },
  })

  const handleSaveDesc = async (data: z.infer<typeof descSchema>) => {
    try {
      const formData = new FormData()
      formData.append(
        "payload",
        JSON.stringify({ eventId: event.id, description: data.description })
      )
      await updateEventAction({ data: formData })
      await router.invalidate()
      setIsEditingDesc(false)
      toast.success("Description updated successfully")
    } catch {
      toast.error("Failed to update description")
    }
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-card/50 p-6 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">About this event</h2>
        {!isEditingDesc && (
          <Button
            variant="ghost"
            size="sm"
            className="size-8 p-0"
            onClick={() => setIsEditingDesc(true)}
          >
            <HugeiconsIcon icon={PencilEdit01Icon} className="size-4" />
          </Button>
        )}
      </div>
      {isEditingDesc ? (
        <form
          onSubmit={descForm.handleSubmit(handleSaveDesc)}
          className="flex flex-col gap-3"
        >
          <Textarea
            {...descForm.register("description")}
            placeholder="Write a description for your event..."
            className="min-h-32 bg-background/50"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsEditingDesc(false)
                descForm.reset()
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={descForm.formState.isSubmitting}
            >
              {descForm.formState.isSubmitting
                ? "Saving..."
                : "Save Description"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
          {event.description ? (
            <p className="whitespace-pre-wrap">{event.description}</p>
          ) : (
            <p className="italic">No description provided.</p>
          )}
        </div>
      )}
    </div>
  )
}
