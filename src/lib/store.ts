import { Redis } from "@upstash/redis";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DEV_STORE_PATH = path.join(process.cwd(), ".data", "board.json");

function hasUpstashEnv() {
  return Boolean(
    process.env.KV_REST_API_URL &&
      process.env.KV_REST_API_TOKEN,
  );
}

function getRedis() {
  return Redis.fromEnv();
}

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

export async function getStoredValue<T>(key: string): Promise<T | null> {
  if (hasUpstashEnv()) {
    return getRedis().get<T>(key);
  }

  return readDevStore<T>(key);
}

export async function setStoredValue<T>(key: string, value: T) {
  if (hasUpstashEnv()) {
    await getRedis().set(key, value);
    return;
  }

  await writeDevStore(key, value);
}

export function getStorageMode() {
  return hasUpstashEnv() ? "upstash-redis" : "local-dev-store";
}
