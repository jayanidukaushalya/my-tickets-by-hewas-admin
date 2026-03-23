import { firebaseAuth } from "@/integrations/firebase"
import type { DecodedIdToken } from "firebase-admin/auth"
import { apiError } from "./response"

/**
 * Extracts and verifies a Firebase ID token from the `Authorization: Bearer
 * <token>` header of the given request.
 *
 * @returns The decoded `DecodedIdToken` on success, or a ready-to-send error
 * `Response` on failure (so callers can short-circuit with a simple `instanceof
 * Response` check).
 */
export async function verifyFirebaseToken(
  request: Request
): Promise<DecodedIdToken | Response> {
  const authHeader = request.headers.get("Authorization")

  if (!authHeader?.startsWith("Bearer ")) {
    return apiError(
      "Authorization header missing or malformed. Expected: Bearer <token>",
      401
    )
  }

  const idToken = authHeader.slice(7).trim()

  if (!idToken) {
    return apiError("Bearer token is empty", 401)
  }

  try {
    const decoded = await firebaseAuth.verifyIdToken(idToken)
    return decoded
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause)

    if (
      message.includes("auth/id-token-expired") ||
      message.includes("expired") ||
      message.includes("revoked")
    ) {
      return apiError("Token has expired or been revoked", 401)
    }

    return apiError("Invalid or unauthorized token", 403)
  }
}
