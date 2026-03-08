export type Environment = "development" | "test" | "production"

export const APP_ENV =
  (process.env.APP_ENV as Environment) || (process.env.NODE_ENV as Environment)

export const isDevelopment = APP_ENV === "development"
export const isProduction = APP_ENV === "production"
export const isTest = APP_ENV === "test"

export const DATABASE_URL = process.env.DATABASE_URL as string

export const SITE_URL = process.env.SITE_URL as string

export const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET as string
