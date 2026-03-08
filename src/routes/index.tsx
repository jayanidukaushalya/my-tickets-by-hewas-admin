import { Button } from "@/components/ui/button"
import { authClient } from "@/integrations/better-auth/auth-client"
import { authMiddleware } from "@/integrations/better-auth/auth-middleware"
import { createFileRoute, useNavigate } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  server: {
    middleware: [authMiddleware],
  },
  component: App,
})

function App() {
  const { data: session } = authClient.useSession()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate({ to: "/login" })
        },
      },
    })
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-background p-6">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[20%] right-[10%] h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[20%] left-[10%] h-96 w-96 rounded-full bg-secondary/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-lg space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            M-Tickets <span className="text-primary italic">Admin</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Complete management system for your event bookings.
          </p>
        </div>

        <div className="rounded-3xl border border-border/50 bg-card/30 p-8 shadow-xl backdrop-blur-2xl">
          {session ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 text-3xl font-bold text-primary">
                  {session.user.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    Welcome back, {session.user.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {session.user.email}
                  </p>
                </div>
              </div>
              <div className="flex justify-center gap-4">
                <Button variant="default" className="h-11 rounded-full px-8">
                  Dashboard
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="h-11 rounded-full px-8"
                >
                  Logout
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-lg">
                Secure access required for administration.
              </p>
              <Button
                onClick={() => navigate({ to: "/login" })}
                className="h-12 rounded-full px-10 text-lg shadow-lg shadow-primary/25"
              >
                Go to Login Portal
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {["Events", "Users", "Reports"].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-border/50 bg-muted/50 p-4 text-sm font-medium"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
