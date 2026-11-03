import type { Metadata } from "next";
import { getCities } from "@/lib/queries";
import { RequestForm } from "./RequestForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Заявка за автобус под наем",
  description: "Опиши пътуването и получи оферти от превозвачи с подходящ автобус. Без регистрация.",
  alternates: { canonical: "/zayavka" },
};

type SP = Promise<{ grad?: string; mesta?: string; avtobus?: string }>;

export default async function RequestPage({ searchParams }: { searchParams: SP }) {
  const [sp, cities] = await Promise.all([searchParams, getCities()]);
  return (
    <main className="mx-auto max-w-[780px] px-4 pt-10 pb-18 sm:px-6">
      <RequestForm
        cities={cities.map((c) => ({ slug: c.slug, name: c.name }))}
        defaults={{
          city: sp.grad,
          pax: Number(sp.mesta) || undefined,
          note: sp.avtobus ? `Интересувам се от: ${sp.avtobus.replace(/-/g, " ")}` : undefined,
        }}
      />
    </main>
  );
}
