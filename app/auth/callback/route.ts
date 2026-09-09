import { NextResponse } from "next/server";
import { erlaubteEmailDomain } from "../../lib/supabase/config";
import { createClient } from "../../lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParameter = searchParams.get("next");
  const next = nextParameter?.startsWith("/") ? nextParameter : "/";

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

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const basis = process.env.NODE_ENV === "development" || !forwardedHost
    ? origin
    : `${forwardedProto}://${forwardedHost}`;

  return NextResponse.redirect(`${basis}${next}`);
}
