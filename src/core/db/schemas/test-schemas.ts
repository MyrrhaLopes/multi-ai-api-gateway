import { pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const usersTable = pgTable('users', {
    id: uuid("id").primaryKey().defaultRandom().unique(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    hashedPassword: text("hashed_password").notNull(),
})

export const apiKeysTable = pgTable('api_keys', {
    key: uuid("key").primaryKey().defaultRandom().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
})

export const usersApiKeysTable = pgTable('users_api_keys', {
    userId: uuid("user_id").notNull().references(() => usersTable.id),
    apiKey: uuid("api_key").notNull().references(() => apiKeysTable.key),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
    primaryKey({ columns: [table.userId, table.apiKey] })
])

export const testLogTable = pgTable('test_logs', {
    id: uuid("id").primaryKey().defaultRandom().unique(),
    caller_id: uuid("caller_id").notNull().references(() => usersTable.id),
    api_key: uuid("api_key").notNull().references(() => apiKeysTable.key),
})

export type Users = typeof usersTable.$inferSelect
export type NewUser = typeof usersTable.$inferInsert
