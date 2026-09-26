export type ResourceKind =
  | "agent"
  | "skill"
  | "instruction"
  | "project"
  | "workflow"
  | "mcp";
export type Resource = {
  id: string;
  kind: ResourceKind;
  name: string;
  content: string;
  config: Record<string, unknown>;
  created_at: string;
};
export type Memory = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};
export type Step = {
  agent: string;
  name: string;
  content: string;
  tokens: number;
  completed_at: string;
};
export type Run = {
  id: string;
  title: string;
  prompt: string;
  workflow: string;
  mode: "demo" | "openai" | "builtin";
  status: string;
  steps: Step[];
  error?: string;
  created_at: string;
  updated_at: string;
  template_id?: string;
  context_snapshot?: { agents?: { id: string; name: string }[] };
  started_at?: string;
  finished_at?: string;
};
export type Event = {
  id: number;
  run_id: string;
  action: string;
  created_at: string;
};
export type Health = {
  openai: boolean;
  github: boolean;
  model: string;
  agents: number;
  runtime?: string;
  version?: string;
};
export type Schedule = {
  id: string;
  name: string;
  prompt: string;
  mode: string;
  enabled: boolean;
  interval_minutes: number;
  next_run_at: string;
  last_run_at?: string;
  last_run_id?: string;
  last_error?: string;
  template_id?: string;
};
export const statusLabels: Record<string, string> = {
  queued: "Na fila",
  running: "Executando",
  waiting_approval: "Em revisão",
  completed: "Concluída",
  failed: "Falhou",
  cancelled: "Cancelada",
  rejected: "Rejeitada",
};
export const sections = [
  "Visão geral",
  "Tarefas",
  "Agentes",
  "Fluxos",
  "Skills",
  "Instruções",
  "Memória",
  "Code Assist",
  "Integrações",
  "Auditoria",
  "Configurações",
  "Biblioteca",
  "Agendamentos",
  "Monitoramento",
  "Aprovações",
] as const;
export type Section = (typeof sections)[number];
