import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { STEPS } from "./constants"

export function StepIndicator({
  currentStep,
  onStepClick,
}: {
  currentStep: number
  onStepClick: (step: number) => void
}) {
  return (
    <div className="relative flex items-center justify-between">
      {/* Connecting line */}
      <div className="absolute top-5 right-5 left-5 h-px">
        <div className="absolute inset-0 bg-border/40" />
        <div
          className="absolute inset-y-0 left-0 bg-primary/60 transition-all duration-500"
          style={{
            width: `${(currentStep / (STEPS.length - 1)) * 100}%`,
          }}
        />
      </div>

      {STEPS.map((step) => {
        const isActive = step.id === currentStep
        const isCompleted = step.id < currentStep

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onStepClick(step.id)}
            className={cn(
              "group relative z-10 flex flex-col items-center gap-2 transition-all",
              isActive || isCompleted
                ? "text-primary"
                : "text-muted-foreground/50"
            )}
          >
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-xl border-2 transition-all duration-300",
                isActive
                  ? "scale-110 border-primary bg-primary text-primary-foreground shadow-[0_0_20px] shadow-primary/30"
                  : isCompleted
                    ? "border-primary/40 bg-[#0a0a0a] text-primary"
                    : "border-border/40 bg-[#0a0a0a] text-muted-foreground/50 group-hover:border-border"
              )}
            >
              <HugeiconsIcon
                icon={step.icon}
                className="size-4"
                strokeWidth={2}
              />
            </div>
            <span
              className={cn(
                "text-[10px] font-semibold tracking-wider uppercase transition-colors",
                isActive
                  ? "text-primary opacity-100"
                  : "text-muted-foreground/60"
              )}
            >
              {step.title}
            </span>
          </button>
        )
      })}
    </div>
  )
}
