type SlotTimes = {
  startTime: Date | string
  endTime: Date | string | null
}

export function isEventExpired(
  eventDates: Array<{ timeSlots: Array<SlotTimes> }> | undefined,
  now = Date.now()
): boolean {
  const slotEnds = (eventDates ?? []).flatMap((date) =>
    date.timeSlots.map((slot) =>
      new Date(slot.endTime ?? slot.startTime).getTime()
    )
  )
  return slotEnds.length > 0 && slotEnds.every((end) => end <= now)
}
