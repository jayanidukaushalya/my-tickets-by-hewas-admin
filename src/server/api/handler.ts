import type { DecodedIdToken } from "firebase-admin/auth"
import { verifyFirebaseToken } from "./auth"
import { apiError } from "./response"

// ---------------------------------------------------------------------------
// Handler context types
// ---------------------------------------------------------------------------

export type ApiHandlerContext = {
  request: Request
  params: Record<string, string>
}

export type AuthenticatedApiHandlerContext = ApiHandlerContext & {
  /** Decoded Firebase ID token — contains uid, email, custom claims, etc. */
  user: DecodedIdToken
}

export type OptionallyAuthenticatedApiHandlerContext = ApiHandlerContext & {
  /** Decoded Firebase ID token if provided — undefined for guest users */
  user?: DecodedIdToken
}

// ---------------------------------------------------------------------------
// Internal type alias
// ---------------------------------------------------------------------------

type Handler<T extends ApiHandlerContext> = (ctx: T) => Promise<Response>

// ---------------------------------------------------------------------------
// Factory functions
// ---------------------------------------------------------------------------

/**
 * Safely parses the JSON body of a request.
 * Throws an Error if parsing fails, which is automatically caught and formatted
 * as a 400 Bad Request by the publicHandler / privateHandler wrappers.
 */
export async function parseJsonBody(request: Request): Promise<unknown> {
  const body = await request.json().catch(() => null)
  if (body === null) {
    throw new Error("Request body must be valid JSON")
  }
  return body
}

/**
 * Logs the incoming API request method, path, and query parameters.
 */
function logApiRequest(request: Request) {
  try {
    const url = new URL(request.url)
    console.log(`[API] ${request.method} ${url.pathname}${url.search}`)
  } catch (e) {
    console.error("[API] Failed to log request:", e)
  }
}

/**
 * Wraps a handler for a **public** endpoint.
 *
 * Provides:
 * - Uniform top-level error catching so unhandled exceptions always produce a
 *   well-formed JSON error response instead of crashing the server.
 * - CORS headers on every response (they are added by the `response` helpers
 *   used inside your handler — make sure to use `apiSuccess` / `apiError`).
 *
 * @example
 * ```ts
 * GET: publicHandler(async ({ request }) => {
 *   return apiSuccess({ hello: "world" })
 * })
 * ```
 */
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

/**
 * Wraps a handler for a **private** endpoint.
 *
 * Provides everything `publicHandler` does, plus:
 * - Firebase Bearer-token verification on every request.
 * - Injects the decoded `user` (DecodedIdToken) into the handler context.
 * - Returns `401` / `403` automatically when the token is absent or invalid.
 *
 * @example
 * ```ts
 * GET: privateHandler(async ({ request, user }) => {
 *   return apiSuccess({ uid: user.uid })
 * })
 * ```
 */
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

/**
 * Wraps a handler for an endpoint that supports **optional authentication**.
 *
 * Provides everything `publicHandler` does, plus:
 * - Optional Firebase Bearer-token verification.
 * - If Authorization header is present and valid, injects the decoded `user` into context.
 * - If Authorization header is absent, proceeds without user (guest flow).
 * - If Authorization header is present but invalid, returns `401` / `403` error.
 *
 * This is useful for endpoints that support both authenticated and guest users,
 * such as ticket purchase endpoints.
 *
 * @example
 * ```ts
 * POST: optionalAuthHandler(async ({ request, user }) => {
 *   if (user) {
 *     // Authenticated user flow
 *     return apiSuccess({ uid: user.uid })
 *   } else {
 *     // Guest user flow
 *     return apiSuccess({ guest: true })
 *   }
 * })
 * ```
 */
export function optionalAuthHandler(
  fn: Handler<OptionallyAuthenticatedApiHandlerContext>
): Handler<ApiHandlerContext> {
  return async (ctx) => {
    logApiRequest(ctx.request)
    try {
      const authHeader = ctx.request.headers.get("Authorization")

      if (authHeader?.startsWith("Bearer ")) {
        // Token provided - validate it
        const result = await verifyFirebaseToken(ctx.request)

        if (result instanceof Response) {
          // Token was provided but invalid - return error
          return result
        }

        // Token valid - attach user to context
        return await fn({ ...ctx, user: result })
      }

      // No token provided - proceed without user (guest flow)
      return await fn({ ...ctx, user: undefined })
    } catch (e) {
      console.error("[API] Unhandled error in optional auth handler:", e)
      return apiError("Internal server error", 500)
    }
  }
}
