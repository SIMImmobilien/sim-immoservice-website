import type { APIRoute } from "astro";
import nodemailer from "nodemailer";
import { site } from "../../data/site";

export const prerender = false;

const MAX_FIELD = 5000;

function clean(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, MAX_FIELD);
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

  const host = import.meta.env.SMTP_HOST;
  const user = import.meta.env.SMTP_USER;
  const pass = import.meta.env.SMTP_PASS;
  const to = import.meta.env.MAIL_TO || site.email;

  if (!host || !user || !pass) {
    console.error("SMTP-Zugangsdaten fehlen (SMTP_HOST / SMTP_USER / SMTP_PASS).");
    return json(503, {
      error: `Das Formular ist derzeit nicht verfügbar. Bitte schreiben Sie uns an ${site.email} oder rufen Sie an: ${site.phoneDisplay}.`,
    });
  }

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
      port: Number(import.meta.env.SMTP_PORT ?? 465),
      secure: String(import.meta.env.SMTP_SECURE ?? "true") !== "false",
      auth: { user, pass },
    });

    await transport.sendMail({
      from: `"${site.name} Website" <${user}>`,
      to,
      replyTo: email,
      subject,
      text: zeilen.join("\n"),
    });
  } catch (err) {
    console.error("Versand fehlgeschlagen:", err);
    return json(502, {
      error: `Die Nachricht konnte nicht versendet werden. Bitte schreiben Sie uns an ${site.email} oder rufen Sie an: ${site.phoneDisplay}.`,
    });
  }

  return json(200, { ok: true });
};
