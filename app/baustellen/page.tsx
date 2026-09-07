"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "../components/ui/AppShell";

type Baustelle = {
  id: string;
  nummer?: string;
  projektname?: string;
  ort?: string;
  sanierungsart?: string;
  status?: string;
  fortschritt?: number;
  startdatum?: string;
  enddatum?: string;
  verantwortlich?: string;
};

const FILTER = ["Alle", "In Vorbereitung", "Aktiv", "Abgeschlossen"];

function statusKlasse(status = "") {
  const wert = status.toLowerCase();

  if (wert.includes("abgeschlossen")) return "completed";
  if (wert.includes("aktiv") || wert.includes("ausführung")) return "active";
  return "planning";
}

export default function Baustellen() {
  const [baustellen, setBaustellen] = useState<Baustelle[]>([]);
  const [suche, setSuche] = useState("");
  const [filter, setFilter] = useState("Alle");

  useEffect(() => {
    try {
      const daten = JSON.parse(localStorage.getItem("baustellen") || "[]");
      setBaustellen(Array.isArray(daten) ? daten : []);
    } catch {
      setBaustellen([]);
    }
  }, []);

  const gefiltert = useMemo(() => {
    const begriff = suche.trim().toLowerCase();

    return baustellen.filter((baustelle) => {
      const status = baustelle.status || "In Vorbereitung";
      const passtFilter =
        filter === "Alle" ||
        status.toLowerCase().includes(filter.toLowerCase());

      const passtSuche =
        !begriff ||
        [
          baustelle.nummer,
          baustelle.projektname,
          baustelle.ort,
          baustelle.sanierungsart,
          baustelle.verantwortlich,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(begriff);

      return passtFilter && passtSuche;
    });
  }, [baustellen, suche, filter]);

  const aktive = baustellen.filter((b) =>
    (b.status || "").toLowerCase().includes("aktiv")
  ).length;

  const vorbereitungen = baustellen.filter(
    (b) => statusKlasse(b.status) === "planning"
  ).length;

  const abgeschlossen = baustellen.filter(
    (b) => statusKlasse(b.status) === "completed"
  ).length;

  return (
    <AppShell
      title="Baustellen"
      subtitle="Alle Sanierungsprojekte zentral verwalten und überwachen."
      action={
        <Link href="/baustellen/neu" className="bb-primary-button bb-button-link">
          <span>＋</span>
          Neue Baustelle
        </Link>
      }
    >
      <section className="bb-project-stats">
        <div className="bb-stat-card">
          <span className="bb-stat-icon neutral">▦</span>
          <div>
            <strong>{baustellen.length}</strong>
            <span>Baustellen gesamt</span>
          </div>
        </div>

        <div className="bb-stat-card">
          <span className="bb-stat-icon orange">●</span>
          <div>
            <strong>{aktive}</strong>
            <span>Aktive Baustellen</span>
          </div>
        </div>

        <div className="bb-stat-card">
          <span className="bb-stat-icon blue">◷</span>
          <div>
            <strong>{vorbereitungen}</strong>
            <span>In Vorbereitung</span>
          </div>
        </div>

        <div className="bb-stat-card">
          <span className="bb-stat-icon green">✓</span>
          <div>
            <strong>{abgeschlossen}</strong>
            <span>Abgeschlossen</span>
          </div>
        </div>
      </section>

      <section className="bb-project-panel bb-card">
        <div className="bb-project-toolbar">
          <div className="bb-search">
            <span>⌕</span>
            <input
              value={suche}
              onChange={(event) => setSuche(event.target.value)}
              placeholder="Baustelle, Ort oder Nummer suchen …"
            />
          </div>

          <div className="bb-filter-tabs">
            {FILTER.map((eintrag) => (
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
        </div>

        {gefiltert.length === 0 ? (
          <div className="bb-empty-state">
            <div className="bb-empty-icon">▦</div>

            <h2>
              {baustellen.length === 0
                ? "Noch keine Baustellen"
                : "Keine Baustelle gefunden"}
            </h2>

            <p>
              {baustellen.length === 0
                ? "Erstelle die erste Baustelle und führe danach alle Arbeitsschritte und Dokumente zentral."
                : "Passe den Suchbegriff oder den ausgewählten Status an."}
            </p>

            {baustellen.length === 0 && (
              <Link
                href="/baustellen/neu"
                className="bb-primary-button bb-button-link"
              >
                ＋ Erste Baustelle erstellen
              </Link>
            )}
          </div>
        ) : (
          <div className="bb-project-list">
            {gefiltert.map((baustelle) => {
              const fortschritt = Math.min(
                100,
                Math.max(0, Number(baustelle.fortschritt) || 0)
              );
              const status = baustelle.status || "In Vorbereitung";
              const klasse = statusKlasse(status);

              return (
                <Link
                  key={baustelle.id}
                  href={`/baustellen/${baustelle.id}`}
                  className="bb-project-row"
                >
                  <div className={`bb-project-symbol ${klasse}`}>▰</div>

                  <div className="bb-project-info">
                    <div className="bb-project-number">
                      {baustelle.nummer || "Ohne Baustellen-Nr."}
                    </div>

                    <h2>{baustelle.projektname || "Unbenannte Baustelle"}</h2>

                    <div className="bb-project-meta">
                      <span>⌖ {baustelle.ort || "Ort nicht angegeben"}</span>
                      <span>
                        ◇ {baustelle.sanierungsart || "Sanierungsart offen"}
                      </span>
                      {baustelle.verantwortlich && (
                        <span>♙ {baustelle.verantwortlich}</span>
                      )}
                    </div>
                  </div>

                  <div className="bb-project-status">
                    <span className={`bb-status-badge ${klasse}`}>
                      <i />
                      {status}
                    </span>

                    <div className="bb-progress-header">
                      <span>Fortschritt</span>
                      <strong>{fortschritt}%</strong>
                    </div>

                    <div className="bb-project-progress">
                      <div
                        className={klasse}
                        style={{ width: `${fortschritt}%` }}
                      />
                    </div>
                  </div>

                  <span className="bb-project-arrow">›</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}
