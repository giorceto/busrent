// ДЕМО данни: превозвач „Цветина-Мездра“ с част от автопарка, за тестове.
// НЕ се пуска автоматично. На живо — само след писмено съгласие на фирмата:
//   docker compose exec app node scripts/seed-demo.mjs
import path from "node:path";
import { cp, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";

const here = path.dirname(fileURLToPath(import.meta.url));
const url = process.env.DATABASE_URL ?? "";
const uploadDir = process.env.UPLOAD_DIR ?? path.join(process.cwd(), ".uploads");

let db, close;
if (url.startsWith("pglite://")) {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const c = new PGlite(url.slice("pglite://".length));
  db = drizzle(c);
  close = () => c.close();
} else {
  const { default: postgres } = await import("postgres");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const c = postgres(url, { max: 1 });
  db = drizzle(c);
  close = () => c.end();
}

const rows = (r) => (Array.isArray(r) ? r : r.rows);
const existing = rows(await db.execute(sql`select id from carriers where eik = '000000001'`));
if (existing.length) {
  console.log("[seed-demo] вече има демо данни");
  await close();
  process.exit(0);
}

await mkdir(path.join(uploadDir, "public", "demo"), { recursive: true });
await cp(path.join(here, "..", "seed", "demo"), path.join(uploadDir, "public", "demo"), { recursive: true });

const city = rows(await db.execute(sql`select id from cities where slug = 'mezdra'`))[0];
const carrier = rows(
  await db.execute(sql`insert into carriers (slug, eik, name, address, vat_valid, city_id, contact_name, phone, email, description, license, zone, status)
  values ('cvetina-mezdra', '000000001', '„Цветина-Мездра“ ЕООД', 'гр. Мездра 3100, ул. Св. св. Кирил и Методий 52-В', true, ${city.id},
  'Офис', '0359 887 424320', 'demo@busrent.eu',
  'Автобусни превози в страната и чужбина. Транспорт на организирани екскурзии и почивки за туристически агенции, общини, предприятия и училища. Автобусите са оборудвани със система за пречистване на въздуха HISPACOLD.',
  'Евро лиценз №0599', 'bg', 'approved') returning id`),
)[0];

const lux = ["Климатик", "Мултимедия", "Кафе машина", "Микрофон", "Навигация", "Лиценз за чужбина"];
const V = [
  ["setra-s-517-hd", "bus", "Setra", "S 517 HD", 56, "56+2+1", null, "EURO 6", [...lux, "USB зарядни"], [["b01-ext", "contain", "main"], ["b01-int1", "cover", "gallery"], ["b01-int2", "cover", "gallery"], ["b01-usb", "cover", "gallery"], ["b01-shema", "contain", "seatmap"]]],
  ["setra-s-416-gt-hd", "bus", "Setra", "S 416 GT HD", 53, "53+2+1", null, "EURO 6", lux, [["b12", "contain", "main"]]],
  ["mercedes-tourismo-rhd-m2a", "bus", "Mercedes-Benz", "Tourismo RHD M2A", 53, "53+2+1", null, "EURO 6", [...lux, "USB зарядни"], [["b09", "contain", "main"]]],
  ["mercedes-tourismo-15-rhd", "bus", "Mercedes-Benz", "Tourismo 15 RHD", 51, "51+2+1", 2012, "EURO 5", lux, [["b14", "contain", "main"]]],
  ["mercedes-tourismo-m2", "bus", "Mercedes-Benz", "Tourismo M2", 53, "53+2+1", 2007, "EURO 4", lux, [["b13", "contain", "main"]]],
  ["mercedes-benz-wc", "bus", "Mercedes-Benz", "", 50, "50+1+1", null, null, ["Климатик", "Мултимедия", "Тоалетна", "Кафе машина", "Хладилник"], [["b19", "cover", "main"]]],
  ["iveco-19", "mini", "Iveco", "", 19, "19+1", 2008, null, ["Климатик", "Навигация"], [["b20", "cover", "main"]]],
  ["mercedes-sprinter-16", "mini", "Mercedes-Benz", "Sprinter", 16, "16+1", 2009, null, ["Климатик", "Навигация"], [["b21", "cover", "main"]]],
  ["mercedes-benz-8", "mini", "Mercedes-Benz", "", 8, "8+1", 2009, null, ["Климатик", "Навигация"], [["b24", "cover", "main"]]],
];
for (const [slug, type, brand, model, seats, label, year, euro, extras, pics] of V) {
  const v = rows(
    await db.execute(sql`insert into vehicles (slug, carrier_id, type, brand, model, seats, seats_label, year, euro, extras)
    values (${slug}, ${carrier.id}, ${type}, ${brand}, ${model}, ${seats}, ${label}, ${year}, ${euro}, ${`{${extras.map((e) => `"${e}"`).join(",")}}`}) returning id`),
  )[0];
  let i = 0;
  for (const [file, fit, kind] of pics) {
    await db.execute(sql`insert into photos (vehicle_id, url, kind, fit, sort) values (${v.id}, ${`/uploads/demo/${file}.webp`}, ${kind}, ${fit}, ${kind === "seatmap" ? 99 : i++})`);
  }
}
console.log(`[seed-demo] добавени ${V.length} превозни средства`);
await close();
