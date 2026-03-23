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

// ---------------------------------------------------------------------------
// Internal type alias
// ---------------------------------------------------------------------------

type Handler<T extends ApiHandlerContext> = (ctx: T) => Promise<Response>

// ---------------------------------------------------------------------------
// Factory functions
// ---------------------------------------------------------------------------

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
