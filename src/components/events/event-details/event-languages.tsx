import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getEventFn } from "@/server/actions/get-event.serverFn"
import { updateEventAction } from "@/server/actions/update-event.serverFn"
import { zodResolver } from "@hookform/resolvers/zod"
import { LanguageSkillIcon, PencilEdit01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod/v3"

const langSchema = z.object({
  languages: z.string().optional(),
})

type EventType = NonNullable<Awaited<ReturnType<typeof getEventFn>>>

export function EventLanguages({ event }: { event: EventType }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const form = useForm<z.infer<typeof langSchema>>({
    resolver: zodResolver(langSchema),
    defaultValues: { languages: event.languages || "" },
  })

  const handleSave = async (data: z.infer<typeof langSchema>) => {
    try {
      const formData = new FormData()
      formData.append(
        "payload",
        JSON.stringify({ eventId: event.id, languages: data.languages })
      )
      await updateEventAction({ data: formData })
      setIsEditing(false)
      toast.success("Languages updated successfully")
      void router.invalidate()
    } catch {
      toast.error("Failed to update languages")
    }
  }

  return (
    <div className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-xl transition-all">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold">
          <HugeiconsIcon icon={LanguageSkillIcon} className="size-5 text-primary" />
          Languages
        </h3>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="size-8 p-0"
          >
            <HugeiconsIcon icon={PencilEdit01Icon} className="size-4" />
          </Button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={form.handleSubmit(handleSave)} className="flex flex-col gap-3">
          <Input
            autoFocus
            {...form.register("languages")}
            placeholder="e.g. English, Sinhala"
            className="h-9 bg-background/50 text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsEditing(false)
                form.reset()
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="font-medium text-foreground">
          {event.languages ? (
            event.languages
          ) : (
            <span className="text-sm italic font-normal text-muted-foreground">Not specified</span>
          )}
        </div>
      )}
    </div>
  )
}
