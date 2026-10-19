import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  Calendar03Icon,
  Cancel01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { format } from "date-fns"

interface PurchaseFiltersProps {
  search: string
  dateFrom: string | null
  dateTo: string | null
  isActivated: boolean | null
  onSearchChange: (val: string) => void
  onDateRangeChange: (val: { from?: string; to?: string } | null) => void
  onIsActivatedChange: (val: boolean | null) => void
}

export function PurchaseFilters({
  search,
  dateFrom,
  dateTo,
  isActivated,
  onSearchChange,
  onDateRangeChange,
  onIsActivatedChange,
}: PurchaseFiltersProps) {
  const selectedRange = {
    from: dateFrom ? new Date(dateFrom) : undefined,
    to: dateTo ? new Date(dateTo) : undefined,
  }

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="relative w-full">
        <HugeiconsIcon
          icon={Search01Icon}
          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/70"
        />
        <Input
          placeholder="Search by event or customer..."
          className="h-10 w-full border-border/30 bg-background/20 pl-9 backdrop-blur-2xl transition-colors hover:bg-card/60 focus:border-primary/50"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="relative w-full">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-10 w-full justify-start border-border/30 bg-background/20 font-normal backdrop-blur-2xl transition-colors hover:bg-card/60 hover:text-foreground focus:border-primary/50",
                !selectedRange.from && "text-muted-foreground"
              )}
            >
              <HugeiconsIcon
                icon={Calendar03Icon}
                className="mr-2 size-4 shrink-0"
                strokeWidth={2}
              />
              <span className="truncate">
                {selectedRange.from ? (
                  selectedRange.to ? (
                    <>
                      {format(selectedRange.from, "LLL dd, y")} -{" "}
                      {format(selectedRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(selectedRange.from, "LLL dd, y")
                  )
                ) : (
                  "Filter by Purchase Date"
                )}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              defaultMonth={selectedRange.from}
              selected={selectedRange}
              onSelect={(range) => {
                if (!range) {
                  onDateRangeChange(null)
                  return
                }
                onDateRangeChange({
                  from: range.from
                    ? format(range.from, "yyyy-MM-dd")
                    : undefined,
                  to: range.to ? format(range.to, "yyyy-MM-dd") : undefined,
                })
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
        {selectedRange.from && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="absolute top-1/2 right-2 -translate-y-1/2 opacity-70 hover:opacity-100"
            onClick={() => onDateRangeChange(null)}
            aria-label="Clear date range"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              className="size-3.5"
              strokeWidth={2}
            />
          </Button>
        )}
      </div>

      <div className="w-full">
        <Select
          value={isActivated === null ? "all" : isActivated ? "true" : "false"}
          onValueChange={(val) =>
            onIsActivatedChange(val === "all" ? null : val === "true")
          }
        >
          <SelectTrigger className="h-10 w-full border-border/30 bg-background/20 backdrop-blur-2xl transition-colors hover:bg-card/60 focus:border-primary/50">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="true">Used / Activated</SelectItem>
            <SelectItem value="false">Unused</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
