import { createBrowserClient } from "@supabase/ssr";
import { supabaseKonfiguration } from "./config";

export function createClient() {
  const { url, key } = supabaseKonfiguration();
  return createBrowserClient(url, key);
}
