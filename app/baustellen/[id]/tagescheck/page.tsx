"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AppShell from "../../../components/ui/AppShell";

type CheckKey =
  | "arbeitsbereich"
  | "abschottung"
  | "unterdruck"
  | "schleuse"
  | "atemschutz"
  | "psa"
  | "dekontamination"
  | "notfall";

type Baustelle = {
  id: string;
  nummer?: string;
  projektname?: string;
  ort?: string;
  verantwortlich?: string;
};

type TagescheckDaten = {
  datum: string;
  kontrolliertVon: string;
  pruefungen: Record<CheckKey, boolean>;
  bemerkung: string;
  status: "arbeitsbereit" | "nicht-arbeitsbereit";
  gespeichertAm: string;
};

const PRUEFUNGEN: {
  key: CheckKey;
  titel: string;
  beschreibung: string;
  kritisch?: boolean;
}[] = [
  {
    key: "arbeitsbereich",
    titel: "Arbeitsbereich abgesperrt",
    beschreibung: "Zutritt verhindert und Warnkennzeichnung angebracht.",
    kritisch: true,
  },
  {
    key: "abschottung",
    titel: "Abschottung und Sanierungszone dicht",
    beschreibung: "Folien, Anschlüsse und Durchdringungen kontrolliert.",
    kritisch: true,
  },
  {
    key: "unterdruck",
    titel: "Unterdruckanlage in Betrieb",
    beschreibung: "Unterdruck und Abluftführung geprüft und dokumentiert.",
    kritisch: true,
  },
  {
    key: "schleuse",
    titel: "Personen- und Materialschleuse bereit",
    beschreibung: "Kammern, Türen, Dusche und Wassermanagement geprüft.",
    kritisch: true,
  },
  {
    key: "atemschutz",
    titel: "Atemschutz kontrolliert",
    beschreibung: "Masken, Filter und Dichtsitzprüfung in Ordnung.",
    kritisch: true,
  },
  {
    key: "psa",
    titel: "Persönliche Schutzausrüstung vollständig",
    beschreibung: "Schutzanzüge, Handschuhe und Sicherheitsschuhe vorhanden.",
  },
  {
    key: "dekontamination",
    titel: "Dekontamination sichergestellt",
    beschreibung: "Sauger, Reinigungsmittel und Entsorgung bereitgestellt.",
  },
  {
    key: "notfall",
    titel: "Notfallorganisation bekannt",
    beschreibung: "Fluchtweg, Erste Hilfe und verantwortliche Personen geklärt.",
  },
];

const LEER: Record<CheckKey, boolean> = {
  arbeitsbereich: false,
  abschottung: false,
  unterdruck: false,
  schleuse: false,
  atemschutz: false,
  psa: false,
  dekontamination: false,
  notfall: false,
};

