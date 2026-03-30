import { RESEND_API_KEY, RESEND_FROM_EMAIL } from "@/configs/env.config"
import { Resend } from "resend"
import type { ReactElement } from "react"

export const resend = new Resend(RESEND_API_KEY)

interface SendEmailOptions {
  to: string | string[]
  subject: string
  react: ReactElement
  replyTo?: string
}

export async function sendEmail({
  to,
  subject,
  react,
  replyTo,
}: SendEmailOptions) {
  const { data, error } = await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to,
    subject,
    react,
    ...(replyTo ? { replyTo } : {}),
  })

  if (error) {
    console.error("[Resend] emails.send failed:", error)
    throw new Error(error.message)
  }

  return data
}
