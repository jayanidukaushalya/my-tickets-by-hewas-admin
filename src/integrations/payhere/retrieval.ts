import {
  PAYHERE_APP_ID,
  PAYHERE_APP_SECRET,
  PAYHERE_SANDBOX,
} from "@/configs/env.config"

/**
 * PayHere Payment Retrieval API client, used to verify server-side that a
 * checkout was actually paid before tickets are issued.
 * https://support.payhere.lk/api-&-mobile-sdk/retrieval-api
 */

const BASE_URL = PAYHERE_SANDBOX
  ? "https://sandbox.payhere.lk"
  : "https://www.payhere.lk"

export type PayHerePayment = {
  payment_id: number
  order_id: string
  status: string
  currency: string
  amount: number
  amount_detail?: { gross?: number }
}

export class PaymentVerificationError extends Error {}

let cachedToken: { value: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value
  }

  if (!PAYHERE_APP_ID || !PAYHERE_APP_SECRET) {
    throw new PaymentVerificationError(
      "PAYHERE_APP_ID and PAYHERE_APP_SECRET must be set to verify payments"
    )
  }

  const credentials = Buffer.from(
    `${PAYHERE_APP_ID}:${PAYHERE_APP_SECRET}`
  ).toString("base64")

  const res = await fetch(`${BASE_URL}/merchant/v1/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  })

  if (!res.ok) {
    throw new PaymentVerificationError(
      `PayHere token request failed (${res.status})`
    )
  }

  const json = (await res.json()) as {
    access_token: string
    expires_in: number
  }

  // Refresh a little before PayHere expires the token
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + Math.max(json.expires_in - 30, 0) * 1000,
  }
  return json.access_token
}

/**
 * Returns the received PayHere payment for `orderId` that matches the expected
 * amount and currency, or `null` when no such payment exists.
 */
export async function findReceivedPayment(
  orderId: string,
  expected: { amount: number; currency: string }
): Promise<PayHerePayment | null> {
  const token = await getAccessToken()

  const res = await fetch(
    `${BASE_URL}/merchant/v1/payment/search?order_id=${encodeURIComponent(orderId)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  )

  if (!res.ok) {
    throw new PaymentVerificationError(
      `PayHere payment search failed (${res.status})`
    )
  }

  const json = (await res.json()) as {
    status: number
    data: Array<PayHerePayment> | null
  }

  // status -1: no payments found for this order ID
  if (json.status !== 1 || !json.data) return null

  // PayHere does not enforce unique order IDs, so several payments may match
  return (
    json.data.find(
      (p) =>
        p.order_id === orderId &&
        p.status === "RECEIVED" &&
        p.currency === expected.currency &&
        [p.amount, p.amount_detail?.gross].some(
          (a) =>
            a !== undefined && Math.abs(Number(a) - expected.amount) < 0.005
        )
    ) ?? null
  )
}
