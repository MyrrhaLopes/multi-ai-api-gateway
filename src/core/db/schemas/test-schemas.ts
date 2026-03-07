import {
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  hashedPassword: text("hashed_password").notNull(),
});

export const apiKeysTable = pgTable("api_keys", {
  key: uuid("key").primaryKey().defaultRandom().unique(),
  userId: uuid("user_id").references(() => usersTable.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  permitedRoutes: text("permited_routes").array().notNull().default([]),
  permitedModels: text("permited_models").array().notNull().default([]),
});

export type Users = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
