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
import { createFileRoute } from "@tanstack/react-router"
import { eq } from "drizzle-orm"
import { z } from "zod"

// Validation schema for linking customer
const linkCustomerSchema = z.object({
  email: z.email("Valid email is required"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

export const Route = createFileRoute("/api/customers/link")({
  server: {
    handlers: {
      OPTIONS: () => corsPreflightResponse(),

      PUT: privateHandler(async ({ request, user }) => {
        // Parse and validate request body
        const body = await parseJsonBody(request)
        const parsed = linkCustomerSchema.safeParse(body)

        if (!parsed.success) {
          return apiValidationError(parsed.error.flatten())
        }

        const { email, firstName, lastName } = parsed.data

        // Find customer by email
        const existingCustomer = await db.query.customer.findFirst({
          where: eq(customer.email, email),
        })

        if (!existingCustomer) {
          return apiError("No customer found with this email", 404)
        }

        // Check if customer already has a Firebase UID
        if (existingCustomer.firebaseUid) {
          // Check if it's a different Firebase UID
          if (existingCustomer.firebaseUid !== user.uid) {
            return apiError(
              "Customer already linked to a different Firebase UID",
              409
            )
          }

          // Customer already linked to this Firebase UID - update profile if names provided
          if (firstName || lastName) {
            const [updated] = await db
              .update(customer)
              .set({
                ...(firstName && { firstName }),
                ...(lastName && { lastName }),
              })
              .where(eq(customer.id, existingCustomer.id))
              .returning()
            return apiSuccess(updated)
          }

          return apiSuccess(existingCustomer)
        }

        // Update customer record with Firebase UID and names if provided
        const [updated] = await db
          .update(customer)
          .set({
            firebaseUid: user.uid,
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
          })
          .where(eq(customer.id, existingCustomer.id))
          .returning()

        return apiSuccess(updated)
      }),
    },
  },
})
