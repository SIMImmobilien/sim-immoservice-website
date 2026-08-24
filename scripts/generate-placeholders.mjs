import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const LISTINGS_DIR = path.join(ROOT, "public/images/listings");
const SITE_DIR = path.join(ROOT, "public/images/site");

const INK = "#171b21";
const BRASS = "#a3823f";

const PALETTES = [
  ["#efece4", "#d9d2c0"],
  ["#e9dfc9", "#cdb98a"],
  ["#e3ded2", "#c3b9a1"],
  ["#e6e9e2", "#c6cdbf"],
  ["#ece5db", "#cbbfa8"],
  ["#e2e4e6", "#bfc6cb"],
];

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function escapeXml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Icon fragments, drawn centered around (0,0) at roughly 220x160 scale.
const ICONS = {
  exterior: `
    <g transform="translate(-110,-90)" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" opacity="0.55">
      <path d="M10 90 L110 20 L210 90" />
      <rect x="30" y="90" width="160" height="90" />
      <rect x="95" y="130" width="30" height="50" />
      <rect x="50" y="105" width="26" height="26" />
      <rect x="144" y="105" width="26" height="26" />
    </g>`,
  interior: `
    <g transform="translate(-110,-80)" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" opacity="0.55">
      <rect x="10" y="10" width="200" height="140" />
      <rect x="34" y="34" width="70" height="70" />
      <line x1="69" y1="34" x2="69" y2="104" />
      <line x1="34" y1="69" x2="104" y2="69" />
      <path d="M130 150 L130 100 L200 100" />
      <line x1="10" y1="150" x2="210" y2="150" />
    </g>`,
  outdoor: `
    <g transform="translate(-110,-70)" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" opacity="0.55">
      <line x1="0" y1="120" x2="220" y2="120" />
      <path d="M40 120 C40 90 60 90 60 120" />
      <line x1="50" y1="120" x2="50" y2="70" />
      <circle cx="50" cy="55" r="22" />
      <path d="M120 120 L150 60 L180 120 Z" />
    </g>`,
  plan: `
    <g transform="translate(-110,-80)" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" opacity="0.55">
      <rect x="10" y="10" width="200" height="140" stroke-dasharray="6 6" />
      <line x1="10" y1="80" x2="120" y2="80" />
      <line x1="120" y1="10" x2="120" y2="150" />
    </g>`,
};

function svgPlaceholder({ label, index, width = 1600, height = 1067, icon = "exterior", dark = false }) {
  const [c1, c2] = dark ? ["#232b38", "#12161d"] : PALETTES[hash(label + index) % PALETTES.length];
  const stroke = dark ? BRASS : INK;
  const textFill = dark ? "#e9ddc6" : INK;
  const iconMarkup = (ICONS[icon] ?? ICONS.exterior).replaceAll(`stroke="${INK}"`, `stroke="${stroke}"`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}" />
      <stop offset="1" stop-color="${c2}" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)" />
  <g transform="translate(${width / 2},${height / 2 - 40}) scale(${width / 420})">
    ${iconMarkup}
  </g>
  <text x="50%" y="${height - 88}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${Math.round(width / 46)}" fill="${textFill}" opacity="0.62">${escapeXml(label)}</text>
  <text x="50%" y="${height - 48}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.round(width / 100)}" letter-spacing="4" fill="${BRASS}">MUSTERFOTO &#183; PLATZHALTERBILD</text>
