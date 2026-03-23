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
import { EventType } from "@/enums/event-type.enum"
import { ScheduleType } from "@/enums/schedule-type.enum"
import { cn, formatEnum } from "@/lib/utils"
import {
  Calendar03Icon,
  Cancel01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { format } from "date-fns"

interface EventFiltersProps {
  search: string
  eventType: EventType | null
  scheduleType: ScheduleType | null
  dateFrom: string | null
  dateTo: string | null
  onSearchChange: (val: string) => void
  onEventTypeChange: (val: EventType | null) => void
  onScheduleTypeChange: (val: ScheduleType | null) => void
  onDateRangeChange: (val: { from?: string; to?: string } | null) => void
}



export function EventFilters({
  search,
  eventType,
  scheduleType,
  dateFrom,
  dateTo,
  onSearchChange,
  onEventTypeChange,
  onScheduleTypeChange,
  onDateRangeChange,
}: EventFiltersProps) {
  const selectedRange = {
    from: dateFrom ? new Date(dateFrom) : undefined,
    to: dateTo ? new Date(dateTo) : undefined,
  }

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="relative w-full">
        <HugeiconsIcon
          icon={Search01Icon}
          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search events..."
          className="h-10 w-full border-border/40 bg-card/50 pl-9 backdrop-blur-xl transition-colors hover:bg-card/60 focus:border-primary/50 dark:bg-card/50 dark:hover:bg-card/60"
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
                "h-10 w-full justify-start border-border/40 bg-card/50 font-normal transition-colors hover:bg-card/60 hover:text-foreground focus:border-primary/50 dark:border-border/40 dark:bg-card/50 dark:hover:bg-card/60",
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
                  "Filter by Date"
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
          value={eventType || "all"}
          onValueChange={(val) =>
            onEventTypeChange(val === "all" ? null : (val as EventType))
          }
        >
          <SelectTrigger className="h-10 w-full border-border/40 bg-card/50 backdrop-blur-xl transition-colors hover:bg-card/60 focus:border-primary/50 dark:bg-card/50 dark:hover:bg-card/60">
            <SelectValue placeholder="All Event Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Event Types</SelectItem>
            {Object.values(EventType).map((type) => (
              <SelectItem key={type} value={type}>
                {formatEnum(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full">
        <Select
          value={scheduleType || "all"}
          onValueChange={(val) =>
            onScheduleTypeChange(val === "all" ? null : (val as ScheduleType))
          }
        >
          <SelectTrigger className="h-10 w-full border-border/40 bg-card/50 backdrop-blur-xl transition-colors hover:bg-card/60 focus:border-primary/50 dark:bg-card/50 dark:hover:bg-card/60">
            <SelectValue placeholder="All Schedule Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Schedule Types</SelectItem>
            {Object.values(ScheduleType).map((type) => (
              <SelectItem key={type} value={type}>
                {formatEnum(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
