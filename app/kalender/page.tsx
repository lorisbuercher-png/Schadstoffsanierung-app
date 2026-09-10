"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import AppShell from "../components/ui/AppShell";


type Ansicht = "monat" | "woche" | "tag";

type EventTyp =
  | "Baustelle"
  | "Kontrolle"
  | "Freimessung"
  | "Gerät"
  | "Sonstiges";

type KalenderEvent = {
  id: string;
  titel: string;
  datum: string;
  uhrzeit?: string;
  typ: EventTyp;
  baustelleId?: string;
  notiz?: string;
  automatisch?: boolean;
};

type Baustelle = {
  id: string;
  nummer?: string;
  projektname?: string;
  startdatum?: string;
  enddatum?: string;
  freimessungDatum?: string;
  suvaKontrolleDatum?: string;
};

const WOCHENTAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function datumKey(datum: Date) {
  const jahr = datum.getFullYear();
  const monat = String(datum.getMonth() + 1).padStart(2, "0");
  const tag = String(datum.getDate()).padStart(2, "0");
  return `${jahr}-${monat}-${tag}`;
}

function automatischeTermine(baustellen: Baustelle[]): KalenderEvent[] {
  const events: KalenderEvent[] = [];

  for (const baustelle of baustellen) {
    const name =
      baustelle.projektname ||
      baustelle.nummer ||
      "Baustelle";

    if (baustelle.startdatum) {
      events.push({
        id: `start-${baustelle.id}`,
        titel: `Baustellenstart: ${name}`,
        datum: baustelle.startdatum,
        typ: "Baustelle",
        baustelleId: baustelle.id,
        automatisch: true,
      });
    }

    if (baustelle.enddatum) {
      events.push({
        id: `ende-${baustelle.id}`,
        titel: `Geplantes Ende: ${name}`,
        datum: baustelle.enddatum,
        typ: "Baustelle",
        baustelleId: baustelle.id,
        automatisch: true,
      });
    }

    if (baustelle.freimessungDatum) {
      events.push({
        id: `freimessung-${baustelle.id}`,
        titel: `Freimessung: ${name}`,
        datum: baustelle.freimessungDatum,
        typ: "Freimessung",
        baustelleId: baustelle.id,
        automatisch: true,
      });
    }

    if (baustelle.suvaKontrolleDatum) {
      events.push({
        id: `suva-${baustelle.id}`,
        titel: `SUVA-Kontrolle: ${name}`,
        datum: baustelle.suvaKontrolleDatum,
        typ: "Kontrolle",
        baustelleId: baustelle.id,
        automatisch: true,
      });
    }
  }

  return events;
}

