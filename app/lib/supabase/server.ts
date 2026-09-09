import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseKonfiguration } from "./config";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = supabaseKonfiguration();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Components dürfen Cookies nicht selbst schreiben.
          // Die Session-Aktualisierung übernimmt proxy.ts.
        }
      },
    },
  });
}
