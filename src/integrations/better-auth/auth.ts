import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/database"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { BETTER_AUTH_SECRET, SITE_URL } from "@/configs/env.config"

export const auth = betterAuth({
  baseURL: SITE_URL,
  secret: BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24, // 1 day in seconds
    updateAge: 60 * 60, // Update session every hour
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // Cache for 5 minutes
    },
  },
  plugins: [tanstackStartCookies()],
})
