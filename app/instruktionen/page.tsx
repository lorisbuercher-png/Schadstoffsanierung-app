"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/ui/AppShell";

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
};

export default function Instruktionen() {
  const [historie, setHistorie] = useState<Instruktion[]>([]);
  const [suche, setSuche] = useState("");
  const [filter, setFilter] = useState("Alle");

  useEffect(() => {
    try {
      const daten = JSON.parse(
        localStorage.getItem("instruktionshistorie") || "[]"
      );

      setHistorie(
        Array.isArray(daten)
          ? daten.sort((a: Instruktion, b: Instruktion) =>
              b.datum.localeCompare(a.datum)
            )
          : []
      );
    } catch {
      setHistorie([]);
    }
  }, []);

  const gefiltert = useMemo(() => {
    const begriff = suche.trim().toLowerCase();

    return historie.filter((eintrag) => {
      const passtFilter =
        filter === "Alle" || eintrag.code === filter;

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

  const as5 = historie.filter(
    (eintrag) => eintrag.code === "AS5"
  ).length;

  const as7 = historie.filter(
    (eintrag) => eintrag.code === "AS7"
  ).length;

  function datumFormatieren(wert: string) {
    if (!wert) return "Kein Datum";

    const datum = new Date(`${wert}T12:00:00`);

    if (Number.isNaN(datum.getTime())) return wert;

    return datum.toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return (
    <AppShell
      title="Instruktionen"
      subtitle="Schulungs- und Instruktionsnachweise zentral verwalten."
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
                ? "Abgeschlossene AS5- und AS7-Checklisten erscheinen automatisch in dieser Historie."
                : "Passe die Suche oder den ausgewählten Filter an."}
            </p>
          </div>
        ) : (
          <div className="bb-instruction-list">
            {gefiltert.map((eintrag) => (
              <article
                key={eintrag.id}
                className="bb-instruction-row"
              >
                <div
                  className={`bb-instruction-code ${
                    eintrag.code === "AS7" ? "blue" : ""
                  }`}
                >
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

                <a
                  href={`/baustellen/${eintrag.baustelleId}`}
                  className="bb-instruction-open"
                  aria-label="Baustelle öffnen"
                >
                  ›
                </a>
              </article>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
