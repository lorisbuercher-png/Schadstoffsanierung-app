"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import FileUpload, { DateiEintrag } from "../../../components/FileUpload";
import { entwurfLesen, entwurfSichern } from "../../../lib/journalRecovery";
import { gueltigesDatum } from "../../../lib/documents";
import { stundenBerechnen, zeitFehler, journalAblegen } from "../../../lib/journal";
import { personenInZone } from "../../../lib/workflow";
import AppShell from "../../../components/ui/AppShell";

type Arbeitszeit = {
  id: string;
  mitarbeiterId: string;
  name: string;
  arbeitsbeginn: string;
  arbeitsende: string;
  pause: string;
};

type Baustelle = {
  id: string;
  nummer: string;
  projektname: string;
  ort: string;
};

type Mitarbeiter = {
  id: string;
  vorname: string;
  nachname: string;
  funktion: string;
  aktiv: boolean;
};

type Dokument = {
  id: string;
  name: string;
  ordnerId: string;
  datum: string;
  groesse?: string;
  typ?: string;
};

const kontrollpunkte = [
  "Spezialist ist während der Arbeiten vor Ort",
  "Team ist instruiert und trägt die vorgeschriebene PSA",
  "Sanierungszone und Abschottungen sind intakt",
  "Unterdruck und Alarm funktionieren",
  "Vorgeschriebener Luftwechsel ist sichergestellt",
  "Abluft wird korrekt ins Freie geführt",
  "Personen- und Materialschleuse funktionieren",
  "Dusche und Warmwasser sind betriebsbereit",
  "Abfälle sind korrekt verpackt und beschriftet",
];

