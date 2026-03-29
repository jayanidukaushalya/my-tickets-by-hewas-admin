import { db } from "@/database"
import { customer } from "@/database/schema"
import { eq, isNull } from "drizzle-orm"
import type { DecodedIdToken } from "firebase-admin/auth"

export class CustomerIdentityConflictError extends Error {
  constructor() {
    super("Email is already linked to a different account")
    this.name = "CustomerIdentityConflictError"
  }
}

function extractNameParts(name?: string) {
  const trimmed = name?.trim()
  if (!trimmed) {
    return { firstName: null as string | null, lastName: null as string | null }
  }

  const parts = trimmed.split(/\s+/)
  return {
    firstName: parts[0] ?? null,
    lastName: parts.slice(1).join(" ") || null,
  }
}

export async function ensureAuthCustomer(user: DecodedIdToken) {
  if (!user.email) {
    throw new Error("Authenticated user must have an email")
  }

  return db.transaction(async (tx) => {
    const byUid = await tx.query.customer.findFirst({
      where: eq(customer.firebaseUid, user.uid),
    })

    if (byUid) {
      return byUid
    }

    const byUnlinkedEmail = await tx.query.customer.findFirst({
      where: (table, { and }) =>
        and(eq(table.email, user.email!), isNull(table.firebaseUid)),
    })

    if (byUnlinkedEmail) {
      const { firstName, lastName } = extractNameParts(user.name)
      const [linked] = await tx
        .update(customer)
        .set({
          firebaseUid: user.uid,
          firstName: byUnlinkedEmail.firstName ?? firstName,
          lastName: byUnlinkedEmail.lastName ?? lastName,
        })
        .where(eq(customer.id, byUnlinkedEmail.id))
        .returning()

      return linked
    }

    const byLinkedEmail = await tx.query.customer.findFirst({
      where: eq(customer.email, user.email!),
    })

    if (byLinkedEmail && byLinkedEmail.firebaseUid !== user.uid) {
      throw new CustomerIdentityConflictError()
    }

    const { firstName, lastName } = extractNameParts(user.name)
    const [created] = await tx
      .insert(customer)
      .values({
        firebaseUid: user.uid,
        email: user.email!,
        firstName,
        lastName,
      })
      .returning()

    return created
  })
}
