"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { esc, layout, sendMail } from "@/lib/mail";
import { SITE_URL } from "@/lib/util";

const MESSAGES = {
  approved: ["Профилът ти в BusRent е одобрен", "Профилът е одобрен", "Автобусите ти вече се виждат в каталога и ще получаваш подходящите заявки на този имейл."],
  needs_docs: ["BusRent: нужен е документ", "Нужен е документ", "Моля, изпрати липсващия документ в отговор на този имейл."],
  rejected: ["BusRent: регистрацията не е одобрена", "Регистрацията не е одобрена", "Ако смяташ, че това е грешка, отговори на този имейл."],
} as const;

export async function setCarrierStatus(form: FormData) {
  const id = Number(form.get("id"));
  const status = String(form.get("status")) as keyof typeof MESSAGES;
  const note = String(form.get("note") ?? "").trim().slice(0, 1000);
  if (!id || !(status in MESSAGES)) return;

  const [c] = await db
    .update(schema.carriers)
    .set({ status, adminNote: note })
    .where(eq(schema.carriers.id, id))
    .returning();
  if (!c) return;

  const [subject, title, text] = MESSAGES[status];
  await sendMail({
    to: c.email,
    subject,
    html: layout(
      title,
      `<p>${text}</p>${note ? `<p style="background:#f6f7f9;padding:10px 12px;border-radius:10px">${esc(note)}</p>` : ""}${
        status === "approved" ? `<p><a href="${SITE_URL}/avtobusi">Виж каталога</a></p>` : ""
      }`,
    ),
  });
  revalidatePath("/admin");
}

export async function toggleVehicle(form: FormData) {
  const id = Number(form.get("id"));
  const active = form.get("active") === "1";
  if (!id) return;
  await db.update(schema.vehicles).set({ active }).where(eq(schema.vehicles.id, id));
  revalidatePath("/admin");
}
