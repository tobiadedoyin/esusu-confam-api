import {
  pgTable,
  boolean,
  integer,
  uuid,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const groups = pgTable('groups', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  maxCapacity: integer('max_capacity').notNull(),
  isPublic: boolean('is_public').notNull(),
  adminId: uuid('admin_id')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  inviteCode: text('invite_code').notNull(),
});
