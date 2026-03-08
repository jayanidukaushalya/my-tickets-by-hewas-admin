import { Button } from "@/components/ui/button"
import { ArrowLeft02Icon, Home01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useNavigate, useRouter } from "@tanstack/react-router"

export function NotFound() {
  const navigate = useNavigate()
  const router = useRouter()

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background p-6">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-secondary/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-lg space-y-6 text-center">
        <div className="relative mb-4 inline-block">
          <h1 className="bg-linear-to-b from-foreground to-foreground/20 bg-clip-text text-[10rem] leading-none font-black tracking-tighter text-transparent select-none md:text-[12rem]">
            404
          </h1>
          <div className="absolute inset-0 flex translate-y-8 items-center justify-center">
            <span className="rounded-full border border-border/50 bg-background/80 px-4 py-1.5 text-xs font-bold tracking-widest text-primary uppercase shadow-xl backdrop-blur-md">
              Lost in Space
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Page Not Found</h2>
          <p className="mx-auto max-w-md text-muted-foreground">
            The page you are looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col justify-center gap-3 pt-4 sm:flex-row">
          <Button
            variant="outline"
            className="h-11 gap-2 rounded-full px-6 font-medium"
            onClick={() => router.history.back()}
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
            Go Back
          </Button>
          <Button
            className="h-11 gap-2 rounded-full px-6 font-medium"
            onClick={() => navigate({ to: "/" })}
          >
            <HugeiconsIcon icon={Home01Icon} className="size-4" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  )
}
