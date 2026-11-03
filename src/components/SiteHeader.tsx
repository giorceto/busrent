import Link from "next/link";
import { LogoMark } from "./Icons";

export function Logo({ light = true }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2.5 text-[22px] font-extrabold tracking-tight ${light ? "text-white" : "text-navy"}`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-amber text-navy">
        <LogoMark />
      </span>
      BusRent
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="bg-navy text-white">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-8 gap-y-4 px-4 py-4 sm:px-6">
        <Logo />
        <nav aria-label="Основна навигация" className="flex grow flex-wrap gap-6 text-[15px] font-semibold text-[#dce4f0]">
          <Link href="/avtobusi" className="hover:text-white">
            Каталог
          </Link>
          <Link href="/#kak-raboti" className="hover:text-white">
            Как работи
          </Link>
          <Link href="/#prevozvachi" className="hover:text-white">
            За превозвачи
          </Link>
        </nav>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/zayavka" className="px-3 py-2.5 text-[15px] font-semibold text-white">
            Пусни заявка
          </Link>
          <Link href="/registracia" className="rounded-xl bg-amber px-4 py-2.5 text-[15px] font-bold text-amber-ink">
            Добави автобус
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="px-4 pt-18 pb-12 sm:px-6">
      <div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-4 border-t border-slate-200 pt-7 text-sm text-muted">
        <span className="font-bold text-ink">BusRent.eu</span>
        <div className="flex flex-wrap gap-5">
          <Link href="/avtobusi">Каталог</Link>
          <Link href="/registracia">За превозвачи</Link>
          <Link href="/usloviya">Общи условия</Link>
          <Link href="/poveritelnost">Поверителност</Link>
        </div>
      </div>
    </footer>
  );
}
