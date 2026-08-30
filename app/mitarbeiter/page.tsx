"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/ui/AppShell";

type Mitarbeiter = {
  id: string;
  vorname: string;
  nachname: string;
  funktion: string;
  telefon: string;
  aktiv: boolean;
};

export default function MitarbeiterSeite() {
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([]);
  const [vorname, setVorname] = useState("");
  const [nachname, setNachname] = useState("");
  const [funktion, setFunktion] = useState("Asbestsanierer");
  const [telefon, setTelefon] = useState("");
  const [suche, setSuche] = useState("");
  const [formularOffen, setFormularOffen] = useState(false);

  useEffect(() => {
    try {
      const daten = JSON.parse(
        localStorage.getItem("mitarbeiter") || "[]"
      );
      setMitarbeiter(Array.isArray(daten) ? daten : []);
    } catch {
      setMitarbeiter([]);
    }
  }, []);

  function speichernListe(liste: Mitarbeiter[]) {
    setMitarbeiter(liste);
    localStorage.setItem("mitarbeiter", JSON.stringify(liste));
  }

  function hinzufuegen() {
    if (!vorname.trim() || !nachname.trim()) {
      alert("Bitte Vorname und Nachname eingeben.");
      return;
    }

    const neu: Mitarbeiter = {
      id: crypto.randomUUID(),
      vorname: vorname.trim(),
      nachname: nachname.trim(),
      funktion,
      telefon: telefon.trim(),
      aktiv: true,
    };

    speichernListe([...mitarbeiter, neu]);
    setVorname("");
    setNachname("");
    setTelefon("");
    setFunktion("Asbestsanierer");
    setFormularOffen(false);
  }

  function statusAendern(id: string) {
    speichernListe(
      mitarbeiter.map((person) =>
        person.id === id
          ? { ...person, aktiv: !person.aktiv }
          : person
      )
    );
  }

  function entfernen(id: string) {
    if (!confirm("Mitarbeiter wirklich löschen?")) return;
    speichernListe(
      mitarbeiter.filter((person) => person.id !== id)
    );
  }

  const gefiltert = useMemo(() => {
    const begriff = suche.trim().toLowerCase();

    if (!begriff) return mitarbeiter;

    return mitarbeiter.filter((person) =>
      [
        person.vorname,
        person.nachname,
        person.funktion,
        person.telefon,
      ]
        .join(" ")
        .toLowerCase()
        .includes(begriff)
    );
  }, [mitarbeiter, suche]);

  const aktive = mitarbeiter.filter(
    (person) => person.aktiv
  ).length;

  return (
    <AppShell
      title="Mitarbeiter"
      subtitle="Personalstamm, Funktionen und Einsatzstatus verwalten."
      action={
        <button
          type="button"
          className="bb-primary-button bb-button-link"
          onClick={() => setFormularOffen(!formularOffen)}
        >
          {formularOffen ? "Schliessen" : "＋ Mitarbeiter"}
        </button>
      }
    >
      <section className="bb-employee-stats">
        <div className="bb-stat-card">
          <span className="bb-stat-icon neutral">♧</span>
          <div>
            <strong>{mitarbeiter.length}</strong>
            <span>Mitarbeiter gesamt</span>
          </div>
        </div>

        <div className="bb-stat-card">
          <span className="bb-stat-icon green">✓</span>
          <div>
            <strong>{aktive}</strong>
            <span>Aktiv</span>
          </div>
        </div>

        <div className="bb-stat-card">
          <span className="bb-stat-icon orange">○</span>
          <div>
            <strong>{mitarbeiter.length - aktive}</strong>
            <span>Inaktiv</span>
          </div>
        </div>
      </section>

      {formularOffen && (
        <section className="bb-card bb-employee-form">
          <div className="bb-form-section-header">
            <div className="bb-section-icon blue">＋</div>
            <div>
              <h2>Neuen Mitarbeiter erfassen</h2>
              <p>Personalien und Funktion hinterlegen</p>
            </div>
          </div>

          <div className="bb-grid-4">
            <div className="bb-field">
              <label htmlFor="vorname">Vorname *</label>
              <input
                id="vorname"
                className="bb-input"
                value={vorname}
                onChange={(event) => setVorname(event.target.value)}
                placeholder="Vorname"
              />
            </div>

            <div className="bb-field">
              <label htmlFor="nachname">Nachname *</label>
              <input
                id="nachname"
                className="bb-input"
                value={nachname}
                onChange={(event) => setNachname(event.target.value)}
                placeholder="Nachname"
              />
            </div>

            <div className="bb-field">
              <label htmlFor="funktion">Funktion</label>
              <select
                id="funktion"
                className="bb-select"
                value={funktion}
                onChange={(event) => setFunktion(event.target.value)}
              >
                <option>Asbestsanierer</option>
                <option>Vorarbeiter</option>
                <option>Spezialist Asbestsanierung</option>
                <option>Projektleiter</option>
                <option>Fachbauleiter</option>
                <option>Temporärmitarbeiter</option>
                <option>Andere</option>
              </select>
            </div>

            <div className="bb-field">
              <label htmlFor="telefon">Telefon</label>
              <input
                id="telefon"
                type="tel"
                className="bb-input"
                value={telefon}
                onChange={(event) => setTelefon(event.target.value)}
                placeholder="+41 79 000 00 00"
              />
            </div>
          </div>

          <div className="bb-employee-form-actions">
            <button
              type="button"
              className="bb-secondary-button"
              onClick={() => setFormularOffen(false)}
            >
              Abbrechen
            </button>
            <button
              type="button"
              className="bb-primary-button"
              onClick={hinzufuegen}
            >
              Mitarbeiter speichern
            </button>
          </div>
        </section>
      )}

      <section className="bb-card bb-employee-panel">
        <header className="bb-employee-toolbar">
          <div>
            <span>Personalstamm</span>
            <h2>Alle Mitarbeiter</h2>
          </div>

          <div className="bb-search">
            <span>⌕</span>
            <input
              value={suche}
              onChange={(event) => setSuche(event.target.value)}
              placeholder="Mitarbeiter suchen …"
            />
          </div>
        </header>

        {gefiltert.length === 0 ? (
          <div className="bb-empty-state">
            <div className="bb-empty-icon">♧</div>
            <h2>
              {mitarbeiter.length === 0
                ? "Noch keine Mitarbeiter"
                : "Keine Mitarbeiter gefunden"}
            </h2>
            <p>
              {mitarbeiter.length === 0
                ? "Erfasse die erste Person für Baustellen, Instruktionen und Zonenzutritte."
                : "Passe den Suchbegriff an."}
            </p>
          </div>
        ) : (
          <div className="bb-employee-list">
            {gefiltert.map((person) => (
              <article key={person.id} className="bb-employee-row">
                <div className="bb-employee-avatar">
                  {person.vorname.charAt(0)}
                  {person.nachname.charAt(0)}
                </div>

                <div className="bb-employee-name">
                  <strong>
                    {person.vorname} {person.nachname}
                  </strong>
                  <span>{person.funktion}</span>
                </div>

                <div className="bb-employee-contact">
                  <span>Telefon</span>
                  <strong>{person.telefon || "Nicht hinterlegt"}</strong>
                </div>

                <button
                  type="button"
                  className={`bb-employee-status ${
                    person.aktiv ? "active" : "inactive"
                  }`}
                  onClick={() => statusAendern(person.id)}
                >
                  <i />
                  {person.aktiv ? "Aktiv" : "Inaktiv"}
                </button>

                <button
                  type="button"
                  className="bb-employee-delete"
                  onClick={() => entfernen(person.id)}
                  aria-label={`${person.vorname} löschen`}
                >
                  ×
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
