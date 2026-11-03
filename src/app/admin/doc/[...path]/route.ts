import { readFile } from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR } from "@/lib/uploads";

const TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".webp": "image/webp",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
};

/** Документи на превозвачите — достъпни само през /admin (защитено от middleware). */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params;
  const root = path.join(UPLOAD_DIR, "private");
  const file = path.normalize(path.join(root, ...parts));
  if (!file.startsWith(root + path.sep)) return new Response("Not found", { status: 404 });
  try {
    const body = await readFile(file);
    return new Response(body, {
      headers: {
        "Content-Type": TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
