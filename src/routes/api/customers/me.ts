import { db } from "@/database"
import { customer } from "@/database/schema"
import {
  apiError,
  apiSuccess,
  apiValidationError,
  corsPreflightResponse,
  privateHandler,
} from "@/server/api"
import { parseJsonBody } from "@/server/api/handler"
import {
  CustomerIdentityConflictError,
  ensureAuthCustomer,
} from "@/server/api/ensure-auth-customer"
import { createFileRoute } from "@tanstack/react-router"
import { eq } from "drizzle-orm"
import { z } from "zod"

const updateCustomerProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
})

export const Route = createFileRoute("/api/customers/me")({
  server: {
    handlers: {
      OPTIONS: () => corsPreflightResponse(),

      GET: privateHandler(async ({ user }) => {
        try {
          const customerRecord = await ensureAuthCustomer(user)
          return apiSuccess(customerRecord)
        } catch (error) {
          if (error instanceof CustomerIdentityConflictError) {
            return apiError(error.message, 409)
          }
          throw error
        }
      }),

      PATCH: privateHandler(async ({ request, user }) => {
        const body = await parseJsonBody(request)
        const parsed = updateCustomerProfileSchema.safeParse(body)

        if (!parsed.success) {
          return apiValidationError(parsed.error.flatten())
        }

        try {
          const currentCustomer = await ensureAuthCustomer(user)
          const firstName = parsed.data.firstName?.trim()
          const lastName = parsed.data.lastName?.trim()
          const phone = parsed.data.phone?.trim()

          const [updatedCustomer] = await db
            .update(customer)
            .set({
              ...(parsed.data.firstName !== undefined && {
                firstName: firstName ? firstName : null,
              }),
              ...(parsed.data.lastName !== undefined && {
                lastName: lastName ? lastName : null,
              }),
              ...(parsed.data.phone !== undefined && {
                phone: phone ? phone : null,
              }),
            })
            .where(eq(customer.id, currentCustomer.id))
            .returning()

          return apiSuccess(updatedCustomer)
        } catch (error) {
          if (error instanceof CustomerIdentityConflictError) {
            return apiError(error.message, 409)
          }
          throw error
        }
      }),
    },
  },
})
