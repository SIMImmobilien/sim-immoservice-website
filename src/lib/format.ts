export function formatPrice(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("de-DE").format(value);
}

export const objektartLabels: Record<string, string> = {
  haus: "Haus",
  wohnung: "Wohnung",
  grundstueck: "Grundstück",
  gewerbe: "Gewerbeimmobilie",
  sonstige: "Renditeobjekt",
};

export const vermarktungsartLabels: Record<string, string> = {
  kauf: "zum Kauf",
  miete: "zur Miete",
};

export const statusLabels: Record<string, string> = {
  aktiv: "Verfügbar",
  reserviert: "Reserviert",
  verkauft: "Verkauft",
  vermietet: "Vermietet",
};

export function priceLabel(vermarktungsart: string, preis: number, preisAufAnfrage?: boolean): string {
  if (preisAufAnfrage) return "Preis auf Anfrage";
  const formatted = formatPrice(preis);
  return vermarktungsart === "miete" ? `${formatted} Kaltmiete` : `${formatted} Kaufpreis`;
}
