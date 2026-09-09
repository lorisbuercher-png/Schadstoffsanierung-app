# Microsoft-365-Login für B&B einrichten

Die WebApp ist für Microsoft Entra ID über Supabase Auth vorbereitet. Die Anmeldung ist auf
`@bb-schadstoffsanierung.ch` beschränkt. Loris und Rolf werden beim ersten Login automatisch
als Administratoren angelegt; weitere B&B-Konten erhalten zunächst die Rolle `vorarbeiter`.

## 1. Supabase-Projekt erstellen

1. In Supabase ein neues Projekt für `B&B Arbeitsportal` erstellen.
2. Im SQL Editor den Inhalt von `supabase/migrations/001_bb_basis.sql` ausführen.
3. Unter **Project Settings > API** die Project URL und den Publishable Key kopieren.

## 2. Microsoft-App registrieren

1. Im Microsoft Entra Admin Center **Entra ID > App registrations > New registration** öffnen.
2. Name: `B&B Arbeitsportal`.
3. Kontotyp: **Nur Konten in diesem Organisationsverzeichnis (Single Tenant)**.
4. Als Web-Redirect-URI die Supabase-Callback-Adresse eintragen:
   `https://DEIN-PROJEKT.supabase.co/auth/v1/callback`
5. Unter **Certificates & secrets** ein Client Secret erstellen. Den **Wert** sofort kopieren.

## 3. Azure-Anbieter in Supabase aktivieren

Unter **Authentication > Providers > Azure**:

- Azure aktivieren
- Application (Client) ID aus Entra eintragen
- Client-Secret-Wert eintragen
- Tenant URL: `https://login.microsoftonline.com/DEINE-TENANT-ID`

## 4. App-Weiterleitung erlauben

Unter **Authentication > URL Configuration**:

- Site URL: die feste Adresse der B&B-WebApp
- Redirect URL: `https://DEINE-APP-ADRESSE/auth/callback`
- Für lokale Entwicklung zusätzlich: `http://localhost:3000/auth/callback`

## 5. Umgebungsvariablen setzen

Die drei Werte aus `.env.example` beim Hosting hinterlegen:

```text
NEXT_PUBLIC_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_DEIN_KEY
NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN=bb-schadstoffsanierung.ch
```

Danach die App neu bereitstellen. Ohne diese Werte bleibt der bisherige Vorschaumodus aktiv,
damit die Entwicklung nicht blockiert wird.

## Sicherheit

- Microsoft-Anmeldung ist Single Tenant.
- Nach dem Login wird die B&B-E-Mail-Domain zusätzlich geprüft.
- Datenbanktabellen und Dokumente sind mit Row Level Security pro Organisation getrennt.
- Administratorrechte werden in der Datenbank geprüft und nicht nur in der Oberfläche dargestellt.
