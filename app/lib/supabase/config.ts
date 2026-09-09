export function istSupabaseKonfiguriert() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  return Boolean(
    url &&
      key &&
      url.startsWith("https://") &&
      !url.includes("DEIN-PROJEKT") &&
      !key.includes("DEIN_KEY")
  );
}

export function supabaseKonfiguration() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!istSupabaseKonfiguriert() || !url || !key) {
    throw new Error("Supabase ist noch nicht konfiguriert.");
  }

  return { url, key };
}

export const erlaubteEmailDomain =
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || "bb-schadstoffsanierung.ch";
