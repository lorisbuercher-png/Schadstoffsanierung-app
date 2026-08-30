"use client";

import AppShell from "../../../components/ui/AppShell";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type AuditStatus = "offen" | "erfuellt" | "nicht-erfuellt" | "nicht-anwendbar";

type AuditPunkt = {
  nr: number;
  bereich: string;
  titel: string;
  hinweis?: string;
};

type AuditAntwort = {
  status: AuditStatus;
  notiz: string;
};

const punkte: AuditPunkt[] = [
  {
    nr: 1,
    bereich: "Unternehmen",
    titel: "Ausführendes Asbestsanierungsunternehmen ist von der Suva anerkannt",
  },
  {
    nr: 2,
    bereich: "Unternehmen",
    titel: "Spezialist/in verfügt über die erforderlichen Ausbildungsnachweise",
  },
  {
    nr: 3,
    bereich: "Unternehmen",
    titel: "Notwendige Arbeitsmittel sind vorhanden, geprüft und in einwandfreiem Zustand",
  },
  {
    nr: 4,
    bereich: "Unternehmen",
    titel: "Alle beteiligten Mitarbeitenden sind für die arbeitsmedizinische Vorsorge gemeldet",
  },

  {
    nr: 5,
    bereich: "Information & Instruktion",
    titel: "Alle Mitarbeitenden sind korrekt über Asbestgefahren und Arbeitsabläufe instruiert",
    hinweis:
      "PSA, Arbeitstechnik, Lüftung, Dekontamination, Ausschleusen, Schlussreinigung und Notfallmassnahmen.",
  },

  {
    nr: 6,
    bereich: "Meldung & Arbeitsplanung",
    titel: "Asbestsanierungsarbeiten wurden ordnungsgemäss gemeldet",
  },
  {
    nr: 7,
    bereich: "Meldung & Arbeitsplanung",
    titel: "Ein passendes und nachvollziehbares Schadstoffgutachten liegt vor",
  },
  {
    nr: 8,
    bereich: "Meldung & Arbeitsplanung",
    titel: "Projektbezogener Arbeitsplan ist auf der Baustelle vorhanden",
  },
  {
    nr: 9,
    bereich: "Meldung & Arbeitsplanung",
    titel: "Aktuelle Liste aller anwesenden Mitarbeitenden ist vorhanden",
  },

  {
    nr: 10,
    bereich: "Grundanforderungen Sanierung",
    titel: "Baustelle wird durch eine ausgebildete und weisungsbefugte Fachperson überwacht",
  },
  {
    nr: 11,
    bereich: "Grundanforderungen Sanierung",
    titel: "Arbeitsverfahren halten die Freisetzung von Asbestfasern möglichst gering",
    hinweis: "Zum Beispiel Nassverfahren, Quellenabsaugung und sofortiges Verpacken.",
  },
  {
    nr: 12,
    bereich: "Grundanforderungen Sanierung",
    titel: "Mitarbeitende dekontaminieren sich beim Verlassen der Zone vollständig",
  },

  {
    nr: 13,
    bereich: "Sanierungszone",
    titel: "Sanierungszone ist räumlich abgetrennt",
  },
  {
    nr: 14,
    bereich: "Sanierungszone",
    titel: "Abtrennmaterialien sind fest, glatt, dicht und abwaschbar",
  },
  {
    nr: 15,
    bereich: "Sanierungszone",
    titel: "Mobiliar wurde aus der Sanierungszone entfernt",
  },
  {
    nr: 16,
    bereich: "Sanierungszone",
    titel: "Feste Einrichtungen und raue Oberflächen sind mit abwaschbarer Folie abgedeckt",
  },
  {
    nr: 17,
    bereich: "Sanierungszone",
    titel: "Kommunikation und Sichtkontakt zwischen Zone und Umgebung sind gewährleistet",
  },
  {
    nr: 18,
    bereich: "Sanierungszone",
    titel: "Sanierungszone ist mit Zutrittsverbot und Asbestwarnung gekennzeichnet",
  },

  {
    nr: 19,
    bereich: "Dekontaminationsschleusen",
    titel: "Personenschleuse zwischen Sanierungszone und Umgebung ist eingerichtet",
  },
  {
    nr: 20,
    bereich: "Dekontaminationsschleusen",
    titel: "Funktionsfähige Dusche mit Warmwasser ist vorhanden",
  },
  {
    nr: 21,
    bereich: "Dekontaminationsschleusen",
    titel: "Fachgerecht ausgeführte Materialschleuse ist installiert",
  },
  {
    nr: 22,
    bereich: "Dekontaminationsschleusen",
    titel: "Materialschleuse ist ausreichend gross und ergonomisch",
  },
  {
    nr: 23,
    bereich: "Dekontaminationsschleusen",
    titel: "Asbestabfallsäcke werden korrekt gereinigt und doppelt verpackt",
  },
  {
    nr: 24,
    bereich: "Dekontaminationsschleusen",
    titel: "Abwasser aus Schleusen und Sanierungszone wird vor Einleitung filtriert",
  },
  {
    nr: 25,
    bereich: "Dekontaminationsschleusen",
    titel: "Kontaminierte Arbeitsmittel werden vor dem Ausschleusen dekontaminiert oder verpackt",
  },

  {
    nr: 26,
    bereich: "Lüftung",
    titel: "Mindestens 8 Luftwechsel pro Stunde in allen Räumen der Sanierungszone",
  },
  {
    nr: 27,
    bereich: "Lüftung",
    titel: "Lüftungsrate wird vor Inbetriebnahme geprüft und protokolliert",
  },
  {
    nr: 28,
    bereich: "Lüftung",
    titel: "Mindestens 10 Luftwechsel pro Stunde in den Dekontaminationsschleusen",
  },
  {
    nr: 29,
    bereich: "Lüftung",
    titel: "Abluft von UHG und Asbestsaugern wird sicher direkt ins Freie geführt",
  },
  {
    nr: 30,
    bereich: "Lüftung",
    titel: "Ausreichende Luftzufuhr in die Sanierungszone ist sichergestellt",
  },

  {
    nr: 31,
    bereich: "Unterdruck",
    titel: "Während der Arbeit werden mindestens 20 Pa Unterdruck eingehalten",
  },
  {
    nr: 32,
    bereich: "Unterdruck",
    titel: "Unterdruck wird dauerhaft überwacht und aufgezeichnet",
  },
  {
    nr: 33,
    bereich: "Unterdruck",
    titel: "Bei Druckabfall wird automatisch ein wahrnehmbarer Alarm ausgelöst",
  },

  {
    nr: 34,
    bereich: "Asbeststaubsauger & UHG",
    titel: "Nur geeignete und gekennzeichnete Asbeststaubsauger werden verwendet",
  },
  {
    nr: 35,
    bereich: "Asbeststaubsauger & UHG",
    titel: "Kontaminierte Asbeststaubsauger werden nicht ausserhalb von Sanierungszonen verwendet",
  },
  {
    nr: 36,
    bereich: "Asbeststaubsauger & UHG",
    titel: "Nächste Wartung und Prüfung ist auf Saugern und UHG sichtbar angeschrieben",
  },
  {
    nr: 37,
    bereich: "Asbeststaubsauger & UHG",
    titel: "Jährliche technische Kontrolle durch eine ausgebildete Fachperson wurde durchgeführt",
  },

  {
    nr: 38,
    bereich: "Asbestabfälle",
    titel: "Asbesthaltige Abfälle werden laufend staubdicht verpackt und entfernt",
  },
  {
    nr: 39,
    bereich: "Asbestabfälle",
    titel: "Asbestabfälle werden im Freien in geschlossenen Behältern zwischengelagert",
  },

  {
    nr: 40,
    bereich: "Schlussreinigung",
    titel: "Nach Entfernung der Asbestmaterialien wird eine Schlussreinigung durchgeführt",
  },

  {
    nr: 41,
    bereich: "Aufhebung Schutzmassnahmen",
    titel: "Visuelle Vorabnahme ist durchgeführt und dokumentiert",
  },
  {
    nr: 42,
    bereich: "Aufhebung Schutzmassnahmen",
    titel: "Sanierungszone ist nach der Schlussreinigung frei von sichtbaren Asbestresten",
  },
  {
    nr: 43,
    bereich: "Aufhebung Schutzmassnahmen",
    titel: "Unabhängige Drittpartei führt visuelle Kontrolle und Zonenfreimessung durch",
  },

  {
    nr: 44,
    bereich: "Atemschutz",
    titel: "In der Sanierungszone werden geeignete Atemschutzgeräte verwendet",
  },
  {
    nr: 45,
    bereich: "Atemschutz",
    titel: "Qualität der Druckluft entspricht den Anforderungen",
  },
  {
    nr: 46,
    bereich: "Atemschutz",
    titel: "Dichtsitzkontrolle wird vor jeder Verwendung durchgeführt",
  },
  {
    nr: 47,
    bereich: "Atemschutz",
    titel: "Maximale Arbeitszeiten mit Atemschutz werden eingehalten",
    hinweis: "Maximal 3 Stunden ohne Pause und 7 Stunden pro Tag.",
  },

  {
    nr: 48,
    bereich: "Schutzanzüge",
    titel: "Alle Mitarbeitenden in der Sanierungszone tragen Schutzanzüge",
  },
  {
    nr: 49,
    bereich: "Schutzanzüge",
    titel: "Schutzanzüge entsprechen Kategorie 3 Typ 5/6 und sind korrekt verschlossen",
  },

  {
    nr: 50,
    bereich: "Notfallmassnahmen",
    titel: "Verhalten der Mitarbeitenden im Notfall ist geregelt",
  },
  {
    nr: 51,
    bereich: "Notfallmassnahmen",
    titel: "Mitarbeitende sind über das Verhalten in Notfällen instruiert",
  },
  {
    nr: 52,
    bereich: "Notfallmassnahmen",
    titel: "Fluchtwege sind bekannt und frei von Hindernissen",
  },

  {
    nr: 53,
    bereich: "Arbeiten geringen Umfangs",
    titel: "Arbeiten geringen Umfangs werden in einem Arbeitsgang mit erforderlichen Schutzmassnahmen erledigt",
  },
];