</svg>`;
}

// Hand-drawn dusk scene of Schloss Montabaur over misty Westerwald hills —
// stands in for the real hero photo until the client provides one.
function heroScene({ width = 2000, height = 1500 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 2000 1500">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0b111c" />
      <stop offset="0.45" stop-color="#16202f" />
      <stop offset="0.78" stop-color="#33404e" />
      <stop offset="1" stop-color="#5a5344" />
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#c8935a" stop-opacity="0" />
      <stop offset="1" stop-color="#c8935a" stop-opacity="0.35" />
    </linearGradient>
    <linearGradient id="castle" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8f7347" />
      <stop offset="1" stop-color="#4a3b26" />
    </linearGradient>
    <linearGradient id="fog1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#aab4bd" stop-opacity="0" />
      <stop offset="0.5" stop-color="#aab4bd" stop-opacity="0.22" />
      <stop offset="1" stop-color="#aab4bd" stop-opacity="0" />
    </linearGradient>
  </defs>

  <rect width="2000" height="1500" fill="url(#sky)" />
  <rect x="0" y="620" width="2000" height="380" fill="url(#glow)" />

  <circle cx="330" cy="240" r="2.2" fill="#e9ddc6" opacity="0.5" />
  <circle cx="520" cy="150" r="1.6" fill="#e9ddc6" opacity="0.4" />
  <circle cx="820" cy="300" r="1.8" fill="#e9ddc6" opacity="0.35" />
  <circle cx="1560" cy="180" r="2" fill="#e9ddc6" opacity="0.45" />
  <circle cx="1760" cy="330" r="1.5" fill="#e9ddc6" opacity="0.35" />

  <path d="M0 940 Q 260 850 520 905 T 1050 890 T 1560 900 T 2000 860 V 1500 H 0 Z" fill="#1d2735" />
  <rect x="0" y="880" width="2000" height="120" fill="url(#fog1)" />
  <path d="M0 1060 Q 320 970 640 1030 T 1280 1020 T 2000 1000 V 1500 H 0 Z" fill="#151d29" />
  <rect x="0" y="1010" width="2000" height="130" fill="url(#fog1)" opacity="0.8" />

  <g>
    <path d="M980 1120 Q 1240 940 1500 1030 L 1560 1090 Q 1300 1180 980 1180 Z" fill="#10151f" />
    <g transform="translate(1240,830)">
      <rect x="-190" y="70" width="380" height="150" fill="url(#castle)" />
      <path d="M-200 70 L-150 8 L150 8 L200 70 Z" fill="#3c3122" />
      <rect x="-24" y="-40" width="48" height="56" fill="#584732" />
      <path d="M-28 -40 Q 0 -92 28 -40 Z" fill="#2e2517" />
      <circle cx="0" cy="-78" r="4" fill="#d9a45b" />
      <g fill="#4f4029">
        <rect x="-232" y="30" width="52" height="190" />
        <rect x="180" y="30" width="52" height="190" />
      </g>
      <path d="M-238 32 Q -206 -34 -174 32 Z" fill="#2e2517" />
      <path d="M174 32 Q 206 -34 238 32 Z" fill="#2e2517" />
      <circle cx="-206" cy="-22" r="4" fill="#d9a45b" />
      <circle cx="206" cy="-22" r="4" fill="#d9a45b" />
      <g fill="#e0a95e" opacity="0.9">
        <rect x="-150" y="100" width="14" height="24" />
        <rect x="-110" y="100" width="14" height="24" />
        <rect x="-70" y="100" width="14" height="24" />
        <rect x="-30" y="100" width="14" height="24" />
        <rect x="16" y="100" width="14" height="24" />
        <rect x="56" y="100" width="14" height="24" />
        <rect x="96" y="100" width="14" height="24" />
        <rect x="136" y="100" width="14" height="24" />
        <rect x="-150" y="150" width="14" height="24" opacity="0.7" />
        <rect x="-70" y="150" width="14" height="24" opacity="0.7" />
        <rect x="16" y="150" width="14" height="24" opacity="0.7" />
        <rect x="96" y="150" width="14" height="24" opacity="0.7" />
        <rect x="-214" y="90" width="12" height="20" opacity="0.8" />
        <rect x="198" y="90" width="12" height="20" opacity="0.8" />
      </g>
    </g>
  </g>

  <rect x="0" y="1130" width="2000" height="110" fill="url(#fog1)" opacity="0.9" />

  <path d="M0 1500 V 1240 Q 120 1200 220 1240 T 460 1235 T 700 1250 T 960 1240 T 1240 1255 T 1520 1240 T 1780 1250 T 2000 1235 V 1500 Z" fill="#0a0f16" />
  <g fill="#0a0f16">
    <path d="M120 1240 l 26 -70 l 26 70 Z" />
    <path d="M180 1250 l 22 -56 l 22 56 Z" />
    <path d="M420 1245 l 24 -62 l 24 62 Z" />
    <path d="M1660 1248 l 26 -66 l 26 66 Z" />
    <path d="M1730 1255 l 20 -50 l 20 50 Z" />
  </g>

  <text x="50%" y="1408" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="42" fill="#e9ddc6" opacity="0.55">Schloss Montabaur über dem abendlichen Westerwald</text>
  <text x="50%" y="1452" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" letter-spacing="4" fill="${BRASS}">MUSTERFOTO &#183; PLATZHALTERBILD</text>
</svg>`;
}

