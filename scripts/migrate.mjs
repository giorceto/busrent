// Пуска се при всяко стартиране на контейнера: прилага новите миграции и добавя градовете.
// DATABASE_URL=postgres://...  (или pglite://./.pgdata за локални тестове)
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import { CITIES } from "./cities.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.join(here, "..", "drizzle");
const url = process.env.DATABASE_URL ?? "";

let db;
let close = async () => {};
if (url.startsWith("pglite://")) {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const client = new PGlite(url.slice("pglite://".length));
  db = drizzle(client);
  await migrate(db, { migrationsFolder });
  close = () => client.close();
} else {
  const { default: postgres } = await import("postgres");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");
  const client = postgres(url, { max: 1 });
  db = drizzle(client);
  // Базата може да тръгва няколко секунди след приложението.
  for (let i = 0; ; i++) {
    try {
      await db.execute(sql`select 1`);
      break;
    } catch (e) {
      if (i >= 30) throw e;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  await migrate(db, { migrationsFolder });
  close = () => client.end();
}

for (const [slug, name, nameEn, lat, lng] of CITIES) {
  await db.execute(sql`
    insert into cities (slug, name, name_en, lat, lng) values (${slug}, ${name}, ${nameEn}, ${lat}, ${lng})
    on conflict (slug) do update set name = excluded.name, name_en = excluded.name_en, lat = excluded.lat, lng = excluded.lng`);
}
console.log(`[migrate] OK, ${CITIES.length} града`);
await close();
