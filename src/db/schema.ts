import { pgTable, serial, text, timestamp, numeric, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (links Firebase Auth UID to local system)
export const users = pgTable('users', {
  uid: text('uid').primaryKey(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Transactions table (Audit trail for Cardlink/Visa/MC)
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull(),
  status: text('status').notNull(), // PENDING, COMPLETED, FAILED
  type: text('type').notNull(),     // PAYMENT, CAPTURE, REFUND
  gateway: text('gateway').notNull(), // CARDLINK, VISA_DIRECT, etc
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Webhook Audit Logs
export const webhookLogs = pgTable('webhook_logs', {
  id: serial('id').primaryKey(),
  event: text('event').notNull(),
  payload: jsonb('payload').notNull(),
  status: text('status').notNull(),
  errorCode: text('error_code'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
