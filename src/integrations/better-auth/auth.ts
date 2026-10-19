import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/database"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { bearer } from "better-auth/plugins"
import { BETTER_AUTH_SECRET, SITE_URL } from "@/configs/env.config"

export const auth = betterAuth({
  baseURL: SITE_URL,
  secret: BETTER_AUTH_SECRET,
  trustedOrigins: [SITE_URL, "http://10.0.2.2:3000", "http://127.0.0.1:3000"],
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24,
    updateAge: 60 * 60,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  plugins: [tanstackStartCookies(), bearer()],
})
