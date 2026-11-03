import Link from "next/link";
import { getCities, listVehicles } from "@/lib/queries";
import { VEHICLE_TYPES } from "@/lib/constants";
import { VehicleCard } from "@/components/VehicleCard";
import { BusDrawing, Check, Chevron, Clock, Cross, Search, Shield } from "@/components/Icons";

export const dynamic = "force-dynamic";

const POPULAR = ["sofia", "plovdiv", "varna", "burgas", "ruse", "stara-zagora", "veliko-tarnovo", "pleven", "blagoevgrad", "vratsa"];

const DEMO_MATCHES = [
  { bus: "Автобус · 57 места", where: "София", ok: true },
  { bus: "Двуетажен · 79 места", where: "Пловдив · зона +200 км", ok: true },
  { bus: "Автобус · 52 места", where: "София", ok: false, reason: "Малко места" },
  { bus: "Автобус · 59 места", where: "Варна · зона +100 км", ok: false, reason: "Извън зоната" },
];

export default async function HomePage() {
  const [cities, latest] = await Promise.all([getCities(), listVehicles({ limit: 4 })]);
  const popular = POPULAR.map((s) => cities.find((c) => c.slug === s)).filter(Boolean) as typeof cities;

  return (
    <main>
      <section className="bg-navy px-4 pt-16 pb-34 text-white sm:px-6">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-12">
          <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-5">
            <h1 className="text-[clamp(34px,4.6vw,60px)] leading-[1.08] font-bold">Автобус под наем за всяко пътуване</h1>
            <p className="max-w-[560px] text-[19px] leading-relaxed text-[#e3eaf5]">
              Опиши пътуването веднъж. Заявката стига само до превозвачи, които имат автобус с нужните места и работят в
              твоя район.
            </p>
          </div>
          <div
            aria-label="Пример: как заявката намира подходящите автобуси"
            className="flex min-w-0 flex-[1_1_400px] flex-col gap-4 rounded-3xl bg-white p-6 text-ink shadow-[0_30px_70px_rgba(4,14,30,.35)]"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] font-extrabold tracking-wider text-muted uppercase">Пример за заявка</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[22px] font-extrabold">София → Банско</span>
              <span className="text-[15px] font-semibold text-slate-700">56 пътници · климатик, WC</span>
            </div>
            <div className="flex flex-col border-t border-line pt-2">
              {DEMO_MATCHES.map((m) => (
                <div key={m.bus + m.where} className="flex items-center justify-between gap-3 border-b border-[#f1f4f8] py-2.5">
                  <div className="flex min-w-0 flex-col">
                    <span className={`text-[15px] font-bold ${m.ok ? "text-ink" : "text-slate-500"}`}>{m.bus}</span>
                    <span className="text-[13px] text-muted">{m.where}</span>
                  </div>
                  {m.ok ? (
                    <span className="flex shrink-0 items-center gap-1.5 text-[13px] font-extrabold text-ok">
                      <Check size={16} />
                      Получава
                    </span>
                  ) : (
                    <span className="flex shrink-0 items-center gap-1.5 text-[13px] font-bold text-slate-500">
                      <Cross size={16} />
                      {m.reason}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6">
        <form
          action="/avtobusi"
          aria-label="Търсене на автобус"
          className="mx-auto -mt-21 grid max-w-[1240px] grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2 rounded-[22px] bg-white p-3.5 shadow-[0_24px_60px_rgba(14,42,80,.16)]"
        >
          <label className="flex flex-col gap-1 rounded-2xl bg-ground px-4 py-3">
            <span className="text-xs font-bold tracking-wider text-muted uppercase">Откъде</span>
            <select name="grad" defaultValue="sofia" className="bg-transparent text-[17px] font-semibold outline-none">
              {cities.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 rounded-2xl bg-ground px-4 py-3">
            <span className="text-xs font-bold tracking-wider text-muted uppercase">Пътници</span>
            <input
              name="mesta"
              type="number"
              min={1}
              max={99}
              placeholder="Напр. 50"
              className="bg-transparent text-[17px] font-semibold outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 rounded-2xl bg-ground px-4 py-3">
            <span className="text-xs font-bold tracking-wider text-muted uppercase">Тип</span>
            <select name="tip" defaultValue="" className="bg-transparent text-[17px] font-semibold outline-none">
              <option value="">Всички</option>
              {VEHICLE_TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn-primary min-h-16 text-[17px]">
            <Search />
            Намери автобус
          </button>
        </form>
        <div className="mx-auto mt-6 flex max-w-[1240px] flex-wrap gap-x-8 gap-y-3 text-[15px] font-semibold text-slate-700">
          <span className="flex items-center gap-2">
            <Shield className="text-ok" />
            Само превозвачи с проверен лиценз
          </span>
          <span className="flex items-center gap-2">
            <Clock className="text-ok" />
            Оферти директно от превозвачите
          </span>
          <span className="flex items-center gap-2">
            <Check className="text-ok" />
            Без регистрация и без такси за заявителя
          </span>
        </div>
      </section>

      <section className="px-4 pt-22 sm:px-6">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-3xl font-bold sm:text-4xl">Какъв автобус търсиш?</h2>
            <Link href="/avtobusi" className="font-bold text-navy">
              Целият каталог →
            </Link>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5">
            {VEHICLE_TYPES.map((t, i) => (
              <Link
                key={t.key}
                href={`/avtobusi?tip=${t.key}`}
                className="card-hover flex flex-col gap-4 rounded-[20px] border border-line bg-white p-6"
              >
                <div
                  className={`flex h-30 items-center justify-center rounded-2xl text-navy ${["bg-sky-soft", "bg-[#fdf1dc]", "bg-[#e4f2ea]", "bg-[#efe9f7]"][i]}`}
                >
                  <BusDrawing width={90 + i * 20} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xl font-extrabold">{t.name}</span>
                  <span className="text-[15px] font-medium text-muted">{t.seats}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pt-22 sm:px-6">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-7">
          <h2 className="text-3xl font-bold sm:text-4xl">Автобуси под наем по градове</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
            {popular.map((c) => (
              <Link
                key={c.id}
                href={`/avtobusi-pod-naem/${c.slug}`}
                className="card-hover flex min-h-14 items-center justify-between rounded-2xl border border-line bg-white px-5 py-4 text-[17px] font-bold"
              >
                {c.name}
                <Chevron size={18} className="text-slate-500" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="kak-raboti" className="px-4 pt-22 sm:px-6">
        <div className="panel mx-auto flex max-w-[1240px] flex-col gap-9 p-[clamp(28px,5vw,56px)]">
          <h2 className="text-3xl font-bold sm:text-4xl">Как работи</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-8">
            {[
              ["Опиши пътуването", "Маршрут, дати, брой пътници и изисквания. Отнема около минута и не изисква регистрация."],
              ["Получи оферти", "Заявката стига само до превозвачи с достатъчно места, които обслужват твоя район."],
              ["Сравни и избери", "Цена, автобус и превозвач на едно място. След пътуването оценяваш превозвача."],
            ].map(([t, d], i) => (
              <div key={t} className="flex flex-col gap-3">
                <span className="font-display text-[44px] leading-none font-bold text-amber-deep">0{i + 1}</span>
                <h3 className="text-xl font-bold">{t}</h3>
                <p className="leading-relaxed text-muted">{d}</p>
              </div>
            ))}
          </div>
          <Link href="/zayavka" className="btn-primary self-start">
            Пусни заявка
          </Link>
        </div>
      </section>

      {latest.length > 0 && (
        <section className="px-4 pt-22 sm:px-6">
          <div className="mx-auto flex max-w-[1240px] flex-col gap-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-3xl font-bold sm:text-4xl">Нови в каталога</h2>
              <Link href="/avtobusi" className="font-bold text-navy">
                Виж всички →
              </Link>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
              {latest.map((item) => (
                <VehicleCard key={item.vehicle.id} item={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="prevozvachi" className="px-4 pt-22 sm:px-6">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-10 rounded-[28px] bg-navy p-[clamp(28px,5vw,64px)] text-white">
          <div className="flex flex-[1_1_460px] flex-col gap-4">
            <h2 className="text-[clamp(28px,3.6vw,44px)] leading-tight font-bold">Имаш автобуси? Получавай заявки безплатно.</h2>
            <p className="text-lg leading-relaxed text-[#e3eaf5]">
              Регистрирай фирмата си, добави автобусите и избери откъде искаш да получаваш запитвания: от твоя град, в
              радиус 100 или 200 км, или от цяла България.
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              <Link href="/registracia" className="btn-primary">
                Регистрирай превозвач
              </Link>
            </div>
          </div>
          <ul className="flex flex-[1_1_340px] flex-col text-base font-semibold">
            {[
              "Само подходящи заявки по места и район",
              "Значка „Проверен превозвач“ след одобрение",
              "Напомняне преди изтичане на документи",
              "Попълване на фирмените данни по ЕИК",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3 border-b border-[#2b4a75] py-4">
                <Check className="text-amber" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
