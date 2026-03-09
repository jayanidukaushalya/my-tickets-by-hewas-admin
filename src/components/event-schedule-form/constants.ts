import { EventType } from "@/enums/event-type.enum"
import { ScheduleType } from "@/enums/schedule-type.enum"
import {
  Calendar03Icon,
  CheckmarkCircle02Icon,
  Location01Icon,
  TextIcon,
  Ticket01Icon,
} from "@hugeicons/core-free-icons"

export const EVENT_TYPE_OPTIONS = Object.values(EventType).map((v) => ({
  value: v,
  label: v.charAt(0).toUpperCase() + v.slice(1),
}))

export const SCHEDULE_TYPE_OPTIONS = [
  {
    value: ScheduleType.ONE_TIME,
    label: "One Time",
    description: "Single date with one time slot",
  },
  {
    value: ScheduleType.MULTI_TIME,
    label: "Multi Time",
    description: "Single date with multiple time slots",
  },
  {
    value: ScheduleType.MULTI_DAY,
    label: "Multi Day",
    description: "Multiple dates with multiple time slots",
  },
]

export const STEPS = [
  { id: 0, title: "Basic Info", icon: TextIcon },
  { id: 1, title: "Schedule", icon: Calendar03Icon },
  { id: 2, title: "Location", icon: Location01Icon },
  { id: 3, title: "Tickets", icon: Ticket01Icon },
  { id: 4, title: "Review", icon: CheckmarkCircle02Icon },
]
