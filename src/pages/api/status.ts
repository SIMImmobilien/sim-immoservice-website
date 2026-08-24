import type { APIRoute } from "astro";
import {
  checkPass,
  issueSession,
  verifySession,
  setLocked,
  COOKIE_NAME,
  SESSION_SECONDS,
} from "../../lib/ctrl";

export const prerender = false;

function back(withError = false): Response {
  const url = new URL("/cw8x2kq", "http://x");
  if (withError) url.searchParams.set("e", "1");
  return new Response(null, {
    status: 303,
    headers: { Location: `${url.pathname}${url.search}` },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const form = await request.formData().catch(() => null);
  if (!form) return back(true);

  const action = String(form.get("action") ?? "");

  if (action === "logout") {
    cookies.delete(COOKIE_NAME, { path: "/" });
    return back();
  }

  if (!verifySession(cookies.get(COOKIE_NAME)?.value)) {
    const pass = String(form.get("pass") ?? "");
    if (!checkPass(pass) || !import.meta.env.ADMIN_SECRET) return back(true);
    cookies.set(COOKIE_NAME, issueSession(), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: import.meta.env.PROD,
      maxAge: SESSION_SECONDS,
    });
    return back();
  }

  if (action === "lock" || action === "unlock") {
    await setLocked(action === "lock");
  }
  return back();
};
