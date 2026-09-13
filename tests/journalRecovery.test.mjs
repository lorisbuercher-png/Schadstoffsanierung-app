import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const exports={};
new Function('exports',ts.transpileModule(readFileSync(new URL('../app/lib/journalRecovery.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(exports);
const {entwurfLesen,entwurfSichern}=exports;
function storage(initial={}){const data=new Map(Object.entries(initial));return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};}
const draft={arbeit:'Neue Angaben',arbeitszeiten:[],anhaenge:[]};
test('Zwischenstand übersteht erneutes Öffnen, bestätigtes Journal bleibt erhalten',()=>{
 const s=storage({journal:'bestätigt'});
 entwurfSichern(s,'journal','bestätigt',draft);
 assert.equal(s.getItem('journal'),'bestätigt');
 assert.deepEqual(entwurfLesen(s,'journal'),draft);
});
test('Neuer Tag erhält eigene Wiederherstellung ohne Tagesabschluss',()=>{
 const s=storage();entwurfSichern(s,'journal-2026-09-13',null,draft);
 assert.deepEqual(entwurfLesen(s,'journal-2026-09-13'),draft);
 assert.equal(entwurfLesen(s,'journal-2026-09-14'),null);
 assert.equal(s.getItem('journal-2026-09-13'),null);
});
test('Veralteter Entwurf überschreibt kein neuer gespeichertes Journal',()=>{
 const s=storage({journal:'vorher'});entwurfSichern(s,'journal','vorher',draft);
 s.setItem('journal','neuer');
 assert.equal(entwurfLesen(s,'journal'),null);
});
test('Beschädigter Entwurf und Speicherfehler werden gemeldet',()=>{
 const s=storage({'entwurf-journal':'kaputt'});
 assert.throws(()=>entwurfLesen(s,'journal'));
 assert.throws(()=>entwurfSichern({...s,setItem:()=>{throw Error('voll')}},'journal',null,draft));
 s.setItem('entwurf-journal',JSON.stringify({basis:null,daten:{arbeitszeiten:'kaputt'}}));
 assert.throws(()=>entwurfLesen(s,'journal'));
});
