"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppShell from "../../components/ui/AppShell";
import { gespeicherteFreigabe, personenInZone as anwesendePersonen, hatZonenplan, type Freigabe, type ZonenBuchung } from "../../lib/workflow";

type Checkliste = {
  code: string;
  name: string;
  status: string;
};

type Baustelle = {
  id: string;
  nummer: string;
  projektname: string;
  ort: string;
  status: string;
  fortschritt: number;
  checklisten: Checkliste[];
};

type Tagesstatus = "offen" | "erledigt" | "kritisch" | "aktiv";

export default function BaustellenDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [freigabe, setFreigabe] = useState<Freigabe>({ bereit: false, kritisch: false, gruende: [] });
  const [baustelle, setBaustelle] = useState<Baustelle | null>(null);
  const [tagescheckStatus, setTagescheckStatus] = useState("offen");
  const [personenInZone, setPersonenInZone] = useState(0);
  const [journalHeute, setJournalHeute] = useState(false);
  const [journalAbgeschlossen, setJournalAbgeschlossen] = useState(false);
  const [anzahlDokumente, setAnzahlDokumente] = useState(0);
  const [anzahlZonenplaene, setAnzahlZonenplaene] = useState(0);
  const [anzahlMitarbeiter, setAnzahlMitarbeiter] = useState(0);
  const [maengel, setMaengel] = useState({ offen: 0, kritisch: 0 });
  const [geraete, setGeraete] = useState({ total: 0, abgelaufen: 0 });
  const [suva, setSuva] = useState({ erfuellt: 0, offen: 53, nichtErfuellt: 0, prio1Offen: 14, prio1Kritisch: 0 });

  useEffect(() => {
    const heute = heuteIso();
    setFreigabe(gespeicherteFreigabe(localStorage, id, heute));
    const baustellen = lesen<Baustelle[]>("baustellen", []);
    setBaustelle(baustellen.find((eintrag) => eintrag.id === id) || null);

    const tagescheck = lesen<Record<string, string> | null>(`tagescheck-${id}-${heute}`, null);
    setTagescheckStatus(tagescheck?.status || "offen");

    const zutritte = lesen<ZonenBuchung[]>(
      `zonenzutritt-${id}-${heute}`,
      []
    );
    setPersonenInZone(anwesendePersonen(zutritte).length);

    const journal = lesen<Record<string, unknown> | null>(`journal-${id}-${heute}`, null);
    setJournalHeute(Boolean(journal));
    setJournalAbgeschlossen(Boolean(journal?.abgeschlossen));

    const dokumente = lesen<Array<{ ordnerId: string }>>(`dokumente-${id}`, []);
    setAnzahlDokumente(dokumente.length);
    setAnzahlZonenplaene(hatZonenplan(lesen(`zonenplan-${id}`, null)) ? 1 : 0);

    setAnzahlMitarbeiter(lesen<string[]>(`baustellen-mitarbeiter-${id}`, []).length);

    const gespeicherteMaengel = lesen<Array<{ status: string; prioritaet: string }>>(`maengel-${id}`, []);
    const offeneMaengel = gespeicherteMaengel.filter((mangel) => mangel.status !== "behoben");
    setMaengel({
      offen: offeneMaengel.length,
      kritisch: offeneMaengel.filter((mangel) => mangel.prioritaet === "kritisch").length,
    });

    const gespeicherteGeraete = lesen<Array<{ naechstePruefung?: string }>>(`geraete-${id}`, []);
    const heuteDatum = new Date(`${heute}T00:00:00`);
    setGeraete({
      total: gespeicherteGeraete.length,
      abgelaufen: gespeicherteGeraete.filter((geraet) => {
        if (!geraet.naechstePruefung) return true;
        return new Date(`${geraet.naechstePruefung}T00:00:00`) < heuteDatum;
      }).length,
    });

    const audit = lesen<Record<number, { status?: string }>>(`suva-audit-${id}`, {});
    const prio1 = new Set([6, 10, 12, 13, 19, 20, 23, 26, 29, 31, 33, 38, 42, 44]);
    let erfuellt = 0;
    let offen = 0;
    let nichtErfuellt = 0;
    let prio1Offen = 0;
    let prio1Kritisch = 0;

    for (let nummer = 1; nummer <= 53; nummer++) {
      const status = audit[nummer]?.status || "offen";
      if (status === "erfuellt") erfuellt++;
      else if (status === "nicht-erfuellt") nichtErfuellt++;
      else offen++;

      if (prio1.has(nummer)) {
        if (status === "nicht-erfuellt") prio1Kritisch++;
        else if (status !== "erfuellt") prio1Offen++;
      }
    }

    setSuva({ erfuellt, offen, nichtErfuellt, prio1Offen, prio1Kritisch });
  }, [id]);

  function linkFuer(code: string) {
    if (code === "AS9") return `/baustellen/${id}/journal`;
    if (code === "AS10") return `/baustellen/${id}/visuelle-kontrolle`;
    return `/baustellen/${id}/checklisten/${code.toLowerCase()}`;
  }

  if (!baustelle) {
    return (
      <AppShell title="Baustelle" backHref="/baustellen" backLabel="Baustellen">
        <section className="bb-card p-8 text-sm font-semibold text-slate-600">Baustelle wird geladen …</section>
      </AppShell>
    );
  }

  const checklisten = baustelle.checklisten || [];
  const abgeschlossen = checklisten.filter((checkliste) => checkliste.status === "Abgeschlossen").length;
  const prozent = checklisten.length ? Math.round((abgeschlossen / checklisten.length) * 100) : 0;
  const tagescheckKritisch = tagescheckStatus === "nicht-arbeitsbereit";
  const tagescheckErledigt = tagescheckStatus === "arbeitsbereit";
  const kritisch = freigabe.kritisch;
  const arbeitsbereit = freigabe.bereit;

  return (
    <AppShell
      title={baustelle.projektname}
      subtitle={`${baustelle.nummer || "Ohne Baustellen-Nr."} · ${baustelle.ort || "Ort offen"}`}
      backHref="/baustellen"
      backLabel="Baustellen"
    >
      <div className="bb-workspace max-w-7xl space-y-5">
        <section className={`overflow-hidden rounded-[26px] border shadow-sm ${
          kritisch ? "border-red-200 bg-red-50" : arbeitsbereit ? "border-green-200 bg-green-50" : "border-[var(--bb-accent-border)] bg-[var(--bb-accent-soft)]"
        }`}>
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex items-start gap-4">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-semibold ${
                kritisch ? "bg-red-100 text-red-700" : arbeitsbereit ? "bg-green-100 text-green-700" : "bg-[var(--bb-accent-soft)] text-[var(--bb-accent-ink)]"
              }`}>
                {kritisch ? "!" : arbeitsbereit ? "✓" : "1"}
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Heute auf der Baustelle</div>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                  {kritisch ? "Arbeit noch nicht freigegeben" : arbeitsbereit ? "Baustelle ist arbeitsbereit" : "Freigabe noch offen"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {kritisch
                    ? freigabe.gruende.map((grund) => grund.text).join(" · ")
                    : arbeitsbereit
                    ? `${personenInZone} ${personenInZone === 1 ? "Person ist" : "Personen sind"} aktuell in der Zone.`
                    : freigabe.gruende.map((grund) => grund.text).join(" · ")}
                </p>
              </div>
            </div>

            <a
              href={`/baustellen/${id}/${arbeitsbereit ? "zonenzutritt" : freigabe.gruende[0]?.pfad || "tagescheck"}`}
              className="bb-primary-button bb-button-link justify-center px-6 py-3.5"
            >
              {arbeitsbereit ? "Zonenzutritt öffnen" : "Offenen Punkt prüfen"} →
            </a>
          </div>
        </section>

        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bb-accent-ink)]">Einfacher Tagesablauf</div>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">Was ist als Nächstes zu tun?</h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <TagesSchritt
              nummer="1"
              titel="Tagescheck"
              beschreibung="Vor Arbeitsbeginn"
              href={`/baustellen/${id}/tagescheck`}
              status={tagescheckKritisch ? "kritisch" : tagescheckErledigt ? "erledigt" : "offen"}
              statusText={tagescheckKritisch ? "Kritisch" : tagescheckErledigt ? "Erledigt" : "Jetzt starten"}
            />
            <TagesSchritt
              nummer="2"
              titel="Zonenzutritt"
              beschreibung="Ein- und Austritt"
              href={`/baustellen/${id}/zonenzutritt`}
              status={personenInZone > 0 ? "aktiv" : "offen"}
              statusText={personenInZone > 0 ? `${personenInZone} in Zone` : "Öffnen"}
            />
            <TagesSchritt
              nummer="3"
              titel="Journal führen"
              beschreibung="Arbeit und Stunden"
              href={`/baustellen/${id}/journal`}
              status={journalHeute ? "erledigt" : "offen"}
              statusText={journalHeute ? "Entwurf vorhanden" : "Erfassen"}
            />
            <TagesSchritt
              nummer="4"
              titel="Tag abschliessen"
              beschreibung="Kontrolle und Ablage"
              href={`/baustellen/${id}/journal`}
              status={journalAbgeschlossen ? "erledigt" : "offen"}
              statusText={journalAbgeschlossen ? "Abgeschlossen" : "Noch offen"}
            />
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Schnellzugriff</div>
                <h2 className="mt-1 text-xl font-semibold">Häufig gebraucht</h2>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <SchnellLink href={`/baustellen/${id}/maengel`} icon="!" titel="Mangel melden" text={maengel.offen ? `${maengel.offen} Mängel offen` : "Foto und Massnahme erfassen"} warnung={maengel.kritisch > 0} />
              <SchnellLink href={`/baustellen/${id}/zonenplan`} icon="⌑" titel="Zonenplan ansehen" text={anzahlZonenplaene ? "Plan ist abgelegt" : "Plan fehlt noch"} warnung={!anzahlZonenplaene} />
              <SchnellLink href={`/baustellen/${id}/geraete`} icon="◫" titel="Geräte" text={geraete.total ? `${geraete.total} Geräte zugewiesen` : "Keine Geräte zugewiesen"} warnung={geraete.abgelaufen > 0} />
              <SchnellLink href={`/baustellen/${id}/mitarbeiter`} icon="♙" titel="Team" text={anzahlMitarbeiter ? `${anzahlMitarbeiter} Mitarbeitende` : "Team noch nicht zugewiesen"} warnung={!anzahlMitarbeiter} />
            </div>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Übersicht heute</div>
            <div className="mt-5 space-y-4">
              <Kennzahl label="Personen in der Zone" wert={String(personenInZone)} farbe={personenInZone ? "gruen" : "normal"} />
              <Kennzahl label="Offene Mängel" wert={String(maengel.offen)} farbe={maengel.kritisch ? "rot" : maengel.offen ? "orange" : "gruen"} />
              <Kennzahl label="Dokumente abgelegt" wert={String(anzahlDokumente)} farbe="normal" />
              <Kennzahl label="Journal" wert={journalAbgeschlossen ? "Fertig" : journalHeute ? "Entwurf" : "Offen"} farbe={journalAbgeschlossen ? "gruen" : "orange"} />
            </div>
          </section>
        </div>

        <details className="group overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-5 p-5 sm:p-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Administration</div>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">Unterlagen, SUVA und Gesamtprozess</h2>
              <p className="mt-1 text-sm text-slate-500">Nur öffnen, wenn Nachweise oder Projektunterlagen benötigt werden.</p>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl font-semibold transition group-open:rotate-45">+</span>
          </summary>

          <div className="border-t border-slate-200 p-5 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <VerwaltungsLink href={`/baustellen/${id}/suva-audit`} titel="SUVA Audit" text={`${suva.prio1Offen} Prio-1-Punkte offen`} />
              <VerwaltungsLink href={`/baustellen/${id}/dokumente`} titel="Baustellenordner" text={`${anzahlDokumente} Dokumente`} />
              <VerwaltungsLink href={`/baustellen/${id}/sanierungsplan`} titel="Sanierungsplan" text="Planung und Luftbilanz" />
              <VerwaltungsLink href={`/baustellen/${id}/visuelle-kontrolle`} titel="Visuelle Kontrolle" text="Abnahme und Nachkontrolle" />
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold">Gesamtprozess</h3>
                <p className="mt-1 text-sm text-slate-500">{abgeschlossen} von {checklisten.length} Prozessschritten abgeschlossen</p>
              </div>
              <strong className="text-2xl text-[var(--bb-accent-ink)]">{prozent}%</strong>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-[var(--bb-accent)]" style={{ width: `${prozent}%` }} />
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {checklisten.map((checkliste, index) => {
                const fertig = checkliste.status === "Abgeschlossen";
                return (
                  <a key={checkliste.code} href={linkFuer(checkliste.code)} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-[var(--bb-accent)]">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-semibold ${fertig ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                        {fertig ? "✓" : index + 1}
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-slate-500">{checkliste.code}</div>
                        <div className="text-sm font-bold text-slate-800">{checkliste.name}</div>
                      </div>
                    </div>
                    <span className="text-[var(--bb-accent-ink)]">→</span>
                  </a>
                );
              })}
            </div>
          </div>
        </details>
      </div>
    </AppShell>
  );
}

function TagesSchritt({ nummer, titel, beschreibung, href, status, statusText }: { nummer: string; titel: string; beschreibung: string; href: string; status: Tagesstatus; statusText: string }) {
  const farben: Record<Tagesstatus, string> = {
    offen: "border-slate-200 bg-white",
    erledigt: "border-green-200 bg-green-50",
    kritisch: "border-red-200 bg-red-50",
    aktiv: "border-blue-200 bg-blue-50",
  };
  const statusFarben: Record<Tagesstatus, string> = {
    offen: "text-[var(--bb-accent-ink)]",
    erledigt: "text-green-700",
    kritisch: "text-red-700",
    aktiv: "text-blue-700",
  };

  return (
    <a href={href} className={`group rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md ${farben[status]}`}>
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bb-accent-soft)] font-semibold text-[var(--bb-accent-ink)]">{status === "erledigt" ? "✓" : nummer}</span>
        <span className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-[var(--bb-accent-ink)]">→</span>
      </div>
      <h3 className="mt-5 font-semibold text-slate-900">{titel}</h3>
      <p className="mt-1 text-sm text-slate-500">{beschreibung}</p>
      <div className={`mt-4 text-xs font-semibold ${statusFarben[status]}`}>{statusText}</div>
    </a>
  );
}

function SchnellLink({ href, icon, titel, text, warnung }: { href: string; icon: string; titel: string; text: string; warnung?: boolean }) {
  return (
    <a href={href} className={`flex items-center gap-4 rounded-2xl border p-4 transition hover:border-[var(--bb-accent)] ${warnung ? "border-[var(--bb-accent-border)] bg-[var(--bb-accent-soft)]" : "border-slate-200"}`}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg font-semibold text-[var(--bb-accent-ink)]">{icon}</span>
      <div>
        <div className="font-semibold text-slate-900">{titel}</div>
        <div className="mt-0.5 text-xs text-slate-500">{text}</div>
      </div>
    </a>
  );
}

function Kennzahl({ label, wert, farbe }: { label: string; wert: string; farbe: "normal" | "gruen" | "orange" | "rot" }) {
  const farben = { normal: "text-slate-900", gruen: "text-green-700", orange: "text-[var(--bb-accent-ink)]", rot: "text-red-700" };
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
      <span className="text-sm text-slate-500">{label}</span>
      <strong className={farben[farbe]}>{wert}</strong>
    </div>
  );
}

function VerwaltungsLink({ href, titel, text }: { href: string; titel: string; text: string }) {
  return (
    <a href={href} className="rounded-2xl border border-slate-200 p-4 transition hover:border-[var(--bb-accent)] hover:bg-[var(--bb-accent-soft)]">
      <div className="font-semibold text-slate-900">{titel}</div>
      <div className="mt-1 text-xs text-slate-500">{text}</div>
    </a>
  );
}

function lesen<T>(key: string, fallback: T): T {
  try {
    const wert = localStorage.getItem(key);
    return wert ? (JSON.parse(wert) as T) : fallback;
  } catch {
    return fallback;
  }
}

function heuteIso() {
  const heute = new Date();
  const offset = heute.getTimezoneOffset();
  return new Date(heute.getTime() - offset * 60_000).toISOString().slice(0, 10);
}
