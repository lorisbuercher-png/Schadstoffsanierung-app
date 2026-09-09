"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { istSupabaseKonfiguriert } from "../../lib/supabase/config";

export default function AuthUserMenu() {
  const router = useRouter();
  const [name, setName] = useState("Loris Bürcher");
  const konfiguriert = istSupabaseKonfiguriert();

  useEffect(() => {
    if (!konfiguriert) return;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;

      setName(
        user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "B&B"
      );
    });
  }, [konfiguriert]);

  async function abmelden() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initialen = name
    .split(" ")
    .filter(Boolean)
    .map((teil) => teil[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <div className="bb-user-avatar" title={name}>{initialen}</div>
      {konfiguriert && (
        <button
          type="button"
          onClick={abmelden}
          className="hidden rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900 sm:block"
        >
          Abmelden
        </button>
      )}
    </div>
  );
}
