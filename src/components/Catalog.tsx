import Link from "next/link";
import type { City } from "@/db/schema";
import { getCities, listVehicles } from "@/lib/queries";
import { VEHICLE_TYPES } from "@/lib/constants";
import { VehicleCard } from "./VehicleCard";

export async function Catalog({ city, minSeats, type }: { city: City | null; minSeats?: number; type?: string }) {
  const [cities, items] = await Promise.all([
    getCities(),
    listVehicles({ cityId: city?.id, radiusKm: 100, minSeats, type }),
  ]);

  const base = city ? `/avtobusi-pod-naem/${city.slug}` : "/avtobusi";
  const qs = (t?: string) => {
    const p = new URLSearchParams();
    if (minSeats) p.set("mesta", String(minSeats));
    if (t) p.set("tip", t);
    const s = p.toString();
    return s ? `${base}?${s}` : base;
  };
  const n = items.length;

  return (
    <main className="mx-auto flex max-w-[1240px] flex-col gap-6 px-4 pt-7 pb-16 sm:px-6">
      <nav aria-label="Път" className="flex flex-wrap gap-2 text-sm text-muted">
        <Link href="/">Начало</Link>
        <span>/</span>
        <Link href="/avtobusi">Автобуси под наем</Link>
        {city && (
          <>
            <span>/</span>
            <span className="font-semibold text-ink">{city.name}</span>
          </>
        )}
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[clamp(28px,3.4vw,42px)] font-bold">
            {city ? `Автобуси под наем в ${city.name}` : "Автобуси и микробуси под наем"}
          </h1>
          <p className="text-muted">
            {n} {n === 1 ? "превозно средство" : "превозни средства"}
            {city ? " · включително превозвачи до 100 км" : ""}
          </p>
        </div>
        <form action="/avtobusi" className="flex flex-wrap items-end gap-2">
          <label className="label">
            Град
            <select name="grad" defaultValue={city?.slug ?? ""} className="field min-w-44">
              <option value="">Цяла България</option>
              {cities.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="label">
            Мин. места
            <input name="mesta" type="number" min={1} max={99} defaultValue={minSeats || ""} className="field w-28" />
          </label>
          {type && <input type="hidden" name="tip" value={type} />}
          <button className="btn-navy">Филтрирай</button>
        </form>
      </div>

      <div role="group" aria-label="Тип превозно средство" className="flex flex-wrap gap-2.5">
        {[{ key: "", name: "Всички" }, ...VEHICLE_TYPES].map((t) => {
          const on = (type ?? "") === t.key;
          return (
            <Link
              key={t.key || "all"}
              href={qs(t.key || undefined)}
              aria-current={on ? "true" : undefined}
              className={`flex min-h-11 items-center rounded-full border px-4.5 text-[15px] font-bold ${
                on ? "border-navy bg-navy text-white" : "border-slate-300 bg-white text-ink"
              }`}
            >
              {t.name}
            </Link>
          );
        })}
      </div>

      {n > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-5">
          {items.map((item) => (
            <VehicleCard key={item.vehicle.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-[20px] border border-dashed border-slate-300 bg-white p-10 text-center text-muted">
          Няма намерени превозни средства с тези условия.{" "}
          <Link href="/zayavka" className="font-bold text-navy">
            Пусни заявка
          </Link>{" "}
          и ще я получат превозвачите, които отговарят.
        </div>
      )}

      <div className="panel mt-4 flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="flex flex-col gap-1">
          <span className="text-lg font-extrabold">Не искаш да търсиш сам?</span>
          <span className="text-muted">Опиши пътуването и подходящите превозвачи ще ти изпратят оферти.</span>
        </div>
        <Link href="/zayavka" className="btn-primary">
          Пусни заявка
        </Link>
      </div>
    </main>
  );
}