export default function KalenderPage() {
  const heute = useMemo(() => new Date(), []);
  const [ansicht, setAnsicht] = useState<Ansicht>("monat");
  const [ansichtDatum, setAnsichtDatum] = useState(
    new Date(heute.getFullYear(), heute.getMonth(), 1)
  );
  const [auswahl, setAuswahl] = useState(datumKey(heute));
  const [events, setEvents] = useState<KalenderEvent[]>([]);
  const [baustellen, setBaustellen] = useState<Baustelle[]>([]);
  const [formularOffen, setFormularOffen] = useState(false);

  const [titel, setTitel] = useState("");
  const [datum, setDatum] = useState(datumKey(heute));
  const [uhrzeit, setUhrzeit] = useState("");
  const [typ, setTyp] = useState<EventTyp>("Baustelle");
  const [baustelleId, setBaustelleId] = useState("");
  const [notiz, setNotiz] = useState("");

  useEffect(() => {
    try {
      const gespeicherteEvents = JSON.parse(
        localStorage.getItem("kalender-events") || "[]"
      );
      const gespeicherteBaustellen = JSON.parse(
        localStorage.getItem("baustellen") || "[]"
      );

      setEvents(
        Array.isArray(gespeicherteEvents)
          ? gespeicherteEvents
          : []
      );
      setBaustellen(
        Array.isArray(gespeicherteBaustellen)
          ? gespeicherteBaustellen
          : []
      );
    } catch {
      setEvents([]);
      setBaustellen([]);
    }
  }, []);

  const alleEvents = useMemo(
    () => [...automatischeTermine(baustellen), ...events],
    [baustellen, events]
  );

  const kalendertage = useMemo(() => {
    const jahr = ansichtDatum.getFullYear();
    const monat = ansichtDatum.getMonth();
    const ersterTag = new Date(jahr, monat, 1);
    const startOffset = (ersterTag.getDay() + 6) % 7;
    const start = new Date(jahr, monat, 1 - startOffset);

    return Array.from({ length: 42 }, (_, index) => {
      const tag = new Date(start);
      tag.setDate(start.getDate() + index);

      return {
        datum: tag,
        key: datumKey(tag),
        aktuellerMonat: tag.getMonth() === monat,
      };
    });
  }, [ansichtDatum]);

  const wochentage = useMemo(() => {
    const start = new Date(ansichtDatum);
    const offset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - offset);

    return Array.from({ length: 7 }, (_, index) => {
      const tag = new Date(start);
      tag.setDate(start.getDate() + index);

      return {
        datum: tag,
        key: datumKey(tag),
        aktuellerMonat:
          tag.getMonth() === ansichtDatum.getMonth(),
      };
    });
  }, [ansichtDatum]);

  const sichtbareTage = useMemo(() => {
    if (ansicht === "monat") return kalendertage;
    if (ansicht === "woche") return wochentage;

    const tag = new Date(`${auswahl}T12:00:00`);

    return [
      {
        datum: tag,
        key: auswahl,
        aktuellerMonat: true,
      },
    ];
  }, [ansicht, kalendertage, wochentage, auswahl]);

  const ausgewaehlteEvents = alleEvents
    .filter((event) => event.datum === auswahl)
    .sort((a, b) =>
      (a.uhrzeit || "99:99").localeCompare(b.uhrzeit || "99:99")
    );

  function zeitraumWechseln(richtung: number) {
    setAnsichtDatum((aktuell) => {
      const neu = new Date(aktuell);

      if (ansicht === "monat") {
        neu.setMonth(neu.getMonth() + richtung, 1);
      } else if (ansicht === "woche") {
        neu.setDate(neu.getDate() + 7 * richtung);
      } else {
        neu.setDate(neu.getDate() + richtung);
        setAuswahl(datumKey(neu));
      }

      return neu;
    });
  }

  function ansichtWaehlen(neu: Ansicht) {
    setAnsicht(neu);

    const ausgewaehlt = new Date(`${auswahl}T12:00:00`);
    setAnsichtDatum(ausgewaehlt);
  }

  function zuHeute() {
    setAnsichtDatum(new Date(heute));
    setAuswahl(datumKey(heute));
  }

  function formularOeffnen(datumKeyWert = auswahl) {
    setDatum(datumKeyWert);
    setTitel("");
    setUhrzeit("");
    setTyp("Baustelle");
    setBaustelleId("");
    setNotiz("");
    setFormularOffen(true);
  }

  function speichern(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!titel.trim() || !datum) return;

    const neuerTermin: KalenderEvent = {
      id: crypto.randomUUID(),
      titel: titel.trim(),
      datum,
      uhrzeit,
      typ,
      baustelleId: baustelleId || undefined,
      notiz: notiz.trim() || undefined,
    };

    const neu = [...events, neuerTermin];
    setEvents(neu);
    localStorage.setItem("kalender-events", JSON.stringify(neu));
    setAuswahl(datum);
    setFormularOffen(false);
  }

  function loeschen(id: string) {
    const neu = events.filter((event) => event.id !== id);
    setEvents(neu);
    localStorage.setItem("kalender-events", JSON.stringify(neu));
  }

  const monatsname = ansichtDatum.toLocaleDateString("de-CH", {
    month: "long",
    year: "numeric",
  });

  const wochenStart = wochentage[0].datum;
  const wochenEnde = wochentage[6].datum;

  const zeitraumTitel =
    ansicht === "monat"
      ? monatsname
      : ansicht === "woche"
      ? `${wochenStart.toLocaleDateString("de-CH", {
          day: "numeric",
          month: "short",
        })} – ${wochenEnde.toLocaleDateString("de-CH", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}`
      : new Date(`${auswahl}T12:00:00`).toLocaleDateString(
          "de-CH",
          {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          }
        );

  const auswahlText = new Date(
    `${auswahl}T12:00:00`
  ).toLocaleDateString("de-CH", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <AppShell
      title="Kalender"
      subtitle="Baustellentermine, Kontrollen und Freimessungen."
      action={
        <button
          className="bb-primary-button bb-button-link"
          type="button"
          onClick={() => formularOeffnen()}
        >
          ＋ Neuer Termin
        </button>
      }
    >
      <section className="bb-calendar-layout">
        <div className="bb-card bb-calendar">
          <header className="bb-calendar-toolbar">
            <div className="bb-calendar-navigation">
              <button type="button" onClick={() => zeitraumWechseln(-1)}>
                ‹
              </button>
              <button type="button" onClick={() => zeitraumWechseln(1)}>
                ›
              </button>
              <button
                type="button"
                className="today"
                onClick={zuHeute}
              >
                Heute
              </button>
            </div>

            <h2>{zeitraumTitel}</h2>

            <div className="bb-calendar-view-switch">
              <button
                type="button"
                className={ansicht === "monat" ? "active" : ""}
                onClick={() => ansichtWaehlen("monat")}
              >
                Monat
              </button>

              <button
                type="button"
                className={ansicht === "woche" ? "active" : ""}
                onClick={() => ansichtWaehlen("woche")}
              >
                Woche
              </button>

              <button
                type="button"
                className={ansicht === "tag" ? "active" : ""}
                onClick={() => ansichtWaehlen("tag")}
              >
                Tag
              </button>
            </div>
          </header>

          {ansicht !== "tag" && (
            <div className="bb-calendar-weekdays">
              {WOCHENTAGE.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          )}

          <div className={`bb-calendar-grid ${ansicht}`}>
            {sichtbareTage.map((tag) => {
              const tagesEvents = alleEvents.filter(
                (event) => event.datum === tag.key
              );

              const eventLimit =
                ansicht === "monat" ? 3 : 10;

              return (
                <button
                  key={tag.key}
                  type="button"
                  className={[
                    "bb-calendar-day",
                    !tag.aktuellerMonat ? "muted" : "",
                    tag.key === datumKey(heute) ? "today" : "",
                    tag.key === auswahl ? "selected" : "",
                  ].join(" ")}
                  onClick={() => setAuswahl(tag.key)}
                  onDoubleClick={() => formularOeffnen(tag.key)}
                >
                  <span className="bb-calendar-number">
                    {tag.datum.getDate()}
                  </span>

                  <span className="bb-calendar-events">
                    {tagesEvents.slice(0, eventLimit).map((event) => (
                      <span
                        key={event.id}
                        className={`bb-calendar-event ${event.typ.toLowerCase()}`}
                      >
                        {event.uhrzeit && <b>{event.uhrzeit}</b>}
                        {event.titel}
                      </span>
                    ))}

                    {tagesEvents.length > eventLimit && (
                      <small>
                        + {tagesEvents.length - eventLimit} weitere
                      </small>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="bb-card bb-calendar-agenda">
          <div className="bb-agenda-header">
            <div>
              <span>Ausgewählter Tag</span>
              <h3>{auswahlText}</h3>
            </div>

            <button
              type="button"
              onClick={() => formularOeffnen(auswahl)}
              aria-label="Termin hinzufügen"
            >
              ＋
            </button>
          </div>

          {ausgewaehlteEvents.length === 0 ? (
            <div className="bb-agenda-empty">
              <span>□</span>
              <strong>Keine Termine</strong>
              <p>Für diesen Tag ist noch nichts eingetragen.</p>
            </div>
          ) : (
            <div className="bb-agenda-list">
              {ausgewaehlteEvents.map((event) => (
                <article
                  key={event.id}
                  className={`bb-agenda-event ${event.typ.toLowerCase()}`}
                >
                  <i />
                  <div>
                    <span>
                      {event.uhrzeit || "Ganztägig"} · {event.typ}
                    </span>
                    <strong>{event.titel}</strong>
                    {event.notiz && <p>{event.notiz}</p>}
                  </div>

                  {!event.automatisch && (
                    <button
                      type="button"
                      onClick={() => loeschen(event.id)}
                      aria-label="Termin löschen"
                    >
                      ×
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </aside>
      </section>

      {formularOffen && (
        <div
          className="bb-calendar-modal-backdrop"
          onMouseDown={() => setFormularOffen(false)}
        >
          <form
            className="bb-calendar-modal"
            onSubmit={speichern}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>Kalender</span>
                <h2>Neuer Termin</h2>
              </div>
              <button
                type="button"
                onClick={() => setFormularOffen(false)}
              >
                ×
              </button>
            </header>

            <div className="bb-field">
              <label htmlFor="termin-titel">Titel *</label>
              <input
                id="termin-titel"
                className="bb-input"
                value={titel}
                onChange={(event) => setTitel(event.target.value)}
                placeholder="z. B. Freimessung Haus 111"
                autoFocus
                required
              />
            </div>

            <div className="bb-grid-2">
              <div className="bb-field">
                <label htmlFor="termin-datum">Datum *</label>
                <input
                  id="termin-datum"
                  type="date"
                  className="bb-input"
                  value={datum}
                  onChange={(event) => setDatum(event.target.value)}
                  required
                />
              </div>

              <div className="bb-field">
                <label htmlFor="termin-zeit">Uhrzeit</label>
                <input
                  id="termin-zeit"
                  type="time"
                  className="bb-input"
                  value={uhrzeit}
                  onChange={(event) => setUhrzeit(event.target.value)}
                />
              </div>
            </div>

            <div className="bb-grid-2">
              <div className="bb-field">
                <label htmlFor="termin-typ">Terminart</label>
                <select
                  id="termin-typ"
                  className="bb-select"
                  value={typ}
                  onChange={(event) =>
                    setTyp(event.target.value as EventTyp)
                  }
                >
                  <option>Baustelle</option>
                  <option>Kontrolle</option>
                  <option>Freimessung</option>
                  <option>Gerät</option>
                  <option>Sonstiges</option>
                </select>
              </div>

              <div className="bb-field">
                <label htmlFor="termin-baustelle">Baustelle</label>
                <select
                  id="termin-baustelle"
                  className="bb-select"
                  value={baustelleId}
                  onChange={(event) =>
                    setBaustelleId(event.target.value)
                  }
                >
                  <option value="">Keine Zuordnung</option>
                  {baustellen.map((baustelle) => (
                    <option key={baustelle.id} value={baustelle.id}>
                      {baustelle.nummer
                        ? `${baustelle.nummer} · `
                        : ""}
                      {baustelle.projektname || "Unbenannte Baustelle"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bb-field">
              <label htmlFor="termin-notiz">Notiz</label>
              <textarea
                id="termin-notiz"
                className="bb-textarea"
                value={notiz}
                onChange={(event) => setNotiz(event.target.value)}
                placeholder="Optionale Bemerkung"
              />
            </div>

            <footer>
              <button
                type="button"
                className="bb-secondary-button"
                onClick={() => setFormularOffen(false)}
              >
                Abbrechen
              </button>
              <button type="submit" className="bb-primary-button">
                Termin speichern
              </button>
            </footer>
          </form>
        </div>
      )}
    </AppShell>
  );
}
