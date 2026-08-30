"use client";

import AppShell from "../../../components/ui/AppShell";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type Dokument = {
  id: string;
  name: string;
  ordnerId: string;
  datum: string;
  groesse?: string;
  typ?: string;
};

type Ordner = {
  id: string;
  nummer: string;
  name: string;
  beschreibung: string;
};

const ordner: Ordner[] = [
  {
    id: "auftrag",
    nummer: "01",
    name: "Auftrag & Schadstoffgutachten",
    beschreibung: "Auftrag, Gutachten und Grundlagen",
  },
  {
    id: "suva-meldung",
    nummer: "02",
    name: "SUVA Meldung",
    beschreibung: "Meldungen und Bestätigungen",
  },
  {
    id: "sanierungsplan",
    nummer: "03",
    name: "Sanierungsplan",
    beschreibung: "Arbeits- und Sanierungsplanung",
  },
  {
    id: "zonenplan",
    nummer: "04",
    name: "Zonen- & Schleusenplan",
    beschreibung: "Zonenplan, Schleusenplan und Grundrisse",
  },
  {
    id: "luft",
    nummer: "05",
    name: "Luftbilanz & Unterdruck",
    beschreibung: "Luftbilanz, UHG und Messprotokolle",
  },
  {
    id: "mitarbeiter",
    nummer: "06",
    name: "Mitarbeiter & Instruktionen",
    beschreibung: "Instruktionen und Mitarbeiterunterlagen",
  },
  {
    id: "psa",
    nummer: "07",
    name: "PSA & Tagesfreigaben",
    beschreibung: "PSA-Kontrollen und Tageschecks",
  },
  {
    id: "zonenzutritt",
    nummer: "08",
    name: "Zonenzutritt",
    beschreibung: "Ein- und Austrittsprotokolle",
  },
  {
    id: "journal",
    nummer: "09",
    name: "Baustellenjournal",
    beschreibung: "Tagesberichte und Ereignisse",
  },
  {
    id: "fotos",
    nummer: "10",
    name: "Fotos & Dokumentation",
    beschreibung: "Fotodokumentation der Baustelle",
  },
  {
    id: "kontrollen",
    nummer: "11",
    name: "Kontrollen & Mängel",
    beschreibung: "Kontrollen, Mängel und Massnahmen",
  },
  {
    id: "abschluss",
    nummer: "12",
    name: "Freimessung & Abschluss",
    beschreibung: "Visuelle Kontrolle, Freimessung und Abschluss",
  },
  {
    id: "suva-audit",
    nummer: "13",
    name: "SUVA Audit",
    beschreibung: "Nachweise und Audit-Dokumentation",
  },
];

