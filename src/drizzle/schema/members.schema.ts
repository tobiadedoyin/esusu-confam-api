import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { groups } from './groups.schema';

export const members = pgTable('members', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  groupId: uuid('group_id').references(() => groups.id),
  status: text('status').default('pending'),
  isAdmin: boolean('is_admin').default(false),
  joinedAt: timestamp('joined_at').defaultNow(),
});
