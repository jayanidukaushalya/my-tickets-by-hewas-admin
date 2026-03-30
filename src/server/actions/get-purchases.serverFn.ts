import { db } from "@/database"
import { orderLine } from "@/database/schema"
import { createServerFn } from "@tanstack/react-start"
import { count, desc } from "drizzle-orm"
import { z } from "zod/v3"

export const getPurchasesValidator = z.object({
  page: z.number().positive().optional().default(1),
  limit: z.number().positive().optional().default(10),
})

export const getPurchasesFn = createServerFn({ method: "GET" })
  .inputValidator(getPurchasesValidator)
  .handler(async ({ data }) => {
    const limit = data?.limit || 10
    const offset = data?.page ? (data.page - 1) * limit : 0

    const results = await db.query.orderLine.findMany({
      orderBy: [desc(orderLine.createdAt)],
      limit,
      offset,
      with: {
        order: {
          with: {
            customer: true,
          },
        },
        ticket: {
          with: {
            timeSlot: {
              with: {
                eventDate: {
                  with: {
                    event: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    const [{ value: total }] = await db
      .select({ value: count() })
      .from(orderLine)

    return {
      results,
      total,
    }
  })
