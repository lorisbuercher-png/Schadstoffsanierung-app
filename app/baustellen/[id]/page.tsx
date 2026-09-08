"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppShell, { type AppRole } from "../../components/ui/AppShell";
import { readSiteSummary } from "./siteSummary";
import "./detail.css";

type Summary = ReturnType<typeof readSiteSummary>;

export default function BaustellenDetail() {
  const { id } = useParams<{ id: string }>();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [role, setRole] = useState<AppRole>("admin");
  const [loadedId, setLoadedId] = useState("");

  useEffect(() => {
    function refresh() {
      setSummary(readSiteSummary(localStorage, id));
      setLoadedId(id);
      try { setRole(localStorage.getItem("bb-role") === "vorarbeiter" ? "vorarbeiter" : "admin"); } catch {}
    }
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener("focus", refresh); window.removeEventListener("storage", refresh); };
  }, [id]);

  if (!summary || loadedId !== id) return <AppShell title="Baustelle" backHref="/baustellen"><p role="status">Baustelle wird geladen …</p></AppShell>;
  const site = summary.site;
  if (!site) return <AppShell title="Baustelle nicht verfügbar" backHref="/baustellen"><section className="bd-empty"><h2>Baustelle konnte nicht geöffnet werden</h2><p>{summary.errors.length ? "Die gespeicherten Daten konnten nicht gelesen werden." : "Diese Baustelle ist in diesem Browser nicht gespeichert."}</p><Link className="bb-primary-button bb-button-link" href="/baustellen">Baustellenübersicht öffnen</Link></section></AppShell>;

  const base = `/baustellen/${encodeURIComponent(id)}`;
  const archived = site.status.trim().toLowerCase() === "abgeschlossen";
  const critical = summary.priorityFailed > 0 || summary.criticalIssues > 0 || summary.dailyStatus === "nicht-arbeitsbereit";
  const checksOpen = summary.priorityOpen > 0 || summary.dailyStatus !== "arbeitsbereit" || !summary.planInEditor;
  const tone = summary.errors.length || critical ? "critical" : checksOpen ? "pending" : "complete";
  const nextStep = summary.priorityFailed || summary.priorityOpen ? { href: "suva-audit", label: "Sicherheitsprüfung öffnen" }
    : summary.criticalIssues ? { href: "maengel", label: "Kritische Mängel öffnen" }
    : !summary.planInEditor ? { href: "zonenplan", label: "Zonenplan öffnen" }
    : summary.dailyStatus !== "arbeitsbereit" ? { href: "tagescheck", label: "Tagescheck öffnen" }
    : { href: "journal", label: "Journal öffnen" };
  const completed = site.checklisten.filter((c) => c.status === "Abgeschlossen").length;

  function checklistHref(code: string) {
    const normalized = code.toUpperCase();
    if (normalized === "AS9") return `${base}/journal`;
    if (normalized === "AS10") return `${base}/visuelle-kontrolle`;
    return `${base}/checklisten/${encodeURIComponent(code.toLowerCase())}`;
  }

  return <AppShell role={role} onRoleChange={setRole} title={site.projektname}
    subtitle={[site.nummer || "Ohne Baustellen-Nr.", site.ort || "Ort nicht erfasst", site.status].filter(Boolean).join(" · ")}
    backHref="/baustellen" backLabel="Alle Baustellen"
    action={<Link className="bb-secondary-button bb-button-link" href={`${base}/zonenplan`}>Zonenplan öffnen</Link>}>
    <div className="bd-workspace">
      {archived && <p className="bd-notice">Diese Baustelle ist abgeschlossen. Die gespeicherten Unterlagen bleiben erreichbar.</p>}
      {summary.errors.length > 0 && <p className="bd-notice bd-error" role="alert">Einige gespeicherte Daten konnten nicht gelesen werden. Die Übersicht ist unvollständig; kontrolliere die betroffenen Unterlagen. Es wurden keine Daten verändert.</p>}

      <section className={`bd-status ${tone}`} aria-labelledby="site-status">
        <div><span className="bd-eyebrow">Erfasster Prüfstand</span><h2 id="site-status">{summary.errors.length ? "Daten unvollständig" : critical ? "Kritische Punkte bearbeiten" : checksOpen ? "Prüfungen noch offen" : "Erfasste Prüfungen erledigt"}</h2>
          <p>{summary.priorityOpen} Prio-1-Punkte zu prüfen · {summary.priorityFailed} nicht erfüllt · {summary.criticalIssues} kritische Mängel</p>
          <small>Keine automatische Arbeitsfreigabe. Die verantwortliche Person beurteilt die Situation vor Ort.</small>
        </div>
        <Link className="bb-primary-button bb-button-link" href={`${base}/${nextStep.href}`}>{nextStep.label}</Link>
      </section>

      <section aria-labelledby="daily-work">
        <div className="bd-section-heading"><h2 id="daily-work">{archived ? "Arbeitsunterlagen" : "Heute auf der Baustelle"}</h2><span>{summary.team} im Team · {summary.peopleInZone} in Zone</span></div>
        <div className="bd-daily-grid">
          <Task number="01" title="Team prüfen" note={`${summary.team} Mitarbeitende zugewiesen`} href={`${base}/mitarbeiter`} />
          <Task number="02" title="Tagescheck" note={summary.dailyStatus === "arbeitsbereit" ? "Heute als arbeitsbereit gespeichert" : summary.dailyStatus === "nicht-arbeitsbereit" ? "Heute als nicht arbeitsbereit gespeichert" : "Heutige Kontrolle noch offen"} href={`${base}/tagescheck`} />
          <Task number="03" title="Zonenzutritt" note={`${summary.peopleInZone} Personen in Zone · Ein- und Austritte`} href={`${base}/zonenzutritt`} />
          <Task number="04" title="Journal führen" note={summary.journalToday ? "Eintrag mit heutigem Datum gespeichert" : "Arbeiten und Kontrollen festhalten"} href={`${base}/journal`} />
        </div>
      </section>

      <section className="bd-resources" aria-labelledby="site-resources">
        <div className="bd-section-heading"><h2 id="site-resources">Für die Arbeit vor Ort</h2></div>
        <div className="bd-resource-grid">
          <Resource title="Mängel" note={`${summary.issues} offen · ${summary.criticalIssues} kritisch`} href={`${base}/maengel`} urgent={summary.criticalIssues > 0} />
          <Resource title="Pläne" note={summary.planInEditor ? "Zonenplan im Editor gespeichert" : summary.planDocuments ? `${summary.planDocuments} Plandokumente in den Unterlagen` : "Noch kein Zonenplan gespeichert"}>
            <Link href={`${base}/zonenplan`}>Zonenplan</Link><Link href={`${base}/sanierungsplan`}>Sanierungsplan</Link>
          </Resource>
          <Resource title="Geräte" note={`${summary.devices} erfasst · ${summary.deviceOverdue} Prüfungen abgelaufen · ${summary.deviceSoon} bald fällig · ${summary.deviceUnknown} ohne gültiges Prüfdatum`} href={`${base}/geraete`} urgent={summary.deviceOverdue > 0 || summary.deviceUnknown > 0} />
          <Resource title="Visuelle Kontrolle" note={summary.controlNote} href={`${base}/visuelle-kontrolle`} />
        </div>
      </section>

      <details key={role} className="bd-records" open={role === "admin"}>
        <summary><span><strong>Unterlagen &amp; Sicherheitsdokumentation</strong><span>{summary.documents} Dokumente · {completed} von {site.checklisten.length} Checklisten abgeschlossen</span></span><span aria-hidden="true" className="bd-expand">+</span></summary>
        <div className="bd-records-body">
          <div className="bd-record-links"><Link className="bb-secondary-button bb-button-link" href={`${base}/dokumente`}>Baustellenordner öffnen</Link><Link className="bb-secondary-button bb-button-link" href={`${base}/suva-audit`}>Vollständige Sicherheitsprüfung</Link></div>
          <p className="bd-audit-summary">Sicherheitsprüfung: {summary.fulfilled} erfüllt · {summary.open} offen · {summary.failed} nicht erfüllt · {summary.notApplicable} nicht anwendbar</p>
          <ul className="bd-checklists">{site.checklisten.map((checklist, index) => <li key={`${checklist.code}-${index}`}><Link href={checklistHref(checklist.code)}><span><strong>{checklist.name || "Checkliste"}</strong>{role === "admin" && <small>{checklist.code}</small>}</span><span className={`bd-badge ${checklist.status === "Abgeschlossen" ? "complete" : ""}`}>{checklist.status || "Offen"}</span><span aria-hidden="true">→</span></Link></li>)}</ul>
          {!site.checklisten.length && <p>Noch keine Checklisten hinterlegt. Die vorhandenen Dokumente findest du im Baustellenordner.</p>}
        </div>
      </details>
    </div>
  </AppShell>;
}

function Task({ number, title, note, href }: { number: string; title: string; note: string; href: string }) {
  return <Link className="bd-task" href={href}><span className="bd-task-number">{number}</span><h3>{title}</h3><p>{note}</p><span className="bd-task-action">Öffnen <span aria-hidden="true">→</span></span></Link>;
}

function Resource({ title, note, href, urgent, children }: { title: string; note: string; href?: string; urgent?: boolean; children?: React.ReactNode }) {
  return <article className={`bd-resource ${urgent ? "urgent" : ""}`}><h3>{title}</h3><p>{note}</p><div className="bd-resource-links">{href ? <Link href={href}>{title} öffnen <span aria-hidden="true">→</span></Link> : children}</div></article>;
}
