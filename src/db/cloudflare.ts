import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Database, SqlValue } from "./types";
export async function getDatabase(): Promise<Database> {
  const { env } = await getCloudflareContext({ async: true });
  const db = env.DB;
  return {
    async get<T>(sql: string, params: SqlValue[] = []) {
      return db
        .prepare(sql)
        .bind(...params)
        .first<T>();
    },
    async all<T>(sql: string, params: SqlValue[] = []) {
      const result = await db
        .prepare(sql)
        .bind(...params)
        .all<T>();
      return result.results;
    },
    async run(sql, params = []) {
      await db
        .prepare(sql)
        .bind(...params)
        .run();
    },
    async batch(statements) {
      if (statements.length)
        await db.batch(
          statements.map((s) => db.prepare(s.sql).bind(...(s.params || []))),
        );
    },
  };
}
