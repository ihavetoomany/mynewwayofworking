import { neon, NeonQueryFunction } from "@neondatabase/serverless";

let sql: NeonQueryFunction<false, false> | null = null;
let schemaReady: Promise<void> | null = null;

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export function getSql() {
  if (!hasDatabaseUrl()) {
    return null;
  }

  if (!sql) {
    sql = neon(process.env.DATABASE_URL!);
  }

  return sql;
}

export async function ensureSchema() {
  const query = getSql();
  if (!query) {
    return;
  }

  if (!schemaReady) {
    schemaReady = query`
      CREATE TABLE IF NOT EXISTS app_state (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `.then(() => undefined);
  }

  await schemaReady;
}
