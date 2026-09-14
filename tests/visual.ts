/** Fixture exclusiva do servidor Vite local. Não é uma entrada do build de produção.
 * APIs são simuladas em memória: não usa sessão real nem grava no Supabase.
 */
import { supabase } from '../src/lib/supabase';
const owner = '00000000-0000-4000-a000-000000000001';
const session = {access_token: 'visual-test-only', user: {id: owner, email: 'preview@example.test'}};
supabase.auth.getSession = async () => ({data: {session}, error: null}) as never;
supabase.auth.onAuthStateChange = () => ({data: {subscription: {unsubscribe() {}}}}) as never;
supabase.auth.signOut = async () => ({error: null});
const resources = ['Atlas', 'Nova', 'Sentinel', 'Nexus'].map((name, index) => ({id: `agent-${index}`, name, kind: 'agent', content: 'Instruções de exemplo para revisão visual do catálogo.', config: {role: ['Planejamento', 'Criação', 'Revisão', 'Contexto'][index]}, created_at: '2026-09-13T12:00:00Z'}));
const runs = ['completed', 'waiting_approval'].map((status,index) => ({id:`run-${index}-visual`, title:['Planejamento da automação de atendimento', 'Especificação técnica do portal'][index], prompt:'Objetivo fictício para revisão visual', workflow:'engineering',mode:'demo',status,steps:[],created_at:'2026-09-13T12:00:00Z',updated_at:'2026-09-13T12:00:00Z'}));
window.fetch = async (input, init) => {
  const url = new URL(String(input));
  if (url.hostname !== 'lvsocwetuhhqxlwyfdrw.supabase.co') throw new Error('Rede bloqueada na fixture visual');
  let data: unknown;
  if (url.pathname.endsWith('agent-orchestrator')) {
    const body = JSON.parse(String(init?.body || '{}'));
    if (!['bootstrap','health'].includes(body.action)) return Response.json({error:'Execução desativada na fixture visual'}, {status:400});
    data = {openai:false,github:false,agents:4};
  } else if (url.pathname.endsWith('ao_workspaces')) data = {id:owner};
  else if (url.pathname.endsWith('ao_resources')) {
    if (init?.method && init.method !== 'GET') return Response.json({message:'Gravação desativada na fixture visual'}, {status:400});
    data = resources;
  } else if (url.pathname.endsWith('ao_runs')) data = runs;
  else if (url.pathname.endsWith('ao_memory') || url.pathname.endsWith('ao_events')) data = [];
  else throw new Error('API não simulada na fixture visual');
  return Response.json(data);
};
await import('../src/main');
