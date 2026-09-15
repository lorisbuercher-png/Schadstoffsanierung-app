# B&B Arbeitsportal

Next.js-App für Geschäftsleitung und Vorarbeiter. Gemeinsame Baustellenakte,
Tagescheck, Journal, Zonenzutritt, Zonenplan, Team, Geräte und Dokumente.

## Entwicklung und Prüfung

```sh
npm ci
npm run dev
npm test
npm run build
```

Ohne Supabase-Konfiguration arbeitet `next dev` lokal mit vorhandenen Browserdaten.
Produktionsstarts ohne Supabase leiten auf die gesperrte Anmeldeseite um.
Nur für eine ausdrücklich isolierte Vorschau: `BB_PREVIEW_MODE=true`.
Dieser Wert darf beim produktiven Deployment nicht gesetzt sein.

## Produktiver Aufbau

Microsoft Entra (Single Tenant) → Supabase Auth → aktives B&B-Profil.
`admin` verwaltet Stammdaten und Teams, `vorarbeiter` bearbeitet Arbeitsunterlagen.
Beide Rollen sehen Baustellen ihrer Organisation. Die Rolle `mitarbeiter` hat in
diesem Release keinen Portalzugang. Eine Baustellenzuweisung ist eine Teamzuordnung,
keine zusätzliche Sichtbarkeitsgrenze.

Alle Arbeitsdaten laufen bei konfiguriertem Supabase über `app_records` und die
transaktionale Funktion `save_app_records`. Die Tabellen aus Migration 001 sind
für eine spätere Normalisierung reserviert und kein paralleler Schreibpfad.
Dateiinhalte werden derzeit im jeweiligen JSON-Datensatz gespeichert (4 MB pro
Datei, 20 MB pro Datensatz). Für grosse Dokumentbestände ist eine spätere Auslagerung
in den privaten Storage-Bucket nötig. SharePoint ist noch keine aktive Synchronisierung.

Schreibzugriffe prüfen Organisation, Profil, Rolle und Datensatzversion in PostgreSQL.
Ein Schreibvorgang aktualisiert Journal und Ablage gemeinsam. Wiederholte Anfragen
mit derselben ID erzeugen keine zweite Version. Bei Konflikten wird nicht automatisch
überschrieben; der Benutzer kann seine Eingaben sichern und den aktuellen Stand laden.
Zwischenstände des Journals bleiben im Produktivmodus pro Nutzer im aktuellen Browsertab.
Arbeitsdaten fallen bei Cloud-Fehlern nicht auf einen lokalen Parallelbestand zurück.

## Inbetriebnahme

Siehe [Launch-Protokoll](docs/LAUNCH.md) und
[Microsoft-Anmeldung](docs/MICROSOFT_LOGIN_EINRICHTEN.md).
