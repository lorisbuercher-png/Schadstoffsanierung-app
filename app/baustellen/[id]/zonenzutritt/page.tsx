"use client";

import { buchungAblegen, buchungenLesen } from "../../../lib/bookings";
import Link from "next/link";
import { baustellenTeam, zonenPersonen, TeamPerson } from "../../../lib/siteTeam";
import AppShell from "../../../components/ui/AppShell";
import { gespeicherteFreigabe, personenInZone } from "../../../lib/workflow";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type Zutritt = {
  id: string;
  mitarbeiterId: string;
  name: string;
  typ: "eintritt" | "austritt";
  zeit: string;
  timestamp: string;
  manuell?: boolean;
};

export default function ZonenzutrittPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [mitarbeiter, setMitarbeiter] =
    useState<TeamPerson[]>([]);

  const [auswahl, setAuswahl] = useState("");
  const [eintraege, setEintraege] = useState<Zutritt[]>([]);
  const [nachtragZeit, setNachtragZeit] = useState("");
  const [nachtragTyp, setNachtragTyp] =
    useState<"eintritt" | "austritt">("eintritt");

  const [meldung, setMeldung] = useState("");

  const heute = heuteKey();

  const storageKey = `zonenzutritt-${id}-${heute}`;

  useEffect(() => {
    function laden() {
      try {
        setEintraege(buchungenLesen<Zutritt>(localStorage, storageKey));
      } catch {
        setMeldung("Buchungen konnten nicht geladen werden. Bitte die Seite neu laden; bestehende Daten werden nicht überschrieben.");
      }
      try {
        setMitarbeiter(baustellenTeam(localStorage, id));
      } catch {
        setMitarbeiter([]);
        setMeldung("Das Baustellenteam konnte nicht gelesen werden. Bereits anwesende Personen können weiterhin ausgecheckt werden.");
      }
    }
    laden();
    function aktualisieren(event: StorageEvent) {
      if (event.key === null || [storageKey, "mitarbeiter", `baustellen-mitarbeiter-${id}`].includes(event.key)) laden();
    }
    window.addEventListener("storage", aktualisieren);
    return () => window.removeEventListener("storage", aktualisieren);
  }, [storageKey, id]);

  const auswahlPersonen = useMemo(() => zonenPersonen(mitarbeiter, personenInZone(eintraege), eintraege), [mitarbeiter, eintraege]);
  const gewaehltePerson = auswahlPersonen.find(person => person.id === auswahl);

  function speichern(eintrag: Zutritt) {
    try {
      const heuteAktuell = heuteKey();
      if (heuteAktuell !== heute) throw new Error("Der Tag hat gewechselt. Bitte die Seite neu laden.");
      const neu = buchungAblegen(localStorage, `zonenzutritt-${id}-${heuteAktuell}`, eintrag, (aktuell) => {
        if (eintrag.typ === "eintritt") {
          if (!baustellenTeam(localStorage, id).some(person => person.id === eintrag.mitarbeiterId)) throw new Error("Diese Person ist der Baustelle nicht mehr aktiv zugeteilt.");
          const freigabe = gespeicherteFreigabe(localStorage, id, heuteAktuell);
          if (!freigabe.bereit) throw new Error(freigabe.gruende.map(g => g.text).join(" · "));
          if (!eintrag.manuell && personenInZone(aktuell).includes(eintrag.mitarbeiterId)) throw new Error("Diese Person ist bereits eingecheckt.");
        }
      });
      setEintraege(neu);
      setMeldung(`${eintrag.name}: ${eintrag.typ === "eintritt" ? "Eintritt" : "Austritt"} gespeichert.`);
      return true;
    } catch (fehler) {
      setMeldung(`Buchung nicht gespeichert. ${fehler instanceof Error ? fehler.message : "Bitte erneut versuchen."}`);
      return false;
    }
  }

  function buchen(typ: "eintritt" | "austritt") {
    const person = auswahlPersonen.find((m) => m.id === auswahl);

    if (!person) {
      alert("Bitte zuerst einen Mitarbeiter auswählen.");
      return;
    }

    const jetzt = new Date();

    const neuerEintrag: Zutritt = {
      id: crypto.randomUUID(),
      mitarbeiterId: person.id,
      name: person.name,
      typ,
      zeit: jetzt.toLocaleTimeString("de-CH", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: jetzt.toISOString(),
    };

    speichern(neuerEintrag);
  }

  function nachtragen() {
    const person = auswahlPersonen.find((m) => m.id === auswahl);

    if (!person) {
      alert("Bitte zuerst einen Mitarbeiter auswählen.");
      return;
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(nachtragZeit)) {
      alert("Bitte eine Uhrzeit eingeben.");
      return;
    }

    const datum = new Date();
    const [stunden, minuten] = nachtragZeit.split(":");

    datum.setHours(Number(stunden), Number(minuten), 0, 0);

    if (datum.getTime() > Date.now()) {
      setMeldung("Ein Nachtrag darf nicht in der Zukunft liegen.");
      return;
    }

    const neuerEintrag: Zutritt = {
      id: crypto.randomUUID(),
      mitarbeiterId: person.id,
      name: person.name,
      typ: nachtragTyp,
      zeit: nachtragZeit,
      timestamp: datum.toISOString(),
      manuell: true,
    };

    if (speichern(neuerEintrag)) setNachtragZeit("");
  }

  const aktuelleZone = useMemo(() => {
    const ids = personenInZone(eintraege);
    return auswahlPersonen.filter((person) => ids.includes(person.id));
  }, [eintraege, auswahlPersonen]);

  return (
    <AppShell
      title="Zonenzutritt"
      subtitle="Ein- und Austritte der Sanierungszone dokumentieren."
      backHref={`/baustellen/${id}`}
      backLabel="Zur Baustelle"
    >

      

      <div className="bb-workspace max-w-6xl space-y-5">
        {meldung && <p role="status" className="bb-card p-4 text-sm font-semibold">{meldung}</p>}

        <div className="bb-card p-4 text-sm">
          {mitarbeiter.length ? `${mitarbeiter.length} Mitarbeitende der Baustelle zugeteilt.` : "Noch kein aktives Baustellenteam zugeteilt."}
          {" "}<Link href={`/baustellen/${id}/mitarbeiter`} className="font-bold underline">Team zuweisen →</Link>
        </div>
        <section className="rounded-[18px] border border-slate-200 bg-white p-6 text-slate-900">

          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">

            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                MITARBEITER
              </div>

              <label className="mt-2 block text-xl font-semibold">
                Person auswählen
              </label>

              <select
                value={auswahl}
                onChange={(e) => setAuswahl(e.target.value)}
                className="mt-4 w-full rounded-xl border border-white/10 bg-white px-4 py-4 text-base font-bold text-black outline-none"
              >
                <option value="">
                  Mitarbeiter auswählen...
                </option>

                {auswahlPersonen.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}{person.nurAustritt ? " · nur Austritt" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">

              <button
                type="button"
                onClick={() => buchen("eintritt")}
                disabled={!gewaehltePerson || gewaehltePerson.nurAustritt}
                className="min-w-[150px] rounded-xl bg-[var(--bb-accent)] px-6 py-4 font-semibold text-[var(--bb-on-accent)] hover:bg-[var(--bb-accent-hover)]"
              >
                → Eintritt
              </button>

              <button
                type="button"
                onClick={() => buchen("austritt")}
                disabled={!gewaehltePerson}
                className="min-w-[150px] rounded-xl bg-white px-6 py-4 font-semibold text-black hover:bg-slate-100"
              >
                ← Austritt
              </button>

            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">

          <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  LIVE
                </div>

                <h2 className="mt-1 text-xl font-semibold">
                  Aktuell in der Zone
                </h2>
              </div>

              <div className="text-sm font-semibold text-green-600">
                ● {aktuelleZone.length}
              </div>
            </div>

            <div className="mt-5 space-y-3">

              {aktuelleZone.length === 0 && (
                <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                  Aktuell befindet sich niemand in der Zone.
                </div>
              )}

              {aktuelleZone.map((person) => {
                const letzterEintritt = eintraege.find(
                  (e) =>
                    e.mitarbeiterId === person.id &&
                    e.typ === "eintritt"
                );

                return (
                  <div
                    key={person.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-green-200 bg-green-50 p-4"
                  >
                    <div className="flex items-center gap-3">

                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-600 text-xs font-semibold text-white">
                        {person.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>

                      <div>
                        <strong className="block text-sm">
                          {person.name}
                        </strong>

                        <span className="text-xs text-slate-500">
                          Eintritt {letzterEintritt?.zeit ?? "-"}
                        </span>
                      </div>

                    </div>

                    <span className="rounded-full bg-green-600 px-3 py-2 text-xs font-semibold text-white">
                      IN ZONE
                    </span>
                  </div>
                );
              })}

            </div>
          </section>

          <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">

            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                HEUTE
              </div>

              <h2 className="mt-1 text-xl font-semibold">
                Zutrittsprotokoll
              </h2>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">

              {eintraege.length === 0 && (
                <div className="p-6 text-sm text-slate-500">
                  Heute wurden noch keine Ein- oder Austritte erfasst.
                </div>
              )}

              {eintraege.map((eintrag) => (
                <div
                  key={eintrag.id}
                  className="grid grid-cols-[70px_1fr_auto] items-center gap-4 border-b border-slate-100 p-4 last:border-b-0"
                >
                  <strong className="text-sm">
                    {eintrag.zeit}
                  </strong>

                  <div>
                    <strong className="block text-sm">
                      {eintrag.name}
                    </strong>

                    <span className="text-xs text-slate-500">
                      {eintrag.manuell
                        ? "Manuell nachgetragen"
                        : "Direkt erfasst"}
                    </span>
                  </div>

                  <span
                    className={`rounded-full px-3 py-2 text-xs font-semibold ${
                      eintrag.typ === "eintritt"
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {eintrag.typ === "eintritt"
                      ? "→ EINTRITT"
                      : "← AUSTRITT"}
                  </span>
                </div>
              ))}

            </div>
          </section>

        </div>

        <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">

          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              BACKUP
            </div>

            <h2 className="mt-1 text-xl font-semibold">
              Zeit manuell nachtragen
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Falls ein Ein- oder Austritt nicht direkt erfasst wurde.
            </p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">

            <select
              value={auswahl}
              onChange={(e) => setAuswahl(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-[var(--bb-accent)]"
            >
              <option value="">
                Mitarbeiter auswählen...
              </option>

              {auswahlPersonen.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>

            <select
              value={nachtragTyp}
              onChange={(e) =>
                setNachtragTyp(
                  e.target.value as "eintritt" | "austritt"
                )
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-[var(--bb-accent)]"
            >
              <option value="eintritt">Eintritt</option>
              <option value="austritt">Austritt</option>
            </select>

            <input
              type="time"
              value={nachtragZeit}
              onChange={(e) => setNachtragZeit(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-[var(--bb-accent)]"
            />

            <button
              type="button"
              onClick={nachtragen}
              className="rounded-xl bg-[var(--bb-accent)] px-5 py-3 font-semibold text-[var(--bb-on-accent)] hover:bg-[var(--bb-accent-hover)] hover:text-[var(--bb-on-accent)]"
            >
              Nachtragen
            </button>

          </div>
        </section>

        <div className="sticky bottom-4 z-20 rounded-[20px] border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">Zutritte sind automatisch gespeichert</div>
              <div className="mt-0.5 text-xs text-slate-500">
                {aktuelleZone.length} {aktuelleZone.length === 1 ? "Person ist" : "Personen sind"} aktuell in der Zone.
              </div>
            </div>
            <a href={`/baustellen/${id}/journal`} className="bb-primary-button bb-button-link justify-center">
              Weiter zum Journal →
            </a>
          </div>
        </div>

      </div>
    </AppShell>
  );
}

function heuteKey() {
  const heute = new Date();
  const offset = heute.getTimezoneOffset();
  return new Date(heute.getTime() - offset * 60_000).toISOString().slice(0, 10);
}
