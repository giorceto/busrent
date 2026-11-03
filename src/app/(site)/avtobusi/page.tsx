import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Catalog } from "@/components/Catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Автобуси и микробуси под наем",
  description: "Каталог на автобуси, мидибуси и микробуси под наем от проверени превозвачи в цяла България.",
  alternates: { canonical: "/avtobusi" },
};

type SP = Promise<{ grad?: string; mesta?: string; tip?: string }>;

export default async function CatalogPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  if (sp.grad) {
    const p = new URLSearchParams();
    if (sp.mesta) p.set("mesta", sp.mesta);
    if (sp.tip) p.set("tip", sp.tip);
    const q = p.toString();
    redirect(`/avtobusi-pod-naem/${encodeURIComponent(sp.grad)}${q ? `?${q}` : ""}`);
  }
  return <Catalog city={null} minSeats={Number(sp.mesta) || undefined} type={sp.tip || undefined} />;
}
