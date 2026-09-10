"use client";

import Image from "next/image";
import { useState } from "react";
import { createClient } from "../lib/supabase/client";
import { erlaubteEmailDomain, istSupabaseKonfiguriert } from "../lib/supabase/config";

export default function LoginPage() {
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState("");
  const konfiguriert = istSupabaseKonfiguriert();

  async function mitMicrosoftAnmelden() {
    if (!konfiguriert) return;

    setLaedt(true);
    setFehler("");

    const nextParameter = new URLSearchParams(window.location.search).get("next");
    const next = nextParameter?.startsWith("/") ? nextParameter : "/";
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        scopes: "email",
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        queryParams: { prompt: "select_account" },
      },
    });

    if (error) {
      setFehler("Die Microsoft-Anmeldung konnte nicht gestartet werden.");
      setLaedt(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7f6] p-5">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-xl lg:grid-cols-[0.9fr_1.1fr]">
        <section className="bg-[#18212b] p-8 text-white sm:p-12">
          <Image src="/bb-logo.png" alt="B&B Schadstoffsanierung" width={220} height={121} priority className="h-auto w-44 brightness-0 invert" />
          <div className="mt-12 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--bb-accent-ink)]">Digitales Arbeitsportal</div>
          <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">Sicher arbeiten.<br />Einfach dokumentieren.</h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
            Baustellen, Tageschecks, Zonenzutritte und Dokumente zentral an einem Ort.
          </p>
          <div className="mt-10 space-y-3 text-sm text-slate-200">
            <div className="flex items-center gap-3"><span className="text-[var(--bb-accent-ink)]">✓</span> Sicherer Microsoft-365-Login</div>
            <div className="flex items-center gap-3"><span className="text-[var(--bb-accent-ink)]">✓</span> Zugriff nur für B&B-Mitarbeitende</div>
            <div className="flex items-center gap-3"><span className="text-[var(--bb-accent-ink)]">✓</span> Für iPad, Smartphone und Büro</div>
          </div>
        </section>

        <section className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--bb-accent-ink)]">Willkommen zurück</div>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">Beim Arbeitsportal anmelden</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Verwende dein geschäftliches Microsoft-365-Konto von B&B.
          </p>

          <button
            type="button"
            onClick={mitMicrosoftAnmelden}
            disabled={!konfiguriert || laedt}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-[var(--bb-accent)] px-5 py-4 font-semibold text-[var(--bb-on-accent)] transition hover:bg-[var(--bb-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MicrosoftIcon />
            {laedt ? "Microsoft wird geöffnet …" : "Mit Microsoft 365 anmelden"}
          </button>

          <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-center text-xs font-semibold text-slate-500">
            Zugelassen: @{erlaubteEmailDomain}
          </div>

          {!konfiguriert && (
            <div className="mt-5 rounded-2xl border border-[var(--bb-accent-border)] bg-[var(--bb-accent-soft)] p-4 text-sm font-semibold text-[var(--bb-accent-ink)]">
              Die Verbindung wird vorbereitet. Supabase-Projekt-URL und Publishable Key fehlen noch.
            </div>
          )}

          {fehler && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{fehler}</div>}

          <p className="mt-8 text-center text-xs leading-5 text-slate-400">
            Bei Problemen mit dem Zugriff bitte die Geschäftsleitung kontaktieren.
          </p>
        </section>
      </div>
    </main>
  );
}

function MicrosoftIcon() {
  return (
    <span className="grid h-5 w-5 grid-cols-2 gap-0.5" aria-hidden="true">
      <i className="bg-[#f25022]" /><i className="bg-[#7fba00]" />
      <i className="bg-[#00a4ef]" /><i className="bg-[#ffb900]" />
    </span>
  );
}
