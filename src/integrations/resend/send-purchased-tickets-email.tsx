import { db } from "@/database"
import { orderLine } from "@/database/schema"
import { formatInEventTime } from "@/lib/event-time"
import { formatCurrency } from "@/lib/utils"
import { eq } from "drizzle-orm"
import QRCode from "qrcode"
import { sendEmail } from "./client"
import PurchasedTicketsEmail from "./templates/purchased-tickets-email"

function formatSlotLabel(slot: {
  startTime: Date | string
  endTime: Date | string | null
}): string {
  const start = formatInEventTime(slot.startTime, "h:mm a")
  if (slot.endTime) {
    return `${start} — ${formatInEventTime(slot.endTime, "h:mm a")}`
  }
  return `${start} Onwards`
}

function toFileSlug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "ticket"
  )
}

async function buildTicketQrAttachments(
  rows: { id: string; ticket: { name: string } }[]
) {
  return Promise.all(
    rows.map(async (row, index) => ({
      filename: `${String(index + 1).padStart(2, "0")}-${toFileSlug(row.ticket.name)}-qr.png`,
      content: await QRCode.toBuffer(row.id, {
        type: "png",
        errorCorrectionLevel: "M",
        margin: 1,
        width: 512,
      }),
      contentType: "image/png",
    }))
  )
}

export async function sendPurchasedTicketsConfirmationEmail(
  orderId: string
): Promise<void> {
  if (!orderId) return

  const rows = await db.query.orderLine.findMany({
    where: eq(orderLine.orderId, orderId),
    with: {
      order: {
        with: {
          customer: true,
        },
      },
      ticket: {
        with: {
          timeSlot: {
            with: {
              eventDate: {
                with: {
                  event: {
                    with: {
                      location: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (rows.length === 0) {
    console.warn(
      "[Resend] sendPurchasedTicketsConfirmationEmail: no order lines for order",
      orderId
    )
    return
  }

  const customer = rows[0].order.customer
  const emailTo = customer.email
  if (!emailTo) {
    console.warn(
      "[Resend] customer has no email; skipping purchase confirmation email"
    )
    return
  }

  const eventIds = new Set(
    rows.map((r) => r.ticket.timeSlot.eventDate.event.id)
  )
  const multiEvent = eventIds.size > 1

  const lines = rows.map((row) => {
    const ev = row.ticket.timeSlot.eventDate.event
    const ed = row.ticket.timeSlot.eventDate
    const sl = row.ticket.timeSlot
    const loc = ev.location
    const unit = Number.parseFloat(String(row.price))
    const lineTotal = unit * row.qty
    const base = {
      ticketName: row.ticket.name,
      qty: row.qty,
      unitPrice: formatCurrency(unit),
      lineTotal: formatCurrency(lineTotal),
    }
    if (multiEvent) {
      return {
        ...base,
        eventName: ev.name,
        eventDateLabel: formatInEventTime(ed.date, "EEEE, MMMM do, yyyy"),
        timeSlotLabel: formatSlotLabel(sl),
        venueName: loc?.venue ?? "Venue TBA",
        venueAddress: loc?.address,
      }
    }
    return base
  })

  const grand = rows.reduce((sum, row) => {
    const unit = Number.parseFloat(String(row.price))
    return sum + unit * row.qty
  }, 0)

  const first = rows[0]!
  const primaryEvent = first.ticket.timeSlot.eventDate.event
  const slot = first.ticket.timeSlot
  const loc = primaryEvent.location

  const customerName =
    [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim() ||
    emailTo.split("@")[0] ||
    "Valued Guest"

  const eventDateLabel = formatInEventTime(
    first.ticket.timeSlot.eventDate.date,
    "EEEE, MMMM do, yyyy"
  )
  const timeSlotLabel = formatSlotLabel(slot)

  const subject = multiEvent
    ? `Your tickets — ${lines.length} item(s)`
    : `Your tickets — ${primaryEvent.name}`

  const attachments = await buildTicketQrAttachments(rows)

  await sendEmail({
    to: emailTo,
    subject,
    attachments,
    react: (
      <PurchasedTicketsEmail
        customerName={customerName}
        customerEmail={emailTo}
        eventName={multiEvent ? "Your tickets" : primaryEvent.name}
        eventDateLabel={multiEvent ? "—" : eventDateLabel}
        timeSlotLabel={multiEvent ? "—" : timeSlotLabel}
        venueName={multiEvent ? "—" : (loc?.venue ?? "Venue TBA")}
        venueAddress={multiEvent ? null : loc?.address}
        lines={lines}
        grandTotal={formatCurrency(grand)}
        orderReference={orderId}
        multiEvent={multiEvent}
      />
    ),
  })
}
