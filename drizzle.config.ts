import type { Config } from "drizzle-kit"
import { env } from "./src/core/env.ts"

export default {
    schema: "./src/core/db/schemas/*.ts",
    out: "./src/core/db/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: env.POSTGRES_URL
    }
} satisfies Config