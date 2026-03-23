import { Button } from "@/components/ui/button"
import { getEventFn } from "@/server/actions/get-event.serverFn"
import { updateEventAction } from "@/server/actions/update-event.serverFn"
import { ImageUpload01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRouter } from "@tanstack/react-router"
import { useRef, useState } from "react"
import { toast } from "sonner"

type EventType = NonNullable<Awaited<ReturnType<typeof getEventFn>>>

export function EventBanner({ event }: { event: EventType }) {
  const router = useRouter()
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append("payload", JSON.stringify({ eventId: event.id }))
      formData.append("image", file)
      await updateEventAction({ data: formData })
      await router.invalidate()
      toast.success("Image updated successfully")
    } catch {
      toast.error("Failed to update image")
    } finally {
      setIsUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/50">
      <img
        src={event.image || "https://placehold.co/600x400?text=No+Image"}
        alt={event.name}
        className="aspect-video w-full object-cover transition-opacity group-hover:opacity-80"
      />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="secondary"
          className="gap-2 backdrop-blur-md"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingImage}
        >
          <HugeiconsIcon icon={ImageUpload01Icon} className="size-4" />
          {isUploadingImage ? "Uploading..." : "Change Image"}
        </Button>
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
        />
      </div>
    </div>
  )
}
