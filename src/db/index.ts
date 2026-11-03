import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Production: DATABASE_URL=postgres://user:pass@db:5432/busrent
 * Local tests without Postgres: DATABASE_URL=pglite://./.pgdata (in-process Postgres)
 */
const url = process.env.DATABASE_URL ?? "";

type DB = ReturnType<typeof drizzlePg<typeof schema>>;

function create(): DB {
  if (url.startsWith("pglite://")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PGlite } = require("@electric-sql/pglite");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle } = require("drizzle-orm/pglite");
    return drizzle(new PGlite(url.slice("pglite://".length)), { schema }) as DB;
  }
  const client = postgres(url, { max: 10 });
  return drizzlePg(client, { schema });
}

const g = globalThis as unknown as { __db?: DB };
export const db: DB = g.__db ?? (g.__db = create());
export { schema };
