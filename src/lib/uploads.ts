import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { randomId } from "./util";

/** Корен за качените файлове (в Docker е volume). public/ се сервира на /uploads, private/ — само за админ. */
export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), ".uploads");

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DOC_TYPES = [...IMAGE_TYPES, "application/pdf"];
export const MAX_FILE_MB = 10;

export function isFile(v: FormDataEntryValue | null): v is File {
  return typeof v === "object" && v !== null && "arrayBuffer" in v && (v as File).size > 0;
}

export function checkFile(f: File, kind: "image" | "doc"): string | null {
  const allowed = kind === "image" ? IMAGE_TYPES : DOC_TYPES;
  if (!allowed.includes(f.type)) return `${f.name}: позволени са ${kind === "image" ? "JPG, PNG и WEBP" : "PDF, JPG, PNG и WEBP"}.`;
  if (f.size > MAX_FILE_MB * 1024 * 1024) return `${f.name}: файлът е над ${MAX_FILE_MB} MB.`;
  return null;
}

/** Снимка → WEBP до 1600px, записва се в public/. Връща публичния URL. */
export async function saveImage(f: File, folder: string) {
  const dir = path.join(UPLOAD_DIR, "public", folder);
  await mkdir(dir, { recursive: true });
  const name = `${randomId(10)}.webp`;
  const buf = Buffer.from(await f.arrayBuffer());
  const out = await sharp(buf).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  await writeFile(path.join(dir, name), out);
  return `/uploads/${folder}/${name}`;
}

/** Документ (лиценз, застраховка) — в private/, не е публично достъпен. Връща вътрешен път. */
export async function saveDocument(f: File, folder: string) {
  const dir = path.join(UPLOAD_DIR, "private", folder);
  await mkdir(dir, { recursive: true });
  const ext = f.type === "application/pdf" ? "pdf" : f.type.split("/")[1];
  const name = `${randomId(12)}.${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await f.arrayBuffer()));
  return `${folder}/${name}`;
}
