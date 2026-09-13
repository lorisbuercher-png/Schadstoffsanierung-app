import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
const compiled=ts.transpileModule(readFileSync(new URL('../app/lib/documents.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const exports={};
new Function('exports',compiled)(exports);
const {gueltigesDatum,journalQuelle,dokumentZiel,dateiInhalt,dateiLesen}=exports;
const id='baustelle-mit-bindestrich';
const key=`journal-${id}-2026-09-13`;
const dokument={id:key,name:'Journal',ordnerId:'journal',datum:'13.09.2026'};
const speicher=(data)=>({getItem:k=>JSON.stringify(data[k]??null)});
const pdf='data:application/pdf;base64,JVBERi0=';
test('Journal öffnet das eigene Datum auch bei IDs mit Bindestrichen',()=>{
 assert.equal(dokumentZiel(id,dokument),`/baustellen/${id}/journal?datum=2026-09-13`);
 assert.equal(journalQuelle(id,`${key}-anhang-mit-bindestrich`).anhangId,'anhang-mit-bindestrich');
 assert.equal(journalQuelle('andere-baustelle',key),null);
});
test('Ungültige Kalenderdaten werden nicht als Journalziel verwendet',()=>{
 for(const datum of ['2026-02-30','2026-13-01','kein-datum',null])assert.equal(gueltigesDatum(datum),false);
 assert.equal(gueltigesDatum('2028-02-29'),true);
 assert.equal(journalQuelle(id,`journal-${id}-2026-02-30`),null);
});
test('Journalanhang wird aus dem passenden Tag gelesen ohne zweite Dateikopie',()=>{
 const s=speicher({[key]:{anhaenge:[{id:'datei-1',dataUrl:pdf}]}});
 assert.equal(dateiInhalt(s,id,{...dokument,id:`${key}-datei-1`}),pdf);
 assert.equal(dateiInhalt(s,id,{...dokument,id:`${key}-datei-2`}),null);
 assert.equal(dateiInhalt(s,id,{...dokument,id:`journal-${id}-2026-09-12-datei-1`}),null);
});
test('Direkte Uploads und passende Zonenplandatei sind verfügbar',()=>{
 assert.equal(dateiInhalt(speicher({}),id,{...dokument,dataUrl:pdf}),pdf);
 const s=speicher({[`zonenplan-${id}`]:{datei:{id:'plan-1',dataUrl:pdf}}});
 assert.equal(dateiInhalt(s,id,{...dokument,id:'plan-1',ordnerId:'zonenplan'}),pdf);
 assert.equal(dateiInhalt(s,id,{...dokument,id:'plan-alt',ordnerId:'zonenplan'}),null);
});
test('Alte Metadaten und beschädigte Quelldaten erzeugen keinen falschen Download',()=>{
 assert.equal(dateiInhalt(speicher({}),id,dokument),null);
 assert.equal(dateiInhalt({getItem:()=>'{kaputt'},id,{...dokument,id:`${key}-datei-1`}),null);
 assert.equal(dateiInhalt(speicher({}),id,{...dokument,dataUrl:'https://example.com'}),null);
});
test('Dateileser übernimmt PDF-Inhalt und meldet Fehler sowie Abbruch',async()=>{
 const original=globalThis.FileReader;
 try {
  for(const mode of ['load','error','abort']){
   globalThis.FileReader=class{readAsDataURL(){this.result=pdf;this[`on${mode}`]();}};
   if(mode==='load')assert.equal(await dateiLesen({}),pdf);
   else await assert.rejects(dateiLesen({}));
  }
 }finally{globalThis.FileReader=original;}
});
