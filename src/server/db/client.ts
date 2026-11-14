import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import * as schema from "./schema";
import { applyMigrations } from "./migrate";

export type AppDatabase = PgliteDatabase<typeof schema>;

export type DbHandle = {
  db: AppDatabase;
  client: PGlite;
};

let singleton: DbHandle | null = null;

export async function createDb(dataDir?: string): Promise<DbHandle> {
  if (dataDir) {
    mkdirSync(dirname(dataDir), { recursive: true });
  }
  const client = dataDir ? new PGlite(dataDir) : new PGlite();
  const db = drizzle(client, { schema });
  await applyMigrations(client);
  return { db, client };
}

export async function getDb(): Promise<AppDatabase> {
  if (!singleton) {
    // Persist local/dev data so Next.js HMR and route handlers share one ledger.
    // During `next build` prerender, use in-memory unless explicitly configured.
    const isBuild = process.env.NEXT_PHASE === "phase-production-build";
    const dataDir =
      process.env.PGLITE_DATA_DIR ??
      (process.env.NODE_ENV === "test" || isBuild
        ? undefined
        : "./.data/pglite");
    singleton = await createDb(dataDir);
  }
  return singleton.db;
}

/** Test helper: replace process-wide DB singleton. */
export async function resetDbForTests(): Promise<AppDatabase> {
  if (singleton) {
    await singleton.client.close();
    singleton = null;
  }
  singleton = await createDb();
  return singleton.db;
}
