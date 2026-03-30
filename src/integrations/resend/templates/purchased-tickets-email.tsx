import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components"

export type PurchasedTicketLine = {
  ticketName: string
  qty: number
  unitPrice: string
  lineTotal: string
  eventName?: string
  eventDateLabel?: string
  timeSlotLabel?: string
  venueName?: string
  venueAddress?: string | null
}

export type PurchasedTicketsEmailProps = {
  customerName: string
  customerEmail: string
  eventName: string
  eventDateLabel: string
  timeSlotLabel: string
  venueName: string
  venueAddress?: string | null
  lines: PurchasedTicketLine[]
  grandTotal: string
  orderReference: string
  multiEvent: boolean
}

export default function PurchasedTicketsEmail({
  customerName,
  customerEmail,
  eventName,
  eventDateLabel,
  timeSlotLabel,
  venueName,
  venueAddress,
  lines,
  grandTotal,
  orderReference,
  multiEvent,
}: PurchasedTicketsEmailProps) {
  return (
    <Html>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: {
                  primary: "#14a851",
                  foreground: "#27272a",
                  muted: "#71717a",
                  border: "#e4e4e7",
                  bg: "#ffffff",
                },
              },
            },
          },
        }}
      >
        <Head />
        <Preview>
          {multiEvent
            ? `Your ticket order — ${lines.length} item(s)`
            : `Your ticket order for ${eventName} — ${eventDateLabel}`}
        </Preview>
        <Body className="text-brand-foreground bg-zinc-50 font-sans">
          <Container className="mx-auto max-w-[560px] px-5 py-8">
            <Section className="mb-8 text-center">
              <div className="bg-brand-primary/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
                <div className="bg-brand-primary h-6 w-6 rounded-full" />
              </div>
              <Heading className="m-0 text-[28px] leading-tight font-bold text-zinc-900">
                You are booked!
              </Heading>
            </Section>

            <Text className="mb-4 text-[15px] leading-relaxed">
              Hi{" "}
              <span className="font-semibold text-zinc-900">
                {customerName}
              </span>
              ,
            </Text>
            <Text className="text-brand-muted mb-8 text-[15px] leading-relaxed">
              Thanks for your purchase. We've confirmed your order. You can find
              your tickets in the app or shows the order reference below at the
              entrance.
            </Text>

            <Section className="border-brand-border mb-8 overflow-hidden rounded-xl border bg-white shadow-sm">
              <div className="bg-brand-primary px-6 py-2">
                <Text className="m-0 text-[11px] font-bold tracking-widest text-white/90 uppercase">
                  Confirmed Order
                </Text>
              </div>
              <div className="p-6">
                <Text className="text-brand-muted mb-1 text-[11px] font-bold tracking-wider uppercase">
                  Order reference
                </Text>
                <Text className="text-brand-primary m-0 font-mono text-[16px] font-semibold break-all">
                  {orderReference}
                </Text>
                <Text className="text-brand-muted m-0 mt-3 text-[13px]">
                  {customerEmail}
                </Text>
              </div>
            </Section>

            {!multiEvent ? (
              <Section className="mb-6">
                <Heading
                  as="h2"
                  className="m-0 mb-4 text-[20px] font-bold text-zinc-900"
                >
                  {eventName}
                </Heading>
                <div className="space-y-3">
                  <Text className="m-0 text-[14px] leading-relaxed">
                    <span className="font-semibold text-zinc-900">Date:</span>{" "}
                    {eventDateLabel}
                  </Text>
                  <Text className="m-0 text-[14px] leading-relaxed">
                    <span className="font-semibold text-zinc-900">Time:</span>{" "}
                    {timeSlotLabel}
                  </Text>
                  <Text className="m-0 text-[14px] leading-relaxed">
                    <span className="font-semibold text-zinc-900">Venue:</span>{" "}
                    {venueName}
                    {venueAddress && (
                      <span className="text-brand-muted mt-0.5 block text-[13px]">
                        {venueAddress}
                      </span>
                    )}
                  </Text>
                </div>
              </Section>
            ) : (
              <Section className="mb-6">
                <Heading
                  as="h2"
                  className="m-0 mb-4 text-[20px] font-bold text-zinc-900"
                >
                  {eventName}
                </Heading>
              </Section>
            )}

            <Hr className="border-brand-border my-8" />

            <Section className="mb-8">
              <Heading
                as="h3"
                className="text-brand-muted m-0 mb-5 text-[16px] font-bold tracking-wider uppercase"
              >
                Your Tickets
              </Heading>
              {lines.map((line, i) => (
                <Section
                  key={i}
                  className="mb-5 border-b border-zinc-100 pb-5 last:border-0 last:pb-0"
                >
                  {multiEvent && line.eventName && (
                    <div className="mb-3">
                      <Text className="m-0 mb-1 text-[17px] font-bold text-zinc-900">
                        {line.eventName}
                      </Text>
                      <Text className="text-brand-muted m-0 text-[13px]">
                        {line.eventDateLabel} • {line.timeSlotLabel}
                      </Text>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <Text className="m-0 text-[15px] font-semibold text-zinc-900">
                        {line.ticketName}
                      </Text>
                      <Text className="text-brand-muted m-0 mt-1 text-[13px]">
                        {line.qty} × {line.unitPrice}
                      </Text>
                    </div>
                    <Text className="m-0 text-[15px] font-bold text-zinc-900">
                      {line.lineTotal}
                    </Text>
                  </div>
                </Section>
              ))}
            </Section>

            <Section className="border-brand-primary rounded-xl border-l-4 bg-zinc-900 p-6 shadow-lg">
              <Text className="m-0 mb-1 text-[11px] font-bold tracking-widest text-zinc-400 uppercase">
                Total Paid
              </Text>
              <Text className="m-0 text-[28px] font-bold text-white">
                {grandTotal}
              </Text>
            </Section>

            <Hr className="border-brand-border my-10" />

            <Text className="text-brand-muted m-0 text-center text-[12px] leading-relaxed">
              You are receiving this because you made a purchase on our
              platform.
              <br />
              Need help? Reply to this email or visit our support center.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
