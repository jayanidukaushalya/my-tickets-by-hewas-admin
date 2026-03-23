import { Button } from "@/components/ui/button"

export interface PaginationControlsProps {
  page: number
  total: number
  limit: number
  setPage: (page: number) => void
}

export function PaginationControls({
  page,
  total,
  limit,
  setPage,
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit))

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/40 bg-card/30 px-6 py-4 backdrop-blur-xl">
      <p className="text-sm font-medium text-muted-foreground">
        Showing{" "}
        <span className="text-foreground">
          {Math.min((page - 1) * limit + 1, total)}
        </span>{" "}
        to{" "}
        <span className="text-foreground">{Math.min(page * limit, total)}</span>{" "}
        of <span className="text-foreground">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
        >
          Previous
        </Button>
        <div className="flex h-9 items-center justify-center px-4 text-sm font-medium">
          Page {page} of {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
