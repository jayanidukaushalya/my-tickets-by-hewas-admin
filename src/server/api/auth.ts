import { FIREBASE_PROJECT_ID } from "@/configs/env.config"
import { createRemoteJWKSet, errors, jwtVerify } from "jose"
import { apiError } from "./response"

export type FirebaseUser = {
  uid: string
  email?: string
  name?: string
}

const firebaseKeys = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
)

export async function verifyFirebaseToken(
  request: Request
): Promise<FirebaseUser | Response> {
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
    const { payload } = await jwtVerify(idToken, firebaseKeys, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
      algorithms: ["RS256"],
    })

    if (!payload.sub) {
      return apiError("Invalid or unauthorized token", 403)
    }

    return {
      uid: payload.sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
      name: typeof payload.name === "string" ? payload.name : undefined,
    }
  } catch (cause) {
    if (cause instanceof errors.JWTExpired) {
      return apiError("Token has expired or been revoked", 401)
    }

    return apiError("Invalid or unauthorized token", 403)
  }
}
