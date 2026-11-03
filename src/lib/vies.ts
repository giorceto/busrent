/**
 * VIES (Европейска комисия) — проверка на ДДС номер и връщане на име и адрес.
 * Работи само за фирми, регистрирани по ДДС. За БГ ДДС номерът е ЕИК с префикс BG.
 * Документация: https://ec.europa.eu/taxation_customs/vies/
 */
export type ViesResult =
  | { ok: true; valid: true; name: string; address: string }
  | { ok: true; valid: false }
  | { ok: false; error: string };

export function normalizeEik(input: string) {
  return input.replace(/\D/g, "");
}

export function isValidEikFormat(eik: string) {
  return /^\d{9}(\d{4})?$/.test(eik);
}

function clean(s: string | undefined) {
  return (s ?? "").replace(/\s+/g, " ").replace(/^---$/, "").trim();
}

export async function checkVies(eik: string): Promise<ViesResult> {
  if (!isValidEikFormat(eik)) return { ok: false, error: "ЕИК трябва да е 9 или 13 цифри." };
  try {
    const res = await fetch(`https://ec.europa.eu/taxation_customs/vies/rest-api/ms/BG/vat/${eik}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, error: `VIES отговори с код ${res.status}. Опитай пак след малко.` };
    const data = (await res.json()) as { isValid?: boolean; name?: string; address?: string; userError?: string };
    if (data.userError && data.userError !== "VALID" && data.userError !== "INVALID") {
      return { ok: false, error: "VIES в момента не отговаря за България. Опитай пак или въведи данните ръчно." };
    }
    if (!data.isValid) return { ok: true, valid: false };
    return { ok: true, valid: true, name: clean(data.name), address: clean(data.address) };
  } catch {
    return { ok: false, error: "Няма връзка с VIES. Опитай пак или въведи данните ръчно." };
  }
}
