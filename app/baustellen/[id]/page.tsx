"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppShell from "../../components/ui/AppShell";

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
  const [suvaStatus, setSuvaStatus] = useState({
    prio1Erfuellt: 0,
    prio1Offen: 14,
    prio1NichtErfuellt: 0,
    erfuellt: 0,
    nichtErfuellt: 0,
    offen: 53,
  });

  const [tagescheckStatus, setTagescheckStatus] = useState({
    vorhanden: false,
    status: "offen",
  });

  const [personenInZone, setPersonenInZone] = useState(0);
  const [anzahlDokumente, setAnzahlDokumente] = useState(0);
  const [journalHeute, setJournalHeute] = useState(false);
  const [anzahlZonenplaene, setAnzahlZonenplaene] = useState(0);
  const [anzahlMitarbeiter, setAnzahlMitarbeiter] = useState(0);

  const [kontrolleStatus, setKontrolleStatus] = useState({
    vorhanden: false,
    abgeschlossen: false,
    nachkontrolle: false,
  });

  const [maengelStatus, setMaengelStatus] = useState({
    offen: 0,
    kritisch: 0,
  });

  const [geraeteStatus, setGeraeteStatus] = useState({
    total: 0,
    gueltig: 0,
    baldFaellig: 0,
    abgelaufen: 0,
  });

  useEffect(() => {
    const alle = JSON.parse(localStorage.getItem("baustellen") || "[]");

    const gefunden = alle.find(
      (b: Baustelle) => b.id === id
    );

    setBaustelle(gefunden || null);

    const heute = new Date().toISOString().slice(0, 10);
    const tagescheckRaw = localStorage.getItem(
      `tagescheck-${id}-${heute}`
    );

    if (tagescheckRaw) {
      try {
        const tagescheck = JSON.parse(tagescheckRaw);

        setTagescheckStatus({
          vorhanden: true,
          status: tagescheck.status || "offen",
        });
      } catch {}
    }

    const zonenRaw = localStorage.getItem(
      `zonenzutritt-${id}-${heute}`
    );

    if (zonenRaw) {
      try {
        const eintraege = JSON.parse(zonenRaw);

        const letzterStatus: Record<
          string,
          "eintritt" | "austritt"
        > = {};

        for (const eintrag of eintraege) {
          if (!letzterStatus[eintrag.mitarbeiterId]) {
            letzterStatus[eintrag.mitarbeiterId] = eintrag.typ;
          }
        }

        const aktuell = Object.values(letzterStatus).filter(
          (typ) => typ === "eintritt"
        ).length;

        setPersonenInZone(aktuell);
      } catch {}
    }

    const dokumenteRaw = localStorage.getItem(`dokumente-${id}`);

    if (dokumenteRaw) {
      try {
        const dokumente = JSON.parse(dokumenteRaw);

        if (Array.isArray(dokumente)) {
          setAnzahlDokumente(dokumente.length);

          const zonenplaene = dokumente.filter(
            (dokument) => dokument.ordnerId === "zonenplan"
          );

          setAnzahlZonenplaene(zonenplaene.length);
        }
      } catch {}
    }

    const mitarbeiterRaw = localStorage.getItem(
      `baustellen-mitarbeiter-${id}`
    );

    if (mitarbeiterRaw) {
      try {
        const zugewiesen = JSON.parse(mitarbeiterRaw);

        if (Array.isArray(zugewiesen)) {
          setAnzahlMitarbeiter(zugewiesen.length);
        }
      } catch {}
    }

    const as10Raw = localStorage.getItem(`as10-${id}`);

    if (as10Raw) {
      try {
        const as10 = JSON.parse(as10Raw);

        setKontrolleStatus({
          vorhanden: true,
          abgeschlossen: Boolean(as10.schluss),
          nachkontrolle: Boolean(as10.nachkontrolle),
        });
      } catch {}
    }

    const maengelRaw = localStorage.getItem(`maengel-${id}`);

    if (maengelRaw) {
      try {
        const maengel = JSON.parse(maengelRaw);

        if (Array.isArray(maengel)) {
          const offene = maengel.filter(
            (mangel) => mangel.status !== "behoben"
          );

          const kritische = offene.filter(
            (mangel) => mangel.prioritaet === "kritisch"
          );

          setMaengelStatus({
            offen: offene.length,
            kritisch: kritische.length,
          });
        }
      } catch {}
    }

    const geraeteRaw = localStorage.getItem(`geraete-${id}`);

    if (geraeteRaw) {
      try {
        const geraete = JSON.parse(geraeteRaw);

        if (Array.isArray(geraete)) {
          let gueltig = 0;
          let baldFaellig = 0;
          let abgelaufen = 0;

          const heuteDatum = new Date();
          heuteDatum.setHours(0, 0, 0, 0);

          for (const geraet of geraete) {
            if (!geraet.naechstePruefung) {
              abgelaufen++;
              continue;
            }

            const pruefung = new Date(
              `${geraet.naechstePruefung}T00:00:00`
            );

            const diff = Math.ceil(
              (pruefung.getTime() - heuteDatum.getTime()) /
                (1000 * 60 * 60 * 24)
            );

            if (diff < 0) {
              abgelaufen++;
            } else if (diff <= 30) {
              baldFaellig++;
            } else {
              gueltig++;
            }
          }

          setGeraeteStatus({
            total: geraete.length,
            gueltig,
            baldFaellig,
            abgelaufen,
          });
        }
      } catch {}
    }

    const journalKey = `journal-${id}-${heute}`;
    const journalRaw = localStorage.getItem(journalKey);

    if (journalRaw) {
      setJournalHeute(true);
    }

    const auditRaw = localStorage.getItem(`suva-audit-${id}`);

    if (auditRaw) {
      try {
        const audit = JSON.parse(auditRaw);

        const prio1 = new Set([
          6, 10, 12, 13, 19, 20, 23,
          26, 29, 31, 33, 38, 42, 44,
        ]);

        let prio1Erfuellt = 0;
        let prio1Offen = 0;
        let prio1NichtErfuellt = 0;
        let erfuellt = 0;
        let nichtErfuellt = 0;
        let offen = 0;

        for (let nr = 1; nr <= 53; nr++) {
          const status = audit[nr]?.status || "offen";

          if (status === "erfuellt") erfuellt++;
          else if (status === "nicht-erfuellt") nichtErfuellt++;
          else if (status === "offen") offen++;

          if (prio1.has(nr)) {
            if (status === "erfuellt") prio1Erfuellt++;
            else if (status === "nicht-erfuellt") prio1NichtErfuellt++;
            else prio1Offen++;
          }
        }

        setSuvaStatus({
          prio1Erfuellt,
          prio1Offen,
          prio1NichtErfuellt,
          erfuellt,
          nichtErfuellt,
          offen,
        });
      } catch {}
    }
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
      <AppShell title="Baustelle" backHref="/baustellen" backLabel="Baustellen">
        <section className="bb-card p-8 text-sm font-semibold text-slate-600">
          Baustelle wird geladen …
        </section>
      </AppShell>
    );
  }

  const checklisten = baustelle.checklisten || [];

  const abgeschlossen = checklisten.filter(
    (c) => c.status === "Abgeschlossen"
  ).length;

  const prozent =
    checklisten.length > 0
      ? Math.round((abgeschlossen / checklisten.length) * 100)
      : 0;

  const offenePunkte = checklisten.filter(
    (c) => c.status !== "Abgeschlossen"
  ).length;

  const suvaKritisch = suvaStatus.prio1NichtErfuellt > 0;
  const suvaNochOffen =
    !suvaKritisch && suvaStatus.prio1Offen > 0;

  const tagescheckKritisch =
    tagescheckStatus.status === "nicht-arbeitsbereit";

  const tagescheckOffen =
    !tagescheckStatus.vorhanden ||
    tagescheckStatus.status === "offen";

  const gesamtKritisch =
    suvaKritisch || tagescheckKritisch;

  const gesamtOffen =
    !gesamtKritisch &&
    (suvaNochOffen || tagescheckOffen);

  const arbeitsstatus = gesamtKritisch
    ? "Nicht arbeitsbereit"
    : gesamtOffen
    ? "Prüfung offen"
    : "Arbeitsbereit";

  return (
    <AppShell
      title={baustelle.projektname}
      subtitle={`${baustelle.nummer || "Ohne Baustellen-Nr."} · ${baustelle.ort || "Ort offen"}`}
      backHref="/baustellen"
      backLabel="Baustellen"
      action={
        <div className="flex flex-wrap gap-3">
          <a
            href={`/baustellen/${id}/sanierungsplan`}
            className="bb-secondary-button bb-button-link"
          >
            Sanierungsplan
          </a>

          <a
            href={`/baustellen/${id}/zonenplan`}
            className="bb-primary-button bb-button-link"
          >
            Zonenplan
          </a>
        </div>
      }
    >
      <div className="bb-workspace space-y-5">

        {/* STATUSLEISTE */}
        <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white text-[#18212b] shadow-sm">

          <div className="grid gap-6 p-6 lg:grid-cols-[1.4fr_2fr]">

            <div className="flex items-center gap-5">

              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#fff1e4] text-3xl font-black text-[#e77818]">
                ✓
              </div>

              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Baustellenstatus
                </div>

                <h2
                  className={`mt-1 text-2xl font-black ${
                    suvaKritisch
                      ? "text-red-400"
                      : suvaNochOffen
                      ? "text-[#e77818]"
                      : "text-[#18212b]"
                  }`}
                >
                  {arbeitsstatus}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {tagescheckKritisch
                    ? "Der heutige Tagescheck enthält einen kritischen Punkt."
                    : suvaKritisch
                    ? `${suvaStatus.prio1NichtErfuellt} kritische SUVA-Prio-1-Punkte nicht erfüllt.`
                    : tagescheckOffen
                    ? "Der heutige Tagescheck ist noch nicht vollständig freigegeben."
                    : suvaNochOffen
                    ? `${suvaStatus.prio1Offen} SUVA-Prio-1-Punkte noch zu prüfen.`
                    : "Alle kritischen Anforderungen sind erfüllt."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">

              <div className="rounded-2xl border border-slate-100 bg-[#f8faf9] p-4">
                <strong className="block text-2xl">
                  {prozent}%
                </strong>
                <span className="text-xs text-slate-500">
                  Ablauf
                </span>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-[#f8faf9] p-4">
                <strong className="block text-2xl">
                  {offenePunkte}
                </strong>
                <span className="text-xs text-slate-500">
                  Punkte offen
                </span>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-[#f8faf9] p-4">
                <strong
                  className={`block text-2xl ${
                    suvaStatus.prio1NichtErfuellt > 0
                      ? "text-red-400"
                      : "text-green-400"
                  }`}
                >
                  {suvaStatus.prio1NichtErfuellt}
                </strong>
                <span className="text-xs text-slate-500">
                  Kritisch
                </span>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-[#f8faf9] p-4">
                <strong className="block text-2xl text-[#e77818]">
                  53
                </strong>
                <span className="text-xs text-slate-500">
                  SUVA Punkte
                </span>
              </div>

            </div>
          </div>
        </section>

        {/* SCHNELLZUGRIFF */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">

          <a
            href={`/baustellen/${id}/tagescheck`}
            className={`rounded-2xl border p-4 text-center shadow-sm transition ${
              tagescheckKritisch
                ? "border-red-300 bg-red-50"
                : tagescheckStatus.status === "arbeitsbereit"
                ? "border-green-200 bg-green-50"
                : "border-[#f1c59f] bg-[#fff8f1]"
            }`}
          >
            <div
              className={`text-2xl ${
                tagescheckKritisch
                  ? "text-red-600"
                  : tagescheckStatus.status === "arbeitsbereit"
                  ? "text-green-600"
                  : "text-[#d46c12]"
              }`}
            >
              {tagescheckKritisch
                ? "!"
                : tagescheckStatus.status === "arbeitsbereit"
                ? "✓"
                : "◷"}
            </div>

            <div className="mt-2 text-sm font-bold">
              Tagescheck
            </div>

            <div
              className={`mt-1 text-xs font-bold ${
                tagescheckKritisch
                  ? "text-red-600"
                  : tagescheckStatus.status === "arbeitsbereit"
                  ? "text-green-600"
                  : "text-[#a95310]"
              }`}
            >
              {tagescheckKritisch
                ? "Kritisch"
                : tagescheckStatus.status === "arbeitsbereit"
                ? "Erledigt"
                : "Offen"}
            </div>
          </a>

          <a
            href={`/baustellen/${id}/zonenzutritt`}
            className={`rounded-2xl border p-4 text-center shadow-sm transition ${
              personenInZone > 0
                ? "border-green-200 bg-green-50"
                : "border-slate-200 bg-white hover:border-[#e77818]"
            }`}
          >
            <div className="text-2xl">
              ⇄
            </div>

            <div className="mt-2 text-sm font-bold">
              Zonenzutritt
            </div>

            <div
              className={`mt-1 text-xs font-bold ${
                personenInZone > 0
                  ? "text-green-600"
                  : "text-slate-500"
              }`}
            >
              {personenInZone > 0
                ? `${personenInZone} in Zone`
                : "Niemand in Zone"}
            </div>
          </a>

          <a
            href={`/baustellen/${id}/mitarbeiter`}
            className={`rounded-2xl border p-4 text-center shadow-sm transition ${
              anzahlMitarbeiter > 0
                ? "border-green-200 bg-green-50"
                : "border-[#f1c59f] bg-[#fff8f1]"
            }`}
          >
            <div className="text-2xl">♙</div>

            <div className="mt-2 text-sm font-bold">
              Mitarbeiter
            </div>

            <div
              className={`mt-1 text-xs font-bold ${
                anzahlMitarbeiter > 0
                  ? "text-green-600"
                  : "text-[#a95310]"
              }`}
            >
              {anzahlMitarbeiter > 0
                ? `${anzahlMitarbeiter} zugewiesen`
                : "Noch niemand"}
            </div>
          </a>

          <a
            href={`/baustellen/${id}/dokumente`}
            className={`rounded-2xl border p-4 text-center shadow-sm transition ${
              anzahlDokumente > 0
                ? "border-[#f1c59f] bg-[#fff8f1]"
                : "border-slate-200 bg-white hover:border-[#e77818]"
            }`}
          >
            <div className="text-2xl">▤</div>

            <div className="mt-2 text-sm font-bold">
              Dokumente
            </div>

            <div
              className={`mt-1 text-xs font-bold ${
                anzahlDokumente > 0
                  ? "text-[#a95310]"
                  : "text-slate-500"
              }`}
            >
              {anzahlDokumente > 0
                ? `${anzahlDokumente} abgelegt`
                : "Noch keine"}
            </div>
          </a>

          <a
            href={`/baustellen/${id}/journal`}
            className={`rounded-2xl border p-4 text-center shadow-sm transition ${
              journalHeute
                ? "border-green-200 bg-green-50"
                : "border-[#f1c59f] bg-[#fff8f1]"
            }`}
          >
            <div className="text-2xl">
              {journalHeute ? "✓" : "☷"}
            </div>

            <div className="mt-2 text-sm font-bold">
              Journal
            </div>

            <div
              className={`mt-1 text-xs font-bold ${
                journalHeute
                  ? "text-green-600"
                  : "text-[#a95310]"
              }`}
            >
              {journalHeute
                ? "Heute erfasst"
                : "Heute offen"}
            </div>
          </a>

          <a
            href={`/baustellen/${id}/zonenplan`}
            className={`rounded-2xl border p-4 text-center shadow-sm transition ${
              anzahlZonenplaene > 0
                ? "border-green-200 bg-green-50"
                : "border-[#f1c59f] bg-[#fff8f1]"
            }`}
          >
            <div className="text-2xl">
              {anzahlZonenplaene > 0 ? "✓" : "⌑"}
            </div>

            <div className="mt-2 text-sm font-bold">
              Zonenplan
            </div>

            <div
              className={`mt-1 text-xs font-bold ${
                anzahlZonenplaene > 0
                  ? "text-green-600"
                  : "text-[#a95310]"
              }`}
            >
              {anzahlZonenplaene > 0
                ? `${anzahlZonenplaene} Plan${anzahlZonenplaene === 1 ? "" : "e"} vorhanden`
                : "Plan fehlt"}
            </div>
          </a>

          <a
            href={`/baustellen/${id}/visuelle-kontrolle`}
            className={`rounded-2xl border p-4 text-center shadow-sm transition ${
              kontrolleStatus.nachkontrolle
                ? "border-red-300 bg-red-50"
                : kontrolleStatus.abgeschlossen
                ? "border-green-200 bg-green-50"
                : "border-[#f1c59f] bg-[#fff8f1]"
            }`}
          >
            <div
              className={`text-2xl ${
                kontrolleStatus.nachkontrolle
                  ? "text-red-600"
                  : kontrolleStatus.abgeschlossen
                  ? "text-green-600"
                  : "text-[#d46c12]"
              }`}
            >
              {kontrolleStatus.nachkontrolle
                ? "!"
                : kontrolleStatus.abgeschlossen
                ? "✓"
                : "◉"}
            </div>

            <div className="mt-2 text-sm font-bold">
              Kontrollen
            </div>

            <div
              className={`mt-1 text-xs font-bold ${
                kontrolleStatus.nachkontrolle
                  ? "text-red-600"
                  : kontrolleStatus.abgeschlossen
                  ? "text-green-600"
                  : "text-[#a95310]"
              }`}
            >
              {kontrolleStatus.nachkontrolle
                ? "Nachkontrolle nötig"
                : kontrolleStatus.abgeschlossen
                ? "AS10 abgeschlossen"
                : kontrolleStatus.vorhanden
                ? "In Bearbeitung"
                : "Noch offen"}
            </div>
          </a>

          <a
            href={`/baustellen/${id}/geraete`}
            className={`rounded-2xl border p-4 text-center shadow-sm transition ${
              geraeteStatus.abgelaufen > 0
                ? "border-red-300 bg-red-50"
                : geraeteStatus.baldFaellig > 0
                ? "border-[#f1c59f] bg-[#fff8f1]"
                : geraeteStatus.total > 0
                ? "border-green-200 bg-green-50"
                : "border-slate-200 bg-white hover:border-[#e77818]"
            }`}
          >
            <div
              className={`text-2xl ${
                geraeteStatus.abgelaufen > 0
                  ? "text-red-600"
                  : geraeteStatus.baldFaellig > 0
                  ? "text-[#d46c12]"
                  : geraeteStatus.total > 0
                  ? "text-green-600"
                  : "text-slate-500"
              }`}
            >
              {geraeteStatus.abgelaufen > 0
                ? "!"
                : geraeteStatus.baldFaellig > 0
                ? "⚠"
                : "◫"}
            </div>

            <div className="mt-2 text-sm font-bold">
              Geräte
            </div>

            <div
              className={`mt-1 text-xs font-bold ${
                geraeteStatus.abgelaufen > 0
                  ? "text-red-600"
                  : geraeteStatus.baldFaellig > 0
                  ? "text-[#a95310]"
                  : geraeteStatus.total > 0
                  ? "text-green-600"
                  : "text-slate-500"
              }`}
            >
              {geraeteStatus.abgelaufen > 0
                ? `${geraeteStatus.abgelaufen} abgelaufen`
                : geraeteStatus.baldFaellig > 0
                ? `${geraeteStatus.baldFaellig} bald fällig`
                : geraeteStatus.total > 0
                ? `${geraeteStatus.total} geprüft`
                : "Keine Geräte"}
            </div>
          </a>

          <a
            href={`/baustellen/${id}/maengel`}
            className={`rounded-2xl border p-4 text-center shadow-sm transition ${
              maengelStatus.kritisch > 0
                ? "border-red-300 bg-red-50"
                : maengelStatus.offen > 0
                ? "border-[#f1c59f] bg-[#fff8f1]"
                : "border-green-200 bg-green-50"
            }`}
          >
            <div
              className={`text-2xl ${
                maengelStatus.kritisch > 0
                  ? "text-red-600"
                  : maengelStatus.offen > 0
                  ? "text-[#d46c12]"
                  : "text-green-600"
              }`}
            >
              {maengelStatus.kritisch > 0
                ? "!"
                : maengelStatus.offen > 0
                ? "⚠"
                : "✓"}
            </div>

            <div className="mt-2 text-sm font-bold">
              Mängel
            </div>

            <div
              className={`mt-1 text-xs font-bold ${
                maengelStatus.kritisch > 0
                  ? "text-red-600"
                  : maengelStatus.offen > 0
                  ? "text-[#a95310]"
                  : "text-green-600"
              }`}
            >
              {maengelStatus.kritisch > 0
                ? `${maengelStatus.kritisch} kritisch`
                : maengelStatus.offen > 0
                ? `${maengelStatus.offen} offen`
                : "Keine offenen"}
            </div>
          </a>

          <a
            href={`/baustellen/${id}/suva-audit`}
            className={`rounded-2xl border p-4 text-center shadow-sm transition ${
              suvaStatus.prio1NichtErfuellt > 0
                ? "border-red-300 bg-red-50"
                : suvaStatus.prio1Offen > 0
                ? "border-[#f1c59f] bg-[#fff8f1]"
                : "border-green-200 bg-green-50"
            }`}
          >
            <div
              className={`text-2xl ${
                suvaStatus.prio1NichtErfuellt > 0
                  ? "text-red-600"
                  : suvaStatus.prio1Offen > 0
                  ? "text-[#d46c12]"
                  : "text-green-600"
              }`}
            >
              {suvaStatus.prio1NichtErfuellt > 0
                ? "!"
                : suvaStatus.prio1Offen > 0
                ? "◇"
                : "✓"}
            </div>

            <div className="mt-2 text-sm font-bold">
              SUVA Audit
            </div>

            <div
              className={`mt-1 text-xs font-bold ${
                suvaStatus.prio1NichtErfuellt > 0
                  ? "text-red-600"
                  : suvaStatus.prio1Offen > 0
                  ? "text-[#a95310]"
                  : "text-green-600"
              }`}
            >
              {suvaStatus.prio1NichtErfuellt > 0
                ? `${suvaStatus.prio1NichtErfuellt} kritisch`
                : suvaStatus.prio1Offen > 0
                ? `${suvaStatus.prio1Offen} Prio 1 offen`
                : "14/14 Prio 1 erfüllt"}
            </div>
          </a>

        </section>

        {/* HAUPTBEREICH */}
        <div className="grid gap-5 xl:grid-cols-[1.65fr_0.75fr]">

          {/* AS1-AS10 */}
          <section
            id="ablauf"
            className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm"
          >

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  STANDARDPROZESS
                </div>

                <h2 className="mt-1 text-2xl font-black">
                  AS1–AS10 Ablauf
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Digitaler Ablauf dieser Baustelle
                </p>
              </div>

              <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black">
                {prozent}% abgeschlossen
              </div>

            </div>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#e77818] transition-all"
                style={{ width: `${prozent}%` }}
              />
            </div>

            <div className="mt-7 space-y-3">

              {checklisten.map((checkliste, index) => {

                const fertig =
                  checkliste.status === "Abgeschlossen";

                const bearbeitung =
                  checkliste.status === "In Bearbeitung";

                return (
                  <div
                    key={checkliste.code}
                    className="group flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-[#e77818] md:flex-row md:items-center"
                  >

                    <div className="flex items-center gap-4">

                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                          fertig
                            ? "bg-green-100 text-green-700"
                            : bearbeitung
                            ? "bg-[#fff0e4] text-[#a95310]"
                            : "bg-[#e77818] text-white"
                        }`}
                      >
                        {fertig ? "✓" : index + 1}
                      </div>

                      <div>
                        <div className="text-sm font-black">
                          {checkliste.code}
                        </div>

                        <div className="mt-1 text-sm text-slate-600">
                          {checkliste.name}
                        </div>
                      </div>

                    </div>

                    <div className="flex items-center gap-3">

                      <span
                        className={`rounded-full px-3 py-2 text-xs font-bold ${
                          fertig
                            ? "bg-green-50 text-green-700"
                            : bearbeitung
                            ? "bg-[#fff0e4] text-[#a95310]"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {checkliste.status || "Offen"}
                      </span>

                      <a
                        href={linkFuer(checkliste.code)}
                        className="rounded-xl bg-[#e77818] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#e77818] hover:text-white"
                      >
                        Öffnen →
                      </a>

                    </div>

                  </div>
                );
              })}

            </div>
          </section>

          {/* RECHTE SPALTE */}
          <div className="space-y-5">

            {/* SUVA */}
            <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">

              <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                SUVA 88319.D
              </div>

              <h3 className="mt-1 text-xl font-black">
                Audit-Bereitschaft
              </h3>

              <div className="my-6 flex justify-center">

                <div className="flex h-36 w-36 items-center justify-center rounded-full border-[12px] border-green-500">

                  <div className="text-center">
                    <strong className="block text-3xl">
                      {Math.round(
                        (suvaStatus.prio1Erfuellt / 14) * 100
                      )}%
                    </strong>
                    <span className="text-xs text-slate-500">
                      Prio 1
                    </span>
                  </div>

                </div>

              </div>

              <div className="space-y-3 text-sm">

                <div className="flex justify-between border-b pb-3">
                  <span className="text-slate-500">
                    Kontrollpunkte
                  </span>
                  <strong>
                    {suvaStatus.erfuellt +
                      suvaStatus.nichtErfuellt +
                      suvaStatus.offen}
                  </strong>
                </div>

                <div className="flex justify-between border-b pb-3">
                  <span className="text-slate-500">
                    Kritische Punkte
                  </span>
                  <strong
                    className={
                      suvaStatus.prio1NichtErfuellt > 0
                        ? "text-red-600"
                        : "text-green-600"
                    }
                  >
                    {suvaStatus.prio1NichtErfuellt} kritisch
                  </strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Status
                  </span>
                  <strong
                    className={
                      suvaKritisch
                        ? "text-red-600"
                        : suvaNochOffen
                        ? "text-[#a95310]"
                        : "text-green-600"
                    }
                  >
                    {suvaKritisch
                      ? "Nicht bereit"
                      : suvaNochOffen
                      ? "Prüfung offen"
                      : "Auditbereit"}
                  </strong>
                </div>

              </div>

              <a
                href={`/baustellen/${id}/suva-audit`}
                className="mt-6 block w-full rounded-xl bg-[#e77818] px-4 py-3 text-center text-sm font-black text-white hover:bg-[#c96210]"
              >
                SUVA Audit öffnen
              </a>

            </section>

            {/* NÄCHSTE AUFGABEN */}
            <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">

              <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                HEUTE
              </div>

              <h3 className="mt-1 text-xl font-black">
                Nächste Aufgaben
              </h3>

              <div className="mt-5 space-y-3">

                <div className="rounded-xl bg-slate-50 p-4">
                  <strong className="text-sm">
                    Tagescheck durchführen
                  </strong>
                  <p className="mt-1 text-xs text-slate-500">
                    Vor Arbeitsbeginn kontrollieren
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <strong className="text-sm">
                    Unterdruck kontrollieren
                  </strong>
                  <p className="mt-1 text-xs text-slate-500">
                    Messwerte dokumentieren
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <strong className="text-sm">
                    Baustellenjournal
                  </strong>
                  <p className="mt-1 text-xs text-slate-500">
                    Tagesaktivitäten erfassen
                  </p>
                </div>

              </div>

            </section>

          </div>
        </div>

      </div>
    </AppShell>
  );
}
