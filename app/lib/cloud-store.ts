import { createClient } from "./supabase/client";
import { istSupabaseKonfiguriert } from "./supabase/config";

type Row = { key: string; value: string | null; version: number };
type Profile = { id: string; rolle: "admin" | "vorarbeiter"; organisation_id: string; name: string | null };
type State = { status: "loading" | "ready" | "saving" | "error"; error: string; profile: Profile | null };
let state: State = { status: "loading", error: "", profile: null };
const cache = new Map<string, Row>();
const listeners = new Set<() => void>();
let changes = new Map<string, Row>();
let inFlight: Promise<void> | null = null;
let requestId: string | null = null;
let savedRole = "vorarbeiter";
let loading: Promise<void> | null = null;
const cloud = () => istSupabaseKonfiguriert();
function emit(next: Partial<State>) { state = { ...state, ...next }; listeners.forEach((listener) => listener()); }
export const cloudState = () => state;
export function subscribeCloud(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function hasPendingChanges() { return changes.size > 0 || inFlight !== null; }

export async function loadCloud() {
  if (!cloud()) { emit({status:"ready",error:""}); return; }
  if (loading) return loading;
  loading = (async () => {
    if (hasPendingChanges()) { await flushCloud(); if (hasPendingChanges()) return; }
    emit({status:"loading",error:""});
    try {
      const client = createClient();
      const {data: user, error: authError} = await client.auth.getUser();
      if (authError || !user.user) throw new Error("Bitte erneut anmelden.");
      const {data: profile, error: profileError} = await client.from("profile").select("id,rolle,organisation_id,name").eq("id",user.user.id).eq("aktiv",true).single();
      if (profileError || !profile || !["admin","vorarbeiter"].includes(profile.rolle)) throw new Error("Für dieses Konto fehlt die Zugriffsberechtigung. Bitte die Geschäftsleitung kontaktieren.");
      const rows: Row[] = [];
      for (let offset = 0; ; offset += 200) {
        const {data, error} = await client.from("app_records").select("key,value,version").order("key").range(offset,offset+199);
        if (error) throw new Error("Die gemeinsame Ablage ist nicht erreichbar. Bitte Verbindung und Einrichtung prüfen lassen.");
        rows.push(...data);
        if (data.length < 200) break;
      }
      cache.clear();
      rows.forEach(row => cache.set(row.key,row));
      savedRole = profile.rolle === "admin" ? savedRole : "vorarbeiter";
      emit({status:"ready",profile:profile as Profile,error:""});
    } catch (error) { emit({status:"error",error:error instanceof Error ? error.message : "Daten konnten nicht geladen werden."}); }
  })().finally(() => { loading = null; });
  return loading;
}

export async function flushCloud(): Promise<void> {
  if (!cloud() || !changes.size) return;
  if (inFlight) return inFlight;
  emit({status:"saving",error:""});
  requestId ??= crypto.randomUUID();
  const batch = [...changes.values()];
  inFlight = (async () => {
    try {
      const { data, error } = await createClient().rpc("save_app_records", {p_request:requestId,p_changes:batch});
      if (error) throw new Error(error.message.includes("CONFLICT")
        ? "Diese Daten wurden inzwischen auf einem anderen Gerät geändert. Deine Eingaben wurden nicht überschrieben. Sichere sie und lade danach den aktuellen Stand."
        : "Speichern nicht bestätigt. Bitte Verbindung prüfen und erneut versuchen. Deine Eingaben bleiben hier erhalten.");
      (data as Row[]).forEach(row => cache.set(row.key,row));
      changes = new Map();
      requestId = null;
      emit({status:"ready",error:""});
    } catch (error) { emit({status:"error",error:error instanceof Error ? error.message : "Speichern fehlgeschlagen."}); }
  })().finally(() => { inFlight = null; });
  return inFlight;
}

/** Synchronous view over a loaded snapshot. Cloud writes are an atomic, versioned batch. */
export const appStorage: Pick<Storage,"getItem"|"setItem"|"removeItem"> = {
  getItem(key) {
    if (!cloud()) return localStorage.getItem(key);
    if (key.startsWith("entwurf-")) return sessionStorage.getItem(`bb-draft-${state.profile?.id}-${key}`);
    if (key === "bb-role") return state.profile?.rolle === "admin" ? savedRole : "vorarbeiter";
    return changes.has(key) ? changes.get(key)!.value : cache.get(key)?.value ?? null;
  },
  setItem(key,value) {
    if (!cloud()) { localStorage.setItem(key,value); return; }
    if (key.startsWith("entwurf-")) { sessionStorage.setItem(`bb-draft-${state.profile?.id}-${key}`,value); return; }
    if (key === "bb-role") { if (state.profile?.rolle === "admin") savedRole = value; return; }
    queue(key,value);
  },
  removeItem(key) {
    if (!cloud()) { localStorage.removeItem(key); return; }
    if (key.startsWith("entwurf-")) { sessionStorage.removeItem(`bb-draft-${state.profile?.id}-${key}`); return; }
    queue(key,null);
  },
};
function queue(key: string,value: string | null) {
  if (!state.profile || inFlight || state.status === "error") throw new Error("Bitte zuerst den laufenden Speichervorgang abschliessen.");
  changes.set(key,{key,value,version:cache.get(key)?.version ?? 0});
  emit({status:"saving",error:""});
  // Coalesce all writes made by one UI action, including derived folder records.
  queueMicrotask(() => { void flushCloud(); });
}

export async function speichernBestaetigt() {
  if (!cloud()) return true;
  await flushCloud();
  return state.status === "ready" && !hasPendingChanges();
}
export function ungespeicherteDaten() { return JSON.stringify([...changes.values()],null,2); }
