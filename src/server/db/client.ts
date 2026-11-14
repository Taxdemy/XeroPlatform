import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import { Pool } from "pg";
import * as schema from "./schema";
import { applyMigrations } from "./migrate";

export type AppDatabase =
  | NodePgDatabase<typeof schema>
  | PgliteDatabase<typeof schema>;

type PgHandle = { kind: "pg"; db: NodePgDatabase<typeof schema>; pool: Pool };
type PgliteHandle = {
  kind: "pglite";
  db: PgliteDatabase<typeof schema>;
  client: PGlite;
};

let singleton: PgHandle | PgliteHandle | null = null;

function databaseUrl(): string {
  return process.env.DATABASE_URL?.trim() ?? "";
}

async function createPostgresDb(url: string): Promise<PgHandle> {
  const pool = new Pool({ connectionString: url, max: 5 });
  const db = drizzlePg(pool, { schema });
  return { kind: "pg", db, pool };
}

async function createPgliteDb(dataDir?: string): Promise<PgliteHandle> {
  if (dataDir) {
    mkdirSync(dirname(dataDir), { recursive: true });
  }
  const client = dataDir ? new PGlite(dataDir) : new PGlite();
  const db = drizzlePglite(client, { schema });
  await applyMigrations(client);
  return { kind: "pglite", db, client };
}

export async function getDb(): Promise<AppDatabase> {
  if (!singleton) {
    const url = databaseUrl();
    if (url) {
      singleton = await createPostgresDb(url);
    } else {
      // Local/dev/test only. Published apps must set DATABASE_URL (platform Postgres).
      const isBuild = process.env.NEXT_PHASE === "phase-production-build";
      const dataDir =
        process.env.PGLITE_DATA_DIR ??
        (process.env.NODE_ENV === "test" ||
        isBuild ||
        process.env.NODE_ENV === "production"
          ? undefined
          : "./.data/pglite");
      singleton = await createPgliteDb(dataDir);
    }
  }
  return singleton.db;
}

/** Test helper: replace process-wide DB singleton with fresh in-memory PGlite. */
export async function resetDbForTests(): Promise<AppDatabase> {
  if (singleton?.kind === "pglite") {
    await singleton.client.close();
  } else if (singleton?.kind === "pg") {
    await singleton.pool.end();
  }
  singleton = null;
  singleton = await createPgliteDb();
  return singleton.db;
}
