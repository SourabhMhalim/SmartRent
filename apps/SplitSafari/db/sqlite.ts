import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// The existing D1 database uses SQLite. Keep its tables and integer-paise data
// when running on the same Node/Nginx host as the portfolio and SmartRent.
const state = globalThis as typeof globalThis & { splitSafariDatabase?: DatabaseSync };

function connection() {
  if (state.splitSafariDatabase) return state.splitSafariDatabase;
  const path = resolve(process.env.SPLITSAFARI_DATABASE_PATH || 'data/splitsafari.sqlite');
  mkdirSync(dirname(path), { recursive: true });
  const database = new DatabaseSync(path);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL,
      data TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY NOT NULL, group_id TEXT NOT NULL, member_id TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT '1970-01-01T00:00:00.000Z'
    );
    CREATE TABLE IF NOT EXISTS invites (
      token TEXT PRIMARY KEY NOT NULL, group_id TEXT NOT NULL, member_id TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT '1970-01-01T00:00:00.000Z'
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_group ON sessions(group_id);
    CREATE INDEX IF NOT EXISTS idx_invites_group ON invites(group_id);
  `);
  const sessionColumns=database.prepare('PRAGMA table_info(sessions)').all() as {name:string}[];
  const inviteColumns=database.prepare('PRAGMA table_info(invites)').all() as {name:string}[];
  if(!sessionColumns.some(column=>column.name==='created_at'))database.exec("ALTER TABLE sessions ADD COLUMN created_at TEXT NOT NULL DEFAULT '1970-01-01T00:00:00.000Z'");
  if(!inviteColumns.some(column=>column.name==='created_at'))database.exec("ALTER TABLE invites ADD COLUMN created_at TEXT NOT NULL DEFAULT '1970-01-01T00:00:00.000Z'");
  state.splitSafariDatabase = database;
  return database;
}

export function getDatabase() {
  return {
    prepare(sql: string) {
      return {
        bind(...values: SQLInputValue[]) {
          return {
            async first<T>(): Promise<T | null> {
              return (connection().prepare(sql).get(...values) as T | undefined) ?? null;
            },
            async run() {
              const result = connection().prepare(sql).run(...values);
              return { meta: { changes: Number(result.changes) } };
            },
          };
        },
      };
    },
  };
}
