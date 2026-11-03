import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Catalog } from "@/components/Catalog";
import { getCityBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Params = Promise<{ city: string }>;
type SP = Promise<{ mesta?: string; tip?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { city: slug } = await params;
  const city = await getCityBySlug(slug);
  if (!city) return {};
  return {
    title: `Автобус под наем ${city.name}`,
    description: `Автобуси, мидибуси и микробуси под наем в ${city.name} и до 100 км от града. Проверени превозвачи, оферти без регистрация.`,
    alternates: { canonical: `/avtobusi-pod-naem/${city.slug}` },
  };
}

export default async function CityCatalogPage({ params, searchParams }: { params: Params; searchParams: SP }) {
  const [{ city: slug }, sp] = await Promise.all([params, searchParams]);
  const city = await getCityBySlug(slug);
  if (!city) notFound();
  return <Catalog city={city} minSeats={Number(sp.mesta) || undefined} type={sp.tip || undefined} />;
}
