import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
const compiled = ts.transpileModule(readFileSync(new URL('../app/lib/journal.ts', import.meta.url), 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const exports = {};
new Function('exports', compiled)(exports);
const {zeitFehler, stundenBerechnen, journalAblegen} = exports;
const zeit = {name:'Loris', arbeitsbeginn:'07:00', arbeitsende:'17:00', pause:'60'};
test('Arbeitsstunden ziehen die Pause ab', () => {
  assert.equal(stundenBerechnen(zeit),9);
  assert.equal(zeitFehler(zeit),null);
});
test('Ungültige Zeiten und Pausen können nicht abgeschlossen werden', () => {
  for (const patch of [{arbeitsende:'06:00'},{arbeitsende:'07:00'},{arbeitsbeginn:'25:00'},{pause:'-1'},{pause:'600'},{pause:'abc'},{pause:''},{name:' '}]) {
    assert.ok(zeitFehler({...zeit,...patch}));
    assert.equal(stundenBerechnen({...zeit,...patch}),0);
  }
});
function speicher(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {getItem:k=>data.get(k)??null, setItem:(k,v)=>data.set(k,v), removeItem:k=>data.delete(k)};
}
test('Fehlende Kapazität in der Ablage erhält das bisherige Journal', () => {
  const s=speicher({journal:'vorher'});
  assert.throws(()=>journalAblegen(s,'journal',{abgeschlossen:true},()=>{throw Error('quota');}));
  assert.equal(s.getItem('journal'),'vorher');
});
test('Fehler beim ersten Ablegen hinterlässt kein abgeschlossenes Journal', () => {
  const s=speicher();
  assert.throws(()=>journalAblegen(s,'journal',{},()=>{throw Error('quota');}));
  assert.equal(s.getItem('journal'),null);
});
test('Fehler beim Schreiben des Journals verändert den Index nicht', () => {
  let updated=false;
  const s={...speicher(),setItem:()=>{throw Error('quota');}};
  assert.throws(()=>journalAblegen(s,'journal',{},()=>{updated=true;}));
  assert.equal(updated,false);
});
test('Erfolgreiche Ablage speichert Journal und aktualisiert Index', () => {
  const s=speicher();
  journalAblegen(s,'journal',{abgeschlossen:true},()=>s.setItem('index','aktuell'));
  assert.equal(JSON.parse(s.getItem('journal')).abgeschlossen,true);
  assert.equal(s.getItem('index'),'aktuell');
});
