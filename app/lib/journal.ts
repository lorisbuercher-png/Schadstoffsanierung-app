export type ZeitEintrag = { name: string; arbeitsbeginn: string; arbeitsende: string; pause: string };

function minuten(wert: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(wert)) return NaN;
  const [h, m] = wert.split(':').map(Number);
  return h * 60 + m;
}

export function zeitFehler(eintrag: ZeitEintrag): string | null {
  if (!eintrag.name.trim()) return 'Bitte den Mitarbeiter angeben.';
  const start = minuten(eintrag.arbeitsbeginn);
  const ende = minuten(eintrag.arbeitsende);
  const pause = Number(eintrag.pause);
  if (!Number.isFinite(start) || !Number.isFinite(ende)) return 'Bitte Beginn und Ende vollständig erfassen.';
  if (ende <= start) return 'Bitte das Ende nach dem Beginn erfassen. Nachtschichten auf zwei Tage aufteilen.';
  if (!eintrag.pause.trim() || !Number.isInteger(pause) || pause < 0 || pause >= ende - start) return 'Bitte eine gültige Pause in Minuten erfassen, kürzer als die Arbeitszeit.';
  return null;
}

export function stundenBerechnen(eintrag: ZeitEintrag) {
  if (zeitFehler(eintrag)) return 0;
  return (minuten(eintrag.arbeitsende) - minuten(eintrag.arbeitsbeginn) - Number(eintrag.pause)) / 60;
}

/** Keep the previous journal if updating its document index fails. */
export function journalAblegen(speicher: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>, key: string, daten: unknown, indexAktualisieren: () => void) {
  const vorher = speicher.getItem(key);
  speicher.setItem(key, JSON.stringify(daten));
  try {
    indexAktualisieren();
  } catch (fehler) {
    if (vorher === null) speicher.removeItem(key);
    else speicher.setItem(key, vorher);
    throw fehler;
  }
}
