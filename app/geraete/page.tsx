"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/ui/AppShell";

type Baustelle = {
  id: string;
  nummer?: string;
  projektname?: string;
  ort?: string;
};

type Geraet = {
  id: string;
  nummer?: string;
  typ?: string;
  bezeichnung?: string;
  hersteller?: string;
  seriennummer?: string;
  naechstePruefung?: string;
};

type ProjektGeraet = Geraet & {
  baustelleId: string;
  baustelle: string;
  baustellenNummer: string;
};

function status(geraet: Geraet) {
  if (!geraet.naechstePruefung) {
    return { label: "Prüfung fehlt", klasse: "expired" };
  }

  const heute = new Date();
  heute.setHours(0, 0, 0, 0);

  const pruefung = new Date(
    `${geraet.naechstePruefung}T00:00:00`
  );

  const tage = Math.ceil(
    (pruefung.getTime() - heute.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (tage < 0) {
    return { label: "Abgelaufen", klasse: "expired" };
  }

  if (tage <= 30) {
    return {
      label: `${tage} Tage`,
      klasse: "warning",
    };
  }

  return { label: "Gültig", klasse: "valid" };
}

export default function GeraeteUebersicht() {
  const [geraete, setGeraete] = useState<ProjektGeraet[]>([]);
  const [suche, setSuche] = useState("");

  useEffect(() => {
    try {
      const baustellen = JSON.parse(
        localStorage.getItem("baustellen") || "[]"
      );

      if (!Array.isArray(baustellen)) return;

      const alle: ProjektGeraet[] = [];

      for (const baustelle of baustellen as Baustelle[]) {
        try {
          const liste = JSON.parse(
            localStorage.getItem(
              `geraete-${baustelle.id}`
            ) || "[]"
          );

          if (!Array.isArray(liste)) continue;

          for (const geraet of liste as Geraet[]) {
            alle.push({
              ...geraet,
              baustelleId: baustelle.id,
              baustelle:
                baustelle.projektname ||
                "Unbenannte Baustelle",
              baustellenNummer:
                baustelle.nummer ||
                "Ohne Baustellen-Nr.",
            });
          }
        } catch {}
      }

      setGeraete(alle);
    } catch {
      setGeraete([]);
    }
  }, []);

  const gefiltert = useMemo(() => {
    const begriff = suche.trim().toLowerCase();

    if (!begriff) return geraete;

    return geraete.filter((geraet) =>
      [
        geraet.nummer,
        geraet.typ,
        geraet.bezeichnung,
        geraet.hersteller,
        geraet.seriennummer,
        geraet.baustelle,
        geraet.baustellenNummer,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(begriff)
    );
  }, [geraete, suche]);

  const abgelaufen = geraete.filter(
    (geraet) => status(geraet).klasse === "expired"
  ).length;

  const baldFaellig = geraete.filter(
    (geraet) => status(geraet).klasse === "warning"
  ).length;

  const gueltig = geraete.filter(
    (geraet) => status(geraet).klasse === "valid"
  ).length;

  return (
    <AppShell
      title="Geräte"
      subtitle="Gerätebestand und Prüftermine aller Baustellen."
    >
      <section className="bb-equipment-stats">
        <div className="bb-stat-card">
          <span className="bb-stat-icon neutral">⚙</span>
          <div>
            <strong>{geraete.length}</strong>
            <span>Geräte im Einsatz</span>
          </div>
        </div>

        <div className="bb-stat-card">
          <span className="bb-stat-icon green">✓</span>
          <div>
            <strong>{gueltig}</strong>
            <span>Prüfung gültig</span>
          </div>
        </div>

        <div className="bb-stat-card">
          <span className="bb-stat-icon orange">!</span>
          <div>
            <strong>{baldFaellig}</strong>
            <span>Bald fällig</span>
          </div>
        </div>

        <div className="bb-stat-card">
          <span className="bb-stat-icon red">×</span>
          <div>
            <strong>{abgelaufen}</strong>
            <span>Abgelaufen / fehlt</span>
          </div>
        </div>
      </section>

      <section className="bb-card bb-equipment-panel">
        <header className="bb-equipment-toolbar">
          <div>
            <span>Geräteverwaltung</span>
            <h2>Gesamter Gerätebestand</h2>
          </div>

          <div className="bb-search">
            <span>⌕</span>
            <input
              value={suche}
              onChange={(event) => setSuche(event.target.value)}
              placeholder="Gerät, Nummer oder Baustelle suchen …"
            />
          </div>
        </header>

        {gefiltert.length === 0 ? (
          <div className="bb-empty-state">
            <div className="bb-empty-icon">⚙</div>
            <h2>Noch keine Geräte erfasst</h2>
            <p>
              Geräte werden innerhalb einer Baustelle erfasst und
              erscheinen danach automatisch hier.
            </p>
          </div>
        ) : (
          <div className="bb-equipment-list">
            {gefiltert.map((geraet) => {
              const pruefstatus = status(geraet);

              return (
                <a
                  key={`${geraet.baustelleId}-${geraet.id}`}
                  href={`/baustellen/${geraet.baustelleId}/geraete`}
                  className="bb-equipment-row"
                >
                  <div className="bb-equipment-icon">⚙</div>

                  <div className="bb-equipment-name">
                    <span>
                      {geraet.nummer || "Ohne Gerätenummer"}
                    </span>
                    <strong>
                      {geraet.bezeichnung || "Unbenanntes Gerät"}
                    </strong>
                    <small>
                      {geraet.typ || "Gerät"}
                      {geraet.hersteller
                        ? ` · ${geraet.hersteller}`
                        : ""}
                    </small>
                  </div>

                  <div className="bb-equipment-project">
                    <span>{geraet.baustellenNummer}</span>
                    <strong>{geraet.baustelle}</strong>
                  </div>

                  <div
                    className={`bb-equipment-status ${pruefstatus.klasse}`}
                  >
                    <i />
                    {pruefstatus.label}
                  </div>

                  <span className="bb-project-arrow">›</span>
                </a>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}
