import { CORS_HEADERS } from "./cors"

// ---------------------------------------------------------------------------
// Envelope shapes
// ---------------------------------------------------------------------------

export type ApiSuccessResponse<T> = {
  success: true
  data: T
}

export type ApiErrorResponse = {
  success: false
  error: string
  details?: unknown
}

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

function json<T>(body: T, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...CORS_HEADERS,
    },
  })
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/**
 * Returns a 200 (or custom `status`) JSON response wrapped in the standard
 * success envelope: `{ success: true, data: T }`.
 */
export function apiSuccess<T>(data: T, status = 200): Response {
  return json<ApiSuccessResponse<T>>({ success: true, data }, status)
}

/**
 * Returns a JSON error response wrapped in the standard error envelope:
 * `{ success: false, error: string, details? }`.
 */
export function apiError(
  message: string,
  status: number,
  details?: unknown
): Response {
  const body: ApiErrorResponse = { success: false, error: message }
  if (details !== undefined) body.details = details
  return json(body, status)
}

/**
 * Convenience wrapper for Zod validation failures.
 * Passes the flattened Zod error as `details` so the client can pinpoint
 * exactly which fields failed.
 */
export function apiValidationError(flattenedError: unknown): Response {
  return apiError("Validation failed", 400, flattenedError)
}
