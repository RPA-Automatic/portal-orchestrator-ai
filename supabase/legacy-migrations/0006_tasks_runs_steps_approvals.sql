create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  prompt text not null check (char_length(prompt) between 12 and 12000),
  status public.task_status not null default 'draft',
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  workflow_id uuid not null references public.workflows(id) on delete restrict,
  workflow_version integer not null,
  status public.run_status not null default 'queued',
  max_cost_usd numeric(10, 4) not null default 1.00,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.run_steps (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  run_id uuid not null references public.runs(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  position integer not null,
  status public.step_status not null default 'pending',
  risk public.risk_level not null default 'R0',
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  retries integer not null default 0,
  started_at timestamptz,
  finished_at timestamptz,
  unique (run_id, position)
);

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  run_id uuid not null references public.runs(id) on delete cascade,
  run_step_id uuid not null references public.run_steps(id) on delete cascade,
  action text not null,
  target text not null,
  payload_summary jsonb not null default '{}'::jsonb,
  risk public.risk_level not null,
  status public.approval_status not null default 'pending',
  decided_by uuid references auth.users(id) on delete set null,
  decision_reason text,
  decided_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index tasks_project_idx on public.tasks(project_id, created_at desc);
create index runs_task_idx on public.runs(task_id, created_at desc);
create index run_steps_run_idx on public.run_steps(run_id, position);
create index approvals_pending_idx on public.approvals(workspace_id, status) where status = 'pending';

-- Rollback note: drop approvals, run_steps, runs and tasks.
