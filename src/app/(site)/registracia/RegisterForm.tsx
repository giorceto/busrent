"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { registerCarrier, type RegisterState } from "./actions";
import { EXTRAS, ZONES } from "@/lib/constants";
import { Check, Clock } from "@/components/Icons";

type CityOpt = { slug: string; name: string };
type Vies = { ok: true; valid: true; name: string; address: string } | { ok: true; valid: false } | { ok: false; error: string };
const STEPS = ["Данни за фирмата", "Лиценз и документи", "Първи автобус", "Зона за заявки"];

export function RegisterForm({ cities }: { cities: CityOpt[] }) {
  const [state, action, pending] = useActionState<RegisterState, FormData>(registerCarrier, undefined);
  const [step, setStep] = useState(0);
  const [eik, setEik] = useState("");
  const [vies, setVies] = useState<Vies | null>(null);
  const [checking, setChecking] = useState(false);
  const [manual, setManual] = useState(false);
  const [zone, setZone] = useState("100");
  const formRef = useRef<HTMLFormElement>(null);

  const found = vies?.ok && vies.valid ? vies : null;
  const companyReady = Boolean(found) || manual;

  async function lookup() {
    setChecking(true);
    setVies(null);
    try {
      const r = await fetch(`/api/vies?eik=${encodeURIComponent(eik)}`);
      const data = (await r.json()) as Vies;
      setVies(data);
      if (data.ok && !data.valid) setManual(true);
    } catch {
      setVies({ ok: false, error: "Няма връзка. Опитай пак или въведи данните ръчно." });
    } finally {
      setChecking(false);
    }
  }

  function next() {
    const section = formRef.current?.querySelector<HTMLElement>(`[data-step="${step}"]`);
    const inputs = section ? Array.from(section.querySelectorAll<HTMLInputElement>("input,select,textarea")) : [];
    for (const i of inputs) {
      if (!i.checkValidity()) {
        i.reportValidity();
        return;
      }
    }
    setStep((s) => s + 1);
  }

  if (state?.ok) {
    return (
      <div className="panel flex flex-col items-center gap-4 p-[clamp(28px,5vw,48px)] text-center">
        <span className="flex h-18 w-18 items-center justify-center rounded-full bg-sky-soft text-navy">
          <Clock size={34} />
        </span>
        <h1 className="text-3xl font-bold">Профилът чака одобрение</h1>
        <p className="max-w-[520px] text-[17px] leading-relaxed text-muted">
          Проверяваме документите обикновено до 1 работен ден. Ще получиш имейл, когато профилът е одобрен и започнеш да
          получаваш заявки.
        </p>
        <Link href="/" className="btn-navy mt-2">
          Към началото
        </Link>
      </div>
    );
  }

  const show = (i: number) => (step === i ? "flex" : "hidden");

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <h1 className="text-[clamp(26px,3.2vw,38px)] font-bold">Регистрирай фирмата си</h1>
        <p className="text-muted">
          Стъпка {step + 1} от 4 · {STEPS[step]}
        </p>
      </div>
      <div role="presentation" className="grid grid-cols-4 gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-col gap-1.5">
            <div className={`h-1.5 rounded-full ${i <= step ? "bg-navy" : "bg-[#dce3ec]"}`} />
            <span className="hidden text-xs font-bold text-muted sm:block">{s}</span>
          </div>
        ))}
      </div>

      <div className="panel flex flex-col gap-5 p-[clamp(20px,4vw,36px)]">
        {/* 1. Фирма */}
        <div data-step="0" className={`${show(0)} flex-col gap-4`}>
          <label className="label">
            ЕИК на фирмата
            <span className="flex flex-wrap gap-2.5">
              <input
                name="eik"
                inputMode="numeric"
                required
                pattern="\d{9}(\d{4})?"
                maxLength={13}
                value={eik}
                onChange={(e) => setEik(e.target.value.replace(/\D/g, ""))}
                placeholder="9 или 13 цифри"
                className="field flex-[1_1_220px] text-lg tracking-wider"
              />
              <button
                type="button"
                onClick={lookup}
                disabled={checking || !/^\d{9}(\d{4})?$/.test(eik)}
                className="btn-navy"
              >
                {checking ? "Проверка…" : "Попълни автоматично"}
              </button>
            </span>
          </label>
          <span className="text-sm leading-relaxed text-muted">
            Данните се взимат от системата VIES на Европейската комисия. Работи за фирми, регистрирани по ДДС.
          </span>

          {vies && !vies.ok && (
            <div role="alert" className="rounded-xl bg-[#fdecec] px-4 py-3 font-semibold text-[#8a1c1c]">
              {vies.error}
            </div>
          )}
          {vies?.ok && !vies.valid && (
            <div role="status" className="rounded-xl bg-[#fff6e5] px-4 py-3 text-sm leading-relaxed font-semibold text-[#5c3a00]">
              Няма активна ДДС регистрация за BG{eik}. Попълни името и адреса ръчно — ще ги сверим с Търговския регистър.
            </div>
          )}
          {found && (
            <div className="flex items-center gap-2.5 rounded-xl bg-ok-soft px-4 py-3 font-bold text-ok">
              <Check size={18} />
              Намерена във VIES · активна ДДС регистрация BG{eik}
            </div>
          )}

          {companyReady && (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3.5">
              <label className="label">
                Име на фирмата
                <input
                  key={found ? `v-${found.name}` : "m"}
                  name="name"
                  required
                  defaultValue={found?.name ?? ""}
                  readOnly={Boolean(found)}
                  className={`field ${found ? "bg-ground" : ""}`}
                />
              </label>
              <label className="label">
                Адрес по регистрация
                <input
                  key={found ? `a-${found.address}` : "ma"}
                  name="address"
                  required
                  defaultValue={found?.address ?? ""}
                  readOnly={Boolean(found)}
                  className={`field ${found ? "bg-ground" : ""}`}
                />
              </label>
              <label className="label">
                Лице за контакт
                <input name="contactName" required minLength={2} autoComplete="name" className="field" />
              </label>
              <label className="label">
                Телефон за заявки
                <input name="phone" type="tel" required minLength={6} placeholder="+359" autoComplete="tel" className="field" />
              </label>
              <label className="label">
                Имейл за заявки
                <input name="email" type="email" required autoComplete="email" className="field" />
              </label>
              <label className="label">
                Град, от който работиш
                <select name="city" required defaultValue="" className="field">
                  <option value="" disabled>
                    Избери град
                  </option>
                  {cities.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          {!companyReady && (
            <button
              type="button"
              onClick={() => setManual(true)}
              className="self-start py-1.5 text-sm font-bold text-navy underline"
            >
              Фирмата не е регистрирана по ДДС? Въведи данните ръчно
            </button>
          )}
        </div>

        {/* 2. Документи */}
        <div data-step="1" className={`${show(1)} flex-col gap-4`}>
          <p className="leading-relaxed text-slate-700">
            Документите се виждат само от екипа на BusRent. След проверката профилът получава значка „Проверен превозвач“.
          </p>
          <label className="label">
            Номер на лиценза (по избор)
            <input name="license" placeholder="Напр. Лиценз на Общността №0000" className="field" />
          </label>
          <label className="label rounded-2xl border border-dashed border-slate-300 p-4">
            Лиценз за превоз на пътници (задължително)
            <span className="text-[13px] font-medium text-muted">PDF или снимка, до 10 MB. За чужбина: Лиценз на Общността.</span>
            <input name="licenseFile" type="file" required accept="application/pdf,image/jpeg,image/png,image/webp" />
          </label>
          <label className="label rounded-2xl border border-dashed border-slate-300 p-4">
            Застраховка „Злополука“ на пътниците (по избор)
            <span className="text-[13px] font-medium text-muted">Ще напомняме преди изтичане.</span>
            <input name="insuranceFile" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" />
          </label>
        </div>

        {/* 3. Автобус */}
        <div data-step="2" className={`${show(2)} flex-col gap-4`}>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3.5">
            <label className="label">
              Марка
              <input name="brand" required minLength={2} placeholder="Setra" className="field" />
            </label>
            <label className="label">
              Модел
              <input name="model" placeholder="S 517 HD" className="field" />
            </label>
            <label className="label">
              Места за пътници
              <input name="seats" type="number" required min={1} max={120} placeholder="56" className="field" />
            </label>
            <label className="label">
              Места, както ги изписваш
              <input name="seatsLabel" placeholder="56+2+1" maxLength={20} className="field" />
            </label>
            <label className="label">
              Година
              <input name="year" type="number" min={1970} max={2100} placeholder="2019" className="field" />
            </label>
            <label className="label">
              Евро норма
              <select name="euro" defaultValue="" className="field">
                <option value="">—</option>
                {["EURO 3", "EURO 4", "EURO 5", "EURO 6"].map((e) => (
                  <option key={e}>{e}</option>
                ))}
              </select>
            </label>
            <label className="label">
              Рег. номер (не се показва публично)
              <input name="plate" maxLength={20} className="field" />
            </label>
          </div>
          <fieldset>
            <legend className="mb-2.5 text-sm font-bold text-slate-700">Екстри</legend>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-2.5">
              {EXTRAS.map((e) => (
                <label key={e} className="flex items-center gap-2.5 font-semibold">
                  <input type="checkbox" name="extras" value={e} className="h-[18px] w-[18px] accent-navy" />
                  {e}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="label">
            Описание (по избор)
            <textarea name="description" rows={3} maxLength={3000} className="field resize-y" />
          </label>
          <label className="label rounded-2xl border border-dashed border-slate-300 p-4">
            Снимки (поне 1, до 12)
            <span className="text-[13px] font-medium text-muted">Първата снимка е основна. Отвън, салон, седалки. JPG/PNG/WEBP до 10 MB.</span>
            <input name="photos" type="file" required multiple accept="image/jpeg,image/png,image/webp" />
          </label>
          <label className="label rounded-2xl border border-dashed border-slate-300 p-4">
            Схема на местата (по избор)
            <input name="seatmap" type="file" accept="image/jpeg,image/png,image/webp" />
          </label>
        </div>

        {/* 4. Зона */}
        <div data-step="3" className={`${show(3)} flex-col gap-3.5`}>
          <p className="leading-relaxed text-slate-700">
            Откъде искаш да получаваш заявки? Ще получаваш само заявки, за които имаш автобус с достатъчно места.
          </p>
          <input type="hidden" name="zone" value={zone} />
          {ZONES.map((z) => (
            <button
              key={z.key}
              type="button"
              aria-pressed={zone === z.key}
              onClick={() => setZone(z.key)}
              className={`flex flex-col rounded-2xl px-4.5 py-4 text-left ${
                zone === z.key ? "border-2 border-navy bg-[#f3f6fb]" : "border border-line bg-white"
              }`}
            >
              <strong>{z.label}</strong>
            </button>
          ))}
          <label className="mt-1.5 flex items-start gap-2.5 text-sm leading-relaxed text-slate-700">
            <input type="checkbox" name="terms" required className="mt-0.5 h-[18px] w-[18px] accent-navy" />
            <span>
              Съгласен съм с <Link href="/usloviya" className="font-bold text-navy underline">общите условия</Link> за превозвачи и
              обработката на данните на фирмата.
            </span>
          </label>
        </div>

        {state?.error && (
          <div role="alert" className="rounded-xl bg-[#fdecec] px-4 py-3 font-semibold text-[#8a1c1c]">
            {state.error}
          </div>
        )}

        <div className="flex flex-wrap justify-between gap-3 border-t border-[#eef1f5] pt-2">
          {step > 0 ? (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="btn-secondary">
              Назад
            </button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next} disabled={step === 0 && !companyReady} className="btn-primary">
              Напред
            </button>
          ) : (
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? "Изпращане…" : "Изпрати за одобрение"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
