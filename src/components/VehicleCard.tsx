import Link from "next/link";
import type { VehicleListItem } from "@/lib/queries";
import { typeName } from "@/lib/constants";
import { BusDrawing, Shield } from "./Icons";

export function VehiclePhoto({
  url,
  fit,
  alt,
  className = "",
}: {
  url?: string | null;
  fit?: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-white ${className}`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"}`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-sky-soft text-navy">
          <BusDrawing />
        </div>
      )}
    </div>
  );
}

export function VehicleCard({ item }: { item: VehicleListItem }) {
  const { vehicle: v, carrier: c, city } = item;
  const title = `${v.brand} ${v.model}`.trim();
  return (
    <Link
      href={`/avtobus/${v.slug}`}
      className="card-hover flex flex-col overflow-hidden rounded-[20px] border border-line bg-white text-ink"
    >
      <VehiclePhoto url={item.cover?.url} fit={item.cover?.fit} alt={title} className="h-48 border-b border-[#eef1f5]" />
      <div className="flex flex-col gap-2 px-5 pt-4 pb-5">
        <div className="flex items-start justify-between gap-2">
          <span className="text-lg font-extrabold">{title}</span>
          <span className="shrink-0 rounded-lg bg-sky-soft px-2 py-1 text-xs font-extrabold text-navy">
            {typeName(v.type)}
          </span>
        </div>
        <span className="text-[15px] font-medium text-muted">
          {v.seatsLabel} места{v.year ? ` · ${v.year}` : ""}
          {v.euro ? ` · ${v.euro}` : ""}
        </span>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <Shield size={16} className="text-ok" />
          {c.name}
          {city ? ` · ${city.name}` : ""}
          {item.distance != null && item.distance > 5 ? ` (${Math.round(item.distance)} км)` : ""}
        </span>
      </div>
    </Link>
  );
}
