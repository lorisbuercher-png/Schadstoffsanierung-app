# B&B Launch-Protokoll – 15.09.2026

Status: Code zur Integration vorbereitet. Noch kein freigegebener Produktivlaunch.

## Vorhandene Vorbereitung

- Aktuellen Hauptbranch mit Journal-Wiederherstellung und Teamprüfung integriert.
- Gemeinsame, versionierte Ablage an alle Arbeitsseiten angeschlossen.
- Atomare Schreibvorgänge, Konfliktbehandlung und idempotente Wiederholung.
- Berechtigungen in PostgreSQL; Admin-Umschalter für Vorarbeiter ausgeblendet.
- Fehlende Produktivkonfiguration öffnet keinen ungeschützten Arbeitsbereich.
- Interne Weiterleitungsziele, kein Suchmaschinenindex, keine Einbettung in Fremdseiten.
- Tests für Workflow, Anhänge, Wiederherstellung, Cloud-Client und PostgreSQL-Rollen.

## Lokal geprüft

- PostgreSQL-Test (PGlite): atomare Transaktionen, Versionskonflikte, Wiederholung, Rollen und Organisationsgrenzen erfolgreich.
- Produktionsbuild und ESLint erfolgreich.
- HTTP-Prüfung: nicht konfigurierte Produktion leitet auf Login um.
- Visueller Browsertest ausstehend: Chromium-Download in dieser Umgebung nicht erreichbar.

## Noch zwingend vor Go-live

1. Supabase-Projekt und Vercel-Projekt verbinden; aktuelle Zieladresse festlegen.
2. Migrationen 001, 002 und 003 in dieser Reihenfolge auf einer Testdatenbank anwenden.
   001 ist nicht wiederholt ausführbar; bei bestehendem Schema vorher den Migrationsstand prüfen.
3. Microsoft Entra Single-Tenant-App und Azure-Provider in Supabase einrichten.
   Nicht benötigte Anmeldeprovider deaktivieren. Tenant und Redirect-URLs konkret prüfen.
4. Umgebungsvariablen aus `.env.example` in Vercel setzen. `BB_PREVIEW_MODE` muss
   fehlen oder `false` sein. Neu bauen, da NEXT_PUBLIC-Werte beim Build eingebunden werden.
5. Mit Loris und Rolf anmelden: aktive Adminprofile bestätigen. Vorarbeiter-Testkonto
   anmelden; Stammdaten-/Teamänderungen müssen auch direkt über die API scheitern.
6. Auf zwei Geräten dieselbe Testbaustelle öffnen: Check, Zonenplan, Teamzuordnung,
   Ein-/Auschecken, Journalabschluss, Anhänge herunterladen. Gleichzeitige Bearbeitung
   desselben Datensatzes muss einen Konflikt statt Datenverlust erzeugen.
7. Netzwerk beim Speichern unterbrechen: Wiederholen darf keinen zweiten Eintrag erzeugen.
   Gesperrtes Konto und fremde Organisation dürfen keine Arbeitsdaten lesen oder schreiben.
8. Backup und Wiederherstellung im gewählten Supabase-Tarif prüfen; Wiederherstellung
   einer Testbaustelle in einer separaten Umgebung dokumentieren.
9. Fachliche Abnahme der Sicherheitskontrollen durch B&B. Die App-Prüfungen sind
   kein Nachweis einer externen SUVA-Abnahme.
10. Erst danach produktiv bereitstellen und Anmeldung/Dateidownload an der echten URL prüfen.

## Bestehende Daten und Grenzen

Vorhandene Browserdaten werden nicht automatisch in die gemeinsame Datenbank importiert.
Vor einem Gerätewechsel relevante Altbestände separat sichern und gezielt migrieren.
Kein Offline-Betriebsmodus: ohne Verbindung keine bestätigte gemeinsame Speicherung.
Journal-Zwischenstände im Produktivmodus sind tabbezogen, keine dauerhafte Datensicherung.
Pro Datei maximal 4 MB, pro gemeinsamer Dokumentliste/Datensatz maximal 20 MB.
Alle aktiven Admins und Vorarbeiter einer Organisation sehen deren Baustellen.
Microsoft-Kalendersynchronisierung und automatische SharePoint-Ablage sind nicht Bestandteil
 dieses Releases. Kalender und Dokumente werden innerhalb der App geführt.

## Rollback

Ein vorheriges Vercel-Deployment nur dann reaktivieren, wenn es dieselbe gemeinsame Ablage
unterstützt. Nicht auf einen alten lokalen Speicherstand zurückschalten: Dadurch entstünden
getrennte Datenbestände. Datenbankmigrationen und vorhandene Datensätze beim Code-Rollback
beibehalten; keine Tabellen löschen. Vor Änderungen Backup erstellen.
