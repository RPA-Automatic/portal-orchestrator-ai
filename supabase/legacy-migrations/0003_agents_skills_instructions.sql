create table public.skills (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  slug text not null,
  version text not null,
  body text not null,
  dependencies jsonb not null default '[]'::jsonb,
  allowed_tools jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (workspace_id, slug, version)
);

create table public.instruction_sets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  scope text not null check (scope in ('workspace', 'project', 'workflow', 'agent')),
  name text not null,
  content text not null,
  priority integer not null default 100,
  created_at timestamptz not null default now()
);

create table public.agents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  slug text not null,
  name text not null,
  purpose text not null,
  instructions text not null,
  model_profile jsonb not null default '{}'::jsonb,
  allowed_tools jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (workspace_id, project_id, slug)
);

create table public.workflows (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  version integer not null default 1,
  definition_json jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (project_id, name, version)
);

-- Rollback note: drop workflows, agents, instruction_sets and skills.
