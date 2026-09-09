"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import SignaturePad from "../components/SignaturePad";
import AppShell from "../components/ui/AppShell";

type Mitarbeiter = {
  id: string;
  vorname: string;
  nachname: string;
  funktion: string;
  aktiv?: boolean;
};

type Baustelle = {
  id: string;
  nummer?: string;
  projektname?: string;
  verantwortlich?: string;
};

type Instruktion = {
  id: string;
  mitarbeiterId: string;
  mitarbeiterName: string;
  funktion: string;
  baustelleId: string;
  baustelle: string;
  code: string;
  bezeichnung: string;
  datum: string;
  verantwortlich: string;
  sprache?: string;
  inhalte?: string[];
  bemerkung?: string;
  unterschriftVerantwortlich?: string;
  unterschriftMitarbeiter?: string;
  erstelltAm?: string;
};

type Dokument = {
  id: string;
  name: string;
  ordnerId: string;
  datum: string;
  typ?: string;
  instruktionId?: string;
};

const INHALTE: Record<string, string[]> = {
  AS5: [
    "Arbeitsauftrag und Gefahren",
    "Persönliche Schutzausrüstung",
    "Zonen, Schleuse und Arbeitsablauf",
    "Verhalten bei Störungen und Notfällen",
    "Dekontamination und Entsorgung",
  ],
  AS7: [
    "Gesundheitsgefahren durch Asbest",
    "Schutzmassnahmen und PSA",
    "Schwarz-Weiss-Bereich und Schleuse",
    "Arbeitsverfahren und Unterdruckhaltung",
    "Dekontamination und Entsorgung",
    "Notfall, Störung und Meldeweg",
  ],
};

function lokalesDatum() {
  const heute = new Date();
  const offset = heute.getTimezoneOffset() * 60_000;
  return new Date(heute.getTime() - offset).toISOString().slice(0, 10);
}

function baustellenName(baustelle: Baustelle) {
  return [baustelle.nummer, baustelle.projektname].filter(Boolean).join(" · ") ||
    "Baustelle ohne Bezeichnung";
}

