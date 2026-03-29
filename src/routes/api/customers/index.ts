import { db } from "@/database"
import { customer } from "@/database/schema"
import {
  apiError,
  apiSuccess,
  apiValidationError,
  corsPreflightResponse,
  publicHandler,
} from "@/server/api"
import { parseJsonBody } from "@/server/api/handler"
import { createFileRoute } from "@tanstack/react-router"
import { eq } from "drizzle-orm"
import { z } from "zod"

// Validation schema for customer creation
const createCustomerSchema = z.object({
  firebaseUid: z.string().min(1, "Firebase UID is required"),
  email: z.string().email("Valid email is required"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

export const Route = createFileRoute("/api/customers/")({
  server: {
    handlers: {
      OPTIONS: () => corsPreflightResponse(),

      POST: publicHandler(async ({ request }) => {
        // Parse and validate request body
        const body = await parseJsonBody(request)
        const parsed = createCustomerSchema.safeParse(body)

        if (!parsed.success) {
          return apiValidationError(parsed.error.flatten())
        }

        const { firebaseUid, email, firstName, lastName } = parsed.data

        // Check if customer with this Firebase UID already exists
        const existingByUid = await db.query.customer.findFirst({
          where: eq(customer.firebaseUid, firebaseUid),
        })

        if (existingByUid) {
          return apiError(
            "Customer with this Firebase UID already exists",
            409
          )
        }

        // Check if customer with this email exists
        const existingByEmail = await db.query.customer.findFirst({
          where: eq(customer.email, email),
        })

        if (existingByEmail) {
          // If customer exists but has no Firebase UID (guest customer), link it
          if (!existingByEmail.firebaseUid) {
            const [updated] = await db
              .update(customer)
              .set({
                firebaseUid,
                firstName: firstName ?? existingByEmail.firstName,
                lastName: lastName ?? existingByEmail.lastName,
                updatedAt: new Date(),
              })
              .where(eq(customer.id, existingByEmail.id))
              .returning()

            return apiSuccess(updated, 201)
          }

          // Customer already linked to a Firebase UID
          return apiError(
            "Customer with this email is already linked to an account",
            409
          )
        }

        // Create new customer
        const [created] = await db
          .insert(customer)
          .values({
            firebaseUid,
            email,
            firstName: firstName ?? null,
            lastName: lastName ?? null,
          })
          .returning()

        return apiSuccess(created, 201)
      }),
    },
  },
})
