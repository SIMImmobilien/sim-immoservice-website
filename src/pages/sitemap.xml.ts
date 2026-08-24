import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { site } from "../data/site";

export const GET: APIRoute = async () => {
  const listings = await getCollection("immobilien");

  const staticPaths = [
    "",
    "immobilien/",
    "leistungen/",
    "spezialisierungen/",
    "verkaufen/",
    "wertermittlung/",
    "suchauftrag/",
    "ueber-uns/",
    "kontakt/",
  ];
  // Impressum und Datenschutz sind auf noindex gesetzt und bleiben daher
  // außen vor — sonst meldet die Search Console sie als Fehler.

  const urls = [
    ...staticPaths.map((path) => `${site.siteUrl}/${path}`),
    ...listings.map((entry) => `${site.siteUrl}/immobilien/${entry.id}/`),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
