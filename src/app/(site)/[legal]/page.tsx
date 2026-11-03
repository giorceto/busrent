import type { Metadata } from "next";
import { notFound } from "next/navigation";

const PAGES: Record<string, { title: string; body: string }> = {
  usloviya: {
    title: "Общи условия",
    body: "[ЧЕРНОВА] Тук ще бъдат общите условия за използване на BusRent от заявители и превозвачи. Текстът трябва да бъде изготвен или прегледан от юрист преди публичното пускане на платформата.",
  },
  poveritelnost: {
    title: "Политика за поверителност",
    body: "[ЧЕРНОВА] Тук ще бъде политиката за поверителност и обработка на лични данни (GDPR): какви данни събираме от заявителите и превозвачите, с каква цел, колко време ги пазим и как може да поискате изтриването им. Текстът трябва да бъде изготвен или прегледан от юрист.",
  },
};

type Params = Promise<{ legal: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = PAGES[(await params).legal];
  return p ? { title: p.title, robots: { index: false } } : {};
}

export default async function LegalPage({ params }: { params: Params }) {
  const p = PAGES[(await params).legal];
  if (!p) notFound();
  return (
    <main className="mx-auto flex max-w-[780px] flex-col gap-5 px-4 pt-10 pb-18 sm:px-6">
      <h1 className="text-3xl font-bold">{p.title}</h1>
      <p className="text-[17px] leading-relaxed text-slate-700">{p.body}</p>
    </main>
  );
}
