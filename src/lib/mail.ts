import { SITE_URL } from "./util";

/**
 * Имейли през Resend (https://resend.com). Без RESEND_API_KEY имейлите само се записват в лога —
 * удобно за тестове, но на живо ключът трябва да е зададен.
 */
export async function sendMail(opts: { to: string; subject: string; html: string; replyTo?: string }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM ?? "BusRent <noreply@busrent.eu>";
  if (!key) {
    console.log(`[mail:dry-run] → ${opts.to} | ${opts.subject}`);
    return { ok: true, dryRun: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, html: opts.html, reply_to: opts.replyTo }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) console.error("[mail] Resend error", res.status, await res.text());
    return { ok: res.ok };
  } catch (e) {
    console.error("[mail] failed", e);
    return { ok: false };
  }
}

export function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function layout(title: string, body: string) {
  return `<!doctype html><html lang="bg"><body style="margin:0;background:#f6f7f9;font-family:Arial,sans-serif;color:#0f172a">
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="background:#0e2a50;color:#fff;padding:18px 22px;border-radius:14px 14px 0 0;font-weight:800;font-size:20px">BusRent</div>
<div style="background:#fff;padding:24px 22px;border-radius:0 0 14px 14px;border:1px solid #e6eaf0;border-top:0">
<h1 style="font-size:20px;margin:0 0 14px">${esc(title)}</h1>${body}</div>
<p style="font-size:12px;color:#475569;text-align:center">${SITE_URL.replace(/^https?:\/\//, "")}</p></div></body></html>`;
}
