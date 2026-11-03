import type { MetadataRoute } from "next";
import { eq, and } from "drizzle-orm";
import { db, schema } from "@/db";
import { SITE_URL } from "@/lib/util";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cities, vehicles] = await Promise.all([
    db.select({ slug: schema.cities.slug }).from(schema.cities),
    db
      .select({ slug: schema.vehicles.slug, updated: schema.vehicles.createdAt })
      .from(schema.vehicles)
      .innerJoin(schema.carriers, eq(schema.vehicles.carrierId, schema.carriers.id))
      .where(and(eq(schema.carriers.status, "approved"), eq(schema.vehicles.active, true))),
  ]);
  return [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/avtobusi`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/zayavka`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/registracia`, changeFrequency: "monthly", priority: 0.6 },
    ...cities.map((c) => ({ url: `${SITE_URL}/avtobusi-pod-naem/${c.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...vehicles.map((v) => ({ url: `${SITE_URL}/avtobus/${v.slug}`, lastModified: v.updated, priority: 0.7 })),
  ];
}
