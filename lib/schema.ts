import { pgTable, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
})

export const subjects = pgTable('subjects', {
  id: uuid('id').primaryKey().defaultRandom(),
  owner_id: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
})

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  owner_id: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subject_id: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  pinned_at: timestamp('pinned_at', { withTimezone: true, mode: 'string' }),
  archived_at: timestamp('archived_at', { withTimezone: true, mode: 'string' }),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
})

export const memo_blocks = pgTable('memo_blocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  author_id: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull().default('text').$type<'text' | 'photo'>(),
  content: text('content').notNull().default(''),
  position: integer('position').notNull().default(0),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
})

export const context_files = pgTable('context_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: uuid('project_id').notNull().unique().references(() => projects.id, { onDelete: 'cascade' }),
  content: text('content').notNull().default(''),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
})

export const ai_connections = pgTable('ai_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  api_key: text('api_key').notNull(), // TODO: encrypt
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
})
