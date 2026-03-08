export type Environment = "development" | "test" | "production"

export const APP_ENV =
  (process.env.APP_ENV as Environment) || (process.env.NODE_ENV as Environment)

export const isDevelopment = APP_ENV === "development"
export const isProduction = APP_ENV === "production"
export const isTest = APP_ENV === "test"

export const DATABASE_URL = process.env.DATABASE_URL as string

export const SITE_URL = process.env.SITE_URL as string

export const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET as string

export const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID as string
export const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL as string
// Private key contains literal `\n` chars when stored in .env — replace them
export const FIREBASE_PRIVATE_KEY = (
  process.env.FIREBASE_PRIVATE_KEY as string
)?.replace(/\\n/g, "\n")
