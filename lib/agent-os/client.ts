import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(
  "https://lvsocwetuhhqxlwyfdrw.supabase.co",
  "sb_publishable_y89aua6amrI2EpAYBjy6rQ_W9apUzr6",
);
export type Run = {
  id: string;
  title: string;
  prompt: string;
  workflow: string;
  mode: string;
  status: string;
  steps: Step[];
  created_at: string;
  updated_at: string;
  error: string | null;
  decision: string | null;
};
export type Step = {
  agent: string;
  name: string;
  content: string;
  tokens: number;
  completed_at: string;
};
export async function invoke(
  action: string,
  payload: Record<string, unknown> = {},
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Entre na sua conta para continuar.");
  const { data, error } = await supabase.functions.invoke(
    "agent-orchestrator",
    { body: { action, ...payload } },
  );
  if (error) {
    let message = "Não foi possível concluir a operação. Tente novamente.";
    try {
      const body = await error.context.json();
      message = body.error || message;
    } catch {}
    throw new Error(message);
  }
  if (data.error) throw new Error(data.error);
  return data;
}
