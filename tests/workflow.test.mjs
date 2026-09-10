import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import ts from 'typescript';

const source = readFileSync(new URL('../app/lib/workflow.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const exports = {};
new Function('exports', 'require', compiled)(exports, createRequire(import.meta.url));
const { personenInZone, hatZonenplan, freigabePruefen, gespeicherteFreigabe } = exports;
const ready = { tagescheckStatus: 'arbeitsbereit', zonenplanVorhanden: true, suvaOffen: 0, suvaKritisch: 0, maengelKritisch: 0, geraeteOffen: 0 };

test('Auschecken entfernt eine Person auch bei neuester Buchung zuerst', () => {
  assert.deepEqual(personenInZone([
    { mitarbeiterId: '1', typ: 'austritt', timestamp: '2026-09-10T08:00:00Z' },
    { mitarbeiterId: '1', typ: 'eintritt', timestamp: '2026-09-10T07:00:00Z' },
  ]), []);
});
test('Ein nachgetragener früherer Eintritt setzt einen späteren Austritt nicht zurück', () => {
  assert.deepEqual(personenInZone([
    { mitarbeiterId: '1', typ: 'eintritt', timestamp: '2026-09-10T06:00:00Z' },
    { mitarbeiterId: '1', typ: 'austritt', timestamp: '2026-09-10T08:00:00Z' },
    { mitarbeiterId: '2', typ: 'eintritt', timestamp: '2026-09-10T07:00:00Z' },
  ]), ['2']);
});
test('Neuer Upload und alter Grundriss zählen, Dateiname allein nicht', () => {
  assert.equal(hatZonenplan({ datei: { dataUrl: 'data:application/pdf;base64,AA==' } }), true);
  assert.equal(hatZonenplan({ grundriss: 'data:image/png;base64,AA==' }), true);
  assert.equal(hatZonenplan({ datei: { name: 'Plan.pdf' } }), false);
});
test('Ein erledigter Tagescheck allein erteilt keine Gesamtfreigabe', () => {
  assert.equal(freigabePruefen(ready).bereit, true);
  for (const luecke of [{zonenplanVorhanden:false}, {suvaOffen:1}, {maengelKritisch:1}, {geraeteOffen:1}]) {
    assert.equal(freigabePruefen({...ready, ...luecke}).bereit, false);
  }
});
test('Gespeicherte Nachweise ergeben Freigabe nur für den kontrollierten Tag', () => {
  const data = {
    'tagescheck-b-2026-09-10': {status:'arbeitsbereit'},
    'zonenplan-b': {datei:{dataUrl:'data:application/pdf;base64,AA=='}},
    'suva-audit-b': Object.fromEntries([6,10,12,13,19,20,23,26,29,31,33,38,42,44].map(n=>[n,{status:'erfuellt'}])),
  };
  const storage = {getItem:key=>JSON.stringify(data[key] ?? null)};
  assert.equal(gespeicherteFreigabe(storage,'b','2026-09-10').bereit,true);
  assert.equal(gespeicherteFreigabe(storage,'b','2026-09-11').bereit,false);
});
