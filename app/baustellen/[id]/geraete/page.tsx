"use client";

import AppShell from "../../../components/ui/AppShell";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type GeraeteTyp =
  | "UHG"
  | "Asbestsauger"
  | "Wassermanagement"
  | "Luftmessgerät"
  | "Sonstiges";

type Geraet = {
  id: string;
  nummer: string;
  typ: GeraeteTyp;
  bezeichnung: string;
  hersteller: string;
  seriennummer: string;
  letztePruefung: string;
  naechstePruefung: string;
  bemerkung: string;
};

export default function GeraetePage() {
  const params = useParams();
  const id = params.id as string;

  const [geraete, setGeraete] = useState<Geraet[]>([]);
  const [formularOffen, setFormularOffen] = useState(false);

  const [nummer, setNummer] = useState("");
  const [typ, setTyp] = useState<GeraeteTyp>("UHG");
  const [bezeichnung, setBezeichnung] = useState("");
  const [hersteller, setHersteller] = useState("");
  const [seriennummer, setSeriennummer] = useState("");
  const [letztePruefung, setLetztePruefung] = useState("");
  const [naechstePruefung, setNaechstePruefung] = useState("");
  const [bemerkung, setBemerkung] = useState("");

  const storageKey = `geraete-${id}`;

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);

    if (raw) {
      try {
        const daten = JSON.parse(raw);
        if (Array.isArray(daten)) setGeraete(daten);
      } catch {}
    }
  }, [storageKey]);

  function speichern(neu: Geraet[]) {
    setGeraete(neu);
    localStorage.setItem(storageKey, JSON.stringify(neu));
  }

  function geraetErstellen() {
    if (!nummer.trim() || !bezeichnung.trim()) {
      alert("Bitte Gerätenummer und Bezeichnung eingeben.");
      return;
    }

    const neu: Geraet = {
      id: crypto.randomUUID(),
      nummer: nummer.trim(),
      typ,
      bezeichnung: bezeichnung.trim(),
      hersteller: hersteller.trim(),
      seriennummer: seriennummer.trim(),
      letztePruefung,
      naechstePruefung,
      bemerkung: bemerkung.trim(),
    };

    speichern([neu, ...geraete]);

    setNummer("");
    setTyp("UHG");
    setBezeichnung("");
    setHersteller("");
    setSeriennummer("");
    setLetztePruefung("");
    setNaechstePruefung("");
    setBemerkung("");
    setFormularOffen(false);
  }

  function loeschen(geraetId: string) {
    const ok = confirm("Gerät wirklich entfernen?");
    if (!ok) return;

    speichern(geraete.filter((g) => g.id !== geraetId));
  }

  function pruefstatus(geraet: Geraet) {
    if (!geraet.naechstePruefung) {
      return {
        label: "Prüfung fehlt",
        farbe: "rot",
        tage: null,
      };
    }

    const heute = new Date();
    heute.setHours(0, 0, 0, 0);

    const pruefung = new Date(
      `${geraet.naechstePruefung}T00:00:00`
    );

    const diff = Math.ceil(
      (pruefung.getTime() - heute.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (diff < 0) {
      return {
        label: "Prüfung abgelaufen",
        farbe: "rot",
        tage: diff,
      };
    }

    if (diff <= 30) {
      return {
        label: `Fällig in ${diff} Tagen`,
        farbe: "gelb",
        tage: diff,
      };
    }

    return {
      label: "Prüfung gültig",
      farbe: "gruen",
      tage: diff,
    };
  }

  const abgelaufen = useMemo(
    () =>
      geraete.filter(
        (g) => pruefstatus(g).farbe === "rot"
      ).length,
    [geraete]
  );

  const baldFaellig = useMemo(
    () =>
      geraete.filter(
        (g) => pruefstatus(g).farbe === "gelb"
      ).length,
    [geraete]
  );

  const gueltig = useMemo(
    () =>
      geraete.filter(
        (g) => pruefstatus(g).farbe === "gruen"
      ).length,
    [geraete]
  );

  return (
    <AppShell
      title="Geräte"
      subtitle="Geräteeinsatz und Prüftermine überwachen."
      backHref={`/baustellen/${id}`}
      backLabel="Zur Baustelle"
    >

      

      <div className="bb-workspace max-w-6xl space-y-5">

        <section className="grid gap-4 sm:grid-cols-4">

          <div className="rounded-[18px] border border-slate-200 bg-white p-5 text-slate-900">
            <span className="text-xs text-slate-500">
              Geräte
            </span>
            <strong className="mt-2 block text-3xl">
              {geraete.length}
            </strong>
          </div>

          <div className="rounded-[22px] border border-green-200 bg-green-50 p-5">
            <span className="text-xs text-green-700">
              Prüfung gültig
            </span>
            <strong className="mt-2 block text-3xl text-green-700">
              {gueltig}
            </strong>
          </div>

          <div className="rounded-[22px] border border-[var(--bb-accent-border)] bg-[var(--bb-accent-soft)] p-5">
            <span className="text-xs text-[var(--bb-accent-ink)]">
              Bald fällig
            </span>
            <strong className="mt-2 block text-3xl text-[var(--bb-accent-ink)]">
              {baldFaellig}
            </strong>
          </div>

          <div
            className={`rounded-[22px] p-5 ${
              abgelaufen > 0
                ? "bg-red-600 text-white"
                : "border border-slate-200 bg-white"
            }`}
          >
            <span className="text-xs opacity-70">
              Abgelaufen / fehlt
            </span>
            <strong className="mt-2 block text-3xl">
              {abgelaufen}
            </strong>
          </div>

        </section>

        {abgelaufen > 0 && (
          <section className="rounded-[22px] border border-red-300 bg-red-50 p-5">
            <strong className="text-red-700">
              ⛔ Gerät mit ungültigem Prüfstatus
            </strong>
            <p className="mt-1 text-sm text-red-700">
              Mindestens ein Gerät hat kein gültiges Prüfdatum.
            </p>
          </section>
        )}

        {formularOffen && (
          <section className="rounded-[22px] border border-[var(--bb-accent)] bg-white p-6 shadow-sm">

            <div className="mb-5">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bb-accent-ink)]">
                NEUES GERÄT
              </div>

              <h2 className="mt-1 text-xl font-semibold">
                Gerät erfassen
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">

              <div>
                <label className="text-xs font-bold">
                  Gerätenummer
                </label>
                <input
                  value={nummer}
                  onChange={(e) => setNummer(e.target.value)}
                  placeholder="z.B. UHG-04"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-[var(--bb-accent)]"
                />
              </div>

              <div>
                <label className="text-xs font-bold">
                  Gerätetyp
                </label>
                <select
                  value={typ}
                  onChange={(e) =>
                    setTyp(e.target.value as GeraeteTyp)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <option>UHG</option>
                  <option>Asbestsauger</option>
                  <option>Wassermanagement</option>
                  <option>Luftmessgerät</option>
                  <option>Sonstiges</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold">
                  Bezeichnung
                </label>
                <input
                  value={bezeichnung}
                  onChange={(e) =>
                    setBezeichnung(e.target.value)
                  }
                  placeholder="z.B. Deconta smart 5000"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                />
              </div>

              <div>
                <label className="text-xs font-bold">
                  Hersteller
                </label>
                <input
                  value={hersteller}
                  onChange={(e) =>
                    setHersteller(e.target.value)
                  }
                  placeholder="z.B. Deconta"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                />
              </div>

              <div>
                <label className="text-xs font-bold">
                  Seriennummer
                </label>
                <input
                  value={seriennummer}
                  onChange={(e) =>
                    setSeriennummer(e.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                />
              </div>

              <div />

              <div>
                <label className="text-xs font-bold">
                  Letzte Prüfung
                </label>
                <input
                  type="date"
                  value={letztePruefung}
                  onChange={(e) =>
                    setLetztePruefung(e.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                />
              </div>

              <div>
                <label className="text-xs font-bold">
                  Nächste Prüfung
                </label>
                <input
                  type="date"
                  value={naechstePruefung}
                  onChange={(e) =>
                    setNaechstePruefung(e.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold">
                  Bemerkung
                </label>
                <textarea
                  value={bemerkung}
                  onChange={(e) =>
                    setBemerkung(e.target.value)
                  }
                  placeholder="Zusätzliche Angaben..."
                  className="mt-2 min-h-24 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4"
                />
              </div>

            </div>

            <div className="mt-5 flex justify-end gap-3">

              <button
                type="button"
                onClick={() => setFormularOffen(false)}
                className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-bold"
              >
                Abbrechen
              </button>

              <button
                type="button"
                onClick={geraetErstellen}
                className="rounded-xl bg-[var(--bb-accent)] px-5 py-3 text-sm font-semibold text-[var(--bb-on-accent)]"
              >
                Gerät speichern
              </button>

            </div>

          </section>
        )}

        <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-5">
            <h2 className="text-xl font-semibold">
              Geräte auf Baustelle
            </h2>
          </div>

          {geraete.length === 0 && (
            <div className="p-10 text-center">
              <div className="text-4xl">◫</div>
              <h3 className="mt-3 font-semibold">
                Noch keine Geräte
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Füge die auf dieser Baustelle eingesetzten Geräte hinzu.
              </p>
            </div>
          )}

          <div className="divide-y divide-slate-100">

            {geraete.map((geraet) => {
              const status = pruefstatus(geraet);

              return (
                <div
                  key={geraet.id}
                  className={`p-5 ${
                    status.farbe === "rot"
                      ? "bg-red-50"
                      : status.farbe === "gelb"
                      ? "bg-[var(--bb-accent-soft)]"
                      : ""
                  }`}
                >

                  <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">

                    <div className="flex gap-4">

                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-semibold ${
                          status.farbe === "rot"
                            ? "bg-red-600 text-white"
                            : status.farbe === "gelb"
                            ? "bg-[var(--bb-accent)] text-[var(--bb-on-accent)]"
                            : "bg-green-600 text-white"
                        }`}
                      >
                        ◫
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">

                          <strong>
                            {geraet.nummer} · {geraet.bezeichnung}
                          </strong>

                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold">
                            {geraet.typ}
                          </span>

                        </div>

                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">

                          {geraet.hersteller && (
                            <span>
                              Hersteller:{" "}
                              <strong>{geraet.hersteller}</strong>
                            </span>
                          )}

                          {geraet.seriennummer && (
                            <span>
                              SN:{" "}
                              <strong>{geraet.seriennummer}</strong>
                            </span>
                          )}

                        </div>

                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">

                          <span>
                            Letzte Prüfung:{" "}
                            <strong>
                              {geraet.letztePruefung || "nicht erfasst"}
                            </strong>
                          </span>

                          <span>
                            Nächste Prüfung:{" "}
                            <strong>
                              {geraet.naechstePruefung || "nicht erfasst"}
                            </strong>
                          </span>

                        </div>

                      </div>

                    </div>

                    <div className="flex items-center gap-3">

                      <span
                        className={`rounded-full px-3 py-2 text-xs font-semibold ${
                          status.farbe === "rot"
                            ? "bg-red-100 text-red-700"
                            : status.farbe === "gelb"
                            ? "bg-[var(--bb-accent-soft)] text-[var(--bb-accent-ink)]"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {status.label}
                      </span>

                      <button
                        type="button"
                        onClick={() => loeschen(geraet.id)}
                        className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500 hover:bg-red-50 hover:text-red-600"
                      >
                        ×
                      </button>

                    </div>

                  </div>

                  {geraet.bemerkung && (
                    <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                      {geraet.bemerkung}
                    </div>
                  )}

                </div>
              );
            })}

          </div>

        </section>

      </div>
    </AppShell>
  );
}
