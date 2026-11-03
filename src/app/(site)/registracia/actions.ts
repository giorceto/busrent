"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { checkVies, isValidEikFormat, normalizeEik } from "@/lib/vies";
import { checkFile, isFile, saveDocument, saveImage } from "@/lib/uploads";
import { slugify, randomId, SITE_URL } from "@/lib/util";
import { EXTRAS, typeForSeats } from "@/lib/constants";
import { esc, layout, sendMail } from "@/lib/mail";

const Schema = z.object({
  eik: z.string().transform(normalizeEik).refine(isValidEikFormat, "ЕИК трябва да е 9 или 13 цифри."),
  name: z.string().trim().max(200).default(""),
  address: z.string().trim().max(300).default(""),
  contactName: z.string().trim().min(2, "Попълни лице за контакт.").max(120),
  phone: z.string().trim().min(6, "Попълни телефон.").max(30),
  email: z.string().trim().email("Невалиден имейл."),
  city: z.string().min(1, "Избери град."),
  zone: z.enum(["city", "100", "200", "bg"]),
  license: z.string().trim().max(120).default(""),
  brand: z.string().trim().min(2, "Попълни марка на автобуса.").max(60),
  model: z.string().trim().max(80).default(""),
  seats: z.coerce.number().int().min(1, "Брой места").max(120),
  seatsLabel: z.string().trim().max(20).default(""),
  year: z.coerce.number().int().min(1970).max(2100).optional().or(z.literal("").transform(() => undefined)),
  euro: z.string().trim().max(20).default(""),
  plate: z.string().trim().max(20).default(""),
  extras: z.array(z.enum(EXTRAS)).default([]),
  description: z.string().trim().max(3000).default(""),
  terms: z.literal("on", { message: "Трябва да приемеш общите условия." }),
});

export type RegisterState = { error?: string; ok?: boolean } | undefined;

export async function registerCarrier(_prev: RegisterState, form: FormData): Promise<RegisterState> {
  const parsed = Schema.safeParse({
    ...Object.fromEntries(
      ["eik", "name", "address", "contactName", "phone", "email", "city", "zone", "license", "brand", "model", "seats", "seatsLabel", "year", "euro", "plate", "description", "terms"].map(
        (k) => [k, form.get(k) ?? ""],
      ),
    ),
    extras: form.getAll("extras"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Провери полетата." };
  const d = parsed.data;

  const photos = form.getAll("photos").filter(isFile);
  const seatmap = form.get("seatmap");
  const licenseFile = form.get("licenseFile");
  const insuranceFile = form.get("insuranceFile");
  if (photos.length === 0) return { error: "Качи поне една снимка на автобуса." };
  if (photos.length > 12) return { error: "Може до 12 снимки." };
  if (!isFile(licenseFile)) return { error: "Качи лиценза за превоз на пътници." };
  for (const f of photos) {
    const e = checkFile(f, "image");
    if (e) return { error: e };
  }
  for (const f of [seatmap, licenseFile, insuranceFile]) {
    if (isFile(f)) {
      const e = checkFile(f, f === seatmap ? "image" : "doc");
      if (e) return { error: e };
    }
  }

  const [existing] = await db.select({ id: schema.carriers.id }).from(schema.carriers).where(eq(schema.carriers.eik, d.eik)).limit(1);
  if (existing) return { error: "Фирма с този ЕИК вече е регистрирана. Свържи се с нас, ако това е грешка." };

  const [city] = await db.select().from(schema.cities).where(eq(schema.cities.slug, d.city)).limit(1);
  if (!city) return { error: "Непознат град." };

  // Проверката във VIES се прави отново на сървъра — не вярваме на данните от браузъра.
  const vies = await checkVies(d.eik);
  const vatValid = vies.ok && vies.valid;
  const name = vatValid ? vies.name || d.name : d.name;
  const address = vatValid ? vies.address || d.address : d.address;
  if (!name || name.length < 2) return { error: "Попълни името на фирмата." };

  const [carrier] = await db
    .insert(schema.carriers)
    .values({
      slug: `${slugify(name) || "prevozvach"}-${randomId(4)}`,
      eik: d.eik,
      name,
      address,
      vatValid,
      cityId: city.id,
      contactName: d.contactName,
      phone: d.phone,
      email: d.email,
      license: d.license,
      zone: d.zone,
      status: "pending",
    })
    .returning();

  const [vehicle] = await db
    .insert(schema.vehicles)
    .values({
      slug: `${slugify(`${d.brand} ${d.model}`)}-${randomId(5)}`,
      carrierId: carrier.id,
      type: typeForSeats(d.seats),
      brand: d.brand,
      model: d.model,
      seats: d.seats,
      seatsLabel: d.seatsLabel || String(d.seats),
      year: d.year ?? null,
      euro: d.euro || null,
      plate: d.plate || null,
      extras: d.extras,
      description: d.description,
    })
    .returning();

  const folder = `c${carrier.id}`;
  let sort = 0;
  for (const f of photos) {
    const url = await saveImage(f, folder);
    await db.insert(schema.photos).values({ vehicleId: vehicle.id, url, kind: sort === 0 ? "main" : "gallery", sort: sort++ });
  }
  if (isFile(seatmap)) {
    const url = await saveImage(seatmap, folder);
    await db.insert(schema.photos).values({ vehicleId: vehicle.id, url, kind: "seatmap", fit: "contain", sort: 99 });
  }
  await db.insert(schema.documents).values({ carrierId: carrier.id, kind: "license", fileUrl: await saveDocument(licenseFile, folder) });
  if (isFile(insuranceFile)) {
    await db.insert(schema.documents).values({
      carrierId: carrier.id,
      vehicleId: vehicle.id,
      kind: "insurance",
      fileUrl: await saveDocument(insuranceFile, folder),
    });
  }

  await sendMail({
    to: d.email,
    subject: "Регистрацията ти в BusRent е получена",
    html: layout(
      "Профилът чака одобрение",
      `<p>Здравей, ${esc(d.contactName)}!</p><p>Получихме регистрацията на <b>${esc(name)}</b>. Проверяваме документите обикновено до 1 работен ден и ще ти пишем, когато профилът е одобрен.</p>`,
    ),
  });
  if (process.env.ADMIN_EMAIL) {
    await sendMail({
      to: process.env.ADMIN_EMAIL,
      subject: `Нов превозвач за одобрение: ${name}`,
      html: layout("Нов превозвач", `<p><b>${esc(name)}</b> · ЕИК ${d.eik} · ${esc(city.name)}</p><p><a href="${SITE_URL}/admin">Отвори админ панела</a></p>`),
    });
  }
  return { ok: true };
}
