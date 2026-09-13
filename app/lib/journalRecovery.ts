type Speicher = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function entwurfSichern(speicher: Speicher, key: string, basis: string | null, daten: unknown) {
  // A separate draft never changes the signed-off journal or its document index.
  speicher.setItem(`entwurf-${key}`, JSON.stringify({ basis, daten }));
}

export function entwurfLesen(speicher: Pick<Storage, 'getItem'>, key: string) {
  const raw = speicher.getItem(`entwurf-${key}`);
  if (!raw) return null;
  const entwurf = JSON.parse(raw);
  // Do not restore an obsolete draft over a newer saved journal.
  if (entwurf.basis !== speicher.getItem(key)) return null;
  const daten = entwurf.daten;
  if (!daten || typeof daten !== 'object' || !Array.isArray(daten.arbeitszeiten) || !Array.isArray(daten.anhaenge)) {
    throw new Error('Ungültiger Journalentwurf');
  }
  return daten;
}
