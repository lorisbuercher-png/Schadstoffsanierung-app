"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export type ActiveSite = {
  id: string;
  projektname: string;
  nummer?: string;
  ort?: string;
  status?: string;
};

const preferenceKey = "bb-active-site";
const changeEvent = "bb-active-site-change";

export default function useActiveSite() {
  const pathname = usePathname();
  const [sites, setSites] = useState<ActiveSite[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    function refresh() {
      try {
        const stored: unknown = JSON.parse(localStorage.getItem("baustellen") || "[]");
        const active = Array.isArray(stored) ? stored.filter((site): site is ActiveSite =>
          site && typeof site.id === "string" && typeof site.projektname === "string" &&
          String(site.status || "").trim().toLowerCase() !== "abgeschlossen"
        ) : [];
        const routeId = pathname.match(/^\/baustellen\/([^/]+)/)?.[1];
        const saved = localStorage.getItem(preferenceKey);
        const nextId = active.find((site) => encodeURIComponent(site.id) === routeId)?.id ||
          active.find((site) => site.id === saved)?.id || "";
        setSites(active);
        setSelectedId(nextId);
        if (nextId && nextId !== saved) localStorage.setItem(preferenceKey, nextId);
      } catch {
        setSites([]);
        setSelectedId("");
      }
      setLoaded(true);
    }
    refresh();
    window.addEventListener(changeEvent, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(changeEvent, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [pathname]);

  function selectSite(id: string) {
    if (id && !sites.some((site) => site.id === id)) return;
    try {
      localStorage.setItem(preferenceKey, id);
    } catch {
      // Selection still works for this screen when browser storage is unavailable.
    }
    window.dispatchEvent(new Event(changeEvent));
    setSelectedId(id);
  }

  return { sites, selectedId, selectSite, loaded };
}
