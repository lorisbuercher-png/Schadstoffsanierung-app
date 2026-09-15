import { sicheresWeiterleitungsziel, zugelassenesProfil } from "../../lib/auth-policy";
import { NextResponse } from "next/server";
import { erlaubteEmailDomain } from "../../lib/supabase/config";
import { createClient } from "../../lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParameter = searchParams.get("next");
  const next = sicheresWeiterleitungsziel(nextParameter);

  if (!code) return NextResponse.redirect(`${origin}/auth/auth-code-error`);

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) return NextResponse.redirect(`${origin}/auth/auth-code-error`);

  const { data } = await supabase.auth.getUser();
  const email = data.user?.email?.toLowerCase() || "";

  if (!email.endsWith(`@${erlaubteEmailDomain.toLowerCase()}`)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  const {data: profile} = await supabase.from("profile").select("aktiv,rolle").eq("id",data.user!.id).single();
  if (!zugelassenesProfil(profile)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }
  return NextResponse.redirect(new URL(next, origin));
}
