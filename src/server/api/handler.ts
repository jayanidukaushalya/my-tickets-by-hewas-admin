import { verifyFirebaseToken, type FirebaseUser } from "./auth"
import { apiError } from "./response"
import { auth } from "@/integrations/better-auth/auth"

export type ApiHandlerContext = {
  request: Request
  params: Record<string, string>
}

export type AuthenticatedApiHandlerContext = ApiHandlerContext & {
  user: FirebaseUser
}

export type OptionallyAuthenticatedApiHandlerContext = ApiHandlerContext & {
  user?: FirebaseUser
}

export type AdminAuthenticatedApiHandlerContext = ApiHandlerContext & {
  adminSession: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>
}

type Handler<T extends ApiHandlerContext> = (ctx: T) => Promise<Response>

export async function parseJsonBody(request: Request): Promise<unknown> {
  const body = await request.json().catch(() => null)
  if (body === null) {
    throw new Error("Request body must be valid JSON")
  }
  return body
}

function logApiRequest(request: Request) {
  try {
    const url = new URL(request.url)
    console.log(`[API] ${request.method} ${url.pathname}${url.search}`)
  } catch (e) {
    console.error("[API] Failed to log request:", e)
  }
}

export function publicHandler(
  fn: Handler<ApiHandlerContext>
): Handler<ApiHandlerContext> {
  return async (ctx) => {
    logApiRequest(ctx.request)
    try {
      return await fn(ctx)
    } catch (e) {
      console.error("[API] Unhandled error in public handler:", e)
      return apiError("Internal server error", 500)
    }
  }
}

export function privateHandler(
  fn: Handler<AuthenticatedApiHandlerContext>
): Handler<ApiHandlerContext> {
  return async (ctx) => {
    logApiRequest(ctx.request)
    try {
      const result = await verifyFirebaseToken(ctx.request)

      if (result instanceof Response) {
        return result
      }

      return await fn({ ...ctx, user: result })
    } catch (e) {
      console.error("[API] Unhandled error in private handler:", e)
      return apiError("Internal server error", 500)
    }
  }
}

export function adminHandler(
  fn: Handler<AdminAuthenticatedApiHandlerContext>
): Handler<ApiHandlerContext> {
  return async (ctx) => {
    logApiRequest(ctx.request)
    try {
      const session = await auth.api.getSession({
        headers: ctx.request.headers,
      })

      if (!session) {
        return apiError("Unauthorized", 401)
      }

      return await fn({ ...ctx, adminSession: session })
    } catch (e) {
      console.error("[API] Unhandled error in admin handler:", e)
      return apiError("Internal server error", 500)
    }
  }
}

export function optionalAuthHandler(
  fn: Handler<OptionallyAuthenticatedApiHandlerContext>
): Handler<ApiHandlerContext> {
  return async (ctx) => {
    logApiRequest(ctx.request)
    try {
      const authHeader = ctx.request.headers.get("Authorization")

      if (authHeader?.startsWith("Bearer ")) {
        const result = await verifyFirebaseToken(ctx.request)

        if (result instanceof Response) {
          return result
        }

        return await fn({ ...ctx, user: result })
      }

      return await fn({ ...ctx, user: undefined })
    } catch (e) {
      console.error("[API] Unhandled error in optional auth handler:", e)
      return apiError("Internal server error", 500)
    }
  }
}