const listings = [
  {
    slug: "montabaur-einfamilienhaus",
    images: [
      { label: "Straßenansicht, Montabaur", icon: "exterior" },
      { label: "Wohnzimmer mit Kamin, Erdgeschoss", icon: "interior" },
      { label: "Offene Wohnküche mit Einbauküche", icon: "interior" },
      { label: "Terrasse und Garten, Südwestausrichtung", icon: "outdoor" },
      { label: "Schlafzimmer im Obergeschoss", icon: "interior" },
    ],
  },
  {
    slug: "wirges-eigentumswohnung",
    images: [
      { label: "Wohnzimmer mit Blick zum Balkon", icon: "interior" },
      { label: "Offene Küche im Wohnbereich", icon: "interior" },
      { label: "Schlafzimmer mit Blick ins Grüne", icon: "interior" },
      { label: "Außenansicht, Wirges", icon: "exterior" },
    ],
  },
  {
    slug: "limburg-altstadt-altbauwohnung",
    images: [
      { label: "Fassade des Altbaus, Limburger Altstadt", icon: "exterior" },
      { label: "Wohnzimmer mit Stuckdecke und Dielenboden", icon: "interior" },
      { label: "Sanierte Einbauküche", icon: "interior" },
    ],
  },
  {
    slug: "wallmerod-baugrundstueck",
    images: [
      { label: "Baugrundstück in Wallmerod", icon: "plan" },
      { label: "Blick über das Grundstück Richtung Wald", icon: "outdoor" },
    ],
  },
  {
    slug: "montabaur-zentrum-praxisflaeche",
    images: [
      { label: "Büro-/Praxisfläche mit Empfangsbereich", icon: "interior" },
      { label: "Konferenzraum der Gewerbefläche", icon: "interior" },
      { label: "Fassade im Zentrum von Montabaur", icon: "exterior" },
    ],
  },
  {
    slug: "hachenburg-landhaus",
    images: [
      { label: "Außenansicht des Landhauses mit Weitblick", icon: "exterior" },
      { label: "Wohnbereich mit großzügiger Fensterfront", icon: "interior" },
      { label: "Pool und Terrasse im Garten", icon: "outdoor" },
      { label: "Ansicht des Anwesens von der Zufahrt", icon: "exterior" },
    ],
  },
  {
    slug: "ransbach-baumbach-doppelhaushaelfte",
    images: [{ label: "Außenansicht, Ransbach-Baumbach", icon: "exterior" }],
  },
  {
    slug: "koblenz-renditeobjekt",
    images: [
      { label: "Fassade des Mehrfamilienhauses, Koblenz", icon: "exterior" },
      { label: "Treppenhaus des Mehrfamilienhauses", icon: "interior" },
      { label: "Beispielwohnung im Mehrfamilienhaus", icon: "interior" },
    ],
  },
];

async function main() {
  for (const listing of listings) {
    const dir = path.join(LISTINGS_DIR, listing.slug);
    await mkdir(dir, { recursive: true });
    for (const [i, img] of listing.images.entries()) {
      const svg = svgPlaceholder({ label: img.label, index: i, icon: img.icon });
      await writeFile(path.join(dir, `${i + 1}.svg`), svg, "utf-8");
    }
    console.log(`✓ ${listing.slug}: ${listing.images.length} Platzhalterbilder`);
  }

  await mkdir(SITE_DIR, { recursive: true });

  // hero.jpg and og-image.jpg are real photographs supplied by the client —
  // never regenerated here. heroScene() remains available as a fallback:
  // await writeFile(path.join(SITE_DIR, "hero.svg"), heroScene(), "utf-8");
  void heroScene;

  const verkaufenSvg = svgPlaceholder({
    label: "Ihre Immobilie verdient den besten Preis",
    index: 1,
    width: 2000,
    height: 1200,
    icon: "interior",
  });
  await writeFile(path.join(SITE_DIR, "verkaufen-hero.svg"), verkaufenSvg, "utf-8");

  const interieurSvg = svgPlaceholder({
    label: "Beratungsraum von SIM Immobilien",
    index: 3,
    width: 1400,
    height: 1400,
    icon: "interior",
  });
  await writeFile(path.join(SITE_DIR, "interieur.svg"), interieurSvg, "utf-8");

  console.log("✓ site: verkaufen-hero.svg, interieur.svg");
}

main();
