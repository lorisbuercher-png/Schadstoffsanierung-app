import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
const exports={};new Function('exports',ts.transpileModule(readFileSync(new URL('../app/lib/auth-policy.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(exports);
test('Login redirects stay inside the app',()=>{
 for(const path of [null,'https://evil.test','//evil.test','/\\evil.test','/\r\nevil']) assert.equal(exports.sicheresWeiterleitungsziel(path),'/');
 assert.equal(exports.sicheresWeiterleitungsziel('/baustellen/b?datum=2026-09-15'),'/baustellen/b?datum=2026-09-15');
});
test('Only active admin and foreman profiles can open the workspace',()=>{
 for(const profile of [null,{rolle:'admin',aktiv:false},{rolle:'mitarbeiter',aktiv:true}])assert.equal(exports.zugelassenesProfil(profile),false);
 assert.equal(exports.zugelassenesProfil({rolle:'admin',aktiv:true}),true);
 assert.equal(exports.zugelassenesProfil({rolle:'vorarbeiter',aktiv:true}),true);
});
