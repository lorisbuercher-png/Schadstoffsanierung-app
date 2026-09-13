import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const exports={};new Function('exports',ts.transpileModule(readFileSync(new URL('../app/lib/siteTeam.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(exports);
const {baustellenTeam,zonenPersonen}=exports;
const storage=data=>({getItem:key=>key in data ? JSON.stringify(data[key]) : null});
test('Nur zugeteilte aktive Personen erscheinen, IDs werden einheitlich gelesen',()=>{
 const s=storage({mitarbeiter:[{id:1,vorname:'Rolf',nachname:'Bächler',aktiv:true},{id:2,name:'Inaktiv',aktiv:false},{id:3,name:'Andere Baustelle',aktiv:true}], 'baustellen-mitarbeiter-b':['1','2']});
 assert.deepEqual(baustellenTeam(s,'b'),[{id:'1',name:'Rolf Bächler'}]);
 assert.deepEqual(baustellenTeam(s,'andere'),[]);
});
test('Leere Daten erzeugen keine Demo-Mitarbeitenden',()=>{
 assert.deepEqual(baustellenTeam({getItem:()=>null},'b'),[]);
});
test('Entfernte und gelöschte Personen bleiben auscheckbar',()=>{
 const personen=zonenPersonen([],['alt'],[{mitarbeiterId:'alt',name:'Früheres Teammitglied'}]);
 assert.deepEqual(personen,[{id:'alt',name:'Früheres Teammitglied',nurAustritt:true}]);
 assert.deepEqual(zonenPersonen([],[],[{mitarbeiterId:'alt',name:'Früheres Teammitglied'}]),[]);
});
test('Anwesende Teammitglieder werden nicht doppelt angezeigt',()=>{
 assert.deepEqual(zonenPersonen([{id:'1',name:'Rolf'}],['1'],[{mitarbeiterId:'1',name:'Rolf'}]),[{id:'1',name:'Rolf'}]);
});
test('Fehlerhafte Teamdaten werden gemeldet statt andere Personen freizugeben',()=>{
 assert.throws(()=>baustellenTeam({getItem:()=>'{kaputt'},'b'));
 assert.throws(()=>baustellenTeam(storage({mitarbeiter:{}}),'b'));
});
