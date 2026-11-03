export const VEHICLE_TYPES = [
  { key: "mini", name: "Микробус", seats: "8 – 20 места", min: 1, max: 20 },
  { key: "midi", name: "Мидибус", seats: "21 – 35 места", min: 21, max: 35 },
  { key: "bus", name: "Автобус", seats: "36 – 57 места", min: 36, max: 57 },
  { key: "double", name: "Двуетажен", seats: "58 – 90 места", min: 58, max: 999 },
] as const;

export type VehicleType = (typeof VEHICLE_TYPES)[number]["key"];

export function typeForSeats(seats: number): VehicleType {
  return (VEHICLE_TYPES.find((t) => seats >= t.min && seats <= t.max) ?? VEHICLE_TYPES[2]).key;
}

export function typeName(key: string) {
  return VEHICLE_TYPES.find((t) => t.key === key)?.name ?? "Автобус";
}

/** Екстри, които клиентът може да изиска и превозвачът да отбележи. */
export const EXTRAS = [
  "Климатик",
  "Тоалетна",
  "Wi-Fi",
  "USB зарядни",
  "Кафе машина",
  "Хладилник",
  "Микрофон",
  "Мултимедия",
  "Навигация",
  "Лиценз за чужбина",
] as const;

export const ZONES = [
  { key: "city", label: "Само от моя град", km: 15 },
  { key: "100", label: "До +100 км", km: 100 },
  { key: "200", label: "До +200 км", km: 200 },
  { key: "bg", label: "Цяла България", km: 10000 },
] as const;

export function zoneKm(key: string) {
  return ZONES.find((z) => z.key === key)?.km ?? 100;
}

export const TRIP_TYPES = [
  { key: "round", label: "С връщане" },
  { key: "oneway", label: "Еднопосочно" },
  { key: "multi", label: "Многодневен тур" },
] as const;

export function tripLabel(key: string) {
  return TRIP_TYPES.find((t) => t.key === key)?.label ?? key;
}
