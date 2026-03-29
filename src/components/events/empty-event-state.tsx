import { Button } from "@/components/ui/button"
import { Calendar03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"

export function EmptyEventState({
  hasFilters,
}: {
  hasFilters: boolean
}) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border/50 bg-card/40 text-center shadow-2xl backdrop-blur-2xl">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/50">
        <HugeiconsIcon
          icon={Calendar03Icon}
          className="size-8 text-muted-foreground/60"
        />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-bold tracking-tight uppercase">
          No events found
        </h3>
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase opacity-70">
          {hasFilters
            ? "Try adjusting your search criteria"
            : "Get started by creating your first event"}
        </p>
      </div>
      {!hasFilters && (
        <Button asChild variant="outline" className="mt-2 h-10 text-xs font-bold tracking-widest uppercase shadow-lg shadow-primary/10 transition-all active:scale-95">
          <Link to="/events/schedule">Schedule Event</Link>
        </Button>
      )}
    </div>
  )
}
