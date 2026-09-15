import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
function store({rpc,rows=[]}={}) {
  const exports={};
  const client={
    auth:{getUser:async()=>({data:{user:{id:'u'}}})},
    from:(table)=> table==='profile' ? {select(){return this},eq(){return this},single:async()=>({data:{id:'u',rolle:'admin',organisation_id:'o'}})} : {select(){return this},order(){return this},range:async()=>({data:rows})},
    rpc:rpc || (async(_,args)=>({data:args.p_changes.map(r=>({...r,version:r.version+1}))})),
  };
  const js=ts.transpileModule(readFileSync(new URL('../app/lib/cloud-store.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  new Function('exports','require',js)(exports,(name)=>name.endsWith('/client')?{createClient:()=>client}:{istSupabaseKonfiguriert:()=>true});
  return exports;
}
test('One action stores journal and index as one versioned batch',async()=>{
 const calls=[];
 const s=store({rpc:async(_,args)=>{calls.push(args);return {data:args.p_changes.map(r=>({...r,version:r.version+1}))}}});
 await s.loadCloud();
 s.appStorage.setItem('journal-b-2026-09-15','{}'); s.appStorage.setItem('dokumente-b','[]');
 await s.flushCloud();
 assert.equal(calls.length,1); assert.equal(calls[0].p_changes.length,2); assert.equal(s.cloudState().status,'ready');
});
test('Deletion is visible before acknowledgement and version is preserved',async()=>{
 const s=store({rows:[{key:'a',value:'old',version:4}]}); await s.loadCloud();
 s.appStorage.removeItem('a'); assert.equal(s.appStorage.getItem('a'),null);
 await s.flushCloud(); assert.equal(s.appStorage.getItem('a'),null);
});
test('Conflict preserves changes and retries use same request ID',async()=>{
 const ids=[];const s=store({rpc:async(_,args)=>{ids.push(args.p_request);return {error:{message:'CONFLICT'}}}});
 await s.loadCloud();s.appStorage.setItem('journal-b','new');await s.flushCloud();
 assert.equal(s.cloudState().status,'error'); assert.equal(s.hasPendingChanges(),true);assert.equal(s.appStorage.getItem('journal-b'),'new');
 assert.throws(()=>s.appStorage.setItem('journal-b','lost'));
 await s.flushCloud();assert.equal(ids[0],ids[1]);assert.equal(await s.speichernBestaetigt(),false);
});
