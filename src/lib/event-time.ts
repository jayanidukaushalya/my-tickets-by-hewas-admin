import { format } from "date-fns"

const EVENT_UTC_OFFSET = "+05:30"
const EVENT_UTC_OFFSET_MINUTES = 330

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function toEventDateKey(value: string): string {
  if (DATE_KEY_PATTERN.test(value)) return value
  return formatInEventTime(value, "yyyy-MM-dd")
}

export function eventDateTime(dateKey: string, time = "00:00"): Date {
  const fullTime = time.split(":").length === 2 ? `${time}:00` : time
  return new Date(`${dateKey}T${fullTime}${EVENT_UTC_OFFSET}`)
}

export function formatInEventTime(
  date: Date | string | number,
  pattern: string
): string {
  const instant = new Date(date)
  const wallClock = new Date(
    instant.getTime() +
      (EVENT_UTC_OFFSET_MINUTES + instant.getTimezoneOffset()) * 60_000
  )
  return format(wallClock, pattern)
}
