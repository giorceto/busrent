"use client";

import { useState } from "react";
import { BusDrawing } from "./Icons";

type Pic = { id: number; url: string; fit: string; kind: string };

export function Gallery({ photos, title }: { photos: Pic[]; title: string }) {
  const [sel, setSel] = useState(0);
  if (photos.length === 0) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-[22px] bg-sky-soft text-navy">
        <BusDrawing width={220} />
      </div>
    );
  }
  const main = photos[sel];
  const others = photos.map((p, i) => ({ ...p, i })).filter((p) => p.i !== sel).slice(0, 4);
  const img = (p: Pic) => (p.fit === "contain" ? "object-contain" : "object-cover");

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-2.5">
      <div className="relative min-h-[300px] overflow-hidden rounded-[22px] border border-line bg-white sm:min-h-[400px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={main.url} alt={main.kind === "seatmap" ? `Схема на местата, ${title}` : title} className={`absolute inset-0 h-full w-full ${img(main)}`} />
      </div>
      {others.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          {others.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSel(p.i)}
              aria-label={`Покажи снимка ${p.i + 1}`}
              className="relative min-h-36 cursor-pointer overflow-hidden rounded-[18px] border border-line bg-white sm:min-h-[195px]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" loading="lazy" className={`absolute inset-0 h-full w-full ${img(p)}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
