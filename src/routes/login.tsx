import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/integrations/better-auth/auth-client"
import { zodResolver } from "@hookform/resolvers/zod"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod/v3"

import { redirectIfAuthenticated } from "@/integrations/better-auth/auth-middleware"

export const Route = createFileRoute("/login")({
  server: {
    middleware: [redirectIfAuthenticated],
  },
  component: LoginComponent,
})

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormValues = z.infer<typeof loginSchema>

function LoginComponent() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true)

    await authClient.signIn.email(
      {
        email: values.email,
        password: values.password,
      },
      {
        onSuccess: () => {
          toast.success("Signed in successfully")
          navigate({ to: "/", replace: true })
        },
        onError: (ctx) => {
          toast.error(ctx.error.message)
        },
      }
    )
    setLoading(false)
  }

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center bg-background px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[10%] left-[15%] h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-[15%] bottom-[10%] h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight uppercase">
            M-Tickets
          </h1>
          <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
            Admin Portal Login
          </p>
        </div>

        <Card className="overflow-hidden border-border/50 bg-card/40 shadow-2xl backdrop-blur-2xl">
          <CardContent className="text-left">
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <FieldGroup className="gap-6">
                <Field orientation="vertical">
                  <FieldLabel
                    htmlFor="email"
                    className="text-xs font-semibold tracking-tighter uppercase opacity-70"
                  >
                    Email Address
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="email"
                      type="email"
                      placeholder="something@email.com"
                      className="h-10 border-border/30 bg-background/20 transition-colors focus:border-primary/50"
                      {...register("email")}
                    />
                    <FieldError className="mt-1 text-xs font-medium">
                      {errors.email?.message}
                    </FieldError>
                  </FieldContent>
                </Field>

                <Field orientation="vertical">
                  <FieldLabel
                    htmlFor="password"
                    className="text-xs font-semibold tracking-tighter uppercase opacity-70"
                  >
                    Password
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="h-10 border-border/30 bg-background/20 transition-colors focus:border-primary/50"
                      {...register("password")}
                    />
                    <FieldError className="mt-1 text-xs font-medium">
                      {errors.password?.message}
                    </FieldError>
                  </FieldContent>
                </Field>

                <Button
                  type="submit"
                  className="h-12 w-full text-sm font-bold tracking-widest uppercase shadow-lg shadow-primary/20 transition-all active:scale-95"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Verifying...
                    </span>
                  ) : (
                    "Access Portal"
                  )}
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase opacity-50">
          Authorized Personnel Only
        </p>
      </div>
    </div>
  )
}
