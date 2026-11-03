import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVehicle } from "@/lib/queries";
import { typeName } from "@/lib/constants";
import { Gallery } from "@/components/Gallery";
import { Check } from "@/components/Icons";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getVehicle(slug);
  if (!data) return {};
  const { vehicle: v, carrier: c, city } = data;
  const title = `${v.brand} ${v.model}`.trim();
  return {
    title: `${title} под наем, ${v.seatsLabel} места${city ? ` · ${city.name}` : ""}`,
    description: `${typeName(v.type)} ${title} с ${v.seatsLabel} места от ${c.name}. Поискай оферта без регистрация.`,
    alternates: { canonical: `/avtobus/${v.slug}` },
    openGraph: data.photos[0] ? { images: [data.photos[0].url] } : undefined,
  };
}

export default async function VehiclePage({ params }: { params: Params }) {
  const { slug } = await params;
  const data = await getVehicle(slug);
  if (!data) notFound();
  const { vehicle: v, carrier: c, city, photos, carrierVehicleCount } = data;
  const title = `${v.brand} ${v.model}`.trim();
  const seatmap = photos.find((p) => p.kind === "seatmap");
  const specs = [
    ["Места", v.seatsLabel],
    ["Тип", typeName(v.type)],
    ["Евро норма", v.euro],
    ["Година", v.year ? String(v.year) : null],
    ["База", city?.name],
  ].filter(([, val]) => val) as [string, string][];
  const requestHref = `/zayavka?grad=${city?.slug ?? ""}&avtobus=${v.slug}`;

  return (
    <main className="mx-auto flex max-w-[1240px] flex-col gap-6 px-4 pt-7 pb-18 sm:px-6">
      <nav aria-label="Път" className="flex flex-wrap gap-2 text-sm text-muted">
        <Link href="/">Начало</Link>
        <span>/</span>
        {city ? <Link href={`/avtobusi-pod-naem/${city.slug}`}>{city.name}</Link> : <Link href="/avtobusi">Каталог</Link>}
        <span>/</span>
        <span className="font-semibold text-ink">{title}</span>
      </nav>

      <Gallery photos={photos} title={title} />

      <div className="flex flex-wrap items-start gap-8">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-7">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-ok-soft px-3 py-1.5 text-[13px] font-extrabold text-ok">Проверен превозвач</span>
              {c.license && (
                <span className="rounded-full bg-sky-soft px-3 py-1.5 text-[13px] font-extrabold text-navy">{c.license}</span>
              )}
              {v.euro && (
                <span className="rounded-full bg-[#fff6e5] px-3 py-1.5 text-[13px] font-extrabold text-[#7a4b00]">{v.euro}</span>
              )}
            </div>
            <h1 className="text-[clamp(30px,3.6vw,44px)] font-bold">{title}</h1>
            <div className="flex flex-wrap gap-x-5 gap-y-2 font-semibold text-slate-700">
              <span>{v.seatsLabel} места</span>
              {city && <span>База: {city.name}</span>}
            </div>
          </div>

          <section aria-labelledby="specs" className="panel flex flex-col gap-5 p-7">
            <h2 id="specs" className="text-xl font-bold">
              Характеристики
            </h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
              {specs.map(([k, val]) => (
                <div key={k} className="flex flex-col gap-1 rounded-2xl bg-ground p-4">
                  <span className="text-[13px] font-bold tracking-wide text-muted uppercase">{k}</span>
                  <span className="text-[19px] font-extrabold">{val}</span>
                </div>
              ))}
            </div>
            {v.extras.length > 0 && (
              <>
                <h3 className="mt-2 font-sans text-[17px] font-extrabold tracking-normal">Екстри</h3>
                <div className="flex flex-wrap gap-2.5">
                  {v.extras.map((e) => (
                    <span key={e} className="flex items-center gap-2 rounded-xl bg-[#f1f4f8] px-3.5 py-2.5 text-[15px] font-semibold">
                      <Check size={16} className="text-ok" />
                      {e}
                    </span>
                  ))}
                </div>
              </>
            )}
          </section>

          {seatmap && (
            <section aria-labelledby="seatmap" className="panel flex flex-wrap items-center gap-7 p-7">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={seatmap.url} alt={`Схема на местата в ${title}`} loading="lazy" className="w-[220px] max-w-full rounded-xl" />
              <div className="flex flex-[1_1_260px] flex-col gap-2.5">
                <h2 id="seatmap" className="text-xl font-bold">
                  Схема на местата
                </h2>
                <p className="leading-relaxed text-slate-700">Местата могат да се разпределят предварително между пътниците.</p>
              </div>
            </section>
          )}

          {(v.description || c.description) && (
            <section aria-labelledby="about" className="flex flex-col gap-3">
              <h2 id="about" className="text-xl font-bold">
                Описание
              </h2>
              {[v.description, c.description].filter(Boolean).map((t, i) => (
                <p key={i} className="text-[17px] leading-relaxed whitespace-pre-line text-slate-700">
                  {t}
                </p>
              ))}
            </section>
          )}

          <section aria-labelledby="reviews" className="flex flex-col gap-4">
            <h2 id="reviews" className="text-xl font-bold">
              Отзиви
            </h2>
            <div className="flex flex-col gap-1.5 rounded-[18px] border border-dashed border-slate-300 bg-white p-7">
              <span className="text-[17px] font-extrabold">Все още няма отзиви</span>
              <span className="leading-relaxed text-muted">
                Отзив може да остави само клиент с потвърдено пътуване през BusRent. Превозвачът може да отговори публично.
              </span>
            </div>
          </section>
        </div>

        <aside aria-label="Заявка за оферта" className="flex max-w-full flex-[1_1_320px] flex-col gap-4">
          <div className="panel flex flex-col gap-4 p-6 shadow-[0_18px_44px_rgba(14,42,80,.08)]">
            <span className="text-xl font-extrabold">Поискай оферта</span>
            <p className="text-[15px] leading-relaxed text-muted">
              Цената зависи от маршрута и датите. Превозвачът ще ти изпрати оферта директно.
            </p>
            <Link href={requestHref} className="btn-primary min-h-13 text-[17px]">
              Поискай оферта
            </Link>
          </div>
          <div className="panel flex flex-col gap-3.5 p-6">
            <div className="flex items-center gap-3.5">
              <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-navy text-xl font-extrabold text-white">
                {c.name.replace(/[„“"]/g, "").charAt(0)}
              </span>
              <div className="flex flex-col">
                <span className="text-[17px] font-extrabold">{c.name}</span>
                <span className="text-sm text-muted">
                  {city?.name ?? ""} · ЕИК {c.eik}
                </span>
              </div>
            </div>
            <ul className="flex flex-col gap-2.5 text-[15px] text-slate-700">
              <li className="flex justify-between gap-2">
                <span>Превозни средства</span>
                <strong className="text-ink">{carrierVehicleCount}</strong>
              </li>
              {c.license && (
                <li className="flex justify-between gap-2">
                  <span>Лиценз</span>
                  <strong className="text-right text-ink">{c.license}</strong>
                </li>
              )}
              <li className="flex justify-between gap-2">
                <span>Рейтинг</span>
                <strong className="text-ink">Нов в BusRent</strong>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
