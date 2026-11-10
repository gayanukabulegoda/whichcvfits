import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import type { Database, SqlValue, Statement } from "./types.ts";

const connections = new Map<string, Database>();
export async function getDatabase(): Promise<Database> {
  const filename =
    process.env.WHICHCVFITS_DB_PATH ||
    path.join(process.cwd(), "data/whichcvfits.db");
  const cached = connections.get(filename);
  if (cached) return cached;
  if (filename !== ":memory:")
    fs.mkdirSync(path.dirname(path.resolve(filename)), { recursive: true });
  const existed = filename !== ":memory:" && fs.existsSync(filename);
  const db = new DatabaseSync(filename);
  db.exec(
    "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;",
  );
  db.exec(
    "CREATE TABLE IF NOT EXISTS app_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)",
  );
  const pending = fs
    .readdirSync(path.join(process.cwd(), "migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .filter(
      (name) =>
        !db.prepare("SELECT name FROM app_migrations WHERE name=?").get(name),
    );
  // VACUUM includes committed WAL pages. A plain file copy would miss them.
  if (existed && pending.length)
    db.prepare("VACUUM INTO ?").run(
      path.resolve(filename) + ".backup-" + Date.now(),
    );
  for (const name of pending) {
    db.exec("BEGIN IMMEDIATE");
    try {
      db.exec(
        fs.readFileSync(path.join(process.cwd(), "migrations", name), "utf8"),
      );
      db.prepare("INSERT INTO app_migrations VALUES (?,?)").run(
        name,
        new Date().toISOString(),
      );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      db.close();
      throw error;
    }
  }
  const adapter: Database = {
    async get<T>(sql: string, params: SqlValue[] = []) {
      return (db.prepare(sql).get(...params) as T | undefined) ?? null;
    },
    async all<T>(sql: string, params: SqlValue[] = []) {
      return db.prepare(sql).all(...params) as T[];
    },
    async run(sql: string, params: SqlValue[] = []) {
      db.prepare(sql).run(...params);
    },
    async batch(statements: Statement[]) {
      db.exec("BEGIN IMMEDIATE");
      try {
        for (const s of statements) db.prepare(s.sql).run(...(s.params || []));
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  };
  connections.set(filename, adapter);
  return adapter;
}
