import { CORS_HEADERS } from "./cors"

export type ApiSuccessResponse<T> = {
  success: true
  data: T
}

export type ApiErrorResponse = {
  success: false
  error: string
  details?: unknown
}

function json<T>(body: T, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...CORS_HEADERS,
    },
  })
}

export function apiSuccess<T>(data: T, status = 200): Response {
  return json<ApiSuccessResponse<T>>({ success: true, data }, status)
}

export function apiError(
  message: string,
  status: number,
  details?: unknown
): Response {
  const body: ApiErrorResponse = { success: false, error: message }
  if (details !== undefined) body.details = details
  return json(body, status)
}

export function apiValidationError(flattenedError: unknown): Response {
  return apiError("Validation failed", 400, flattenedError)
}
