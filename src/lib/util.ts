const CYR: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sht",
  ъ: "a", ь: "y", ю: "yu", я: "ya",
};

export function slugify(s: string) {
  return s
    .toLowerCase()
    .split("")
    .map((ch) => CYR[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function randomId(len = 10) {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export function formatPrice(v: string | number) {
  const n = Number(v);
  return `${n.toLocaleString("bg-BG", { maximumFractionDigits: 2 })} €`;
}

export function formatDate(d: string | Date | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("bg-BG", { day: "numeric", month: "short", year: "numeric" });
}

export const SITE_URL = process.env.SITE_URL ?? "https://busrent.eu";
