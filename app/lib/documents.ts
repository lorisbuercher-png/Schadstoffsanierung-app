export type AblageDokument = {
  id: string; name: string; ordnerId: string; datum: string;
  groesse?: string; typ?: string; dataUrl?: string;
};

type Speicher = Pick<Storage, 'getItem'>;

export function gueltigesDatum(wert: string | null): wert is string {
  if (!wert || !/^\d{4}-\d{2}-\d{2}$/.test(wert)) return false;
  const date = new Date(`${wert}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === wert;
}

export function journalQuelle(id: string, dokumentId: string) {
  const prefix = `journal-${id}-`;
  if (!dokumentId.startsWith(prefix)) return null;
  const rest = dokumentId.slice(prefix.length);
  const datum = rest.slice(0, 10);
  if (!gueltigesDatum(datum) || (rest.length > 10 && rest[10] !== '-')) return null;
  return { datum, key: `${prefix}${datum}`, anhangId: rest.slice(11) };
}

export function dokumentZiel(id: string, dokument: AblageDokument): string | null {
  const quelle = journalQuelle(id, dokument.id);
  if (quelle) return `/baustellen/${encodeURIComponent(id)}/journal?datum=${quelle.datum}`;
  return null;
}

export function dateiInhalt(speicher: Speicher, id: string, dokument: AblageDokument): string | null {
  if (dokument.dataUrl?.startsWith('data:')) return dokument.dataUrl;
  try {
    const quelle = journalQuelle(id, dokument.id);
    if (quelle?.anhangId) {
      const journal = JSON.parse(speicher.getItem(quelle.key) || 'null');
      const datei = journal?.anhaenge?.find((a: {id: string}) => a.id === quelle.anhangId);
      return datei?.dataUrl?.startsWith('data:') ? datei.dataUrl : null;
    }
    if (dokument.ordnerId === 'zonenplan') {
      const plan = JSON.parse(speicher.getItem(`zonenplan-${id}`) || 'null');
      if (plan?.datei?.id === dokument.id && plan.datei.dataUrl?.startsWith('data:')) return plan.datei.dataUrl;
    }
  } catch { return null; }
  return null;
}

export function dateiLesen(datei: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Datei konnte nicht gelesen werden'));
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
    reader.onabort = () => reject(new Error('Lesen abgebrochen'));
    reader.readAsDataURL(datei);
  });
}
