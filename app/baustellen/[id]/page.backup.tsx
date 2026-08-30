"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Checkliste = {
  code: string;
  name: string;
  status: string;
};

type Baustelle = {
  id: string;
  nummer: string;
  projektname: string;
  ort: string;
  status: string;
  fortschritt: number;
  checklisten: Checkliste[];
};

export default function BaustellenDetail() {
  const params = useParams();
  const id = params.id as string;

  const [baustelle, setBaustelle] = useState<Baustelle | null>(null);

  useEffect(() => {
    const alle = JSON.parse(
      localStorage.getItem("baustellen") || "[]"
    );

    const gefunden = alle.find(
      (b: Baustelle) => b.id === id
    );

    setBaustelle(gefunden || null);
  }, [id]);

  function linkFuer(code: string) {
    if (code === "AS9") {
      return `/baustellen/${id}/journal`;
    }

    if (code === "AS10") {
      return `/baustellen/${id}/visuelle-kontrolle`;
    }

    return `/baustellen/${id}/checklisten/${code.toLowerCase()}`;
  }

  if (!baustelle) {
    return (
      <main className="min-h-screen bg-slate-50 p-10">
        Baustelle wird geladen...
      </main>
    );
  }

  const checklisten = baustelle.checklisten || [];

  const abgeschlossen = checklisten.filter(
    (c) => c.status === "Abgeschlossen"
  ).length;

  const prozent =
    checklisten.length > 0
      ? Math.round(
          (abgeschlossen / checklisten.length) * 100
        )
      : 0;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">

      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">

          <a
            href="/baustellen"
            className="text-sm text-slate-500"
          >
            ← Zurück zu Baustellen
          </a>

          <div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">

            <div>

              <div className="text-sm font-bold text-yellow-600">
                {baustelle.nummer}
              </div>

              <h1 className="mt-1 text-3xl font-bold">
                {baustelle.projektname}
              </h1>

              <p className="mt-1 text-slate-500">
                {baustelle.ort}
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <a
                href={`/baustellen/${id}/sanierungsplan`}
                className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white"
              >
                Sanierungsplan
              </a>

              <a
                href={`/baustellen/${id}/mitarbeiter`}
                className="rounded-xl bg-yellow-400 px-5 py-3 font-bold text-black"
              >
                Mitarbeiter
              </a>

            </div>

          </div>

        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 p-6">

        <section className="rounded-2xl border bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-xl font-bold">
                AS1–AS10 Ablauf
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Standardprozess dieser Baustelle
              </p>
            </div>

            <div className="font-bold">
              {prozent}% abgeschlossen
            </div>

          </div>

          <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-200">

            <div
              className="h-full rounded-full bg-yellow-400"
              style={{ width: `${prozent}%` }}
            />

          </div>

          <div className="mt-8 space-y-4">

            {checklisten.map((checkliste, index) => (

              <div
                key={checkliste.code}
                className="flex flex-col justify-between gap-4 rounded-2xl border p-5 md:flex-row md:items-center"
              >

                <div className="flex items-center gap-5">

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xl font-bold text-white">
                    {index + 1}
                  </div>

                  <div>

                    <div className="text-lg font-bold">
                      {checkliste.code}
                    </div>

                    <div className="text-slate-600">
                      {checkliste.name}
                    </div>

                  </div>

                </div>

                <div className="flex items-center gap-4">

                  <span
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      checkliste.status === "Abgeschlossen"
                        ? "bg-yellow-400 text-black"
                        : checkliste.status === "In Bearbeitung"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {checkliste.status || "Offen"}
                  </span>

                  <a
                    href={linkFuer(checkliste.code)}
                    className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold hover:bg-yellow-400"
                  >
                    Öffnen
                  </a>

                </div>

              </div>

            ))}

          </div>

        </section>

      </div>

    </main>
  );
}
