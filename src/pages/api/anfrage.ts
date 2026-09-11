import type { APIRoute } from "astro";
import { site } from "../../data/site";

export const prerender = false;

const MAX_FIELD = 5000;

function clean(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, MAX_FIELD);
}

// Umgebungsvariablen zur Build-Zeit (import.meta.env) und zur Laufzeit
// (process.env) auslesen und Leerzeichen/Zeilenumbrüche entfernen, die
// beim Einfügen in der Hosting-Oberfläche leicht mitkopiert werden.
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

  const apiKey = envVar(import.meta.env.RESEND_API_KEY, "RESEND_API_KEY");
  // Absenderadresse: muss zu einer in Resend verifizierten Domain gehören.
  const from = envVar(import.meta.env.MAIL_FROM, "MAIL_FROM") || `Website <noreply@${new URL(site.siteUrl).hostname.replace(/^www\./, "")}>`;
  const to = envVar(import.meta.env.MAIL_TO, "MAIL_TO") || site.email;
  const debug = envVar(import.meta.env.MAIL_DEBUG, "MAIL_DEBUG") === "1";

  if (!apiKey) {
    console.error("RESEND_API_KEY fehlt.");
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
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject,
        text: zeilen.join("\n"),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("Resend-Versand fehlgeschlagen:", res.status, body);
      const detail = debug ? ` [${res.status}] ${body}`.trim() : "";
      return json(502, {
        error: `Die Nachricht konnte nicht versendet werden. Bitte schreiben Sie uns an ${site.email} oder rufen Sie an: ${site.phoneDisplay}.${detail ? " — Diagnose:" + detail : ""}`,
      });
    }
  } catch (err) {
    console.error("Resend-Versand fehlgeschlagen:", err);
    return json(502, {
      error: `Die Nachricht konnte nicht versendet werden. Bitte schreiben Sie uns an ${site.email} oder rufen Sie an: ${site.phoneDisplay}.`,
    });
  }

  return json(200, { ok: true });
};
