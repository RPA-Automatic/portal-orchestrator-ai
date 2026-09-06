create table public.artifacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  run_id uuid not null references public.runs(id) on delete cascade,
  type text not null,
  name text not null,
  storage_path text not null,
  checksum text not null,
  status text not null default 'generated' check (status in ('generated', 'validated', 'accepted', 'superseded')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete set null,
  actor_type text not null check (actor_type in ('user', 'agent', 'worker', 'system')),
  action text not null,
  target_type text not null,
  target_id text not null,
  correlation_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index artifacts_run_idx on public.artifacts(run_id, created_at desc);
create index audit_workspace_idx on public.audit_events(workspace_id, created_at desc);

-- Rollback note: drop audit_events and artifacts.
