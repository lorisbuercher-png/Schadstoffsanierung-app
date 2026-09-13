export type ZonenplanDatei = {
  id: string; name: string; type: 'image/png' | 'application/pdf';
  size: number; dataUrl: string; hochgeladenAm: string;
};
type Speicher = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type Dokument = {id: string; ordnerId: string; [key: string]: unknown};

/** Update only the active plan's index entry; preserve other files in the folder. */
export function zonenplanAblegen(speicher: Speicher, id: string, datei: ZonenplanDatei | null, erwartetePlanId: string | null) {
  const planKey = `zonenplan-${id}`;
  const dokumentKey = `dokumente-${id}`;
  const vorher = speicher.getItem(planKey);
  const alt = JSON.parse(vorher || 'null');
  if (alt !== null && (typeof alt !== 'object' || Array.isArray(alt))) throw new Error('Ungültiger Zonenplan');
  if ((alt?.datei?.id ?? null) !== erwartetePlanId) throw new Error('Der Zonenplan wurde inzwischen geändert. Bitte die Seite neu laden.');
  const dokumente = JSON.parse(speicher.getItem(dokumentKey) || '[]') as Dokument[];
  if (!Array.isArray(dokumente) || dokumente.some(d => !d || typeof d.id !== 'string' || typeof d.ordnerId !== 'string')) throw new Error('Dokumentablage konnte nicht gelesen werden.');
  const behalten = dokumente.filter(d => !(d.ordnerId === 'zonenplan' && (d.id === alt?.datei?.id || d.id === datei?.id)));
  const neu = datei ? [{
    id: datei.id, name: datei.name, ordnerId: 'zonenplan',
    datum: new Date(datei.hochgeladenAm).toLocaleDateString('de-CH'),
    groesse: `${(datei.size / 1024 / 1024).toFixed(1)} MB`, typ: datei.type,
  }, ...behalten] : behalten;
  // Read and validate both records before changing either one.
  if (datei) speicher.setItem(planKey, JSON.stringify({datei, aktualisiertAm: new Date().toISOString()}));
  else speicher.removeItem(planKey);
  try {
    speicher.setItem(dokumentKey, JSON.stringify(neu));
  } catch (fehler) {
    if (vorher === null) speicher.removeItem(planKey);
    else speicher.setItem(planKey, vorher);
    throw fehler;
  }
}
