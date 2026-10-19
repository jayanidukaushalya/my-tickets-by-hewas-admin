import {
  PAYHERE_APP_ID,
  PAYHERE_APP_SECRET,
  PAYHERE_SANDBOX,
} from "@/configs/env.config"

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

  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + Math.max(json.expires_in - 30, 0) * 1000,
  }
  return json.access_token
}

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

  if (json.status !== 1 || !json.data) return null

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
