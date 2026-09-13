import defaults from './registry.json' with {type:'json'};
export async function bootstrap(db:any,owner:string){
 const rows=[...defaults.map(a=>({kind:'agent',name:a.name,content:a.instructions,config:{role:a.role,version:'1.0',builtin_id:a.id}})),
 {kind:'skill',name:'Arquitetura modular',content:'Defina interfaces e responsabilidades. Reutilize módulos. Escreva comentários em pt-BR. Registre decisões e critérios de aceite.',config:{version:'1.0'}},
 {kind:'instruction',name:'Política do workspace',content:'Não inclua segredos em código ou logs. Diferencie proposta de execução real. Toda publicação precisa de aprovação humana.',config:{version:'1.0'}},
 {kind:'project',name:'portal-orchestrator-ai',content:'Portal pessoal de agentes e automações.',config:{repository:'RPA-Automatic/portal-orchestrator-ai',branch:'dev'}}];
 const {data:existing,error:readError}=await db.from('ao_resources').select('id').eq('owner_id',owner).limit(1);if(readError)throw readError;
 if(existing?.length)return;
 const {error}=await db.from('ao_resources').upsert(rows.map(r=>({...r,owner_id:owner})),{onConflict:'owner_id,kind,name',ignoreDuplicates:true});if(error)throw error;
}
export async function snapshot(db:any,owner:string,workflowId?:string){
 const {data:resources,error}=await db.from('ao_resources').select('*').eq('owner_id',owner).order('created_at').limit(100);if(error)throw error;
 let chosen=(resources||[]).filter((r:any)=>r.kind==='agent');
 if(workflowId){const workflow=resources.find((r:any)=>r.id===workflowId&&r.kind==='workflow');if(!workflow||!Array.isArray(workflow.config.agent_ids)||!workflow.config.agent_ids.length||workflow.config.agent_ids.length>4)throw new Error('INVALID_WORKFLOW');chosen=workflow.config.agent_ids.map((id:string)=>chosen.find((a:any)=>a.id===id));if(chosen.some((a:any)=>!a))throw new Error('INVALID_AGENT');}
 chosen=chosen.slice(0,4);
 return {agents:chosen.length?chosen.map((a:any)=>({id:a.id,name:a.name,instructions:a.content})):defaults,
 skills:(resources||[]).filter((r:any)=>['skill','instruction'].includes(r.kind)).slice(0,8).map((r:any)=>({name:r.name,content:r.content.slice(0,2000)}))};
}
