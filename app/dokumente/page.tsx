"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/ui/AppShell";

type Baustelle = {
  id: string;
  nummer?: string;
  projektname?: string;
  ort?: string;
};

type ProjektDokumente = Baustelle & {
  anzahl: number;
};

export default function DokumentePage() {
  const [projekte, setProjekte] = useState<ProjektDokumente[]>([]);
  const [suche, setSuche] = useState("");

  useEffect(() => {
    try {
      const baustellen = JSON.parse(
        localStorage.getItem("baustellen") || "[]"
      );

      if (!Array.isArray(baustellen)) return;

      setProjekte(
        baustellen.map((baustelle: Baustelle) => {
          let anzahl = 0;

          try {
            const dokumente = JSON.parse(
              localStorage.getItem(
                `dokumente-${baustelle.id}`
              ) || "[]"
            );

            anzahl = Array.isArray(dokumente)
              ? dokumente.length
              : 0;
          } catch {
            anzahl = 0;
          }

          return { ...baustelle, anzahl };
        })
      );
    } catch {
      setProjekte([]);
    }
  }, []);

  const gefiltert = useMemo(() => {
    const begriff = suche.trim().toLowerCase();

    if (!begriff) return projekte;

    return projekte.filter((projekt) =>
      [
        projekt.nummer,
        projekt.projektname,
        projekt.ort,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(begriff)
    );
  }, [projekte, suche]);

  const dokumenteGesamt = projekte.reduce(
    (summe, projekt) => summe + projekt.anzahl,
    0
  );

  const mitDokumenten = projekte.filter(
    (projekt) => projekt.anzahl > 0
  ).length;

  return (
    <AppShell
      title="Dokumente"
      subtitle="Alle digitalen Baustellenordner zentral öffnen."
    >
      <section className="bb-document-stats">
        <div className="bb-stat-card">
          <span className="bb-stat-icon neutral">▤</span>
          <div>
            <strong>{dokumenteGesamt}</strong>
            <span>Dokumente gesamt</span>
          </div>
        </div>

        <div className="bb-stat-card">
          <span className="bb-stat-icon green">✓</span>
          <div>
            <strong>{mitDokumenten}</strong>
            <span>Baustellen mit Dokumenten</span>
          </div>
        </div>

        <div className="bb-stat-card">
          <span className="bb-stat-icon blue">▦</span>
          <div>
            <strong>{projekte.length}</strong>
            <span>Baustellenordner</span>
          </div>
        </div>
      </section>

      <section className="bb-card bb-document-panel">
        <header className="bb-document-toolbar">
          <div>
            <span>Digitale Ablage</span>
            <h2>Baustellenordner</h2>
          </div>

          <div className="bb-search">
            <span>⌕</span>
            <input
              value={suche}
              onChange={(event) => setSuche(event.target.value)}
              placeholder="Baustelle oder Ort suchen …"
            />
          </div>
        </header>

        {gefiltert.length === 0 ? (
          <div className="bb-empty-state">
            <div className="bb-empty-icon">▤</div>
            <h2>Noch keine Baustellenordner</h2>
            <p>
              Sobald eine Baustelle erstellt wird, erscheint ihr
              digitaler Dokumentenordner hier.
            </p>
          </div>
        ) : (
          <div className="bb-document-list">
            {gefiltert.map((projekt) => (
              <a
                key={projekt.id}
                href={`/baustellen/${projekt.id}/dokumente`}
                className="bb-document-row"
              >
                <div className="bb-document-icon">▤</div>

                <div className="bb-document-project">
                  <span>
                    {projekt.nummer || "Ohne Baustellen-Nr."}
                  </span>
                  <strong>
                    {projekt.projektname || "Unbenannte Baustelle"}
                  </strong>
                  <small>{projekt.ort || "Ort nicht angegeben"}</small>
                </div>

                <div className="bb-document-count">
                  <strong>{projekt.anzahl}</strong>
                  <span>
                    {projekt.anzahl === 1
                      ? "Dokument"
                      : "Dokumente"}
                  </span>
                </div>

                <span className="bb-project-arrow">›</span>
              </a>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
