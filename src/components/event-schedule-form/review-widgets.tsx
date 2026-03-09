export function ReviewSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/20 backdrop-blur-xl">
      <div className="border-b border-border/30 bg-muted/20 px-5 py-3">
        <span className="text-xs font-bold tracking-wider uppercase opacity-60">
          {title}
        </span>
      </div>
      <div className="space-y-2 p-5">{children}</div>
    </div>
  )
}

export function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 text-sm">
      <span className="w-32 shrink-0 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
        {label}
      </span>
      <span className="text-foreground">{value || "—"}</span>
    </div>
  )
}
