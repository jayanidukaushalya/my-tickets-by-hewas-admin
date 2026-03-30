import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"
import { getEventFn } from "@/server/actions/get-event.serverFn"
import { increaseTicketQtyAction } from "@/server/actions/increase-ticket-qty.serverFn"
import { saveTicketAction } from "@/server/actions/save-ticket.serverFn"
import {
  Add01Icon,
  Calendar03Icon,
  Cancel01Icon,
  Clock01Icon,
  Ticket01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRouter } from "@tanstack/react-router"
import { format } from "date-fns"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

type EventDatesType = NonNullable<
  Awaited<ReturnType<typeof getEventFn>>
>["eventDates"]

type TicketType = EventDatesType[number]["timeSlots"][number]["tickets"][number]

function TicketIncreaseForm({
  t,
  onCancelEditing,
}: {
  t: TicketType
  onCancelEditing: () => void
}) {
  const router = useRouter()
  const soldCount = t.orderLines.reduce((acc, p) => acc + p.qty, 0)
  const availableCount = Math.max(0, t.qty - soldCount)
  const priceText = Number(t.price) === 0 ? "Free" : formatCurrency(t.price)

  const form = useForm({
    defaultValues: { addQty: "" },
  })

  const addQtyValue = form.watch("addQty")
  const addQtyNumber = parseInt(addQtyValue || "", 10)
  const canSubmit = Number.isFinite(addQtyNumber) && addQtyNumber > 0

  const handleIncrease = async (data: { addQty: string }) => {
    const addQty = parseInt(data.addQty, 10)
    if (!Number.isFinite(addQty) || addQty <= 0) {
      toast.error("Enter a valid quantity (min: 1)")
      return
    }

    try {
      await increaseTicketQtyAction({ data: { id: t.id, addQty } })
      toast.success(`Successfully added ${addQty} more tickets!`)
      form.reset()
      onCancelEditing()
      
      // Background invalidation avoids blocking UI resets
      void router.invalidate()
    } catch {
      toast.error("Failed to increase quantity")
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(handleIncrease)}
      className="rounded-xl border border-border/30 bg-background/20 p-3 shadow-sm transition-colors"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-sm font-semibold text-foreground">
              {t.name}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              (Sold: {soldCount}/{t.qty})
            </span>
            {availableCount === 0 && (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                Sold out
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span>
              Price:{" "}
              <span className="font-semibold text-foreground/80">{priceText}</span>
            </span>
            <span>Available: {availableCount}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <Input
            autoFocus
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            aria-label="Add ticket quantity"
            placeholder="e.g. 50"
            className="h-8 w-24 bg-background px-2 text-xs"
            {...form.register("addQty")}
          />
          <Button
            type="submit"
            size="sm"
            className="h-8 px-3 text-xs font-medium"
            disabled={!canSubmit || form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "..." : "Add"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              form.reset()
              onCancelEditing()
            }}
            aria-label="Cancel ticket quantity update"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
          </Button>
        </div>
      </div>
    </form>
  )
}

function TicketRow({
  t,
  isEditing,
  onStartEditing,
  onCancelEditing,
  onAddVariant,
  isAddingVariant,
}: {
  t: TicketType
  isEditing: boolean
  onStartEditing: () => void
  onCancelEditing: () => void
  onAddVariant?: () => void
  isAddingVariant?: boolean
}) {
  const soldCount = t.orderLines.reduce((acc, p) => acc + p.qty, 0)
  const availableCount = Math.max(0, t.qty - soldCount)
  const priceText = Number(t.price) === 0 ? "Free" : formatCurrency(t.price)

  if (isEditing) {
    return <TicketIncreaseForm t={t} onCancelEditing={onCancelEditing} />
  }

  return (
    <div className="rounded-xl border border-border/20 bg-background/10 p-3 transition-colors">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-sm font-semibold text-foreground">
              {t.name}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              Sold: {soldCount}/{t.qty}
            </span>
            {availableCount === 0 && (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                Sold out
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span>
              Price:{" "}
              <span className="font-semibold text-foreground/80">{priceText}</span>
            </span>
            <span>Available: {availableCount}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            size="xs"
            className="gap-1.5"
            onClick={onStartEditing}
          >
            <HugeiconsIcon icon={Add01Icon} className="size-3" strokeWidth={2} />
            Qty
          </Button>

          {onAddVariant && !isAddingVariant && (
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="gap-1.5 border-dashed border-border/40 text-muted-foreground hover:bg-background/20 hover:text-foreground"
              onClick={onAddVariant}
            >
              <HugeiconsIcon icon={Add01Icon} className="size-3" />
              Variant
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function NewTicketRow({
  timeSlotId,
  onCancel,
}: {
  timeSlotId: string
  onCancel: () => void
}) {
  const router = useRouter()
  const form = useForm({
    defaultValues: { name: "", price: "", qty: "" },
  })

  const onSubmit = async (data: { name: string; price: string; qty: string }) => {
    if (!data.name || !data.qty) return
    try {
      await saveTicketAction({
        data: {
          timeSlotId,
          name: data.name,
          price: data.price || "0",
          qty: parseInt(data.qty, 10),
        },
      })
      toast.success("Ticket variant added!")
      form.reset()
      onCancel()
      void router.invalidate()
    } catch {
      toast.error("Failed to add ticket")
    }
  }

  const isFormFilled = form.watch("name") && form.watch("qty")

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="mt-2 rounded-xl border border-border/30 bg-background/20 p-4 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">
          Add New Ticket Variant
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="size-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={onCancel}
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
        </Button>
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Ticket Name
          </label>
          <Input
            autoFocus
            placeholder="e.g. VIP Pass"
            className="h-9 bg-background text-xs"
            {...form.register("name")}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Price (LKR)
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="3000.00"
            className="h-9 bg-background text-xs"
            {...form.register("price")}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Initial Quantity
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              placeholder="100"
              className="h-9 flex-1 bg-background text-xs"
              {...form.register("qty")}
            />
            <Button
              type="submit"
              size="sm"
              className="h-9 shrink-0 px-4 text-xs font-medium"
              disabled={!isFormFilled || form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}

export function EventTickets({ eventDates }: { eventDates: EventDatesType }) {
  const [addingToSlot, setAddingToSlot] = useState<string | null>(null)
  const [increasingTicketId, setIncreasingTicketId] = useState<string | null>(null)

  if (!eventDates || eventDates.length === 0) return null

  return (
    <div className="rounded-2xl border border-border/40 bg-card/50 p-6 backdrop-blur-xl">
      <h2 className="mb-2 flex items-center gap-2 text-xl font-semibold">
        <HugeiconsIcon icon={Ticket01Icon} className="size-5 text-primary" />
        Tickets Management
      </h2>
      <p className="mb-6 text-xs font-medium tracking-widest text-muted-foreground uppercase opacity-60">
        Adjust quantities and add new ticket variants per time slot
      </p>
      <div className="flex flex-col gap-6">
        {eventDates.map((ed, idx) => (
          <div key={ed.id} className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <HugeiconsIcon
                icon={Calendar03Icon}
                className="size-3.5"
                strokeWidth={2}
              />
              {ed.date
                ? format(new Date(ed.date), "EEEE, MMMM d, yyyy")
                : `Date ${idx + 1}`}
            </div>
            {ed.timeSlots.map((ts) => (
              <div
                key={ts.id}
                className="ml-5 space-y-3 rounded-lg border border-border/20 bg-background/5 p-4"
              >
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <HugeiconsIcon
                    icon={Clock01Icon}
                    className="size-3"
                    strokeWidth={2}
                  />
                  {ts.endTime
                    ? `${format(new Date(ts.startTime), "h:mm a")} — ${format(new Date(ts.endTime), "h:mm a")}`
                    : `${format(new Date(ts.startTime), "h:mm a")} Onwards`}
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  {ts.tickets.map((t, idx) => (
                    <TicketRow
                      key={t.id}
                      t={t}
                      isEditing={increasingTicketId === t.id}
                      onStartEditing={() => setIncreasingTicketId(t.id)}
                      onCancelEditing={() => setIncreasingTicketId(null)}
                      onAddVariant={
                        idx === ts.tickets.length - 1
                          ? () => {
                              setAddingToSlot(ts.id)
                              setIncreasingTicketId(null)
                            }
                          : undefined
                      }
                      isAddingVariant={addingToSlot === ts.id}
                    />
                  ))}

                  {ts.tickets.length === 0 && addingToSlot !== ts.id && (
                    <button
                      type="button"
                      onClick={() => {
                        setAddingToSlot(ts.id)
                        setIncreasingTicketId(null)
                      }}
                      className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-xl border border-dashed border-border/40 bg-background/10 px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-background/20 hover:text-foreground"
                    >
                      <HugeiconsIcon icon={Add01Icon} className="size-3" />
                      Add Variant
                    </button>
                  )}
                </div>

                {addingToSlot === ts.id && (
                  <NewTicketRow
                    timeSlotId={ts.id}
                    onCancel={() => setAddingToSlot(null)}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
