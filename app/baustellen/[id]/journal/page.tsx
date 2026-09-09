"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import FileUpload, { DateiEintrag } from "../../../components/FileUpload";
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

  const [baustelle, setBaustelle] = useState<Baustelle | null>(null);
  const [team, setTeam] = useState<Mitarbeiter[]>([]);
  const [datum, setDatum] = useState(heuteIso);
  const [zone, setZone] = useState("");
  const [vorarbeiter, setVorarbeiter] = useState("");
  const [arbeit, setArbeit] = useState("");
  const [besonderheiten, setBesonderheiten] = useState("");
  const [arbeitszeiten, setArbeitszeiten] = useState<Arbeitszeit[]>([]);
  const [kontrolle, setKontrolle] = useState<Record<number, boolean>>({});
  const [anhaenge, setAnhaenge] = useState<DateiEintrag[]>([]);
  const [abgeschlossen, setAbgeschlossen] = useState(false);
  const [meldung, setMeldung] = useState("");

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
    const key = `journal-${id}-${datum}`;

    try {
      const gespeichert = JSON.parse(localStorage.getItem(key) || "null");
      const alt = datum === heuteIso()
        ? JSON.parse(localStorage.getItem(`journal-${id}`) || "null")
        : null;
      const daten = gespeichert || alt;

      if (daten) {
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
    } catch {}

    setZone("");
    setVorarbeiter("");
    setArbeit("");
    setBesonderheiten("");
    setArbeitszeiten(team.map((m) => leereArbeitszeit(m)));
    setKontrolle({});
    setAnhaenge([]);
    setAbgeschlossen(false);
  }, [datum, id, team]);

  const kontrollenErledigt = kontrollpunkte.filter((_, index) => kontrolle[index]).length;
  const totalStunden = useMemo(
    () => arbeitszeiten.reduce((summe, eintrag) => summe + stundenBerechnen(eintrag), 0),
    [arbeitszeiten]
  );

  function mitarbeiterHinzufuegen() {
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

    localStorage.setItem(`journal-${id}-${datum}`, JSON.stringify(daten));
    localStorage.removeItem(`journal-${id}`);
    dokumenteAktualisieren(istAbgeschlossen);
    setAbgeschlossen(istAbgeschlossen);
    setMeldung(istAbgeschlossen ? "Arbeitstag abgeschlossen und abgelegt." : "Entwurf gespeichert.");
  }

  function dokumenteAktualisieren(istAbgeschlossen: boolean) {
    const key = `dokumente-${id}`;
    let dokumente: Dokument[] = [];

    try {
      const gespeichert = JSON.parse(localStorage.getItem(key) || "[]");
      dokumente = Array.isArray(gespeichert) ? gespeichert : [];
    } catch {}

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
    const zeitenKomplett = arbeitszeiten.every(
      (eintrag) => eintrag.name && eintrag.arbeitsbeginn && eintrag.arbeitsende
    );

    if (!datum || !vorarbeiter || !arbeit.trim()) {
      setMeldung("Bitte Datum, Vorarbeiter und ausgeführte Arbeiten ausfüllen.");
      return;
    }

    if (!arbeitszeiten.length || !zeitenKomplett) {
      setMeldung("Bitte die Arbeitszeiten aller Mitarbeitenden vollständig erfassen.");
      return;
    }

    if (kontrollenErledigt !== kontrollpunkte.length) {
      setMeldung("Bitte vor dem Abschluss alle Sicherheitskontrollen bestätigen.");
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
      <div className="bb-workspace max-w-6xl space-y-5 pb-28">
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#d46c12]">
                {baustelle.nummer} · {baustelle.ort}
              </div>
              <h2 className="mt-2 text-2xl font-black text-slate-900">{baustelle.projektname}</h2>
              <p className="mt-1 text-sm text-slate-500">
                Das ausgefüllte Journal und alle Anhänge landen automatisch im Baustellenordner.
              </p>
            </div>
            <div className={`rounded-2xl px-5 py-3 text-sm font-bold ${
              abgeschlossen ? "bg-green-50 text-green-700" : "bg-[#fff3e8] text-[#a95310]"
            }`}>
              {abgeschlossen ? "✓ Tag abgeschlossen" : "Journal offen"}
            </div>
          </div>
        </section>

        <Schritt nummer="1" titel="Tag und Arbeiten" untertitel="Was wurde heute auf der Baustelle erledigt?">
          <div className="grid gap-4 md:grid-cols-3">
            <Feld label="Datum" type="date" value={datum} onChange={setDatum} />
            <Feld label="Zone / Etappe" value={zone} onChange={setZone} placeholder="z. B. Zone 1" />
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Vorarbeiter *</label>
              <select
                value={vorarbeiter}
                onChange={(event) => setVorarbeiter(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-[#e77818]"
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
                  <div className="rounded-xl bg-[#fff3e8] px-3 py-2.5 text-center">
                    <div className="text-xs font-bold text-[#a95310]">Stunden</div>
                    <div className="font-black text-[#d46c12]">{stundenBerechnen(eintrag).toFixed(1)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setArbeitszeiten((aktuell) => aktuell.filter((item) => item.id !== eintrag.id))}
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
                  kontrolle[index] ? "border-green-200 bg-green-50" : "border-slate-200 hover:border-[#e77818]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={Boolean(kontrolle[index])}
                  onChange={(event) => setKontrolle((aktuell) => ({ ...aktuell, [index]: event.target.checked }))}
                  className="mt-0.5 h-5 w-5 accent-[#e77818]"
                />
                <span className="text-sm font-semibold leading-5 text-slate-700">{punkt}</span>
              </label>
            ))}
          </div>
        </Schritt>

        <Schritt nummer="4" titel="Fotos und Anhänge" untertitel="Optional – direkt beim Tagesjournal ablegen">
          <FileUpload value={anhaenge} onChange={setAnhaenge} />
        </Schritt>

        <div className="sticky bottom-4 z-20 rounded-[20px] border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className={`text-sm font-bold ${meldung.startsWith("Bitte") ? "text-red-600" : "text-green-700"}`}>
              {meldung || "Du kannst jederzeit als Entwurf speichern."}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => datenSpeichern(false)} className="bb-secondary-button">
                Entwurf speichern
              </button>
              <button type="button" onClick={tagAbschliessen} className="bb-primary-button">
                Tag abschliessen
              </button>
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
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff0e2] font-black text-[#d46c12]">{nummer}</span>
          <div>
            <h2 className="font-black text-slate-900">{titel}</h2>
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
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#e77818]"
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
        className="w-full rounded-xl border border-slate-300 p-4 outline-none focus:border-[#e77818]"
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

function stundenBerechnen(eintrag: Arbeitszeit) {
  if (!eintrag.arbeitsbeginn || !eintrag.arbeitsende) return 0;

  const [startStunde, startMinute] = eintrag.arbeitsbeginn.split(":").map(Number);
  const [endeStunde, endeMinute] = eintrag.arbeitsende.split(":").map(Number);
  const minuten = endeStunde * 60 + endeMinute - (startStunde * 60 + startMinute) - Number(eintrag.pause || 0);
  return Math.max(0, minuten / 60);
}

function groesseFormatieren(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
