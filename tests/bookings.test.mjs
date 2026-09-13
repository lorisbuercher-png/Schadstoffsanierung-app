import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const exports={};new Function('exports',ts.transpileModule(readFileSync(new URL('../app/lib/bookings.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(exports);
const {buchungAblegen,buchungenLesen}=exports;
function storage(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};}
test('Neue Buchung erhält alle inzwischen gespeicherten Einträge',()=>{
 const s=storage();s.setItem('tag',JSON.stringify([{id:'neuere-buchung'},{id:'alt'}]));
 assert.deepEqual(buchungAblegen(s,'tag',{id:'jetzt'}).map(x=>x.id),['jetzt','neuere-buchung','alt']);
});
test('Anwesenheitsprüfung erhält den aktuellen Speicherstand',()=>{
 const s=storage();s.setItem('tag',JSON.stringify([{id:'1',typ:'eintritt'}]));
 assert.throws(()=>buchungAblegen(s,'tag',{id:'2'},aktuell=>{assert.equal(aktuell[0].typ,'eintritt');throw Error('bereits drin');}));
 assert.equal(buchungenLesen(s,'tag').length,1);
});
test('Speicherfehler liefern keine erfolgreiche Buchung zurück',()=>{
 const s=storage();s.setItem('tag','[{"id":"alt"}]');
 assert.throws(()=>buchungAblegen({...s,setItem:()=>{throw Error('voll');}},'tag',{id:'neu'}));
 assert.equal(s.getItem('tag'),'[{"id":"alt"}]');
});
test('Beschädigte Buchungen werden nicht überschrieben',()=>{
 for(const raw of ['kaputt','{}','[null]']){
  const s=storage();s.setItem('tag',raw);
  assert.throws(()=>buchungAblegen(s,'tag',{id:'neu'}));
  assert.equal(s.getItem('tag'),raw);
 }
});
test('Ein neuer Tag beginnt mit leerer Liste',()=>{
 const s=storage();assert.deepEqual(buchungenLesen(s,'tag'),[]);
 assert.deepEqual(buchungAblegen(s,'tag',{id:'erste'}),[{id:'erste'}]);
});
