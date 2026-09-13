export type TeamPerson = { id: string; name: string; nurAustritt?: boolean };
export function baustellenTeam(speicher: Pick<Storage, 'getItem'>, id: string): TeamPerson[] {
  const mitarbeiter = JSON.parse(speicher.getItem('mitarbeiter') || '[]');
  const zugeteilt = JSON.parse(speicher.getItem(`baustellen-mitarbeiter-${id}`) || '[]');
  if (!Array.isArray(mitarbeiter) || !Array.isArray(zugeteilt)) throw new Error('Baustellenteam konnte nicht gelesen werden.');
  const ids = new Set(zugeteilt.map(String));
  const team = new Map<string, TeamPerson>();
  for (const person of mitarbeiter) {
    if (!person || person.id == null || person.aktiv === false || !ids.has(String(person.id))) continue;
    const name = typeof person.name === 'string' && person.name.trim() ? person.name.trim() : [person.vorname, person.nachname].filter(v => typeof v === 'string').join(' ').trim();
    if (name) team.set(String(person.id), {id: String(person.id), name});
  }
  return [...team.values()];
}

/** Keep present people selectable even after their employee record or assignment is removed. */
export function zonenPersonen(team: TeamPerson[], anwesend: string[], buchungen: {mitarbeiterId: string; name: string}[]): TeamPerson[] {
  const auswahl = new Map(team.map(person => [person.id, person]));
  for (const id of anwesend) {
    if (!auswahl.has(id)) auswahl.set(id, {id, name: buchungen.find(b => b.mitarbeiterId === id)?.name || 'Unbekannte Person', nurAustritt: true});
  }
  return [...auswahl.values()];
}
