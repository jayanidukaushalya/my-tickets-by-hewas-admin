import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface LogoutConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function LogoutConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: LogoutConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[400px] rounded-2xl border-border/40 bg-background/80 shadow-2xl backdrop-blur-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold tracking-tight">
            Confirm Logout
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-relaxed font-medium text-muted-foreground">
            Are you sure you want to end your session? You will need to log back
            in to access the administrative dashboard.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 gap-2">
          <AlertDialogCancel className="h-10" variant="ghost">
            Stay Signed In
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="h-10"
            variant="destructive"
          >
            Sign Me Out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
