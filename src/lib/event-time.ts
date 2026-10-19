import { format } from "date-fns"

/**
 * All events happen in Sri Lanka (Asia/Colombo), which has a fixed UTC+05:30
 * offset with no daylight saving. Event dates and times are interpreted and
 * displayed in this zone regardless of the server's or browser's time zone.
 */
const EVENT_UTC_OFFSET = "+05:30"
const EVENT_UTC_OFFSET_MINUTES = 330

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/**
 * Normalises a form date value to a `yyyy-MM-dd` calendar date in event time.
 * Accepts a plain date key or a full ISO timestamp (older form payloads).
 */
export function toEventDateKey(value: string): string {
  if (DATE_KEY_PATTERN.test(value)) return value
  return formatInEventTime(value, "yyyy-MM-dd")
}

/**
 * Builds the instant for a calendar date and optional `HH:mm[:ss]` time in
 * event time, e.g. `eventDateTime("2026-04-16", "14:30")`.
 */
export function eventDateTime(dateKey: string, time = "00:00"): Date {
  const fullTime = time.split(":").length === 2 ? `${time}:00` : time
  return new Date(`${dateKey}T${fullTime}${EVENT_UTC_OFFSET}`)
}

/**
 * Formats an instant with date-fns as wall-clock time in event time.
 */
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
