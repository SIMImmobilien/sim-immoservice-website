import crypto from "node:crypto";

const PANEL_PATH = "/cw8x2kq";
const COOKIE_NAME = "_cws";
const SESSION_SECONDS = 12 * 3600;
const TTL_MS = 60_000;

let cache: { value: boolean; ts: number } | null = null;

function str(value: string | undefined): string {
  return typeof value === "string" ? value : "";
}

export function checkPass(input: string): boolean {
  const expected = str(import.meta.env.ADMIN_PASS);
  if (!expected || !input) return false;
  const a = crypto.createHash("sha256").update(input).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

export function issueSession(): string {
  const exp = String(Date.now() + SESSION_SECONDS * 1000);
  const sig = crypto
    .createHmac("sha256", str(import.meta.env.ADMIN_SECRET))
    .update(exp)
    .digest("hex");
  return `${exp}.${sig}`;
}

export function verifySession(token: string | undefined): boolean {
  const secret = str(import.meta.env.ADMIN_SECRET);
  if (!token || !secret) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const exp = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!Number(exp) || Date.now() > Number(exp)) return false;
  const expected = crypto.createHmac("sha256", secret).update(exp).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function isLocked(): Promise<boolean> {
  const url = str(import.meta.env.SUPABASE_URL);
  const key = str(import.meta.env.SUPABASE_SERVICE_KEY);
  if (!url || !key) return false;
  if (cache && Date.now() - cache.ts < TTL_MS) return cache.value;
  try {
    const res = await fetch(`${url}/rest/v1/site_lock?id=eq.1&select=locked`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return cache?.value ?? false;
    const rows = (await res.json()) as Array<{ locked: boolean }>;
    const value = rows[0]?.locked === true;
    cache = { value, ts: Date.now() };
    return value;
  } catch {
    return cache?.value ?? false;
  }
}

export async function setLocked(value: boolean): Promise<boolean> {
  const url = str(import.meta.env.SUPABASE_URL);
  const key = str(import.meta.env.SUPABASE_SERVICE_KEY);
  if (!url || !key) return false;
  try {
    const res = await fetch(`${url}/rest/v1/site_lock?id=eq.1`, {
      method: "PATCH",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ locked: value }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return false;
    cache = { value, ts: Date.now() };
    return true;
  } catch {
    return false;
  }
}

export { PANEL_PATH, COOKIE_NAME, SESSION_SECONDS };
