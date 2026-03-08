import "dotenv/config"
import { auth } from "@/integrations/better-auth/auth"

async function seed() {
  console.log("🌱 Seeding admin user...")

  try {
    const adminEmail = "admin@hewas.lk"
    const adminPassword = "admin123"

    try {
      // Try to create the user
      const result = await auth.api.signUpEmail({
        body: {
          email: adminEmail,
          password: adminPassword,
          name: "Admin User",
        },
      })
      console.log("✅ Admin user seeded successfully:", result.user.email)
    } catch (error: any) {
      if (
        error.code === "USER_ALREADY_EXISTS" ||
        error.message?.includes("already exists")
      ) {
        console.log("ℹ️ Admin user already exists.")
      } else {
        throw error
      }
    }
  } catch (error: any) {
    console.error("❌ Failed to seed admin user:", error)
  }

  process.exit(0)
}

seed()
