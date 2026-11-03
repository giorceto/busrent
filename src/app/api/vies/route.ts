import { checkVies, normalizeEik } from "@/lib/vies";

export async function GET(req: Request) {
  const eik = normalizeEik(new URL(req.url).searchParams.get("eik") ?? "");
  const result = await checkVies(eik);
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
