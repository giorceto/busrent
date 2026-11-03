"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { matchCarriers } from "@/lib/queries";
import { randomId, SITE_URL, formatDate } from "@/lib/util";
import { esc, layout, sendMail } from "@/lib/mail";
import { tripLabel } from "@/lib/constants";

const RequestSchema = z.object({
  fromCity: z.string().min(1, "Избери град на тръгване."),
  fromText: z.string().max(200).default(""),
  toText: z.string().trim().min(2, "Попълни дестинация.").max(200),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Избери дата на тръгване."),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  tripType: z.enum(["round", "oneway", "multi"]),
  pax: z.coerce.number().int().min(1, "Брой пътници").max(200),
  luggage: z.string().max(100).default(""),
  extras: z.array(z.string().max(50)).max(15).default([]),
  note: z.string().max(2000).default(""),
  name: z.string().trim().min(2, "Попълни име или фирма.").max(120),
  email: z.string().trim().email("Невалиден имейл."),
  phone: z.string().trim().min(6, "Попълни телефон.").max(30),
  website: z.string().max(0).optional(), // honeypot: ботовете го попълват
});

export type RequestState = { error?: string } | undefined;

export async function createRequest(_prev: RequestState, form: FormData): Promise<RequestState> {
  const parsed = RequestSchema.safeParse({
    fromCity: form.get("fromCity"),
    fromText: form.get("fromText") ?? "",
    toText: form.get("toText"),
    dateFrom: form.get("dateFrom"),
    dateTo: form.get("dateTo") ?? "",
    tripType: form.get("tripType"),
    pax: form.get("pax"),
    luggage: form.get("luggage") ?? "",
    extras: form.getAll("extras"),
    note: form.get("note") ?? "",
    name: form.get("name"),
    email: form.get("email"),
    phone: form.get("phone"),
    website: form.get("website") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Провери полетата." };
  const d = parsed.data;
  if (d.dateTo && d.dateTo < d.dateFrom) return { error: "Датата на връщане е преди датата на тръгване." };

  const [city] = await db.select().from(schema.cities).where(eq(schema.cities.slug, d.fromCity)).limit(1);
  if (!city) return { error: "Непознат град на тръгване." };

  const publicId = randomId(12);
  const [req] = await db
    .insert(schema.requests)
    .values({
      publicId,
      fromCityId: city.id,
      fromText: d.fromText ? `${city.name}, ${d.fromText}` : city.name,
      toText: d.toText,
      dateFrom: d.dateFrom,
      dateTo: d.dateTo || null,
      tripType: d.tripType,
      pax: d.pax,
      luggage: d.luggage,
      extras: d.extras,
      note: d.note,
      name: d.name,
      email: d.email,
      phone: d.phone,
    })
    .returning();

  const matches = await matchCarriers({ fromCityId: city.id, pax: d.pax, extras: d.extras });
  if (matches.length) {
    await db
      .insert(schema.requestRecipients)
      .values(matches.map((m) => ({ requestId: req.id, carrierId: m.carrier.id })))
      .onConflictDoNothing();
  }

  const summary = `<p style="font-size:16px;margin:0 0 6px"><b>${esc(req.fromText)} → ${esc(req.toText)}</b></p>
<p style="margin:0 0 14px;color:#334155">${formatDate(d.dateFrom)}${d.dateTo ? ` – ${formatDate(d.dateTo)}` : ""} · ${d.pax} пътници · ${tripLabel(d.tripType)}${d.extras.length ? ` · ${esc(d.extras.join(", "))}` : ""}</p>
${d.note ? `<p style="background:#f6f7f9;padding:10px 12px;border-radius:10px;margin:0 0 14px">${esc(d.note)}</p>` : ""}`;

  await Promise.all(
    matches.map((m) =>
      sendMail({
        to: m.carrier.email,
        subject: `Нова заявка: ${req.fromText} → ${req.toText}, ${d.pax} пътници`,
        html: layout(
          "Нова заявка за превоз",
          `${summary}<p style="margin:0 0 14px;color:#334155">Подходящи автобуси от твоя автопарк: ${esc(m.vehicles.join(", "))}</p>
<p style="margin:0 0 6px"><b>Клиент:</b> ${esc(d.name)} · ${esc(d.phone)} · ${esc(d.email)}</p>
<p style="color:#475569;font-size:13px">Отговори директно на клиента. Скоро офертите ще се изпращат и от таблото в BusRent.</p>`,
        ),
        replyTo: d.email,
      }),
    ),
  );

  await sendMail({
    to: d.email,
    subject: "Заявката ти в BusRent е изпратена",
    html: layout(
      "Заявката е изпратена",
      `${summary}<p style="margin:0 0 14px">Получиха я <b>${matches.length}</b> превозвачи с подходящ автобус.</p>
<p><a href="${SITE_URL}/zayavka/${publicId}" style="display:inline-block;background:#0e2a50;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700">Виж заявката и офертите</a></p>`,
    ),
  });

  redirect(`/zayavka/${publicId}`);
}
