import type { APIRoute } from "astro";
import nodemailer from "nodemailer";
import { site } from "../../data/site";

export const prerender = false;

const MAX_FIELD = 5000;

function clean(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, MAX_FIELD);
}

// Umgebungsvariablen zur Build-Zeit (import.meta.env) und zur Laufzeit
// (process.env) auslesen und Leerzeichen/Zeilenumbrüche entfernen, die
// beim Einfügen in Netlify leicht mitkopiert werden.
function envVar(buildValue: string | undefined, key: string): string {
  const raw = buildValue ?? (typeof process !== "undefined" ? process.env?.[key] : undefined);
  return (raw ?? "").trim();
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return json(400, { error: "Ungültige Anfrage." });
  }

  // Honeypot: von Bots ausgefüllt, für Menschen unsichtbar
  if (clean(data.get("_honeypot"))) {
    return json(200, { ok: true });
  }

  // Pflichtfelder, die alle Formulare gemeinsam haben. Feldspezifische
  // Pflichtangaben (z. B. Nachricht) prüft das jeweilige Formular selbst.
  const email = clean(data.get("E-Mail"));
  const datenschutz = data.get("Datenschutz akzeptiert");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { error: "Bitte geben Sie eine gültige E-Mail-Adresse an." });
  }
  if (!datenschutz) {
    return json(400, { error: "Bitte stimmen Sie der Datenschutzerklärung zu." });
  }

  const host = envVar(import.meta.env.SMTP_HOST, "SMTP_HOST");
  const user = envVar(import.meta.env.SMTP_USER, "SMTP_USER");
  const pass = envVar(import.meta.env.SMTP_PASS, "SMTP_PASS");
  const to = envVar(import.meta.env.MAIL_TO, "MAIL_TO") || site.email;
  const portValue = envVar(import.meta.env.SMTP_PORT, "SMTP_PORT");
  const secureValue = envVar(import.meta.env.SMTP_SECURE, "SMTP_SECURE");
  const debug = envVar(import.meta.env.SMTP_DEBUG, "SMTP_DEBUG") === "1";

  if (!host || !user || !pass) {
    console.error("SMTP-Zugangsdaten fehlen (SMTP_HOST / SMTP_USER / SMTP_PASS).");
    return json(503, {
      error: `Das Formular ist derzeit nicht verfügbar. Bitte schreiben Sie uns an ${site.email} oder rufen Sie an: ${site.phoneDisplay}.`,
    });
  }

  const port = Number(portValue) || 465;
  // secure=true nur für Port 465 (SMTPS). Für 587 (STARTTLS) secure=false,
  // dabei die TLS-Aushandlung erzwingen.
  const secure = secureValue ? secureValue !== "false" : port === 465;

  const subject = clean(data.get("_subject")) || "Neue Anfrage über die Website";
  const zeilen: string[] = [];
  for (const [key, value] of data.entries()) {
    if (key.startsWith("_")) continue;
    const text = clean(value);
    if (text) zeilen.push(`${key}: ${text}`);
  }
  zeilen.push("", "Der Datenschutzerklärung wurde zugestimmt.");
  zeilen.push(`Eingegangen am ${new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}`);

  try {
    const transport = nodemailer.createTransport({
      host,
      port,
      secure,
      requireTLS: !secure,
      auth: { user, pass },
    });

    await transport.sendMail({
      from: `"${site.name} Website" <${user}>`,
      to,
      replyTo: email,
      subject,
      text: zeilen.join("\n"),
    });
  } catch (err: unknown) {
    const e = err as { code?: string; responseCode?: number; command?: string; response?: string; message?: string };
    console.error("SMTP-Versand fehlgeschlagen:", {
      code: e?.code,
      responseCode: e?.responseCode,
      command: e?.command,
      response: e?.response,
      message: e?.message,
    });
    // Diagnosemodus: nur wenn SMTP_DEBUG=1 gesetzt ist, wird die konkrete
    // Server-Antwort zurückgegeben, damit die Fehlerursache ohne Log-Zugriff
    // sichtbar wird. Nach der Fehlersuche SMTP_DEBUG wieder entfernen.
    const detail = debug
      ? ` [${e?.responseCode ?? e?.code ?? "?"}] ${e?.response ?? e?.message ?? ""}`.trim()
      : "";
    return json(502, {
      error: `Die Nachricht konnte nicht versendet werden. Bitte schreiben Sie uns an ${site.email} oder rufen Sie an: ${site.phoneDisplay}.${detail ? " — Diagnose:" + detail : ""}`,
    });
  }

  return json(200, { ok: true });
};
