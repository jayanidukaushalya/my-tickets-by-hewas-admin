/**
 * CORS configuration for the public REST API consumed by mobile clients.
 *
 * Native Android apps send requests with a `null` or absent Origin header, so
 * wildcard (`*`) is the only practical choice here. If you later introduce
 * private endpoints that carry sensitive user data and are also called from a
 * browser context, narrow ALLOWED_ORIGIN to your specific web origin and set
 * `Access-Control-Allow-Credentials: true`.
 */
const ALLOWED_ORIGIN = "*"

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  // Browsers cache the preflight response for 24 h, reducing round-trips.
  "Access-Control-Max-Age": "86400",
}

/**
 * Responds to an HTTP OPTIONS preflight request with the correct CORS headers
 * and an empty 204 body.
 */
export function corsPreflightResponse(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
