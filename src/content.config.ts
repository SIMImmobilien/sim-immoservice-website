import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const immobilien = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/immobilien" }),
  schema: z.object({
    title: z.string(),
    objektart: z.enum(["haus", "wohnung", "grundstueck", "gewerbe", "sonstige"]),
    vermarktungsart: z.enum(["kauf", "miete"]),
    status: z.enum(["aktiv", "reserviert", "verkauft", "vermietet"]),
    ort: z.string(),
    plz: z.string(),
    preis: z.number(),
    preisAufAnfrage: z.boolean().default(false),
    nebenkosten: z.string().optional(),
    courtage: z.string().optional(),
    zimmer: z.number().optional(),
    wohnflaeche: z.number().optional(),
    nutzflaeche: z.number().optional(),
    grundstueck: z.number().optional(),
    baujahr: z.number().optional(),
    verfuegbarAb: z.string().optional(),
    wohneinheiten: z.number().optional(),
    ausstattung: z.array(z.string()).default([]),
    lage: z.string().optional(),
    energieausweis: z
      .object({
        typ: z.enum(["verbrauch", "bedarf"]),
        wert: z.number(),
        klasse: z.enum(["A+", "A", "B", "C", "D", "E", "F", "G", "H"]),
        energietraeger: z.string(),
        baujahr: z.number(),
        gueltigBis: z.string(),
      })
      .optional(),
    bilder: z.array(
      z.object({
        src: z.string(),
        alt: z.string(),
      })
    ),
    lat: z.number().nullable().default(null),
    lng: z.number().nullable().default(null),
    featured: z.boolean().default(false),
    objektId: z.string(),
  }),
});

export const collections = { immobilien };