function heuteKey() {
  const heute = new Date();
  const offset = heute.getTimezoneOffset();
  return new Date(heute.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export default function TagescheckPage() {
  const params = useParams();
  const id = params.id as string;

  const [baustelle, setBaustelle] = useState<Baustelle | null>(null);
  const [datum, setDatum] = useState(heuteKey());
  const [kontrolliertVon, setKontrolliertVon] = useState("");
  const [pruefungen, setPruefungen] =
    useState<Record<CheckKey, boolean>>(LEER);
  const [bemerkung, setBemerkung] = useState("");
  const [gespeichert, setGespeichert] = useState(false);
  const [meldung, setMeldung] = useState("");

  const storageKey = `tagescheck-${id}-${datum}`;

  useEffect(() => {
    try {
      const alle = JSON.parse(
        localStorage.getItem("baustellen") || "[]"
      );

      if (Array.isArray(alle)) {
        const gefunden = alle.find(
          (eintrag: Baustelle) => eintrag.id === id
        );
        setBaustelle(gefunden || null);
        setKontrolliertVon(gefunden?.verantwortlich || "");
      }
    } catch {
      setBaustelle(null);
    }
  }, [id]);

  useEffect(() => {
    setPruefungen(LEER);
    setBemerkung("");
    setGespeichert(false);
    setMeldung("");

    try {
      const raw = localStorage.getItem(storageKey);

      if (!raw) return;

      const daten: TagescheckDaten = JSON.parse(raw);

      setPruefungen({ ...LEER, ...daten.pruefungen });
      setKontrolliertVon(daten.kontrolliertVon || "");
      setBemerkung(daten.bemerkung || "");
      setGespeichert(true);
    } catch {
      setGespeichert(false);
    }
  }, [storageKey]);

  const erledigt = useMemo(
    () => PRUEFUNGEN.filter((punkt) => pruefungen[punkt.key]).length,
    [pruefungen]
  );

  const kritischeOffen = useMemo(
    () =>
      PRUEFUNGEN.filter(
        (punkt) => punkt.kritisch && !pruefungen[punkt.key]
      ).length,
    [pruefungen]
  );

  const vollständig = erledigt === PRUEFUNGEN.length;
  const arbeitsbereit = vollständig && kritischeOffen === 0;
  const fortschritt = Math.round(
    (erledigt / PRUEFUNGEN.length) * 100
  );

  function umschalten(key: CheckKey) {
    setPruefungen((aktuell) => ({
      ...aktuell,
      [key]: !aktuell[key],
    }));
    setGespeichert(false);
    setMeldung("");
  }

  function speichern() {
    if (!kontrolliertVon.trim()) {
      setMeldung("Bitte die kontrollierende Person eintragen.");
      return;
    }

    const daten: TagescheckDaten = {
      datum,
      kontrolliertVon: kontrolliertVon.trim(),
      pruefungen,
      bemerkung: bemerkung.trim(),
      status: arbeitsbereit
        ? "arbeitsbereit"
        : "nicht-arbeitsbereit",
      gespeichertAm: new Date().toISOString(),
    };

    localStorage.setItem(storageKey, JSON.stringify(daten));
    setGespeichert(true);

    setMeldung(
      arbeitsbereit
        ? "Tagescheck gespeichert – die Baustelle ist arbeitsbereit."
        : "Tagescheck gespeichert – die Baustelle ist noch nicht arbeitsbereit."
    );
  }

  return (
    <AppShell
      title="Tagescheck"
      subtitle={
        baustelle
          ? `${baustelle.nummer || ""} ${baustelle.projektname || ""}`.trim()
          : "Tägliche Sicherheits- und Arbeitsfreigabe"
      }
      backHref={`/baustellen/${id}`}
      backLabel="Zur Baustelle"
      action={
        <div
          className={`bb-daily-status ${
            arbeitsbereit ? "ready" : "open"
          }`}
        >
          <i />
          {arbeitsbereit ? "Arbeitsbereit" : "Kontrolle offen"}
        </div>
      }
    >
      <section className="bb-daily-overview">
        <div className="bb-card bb-daily-progress-card">
          <div className="bb-daily-progress-ring">
            <strong>{fortschritt}%</strong>
          </div>

          <div>
            <span>Heutiger Kontrollstand</span>
            <h2>
              {erledigt} von {PRUEFUNGEN.length} Punkten geprüft
            </h2>
            <p>
              {kritischeOffen > 0
                ? `${kritischeOffen} kritische Prüfungen sind noch offen.`
                : "Alle kritischen Prüfungen wurden bestätigt."}
            </p>
          </div>
        </div>

        <div className="bb-card bb-daily-date-card">
          <label htmlFor="check-datum">Kontrolldatum</label>
          <input
            id="check-datum"
            type="date"
            className="bb-input"
            value={datum}
            onChange={(event) => setDatum(event.target.value)}
          />

          <small>
            Frühere Tageskontrollen können über das Datum geöffnet werden.
          </small>
        </div>
      </section>

      <section className="bb-daily-layout">
        <div className="bb-card bb-daily-checklist">
          <header>
            <div>
              <span>Tägliche Freigabe</span>
              <h2>Sicherheitskontrolle vor Arbeitsbeginn</h2>
            </div>
            <strong>{erledigt}/{PRUEFUNGEN.length}</strong>
          </header>

          <div className="bb-daily-items">
            {PRUEFUNGEN.map((punkt, index) => {
              const aktiv = pruefungen[punkt.key];

              return (
                <button
                  key={punkt.key}
                  type="button"
                  className={`bb-daily-item ${aktiv ? "checked" : ""}`}
                  onClick={() => umschalten(punkt.key)}
                >
                  <span className="bb-daily-checkbox">
                    {aktiv ? "✓" : ""}
                  </span>

                  <span className="bb-daily-item-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="bb-daily-item-copy">
                    <strong>{punkt.titel}</strong>
                    <small>{punkt.beschreibung}</small>
                  </span>

                  {punkt.kritisch && (
                    <span className="bb-daily-critical">
                      Kritisch
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="bb-daily-side">
          <section className="bb-card bb-daily-form">
            <div className="bb-field">
              <label htmlFor="kontrolliert-von">
                Kontrolliert durch *
              </label>
              <input
                id="kontrolliert-von"
                className="bb-input"
                value={kontrolliertVon}
                onChange={(event) => {
                  setKontrolliertVon(event.target.value);
                  setGespeichert(false);
                }}
                placeholder="Vorname und Nachname"
              />
            </div>

            <div className="bb-field">
              <label htmlFor="bemerkung">
                Bemerkungen / Abweichungen
              </label>
              <textarea
                id="bemerkung"
                className="bb-textarea"
                value={bemerkung}
                onChange={(event) => {
                  setBemerkung(event.target.value);
                  setGespeichert(false);
                }}
                placeholder="Festgestellte Abweichungen dokumentieren …"
              />
            </div>

            {meldung && (
              <div
                className={`bb-daily-message ${
                  arbeitsbereit ? "success" : "warning"
                }`}
              >
                {meldung}
              </div>
            )}

            <button
              type="button"
              className="bb-primary-button bb-daily-save"
              onClick={speichern}
            >
              {gespeichert
                ? "✓ Tagescheck gespeichert"
                : "Tagescheck speichern"}
            </button>

            {gespeichert && arbeitsbereit && (
              <a
                href={`/baustellen/${id}/zonenzutritt`}
                className="bb-secondary-button bb-button-link mt-3 w-full justify-center"
              >
                Weiter zum Zonenzutritt →
              </a>
            )}

            {gespeichert && !arbeitsbereit && (
              <a
                href={`/baustellen/${id}/maengel`}
                className="mt-3 block text-center text-sm font-semibold text-red-700"
              >
                Abweichung als Mangel erfassen →
              </a>
            )}
          </section>

          <section className="bb-daily-hint">
            <strong>Sicherheitsregel</strong>
            <p>
              Die Arbeiten dürfen erst beginnen, wenn alle kritischen
              Kontrollpunkte bestätigt und mögliche Abweichungen behoben
              wurden.
            </p>
          </section>
        </aside>
      </section>
    </AppShell>
  );
}