export default function Instruktionen() {
  const [historie, setHistorie] = useState<Instruktion[]>([]);
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([]);
  const [baustellen, setBaustellen] = useState<Baustelle[]>([]);
  const [suche, setSuche] = useState("");
  const [filter, setFilter] = useState("Alle");
  const [formularOffen, setFormularOffen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [code, setCode] = useState("AS5");
  const [mitarbeiterId, setMitarbeiterId] = useState("");
  const [baustelleId, setBaustelleId] = useState("");
  const [datum, setDatum] = useState(lokalesDatum);
  const [verantwortlich, setVerantwortlich] = useState("");
  const [sprache, setSprache] = useState("Deutsch");
  const [bestaetigteInhalte, setBestaetigteInhalte] = useState<string[]>([]);
  const [bemerkung, setBemerkung] = useState("");
  const [unterschriftVerantwortlich, setUnterschriftVerantwortlich] = useState("");
  const [unterschriftMitarbeiter, setUnterschriftMitarbeiter] = useState("");

  useEffect(() => {
    try {
      const gespeicherteHistorie = JSON.parse(
        localStorage.getItem("instruktionshistorie") || "[]"
      );
      const gespeicherteMitarbeiter = JSON.parse(
        localStorage.getItem("mitarbeiter") || "[]"
      );
      const gespeicherteBaustellen = JSON.parse(
        localStorage.getItem("baustellen") || "[]"
      );

      setHistorie(
        Array.isArray(gespeicherteHistorie)
          ? [...gespeicherteHistorie].sort((a: Instruktion, b: Instruktion) =>
              b.datum.localeCompare(a.datum)
            )
          : []
      );
      setMitarbeiter(
        Array.isArray(gespeicherteMitarbeiter)
          ? gespeicherteMitarbeiter.filter(
              (person: Mitarbeiter) => person.aktiv !== false
            )
          : []
      );
      setBaustellen(
        Array.isArray(gespeicherteBaustellen) ? gespeicherteBaustellen : []
      );
    } catch {
      setHistorie([]);
      setMitarbeiter([]);
      setBaustellen([]);
    }
  }, []);

  const gefiltert = useMemo(() => {
    const begriff = suche.trim().toLowerCase();

    return historie.filter((eintrag) => {
      const passtFilter = filter === "Alle" || eintrag.code === filter;
      const passtSuche =
        !begriff ||
        [
          eintrag.mitarbeiterName,
          eintrag.funktion,
          eintrag.baustelle,
          eintrag.bezeichnung,
          eintrag.verantwortlich,
          eintrag.code,
        ]
          .join(" ")
          .toLowerCase()
          .includes(begriff);

      return passtFilter && passtSuche;
    });
  }, [historie, suche, filter]);

  const detail = historie.find((eintrag) => eintrag.id === detailId);
  const as5 = historie.filter((eintrag) => eintrag.code === "AS5").length;
  const as7 = historie.filter((eintrag) => eintrag.code === "AS7").length;

  function datumFormatieren(wert: string) {
    if (!wert) return "Kein Datum";
    const zuFormatieren = new Date(`${wert}T12:00:00`);
    if (Number.isNaN(zuFormatieren.getTime())) return wert;

    return zuFormatieren.toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formularZuruecksetzen() {
    setCode("AS5");
    setMitarbeiterId("");
    setBaustelleId("");
    setDatum(lokalesDatum());
    setVerantwortlich("");
    setSprache("Deutsch");
    setBestaetigteInhalte([]);
    setBemerkung("");
    setUnterschriftVerantwortlich("");
    setUnterschriftMitarbeiter("");
  }

  function formularUmschalten() {
    if (formularOffen) formularZuruecksetzen();
    setFormularOffen((offen) => !offen);
    setDetailId(null);
  }

  function typWaehlen(neuerCode: string) {
    setCode(neuerCode);
    setBestaetigteInhalte([]);
  }

  function baustelleWaehlen(neueId: string) {
    setBaustelleId(neueId);
    const auswahl = baustellen.find((eintrag) => eintrag.id === neueId);
    if (!verantwortlich.trim() && auswahl?.verantwortlich) {
      setVerantwortlich(auswahl.verantwortlich);
    }
  }

  function inhaltUmschalten(inhalt: string) {
    setBestaetigteInhalte((aktuell) =>
      aktuell.includes(inhalt)
        ? aktuell.filter((eintrag) => eintrag !== inhalt)
        : [...aktuell, inhalt]
    );
  }

  function speichern(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const person = mitarbeiter.find((eintrag) => eintrag.id === mitarbeiterId);
    const baustelle = baustellen.find((eintrag) => eintrag.id === baustelleId);
    const alleInhalteBestaetigt =
      bestaetigteInhalte.length === INHALTE[code].length;

    if (!person || !baustelle || !datum || !verantwortlich.trim()) {
      alert("Bitte Mitarbeitenden, Baustelle, Datum und Instruktionsperson angeben.");
      return;
    }

    if (!alleInhalteBestaetigt) {
      alert("Bitte alle Instruktionsinhalte gemeinsam besprechen und bestätigen.");
      return;
    }

    if (!unterschriftVerantwortlich || !unterschriftMitarbeiter) {
      alert("Für den Nachweis werden beide Unterschriften benötigt.");
      return;
    }

    const id = crypto.randomUUID();
    const neuerEintrag: Instruktion = {
      id,
      mitarbeiterId: person.id,
      mitarbeiterName: `${person.vorname} ${person.nachname}`,
      funktion: person.funktion,
      baustelleId: baustelle.id,
      baustelle: baustellenName(baustelle),
      code,
      bezeichnung:
        code === "AS5"
          ? "Instruktion Mitarbeiter"
          : "Erstinstruktion Asbest-Arbeiter",
      datum,
      verantwortlich: verantwortlich.trim(),
      sprache,
      inhalte: INHALTE[code],
      bemerkung: bemerkung.trim(),
      unterschriftVerantwortlich,
      unterschriftMitarbeiter,
      erstelltAm: new Date().toISOString(),
    };

    const neueHistorie = [neuerEintrag, ...historie].sort((a, b) =>
      b.datum.localeCompare(a.datum)
    );
    setHistorie(neueHistorie);
    localStorage.setItem("instruktionshistorie", JSON.stringify(neueHistorie));

    const dokumentKey = `dokumente-${baustelle.id}`;
    try {
      const bestehendeDokumente = JSON.parse(
        localStorage.getItem(dokumentKey) || "[]"
      );
      const dokument: Dokument = {
        id: crypto.randomUUID(),
        name: `${code} – ${person.vorname} ${person.nachname} – ${datumFormatieren(datum)}`,
        ordnerId: "mitarbeiter",
        datum: datumFormatieren(datum),
        typ: "Instruktionsnachweis",
        instruktionId: id,
      };
      localStorage.setItem(
        dokumentKey,
        JSON.stringify([
          dokument,
          ...(Array.isArray(bestehendeDokumente) ? bestehendeDokumente : []),
        ])
      );
    } catch {
      // Der Nachweis bleibt in der Instruktionshistorie erhalten.
    }

    formularZuruecksetzen();
    setFormularOffen(false);
    setDetailId(id);
  }

  return (
    <AppShell
      title="Instruktionen"
      subtitle="Schulungs- und Instruktionsnachweise zentral verwalten."
      action={
        <button
          type="button"
          className="bb-primary-button bb-button-link"
          onClick={formularUmschalten}
        >
          {formularOffen ? "Schliessen" : "＋ Neue Instruktion"}
        </button>
      }
    >
      <section className="bb-instruction-stats">
        <div className="bb-stat-card">
          <span className="bb-stat-icon neutral">▤</span>
          <div>
            <strong>{historie.length}</strong>
            <span>Nachweise gesamt</span>
          </div>
        </div>
        <div className="bb-stat-card">
          <span className="bb-stat-icon orange">5</span>
          <div>
            <strong>{as5}</strong>
            <span>AS5 Mitarbeiterinstruktionen</span>
          </div>
        </div>
        <div className="bb-stat-card">
          <span className="bb-stat-icon blue">7</span>
          <div>
            <strong>{as7}</strong>
            <span>AS7 Erstinstruktionen</span>
          </div>
        </div>
      </section>

      {formularOffen && (
        <form className="bb-card bb-instruction-form" onSubmit={speichern}>
          <div className="bb-form-section-header">
            <div className="bb-section-icon blue">＋</div>
            <div>
              <h2>Neue Instruktion erfassen</h2>
              <p>Inhalte gemeinsam durchgehen und direkt unterschreiben.</p>
            </div>
          </div>

          <fieldset className="bb-instruction-fieldset">
            <legend>1. Art der Instruktion</legend>
            <div className="bb-instruction-type-grid">
              {[
                ["AS5", "Mitarbeiterinstruktion", "Arbeitsplatzbezogene Instruktion"],
                ["AS7", "Erstinstruktion Asbest", "Für neue Asbest-Arbeitende"],
              ].map(([wert, titel, text]) => (
                <button
                  key={wert}
                  type="button"
                  className={`bb-instruction-type ${code === wert ? "active" : ""}`}
                  onClick={() => typWaehlen(wert)}
                  aria-pressed={code === wert}
                >
                  <span>{wert}</span>
                  <strong>{titel}</strong>
                  <small>{text}</small>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="bb-instruction-fieldset">
            <legend>2. Zuordnung</legend>
            <div className="bb-grid-2">
              <div className="bb-field">
                <label htmlFor="instruktion-mitarbeiter">Mitarbeiter *</label>
                <select
                  id="instruktion-mitarbeiter"
                  className="bb-select"
                  value={mitarbeiterId}
                  onChange={(event) => setMitarbeiterId(event.target.value)}
                >
                  <option value="">Mitarbeiter auswählen</option>
                  {mitarbeiter.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.vorname} {person.nachname} · {person.funktion}
                    </option>
                  ))}
                </select>
                {mitarbeiter.length === 0 && (
                  <small className="bb-field-hint">
                    Zuerst unter <Link href="/mitarbeiter">Mitarbeiter</Link> eine
                    Person erfassen.
                  </small>
                )}
              </div>
              <div className="bb-field">
                <label htmlFor="instruktion-baustelle">Baustelle *</label>
                <select
                  id="instruktion-baustelle"
                  className="bb-select"
                  value={baustelleId}
                  onChange={(event) => baustelleWaehlen(event.target.value)}
                >
                  <option value="">Baustelle auswählen</option>
                  {baustellen.map((eintrag) => (
                    <option key={eintrag.id} value={eintrag.id}>
                      {baustellenName(eintrag)}
                    </option>
                  ))}
                </select>
                {baustellen.length === 0 && (
                  <small className="bb-field-hint">
                    Zuerst eine <Link href="/baustellen/neu">Baustelle erfassen</Link>.
                  </small>
                )}
              </div>
              <div className="bb-field">
                <label htmlFor="instruktion-datum">Datum *</label>
                <input
                  id="instruktion-datum"
                  type="date"
                  className="bb-input"
                  value={datum}
                  onChange={(event) => setDatum(event.target.value)}
                />
              </div>
              <div className="bb-field">
                <label htmlFor="instruktion-verantwortlich">
                  Instruktion durchgeführt von *
                </label>
                <input
                  id="instruktion-verantwortlich"
                  className="bb-input"
                  value={verantwortlich}
                  onChange={(event) => setVerantwortlich(event.target.value)}
                  placeholder="Vorname und Nachname"
                />
              </div>
              <div className="bb-field">
                <label htmlFor="instruktion-sprache">Sprache</label>
                <select
                  id="instruktion-sprache"
                  className="bb-select"
                  value={sprache}
                  onChange={(event) => setSprache(event.target.value)}
                >
                  {["Deutsch", "Französisch", "Italienisch", "Englisch", "Andere"].map(
                    (eintrag) => <option key={eintrag}>{eintrag}</option>
                  )}
                </select>
              </div>
            </div>
          </fieldset>

          <fieldset className="bb-instruction-fieldset">
            <legend>3. Besprochene Inhalte bestätigen</legend>
            <div className="bb-instruction-topic-list">
              {INHALTE[code].map((inhalt) => (
                <label key={inhalt} className="bb-instruction-topic">
                  <input
                    type="checkbox"
                    checked={bestaetigteInhalte.includes(inhalt)}
                    onChange={() => inhaltUmschalten(inhalt)}
                  />
                  <span>✓</span>
                  <strong>{inhalt}</strong>
                </label>
              ))}
            </div>
            <div className="bb-field bb-instruction-note">
              <label htmlFor="instruktion-bemerkung">Bemerkung (optional)</label>
              <textarea
                id="instruktion-bemerkung"
                className="bb-textarea"
                value={bemerkung}
                onChange={(event) => setBemerkung(event.target.value)}
                placeholder="Besondere Hinweise oder Rückfragen festhalten …"
              />
            </div>
          </fieldset>

          <fieldset className="bb-instruction-fieldset">
            <legend>4. Unterschriften</legend>
            <div className="bb-grid-2">
              <SignaturePad
                value={unterschriftVerantwortlich}
                onChange={setUnterschriftVerantwortlich}
                label="Instruktionsperson *"
              />
              <SignaturePad
                value={unterschriftMitarbeiter}
                onChange={setUnterschriftMitarbeiter}
                label="Mitarbeiter *"
              />
            </div>
          </fieldset>

          <div className="bb-instruction-form-actions">
            <p>
              Nach dem Speichern liegt der Nachweis automatisch im Baustellenordner
              «Mitarbeiter & Instruktionen».
            </p>
            <div>
              <button
                type="button"
                className="bb-secondary-button"
                onClick={formularUmschalten}
              >
                Abbrechen
              </button>
              <button type="submit" className="bb-primary-button">
                Instruktion abschliessen
              </button>
            </div>
          </div>
        </form>
      )}

      {detail && !formularOffen && (
        <section className="bb-card bb-instruction-detail">
          <header>
            <div>
              <span
                className={`bb-instruction-code ${detail.code === "AS7" ? "blue" : ""}`}
              >
                {detail.code}
              </span>
              <div>
                <h2>{detail.bezeichnung}</h2>
                <p>
                  {detail.mitarbeiterName} · {datumFormatieren(detail.datum)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDetailId(null)}
              aria-label="Nachweis schliessen"
            >
              ×
            </button>
          </header>
          <dl className="bb-instruction-detail-grid">
            <div>
              <dt>Mitarbeiter</dt>
              <dd>{detail.mitarbeiterName}</dd>
            </div>
            <div>
              <dt>Baustelle</dt>
              <dd>{detail.baustelle}</dd>
            </div>
            <div>
              <dt>Instruktionsperson</dt>
              <dd>{detail.verantwortlich || "Nicht angegeben"}</dd>
            </div>
            <div>
              <dt>Sprache</dt>
              <dd>{detail.sprache || "Nicht erfasst"}</dd>
            </div>
          </dl>
          {detail.inhalte?.length ? (
            <div className="bb-instruction-detail-topics">
              <strong>Bestätigte Inhalte</strong>
              <ul>
                {detail.inhalte.map((inhalt) => (
                  <li key={inhalt}>✓ {inhalt}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="bb-instruction-legacy">
              Dieser ältere Nachweis enthält keine einzeln gespeicherten Detailangaben.
            </p>
          )}
          {detail.bemerkung && (
            <p className="bb-instruction-detail-note">
              <strong>Bemerkung:</strong> {detail.bemerkung}
            </p>
          )}
          {detail.unterschriftVerantwortlich && detail.unterschriftMitarbeiter && (
            <div className="bb-instruction-detail-signatures">
              <div>
                <span>Instruktionsperson</span>
                <Image
                  src={detail.unterschriftVerantwortlich}
                  alt="Unterschrift der Instruktionsperson"
                  width={900}
                  height={220}
                  unoptimized
                />
              </div>
              <div>
                <span>Mitarbeiter</span>
                <Image
                  src={detail.unterschriftMitarbeiter}
                  alt="Unterschrift des Mitarbeiters"
                  width={900}
                  height={220}
                  unoptimized
                />
              </div>
            </div>
          )}
          <Link
            href={`/baustellen/${detail.baustelleId}/dokumente`}
            className="bb-secondary-button bb-button-link"
          >
            Baustellenordner öffnen
          </Link>
        </section>
      )}

      <section className="bb-card bb-instruction-panel">
        <header className="bb-instruction-toolbar">
          <div className="bb-search">
            <span>⌕</span>
            <input
              value={suche}
              onChange={(event) => setSuche(event.target.value)}
              placeholder="Person, Baustelle oder Instruktion suchen …"
            />
          </div>
          <div className="bb-filter-tabs">
            {["Alle", "AS5", "AS7"].map((eintrag) => (
              <button
                key={eintrag}
                type="button"
                className={filter === eintrag ? "active" : ""}
                onClick={() => setFilter(eintrag)}
              >
                {eintrag}
              </button>
            ))}
          </div>
        </header>

        {gefiltert.length === 0 ? (
          <div className="bb-empty-state">
            <div className="bb-empty-icon">✓</div>
            <h2>
              {historie.length === 0
                ? "Noch keine Instruktionen"
                : "Keine Nachweise gefunden"}
            </h2>
            <p>
              {historie.length === 0
                ? "Erfasse hier die erste Mitarbeiterinstruktion oder Erstinstruktion."
                : "Passe die Suche oder den ausgewählten Filter an."}
            </p>
            {historie.length === 0 && (
              <button type="button" className="bb-primary-button" onClick={formularUmschalten}>
                ＋ Erste Instruktion erfassen
              </button>
            )}
          </div>
        ) : (
          <div className="bb-instruction-list">
            {gefiltert.map((eintrag) => (
              <article
                key={eintrag.id}
                className={`bb-instruction-row ${detailId === eintrag.id ? "active" : ""}`}
              >
                <div className={`bb-instruction-code ${eintrag.code === "AS7" ? "blue" : ""}`}>
                  {eintrag.code}
                </div>
                <div className="bb-instruction-person">
                  <strong>{eintrag.mitarbeiterName}</strong>
                  <span>{eintrag.funktion || "Funktion nicht angegeben"}</span>
                </div>
                <div className="bb-instruction-project">
                  <strong>{eintrag.bezeichnung}</strong>
                  <span>{eintrag.baustelle}</span>
                </div>
                <div className="bb-instruction-date">
                  <strong>{datumFormatieren(eintrag.datum)}</strong>
                  <span>
                    {eintrag.verantwortlich
                      ? `Instruktion: ${eintrag.verantwortlich}`
                      : "Verantwortlich nicht angegeben"}
                  </span>
                </div>
                <button
                  type="button"
                  className="bb-instruction-open"
                  onClick={() => setDetailId(detailId === eintrag.id ? null : eintrag.id)}
                  aria-label="Nachweis ansehen"
                >
                  ›
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
