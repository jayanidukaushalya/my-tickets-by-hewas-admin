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
        const body = await parseJsonBody(request)
        const parsed = createCustomerSchema.safeParse(body)

        if (!parsed.success) {
          return apiValidationError(parsed.error.flatten())
        }

        const { firebaseUid, email, firstName, lastName } = parsed.data

        const existingByUid = await db.query.customer.findFirst({
          where: eq(customer.firebaseUid, firebaseUid),
        })

        if (existingByUid) {
          return apiError("Customer with this Firebase UID already exists", 409)
        }

        const existingByEmail = await db.query.customer.findFirst({
          where: eq(customer.email, email),
        })

        if (existingByEmail) {
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

          return apiError(
            "Customer with this email is already linked to an account",
            409
          )
        }

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