function heuteIso() {
  const heute = new Date();
  const offset = heute.getTimezoneOffset();
  return new Date(heute.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function leereArbeitszeit(mitarbeiter?: Mitarbeiter): Arbeitszeit {
  return {
    id: crypto.randomUUID(),
    mitarbeiterId: mitarbeiter?.id || "",
    name: mitarbeiter ? `${mitarbeiter.vorname} ${mitarbeiter.nachname}` : "",
    arbeitsbeginn: "07:00",
    arbeitsende: "17:00",
    pause: "60",
  };
}

export default function Journal() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const searchParams = useSearchParams();
  const gewaehltesDatum = searchParams.get("datum");

  const [baustelle, setBaustelle] = useState<Baustelle | null>(null);
  const [team, setTeam] = useState<Mitarbeiter[]>([]);
  const [datum, setDatum] = useState(() => gueltigesDatum(gewaehltesDatum) ? gewaehltesDatum : heuteIso());
  const [zone, setZone] = useState("");
  const [vorarbeiter, setVorarbeiter] = useState("");
  const [arbeit, setArbeit] = useState("");
  const [besonderheiten, setBesonderheiten] = useState("");
  const [arbeitszeiten, setArbeitszeiten] = useState<Arbeitszeit[]>([]);
  const [kontrolle, setKontrolle] = useState<Record<number, boolean>>({});
  const [anhaenge, setAnhaenge] = useState<DateiEintrag[]>([]);
  const [abgeschlossen, setAbgeschlossen] = useState(false);
  const [meldung, setMeldung] = useState("");
  const [geaendert, setGeaendert] = useState(false);
  const [geladenKey, setGeladenKey] = useState("");
  const [basis, setBasis] = useState<string | null>(null);
  const [ladeFehler, setLadeFehler] = useState(false);
  const [entwurfStatus, setEntwurfStatus] = useState("");

  useEffect(() => {
    if (gueltigesDatum(gewaehltesDatum)) setDatum(gewaehltesDatum);
  }, [gewaehltesDatum]);

  useEffect(() => {
    const alle = JSON.parse(localStorage.getItem("baustellen") || "[]") as Baustelle[];
    setBaustelle(alle.find((eintrag) => eintrag.id === id) || null);

    const alleMitarbeiter = JSON.parse(
      localStorage.getItem("mitarbeiter") || "[]"
    ) as Mitarbeiter[];
    const teamIds = JSON.parse(
      localStorage.getItem(`baustellen-mitarbeiter-${id}`) || "[]"
    ) as string[];
    setTeam(alleMitarbeiter.filter((m) => teamIds.includes(m.id)));
  }, [id]);

  useEffect(() => {
    if (!datum) return;

    setMeldung("");
    setEntwurfStatus("");
    setLadeFehler(false);
    setGeaendert(false);
    const key = `journal-${id}-${datum}`;

    try {
      const raw = localStorage.getItem(key);
      setBasis(raw);
      setGeladenKey(key);
      const gespeichert = JSON.parse(raw || "null");
      const entwurf = entwurfLesen(localStorage, key);
      const alt = datum === heuteIso()
        ? JSON.parse(localStorage.getItem(`journal-${id}`) || "null")
        : null;
      const daten = entwurf || gespeichert || (alt?.datum === datum ? alt : null);
      if (entwurf) {
        setGeaendert(true);
        setMeldung("Deine letzten Eingaben wurden wiederhergestellt. Bitte prüfen und speichern oder den Tag abschliessen.");
      }

      if (daten) {
        if (typeof daten !== "object" || Array.isArray(daten) ||
            (daten.arbeitszeiten !== undefined && !Array.isArray(daten.arbeitszeiten)) ||
            (daten.eintraege !== undefined && !Array.isArray(daten.eintraege)) ||
            (daten.anhaenge !== undefined && !Array.isArray(daten.anhaenge))) {
          throw new Error("Ungültiges Journal");
        }
        setZone(daten.zone || "");
        setVorarbeiter(daten.vorarbeiter || "");
        setArbeit(daten.arbeit || "");
        setBesonderheiten(daten.besonderheiten || "");
        setArbeitszeiten(daten.arbeitszeiten || daten.eintraege || []);
        setKontrolle(daten.kontrolle || {});
        setAnhaenge(daten.anhaenge || []);
        setAbgeschlossen(Boolean(daten.abgeschlossen));
        return;
      }
    } catch {
      setLadeFehler(true);
      setMeldung("Bitte die Seite erneut öffnen: Das Journal konnte nicht gelesen werden. Speichern ist zum Schutz der bestehenden Daten gesperrt.");
      return;
    }

    setZone("");
    setVorarbeiter("");
    setArbeit("");
    setBesonderheiten("");
    setArbeitszeiten(team.map((m) => leereArbeitszeit(m)));
    setKontrolle({});
    setAnhaenge([]);
    setAbgeschlossen(false);
  }, [datum, id, team]);

  useEffect(() => {
    if (!geaendert || ladeFehler || geladenKey !== `journal-${id}-${datum}`) return;
    try {
      entwurfSichern(localStorage, geladenKey, basis, {
        datum, zone, vorarbeiter, arbeit, besonderheiten, arbeitszeiten,
        kontrolle, anhaenge, abgeschlossen,
      });
      setEntwurfStatus("Eingaben auf diesem Gerät zwischengespeichert · Tagesabschluss noch nicht bestätigt.");
    } catch {
      setEntwurfStatus("Zwischenspeichern fehlgeschlagen. Bitte die Seite geöffnet lassen und manuell speichern; gegebenenfalls Anhänge verkleinern.");
    }
  }, [geaendert, ladeFehler, geladenKey, id, datum, basis, zone, vorarbeiter, arbeit, besonderheiten, arbeitszeiten, kontrolle, anhaenge, abgeschlossen]);

  useEffect(() => {
    if (!geaendert) return;
    function vorVerlassen(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    function linkVerlassen(event: MouseEvent) {
      if (!entwurfStatus.startsWith("Zwischenspeichern fehlgeschlagen")) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!link) return;
      event.preventDefault();
      event.stopPropagation();
      setMeldung("Bitte vor dem Verlassen speichern. Deine Eingaben konnten nicht zwischengespeichert werden.");
    }
    window.addEventListener("beforeunload", vorVerlassen);
    document.addEventListener("click", linkVerlassen, true);
    return () => {
      window.removeEventListener("beforeunload", vorVerlassen);
      document.removeEventListener("click", linkVerlassen, true);
    };
  }, [geaendert, entwurfStatus]);

  function datumWechseln(wert: string) {
    if (!gueltigesDatum(wert)) return;
    if (geaendert && entwurfStatus.startsWith("Zwischenspeichern fehlgeschlagen")) {
      setMeldung("Bitte vor dem Datumswechsel speichern. Deine Eingaben konnten nicht zwischengespeichert werden.");
      return;
    }
    setDatum(wert);
  }

  const kontrollenErledigt = kontrollpunkte.filter((_, index) => kontrolle[index]).length;
  const totalStunden = useMemo(
    () => arbeitszeiten.reduce((summe, eintrag) => summe + stundenBerechnen(eintrag), 0),
    [arbeitszeiten]
  );

  function mitarbeiterHinzufuegen() {
    setGeaendert(true);
    setArbeitszeiten((aktuell) => [...aktuell, leereArbeitszeit()]);
  }

  function updateArbeitszeit(eintragId: string, feld: keyof Arbeitszeit, wert: string) {
    setArbeitszeiten((aktuell) =>
      aktuell.map((eintrag) => {
        if (eintrag.id !== eintragId) return eintrag;

        if (feld === "mitarbeiterId") {
          const mitarbeiter = team.find((m) => m.id === wert);
          return {
            ...eintrag,
            mitarbeiterId: wert,
            name: mitarbeiter ? `${mitarbeiter.vorname} ${mitarbeiter.nachname}` : "",
          };
        }

        return { ...eintrag, [feld]: wert };
      })
    );
  }

  function datenSpeichern(istAbgeschlossen: boolean) {
    if (ladeFehler || geladenKey !== `journal-${id}-${datum}`) return;
    if (!datum) {
      setMeldung("Bitte ein Datum auswählen.");
      return;
    }
    const daten = {
      datum,
      zone,
      vorarbeiter,
      arbeit,
      besonderheiten,
      arbeitszeiten,
      kontrolle,
      anhaenge,
      abgeschlossen: istAbgeschlossen,
      aktualisiertAm: new Date().toISOString(),
    };

    try {
      journalAblegen(localStorage, `journal-${id}-${datum}`, daten, () => dokumenteAktualisieren(istAbgeschlossen));
    } catch {
      setMeldung("Bitte erneut speichern: Journal und Ablage konnten nicht vollständig gespeichert werden. Deine Eingaben bleiben hier erhalten. Bei vollem Speicher Anhänge verkleinern.");
      return;
    }
    setGeaendert(false);
    setEntwurfStatus("");
    setBasis(JSON.stringify(daten));
    try { localStorage.removeItem(`entwurf-journal-${id}-${datum}`); } catch { /* Obsolete drafts are ignored when their base differs. */ }
    setAbgeschlossen(istAbgeschlossen);
    setMeldung(istAbgeschlossen ? "Arbeitstag abgeschlossen und abgelegt." : "Entwurf gespeichert.");
  }

  function dokumenteAktualisieren(istAbgeschlossen: boolean) {
    const key = `dokumente-${id}`;
    let dokumente: Dokument[] = [];

    try {
      const gespeichert = JSON.parse(localStorage.getItem(key) || "[]");
      if (!Array.isArray(gespeichert)) throw new Error("Ungültige Dokumentablage");
      dokumente = gespeichert;
    } catch { throw new Error("Dokumentablage konnte nicht gelesen werden"); }

    const journalId = `journal-${id}-${datum}`;
    const neueDokumente: Dokument[] = [
      {
        id: journalId,
        name: `Baustellenjournal_${datum}${istAbgeschlossen ? "_abgeschlossen" : "_Entwurf"}`,
        ordnerId: "journal",
        datum: new Date(`${datum}T12:00:00`).toLocaleDateString("de-CH"),
        typ: "Baustellenjournal",
      },
      ...anhaenge.map((datei) => ({
        id: `${journalId}-${datei.id}`,
        name: datei.name,
        ordnerId: "journal",
        datum: new Date(`${datum}T12:00:00`).toLocaleDateString("de-CH"),
        groesse: groesseFormatieren(datei.size),
        typ: datei.type,
      })),
    ];

    localStorage.setItem(
      key,
      JSON.stringify([
        ...neueDokumente,
        ...dokumente.filter((dokument) => !dokument.id.startsWith(journalId)),
      ])
    );
  }

  function tagAbschliessen() {
    const fehlerhafterEintrag = arbeitszeiten.find((eintrag) => zeitFehler(eintrag));

    if (!datum || !vorarbeiter.trim() || !arbeit.trim()) {
      setMeldung("Bitte Datum, Vorarbeiter und ausgeführte Arbeiten ausfüllen.");
      return;
    }

    if (!arbeitszeiten.length || fehlerhafterEintrag) {
      setMeldung(fehlerhafterEintrag ? `${zeitFehler(fehlerhafterEintrag)} (${fehlerhafterEintrag.name || "Mitarbeiter ohne Name"})` : "Bitte die Arbeitszeiten aller Mitarbeitenden vollständig erfassen.");
      return;
    }

    if (kontrollenErledigt !== kontrollpunkte.length) {
      setMeldung("Bitte vor dem Abschluss alle Sicherheitskontrollen bestätigen.");
      return;
    }

    try {
      const buchungen = JSON.parse(localStorage.getItem(`zonenzutritt-${id}-${datum}`) || "[]");
      if (!Array.isArray(buchungen)) throw new Error("Ungültige Buchungen");
      if (personenInZone(buchungen).length) {
        setMeldung("Bitte zuerst alle Mitarbeitenden aus der Zone auschecken. Danach kannst du den Tag abschliessen.");
        return;
      }
    } catch {
      setMeldung("Bitte die Zonenbuchungen prüfen: Der Anwesenheitsstatus konnte nicht gelesen werden.");
      return;
    }
    datenSpeichern(true);
  }

  if (!baustelle) {
    return (
      <AppShell title="Tagesjournal" backHref={`/baustellen/${id}`} backLabel="Zur Baustelle">
        <section className="bb-card p-8 text-sm font-semibold text-slate-600">
          Baustelle wird geladen …
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Tagesjournal"
      subtitle="Ein Arbeitstag – alle Angaben – automatische Ablage."
      backHref={`/baustellen/${id}`}
      backLabel="Zur Baustelle"
    >
      <div className="bb-workspace max-w-6xl space-y-5 pb-28" onChangeCapture={(event) => {
        if (!(event.target instanceof HTMLInputElement && event.target.type === "date")) setGeaendert(true);
      }}>
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bb-accent-ink)]">
                {baustelle.nummer} · {baustelle.ort}
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">{baustelle.projektname}</h2>
              <p className="mt-1 text-sm text-slate-500">
                Das ausgefüllte Journal und alle Anhänge landen automatisch im Baustellenordner.
              </p>
            </div>
            <div className={`rounded-2xl px-5 py-3 text-sm font-bold ${
              abgeschlossen ? "bg-green-50 text-green-700" : "bg-[var(--bb-accent-soft)] text-[var(--bb-accent-ink)]"
            }`}>
              {geaendert ? "Änderungen noch offen" : abgeschlossen ? "✓ Tag abgeschlossen" : "Journal offen"}
            </div>
          </div>
        </section>

        <Schritt nummer="1" titel="Tag und Arbeiten" untertitel="Was wurde heute auf der Baustelle erledigt?">
          <div className="grid gap-4 md:grid-cols-3">
            <Feld label="Datum" type="date" value={datum} onChange={datumWechseln} />
            <Feld label="Zone / Etappe" value={zone} onChange={setZone} placeholder="z. B. Zone 1" />
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Vorarbeiter *</label>
              <select
                value={vorarbeiter}
                onChange={(event) => setVorarbeiter(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-[var(--bb-accent)]"
              >
                <option value="">Auswählen</option>
                {team.map((m) => (
                  <option key={m.id} value={`${m.vorname} ${m.nachname}`}>
                    {m.vorname} {m.nachname} · {m.funktion}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Textfeld
              label="Ausgeführte Arbeiten *"
              value={arbeit}
              onChange={setArbeit}
              placeholder="Arbeiten kurz und verständlich beschreiben …"
            />
            <Textfeld
              label="Besonderheiten, Lieferungen oder Mängel"
              value={besonderheiten}
              onChange={setBesonderheiten}
              placeholder="Nur ausfüllen, wenn etwas Besonderes passiert ist …"
            />
          </div>
        </Schritt>

        <Schritt
          nummer="2"
          titel="Team und Stunden"
          untertitel={`${arbeitszeiten.length} Mitarbeitende · ${totalStunden.toFixed(1)} Stunden total`}
          action={
            <button type="button" onClick={mitarbeiterHinzufuegen} className="bb-secondary-button">
              + Mitarbeiter
            </button>
          }
        >
          {arbeitszeiten.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">
              Noch keine Mitarbeitenden zugewiesen. Über «+ Mitarbeiter» kann ein Eintrag ergänzt werden.
            </div>
          ) : (
            <div className="space-y-3">
              {arbeitszeiten.map((eintrag) => (
                <div key={eintrag.id} className="grid gap-3 rounded-2xl border border-slate-200 p-4 lg:grid-cols-[1.5fr_1fr_1fr_0.8fr_0.7fr_auto] lg:items-end">
                  <div>
                    <label className="mb-2 block text-xs font-bold text-slate-500">Mitarbeiter</label>
                    {team.length ? (
                      <select
                        value={eintrag.mitarbeiterId}
                        onChange={(event) => updateArbeitszeit(eintrag.id, "mitarbeiterId", event.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
                      >
                        <option value="">Auswählen</option>
                        {team.map((m) => (
                          <option key={m.id} value={m.id}>{m.vorname} {m.nachname}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={eintrag.name}
                        onChange={(event) => updateArbeitszeit(eintrag.id, "name", event.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                        placeholder="Name"
                      />
                    )}
                  </div>
                  <MiniFeld label="Beginn" type="time" value={eintrag.arbeitsbeginn} onChange={(wert) => updateArbeitszeit(eintrag.id, "arbeitsbeginn", wert)} />
                  <MiniFeld label="Ende" type="time" value={eintrag.arbeitsende} onChange={(wert) => updateArbeitszeit(eintrag.id, "arbeitsende", wert)} />
                  <MiniFeld label="Pause (Min.)" type="number" value={eintrag.pause} onChange={(wert) => updateArbeitszeit(eintrag.id, "pause", wert)} />
                  <div className="rounded-xl bg-[var(--bb-accent-soft)] px-3 py-2.5 text-center">
                    <div className="text-xs font-bold text-[var(--bb-accent-ink)]">Stunden</div>
                    <div className="font-semibold text-[var(--bb-accent-ink)]">{stundenBerechnen(eintrag).toFixed(1)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setGeaendert(true); setArbeitszeiten((aktuell) => aktuell.filter((item) => item.id !== eintrag.id)); }}
                    className="rounded-xl px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50"
                    aria-label={`${eintrag.name || "Mitarbeiter"} entfernen`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </Schritt>

        <Schritt
          nummer="3"
          titel="Sicherheitskontrolle"
          untertitel={`${kontrollenErledigt} von ${kontrollpunkte.length} bestätigt`}
        >
          <div className="grid gap-3 lg:grid-cols-2">
            {kontrollpunkte.map((punkt, index) => (
              <label
                key={punkt}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                  kontrolle[index] ? "border-green-200 bg-green-50" : "border-slate-200 hover:border-[var(--bb-accent)]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={Boolean(kontrolle[index])}
                  onChange={(event) => setKontrolle((aktuell) => ({ ...aktuell, [index]: event.target.checked }))}
                  className="mt-0.5 h-5 w-5 accent-[var(--bb-accent)]"
                />
                <span className="text-sm font-semibold leading-5 text-slate-700">{punkt}</span>
              </label>
            ))}
          </div>
        </Schritt>

        <Schritt nummer="4" titel="Fotos und Anhänge" untertitel="Optional – direkt beim Tagesjournal ablegen">
          <FileUpload value={anhaenge} onChange={(dateien) => { setGeaendert(true); setAnhaenge(dateien); }} />
        </Schritt>

        {entwurfStatus && <p role="status" className="text-sm font-semibold text-slate-600">{entwurfStatus}</p>}
        {geaendert && <p className="text-sm font-bold text-[var(--bb-accent-ink)]">Ungespeicherte Änderungen – bitte vor dem Tagesabschluss prüfen.</p>}
        <div className="sticky bottom-4 z-20 rounded-[20px] border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div role="status" aria-live="polite" className={`text-sm font-bold ${meldung.startsWith("Bitte") ? "text-red-600" : "text-green-700"}`}>
              {meldung || "Du kannst jederzeit als Entwurf speichern."}
            </div>
            <div className="flex gap-3">
              {abgeschlossen ? (
                <>
                  <button type="button" onClick={tagAbschliessen} disabled={ladeFehler} className="bb-secondary-button">
                    Änderungen speichern
                  </button>
                  <a href={`/baustellen/${id}`} className="bb-primary-button bb-button-link justify-center">
                    Zur Tagesübersicht →
                  </a>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => datenSpeichern(false)} disabled={ladeFehler} className="bb-secondary-button">
                    Entwurf speichern
                  </button>
                  <button type="button" onClick={tagAbschliessen} disabled={ladeFehler} className="bb-primary-button">
                    Tag abschliessen
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Schritt({
  nummer,
  titel,
  untertitel,
  action,
  children,
}: {
  nummer: string;
  titel: string;
  untertitel: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--bb-accent-soft)] font-semibold text-[var(--bb-accent-ink)]">{nummer}</span>
          <div>
            <h2 className="font-semibold text-slate-900">{titel}</h2>
            <p className="mt-0.5 text-sm text-slate-500">{untertitel}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Feld({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--bb-accent)]"
      />
    </div>
  );
}

function Textfeld({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">{label}</label>
      <textarea
        rows={4}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-300 p-4 outline-none focus:border-[var(--bb-accent)]"
      />
    </div>
  );
}

function MiniFeld({ label, type, value, onChange }: { label: string; type: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold text-slate-500">{label}</label>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
    </div>
  );
}

function groesseFormatieren(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
