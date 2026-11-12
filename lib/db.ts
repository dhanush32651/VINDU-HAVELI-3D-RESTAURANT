// Single shared SQLite database for users, sessions, tables, reservations, orders and payments.
// Node's built-in SQLite is synchronous, so a BEGIN IMMEDIATE transaction fully serialises writers:
// two customers can never pass the same availability check at the same time.
import fs from 'node:fs';
import path from 'node:path';
import { bootstrapOwner } from './bootstrap';

export interface Stmt { run(...p: any[]): { changes: number; lastInsertRowid: number | bigint }; get(...p: any[]): any; all(...p: any[]): any[] }
export interface Db { exec(sql: string): void; prepare(sql: string): Stmt }

const g = globalThis as unknown as { __vhDb?: Db };

export function getDb(): Db {
  if (g.__vhDb) return g.__vhDb;
  // SQLite is built into Node 22.13+ (and 24), so there is nothing to compile or install.
  // Loaded at runtime (not imported) so the Next.js bundler leaves it alone.
  const sqlite = (process as any).getBuiltinModule?.('node:sqlite');
  if (!sqlite) throw new Error(`This website needs Node.js 22.13 or newer (you have ${process.version}). Install the current LTS from nodejs.org.`);
  const file = process.env.DATABASE_PATH || path.join(process.cwd(), 'storage', 'vindu-haveli.db');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db: Db = new sqlite.DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  initDb(db);
  bootstrapOwner(db);
  g.__vhDb = db;
  return db;
}

/** Used by tests (and available for other drivers): install an already-opened database. */
export function setDb(db: Db) { g.__vhDb = db; }

export const DEFAULT_TABLES: [number, string, number][] = [
  [1, 'TABLE 01', 2], [2, 'TABLE 02', 2], [3, 'TABLE 03', 4], [4, 'TABLE 04', 4],
  [5, 'TABLE 05', 4], [6, 'TABLE 06', 6], [7, 'TABLE 07', 6], [8, 'TABLE 08', 8],
];

export function initDb(db: Db) {
  const schema = fs.readFileSync(path.join(process.cwd(), 'db', 'schema.sql'), 'utf8');
  db.exec(schema);
  const ins = db.prepare('INSERT OR IGNORE INTO dining_tables (id, label, seats) VALUES (?, ?, ?)');
  for (const [id, label, seats] of DEFAULT_TABLES) ins.run(id, label, seats);
}

/** Run fn inside one exclusive transaction. Rolls back if fn throws. */
export function tx<T>(db: Db, fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try { const r = fn(); db.exec('COMMIT'); return r; }
  catch (e) { try { db.exec('ROLLBACK'); } catch {} throw e; }
}
