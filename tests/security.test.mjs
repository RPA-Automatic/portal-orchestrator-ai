import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePath} from '../supabase/functions/agent-orchestrator/github.ts';
import {encrypt,credential} from '../supabase/functions/agent-orchestrator/credentials.ts';

test('Code Assist recusa caminhos sensíveis e traversal',()=>{
 for(const path of ['../.env','.env.local','.git/config','src/credentials.json','keys/client.pem','/etc/passwd','a\\b'])assert.throws(()=>validatePath(path));
 for(const path of ['','README.md','src/App.tsx'])assert.equal(validatePath(path),path);
});
test('Credencial cifrada não pode ser movida entre usuários ou provedores',async()=>{
 globalThis.Deno={env:{get:()=> 'chave-exclusiva-de-teste-sem-acesso-a-servicos'}};
 const value=await encrypt('segredo-de-teste','user-a:github');
 assert.ok(!value.includes('segredo-de-teste'));
 const db={rpc:async()=>({data:value,error:null})};
 assert.equal(await credential(db,'user-a','github'),'segredo-de-teste');
 await assert.rejects(()=>credential(db,'user-b','github'));
 await assert.rejects(()=>credential(db,'user-a','openai'));
});
