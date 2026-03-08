import { redirect } from "@tanstack/react-router"
import { createMiddleware } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { auth } from "./auth"

/**
 * Middleware to protect admin routes - redirects to login if not authenticated
 */
export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })

  if (!session) {
    throw redirect({ to: "/" })
  }

  return await next({
    context: {
      admin: session.user,
    },
  })
})

/**
 * Middleware to redirect authenticated users away from login page
 */
export const redirectIfAuthenticated = createMiddleware().server(
  async ({ next }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (session) {
      // throw redirect({ to: '/admin' })
    }

    return await next()
  }
)
