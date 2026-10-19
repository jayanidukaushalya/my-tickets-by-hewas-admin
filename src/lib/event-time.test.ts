import { describe, expect, it } from "vitest"
import { eventDateTime, formatInEventTime, toEventDateKey } from "./event-time"

describe("event time", () => {
  it("builds instants in Asia/Colombo regardless of runtime time zone", () => {
    expect(eventDateTime("2026-04-16").toISOString()).toBe(
      "2026-04-15T18:30:00.000Z"
    )
    expect(eventDateTime("2026-04-16", "14:30").toISOString()).toBe(
      "2026-04-16T09:00:00.000Z"
    )
  })

  it("normalises date keys and legacy ISO payloads to the Colombo date", () => {
    expect(toEventDateKey("2026-04-16")).toBe("2026-04-16")
    // Old form payload: local midnight Apr 16 in Colombo serialised as UTC
    expect(toEventDateKey("2026-04-15T18:30:00.000Z")).toBe("2026-04-16")
  })

  it("formats instants as Colombo wall-clock time", () => {
    expect(
      formatInEventTime("2026-04-16T09:00:00.000Z", "yyyy-MM-dd HH:mm")
    ).toBe("2026-04-16 14:30")
    expect(formatInEventTime(new Date("2026-04-15T18:30:00Z"), "PPP")).toBe(
      "April 16th, 2026"
    )
  })
})
