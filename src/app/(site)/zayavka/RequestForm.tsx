"use client";

import { useActionState, useRef, useState } from "react";
import { createRequest, type RequestState } from "./actions";
import { EXTRAS, TRIP_TYPES } from "@/lib/constants";

type CityOpt = { slug: string; name: string };
const STEPS = ["Маршрут и дати", "Пътници и изисквания", "Контакт"];

export function RequestForm({ cities, defaults }: { cities: CityOpt[]; defaults: { city?: string; pax?: number; note?: string } }) {
  const [state, action, pending] = useActionState<RequestState, FormData>(createRequest, undefined);
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState("");
  const [pax, setPax] = useState<number | "">(defaults.pax ?? "");
  const formRef = useRef<HTMLFormElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  function validateStep(): boolean {
    const el = formRef.current;
    if (!el) return true;
    const section = el.querySelector<HTMLElement>(`[data-step="${step}"]`);
    const inputs = section ? Array.from(section.querySelectorAll<HTMLInputElement>("input,select,textarea")) : [];
    for (const i of inputs) {
      if (!i.checkValidity()) {
        i.reportValidity();
        return false;
      }
    }
    return true;
  }

  function next() {
    setStepError("");
    if (validateStep()) setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  const show = (i: number) => (step === i ? "flex" : "hidden");

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-7" noValidate={false}>
      <div className="flex flex-col gap-2">
        <h1 className="text-[clamp(28px,3.4vw,40px)] font-bold">Заявка за автобус</h1>
        <p className="text-muted">
          Стъпка {step + 1} от 3 · {STEPS[step]}
        </p>
      </div>
      <div role="presentation" className="grid grid-cols-3 gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className={`h-1.5 rounded-full ${i <= step ? "bg-navy" : "bg-[#dce3ec]"}`} />
        ))}
      </div>

      <div className="panel flex flex-col gap-5 p-[clamp(20px,4vw,36px)]">
        <div data-step="0" className={`${show(0)} flex-col gap-5`}>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            <label className="label">
              Град на тръгване
              <select name="fromCity" required defaultValue={defaults.city || ""} className="field">
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
            <label className="label">
              Място на тръгване (по избор)
              <input name="fromText" placeholder="Напр. хотел, адрес, летище" maxLength={200} className="field" />
            </label>
            <label className="label">
              Дестинация
              <input name="toText" required minLength={2} maxLength={200} placeholder="Град или обект" className="field" />
            </label>
            <label className="label">
              Тип пътуване
              <select name="tripType" defaultValue="round" className="field">
                {TRIP_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="label">
              Дата на тръгване
              <input name="dateFrom" type="date" required min={today} className="field" />
            </label>
            <label className="label">
              Дата на връщане (по избор)
              <input name="dateTo" type="date" min={today} className="field" />
            </label>
          </div>
        </div>

        <div data-step="1" className={`${show(1)} flex-col gap-5`}>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            <label className="label">
              Брой пътници
              <input
                name="pax"
                type="number"
                required
                min={1}
                max={200}
                value={pax}
                onChange={(e) => setPax(e.target.value ? Number(e.target.value) : "")}
                className="field"
              />
            </label>
            <label className="label">
              Багаж
              <select name="luggage" defaultValue="Куфар на човек" className="field">
                <option>Ръчен багаж</option>
                <option>Куфар на човек</option>
                <option>Много багаж / ски</option>
              </select>
            </label>
          </div>
          {pax !== "" && pax > 0 && (
            <div className="rounded-2xl bg-sky-soft px-4 py-3.5 font-semibold text-navy">
              Заявката ще получат само превозвачи с автобус от {pax} места нагоре, които обслужват избрания град.
            </div>
          )}
          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-2.5 text-sm font-bold text-slate-700">Задължителни екстри</legend>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2.5">
              {EXTRAS.map((e) => (
                <label key={e} className="flex items-center gap-2.5 font-semibold">
                  <input type="checkbox" name="extras" value={e} className="h-[18px] w-[18px] accent-navy" />
                  {e}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="label">
            Бележки към превозвача
            <textarea
              name="note"
              rows={3}
              maxLength={2000}
              defaultValue={defaults.note}
              placeholder="Напр. спирка по пътя, нощувка на шофьора, час на тръгване"
              className="field resize-y"
            />
          </label>
        </div>

        <div data-step="2" className={`${show(2)} flex-col gap-5`}>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            <label className="label">
              Име или фирма
              <input name="name" required minLength={2} maxLength={120} autoComplete="name" className="field" />
            </label>
            <label className="label">
              Имейл
              <input name="email" type="email" required autoComplete="email" className="field" />
            </label>
            <label className="label">
              Телефон
              <input name="phone" type="tel" required minLength={6} maxLength={30} autoComplete="tel" placeholder="+359" className="field" />
            </label>
          </div>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
          <p className="text-sm leading-relaxed text-muted">
            Контактите ти виждат само превозвачите, които получават заявката, за да ти изпратят оферта.
          </p>
        </div>

        {(stepError || state?.error) && (
          <div role="alert" className="rounded-xl bg-[#fdecec] px-4 py-3 font-semibold text-[#8a1c1c]">
            {stepError || state?.error}
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
            <button type="button" onClick={next} className="btn-primary">
              Напред
            </button>
          ) : (
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? "Изпращане…" : "Изпрати заявката"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
