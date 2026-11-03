import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { tripLabel } from "@/lib/constants";
import { formatDate } from "@/lib/util";
import { Check } from "@/components/Icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Твоята заявка", robots: { index: false } };

type Params = Promise<{ id: string }>;

export default async function RequestStatusPage({ params }: { params: Params }) {
  const { id } = await params;
  const [req] = await db.select().from(schema.requests).where(eq(schema.requests.publicId, id)).limit(1);
  if (!req) notFound();
  const recipients = await db.$count(schema.requestRecipients, eq(schema.requestRecipients.requestId, req.id));

  return (
    <main className="mx-auto flex max-w-[780px] flex-col gap-6 px-4 pt-10 pb-18 sm:px-6">
      <div className="panel flex flex-col items-center gap-4 p-[clamp(28px,5vw,48px)] text-center">
        <span className="flex h-18 w-18 items-center justify-center rounded-full bg-ok-soft text-ok">
          <Check size={36} />
        </span>
        <h1 className="text-3xl font-bold">Заявката е изпратена</h1>
        {recipients > 0 ? (
          <p className="max-w-[500px] text-[17px] leading-relaxed text-muted">
            Получиха я <b className="text-ink">{recipients}</b> {recipients === 1 ? "превозвач" : "превозвачи"} с подходящ
            автобус. Те ще се свържат с теб по имейл или телефон с оферта.
          </p>
        ) : (
          <p className="max-w-[520px] text-[17px] leading-relaxed text-muted">
            В момента няма регистриран превозвач, който отговаря на всички условия. Екипът на BusRent ще прегледа
            заявката и ще потърси подходящ превозвач.
          </p>
        )}
      </div>

      <section className="panel flex flex-col gap-3 p-6">
        <span className="text-[13px] font-extrabold tracking-wider text-muted uppercase">Детайли</span>
        <span className="text-[22px] font-extrabold">
          {req.fromText} → {req.toText}
        </span>
        <span className="font-semibold text-slate-700">
          {formatDate(req.dateFrom)}
          {req.dateTo ? ` – ${formatDate(req.dateTo)}` : ""} · {req.pax} пътници · {tripLabel(req.tripType)}
          {req.extras.length ? ` · ${req.extras.join(", ")}` : ""}
        </span>
        {req.note && <p className="rounded-xl bg-ground px-4 py-3 text-slate-700">{req.note}</p>}
        <span className="text-sm text-muted">Линк към тази страница е изпратен на {req.email}.</span>
      </section>

      <Link href="/avtobusi" className="btn-secondary self-center">
        Разгледай каталога
      </Link>
    </main>
  );
}
