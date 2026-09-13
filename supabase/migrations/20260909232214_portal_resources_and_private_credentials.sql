create table public.ao_resources (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('agent','skill','instruction','project','workflow','mcp')),
 name text not null check(length(name) between 2 and 120), content text not null default '' check(length(content)<=12000),
 config jsonb not null default '{}' check(jsonb_typeof(config)='object'), created_at timestamptz not null default now(),
 unique(owner_id,kind,name));
alter table public.ao_resources enable row level security;
grant select,insert,update,delete on public.ao_resources to authenticated;
create policy ao_resource_owner on public.ao_resources for all to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create schema if not exists orchestrator_private;
revoke all on schema orchestrator_private from public, anon, authenticated;
create table orchestrator_private.credentials (
 owner_id uuid not null references auth.users(id) on delete cascade, provider text not null check(provider in ('openai','github')),
 encrypted_value text not null, updated_at timestamptz not null default now(),primary key(owner_id,provider));
alter table orchestrator_private.credentials enable row level security;
grant usage on schema orchestrator_private to service_role;
grant all on orchestrator_private.credentials to service_role;
create function public.ao_secret_get(p_owner uuid,p_provider text) returns text language sql set search_path='' as $$
 select encrypted_value from orchestrator_private.credentials where owner_id=p_owner and provider=p_provider
$$;
create function public.ao_secret_set(p_owner uuid,p_provider text,p_value text) returns void language sql set search_path='' as $$
 insert into orchestrator_private.credentials(owner_id,provider,encrypted_value) values(p_owner,p_provider,p_value)
 on conflict(owner_id,provider) do update set encrypted_value=excluded.encrypted_value,updated_at=now()
$$;
revoke all on function public.ao_secret_get(uuid,text),public.ao_secret_set(uuid,text,text) from public,anon,authenticated;
grant execute on function public.ao_secret_get(uuid,text),public.ao_secret_set(uuid,text,text) to service_role;
alter table public.ao_runs add column if not exists context_snapshot jsonb not null default '{}';
create index ao_resources_owner_kind on public.ao_resources(owner_id,kind);

