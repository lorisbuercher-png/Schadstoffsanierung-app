"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "../../components/ui/AppShell";

type Formular = {
  nummer: string;
  projektname: string;
  auftraggeber: string;
  ansprechpartner: string;
  telefon: string;
  email: string;
  adresse: string;
  plz: string;
  ort: string;
  startdatum: string;
  enddatum: string;
  freimessungDatum: string;
  suvaKontrolleDatum: string;
  sanierungsart: string;
  verantwortlich: string;
};

const startFormular: Formular = {
  nummer: "",
  projektname: "",
  auftraggeber: "",
  ansprechpartner: "",
  telefon: "",
  email: "",
  adresse: "",
  plz: "",
  ort: "",
  startdatum: "",
  enddatum: "",
  freimessungDatum: "",
  suvaKontrolleDatum: "",
  sanierungsart: "Asbestsanierung",
  verantwortlich: "",
};

export default function NeueBaustelle() {
  const router = useRouter();
  const [form, setForm] = useState<Formular>(startFormular);
  const [fehler, setFehler] = useState("");
  const [speichert, setSpeichert] = useState(false);

  function updateField(name: keyof Formular, value: string) {
    setForm((aktuell) => ({ ...aktuell, [name]: value }));
    if (fehler) setFehler("");
  }

  function speichern(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.projektname.trim()) {
      setFehler("Bitte gib einen Projektnamen ein.");
      return;
    }

    if (!form.ort.trim()) {
      setFehler("Bitte gib den Ort der Baustelle ein.");
      return;
    }

    setSpeichert(true);

    try {
      const vorhandene = JSON.parse(
        localStorage.getItem("baustellen") || "[]"
      );

      const id = Date.now().toString();

      const neueBaustelle = {
        id,
        ...form,
        nummer:
          form.nummer.trim() ||
          `BS-${new Date().getFullYear()}-${String(
            vorhandene.length + 1
          ).padStart(3, "0")}`,
        status: "In Vorbereitung",
        fortschritt: 0,
        erstelltAm: new Date().toISOString(),
        checklisten: [
          { code: "AS1", name: "Auftrag Sanierung", status: "Offen" },
          { code: "AS2", name: "Grünes Licht", status: "Offen" },
          {
            code: "AS3",
            name: "Visuelle Kontrolle nach Sanierung",
            status: "Offen",
          },
          { code: "AS4", name: "PSA Kontrolle", status: "Offen" },
          {
            code: "AS5",
            name: "Instruktion Mitarbeiter",
            status: "Offen",
          },
          { code: "AS6", name: "Sanierungsplan", status: "Offen" },
          {
            code: "AS7",
            name: "Erstinstruktion Asbest",
            status: "Offen",
          },
          { code: "AS8", name: "Plausibilität", status: "Offen" },
          { code: "AS9", name: "Baustellen-Journal", status: "Offen" },
          {
            code: "AS10",
            name: "Visuelle Kontrolle",
            status: "Offen",
          },
        ],
      };

      localStorage.setItem(
        "baustellen",
        JSON.stringify([...vorhandene, neueBaustelle])
      );

      router.push(`/baustellen/${id}`);
    } catch {
      setSpeichert(false);
      setFehler("Die Baustelle konnte nicht gespeichert werden.");
    }
  }

  return (
    <AppShell
      title="Neue Baustelle"
      subtitle="Projektinformationen erfassen und Sanierungsprozess starten."
      backHref="/baustellen"
      backLabel="Baustellen"
    >
      <form onSubmit={speichern} className="bb-create-layout">
        <div className="bb-create-main">
          {fehler && (
            <div className="bb-form-alert">
              <span>!</span>
              {fehler}
            </div>
          )}

          <section className="bb-card bb-form-section">
            <div className="bb-form-section-header">
              <div className="bb-section-icon orange">1</div>
              <div>
                <h2>Projektinformationen</h2>
                <p>Grundangaben und interne Baustellennummer</p>
              </div>
            </div>

            <div className="bb-grid-2">
              <div className="bb-field">
                <label htmlFor="nummer">Baustellen-Nr.</label>
                <input
                  id="nummer"
                  className="bb-input"
                  value={form.nummer}
                  onChange={(e) => updateField("nummer", e.target.value)}
                  placeholder="Wird automatisch vergeben"
                />
              </div>

              <div className="bb-field">
                <label htmlFor="projektname">
                  Projektname <em>*</em>
                </label>
                <input
                  id="projektname"
                  className="bb-input"
                  value={form.projektname}
                  onChange={(e) =>
                    updateField("projektname", e.target.value)
                  }
                  placeholder="z. B. Wohnüberbauung Musterweg"
                  required
                />
              </div>

              <div className="bb-field">
                <label htmlFor="sanierungsart">Sanierungsart</label>
                <select
                  id="sanierungsart"
                  className="bb-select"
                  value={form.sanierungsart}
                  onChange={(e) =>
                    updateField("sanierungsart", e.target.value)
                  }
                >
                  <option>Asbestsanierung</option>
                  <option>PCB-Sanierung</option>
                  <option>PAK-Sanierung</option>
                  <option>Schimmelsanierung</option>
                  <option>Schadstoffsanierung</option>
                  <option>Rückbau</option>
                </select>
              </div>

              <div className="bb-field">
                <label htmlFor="verantwortlich">Projektverantwortlich</label>
                <input
                  id="verantwortlich"
                  className="bb-input"
                  value={form.verantwortlich}
                  onChange={(e) =>
                    updateField("verantwortlich", e.target.value)
                  }
                  placeholder="Name der verantwortlichen Person"
                />
              </div>
            </div>
          </section>

          <section className="bb-card bb-form-section">
            <div className="bb-form-section-header">
              <div className="bb-section-icon blue">2</div>
              <div>
                <h2>Auftraggeber</h2>
                <p>Kunde und Kontaktperson des Projekts</p>
              </div>
            </div>

            <div className="bb-grid-2">
              <div className="bb-field">
                <label htmlFor="auftraggeber">Firma / Auftraggeber</label>
                <input
                  id="auftraggeber"
                  className="bb-input"
                  value={form.auftraggeber}
                  onChange={(e) =>
                    updateField("auftraggeber", e.target.value)
                  }
                  placeholder="Firma oder Privatperson"
                />
              </div>

              <div className="bb-field">
                <label htmlFor="ansprechpartner">Ansprechperson</label>
                <input
                  id="ansprechpartner"
                  className="bb-input"
                  value={form.ansprechpartner}
                  onChange={(e) =>
                    updateField("ansprechpartner", e.target.value)
                  }
                  placeholder="Vorname und Nachname"
                />
              </div>

              <div className="bb-field">
                <label htmlFor="telefon">Telefon</label>
                <input
                  id="telefon"
                  type="tel"
                  className="bb-input"
                  value={form.telefon}
                  onChange={(e) => updateField("telefon", e.target.value)}
                  placeholder="+41 79 000 00 00"
                />
              </div>

              <div className="bb-field">
                <label htmlFor="email">E-Mail</label>
                <input
                  id="email"
                  type="email"
                  className="bb-input"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="name@firma.ch"
                />
              </div>
            </div>
          </section>

          <section className="bb-card bb-form-section">
            <div className="bb-form-section-header">
              <div className="bb-section-icon green">3</div>
              <div>
                <h2>Standort</h2>
                <p>Adresse des Sanierungsobjekts</p>
              </div>
            </div>

            <div className="bb-address-grid">
              <div className="bb-field bb-address-wide">
                <label htmlFor="adresse">Strasse und Hausnummer</label>
                <input
                  id="adresse"
                  className="bb-input"
                  value={form.adresse}
                  onChange={(e) => updateField("adresse", e.target.value)}
                  placeholder="Musterstrasse 12"
                />
              </div>

              <div className="bb-field">
                <label htmlFor="plz">PLZ</label>
                <input
                  id="plz"
                  className="bb-input"
                  value={form.plz}
                  onChange={(e) => updateField("plz", e.target.value)}
                  placeholder="6003"
                  inputMode="numeric"
                />
              </div>

              <div className="bb-field">
                <label htmlFor="ort">
                  Ort <em>*</em>
                </label>
                <input
                  id="ort"
                  className="bb-input"
                  value={form.ort}
                  onChange={(e) => updateField("ort", e.target.value)}
                  placeholder="Luzern"
                  required
                />
              </div>
            </div>
          </section>

          <section className="bb-card bb-form-section">
            <div className="bb-form-section-header">
              <div className="bb-section-icon neutral">4</div>
              <div>
                <h2>Terminplanung</h2>
                <p>Vorgesehener Zeitraum der Ausführung</p>
              </div>
            </div>

            <div className="bb-grid-2">
              <div className="bb-field">
                <label htmlFor="startdatum">Geplanter Start</label>
                <input
                  id="startdatum"
                  type="date"
                  className="bb-input"
                  value={form.startdatum}
                  onChange={(e) =>
                    updateField("startdatum", e.target.value)
                  }
                />
              </div>

              <div className="bb-field">
                <label htmlFor="enddatum">Geplantes Ende</label>
                <input
                  id="enddatum"
                  type="date"
                  className="bb-input"
                  value={form.enddatum}
                  min={form.startdatum}
                  onChange={(e) =>
                    updateField("enddatum", e.target.value)
                  }
                />
              </div>

              <div className="bb-field">
                <label htmlFor="freimessungDatum">
                  Geplante Freimessung
                </label>
                <input
                  id="freimessungDatum"
                  type="date"
                  className="bb-input"
                  value={form.freimessungDatum}
                  onChange={(e) =>
                    updateField("freimessungDatum", e.target.value)
                  }
                />
              </div>

              <div className="bb-field">
                <label htmlFor="suvaKontrolleDatum">
                  SUVA-Kontrolle
                </label>
                <input
                  id="suvaKontrolleDatum"
                  type="date"
                  className="bb-input"
                  value={form.suvaKontrolleDatum}
                  onChange={(e) =>
                    updateField("suvaKontrolleDatum", e.target.value)
                  }
                />
              </div>
            </div>
          </section>
        </div>

        <aside className="bb-create-sidebar">
          <section className="bb-card bb-create-summary">
            <span className="bb-summary-label">Neue Baustelle</span>
            <h3>{form.projektname || "Projektname"}</h3>

            <dl>
              <div>
                <dt>Nummer</dt>
                <dd>{form.nummer || "Automatisch"}</dd>
              </div>
              <div>
                <dt>Ort</dt>
                <dd>{form.ort || "Noch offen"}</dd>
              </div>
              <div>
                <dt>Sanierungsart</dt>
                <dd>{form.sanierungsart}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <span className="bb-summary-status">
                    <i />
                    In Vorbereitung
                  </span>
                </dd>
              </div>
            </dl>

            <div className="bb-summary-note">
              Nach dem Speichern werden die Projektübersicht und alle
              Checklisten AS1–AS10 angelegt.
            </div>
          </section>
        </aside>

        <div className="bb-form-footer">
          <Link href="/baustellen" className="bb-secondary-button bb-button-link">
            Abbrechen
          </Link>

          <button
            type="submit"
            className="bb-primary-button"
            disabled={speichert}
          >
            {speichert ? "Wird gespeichert …" : "Baustelle erstellen →"}
          </button>
        </div>
      </form>
    </AppShell>
  );
}
