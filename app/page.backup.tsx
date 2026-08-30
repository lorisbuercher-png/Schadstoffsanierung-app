"use client";

import { useEffect, useState } from "react";

type Baustelle = {
  id: string;
  nummer: string;
  projektname: string;
  ort: string;
  status: string;
  fortschritt: number;
};

export default function Home() {
  const [baustellen, setBaustellen] = useState<Baustelle[]>([]);

  useEffect(() => {
    const daten = JSON.parse(
      localStorage.getItem("baustellen") || "[]"
    );

    setBaustellen(daten);
  }, []);

  const aktiv = baustellen.filter(
    (b) => b.status !== "Abgeschlossen"
  ).length;

  const abgeschlossen = baustellen.filter(
    (b) => b.status === "Abgeschlossen"
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">

        <aside className="hidden w-64 flex-col bg-slate-950 text-white md:flex">

          <div className="border-b border-slate-800 p-6">
            <div className="text-2xl font-bold text-yellow-500">
              B&B
            </div>

            <div className="mt-1 text-sm text-slate-400">
              Schadstoffsanierung
            </div>
          </div>

          <nav className="flex-1 space-y-2 p-4">

            <a
              href="/"
              className="block rounded-xl bg-yellow-400 px-4 py-3 font-semibold"
            >
              Dashboard
            </a>

            <a
              href="/baustellen"
              className="block rounded-xl px-4 py-3 text-slate-300 hover:bg-slate-900"
            >
              Baustellen
            </a>

            <a
              href="/mitarbeiter"
              className="block rounded-xl px-4 py-3 text-slate-300 hover:bg-slate-900"
            >
              Mitarbeiter
            </a>

            <div className="rounded-xl px-4 py-3 text-slate-500">
              Checklisten
            </div>

            <div className="rounded-xl px-4 py-3 text-slate-500">
              Dokumente
            </div>

            <div className="rounded-xl px-4 py-3 text-slate-500">
              SharePoint
            </div>

          </nav>

          <div className="border-t border-slate-800 p-4 text-xs text-slate-500">
            B&B WebApp
          </div>

        </aside>

        <section className="flex-1">

          <header className="border-b bg-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

              <div>
                <h1 className="text-2xl font-bold">
                  Dashboard
                </h1>

                <p className="text-sm text-slate-500">
                  Übersicht Baustellen und Sanierungen
                </p>
              </div>

              <a
                href="/baustellen/neu"
                className="rounded-xl bg-yellow-400 px-5 py-3 font-semibold text-white hover:bg-yellow-600"
              >
                + Neue Baustelle
              </a>

            </div>
          </header>

          <div className="mx-auto max-w-7xl space-y-8 p-6">

            <div className="grid gap-4 md:grid-cols-3">

              <Kpi
                titel="Aktive Baustellen"
                wert={aktiv.toString()}
              />

              <Kpi
                titel="Alle Baustellen"
                wert={baustellen.length.toString()}
              />

              <Kpi
                titel="Abgeschlossen"
                wert={abgeschlossen.toString()}
              />

            </div>

            <div className="rounded-2xl border bg-white shadow-sm">

              <div className="flex items-center justify-between border-b p-5">

                <div>
                  <h2 className="text-lg font-bold">
                    Baustellen
                  </h2>

                  <p className="text-sm text-slate-500">
                    Zuletzt erfasste Projekte
                  </p>
                </div>

                <a
                  href="/baustellen"
                  className="text-sm font-semibold text-yellow-600"
                >
                  Alle anzeigen →
                </a>

              </div>

              {baustellen.length === 0 ? (

                <div className="p-10 text-center">

                  <p className="text-slate-500">
                    Noch keine Baustellen vorhanden.
                  </p>

                  <a
                    href="/baustellen/neu"
                    className="mt-4 inline-block rounded-xl bg-yellow-400 px-5 py-3 font-semibold text-white"
                  >
                    Erste Baustelle erstellen
                  </a>

                </div>

              ) : (

                <div className="divide-y">

                  {baustellen.slice(0, 5).map((baustelle) => (

                    <a
                      href={`/baustellen/${baustelle.id}`}
                      key={baustelle.id}
                      className="block p-5 hover:bg-slate-50"
                    >

                      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

                        <div>

                          <div className="text-xs font-bold text-yellow-600">
                            {baustelle.nummer || "Ohne Nummer"}
                          </div>

                          <div className="mt-1 font-semibold">
                            {baustelle.projektname}
                          </div>

                          <div className="text-sm text-slate-500">
                            {baustelle.ort}
                          </div>

                        </div>

                        <div className="w-full md:w-64">

                          <div className="mb-2 flex justify-between text-xs">

                            <span>
                              {baustelle.status}
                            </span>

                            <span>
                              {baustelle.fortschritt}%
                            </span>

                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-slate-200">

                            <div
                              className="h-full rounded-full bg-yellow-400"
                              style={{
                                width: `${baustelle.fortschritt}%`,
                              }}
                            />

                          </div>

                        </div>

                      </div>

                    </a>

                  ))}

                </div>

              )}

            </div>

            <div className="rounded-2xl bg-slate-950 p-6 text-white">

              <h2 className="text-lg font-bold">
                Baustellenprozess
              </h2>

              <div className="mt-5 grid gap-3 md:grid-cols-4">

                <Step nummer="1" text="Baustelle erstellen" />
                <Step nummer="2" text="AS1–AS10 bearbeiten" />
                <Step nummer="3" text="Dokumentation erstellen" />
                <Step nummer="4" text="SharePoint archivieren" />

              </div>

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}

function Kpi({
  titel,
  wert,
}: {
  titel: string;
  wert: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">

      <div className="text-sm text-slate-500">
        {titel}
      </div>

      <div className="mt-2 text-3xl font-bold">
        {wert}
      </div>

    </div>
  );
}

function Step({
  nummer,
  text,
}: {
  nummer: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-900 p-4">

      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 font-bold">
        {nummer}
      </div>

      <span className="text-sm">
        {text}
      </span>

    </div>
  );
}
