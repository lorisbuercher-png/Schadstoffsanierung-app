import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { zugelassenesProfil } from "../auth-policy";
import { istSupabaseKonfiguriert, supabaseKonfiguration } from "./config";

const OEFFENTLICHE_PFADE = ["/login", "/auth/callback", "/auth/auth-code-error"];

export async function sessionAktualisieren(request: NextRequest) {
  if (!istSupabaseKonfiguriert()) {
    if (process.env.NODE_ENV !== "production" || process.env.BB_PREVIEW_MODE === "true" || OEFFENTLICHE_PFADE.includes(request.nextUrl.pathname)) return NextResponse.next();
    const login = request.nextUrl.clone(); login.pathname = "/login"; login.search = "";
    return NextResponse.redirect(login);
  }

  const { url, key } = supabaseKonfiguration();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  let angemeldet = false;
  let rolle = "";
  if (data?.claims?.sub) {
    const {data: profile} = await supabase.from("profile").select("aktiv,rolle").eq("id",data.claims.sub).single();
    angemeldet = zugelassenesProfil(profile);
    rolle = profile?.rolle || "";
  }
  const pfad = request.nextUrl.pathname;
  const oeffentlich = OEFFENTLICHE_PFADE.some(
    (eintrag) => pfad === eintrag || pfad.startsWith(`${eintrag}/`)
  );

  if (!angemeldet && !oeffentlich) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", `${pfad}${request.nextUrl.search}`);
    return antwortMitCookies(NextResponse.redirect(loginUrl), response);
  }

  if (angemeldet && rolle !== "admin" && pfad === "/baustellen/neu") {
    const ziel = request.nextUrl.clone(); ziel.pathname = "/baustellen"; ziel.search = "";
    return antwortMitCookies(NextResponse.redirect(ziel), response);
  }

  if (angemeldet && pfad === "/login") {
    const ziel = request.nextUrl.clone();
    ziel.pathname = "/";
    ziel.search = "";
    return antwortMitCookies(NextResponse.redirect(ziel), response);
  }

  return response;
}

function antwortMitCookies(ziel: NextResponse, quelle: NextResponse) {
  quelle.cookies.getAll().forEach((cookie) => ziel.cookies.set(cookie));
  return ziel;
}
