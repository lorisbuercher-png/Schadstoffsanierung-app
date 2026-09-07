"use client";

import AppShell from "../../../components/ui/AppShell";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Baustelle = {
  id: string;
  nummer: string;
  projektname: string;
  adresse: string;
  plz: string;
  ort: string;
};

type Kontakt = {
  rolle: string;
  firma: string;
  person: string;
  kontakt: string;
};

export default function Sanierungsplan() {
  const params = useParams();
  const id = params.id as string;

  const [baustelle, setBaustelle] = useState<Baustelle | null>(null);

  const [startZonenbau, setStartZonenbau] = useState("");
  const [startSanierung, setStartSanierung] = useState("");
  const [endeSanierung, setEndeSanierung] = useState("");
  const [version, setVersion] = useState("1.0");

  const [kontakte, setKontakte] = useState<Kontakt[]>([
    {
      rolle: "Bauherr",
      firma: "",
      person: "",
      kontakt: "",
    },
    {
      rolle: "Architekt / Bauleitung",
      firma: "",
      person: "",
      kontakt: "",
    },
    {
      rolle: "Schadstoff-Gutachten",
      firma: "",
      person: "",
      kontakt: "",
    },
    {
      rolle: "Fachbauleitung / Luftmessungen",
      firma: "",
      person: "",
      kontakt: "",
    },
    {
      rolle: "Subunternehmer Sanierung",
      firma: "",
      person: "",
      kontakt: "",
    },
    {
      rolle: "Transport Abfälle / Muldendienst",
      firma: "",
      person: "",
      kontakt: "",
    },
    {
      rolle: "Elektriker",
      firma: "",
      person: "",
      kontakt: "",
    },
    {
      rolle: "Sanitär",
      firma: "",
      person: "",
      kontakt: "",
    },
    {
      rolle: "Rückbau",
      firma: "",
      person: "",
      kontakt: "",
    },
    {
      rolle: "Weitere",
      firma: "",
      person: "",
      kontakt: "",
    },
  ]);

  useEffect(() => {
    const alle = JSON.parse(
      localStorage.getItem("baustellen") || "[]"
    );

    const gefunden = alle.find(
      (b: Baustelle) => b.id === id
    );

    setBaustelle(gefunden || null);

    const gespeichert = JSON.parse(
      localStorage.getItem(`sanierungsplan-${id}`) || "{}"
    );

    if (gespeichert.startZonenbau)
      setStartZonenbau(gespeichert.startZonenbau);

    if (gespeichert.startSanierung)
      setStartSanierung(gespeichert.startSanierung);

    if (gespeichert.endeSanierung)
      setEndeSanierung(gespeichert.endeSanierung);

    if (gespeichert.version)
      setVersion(gespeichert.version);

    if (gespeichert.kontakte)
      setKontakte(gespeichert.kontakte);
  }, [id]);

  function updateKontakt(
    index: number,
    field: keyof Kontakt,
    value: string
  ) {
    setKontakte((prev) =>
      prev.map((kontakt, i) =>
        i === index
          ? {
              ...kontakt,
              [field]: value,
            }
          : kontakt
      )
    );
  }

  function speichern() {
    localStorage.setItem(
      `sanierungsplan-${id}`,
      JSON.stringify({
        startZonenbau,
        startSanierung,
        endeSanierung,
        version,
        kontakte,
      })
    );

    alert("Sanierungsplan gespeichert.");
  }

  if (!baustelle) {
    return (
      <main className="min-h-screen bg-slate-50 p-10">
        Baustelle wird geladen...
      </main>
    );
  }

  return (
    <AppShell
      title="Sanierungsplan"
      subtitle="Arbeitsverfahren und Schutzmassnahmen dokumentieren."
      backHref={`/baustellen/${id}`}
      backLabel="Zur Baustelle"
    >

      

      <div className="bb-workspace max-w-7xl space-y-6">

        <section className="rounded-2xl border bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <div className="text-sm font-bold text-[#e77818]">
                1
              </div>

              <h2 className="text-xl font-bold">
                Projektdaten
              </h2>

            </div>

            <span className="rounded-full bg-[#fff1e4] px-4 py-2 text-sm font-bold text-[#e77818]">
              Version {version}
            </span>

          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            <Feld
              label="Projekt-Nr."
              value={baustelle.nummer || ""}
              disabled
            />

            <Feld
              label="Objekt-Bezeichnung"
              value={baustelle.projektname || ""}
              disabled
            />

            <Feld
              label="Adresse"
              value={`${baustelle.adresse || ""}, ${baustelle.plz || ""} ${baustelle.ort || ""}`}
              disabled
            />

            <Feld
              label="Start Zonenbau"
              type="date"
              value={startZonenbau}
              onChange={setStartZonenbau}
            />

            <Feld
              label="Start Sanierung"
              type="date"
              value={startSanierung}
              onChange={setStartSanierung}
            />

            <Feld
              label="Ende Sanierung"
              type="date"
              value={endeSanierung}
              onChange={setEndeSanierung}
            />

            <Feld
              label="Version"
              value={version}
              onChange={setVersion}
            />

          </div>

        </section>

        <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">

          <div className="border-b p-6">

            <div className="text-sm font-bold text-[#e77818]">
              2
            </div>

            <h2 className="text-xl font-bold">
              Organisation / Kontaktpersonen
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Projektbeteiligte und externe Stellen
            </p>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px]">

              <thead className="bg-slate-50 text-left text-sm">

                <tr>
                  <th className="p-4">
                    Funktion
                  </th>

                  <th className="p-4">
                    Firma
                  </th>

                  <th className="p-4">
                    Zuständige Person
                  </th>

                  <th className="p-4">
                    Telefon / E-Mail
                  </th>
                </tr>

              </thead>

              <tbody className="divide-y">

                {kontakte.map((kontakt, index) => (

                  <tr key={`${kontakt.rolle}-${index}`}>

                    <td className="p-4 font-semibold">
                      {kontakt.rolle}
                    </td>

                    <td className="p-3">

                      <input
                        value={kontakt.firma}
                        onChange={(e) =>
                          updateKontakt(
                            index,
                            "firma",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border px-3 py-2"
                      />

                    </td>

                    <td className="p-3">

                      <input
                        value={kontakt.person}
                        onChange={(e) =>
                          updateKontakt(
                            index,
                            "person",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border px-3 py-2"
                      />

                    </td>

                    <td className="p-3">

                      <input
                        value={kontakt.kontakt}
                        onChange={(e) =>
                          updateKontakt(
                            index,
                            "kontakt",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border px-3 py-2"
                      />

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900">

          <h2 className="font-bold">
            Sanierungsplan v5
          </h2>

          <p className="mt-2 text-sm text-slate-300">
            Als Nächstes folgen Ausgangslage, Auftrag, Schadstoffe,
            Sanierungsablauf, Zonen & Luftbilanz, Gefahren,
            Notfallorganisation und Entsorgung.
          </p>

        </section>

        <div className="sticky bottom-4 flex justify-end rounded-2xl border bg-white p-4 shadow-lg">

          <button
            type="button"
            onClick={speichern}
            className="rounded-xl bg-[#e77818] px-6 py-3 font-bold text-white hover:bg-[#c96210]"
          >
            Sanierungsplan speichern
          </button>

        </div>

      </div>

    </AppShell>
  );
}

function Feld({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-semibold">
        {label}
      </label>

      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#e77818] disabled:bg-slate-100"
      />

    </div>
  );
}
