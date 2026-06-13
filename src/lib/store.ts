import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ensureSchema, getSql, hasDatabaseUrl } from "./db";

const DEV_STORE_PATH = path.join(process.cwd(), ".data", "board.json");

type StoredRow = {
  value: unknown;
};

async function readDevStore<T>(key: string): Promise<T | null> {
  try {
    const raw = await readFile(DEV_STORE_PATH, "utf8");
    const data = JSON.parse(raw) as Record<string, T>;
    return data[key] ?? null;
  } catch {
    return null;
  }
}

async function writeDevStore<T>(key: string, value: T) {
  await mkdir(path.dirname(DEV_STORE_PATH), { recursive: true });

  let data: Record<string, T> = {};
  try {
    const raw = await readFile(DEV_STORE_PATH, "utf8");
    data = JSON.parse(raw) as Record<string, T>;
  } catch {
    data = {};
  }

  data[key] = value;
  await writeFile(DEV_STORE_PATH, JSON.stringify(data, null, 2), "utf8");
}

async function readFromPostgres<T>(key: string): Promise<T | null> {
  const query = getSql();
  if (!query) {
    return null;
  }

  await ensureSchema();

  const rows = (await query`
    SELECT value
    FROM app_state
    WHERE key = ${key}
    LIMIT 1
  `) as StoredRow[];

  return (rows[0]?.value as T | undefined) ?? null;
}

async function writeToPostgres<T>(key: string, value: T) {
  const query = getSql();
  if (!query) {
    return;
  }

  await ensureSchema();

  await query`
    INSERT INTO app_state (key, value, updated_at)
    VALUES (${key}, ${JSON.stringify(value)}::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        updated_at = NOW()
  `;
}

async function tryMigrateFromRedis<T>(key: string): Promise<T | null> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return null;
  }

  try {
    const { Redis } = await import("@upstash/redis");
    return await Redis.fromEnv().get<T>(key);
  } catch {
    return null;
  }
}

export async function getStoredValue<T>(key: string): Promise<T | null> {
  if (hasDatabaseUrl()) {
    const stored = await readFromPostgres<T>(key);
    if (stored) {
      return stored;
    }

    const legacy = await tryMigrateFromRedis<T>(key);
    if (legacy) {
      await writeToPostgres(key, legacy);
      return legacy;
    }

    return null;
  }

  return readDevStore<T>(key);
}

export async function setStoredValue<T>(key: string, value: T) {
  if (hasDatabaseUrl()) {
    await writeToPostgres(key, value);
    return;
  }

  await writeDevStore(key, value);
}

export function getStorageMode() {
  if (hasDatabaseUrl()) {
    return "neon-postgres";
  }

  return "local-dev-store";
}
