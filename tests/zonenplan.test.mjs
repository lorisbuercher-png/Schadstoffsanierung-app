import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const exports={};new Function('exports',ts.transpileModule(readFileSync(new URL('../app/lib/zonenplan.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(exports);
const {zonenplanAblegen}=exports;
const alt={id:'alt',name:'Alt.pdf',type:'application/pdf',size:100,dataUrl:'data:application/pdf;base64,AA==',hochgeladenAm:'2026-09-13T12:00:00Z'};
const neu={...alt,id:'neu',name:'Neu.pdf'};
const docs=[{id:'alt',ordnerId:'zonenplan'},{id:'zusatz',ordnerId:'zonenplan',dataUrl:'behalten'},{id:'journal',ordnerId:'journal'}];
function setup(){const data=new Map([['zonenplan-b',JSON.stringify({datei:alt})],['dokumente-b',JSON.stringify(docs)]]);return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};}
test('Ersetzen erhält zusätzliche Dateien im selben Ordner',()=>{
 const s=setup();zonenplanAblegen(s,'b',neu,'alt');
 assert.equal(JSON.parse(s.getItem('zonenplan-b')).datei.id,'neu');
 assert.deepEqual(JSON.parse(s.getItem('dokumente-b')).map(d=>d.id),['neu','zusatz','journal']);
});
test('Entfernen betrifft nur den aktiven Plan',()=>{
 const s=setup();zonenplanAblegen(s,'b',null,'alt');
 assert.equal(s.getItem('zonenplan-b'),null);
 assert.deepEqual(JSON.parse(s.getItem('dokumente-b')).map(d=>d.id),['zusatz','journal']);
});
test('Indexfehler stellt den alten Plan beim Ersetzen und Entfernen wieder her',()=>{
 for(const plan of [neu,null]){
  const s=setup(),raw=s.getItem('zonenplan-b');const original=s.setItem;
  s.setItem=(k,v)=>{if(k==='dokumente-b')throw Error('voll');original(k,v)};
  assert.throws(()=>zonenplanAblegen(s,'b',plan,'alt'));
  assert.equal(s.getItem('zonenplan-b'),raw);
  assert.deepEqual(JSON.parse(s.getItem('dokumente-b')),docs);
 }
});
test('Beschädigter Index und veraltete Ansicht verändern keinen Plan',()=>{
 const s=setup(),raw=s.getItem('zonenplan-b');
 assert.throws(()=>zonenplanAblegen(s,'b',neu,'anderer-plan'));
 s.setItem('dokumente-b','kaputt');
 assert.throws(()=>zonenplanAblegen(s,'b',neu,'alt'));
 assert.equal(s.getItem('zonenplan-b'),raw);
});
test('Erster Upload mit Indexfehler hinterlässt keine scheinbare Freigabe',()=>{
 const s=setup();s.removeItem('zonenplan-b');const original=s.setItem;
 s.setItem=(k,v)=>{if(k==='dokumente-b')throw Error('voll');original(k,v)};
 assert.throws(()=>zonenplanAblegen(s,'b',neu,null));
 assert.equal(s.getItem('zonenplan-b'),null);
});
