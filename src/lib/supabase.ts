import { createClient } from '@supabase/supabase-js';

// Somente a chave publicável é enviada ao navegador. As tabelas aplicam RLS.
export const supabase = createClient('https://lvsocwetuhhqxlwyfdrw.supabase.co', 'sb_publishable_y89aua6amrI2EpAYBjy6rQ_W9apUzr6');
export async function invoke<T = Record<string, unknown>>(body: Record<string, unknown>): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Entre na sua conta para continuar.');
  const response = await fetch('https://lvsocwetuhhqxlwyfdrw.supabase.co/functions/v1/agent-orchestrator', {
    method: 'POST', headers: { 'Content-Type': 'application/json', apikey: 'sb_publishable_y89aua6amrI2EpAYBjy6rQ_W9apUzr6', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Não foi possível concluir a operação.');
  return result as T;
}
