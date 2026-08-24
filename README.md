# SIM Immobilien Service GmbH — Website

Astro-Website der SIM Immobilien Service GmbH, Montabaur.

## Formularanfragen einrichten

Alle Formulare der Website (Kontakt, kostenlose Wertermittlung, Suchauftrag,
Objektanfrage) werden über einen eigenen Server-Endpunkt verarbeitet und per
E-Mail an das Postfach der Firma zugestellt. Ein externer Formulardienst wird
nicht eingesetzt.

**Ablauf einer Anfrage**

1. Besucher füllt ein Formular aus und sendet es ab.
2. Die Daten gehen an den Endpunkt `/api/anfrage` auf dem eigenen Server.
3. Der Endpunkt prüft die Angaben und verwirft automatisierte Spam-Einträge.
4. Die Anfrage wird per SMTP über das IONOS-Postfach an
   `info@sim-immoservice.de` zugestellt.

Die Absenderadresse des Besuchers steht als `Reply-To` in der E-Mail — ein Klick
auf „Antworten" im Mailprogramm genügt, um zu antworten.

### Einmalige Einrichtung in Vercel

Damit die Zustellung funktioniert, müssen die Zugangsdaten des Postfachs
einmalig hinterlegt werden:

1. In Vercel das Projekt öffnen → **Settings** → **Environment Variables**
2. Diese drei Werte anlegen (jeweils für alle Environments):

   | Name | Wert |
   | --- | --- |
   | `SMTP_HOST` | `smtp.ionos.de` |
   | `SMTP_USER` | `info@sim-immoservice.de` |
   | `SMTP_PASS` | das Passwort dieses E-Mail-Postfachs |

3. Unter **Deployments** das jüngste Deployment über **Redeploy** neu
   ausrollen — Umgebungsvariablen greifen erst nach einem neuen Deployment.
4. Zum Prüfen das Kontaktformular auf der Website einmal selbst ausfüllen und
   absenden. Die Anfrage muss anschließend im Postfach liegen.

Port und Verschlüsselung sind auf die IONOS-Standardwerte (465, SSL)
voreingestellt und müssen nur gesetzt werden, wenn davon abgewichen wird
(`SMTP_PORT`, `SMTP_SECURE`). Soll die Post an eine andere Adresse gehen als an
die des Absenderpostfachs, lässt sich `MAIL_TO` setzen.

Solange die Zugangsdaten fehlen, bleibt die Website vollständig nutzbar; die
Formulare weisen dann auf Telefonnummer und E-Mail-Adresse hin, statt ohne
Rückmeldung zu scheitern.

## Entwicklung

```sh
npm install
npm run dev      # Entwicklungsserver auf localhost:4321
npm run build    # Produktionsbuild
```

Für den lokalen Test des Formularversands lassen sich die Variablen aus
`.env.example` in eine Datei `.env` übernehmen. Diese Datei ist von der
Versionierung ausgenommen und gehört nicht ins Repository.
