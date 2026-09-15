export function sicheresWeiterleitungsziel(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\r\n]/.test(value)) return "/";
  return value;
}
export function zugelassenesProfil(profile: { aktiv?: boolean; rolle?: string } | null): boolean {
  return Boolean(profile?.aktiv && ["admin","vorarbeiter"].includes(profile.rolle || ""));
}
