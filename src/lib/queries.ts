import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { db, schema } from "@/db";
import { distanceKm } from "./geo";
import { VEHICLE_TYPES, zoneKm } from "./constants";

const { cities, carriers, vehicles, photos } = schema;

export async function getCities() {
  return db.select().from(cities).orderBy(asc(cities.name));
}

export async function getCityBySlug(slug: string) {
  const [c] = await db.select().from(cities).where(eq(cities.slug, slug)).limit(1);
  return c ?? null;
}

export type VehicleListItem = Awaited<ReturnType<typeof listVehicles>>[number];

/** Каталог: активни превозни средства на одобрени превозвачи. */
export async function listVehicles(opts: {
  cityId?: number | null;
  radiusKm?: number;
  minSeats?: number;
  type?: string;
  limit?: number;
}) {
  const conds = [eq(carriers.status, "approved"), eq(vehicles.active, true)];
  if (opts.minSeats) conds.push(gte(vehicles.seats, opts.minSeats));
  const t = VEHICLE_TYPES.find((x) => x.key === opts.type);
  if (t) {
    conds.push(gte(vehicles.seats, t.min));
    conds.push(lte(vehicles.seats, t.max));
  }

  const rows = await db
    .select({ vehicle: vehicles, carrier: carriers, city: cities })
    .from(vehicles)
    .innerJoin(carriers, eq(vehicles.carrierId, carriers.id))
    .leftJoin(cities, eq(carriers.cityId, cities.id))
    .where(and(...conds))
    .orderBy(desc(vehicles.createdAt));

  let list = rows.map((r) => ({ ...r, distance: null as number | null }));
  if (opts.cityId) {
    const [c] = await db.select().from(cities).where(eq(cities.id, opts.cityId)).limit(1);
    if (c) {
      const radius = opts.radiusKm ?? 100;
      list = list
        .map((r) => ({ ...r, distance: r.city ? distanceKm(c.lat, c.lng, r.city.lat, r.city.lng) : null }))
        .filter((r) => r.distance !== null && r.distance <= radius)
        .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    }
  }
  if (opts.limit) list = list.slice(0, opts.limit);

  const ids = list.map((r) => r.vehicle.id);
  const pics = ids.length
    ? await db.select().from(photos).where(inArray(photos.vehicleId, ids)).orderBy(asc(photos.sort))
    : [];
  return list.map((r) => ({
    ...r,
    cover: pics.find((p) => p.vehicleId === r.vehicle.id && p.kind !== "seatmap") ?? null,
  }));
}

export async function getVehicle(slug: string) {
  const [row] = await db
    .select({ vehicle: vehicles, carrier: carriers, city: cities })
    .from(vehicles)
    .innerJoin(carriers, eq(vehicles.carrierId, carriers.id))
    .leftJoin(cities, eq(carriers.cityId, cities.id))
    .where(and(eq(vehicles.slug, slug), eq(carriers.status, "approved")))
    .limit(1);
  if (!row) return null;
  const pics = await db.select().from(photos).where(eq(photos.vehicleId, row.vehicle.id)).orderBy(asc(photos.sort));
  const count = await db.$count(vehicles, and(eq(vehicles.carrierId, row.carrier.id), eq(vehicles.active, true)));
  return { ...row, photos: pics, carrierVehicleCount: Number(count) };
}

/**
 * Към кои превозвачи отива заявката:
 * одобрен превозвач, базата му е в зоната, която е избрал, и има активен автобус
 * с достатъчно места (но не огромен спрямо групата) и с всички изискани екстри.
 */
export async function matchCarriers(req: { fromCityId: number; pax: number; extras: string[] }) {
  const [from] = await db.select().from(cities).where(eq(cities.id, req.fromCityId)).limit(1);
  if (!from) return [];
  const maxSeats = Math.max(req.pax * 2 + 10, req.pax + 20);
  const rows = await db
    .select({ vehicle: vehicles, carrier: carriers, city: cities })
    .from(vehicles)
    .innerJoin(carriers, eq(vehicles.carrierId, carriers.id))
    .leftJoin(cities, eq(carriers.cityId, cities.id))
    .where(
      and(
        eq(carriers.status, "approved"),
        eq(vehicles.active, true),
        gte(vehicles.seats, req.pax),
        lte(vehicles.seats, maxSeats),
      ),
    );

  const result = new Map<number, { carrier: typeof carriers.$inferSelect; vehicles: string[] }>();
  for (const r of rows) {
    if (!r.city) continue;
    const d = distanceKm(from.lat, from.lng, r.city.lat, r.city.lng);
    if (d > zoneKm(r.carrier.zone)) continue;
    if (!req.extras.every((e) => r.vehicle.extras.includes(e))) continue;
    const entry = result.get(r.carrier.id) ?? { carrier: r.carrier, vehicles: [] };
    entry.vehicles.push(`${r.vehicle.brand} ${r.vehicle.model}`.trim());
    result.set(r.carrier.id, entry);
  }
  return [...result.values()];
}
