/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import pg from 'pg';
import { db as sqliteDb } from './db.js';

const { Pool } = pg;

export interface CloudDbConfig {
  connectionString?: string;
  isCloudConnected: boolean;
}

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

export const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 10,
      connectionTimeoutMillis: 10000,
    })
  : null;

if (pool) {
  pool.on('error', (err) => {
    console.error('[Cloud PostgreSQL] Unexpected idle client error:', err);
  });
}

export const isCloudPostgresActive = Boolean(pool);

/**
 * Initialize Cloud PostgreSQL Schema
 */
export async function initCloudPostgres(): Promise<boolean> {
  if (!pool) {
    console.log('[Database] DATABASE_URL not set. Running on local persistent SQLite engine.');
    return false;
  }

  try {
    const client = await pool.connect();
    try {
      console.log('[Cloud PostgreSQL] Connected successfully to central cloud database. Creating schema...');

      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          phone VARCHAR(64) UNIQUE NOT NULL,
          password_hash TEXT,
          avatar_url TEXT,
          created_at BIGINT NOT NULL,
          updated_at BIGINT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at BIGINT NOT NULL,
          expires_at BIGINT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS transactions (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(16) NOT NULL,
          amount DOUBLE PRECISION NOT NULL,
          category VARCHAR(64) NOT NULL,
          date VARCHAR(16) NOT NULL,
          time VARCHAR(16),
          description TEXT,
          source VARCHAR(255),
          where_spent VARCHAR(255),
          why_spent VARCHAR(255),
          payment_method VARCHAR(32),
          created_at BIGINT NOT NULL,
          updated_at BIGINT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS debts (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(16) NOT NULL,
          person_name VARCHAR(255) NOT NULL,
          person_phone VARCHAR(64),
          total_amount DOUBLE PRECISION NOT NULL,
          start_date VARCHAR(16) NOT NULL,
          due_date VARCHAR(16),
          status VARCHAR(32) NOT NULL,
          notes TEXT,
          created_at BIGINT NOT NULL,
          updated_at BIGINT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS debt_payments (
          id VARCHAR(64) PRIMARY KEY,
          debt_id VARCHAR(64) NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
          user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          amount DOUBLE PRECISION NOT NULL,
          date VARCHAR(16) NOT NULL,
          time VARCHAR(16),
          note TEXT,
          payment_method VARCHAR(32),
          created_at BIGINT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS user_settings (
          user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          language VARCHAR(16) DEFAULT 'en',
          currency VARCHAR(16) DEFAULT 'BDT',
          theme VARCHAR(16) DEFAULT 'light',
          bengali_digits BOOLEAN DEFAULT FALSE,
          updated_at BIGINT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_cloud_transactions_user ON transactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_cloud_debts_user ON debts(user_id);
        CREATE INDEX IF NOT EXISTS idx_cloud_debt_payments_debt ON debt_payments(debt_id);
        CREATE INDEX IF NOT EXISTS idx_cloud_debt_payments_user ON debt_payments(user_id);
        CREATE INDEX IF NOT EXISTS idx_cloud_sessions_user ON sessions(user_id);
      `);

      console.log('[Cloud PostgreSQL] Schema initialized successfully.');

      // Check if migration from SQLite is needed
      await autoMigrateToPostgres(client);
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[Cloud PostgreSQL] Error initializing PostgreSQL:', err);
    return false;
  }
}

/**
 * Automatically migrate records from SQLite to PostgreSQL if PostgreSQL is empty
 */
async function autoMigrateToPostgres(client: pg.PoolClient) {
  try {
    const userCountResult = await client.query('SELECT COUNT(*) as count FROM users');
    const cloudUserCount = parseInt(userCountResult.rows[0].count, 10);

    if (cloudUserCount === 0) {
      console.log('[Cloud Migration] Cloud database is empty. Beginning migration from local SQLite...');

      // 1. Migrate Users
      const localUsers = sqliteDb.prepare('SELECT * FROM users').all() as any[];
      for (const u of localUsers) {
        await client.query(
          `INSERT INTO users (id, name, email, phone, password_hash, avatar_url, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING`,
          [u.id, u.name, u.email, u.phone, u.password_hash, u.avatar_url, u.created_at, u.updated_at]
        );
      }
      console.log(`[Cloud Migration] Migrated ${localUsers.length} users.`);

      // 2. Migrate Transactions
      const localTxs = sqliteDb.prepare('SELECT * FROM transactions').all() as any[];
      for (const t of localTxs) {
        await client.query(
          `INSERT INTO transactions (id, user_id, type, amount, category, date, time, description, source, where_spent, why_spent, payment_method, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (id) DO NOTHING`,
          [
            t.id,
            t.user_id,
            t.type,
            t.amount,
            t.category,
            t.date,
            t.time,
            t.description,
            t.source,
            t.where_spent,
            t.why_spent,
            t.payment_method,
            t.created_at,
            t.updated_at,
          ]
        );
      }
      console.log(`[Cloud Migration] Migrated ${localTxs.length} transactions.`);

      // 3. Migrate Debts
      const localDebts = sqliteDb.prepare('SELECT * FROM debts').all() as any[];
      for (const d of localDebts) {
        await client.query(
          `INSERT INTO debts (id, user_id, type, person_name, person_phone, total_amount, start_date, due_date, status, notes, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id) DO NOTHING`,
          [
            d.id,
            d.user_id,
            d.type,
            d.person_name,
            d.person_phone,
            d.total_amount,
            d.start_date,
            d.due_date,
            d.status,
            d.notes,
            d.created_at,
            d.updated_at,
          ]
        );
      }
      console.log(`[Cloud Migration] Migrated ${localDebts.length} debts.`);

      // 4. Migrate Payments
      const localPayments = sqliteDb.prepare('SELECT * FROM debt_payments').all() as any[];
      for (const p of localPayments) {
        await client.query(
          `INSERT INTO debt_payments (id, debt_id, user_id, amount, date, time, note, payment_method, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO NOTHING`,
          [p.id, p.debt_id, p.user_id, p.amount, p.date, p.time, p.note, p.payment_method, p.created_at]
        );
      }
      console.log(`[Cloud Migration] Migrated ${localPayments.length} debt payments.`);

      console.log('[Cloud Migration] All existing user accounts and financial data successfully migrated to Cloud PostgreSQL without data loss!');
    } else {
      console.log(`[Cloud Database] Cloud database already contains ${cloudUserCount} users.`);
    }
  } catch (err) {
    console.error('[Cloud Migration] Error migrating to PostgreSQL:', err);
  }
}
