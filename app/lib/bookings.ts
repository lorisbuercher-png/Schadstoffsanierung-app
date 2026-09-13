type Speicher = Pick<Storage, 'getItem' | 'setItem'>;
export function buchungenLesen<T>(speicher: Pick<Storage, 'getItem'>, key: string): T[] {
  const daten = JSON.parse(speicher.getItem(key) || '[]');
  if (!Array.isArray(daten) || daten.some(d => !d || typeof d !== 'object')) throw new Error('Buchungen konnten nicht gelesen werden.');
  return daten;
}

/** Read at the moment of writing so a stale screen cannot erase newer entries. */
export function buchungAblegen<T>(speicher: Speicher, key: string, eintrag: T, pruefen: (aktuell: T[]) => void = () => {}) {
  const aktuell = buchungenLesen<T>(speicher, key);
  pruefen(aktuell);
  const neu = [eintrag, ...aktuell];
  speicher.setItem(key, JSON.stringify(neu));
  return neu;
}
