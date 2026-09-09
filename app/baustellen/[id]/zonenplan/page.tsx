"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import AppShell from "../../../components/ui/AppShell";

type Baustelle = {
  id: string;
  nummer: string;
  projektname: string;
};

type ZonenplanDatei = {
  id: string;
  name: string;
  type: "image/png" | "application/pdf";
  size: number;
  dataUrl: string;
  hochgeladenAm: string;
};

type Dokument = {
  id: string;
  name: string;
  ordnerId: string;
  datum: string;
  groesse?: string;
  typ?: string;
};

const MAX_DATEIGROESSE = 4 * 1024 * 1024;

export default function Zonenplan() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const inputRef = useRef<HTMLInputElement>(null);

  const [baustelle, setBaustelle] = useState<Baustelle | null>(null);
  const [plan, setPlan] = useState<ZonenplanDatei | null>(null);
  const [status, setStatus] = useState<"leer" | "speichert" | "gespeichert">("leer");
  const [fehler, setFehler] = useState("");

  useEffect(() => {
    const alle = JSON.parse(localStorage.getItem("baustellen") || "[]") as Baustelle[];
    setBaustelle(alle.find((eintrag) => eintrag.id === id) || null);

    try {
      const gespeichert = JSON.parse(localStorage.getItem(`zonenplan-${id}`) || "null");

      if (gespeichert?.datei) {
        setPlan(gespeichert.datei);
        setStatus("gespeichert");
      }
    } catch {
      setFehler("Der gespeicherte Zonenplan konnte nicht geladen werden.");
    }
  }, [id]);

  function dokumentEintragen(datei: ZonenplanDatei) {
    const key = `dokumente-${id}`;
    let dokumente: Dokument[] = [];

    try {
      const gespeichert = JSON.parse(localStorage.getItem(key) || "[]");
      dokumente = Array.isArray(gespeichert) ? gespeichert : [];
    } catch {}

    const ohneAltenPlan = dokumente.filter(
      (dokument) => dokument.ordnerId !== "zonenplan"
    );

    const dokument: Dokument = {
      id: datei.id,
      name: datei.name,
      ordnerId: "zonenplan",
      datum: new Date(datei.hochgeladenAm).toLocaleDateString("de-CH"),
      groesse: groesseFormatieren(datei.size),
      typ: datei.type,
    };

    localStorage.setItem(key, JSON.stringify([dokument, ...ohneAltenPlan]));
  }

  function dateiSpeichern(datei: ZonenplanDatei) {
    setStatus("speichert");
    localStorage.setItem(
      `zonenplan-${id}`,
      JSON.stringify({ datei, aktualisiertAm: new Date().toISOString() })
    );
    dokumentEintragen(datei);
    setPlan(datei);
    setStatus("gespeichert");
  }

  function dateiAuswaehlen(event: React.ChangeEvent<HTMLInputElement>) {
    const datei = event.target.files?.[0];
    event.target.value = "";
    setFehler("");

    if (!datei) return;

    if (datei.type !== "image/png" && datei.type !== "application/pdf") {
      setFehler("Bitte den fertigen Zonenplan als PNG oder PDF auswählen.");
      return;
    }

    if (datei.size > MAX_DATEIGROESSE) {
      setFehler("Die Datei ist grösser als 4 MB. Bitte den Plan zuerst verkleinern.");
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => setFehler("Die Datei konnte nicht gelesen werden.");
    reader.onload = () => {
      dateiSpeichern({
        id: crypto.randomUUID(),
        name: datei.name,
        type: datei.type as ZonenplanDatei["type"],
        size: datei.size,
        dataUrl: reader.result as string,
        hochgeladenAm: new Date().toISOString(),
      });
    };
    reader.readAsDataURL(datei);
  }

  function planEntfernen() {
    if (!confirm("Soll der Zonenplan wirklich entfernt werden?")) return;

    localStorage.removeItem(`zonenplan-${id}`);

    const dokumentKey = `dokumente-${id}`;
    try {
      const dokumente = JSON.parse(localStorage.getItem(dokumentKey) || "[]") as Dokument[];
      localStorage.setItem(
        dokumentKey,
        JSON.stringify(dokumente.filter((dokument) => dokument.ordnerId !== "zonenplan"))
      );
    } catch {}

    setPlan(null);
    setStatus("leer");
  }

  if (!baustelle) {
    return (
      <AppShell title="Zonenplan" backHref={`/baustellen/${id}`} backLabel="Zur Baustelle">
        <section className="bb-card p-8 text-sm font-semibold text-slate-600">
          Baustelle wird geladen …
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Zonenplan"
      subtitle="Fertigen Plan als PDF oder PNG in der Baustelle ablegen."
      backHref={`/baustellen/${id}`}
      backLabel="Zur Baustelle"
    >
      <div className="bb-workspace max-w-6xl space-y-5">
        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#d46c12]">
                Baustellenordner · Zonenplan
              </div>
              <h2 className="mt-2 text-2xl font-black text-slate-900">
                {baustelle.nummer} · {baustelle.projektname}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Den Zonenplan weiterhin von Hand erstellen und hier nur die fertige Datei hochladen.
                Die Ablage im Baustellenordner erfolgt automatisch.
              </p>
            </div>

            <div className={`rounded-2xl px-5 py-3 text-sm font-bold ${
              plan ? "bg-green-50 text-green-700" : "bg-[#fff3e8] text-[#a95310]"
            }`}>
              {status === "speichert" ? "Wird gespeichert …" : plan ? "✓ Plan abgelegt" : "Plan fehlt"}
            </div>
          </div>
        </section>

        {!plan ? (
          <section className="rounded-[24px] border-2 border-dashed border-[#edbf98] bg-[#fffaf5] p-8 text-center sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ffe8d3] text-3xl text-[#d46c12]">
              ⇧
            </div>
            <h2 className="mt-5 text-xl font-black text-slate-900">Zonenplan hochladen</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Akzeptiert werden PDF und PNG bis maximal 4 MB. Nach der Auswahl wird der Plan direkt gespeichert.
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="bb-primary-button mt-6"
            >
              PDF oder PNG auswählen
            </button>
          </section>
        ) : (
          <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-black text-slate-900">{plan.name}</div>
                <div className="mt-1 text-sm text-slate-500">
                  {groesseFormatieren(plan.size)} · Hochgeladen am {new Date(plan.hochgeladenAm).toLocaleString("de-CH")}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => inputRef.current?.click()} className="bb-secondary-button">
                  Plan ersetzen
                </button>
                <button
                  type="button"
                  onClick={planEntfernen}
                  className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50"
                >
                  Entfernen
                </button>
              </div>
            </div>

            <div className="bg-slate-100 p-4 sm:p-6">
              {plan.type === "image/png" ? (
                <div className="relative mx-auto min-h-[420px] max-w-5xl overflow-hidden rounded-xl bg-white">
                  <Image src={plan.dataUrl} alt={`Zonenplan ${plan.name}`} fill unoptimized className="object-contain" />
                </div>
              ) : (
                <iframe
                  src={plan.dataUrl}
                  title={`Zonenplan ${plan.name}`}
                  className="h-[70vh] min-h-[520px] w-full rounded-xl bg-white"
                />
              )}
            </div>
          </section>
        )}

        {fehler && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {fehler}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/png,application/pdf,.png,.pdf"
          onChange={dateiAuswaehlen}
          className="hidden"
        />
      </div>
    </AppShell>
  );
}

function groesseFormatieren(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
