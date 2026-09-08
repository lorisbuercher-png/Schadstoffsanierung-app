"use client";

import "./dashboard.css";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell, { type AppRole } from "../ui/AppShell";
import useActiveSite from "../ui/useActiveSite";

type Baustelle = {
  id: string;
  nummer?: string;
  projektname: string;
  ort?: string;
  status?: string;
  fortschritt?: number;
  verantwortlich?: string;
};

type Mangel = {
  id?: string;
  titel?: string;
  beschreibung?: string;
  prioritaet?: "kritisch" | "hoch" | "normal";
  status?: "offen" | "in-bearbeitung" | "behoben";
};

type SiteStatus = {
  baustelle: Baustelle;
  suvaOffen: number;
  suvaKritisch: number;
  maengelOffen: number;
  maengelKritisch: number;
  tagescheckOffen: boolean;
  zonenplanFehlt: boolean;
  personenInZone: number;
};

const prio1Nummern = new Set([6, 10, 12, 13, 19, 20, 23, 26, 29, 31, 33, 38, 42, 44]);

function lesen<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function datumKey() {
  const heute = new Date();
  const offset = heute.getTimezoneOffset() * 60_000;
  return new Date(heute.getTime() - offset).toISOString().slice(0, 10);
}

function icon(name: "shield" | "alert" | "site" | "clock" | "team" | "check" | "journal" | "arrow") {
  const paths = {
    shield: <><path d="M12 3 4.5 6v5.5c0 4.7 3 8 7.5 9.5 4.5-1.5 7.5-4.8 7.5-9.5V6L12 3Z"/><path d="m9 12 2 2 4-5"/></>,
    alert: <><path d="M10.3 3.8 2.4 18a2 2 0 0 0 1.8 3h15.6a2 2 0 0 0 1.8-3L13.7 3.8a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
    site: <><path d="M4 21h16M6 21V8h12v13M9 8V4h6v4"/><path d="M9 12h2M14 12h1M9 16h2M14 16h1"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    team: <><circle cx="9" cy="7" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 8h4M19 6v4"/></>,
    check: <><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></>,
    journal: <><path d="M5 3h14v18H5zM9 3v18M12 8h4M12 12h4"/></>,
    arrow: <path d="m9 18 6-6-6-6"/>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function Dashboard() {
  const { sites, selectedId, selectSite, loaded } = useActiveSite();
  const [role, setRole] = useState<AppRole>("admin");
  const [status, setStatus] = useState<SiteStatus[]>([]);
  const [mitarbeiter, setMitarbeiter] = useState(0);
  const [heute] = useState(datumKey);

  useEffect(() => {
    const gespeichert = localStorage.getItem("bb-role");
    if (gespeichert === "admin" || gespeichert === "vorarbeiter") setRole(gespeichert);

    const alle = lesen<Baustelle[]>("baustellen", []);
    const aktive = Array.isArray(alle) ? alle.filter((b) => String(b.status || "").trim().toLowerCase() !== "abgeschlossen") : [];
    const auswertung = aktive.map((baustelle): SiteStatus => {
      const audit = lesen<Record<string, { status?: string }>>(`suva-audit-${baustelle.id}`, {});
      let suvaOffen = 0;
      let suvaKritisch = 0;
      prio1Nummern.forEach((nr) => {
        const pruefung = audit[nr]?.status;
        if (pruefung !== "erfuellt" && pruefung !== "nicht-erfuellt" && pruefung !== "nicht-anwendbar") suvaOffen++;
        if (pruefung === "nicht-erfuellt") suvaKritisch++;
      });

      const maengel = lesen<Mangel[]>(`maengel-${baustelle.id}`, []);
      const offen = Array.isArray(maengel) ? maengel.filter((m) => m.status !== "behoben") : [];
      const tagescheck = lesen<{ status?: string } | null>(`tagescheck-${baustelle.id}-${heute}`, null);
      const zonenplan = lesen<{ grundriss?: string; elemente?: unknown[] }>(`zonenplan-${baustelle.id}`, {});
      const zutritte = lesen<Array<{ mitarbeiterId?: string; typ?: string }>>(`zonenzutritt-${baustelle.id}-${heute}`, []);
      const letzterStatus = new Map<string, string>();
      if (Array.isArray(zutritte)) zutritte.forEach((eintrag) => {
        if (eintrag.mitarbeiterId && !letzterStatus.has(eintrag.mitarbeiterId)) letzterStatus.set(eintrag.mitarbeiterId, eintrag.typ || "");
      });

      return {
        baustelle,
        suvaOffen,
        suvaKritisch,
        maengelOffen: offen.length,
        maengelKritisch: offen.filter((m) => m.prioritaet === "kritisch").length,
        tagescheckOffen: tagescheck?.status !== "arbeitsbereit",
        zonenplanFehlt: !zonenplan.grundriss && !(zonenplan.elemente?.length),
        personenInZone: [...letzterStatus.values()].filter((wert) => wert === "eintritt").length,
      };
    });
    setStatus(auswertung);

    const personen = lesen<Array<{ aktiv?: boolean }>>("mitarbeiter", []);
    setMitarbeiter(Array.isArray(personen) ? personen.filter((p) => p.aktiv !== false).length : 0);
  }, [heute, sites]);

  const zahlen = useMemo(() => status.reduce((summe, site) => ({
    suvaOffen: summe.suvaOffen + site.suvaOffen,
    suvaKritisch: summe.suvaKritisch + site.suvaKritisch,
    maengelOffen: summe.maengelOffen + site.maengelOffen,
    maengelKritisch: summe.maengelKritisch + site.maengelKritisch,
    tageschecks: summe.tageschecks + (site.tagescheckOffen ? 1 : 0),
    personen: summe.personen + site.personenInZone,
  }), { suvaOffen: 0, suvaKritisch: 0, maengelOffen: 0, maengelKritisch: 0, tageschecks: 0, personen: 0 }), [status]);

  return (
    <AppShell role={role} onRoleChange={setRole} suvaBadge={zahlen.suvaKritisch || zahlen.suvaOffen} maengelBadge={zahlen.maengelKritisch || zahlen.maengelOffen}>
      {role === "admin" ? <AdminDashboard sites={status} mitarbeiter={mitarbeiter} zahlen={zahlen} /> : <>
        <header className="foreman-heading"><div><span className="dash-eyebrow">Vorarbeiter</span><h1>Dein Arbeitstag</h1></div><label className="foreman-site-picker">Baustelle für heute<select value={selectedId} onChange={(event) => selectSite(event.target.value)} disabled={!loaded || !sites.length}><option value="">{!loaded ? "Baustellen werden geladen …" : "Bitte Baustelle auswählen"}</option>{sites.map((site) => <option key={site.id} value={site.id}>{site.projektname}{site.ort ? ` · ${site.ort}` : ""}{site.nummer ? ` · ${site.nummer}` : ""}</option>)}</select></label></header>
        {loaded ? <VorarbeiterDashboard site={status.find((site) => site.baustelle.id === selectedId)} hasSites={sites.length > 0} /> : <p role="status">Baustellen werden geladen …</p>}
      </>}
    </AppShell>
  );
}

type Zahlen = { suvaOffen: number; suvaKritisch: number; maengelOffen: number; maengelKritisch: number; tageschecks: number; personen: number };

function AdminDashboard({ sites, mitarbeiter, zahlen }: { sites: SiteStatus[]; mitarbeiter: number; zahlen: Zahlen }) {
  const handlungsbedarf = sites.filter((site) => site.suvaKritisch || site.suvaOffen || site.maengelKritisch);
  return <div className="dash admin-dashboard">
    <header className="dash-hero">
      <div><span className="dash-eyebrow">Geschäftsleitung · Live-Übersicht</span><h1>Guten Morgen, Loris.</h1><p>Das Wichtigste zuerst: Sicherheit, offene Punkte und laufende Baustellen.</p></div>
      <Link className="dash-primary-button" href="/baustellen/neu">+ Neue Baustelle</Link>
    </header>

    <section className="admin-kpis" aria-label="Wichtige Kennzahlen">
      <Kpi iconName="shield" label="SUVA · Prio 1" value={zahlen.suvaKritisch || zahlen.suvaOffen} note={zahlen.suvaKritisch ? `${zahlen.suvaKritisch} nicht erfüllt` : `${zahlen.suvaOffen} zu prüfen`} tone="danger" href="#admin-suva" />
      <Kpi iconName="alert" label="Offene Mängel" value={zahlen.maengelOffen} note={`${zahlen.maengelKritisch} Prio 1`} tone="warning" href="#admin-maengel" />
      <Kpi iconName="site" label="Aktive Baustellen" value={sites.length} note={`${zahlen.personen} Personen in Zone`} href="/baustellen" />
      <Kpi iconName="clock" label="Tageschecks" value={zahlen.tageschecks} note="heute noch offen" href="#baustellenstatus" />
    </section>

    <span id="admin-maengel" className="dash-anchor" aria-hidden="true" />
    <section className="dash-panel priority-panel" id="admin-suva">
      <div className="panel-heading"><div><span className="dash-eyebrow danger">Priorität 1 · Handlungsbedarf</span><h2>Hier muss zuerst reagiert werden</h2></div><span className="live-pill"><i /> Live</span></div>
      {handlungsbedarf.length ? <div className="priority-list">{handlungsbedarf.slice(0, 5).map((site) => <article className="priority-row" key={site.baustelle.id}>
        <div className="priority-symbol">{icon(site.suvaKritisch || site.maengelKritisch ? "alert" : "shield")}</div>
        <div className="priority-project"><strong>{site.baustelle.projektname}</strong><span>{site.baustelle.nummer || "Baustelle"} · {site.baustelle.ort || "Ort nicht erfasst"}</span></div>
        <div className="priority-facts">
          {(site.suvaKritisch > 0 || site.suvaOffen > 0) && <span><b>{site.suvaKritisch || site.suvaOffen}</b> SUVA-Punkte {site.suvaKritisch ? "nicht erfüllt" : "offen"}</span>}
          {site.maengelKritisch > 0 && <span className="critical"><b>{site.maengelKritisch}</b> Mängel Prio 1</span>}
        </div>
        <div className="priority-actions"><Link href={`/baustellen/${site.baustelle.id}/suva-audit`}>SUVA prüfen</Link><Link href={`/baustellen/${site.baustelle.id}/maengel`}>Mängel öffnen {icon("arrow")}</Link></div>
      </article>)}</div> : <div className="empty-success">{icon("check")}<div><strong>Keine kritischen Punkte offen</strong><span>In den erfassten Prio-1-Punkten ist kein Handlungsbedarf vermerkt.</span></div></div>}
    </section>

    <div className="admin-lower-grid">
      <section className="dash-panel" id="baustellenstatus"><div className="panel-heading"><div><span className="dash-eyebrow">Betrieb</span><h2>Baustellenstatus</h2></div><Link className="text-link" href="/baustellen">Alle anzeigen →</Link></div>
        <div className="site-table"><div className="site-table-head"><span>Baustelle</span><span>Tagescheck heute</span><span>Team</span><span>Status</span></div>{sites.length ? sites.slice(0, 5).map((site) => <Link href={`/baustellen/${site.baustelle.id}`} className="site-table-row" key={site.baustelle.id}><span><strong>{site.baustelle.projektname}</strong><small>{site.baustelle.nummer || "–"} · {site.baustelle.ort || "–"}</small></span><span className={site.tagescheckOffen ? "status-open" : "status-ok"}>{site.tagescheckOffen ? "Offen" : "Erledigt"}</span><span>{site.personenInZone} in Zone</span><span><i className={site.suvaKritisch || site.maengelKritisch ? "red" : site.suvaOffen || site.tagescheckOffen || site.zonenplanFehlt ? "amber" : "green"} />{site.suvaKritisch || site.maengelKritisch ? "Kritische Punkte" : site.suvaOffen || site.tagescheckOffen || site.zonenplanFehlt ? "Zu prüfen" : "Prüfungen erledigt"}</span></Link>) : <div className="empty-row">Noch keine Baustelle erfasst.</div>}</div>
      </section>
      <aside className="dash-panel team-panel"><div className="panel-heading"><div><span className="dash-eyebrow">Heute draussen</span><h2>Team-Einsatz</h2></div></div><div className="team-big-number">{zahlen.personen}</div><p>Personen aktuell in einer Sanierungszone</p><div className="team-stat"><span>Aktive Mitarbeitende</span><strong>{mitarbeiter}</strong></div><div className="team-stat"><span>Offene Tageschecks</span><strong>{zahlen.tageschecks}</strong></div><Link className="dash-secondary-button" href="/mitarbeiter">Mitarbeiter öffnen</Link></aside>
    </div>
  </div>;
}

function Kpi({ iconName, label, value, note, tone = "normal", href }: { iconName: "shield" | "alert" | "site" | "clock"; label: string; value: number; note: string; tone?: "normal" | "danger" | "warning"; href: string }) {
  return <Link href={href} className={`admin-kpi ${tone}`}><span className="kpi-icon">{icon(iconName)}</span><span className="kpi-copy"><small>{label}</small><strong>{value}</strong><em>{note}</em></span><span className="kpi-arrow">{icon("arrow")}</span></Link>;
}

function VorarbeiterDashboard({ site, hasSites }: { site?: SiteStatus; hasSites: boolean }) {
  if (!site) return <section className="dash-panel empty-project"><span>{icon("site")}</span><h2>{hasSites ? "Welche Baustelle steht heute an?" : "Noch keine aktive Baustelle"}</h2><p>{hasSites ? "Wähle oben deine Baustelle. Danach siehst du die zugehörigen Aufgaben und Unterlagen." : "Öffne die Baustellenübersicht, um eine Baustelle zu erfassen."}</p>{!hasSites && <Link className="dash-primary-button" href="/baustellen">Zu den Baustellen</Link>}</section>;

  const base = `/baustellen/${encodeURIComponent(site.baustelle.id)}`;
  const safetyOpen = site.suvaKritisch > 0 || site.suvaOffen > 0;
  const bereit = !safetyOpen && !site.maengelKritisch && !site.tagescheckOffen && !site.zonenplanFehlt;
  const nextHref = safetyOpen ? `${base}/suva-audit` : site.maengelKritisch ? `${base}/maengel` : site.zonenplanFehlt ? `${base}/zonenplan` : `${base}/tagescheck`;
  const nextLabel = safetyOpen ? "Sicherheitsprüfung öffnen" : site.maengelKritisch ? "Kritische Mängel öffnen" : site.zonenplanFehlt ? "Zonenplan öffnen" : "Tagescheck starten";

  return <div className="dash foreman-dashboard">
    <section className={`release-card ${bereit ? "ready" : "blocked"}`}>
      <div className="release-status"><span className="release-icon">{icon(bereit ? "check" : "alert")}</span><div><span className="dash-eyebrow">Vor Arbeitsbeginn · {site.baustelle.projektname}</span><h2>{bereit ? "Erfasste Prüfungen erledigt" : "Prüfungen noch offen"}</h2><p>{bereit ? "Die erfassten Punkte sind erledigt. Die verantwortliche Person beurteilt die Freigabe vor Ort." : "Prüfe die offenen Punkte für diese Baustelle."}</p></div></div>
      {!bereit && <div className="blocker-list">
        {safetyOpen && <Link href={`${base}/suva-audit`}><span>{icon("shield")}</span><div><strong>Sicherheitsprüfung</strong><small>{site.suvaOffen} zu prüfen · {site.suvaKritisch} nicht erfüllt</small></div><b>Prüfen</b>{icon("arrow")}</Link>}
        {site.maengelKritisch > 0 && <Link href={`${base}/maengel`}><span>{icon("alert")}</span><div><strong>Kritische Mängel</strong><small>{site.maengelKritisch} offene Meldungen</small></div><b>Öffnen</b>{icon("arrow")}</Link>}
        {site.zonenplanFehlt && <Link href={`${base}/zonenplan`}><span>{icon("site")}</span><div><strong>Zonenplan</strong><small>Noch kein Plan im Zonenplan-Editor gespeichert</small></div><b>Öffnen</b>{icon("arrow")}</Link>}
        {site.tagescheckOffen && <Link href={`${base}/tagescheck`}><span>{icon("check")}</span><div><strong>Tagescheck</strong><small>Heutige Kontrolle noch nicht als arbeitsbereit gespeichert</small></div><b>Prüfen</b>{icon("arrow")}</Link>}
      </div>}
      <div className="release-footer"><span>{bereit ? "Zutritte und Austritte im Zonenprotokoll erfassen." : "Diese Übersicht ersetzt keine Freigabe vor Ort und sperrt keine anderen Seiten."}</span><Link className="dash-primary-button" href={bereit ? `${base}/zonenzutritt` : nextHref}>{bereit ? "Zonenprotokoll öffnen" : nextLabel}</Link></div>
    </section>

    <section className="today-section" aria-labelledby="day-workflow"><div className="panel-heading"><h2 id="day-workflow">Schritt für Schritt</h2></div><div className="workflow-grid">
      <WorkflowStep number="1" title="Team prüfen" note="Zugewiesene Mitarbeitende öffnen" href={`${base}/mitarbeiter`} iconName="team" />
      <WorkflowStep number="2" title="Sicherheit prüfen" note={bereit ? "Erfasste Prüfungen erledigt" : "Offene Prüfungen bearbeiten"} done={bereit} href={bereit ? `${base}/tagescheck` : nextHref} iconName="shield" />
      <WorkflowStep number="3" title="Zonenzutritt führen" note={`${site.personenInZone} Personen in Zone`} href={`${base}/zonenzutritt`} iconName="clock" />
      <WorkflowStep number="4" title="Journal führen" note="Arbeiten und Kontrollpunkte erfassen" href={`${base}/journal`} iconName="journal" />
    </div></section>

    <section className="quick-actions" aria-label="Weitere Baustellenaktionen"><Link href={`${base}/maengel`}>{icon("alert")}<span><strong>Mangel melden</strong><small>Offene Punkte festhalten</small></span>{icon("arrow")}</Link><Link href={`${base}/zonenplan`}>{icon("site")}<span><strong>Zonenplan</strong><small>Plan vor Ort öffnen</small></span>{icon("arrow")}</Link><Link href={`${base}/dokumente`}>{icon("journal")}<span><strong>Unterlagen</strong><small>Dokumente dieser Baustelle</small></span>{icon("arrow")}</Link></section>
  </div>;
}

function WorkflowStep({ number, title, note, done, href, iconName }: { number: string; title: string; note: string; done?: boolean; href: string; iconName: "team" | "shield" | "clock" | "journal" }) {
  return <Link href={href} className={`workflow-step ${done ? "done" : ""}`}><span className="step-number">{done ? "✓" : number}</span><span className="step-icon">{icon(iconName)}</span><span><strong>{title}</strong><small>{note}</small></span>{icon("arrow")}</Link>;
}
