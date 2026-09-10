"use client";

import AppShell from "../../../components/ui/AppShell";
import { gespeicherteFreigabe, personenInZone } from "../../../lib/workflow";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type Mitarbeiter = {
  id: string;
  name: string;
};

type GespeicherterMitarbeiter = {
  id?: string | number;
  name?: string;
  vorname?: string;
  nachname?: string;
};

type Zutritt = {
  id: string;
  mitarbeiterId: string;
  name: string;
  typ: "eintritt" | "austritt";
  zeit: string;
  timestamp: string;
  manuell?: boolean;
};

const demoMitarbeiter: Mitarbeiter[] = [
  { id: "m1", name: "Rolf Bächler" },
  { id: "m2", name: "Marco Steiner" },
  { id: "m3", name: "Lukas Baumann" },
  { id: "m4", name: "Arben Krasniqi" },
];

export default function ZonenzutrittPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [mitarbeiter, setMitarbeiter] =
    useState<Mitarbeiter[]>(demoMitarbeiter);

  const [auswahl, setAuswahl] = useState("");
  const [eintraege, setEintraege] = useState<Zutritt[]>([]);
  const [nachtragZeit, setNachtragZeit] = useState("");
  const [nachtragTyp, setNachtragTyp] =
    useState<"eintritt" | "austritt">("eintritt");

  const heute = heuteKey();

  const storageKey = `zonenzutritt-${id}-${heute}`;

  useEffect(() => {
    const gespeichert = localStorage.getItem(storageKey);

    if (gespeichert) {
      setEintraege(JSON.parse(gespeichert));
    }

    const gespeicherteMitarbeiter = localStorage.getItem("mitarbeiter");

    if (gespeicherteMitarbeiter) {
      try {
        const daten = JSON.parse(gespeicherteMitarbeiter);

        if (Array.isArray(daten) && daten.length > 0) {
          const normalisiert = daten.map(
            (m: GespeicherterMitarbeiter, index: number) => {
              const vollerName =
                m.name || `${m.vorname ?? ""} ${m.nachname ?? ""}`.trim();

              return {
                id: String(m.id ?? index),
                name: vollerName || `Mitarbeiter ${index + 1}`,
              };
            }
          );

          setMitarbeiter(normalisiert);
        }
      } catch {}
    }
  }, [storageKey]);

  function speichern(neu: Zutritt[]) {
    setEintraege(neu);
    localStorage.setItem(storageKey, JSON.stringify(neu));
  }

  function buchen(typ: "eintritt" | "austritt") {
    const person = mitarbeiter.find((m) => m.id === auswahl);

    if (!person) {
      alert("Bitte zuerst einen Mitarbeiter auswählen.");
      return;
    }

    if (typ === "eintritt") {
      const freigabe = gespeicherteFreigabe(localStorage, id, heuteKey());
      if (!freigabe.bereit) {
        alert(freigabe.gruende.map((grund) => grund.text).join("\n"));
        return;
      }
    }
    const anwesend = personenInZone(eintraege).includes(person.id);
    if (typ === "eintritt" && anwesend) {
      alert(anwesend ? "Diese Person ist bereits eingecheckt." : "Diese Person ist nicht eingecheckt.");
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

    speichern([neuerEintrag, ...eintraege]);
  }

  function nachtragen() {
    const person = mitarbeiter.find((m) => m.id === auswahl);

    if (!person) {
      alert("Bitte zuerst einen Mitarbeiter auswählen.");
      return;
    }

    if (!nachtragZeit) {
      alert("Bitte eine Uhrzeit eingeben.");
      return;
    }

    if (nachtragTyp === "eintritt") {
      const freigabe = gespeicherteFreigabe(localStorage, id, heuteKey());
      if (!freigabe.bereit) {
        alert(freigabe.gruende.map((grund) => grund.text).join("\n"));
        return;
      }
    }

    const datum = new Date();
    const [stunden, minuten] = nachtragZeit.split(":");

    datum.setHours(Number(stunden), Number(minuten), 0, 0);

    const neuerEintrag: Zutritt = {
      id: crypto.randomUUID(),
      mitarbeiterId: person.id,
      name: person.name,
      typ: nachtragTyp,
      zeit: nachtragZeit,
      timestamp: datum.toISOString(),
      manuell: true,
    };

    speichern([neuerEintrag, ...eintraege]);
    setNachtragZeit("");
  }

  const aktuelleZone = useMemo(() => {
    const ids = personenInZone(eintraege);
    return mitarbeiter.filter((person) => ids.includes(person.id));
  }, [eintraege, mitarbeiter]);

  return (
    <AppShell
      title="Zonenzutritt"
      subtitle="Ein- und Austritte der Sanierungszone dokumentieren."
      backHref={`/baustellen/${id}`}
      backLabel="Zur Baustelle"
    >

      

      <div className="bb-workspace max-w-6xl space-y-5">

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

                {mitarbeiter.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">

              <button
                type="button"
                onClick={() => buchen("eintritt")}
                className="min-w-[150px] rounded-xl bg-[var(--bb-accent)] px-6 py-4 font-semibold text-[var(--bb-on-accent)] hover:bg-[var(--bb-accent-hover)]"
              >
                → Eintritt
              </button>

              <button
                type="button"
                onClick={() => buchen("austritt")}
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

              {mitarbeiter.map((person) => (
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
