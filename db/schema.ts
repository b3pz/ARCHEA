import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const projects = sqliteTable('projects', {id:integer('id').primaryKey(), payload:text('payload').notNull(), revision:integer('revision').notNull(), updatedAt:text('updated_at').notNull(), actor:text('actor').notNull()});
export const audit = sqliteTable('audit', {id:text('id').primaryKey(),projectId:integer('project_id').notNull(),action:text('action').notNull(),actor:text('actor').notNull(),createdAt:text('created_at').notNull()});