const prio1Nummern = new Set([
  6,
  10,
  12,
  13,
  19,
  20,
  23,
  26,
  29,
  31,
  33,
  38,
  42,
  44,
]);

export default function SuvaAuditPage() {
  const params = useParams();
  const id = params.id as string;

  const [antworten, setAntworten] = useState<Record<number, AuditAntwort>>({});
  const [offenerBereich, setOffenerBereich] = useState<string | null>(null);
  const [gespeichert, setGespeichert] = useState(false);

  const storageKey = `suva-audit-${id}`;

  useEffect(() => {
    const daten = localStorage.getItem(storageKey);

    if (daten) {
      try {
        setAntworten(JSON.parse(daten));
        setGespeichert(true);
      } catch {}
    }
  }, [storageKey]);

  const bereiche = useMemo(
    () => Array.from(new Set(punkte.map((punkt) => punkt.bereich))),
    []
  );

  const erfuellt = punkte.filter(
    (punkt) => antworten[punkt.nr]?.status === "erfuellt"
  ).length;

  const nichtErfuellt = punkte.filter(
    (punkt) => antworten[punkt.nr]?.status === "nicht-erfuellt"
  ).length;

  const nichtAnwendbar = punkte.filter(
    (punkt) => antworten[punkt.nr]?.status === "nicht-anwendbar"
  ).length;

  const offen =
    punkte.length - erfuellt - nichtErfuellt - nichtAnwendbar;

  const prio1NichtErfuellt = punkte.filter(
    (punkt) =>
      prio1Nummern.has(punkt.nr) &&
      antworten[punkt.nr]?.status === "nicht-erfuellt"
  ).length;

  const prio1Offen = punkte.filter(
    (punkt) =>
      prio1Nummern.has(punkt.nr) &&
      (!antworten[punkt.nr] ||
        antworten[punkt.nr]?.status === "offen")
  ).length;

  const prio1Erfuellt = punkte.filter(
    (punkt) =>
      prio1Nummern.has(punkt.nr) &&
      antworten[punkt.nr]?.status === "erfuellt"
  ).length;

  const arbeitsbereit =
    prio1NichtErfuellt === 0 && prio1Offen === 0;

  const bewertet = erfuellt + nichtErfuellt + nichtAnwendbar;

  const prozent =
    punkte.length > 0
      ? Math.round((bewertet / punkte.length) * 100)
      : 0;

  function statusSetzen(nr: number, status: AuditStatus) {
    setAntworten((alt) => ({
      ...alt,
      [nr]: {
        status,
        notiz: alt[nr]?.notiz || "",
      },
    }));

    if (status === "nicht-erfuellt") {
      const punkt = punkte.find((p) => p.nr === nr);

      if (punkt) {
        const maengelKey = `maengel-${id}`;
        const raw = localStorage.getItem(maengelKey);

        let maengel = [];

        try {
          maengel = raw ? JSON.parse(raw) : [];
        } catch {
          maengel = [];
        }

        if (!Array.isArray(maengel)) {
          maengel = [];
        }

        const bereitsVorhanden = maengel.some(
          (mangel) =>
            mangel.quelle === "SUVA Audit" &&
            mangel.suvaPunkt === nr &&
            mangel.status !== "behoben"
        );

        if (!bereitsVorhanden) {
          const neuerMangel = {
            id: crypto.randomUUID(),
            titel: `SUVA Punkt ${nr}: ${punkt.titel}`,
            beschreibung:
              "SUVA-Anforderung wurde im Audit als nicht erfüllt markiert.",
            prioritaet: prio1Nummern.has(nr)
              ? "kritisch"
              : "hoch",
            status: "offen",
            quelle: "SUVA Audit",
            suvaPunkt: nr,
            verantwortlich: "",
            frist: "",
            erstelltAm: new Date().toISOString(),
          };

          localStorage.setItem(
            maengelKey,
            JSON.stringify([neuerMangel, ...maengel])
          );
        }
      }
    }

    setGespeichert(false);
  }

  function notizSetzen(nr: number, notiz: string) {
    setAntworten((alt) => ({
      ...alt,
      [nr]: {
        status: alt[nr]?.status || "offen",
        notiz,
      },
    }));

    setGespeichert(false);
  }

  function speichern() {
    localStorage.setItem(storageKey, JSON.stringify(antworten));
    setGespeichert(true);
  }

  function bereichStatus(bereich: string) {
    const bereichPunkte = punkte.filter(
      (punkt) => punkt.bereich === bereich
    );

    const fertig = bereichPunkte.filter((punkt) => {
      const status = antworten[punkt.nr]?.status;

      return (
        status === "erfuellt" ||
        status === "nicht-erfuellt" ||
        status === "nicht-anwendbar"
      );
    }).length;

    return {
      fertig,
      total: bereichPunkte.length,
    };
  }

  return (
    <AppShell
      title="SUVA-Audit"
      subtitle="Kontrolle nach SUVA 88319.D mit PRIO-1-Bewertung."
      backHref={`/baustellen/${id}`}
      backLabel="Zur Baustelle"
    >

      

      <div className="mx-auto max-w-[1400px] space-y-5 p-6">

        <section className="rounded-[20px] border border-slate-200 bg-white p-6 text-slate-900">

          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">

            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                AUDIT-BEREITSCHAFT
              </div>

              <h2 className="mt-2 text-2xl font-black">
                {nichtErfuellt > 0
                  ? "Massnahmen erforderlich"
                  : offen === 0
                  ? "Audit vollständig"
                  : "Kontrolle läuft"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {bewertet} von 53 Kontrollpunkten geprüft.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

              <div className="rounded-2xl bg-white/5 px-5 py-4">
                <strong className="block text-2xl text-[#e77818]">
                  {prozent}%
                </strong>
                <span className="text-xs text-slate-500">
                  geprüft
                </span>
              </div>

              <div className="rounded-2xl bg-white/5 px-5 py-4">
                <strong className="block text-2xl text-green-400">
                  {erfuellt}
                </strong>
                <span className="text-xs text-slate-500">
                  erfüllt
                </span>
              </div>

              <div className="rounded-2xl bg-white/5 px-5 py-4">
                <strong
                  className={`block text-2xl ${
                    nichtErfuellt > 0
                      ? "text-red-400"
                      : "text-white"
                  }`}
                >
                  {nichtErfuellt}
                </strong>
                <span className="text-xs text-slate-500">
                  nicht erfüllt
                </span>
              </div>

              <div className="rounded-2xl bg-white/5 px-5 py-4">
                <strong className="block text-2xl">
                  {offen}
                </strong>
                <span className="text-xs text-slate-500">
                  offen
                </span>
              </div>

            </div>

          </div>
        </section>

        {prio1NichtErfuellt > 0 && (
          <section className="rounded-[22px] border-2 border-red-500 bg-red-600 p-5 text-white">

            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-red-100">
              SUVA PRIO 1
            </div>

            <h2 className="mt-1 text-xl font-black">
              ⛔ Nicht arbeitsbereit
            </h2>

            <p className="mt-2 text-sm text-red-50">
              {prio1NichtErfuellt} kritische SUVA-Anforderung
              {prio1NichtErfuellt === 1 ? " ist" : "en sind"} nicht erfüllt.
              Diese Punkte müssen vor der Freigabe behoben werden.
            </p>

          </section>
        )}

        {prio1NichtErfuellt === 0 && prio1Offen > 0 && (
          <section className="rounded-[22px] border border-[#efc39f] bg-[#fff8f1] p-5">

            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#a95310]">
              SUVA PRIO 1
            </div>

            <h2 className="mt-1 text-lg font-black">
              ⚠ {prio1Offen} kritische Punkte noch nicht geprüft
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Die Baustelle erhält die vollständige Freigabe erst,
              wenn alle Prio-1-Punkte kontrolliert wurden.
            </p>

          </section>
        )}

        {arbeitsbereit && (
          <section className="rounded-[22px] border border-green-200 bg-green-50 p-5">

            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-green-700">
              SUVA PRIO 1
            </div>

            <h2 className="mt-1 text-lg font-black text-green-800">
              ✓ Alle 14 kritischen Punkte erfüllt
            </h2>

            <p className="mt-1 text-sm text-green-700">
              Keine offene oder nicht erfüllte Prio-1-Anforderung.
            </p>

          </section>
        )}

        {nichtErfuellt > 0 && (
          <section className="rounded-[22px] border border-red-200 bg-red-50 p-5">

            <strong className="text-red-700">
              ⚠ Nicht erfüllte SUVA-Anforderungen
            </strong>

            <p className="mt-1 text-sm text-red-700">
              Für jeden nicht erfüllten Punkt muss eine Massnahme definiert
              und dokumentiert werden.
            </p>

          </section>
        )}

        <section className="grid gap-5 lg:grid-cols-[300px_1fr]">

          <aside className="h-fit rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-5">

            <div className="px-2 pb-4">

              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                KONTROLLBEREICHE
              </div>

              <h2 className="mt-1 text-lg font-black">
                53 Kontrollpunkte
              </h2>

            </div>

            <div className="space-y-1">

              {bereiche.map((bereich) => {
                const status = bereichStatus(bereich);

                return (
                  <button
                    key={bereich}
                    type="button"
                    onClick={() =>
                      setOffenerBereich(
                        offenerBereich === bereich ? null : bereich
                      )
                    }
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left ${
                      offenerBereich === bereich
                        ? "bg-[#fff2cc]"
                        : "hover:bg-slate-50"
                    }`}
                  >

                    <span className="text-xs font-bold">
                      {bereich}
                    </span>

                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black">
                      {status.fertig}/{status.total}
                    </span>

                  </button>
                );
              })}

            </div>

          </aside>

          <section className="space-y-5">

            {bereiche.map((bereich) => {
              if (
                offenerBereich !== null &&
                offenerBereich !== bereich
              ) {
                return null;
              }

              const bereichPunkte = punkte.filter(
                (punkt) => punkt.bereich === bereich
              );

              return (
                <section
                  key={bereich}
                  className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm"
                >

                  <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">

                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#b77a13]">
                      SUVA
                    </div>

                    <h2 className="mt-1 text-lg font-black">
                      {bereich}
                    </h2>

                  </div>

                  <div className="divide-y divide-slate-100">

                    {bereichPunkte.map((punkt) => {
                      const istPrio1 = prio1Nummern.has(punkt.nr);

                      const antwort =
                        antworten[punkt.nr] || {
                          status: "offen",
                          notiz: "",
                        };

                      const nachkontrolleErforderlich =
                        antwort.notiz?.includes(
                          "Nachkontrolle erforderlich"
                        );

                      return (
                        <div
                          key={punkt.nr}
                          className={`p-5 ${
                            antwort.status === "nicht-erfuellt"
                              ? "bg-red-50"
                              : nachkontrolleErforderlich
                              ? "bg-[#fff9e8]"
                              : antwort.status === "erfuellt"
                              ? "bg-green-50/30"
                              : ""
                          }`}
                        >

                          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">

                            <div className="flex gap-4">

                              <div
                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                                  antwort.status === "erfuellt"
                                    ? "bg-green-600 text-white"
                                    : antwort.status === "nicht-erfuellt"
                                    ? "bg-red-600 text-white"
                                    : "bg-[#17565d] text-white"
                                }`}
                              >
                                {antwort.status === "erfuellt"
                                  ? "✓"
                                  : punkt.nr}
                              </div>

                              <div>

                                <div className="flex flex-wrap items-center gap-2">

                                  <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                                    Kontrollpunkt {punkt.nr}
                                  </div>

                                  {istPrio1 && (
                                    <span className="rounded-full bg-red-600 px-2 py-1 text-[9px] font-black tracking-wide text-white">
                                      PRIO 1
                                    </span>
                                  )}

                                  {nachkontrolleErforderlich && (
                                    <span className="rounded-full bg-[#17565d] px-2 py-1 text-[9px] font-black tracking-wide text-black">
                                      NACHKONTROLLE
                                    </span>
                                  )}

                                </div>

                                <h3 className="mt-1 max-w-3xl text-sm font-black leading-6">
                                  {punkt.titel}
                                </h3>

                                {punkt.hinweis && (
                                  <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">
                                    {punkt.hinweis}
                                  </p>
                                )}

                              </div>

                            </div>

                            <div className="flex flex-wrap gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  statusSetzen(
                                    punkt.nr,
                                    "erfuellt"
                                  )
                                }
                                className={`rounded-xl px-3 py-2 text-xs font-black ${
                                  antwort.status === "erfuellt"
                                    ? "bg-green-600 text-white"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                ✓ Erfüllt
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  statusSetzen(
                                    punkt.nr,
                                    "nicht-erfuellt"
                                  )
                                }
                                className={`rounded-xl px-3 py-2 text-xs font-black ${
                                  antwort.status === "nicht-erfuellt"
                                    ? "bg-red-600 text-white"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                ✕ Nicht erfüllt
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  statusSetzen(
                                    punkt.nr,
                                    "nicht-anwendbar"
                                  )
                                }
                                className={`rounded-xl px-3 py-2 text-xs font-black ${
                                  antwort.status ===
                                  "nicht-anwendbar"
                                    ? "bg-slate-700 text-white"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                – N/A
                              </button>

                            </div>

                          </div>

                          {(antwort.status === "nicht-erfuellt" ||
                            antwort.notiz) && (
                            <div className="mt-4 pl-0 xl:pl-[60px]">

                              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                                Feststellung / Massnahme / Notiz
                              </label>

                              <textarea
                                value={antwort.notiz}
                                onChange={(e) =>
                                  notizSetzen(
                                    punkt.nr,
                                    e.target.value
                                  )
                                }
                                placeholder={
                                  antwort.status ===
                                  "nicht-erfuellt"
                                    ? "Mangel und Verbesserungsmassnahme dokumentieren..."
                                    : "Notiz hinzufügen..."
                                }
                                className={`min-h-24 w-full resize-none rounded-xl border p-4 text-sm outline-none ${
                                  antwort.status ===
                                  "nicht-erfuellt"
                                    ? "border-red-200 bg-white focus:border-red-400"
                                    : "border-slate-200 bg-slate-50 focus:border-[#17565d]"
                                }`}
                              />

                            </div>
                          )}

                        </div>
                      );
                    })}

                  </div>

                </section>
              );
            })}

          </section>

        </section>

        <section className="sticky bottom-4 z-20 rounded-[22px] border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur">

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

            <div>

              <strong className="text-sm">
                {gespeichert
                  ? "✓ SUVA Audit gespeichert"
                  : "Änderungen noch nicht gespeichert"}
              </strong>

              <p className="mt-1 text-xs text-slate-500">
                {erfuellt} erfüllt · {nichtErfuellt} nicht erfüllt · {offen} offen
              </p>

              <p
                className={`mt-1 text-xs font-bold ${
                  prio1NichtErfuellt > 0
                    ? "text-red-600"
                    : prio1Offen > 0
                    ? "text-[#a95310]"
                    : "text-green-600"
                }`}
              >
                PRIO 1: {prio1Erfuellt}/14 erfüllt
                {prio1NichtErfuellt > 0
                  ? ` · ${prio1NichtErfuellt} kritisch`
                  : prio1Offen > 0
                  ? ` · ${prio1Offen} offen`
                  : " · vollständig erfüllt"}
              </p>

            </div>

            <button
              type="button"
              onClick={speichern}
              className="rounded-xl bg-[#17565d] px-6 py-4 text-sm font-black text-black hover:bg-[#12464c]"
            >
              Audit speichern
            </button>

          </div>

        </section>

      </div>

    </AppShell>
  );
}
