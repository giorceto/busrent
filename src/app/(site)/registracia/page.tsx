import type { Metadata } from "next";
import { getCities } from "@/lib/queries";
import { RegisterForm } from "./RegisterForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Регистрация на превозвач",
  description: "Добави автобусите си в BusRent безплатно и получавай заявки само за пътувания, за които имаш подходящ автобус.",
  alternates: { canonical: "/registracia" },
};

export default async function RegisterPage() {
  const cities = await getCities();
  return (
    <main className="mx-auto max-w-[820px] px-4 pt-10 pb-18 sm:px-6">
      <RegisterForm cities={cities.map((c) => ({ slug: c.slug, name: c.name }))} />
    </main>
  );
}
