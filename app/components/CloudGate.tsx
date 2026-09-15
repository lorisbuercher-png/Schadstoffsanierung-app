"use client";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cloudState, subscribeCloud, loadCloud, flushCloud, hasPendingChanges, ungespeicherteDaten } from "../lib/cloud-store";
import { istSupabaseKonfiguriert } from "../lib/supabase/config";

export default function CloudGate({children}: {children: ReactNode}) {
  const pathname = usePathname();
  const [state,setState] = useState(cloudState);
  const [loadedPath,setLoadedPath] = useState("");
  const publicPage = pathname === "/login" || pathname.startsWith("/auth/");
  const enabled = istSupabaseKonfiguriert() && !publicPage;
  useEffect(() => subscribeCloud(() => setState(cloudState())), []);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    void loadCloud().then(() => { if (active) setLoadedPath(pathname); });
    return () => { active = false; };
  }, [pathname,enabled]);
  useEffect(() => {
    if (!enabled) return;
    function leaving(event: BeforeUnloadEvent) {
      if (hasPendingChanges()) { event.preventDefault(); event.returnValue = ""; }
    }
    window.addEventListener("beforeunload",leaving);
    return () => window.removeEventListener("beforeunload",leaving);
  }, [enabled]);
  if (!enabled) return children;
  const blocked = state.status !== "ready" || loadedPath !== pathname;
  return <>
    {loadedPath === pathname && state.profile && <div inert={blocked}>{children}</div>}
    {blocked && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-100/95 p-6" role="alert" aria-busy={state.status !== "error"}>
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="text-xl font-semibold">{state.status === "error" ? "Aktion erforderlich" : state.status === "saving" ? "Wird gemeinsam gespeichert …" : "Baustellendaten werden geladen …"}</h1>
        <p className="mt-4 text-sm text-slate-600">{state.error || "Bitte einen Moment warten."}</p>
        {state.status === "error" && <div className="mt-6 flex flex-wrap gap-3">
          <button className="bb-primary-button" onClick={() => { void (hasPendingChanges() ? flushCloud() : loadCloud()); }}>Erneut versuchen</button>
          {hasPendingChanges() && <button className="bb-secondary-button" onClick={() => {
            const url = URL.createObjectURL(new Blob([ungespeicherteDaten()],{type:"application/json"}));
            const link = document.createElement("a"); link.href=url; link.download="bb-ungespeicherte-eingaben.json"; link.click();
            setTimeout(() => URL.revokeObjectURL(url),30000);
          }}>Eingaben sichern</button>}
          {hasPendingChanges() && <button className="bb-secondary-button" onClick={() => {
            if (confirm("Ungespeicherte Änderungen verwerfen und den aktuellen Stand laden?")) window.location.reload();
          }}>Änderungen verwerfen</button>}
          {!hasPendingChanges() && <a className="bb-secondary-button" href="/login">Zur Anmeldung</a>}
        </div>}
      </section>
    </div>}
  </>;
}
