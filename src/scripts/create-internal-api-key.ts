import { db } from "../core/db/drizzle-cient.ts";
import { apiKeysTable, usersTable } from "../core/db/schemas/test-schemas.ts";

async function createInternalApiKey() {
  try {
    console.log("Creating internal user...");
    const [user] = await db
      .insert(usersTable)
      .values({
        name: "Internal Admin",
        email: "admin@internal.local",
        hashedPassword: "not-a-real-password",
      })
      .returning({ id: usersTable.id });

    console.log(`User created with ID: ${user.id}`);

    console.log("Creating wildcard API Key...");
    const [apiKey] = await db
      .insert(apiKeysTable)
      .values({
        userId: user.id,
        permitedModels: ["*"], // Wildcard access to all models
        permitedRoutes: ["*"], // Wildcard access to all routes
      })
      .returning({ key: apiKeysTable.key });

    console.log("=====================================");
    console.log("✅ Internal API Key Created!");
    console.log(`🔑 Your API Key: ${apiKey.key}`);
    console.log("⚠️ Keep this safe. You can use this in your headers:");
    console.log(`   "API Key": "${apiKey.key}"`);
    console.log("=====================================");

    process.exit(0);
  } catch (error) {
    console.error("Error creating API key:", error);
    process.exit(1);
  }
}

createInternalApiKey();
