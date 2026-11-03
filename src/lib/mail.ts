import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { SITE_URL } from "./util";

let smtp: Transporter | null = null;
function getSmtp() {
  if (!process.env.SMTP_HOST) return null;
  if (!smtp) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    smtp = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465, // 465 = SSL, 587 = STARTTLS
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      connectionTimeout: 15_000,
    });
  }
  return smtp;
}

/**
 * Изпращане на имейл. Ред на избор:
 *  1. SMTP (SMTP_HOST...) — собствен пощенски сървър;
 *  2. Resend (RESEND_API_KEY);
 *  3. нищо от горните — имейлът само се записва в лога (за тестове).
 */
export async function sendMail(opts: { to: string; subject: string; html: string; replyTo?: string }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM ?? "BusRent <noreply@busrent.eu>";

  const transport = getSmtp();
  if (transport) {
    try {
      await transport.sendMail({ from, to: opts.to, subject: opts.subject, html: opts.html, replyTo: opts.replyTo });
      console.log(`[mail:smtp] → ${opts.to} | ${opts.subject}`);
      return { ok: true };
    } catch (e) {
      console.error("[mail:smtp] failed", opts.to, e instanceof Error ? e.message : e);
      return { ok: false };
    }
  }

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
