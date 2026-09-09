-- Agent OS: additive migration; no existing business tables are changed.
create table public.ao_workspaces (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null unique references auth.users(id) on delete restrict,
 name text not null check(length(name) between 2 and 100), created_at timestamptz not null default now(), unique(id,owner_id)
);
create table public.ao_runs (
 id uuid primary key, workspace_id uuid not null, owner_id uuid not null,
 title text not null, prompt text not null check(length(prompt) between 12 and 8000),
 workflow text not null check(workflow in ('engineering','rpa','agro')), mode text not null check(mode in ('demo','openai')),
 status text not null default 'queued' check(status in ('queued','running','waiting_approval','completed','rejected','failed','cancelled')),
 steps jsonb not null default '[]'::jsonb check(jsonb_typeof(steps)='array' and jsonb_array_length(steps)<=4),
 lease uuid, error text, decision text check(decision in ('approved','rejected')), decided_at timestamptz,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 foreign key(workspace_id,owner_id) references public.ao_workspaces(id,owner_id) on delete restrict
);
create index ao_runs_owner_created on public.ao_runs(owner_id,created_at desc);
create index ao_runs_workspace on public.ao_runs(workspace_id);
create table public.ao_events (
 id bigint generated always as identity primary key,run_id uuid not null references public.ao_runs(id) on delete restrict,
 owner_id uuid not null,action text not null, created_at timestamptz not null default now()
);
create index ao_events_owner on public.ao_events(owner_id,created_at desc);
create index ao_events_run on public.ao_events(run_id);
create table public.ao_memory (
 id uuid primary key default gen_random_uuid(),workspace_id uuid not null,owner_id uuid not null,
 title text not null check(length(title) between 2 and 120),content text not null check(length(content) between 1 and 12000),
 created_at timestamptz not null default now(),foreign key(workspace_id,owner_id) references public.ao_workspaces(id,owner_id) on delete restrict
);
create index ao_memory_owner on public.ao_memory(owner_id);
create index ao_memory_workspace on public.ao_memory(workspace_id);
alter table public.ao_workspaces enable row level security;
alter table public.ao_runs enable row level security;
alter table public.ao_events enable row level security;
alter table public.ao_memory enable row level security;
revoke all on public.ao_workspaces,public.ao_runs,public.ao_events,public.ao_memory from anon,authenticated;
grant select,insert on public.ao_workspaces to authenticated;
grant select on public.ao_runs,public.ao_events to authenticated;
grant select,insert,delete on public.ao_memory to authenticated;
grant all on public.ao_workspaces,public.ao_runs,public.ao_events,public.ao_memory to service_role;
grant usage,select on sequence public.ao_events_id_seq to service_role;
create policy ao_workspace_read on public.ao_workspaces for select to authenticated using(owner_id=(select auth.uid()));
create policy ao_workspace_create on public.ao_workspaces for insert to authenticated with check(owner_id=(select auth.uid()));
create policy ao_run_read on public.ao_runs for select to authenticated using(owner_id=(select auth.uid()));
create policy ao_event_read on public.ao_events for select to authenticated using(owner_id=(select auth.uid()));
create policy ao_memory_read on public.ao_memory for select to authenticated using(owner_id=(select auth.uid()));
create policy ao_memory_create on public.ao_memory for insert to authenticated with check(owner_id=(select auth.uid()));
create policy ao_memory_delete on public.ao_memory for delete to authenticated using(owner_id=(select auth.uid()));
create function public.ao_run_audit() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if TG_OP='UPDATE' then new.updated_at=now(); end if;
 if TG_OP='INSERT' or new.status is distinct from old.status then
  insert into public.ao_events(run_id,owner_id,action) values(new.id,new.owner_id,new.status);
 end if;
 return new;
end $$;
-- AFTER trigger for FK-safe audit; separate timestamp trigger.
create function public.ao_touch_run() returns trigger language plpgsql security invoker set search_path='' as $$ begin new.updated_at=now();return new;end $$;
create trigger ao_touch before update on public.ao_runs for each row execute function public.ao_touch_run();
create trigger ao_audit after insert or update on public.ao_runs for each row execute function public.ao_run_audit();
create function public.ao_create_run(p_id uuid,p_workspace uuid,p_owner uuid,p_prompt text,p_workflow text,p_mode text)
returns public.ao_runs language plpgsql security invoker set search_path='' as $$
declare result public.ao_runs;
begin
 -- Serialize per owner so concurrent requests cannot bypass quotas.
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text,0));
 select * into result from public.ao_runs where id=p_id and owner_id=p_owner;
 if found then return result;end if;
 if (select count(*) from public.ao_runs where owner_id=p_owner and created_at>now()-interval '1 day')>=30 then raise exception 'daily_limit';end if;
 if exists(select 1 from public.ao_runs where owner_id=p_owner and status in ('queued','running')) then raise exception 'active_run';end if;
 insert into public.ao_runs(id,workspace_id,owner_id,title,prompt,workflow,mode)
 values(p_id,p_workspace,p_owner,left(p_prompt,100),p_prompt,p_workflow,p_mode) returning * into result;
 return result;
end $$;
revoke all on function public.ao_create_run(uuid,uuid,uuid,text,text,text),public.ao_run_audit(),public.ao_touch_run() from public,anon,authenticated;
grant execute on function public.ao_create_run(uuid,uuid,uuid,text,text,text),public.ao_run_audit(),public.ao_touch_run() to service_role;
-- Rollback: export ao_* rows first, then remove only these new objects in dependency order.

