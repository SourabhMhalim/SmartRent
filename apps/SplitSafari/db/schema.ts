// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const groups = sqliteTable('groups', { id:text('id').primaryKey(), name:text('name').notNull(), data:text('data').notNull(), version:integer('version').notNull().default(0) });
export const sessions = sqliteTable('sessions', { token:text('token').primaryKey(), groupId:text('group_id').notNull(), memberId:text('member_id').notNull() }, t=>[index('idx_sessions_group').on(t.groupId)]);
export const invites = sqliteTable('invites', { token:text('token').primaryKey(), groupId:text('group_id').notNull(), memberId:text('member_id').notNull() }, t=>[index('idx_invites_group').on(t.groupId)]);
