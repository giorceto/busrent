import { sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

/** Разстояние по права линия (km) между две точки — в JS. */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const r = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

/** Същото като SQL израз (haversine) — за филтриране в базата. */
export function distanceSql(latCol: AnyPgColumn, lngCol: AnyPgColumn, lat: number, lng: number): SQL<number> {
  return sql<number>`(2 * 6371 * asin(sqrt(
    power(sin(radians(${latCol} - ${lat}) / 2), 2) +
    cos(radians(${lat})) * cos(radians(${latCol})) * power(sin(radians(${lngCol} - ${lng}) / 2), 2)
  )))`;
}
