export type ZonenBuchung = { mitarbeiterId?: string; typ?: string; timestamp?: string };

/** Event time decides presence, not the order in which corrections were entered. */
export function personenInZone(eintraege: ZonenBuchung[]) {
  const letzte = new Map<string, ZonenBuchung>();
  for (const eintrag of eintraege) {
    if (!eintrag.mitarbeiterId || !["eintritt", "austritt"].includes(eintrag.typ || "")) continue;
    const vorher = letzte.get(eintrag.mitarbeiterId);
    const zeit = Date.parse(eintrag.timestamp || "");
    const vorherZeit = Date.parse(vorher?.timestamp || "");
    // Legacy records without timestamps keep the stored newest-first order.
    if (!vorher || (Number.isFinite(zeit) && (!Number.isFinite(vorherZeit) || zeit > vorherZeit))) {
      letzte.set(eintrag.mitarbeiterId, eintrag);
    }
  }
  return [...letzte.values()].filter((eintrag) => eintrag.typ === "eintritt").map((eintrag) => eintrag.mitarbeiterId!);
}

export function hatZonenplan(plan: { datei?: { dataUrl?: string }; grundriss?: string } | null) {
  return Boolean(plan?.datei?.dataUrl || plan?.grundriss);
}

export type Freigabe = { bereit: boolean; kritisch: boolean; gruende: { text: string; pfad: string }[] };

export function freigabePruefen(daten: {
  tagescheckStatus: string; zonenplanVorhanden: boolean; suvaOffen: number;
  suvaKritisch: number; maengelKritisch: number; geraeteOffen: number;
}): Freigabe {
  const gruende: Freigabe["gruende"] = [];
  if (daten.tagescheckStatus !== "arbeitsbereit") gruende.push({ text: "Tagescheck noch nicht freigegeben", pfad: "tagescheck" });
  if (!daten.zonenplanVorhanden) gruende.push({ text: "Zonenplan fehlt", pfad: "zonenplan" });
  if (daten.suvaKritisch || daten.suvaOffen) gruende.push({ text: "SUVA-Checkliste: wichtige Prüfpunkte offen", pfad: "suva-audit" });
  if (daten.maengelKritisch) gruende.push({ text: "Kritische Mängel offen", pfad: "maengel" });
  if (daten.geraeteOffen) gruende.push({ text: "Geräteprüfung fehlt oder ist abgelaufen", pfad: "geraete" });
  return { bereit: gruende.length === 0, kritisch: daten.tagescheckStatus === "nicht-arbeitsbereit" || daten.suvaKritisch > 0 || daten.maengelKritisch > 0 || daten.geraeteOffen > 0, gruende };
}

export function geraetePruefungOffen(geraete: { naechstePruefung?: string }[], datum: string) {
  return geraete.filter((g) => !g.naechstePruefung || !Number.isFinite(Date.parse(g.naechstePruefung)) || g.naechstePruefung < datum).length;
}

/** The same stored prerequisites apply to dashboard, project and booking actions. */
export function gespeicherteFreigabe(speicher: Pick<Storage, "getItem">, id: string, datum: string): Freigabe {
  function lesen<T>(key: string, fallback: T): T {
    try { return JSON.parse(speicher.getItem(key) || "null") ?? fallback; } catch { return fallback; }
  }
  const audit = lesen<Record<string, { status?: string }>>(`suva-audit-${id}`, {});
  const pruefungen = [6, 10, 12, 13, 19, 20, 23, 26, 29, 31, 33, 38, 42, 44].map((nr) => audit[nr]?.status);
  const maengel = lesen<{ prioritaet?: string; status?: string }[]>(`maengel-${id}`, []);
  const geraete = lesen<{ naechstePruefung?: string }[]>(`geraete-${id}`, []);
  return freigabePruefen({
    tagescheckStatus: lesen<{ status?: string }>(`tagescheck-${id}-${datum}`, {}).status || "offen",
    zonenplanVorhanden: hatZonenplan(lesen(`zonenplan-${id}`, null)),
    suvaOffen: pruefungen.filter((s) => s !== "erfuellt" && s !== "nicht-erfuellt").length,
    suvaKritisch: pruefungen.filter((s) => s === "nicht-erfuellt").length,
    maengelKritisch: Array.isArray(maengel) ? maengel.filter((m) => m.status !== "behoben" && m.prioritaet === "kritisch").length : 1,
    geraeteOffen: Array.isArray(geraete) ? geraetePruefungOffen(geraete, datum) : 1,
  });
}
