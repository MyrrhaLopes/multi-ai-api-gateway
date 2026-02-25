import postgres from "postgres";
import { env } from "../env.ts";
import { drizzle } from "drizzle-orm/postgres-js";
import { usersTable } from "./schemas/test-schemas.ts";
const pg = postgres(env.POSTGRES_URL)

export const db = drizzle(pg,
    {
        schema: {
            users: usersTable,
        }
    }
)