export default function DokumentePage() {
  const params = useParams();
  const id = params.id as string;

  const [dokumente, setDokumente] = useState<Dokument[]>([]);
  const [aktiverOrdner, setAktiverOrdner] = useState<string | null>(null);
  const [suche, setSuche] = useState("");

  const storageKey = `dokumente-${id}`;

  useEffect(() => {
    const gespeichert = localStorage.getItem(storageKey);

    if (gespeichert) {
      try {
        const daten = JSON.parse(gespeichert);

        if (Array.isArray(daten)) {
          setDokumente(daten);
        }
      } catch {}
    }
  }, [storageKey]);

  function speichern(neu: Dokument[]) {
    setDokumente(neu);
    localStorage.setItem(storageKey, JSON.stringify(neu));
  }

  function dateiHinzufuegen(
    event: React.ChangeEvent<HTMLInputElement>,
    ordnerId: string
  ) {
    const dateien = event.target.files;

    if (!dateien || dateien.length === 0) {
      return;
    }

    const neueDokumente: Dokument[] = Array.from(dateien).map((datei) => ({
      id: crypto.randomUUID(),
      name: datei.name,
      ordnerId,
      datum: new Date().toLocaleDateString("de-CH"),
      groesse: `${(datei.size / 1024 / 1024).toFixed(1)} MB`,
      typ: datei.type || "Datei",
    }));

    speichern([...neueDokumente, ...dokumente]);

    event.target.value = "";
  }

  function loeschen(dokumentId: string) {
    const bestaetigt = confirm(
      "Soll dieses Dokument aus der Baustellenablage entfernt werden?"
    );

    if (!bestaetigt) return;

    speichern(
      dokumente.filter((dokument) => dokument.id !== dokumentId)
    );
  }

  const gefilterteDokumente = useMemo(() => {
    return dokumente.filter((dokument) => {
      const ordnerPasst =
        !aktiverOrdner || dokument.ordnerId === aktiverOrdner;

      const suchePasst =
        !suche ||
        dokument.name.toLowerCase().includes(suche.toLowerCase());

      return ordnerPasst && suchePasst;
    });
  }, [dokumente, aktiverOrdner, suche]);

  const aktuellerOrdner = ordner.find(
    (eintrag) => eintrag.id === aktiverOrdner
  );

  return (
    <AppShell
      title="Dokumente"
      subtitle="Digitalen Baustellenordner verwalten."
      backHref={`/baustellen/${id}`}
      backLabel="Zur Baustelle"
    >

      

      <div className="mx-auto max-w-[1500px] space-y-5 p-6">

        <section className="rounded-[18px] border border-slate-200 bg-white p-6 text-slate-900">

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">

            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                BAUSTELLENORDNER
              </div>

              <h2 className="mt-1 text-2xl font-black">
                Automatische Ablagestruktur
              </h2>

              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Dokumente werden direkt dem richtigen Bereich dieser Baustelle
                zugeordnet.
              </p>
            </div>

            <div className="rounded-2xl bg-white/5 px-5 py-4">
              <strong className="block text-xl text-[#e77818]">
                {ordner.length}
              </strong>
              <span className="text-xs text-slate-500">
                Ordnerbereiche
              </span>
            </div>

          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[390px_1fr]">

          <aside className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">

            <div className="mb-4">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                STRUKTUR
              </div>

              <h2 className="mt-1 text-xl font-black">
                Baustellenordner
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setAktiverOrdner(null)}
              className={`mb-2 flex w-full items-center justify-between rounded-xl px-4 py-3 text-left ${
                aktiverOrdner === null
                  ? "bg-[#17565d] text-white"
                  : "bg-slate-50 hover:bg-slate-100"
              }`}
            >
              <div>
                <strong className="block text-sm">
                  Alle Dokumente
                </strong>

                <span className="text-xs opacity-60">
                  Gesamter Baustellenordner
                </span>
              </div>

              <strong>{dokumente.length}</strong>
            </button>

            <div className="space-y-2">

              {ordner.map((eintrag) => {
                const anzahl = dokumente.filter(
                  (dokument) => dokument.ordnerId === eintrag.id
                ).length;

                return (
                  <button
                    key={eintrag.id}
                    type="button"
                    onClick={() => setAktiverOrdner(eintrag.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                      aktiverOrdner === eintrag.id
                        ? "bg-[#fff2cc] ring-1 ring-[#17565d]"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#17565d] text-xs font-black text-white">
                      {eintrag.nummer}
                    </div>

                    <div className="min-w-0 flex-1">

                      <strong className="block truncate text-sm">
                        {eintrag.name}
                      </strong>

                      <span className="block truncate text-[11px] text-slate-500">
                        {eintrag.beschreibung}
                      </span>

                    </div>

                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black">
                      {anzahl}
                    </span>
                  </button>
                );
              })}

            </div>
          </aside>

          <section className="space-y-5">

            <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                    {aktuellerOrdner
                      ? `ORDNER ${aktuellerOrdner.nummer}`
                      : "GESAMTÜBERSICHT"}
                  </div>

                  <h2 className="mt-1 text-xl font-black">
                    {aktuellerOrdner
                      ? aktuellerOrdner.name
                      : "Alle Dokumente"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {aktuellerOrdner
                      ? aktuellerOrdner.beschreibung
                      : "Alle Unterlagen der aktuellen Baustelle."}
                  </p>
                </div>

                <input
                  type="search"
                  value={suche}
                  onChange={(e) => setSuche(e.target.value)}
                  placeholder="Dokument suchen..."
                  className="min-w-[260px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#17565d]"
                />

              </div>
            </div>

            {aktuellerOrdner && (
              <section className="rounded-[22px] border border-dashed border-[#efc39f] bg-[#fff8f1] p-6">

                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

                  <div>
                    <strong className="block text-lg">
                      Dokument ablegen
                    </strong>

                    <p className="mt-1 text-sm text-slate-500">
                      Die Datei wird automatisch in
                      {" "}
                      <strong>{aktuellerOrdner.name}</strong>
                      {" "}
                      gespeichert.
                    </p>
                  </div>

                  <label className="cursor-pointer rounded-xl bg-[#17565d] px-5 py-3 text-sm font-black text-black hover:bg-[#12464c]">
                    + Datei hinzufügen

                    <input
                      type="file"
                      multiple
                      onChange={(event) =>
                        dateiHinzufuegen(event, aktuellerOrdner.id)
                      }
                      className="hidden"
                    />
                  </label>

                </div>

              </section>
            )}

            {!aktuellerOrdner && (
              <div className="rounded-[22px] border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
                Wähle links einen Ordner aus, um neue Dokumente direkt richtig
                abzulegen.
              </div>
            )}

            <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">

              <div className="grid grid-cols-[1fr_160px_120px_70px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
                <span>Dokument</span>
                <span>Ordner</span>
                <span>Datum</span>
                <span />
              </div>

              {gefilterteDokumente.length === 0 && (
                <div className="p-10 text-center">

                  <div className="text-4xl">
                    ▤
                  </div>

                  <h3 className="mt-3 text-lg font-black">
                    Noch keine Dokumente
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Wähle einen Ordner und füge die erste Datei hinzu.
                  </p>

                </div>
              )}

              {gefilterteDokumente.map((dokument) => {
                const ordnerDaten = ordner.find(
                  (eintrag) => eintrag.id === dokument.ordnerId
                );

                return (
                  <div
                    key={dokument.id}
                    className="grid grid-cols-[1fr_160px_120px_70px] items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0"
                  >

                    <div className="flex min-w-0 items-center gap-3">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fff2cc] text-lg">
                        ▤
                      </div>

                      <div className="min-w-0">

                        <strong className="block truncate text-sm">
                          {dokument.name}
                        </strong>

                        <span className="text-xs text-slate-500">
                          {dokument.groesse}
                        </span>

                      </div>

                    </div>

                    <span className="truncate text-xs text-slate-500">
                      {ordnerDaten?.nummer} {ordnerDaten?.name}
                    </span>

                    <span className="text-xs text-slate-500">
                      {dokument.datum}
                    </span>

                    <button
                      type="button"
                      onClick={() => loeschen(dokument.id)}
                      className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-red-50 hover:text-red-600"
                    >
                      ×
                    </button>

                  </div>
                );
              })}

            </section>

          </section>

        </section>

      </div>
    </AppShell>
  );
}
