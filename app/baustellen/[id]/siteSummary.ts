type RecordData = Record<string, unknown>;
export type Checkliste = { code: string; name: string; status: string };
export type Site = { id: string; projektname: string; nummer: string; ort: string; status: string; checklisten: Checkliste[] };
const object = (value: unknown): value is RecordData => !!value && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown) => typeof value === "string" ? value : "";
const priorityNumbers = new Set([6, 10, 12, 13, 19, 20, 23, 26, 29, 31, 33, 38, 42, 44]);

// Read existing records only. Keep the UTC day keys used by the daily forms.
export function readSiteSummary(storage: Pick<Storage, "getItem">, id: string, now = new Date()) {
  const errors: string[] = [];
  function read(key: string, array = false): RecordData | unknown[] {
    try {
      const raw = storage.getItem(key);
      if (!raw) return array ? [] : {};
      const value: unknown = JSON.parse(raw);
      if (array ? Array.isArray(value) : object(value)) return value as RecordData | unknown[];
    } catch { /* Report unavailable records without changing them. */ }
    errors.push(key);
    return array ? [] : {};
  }
  const list = (key: string) => read(key, true) as unknown[];
  const record = (key: string) => read(key) as RecordData;
  const day = now.toISOString().slice(0, 10);
  const localDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const found = list("baustellen").find((entry) => object(entry) && entry.id === id);
  let site: Site | null = null;
  if (object(found)) {
    site = { id, projektname: text(found.projektname) || "Baustelle", nummer: text(found.nummer), ort: text(found.ort), status: text(found.status),
      checklisten: Array.isArray(found.checklisten) ? found.checklisten.filter(object).filter((c) => typeof c.code === "string").map((c) => ({ code: text(c.code), name: text(c.name), status: text(c.status) })) : [] };
  }
  const audit = record(`suva-audit-${id}`);
  let priorityOpen = 0, priorityFailed = 0, fulfilled = 0, open = 0, failed = 0, notApplicable = 0;
  for (let nr = 1; nr <= 53; nr++) {
    const answer = audit[nr];
    const status = object(answer) ? answer.status : "offen";
    if (status === "erfuellt") fulfilled++;
    else if (status === "nicht-erfuellt") failed++;
    else if (status === "nicht-anwendbar") notApplicable++;
    else open++;
    if (priorityNumbers.has(nr)) {
      if (status === "nicht-erfuellt") priorityFailed++;
      else if (status !== "erfuellt" && status !== "nicht-anwendbar") priorityOpen++;
    }
  }
  const dailyStatus = text(record(`tagescheck-${id}-${day}`).status);
  const issues = list(`maengel-${id}`).filter(object).filter((issue) => issue.status !== "behoben");
  const criticalIssues = issues.filter((issue) => issue.prioritaet === "kritisch").length;
  const entries = list(`zonenzutritt-${id}-${day}`).filter(object);
  const latest = new Map<string, string>();
  // The existing log stores the newest entry first.
  for (const entry of entries) if (text(entry.mitarbeiterId) && !latest.has(text(entry.mitarbeiterId))) latest.set(text(entry.mitarbeiterId), text(entry.typ));
  const documents = list(`dokumente-${id}`).filter(object);
  const plan = record(`zonenplan-${id}`);
  const planInEditor = !!text(plan.grundriss) || (Array.isArray(plan.elemente) && plan.elemente.length > 0);
  const planDocuments = documents.filter((document) => document.ordnerId === "zonenplan").length;
  const journal = record(`journal-${id}`);
  const control = record(`as10-${id}`);
  const devices = list(`geraete-${id}`).filter(object);
  let deviceOverdue = 0, deviceSoon = 0, deviceUnknown = 0;
  for (const device of devices) {
    const date = text(device.naechstePruefung);
    const deadline = new Date(`${date}T00:00:00`);
    if (!date || !Number.isFinite(deadline.getTime())) { deviceUnknown++; continue; }
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const days = Math.ceil((deadline.getTime() - today.getTime()) / 86400000);
    if (days < 0) deviceOverdue++; else if (days <= 30) deviceSoon++;
  }
  const team = list(`baustellen-mitarbeiter-${id}`).length;
  return { site, errors, day, priorityOpen, priorityFailed, fulfilled, open, failed, notApplicable, dailyStatus,
    issues: issues.length, criticalIssues, peopleInZone: [...latest.values()].filter((status) => status === "eintritt").length,
    documents: documents.length, planInEditor, planDocuments, journalToday: journal.datum === localDay,
    controlNote: control.nachkontrolle === true ? "Nachkontrolle vermerkt" : text(control.schluss) ? "Schlussbeurteilung erfasst" : "Noch keine Schlussbeurteilung",
    devices: devices.length, deviceOverdue, deviceSoon, deviceUnknown, team };
}
