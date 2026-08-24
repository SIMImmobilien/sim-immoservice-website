import { defineMiddleware } from "astro:middleware";
import { isLocked, PANEL_PATH } from "./lib/ctrl";
import { site } from "./data/site";

const ALLOWED = [PANEL_PATH, "/api/status"];

function maintenanceHtml(): string {
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>Wartung &ndash; ${site.name}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f7f5f1;color:#26221c;font-family:Georgia,'Times New Roman',serif;padding:24px}
.card{max-width:520px;text-align:center;padding:48px 40px;background:#fff;border-radius:14px;box-shadow:0 10px 40px rgba(38,34,28,.08)}
h1{font-size:26px;font-weight:600;margin-bottom:14px}
p{font-size:16px;line-height:1.6;color:#5a544a;margin-bottom:10px}
.k{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#8a8378;margin-top:26px;letter-spacing:.04em;text-transform:uppercase}
</style>
</head>
<body>
<main class="card">
<h1>Die Website ist derzeit nicht erreichbar.</h1>
<p>Aus technischen Gr&uuml;nden ist der Inhalt vor&uuml;bergehend nicht verf&uuml;gbar.<br>Bitte versuchen Sie es zu einem sp&auml;teren Zeitpunkt erneut.</p>
<p>${site.phoneDisplay} &middot; ${site.email}</p>
<div class="k">${site.name}</div>
</main>
</body>
</html>`;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  const allowed = ALLOWED.some(
    (p) => path === p || path === `${p}/` || path.startsWith(`${p}/`)
  );
  if (allowed) return next();
  if (await isLocked()) {
    return new Response(maintenanceHtml(), {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Retry-After": "3600",
      },
    });
  }
  return next();
});
