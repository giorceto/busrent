import type { Metadata } from "next";
import Link from "next/link";
import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { formatDate } from "@/lib/util";
import { tripLabel } from "@/lib/constants";
import { setCarrierStatus, toggleVehicle } from "./actions";
import { Logo } from "@/components/SiteHeader";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Админ", robots: { index: false, follow: false } };

const STATUS: Record<string, [string, string]> = {
  pending: ["Нов", "text-navy bg-sky-soft"],
  approved: ["Одобрен", "text-ok bg-ok-soft"],
  needs_docs: ["Чака документ", "text-[#7a4b00] bg-[#fff6e5]"],
  rejected: ["Отхвърлен", "text-[#8a1c1c] bg-[#fdecec]"],
};
const DOC_KIND: Record<string, string> = { license: "Лиценз", insurance: "Застраховка", registration: "Талон" };

type SP = Promise<{ tab?: string; id?: string }>;

export default async function AdminPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const tab = sp.tab === "requests" ? "requests" : "carriers";

  const counts = await db
    .select({ status: schema.carriers.status, n: sql<number>`count(*)::int` })
    .from(schema.carriers)
    .groupBy(schema.carriers.status);
  const pendingCount = counts.find((c) => c.status === "pending")?.n ?? 0;
  const requestCount = await db.$count(schema.requests);

  return (
    <div className="flex min-h-screen flex-wrap">
      <nav aria-label="Админ меню" className="flex flex-[1_1_230px] flex-col gap-6 bg-navy-deep px-4 py-6 text-white">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-xs font-extrabold tracking-wider text-[#f5c46a]">АДМИН</span>
        </div>
        <ul className="flex flex-col gap-1">
          {[
            ["carriers", "Превозвачи", pendingCount],
            ["requests", "Заявки", requestCount],
          ].map(([key, label, n]) => (
            <li key={key}>
              <Link
                href={`/admin?tab=${key}`}
                className={`flex min-h-11 items-center justify-between rounded-xl px-3 font-semibold ${
                  tab === key ? "bg-white text-navy-deep" : "text-[#dce4f0]"
                }`}
              >
                {label}
                <span className="rounded-full bg-amber px-2 py-0.5 text-xs font-extrabold text-amber-ink">{n}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-auto text-sm text-[#dce4f0]">
          {counts.map((c) => (
            <div key={c.status}>
              {STATUS[c.status]?.[0] ?? c.status}: <b className="text-white">{c.n}</b>
            </div>
          ))}
        </div>
      </nav>
      <main className="flex min-w-0 flex-[999_1_640px] flex-col gap-6 px-[clamp(16px,3vw,40px)] pt-7 pb-16">
        {tab === "carriers" ? <Carriers selected={Number(sp.id) || null} /> : <Requests />}
      </main>
    </div>
  );
}

async function Carriers({ selected }: { selected: number | null }) {
  const list = await db
    .select({ carrier: schema.carriers, city: schema.cities })
    .from(schema.carriers)
    .leftJoin(schema.cities, eq(schema.carriers.cityId, schema.cities.id))
    .orderBy(sql`case ${schema.carriers.status} when 'pending' then 0 when 'needs_docs' then 1 else 2 end`, desc(schema.carriers.createdAt));
  const cur = list.find((r) => r.carrier.id === selected) ?? list[0];

  const [docs, vehicles] = cur
    ? await Promise.all([
        db.select().from(schema.documents).where(eq(schema.documents.carrierId, cur.carrier.id)),
        db.select().from(schema.vehicles).where(eq(schema.vehicles.carrierId, cur.carrier.id)).orderBy(asc(schema.vehicles.id)),
      ])
    : [[], []];
  const pics = vehicles.length
    ? await db.select().from(schema.photos).where(inArray(schema.photos.vehicleId, vehicles.map((v) => v.id)))
    : [];

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-[clamp(22px,2.4vw,30px)] font-bold">Превозвачи</h1>
        <span className="text-muted">Провери данните от VIES и документите. Одобреният профил се показва в каталога.</span>
      </div>
      {list.length === 0 ? (
        <p className="text-muted">Още няма регистрирани превозвачи.</p>
      ) : (
        <div className="flex flex-wrap items-start gap-5">
          <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-2.5">
            {list.map(({ carrier: c, city }) => (
              <Link
                key={c.id}
                href={`/admin?tab=carriers&id=${c.id}`}
                className={`flex flex-col gap-1 rounded-2xl bg-white px-4 py-3.5 ${c.id === cur?.carrier.id ? "border-2 border-navy" : "border border-line"}`}
              >
                <span className="flex justify-between gap-2">
                  <strong>{c.name}</strong>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${STATUS[c.status]?.[1]}`}>{STATUS[c.status]?.[0]}</span>
                </span>
                <span className="text-[13px] text-muted">
                  {city?.name} · {formatDate(c.createdAt)}
                </span>
              </Link>
            ))}
          </div>

          {cur && (
            <section className="panel flex min-w-0 flex-[2_1_480px] flex-col gap-5 p-[clamp(18px,2.4vw,28px)]">
              <h2 className="text-[22px] font-bold">{cur.carrier.name}</h2>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
                {[
                  ["ЕИК", cur.carrier.eik],
                  ["VIES", cur.carrier.vatValid ? "Активна ДДС регистрация" : "Няма ДДС рег. · въведено ръчно"],
                  ["Адрес", cur.carrier.address],
                  ["Град / зона", `${cur.city?.name ?? "—"} · ${cur.carrier.zone === "bg" ? "цяла България" : cur.carrier.zone === "city" ? "само града" : `+${cur.carrier.zone} км`}`],
                  ["Контакт", `${cur.carrier.contactName} · ${cur.carrier.phone}`],
                  ["Имейл", cur.carrier.email],
                  ["Лиценз №", cur.carrier.license || "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-0.5 rounded-xl bg-ground px-3.5 py-3">
                    <span className="text-xs font-bold text-muted uppercase">{k}</span>
                    <span className="font-bold break-words">{v}</span>
                  </div>
                ))}
              </div>
              <a
                href="https://portal.registryagency.bg/"
                target="_blank"
                rel="noreferrer"
                className="text-sm font-bold text-navy"
              >
                Търговски регистър — търси по ЕИК {cur.carrier.eik} ↗
              </a>

              <div className="flex flex-col gap-2.5">
                <span className="font-extrabold">Документи</span>
                {docs.length === 0 && <span className="text-muted">Няма качени документи.</span>}
                {docs.map((d) => (
                  <a
                    key={d.id}
                    href={`/admin/doc/${d.fileUrl}`}
                    target="_blank"
                    className="flex items-center justify-between rounded-xl border border-line px-3.5 py-3"
                  >
                    <span className="font-bold">{DOC_KIND[d.kind] ?? d.kind}</span>
                    <span className="text-sm font-extrabold text-navy">Прегледай</span>
                  </a>
                ))}
              </div>

              <div className="flex flex-col gap-2.5">
                <span className="font-extrabold">Превозни средства ({vehicles.length})</span>
                {vehicles.map((v) => {
                  const cover = pics.find((p) => p.vehicleId === v.id && p.kind !== "seatmap");
                  return (
                    <div key={v.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3">
                      {cover && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover.url} alt="" className="h-14 w-20 rounded-lg object-cover" />
                      )}
                      <div className="flex min-w-0 grow flex-col">
                        <strong>
                          {v.brand} {v.model}
                        </strong>
                        <span className="text-sm text-muted">
                          {v.seatsLabel} места · {v.plate ?? "без рег. №"} · {pics.filter((p) => p.vehicleId === v.id).length} снимки
                        </span>
                      </div>
                      <Link href={`/avtobus/${v.slug}`} className="text-sm font-bold text-navy">
                        Виж
                      </Link>
                      <form action={toggleVehicle}>
                        <input type="hidden" name="id" value={v.id} />
                        <input type="hidden" name="active" value={v.active ? "0" : "1"} />
                        <button className="text-sm font-bold text-slate-700 underline">{v.active ? "Скрий" : "Покажи"}</button>
                      </form>
                    </div>
                  );
                })}
              </div>

              <form action={setCarrierStatus} className="flex flex-col gap-3 border-t border-[#eef1f5] pt-4">
                <input type="hidden" name="id" value={cur.carrier.id} />
                <label className="label">
                  Бележка към превозвача (изпраща се по имейл)
                  <textarea name="note" rows={2} defaultValue={cur.carrier.adminNote} placeholder="Напр. лицензът е нечетлив, моля изпратете нов скан." className="field" />
                </label>
                <div className="flex flex-wrap justify-end gap-2.5">
                  <button name="status" value="rejected" className="btn-secondary text-[#8a1c1c]">
                    Отхвърли
                  </button>
                  <button name="status" value="needs_docs" className="btn-secondary">
                    Поискай документ
                  </button>
                  <button name="status" value="approved" className="inline-flex min-h-12 items-center rounded-2xl bg-ok px-6 font-extrabold text-white">
                    Одобри
                  </button>
                </div>
              </form>
            </section>
          )}
        </div>
      )}
    </>
  );
}

async function Requests() {
  const rows = await db
    .select({
      r: schema.requests,
      recipients: sql<number>`(select count(*)::int from ${schema.requestRecipients} rr where rr.request_id = ${schema.requests.id})`,
    })
    .from(schema.requests)
    .orderBy(desc(schema.requests.createdAt))
    .limit(200);
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-[clamp(22px,2.4vw,30px)] font-bold">Заявки</h1>
        <span className="text-muted">Заявки с 0 получатели са в червено — потърси превозвач ръчно.</span>
      </div>
      <div className="overflow-x-auto rounded-[18px] border border-line bg-white">
        <table className="w-full min-w-[760px] border-collapse text-[15px]">
          <thead>
            <tr className="text-left text-[13px] tracking-wide text-muted uppercase">
              {["Дата", "Маршрут", "Пътуване", "Клиент", "Получили"].map((h) => (
                <th key={h} className="px-4 py-3.5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ r, recipients }) => (
              <tr key={r.id} className="border-t border-[#eef1f5] align-top">
                <td className="px-4 py-3.5 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                <td className="px-4 py-3.5 font-bold">
                  <Link href={`/zayavka/${r.publicId}`} className="text-navy">
                    {r.fromText} → {r.toText}
                  </Link>
                </td>
                <td className="px-4 py-3.5">
                  {formatDate(r.dateFrom)} · {r.pax} души · {tripLabel(r.tripType)}
                  {r.extras.length ? <div className="text-sm text-muted">{r.extras.join(", ")}</div> : null}
                </td>
                <td className="px-4 py-3.5">
                  {r.name}
                  <div className="text-sm text-muted">
                    {r.phone} · {r.email}
                  </div>
                </td>
                <td className={`px-4 py-3.5 font-extrabold ${recipients === 0 ? "text-[#8a1c1c]" : "text-ok"}`}>{recipients}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-muted">
                  Още няма заявки.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
