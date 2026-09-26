-- Fila durável e agendas do Orchestrator. Nenhuma entidade de faturamento é alterada.
alter table public.ao_runs drop constraint ao_runs_mode_check;
alter table public.ao_runs add constraint ao_runs_mode_check check(mode in ('demo','openai','builtin'));
alter table public.ao_runs add column template_id text;
alter table public.ao_runs add column started_at timestamptz;
alter table public.ao_runs add column finished_at timestamptz;
create index ao_runs_pending on public.ao_runs(created_at) where status='queued';

create table public.ao_schedules (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null,
 workspace_id uuid not null, name text not null check(length(name) between 2 and 120),
 prompt text not null check(length(prompt) between 12 and 8000),
 template_id text, workflow text not null default 'engineering' check(workflow in ('engineering','rpa','agro')),
 mode text not null check(mode in ('builtin','openai','demo')),
 context_snapshot jsonb not null check(jsonb_typeof(context_snapshot)='object'),
 interval_minutes integer not null check(interval_minutes in (60,360,1440,10080)),
 enabled boolean not null default true, next_run_at timestamptz not null,
 last_run_at timestamptz, last_run_id uuid references public.ao_runs(id), last_error text,
 created_at timestamptz not null default now(),
 foreign key(workspace_id,owner_id) references public.ao_workspaces(id,owner_id)
);
alter table public.ao_runs add column schedule_id uuid references public.ao_schedules(id);
create index ao_schedules_owner on public.ao_schedules(owner_id);
create index ao_schedules_due on public.ao_schedules(next_run_at) where enabled;
create index ao_schedules_workspace on public.ao_schedules(workspace_id);
create index ao_schedules_last_run on public.ao_schedules(last_run_id);
create index ao_runs_schedule on public.ao_runs(schedule_id);
alter table public.ao_schedules enable row level security;
revoke all on public.ao_schedules from anon,authenticated;
grant select on public.ao_schedules to authenticated;
grant all on public.ao_schedules to service_role;
create policy ao_schedule_read on public.ao_schedules for select to authenticated using(owner_id=(select auth.uid()));

create table public.ao_run_steps (
 run_id uuid not null references public.ao_runs(id), step_index integer not null check(step_index between 0 and 3),
 owner_id uuid not null, agent_id text not null, name text not null, content text not null,
 tokens integer not null default 0, completed_at timestamptz not null,
 primary key(run_id,step_index)
);
create index ao_run_steps_owner on public.ao_run_steps(owner_id);
alter table public.ao_run_steps enable row level security;
revoke all on public.ao_run_steps from anon,authenticated;
grant select on public.ao_run_steps to authenticated;
grant all on public.ao_run_steps to service_role;
create policy ao_steps_read on public.ao_run_steps for select to authenticated using(owner_id=(select auth.uid()));
create function public.ao_sync_steps() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 insert into public.ao_run_steps(run_id,step_index,owner_id,agent_id,name,content,tokens,completed_at)
 select new.id,(ordinality-1)::integer,new.owner_id,value->>'agent',value->>'name',value->>'content',
 coalesce((value->>'tokens')::integer,0),(value->>'completed_at')::timestamptz
 from jsonb_array_elements(new.steps) with ordinality on conflict do nothing;
 return new;
end $$;
create trigger ao_steps_sync after insert or update of steps on public.ao_runs for each row execute function public.ao_sync_steps();
insert into public.ao_run_steps(run_id,step_index,owner_id,agent_id,name,content,tokens,completed_at)
select r.id,(s.ordinality-1)::integer,r.owner_id,s.value->>'agent',s.value->>'name',s.value->>'content',
coalesce((s.value->>'tokens')::integer,0),(s.value->>'completed_at')::timestamptz
from public.ao_runs r cross join lateral jsonb_array_elements(r.steps) with ordinality s;

-- Criação e snapshot são uma única transação: o worker nunca lê uma configuração incompleta.
create function public.ao_enqueue_run(p_id uuid,p_workspace uuid,p_owner uuid,p_prompt text,p_workflow text,p_mode text,p_context jsonb,p_template text default null,p_schedule uuid default null)
returns public.ao_runs language plpgsql security invoker set search_path='' as $$
declare result public.ao_runs;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text,0));
 select * into result from public.ao_runs where id=p_id and owner_id=p_owner;
 if found then return result;end if;
 if not exists(select 1 from public.ao_workspaces where id=p_workspace and owner_id=p_owner) then raise exception 'workspace_denied';end if;
 if (select count(*) from public.ao_runs where owner_id=p_owner and created_at>now()-interval '1 day')>=30 then raise exception 'daily_limit';end if;
 if exists(select 1 from public.ao_runs where owner_id=p_owner and status in ('queued','running')) then raise exception 'active_run';end if;
 if p_context->'agents' is null or jsonb_typeof(p_context->'agents')<>'array' or jsonb_array_length(p_context->'agents') not between 1 and 4 then raise exception 'invalid_context';end if;
 insert into public.ao_runs(id,workspace_id,owner_id,title,prompt,workflow,mode,context_snapshot,template_id,schedule_id)
 values(p_id,p_workspace,p_owner,left(p_prompt,100),p_prompt,p_workflow,p_mode,p_context,p_template,p_schedule) returning * into result;
 return result;
end $$;

-- SKIP LOCKED permite despachantes concorrentes sem duplicar a mesma etapa.
create function public.ao_claim_runs(p_limit integer default 3,p_id uuid default null)
returns setof public.ao_runs language plpgsql security invoker set search_path='' as $$
begin
 update public.ao_runs set status='failed',lease=null,finished_at=now(),error='O processamento foi interrompido. Revise as etapas e execute novamente se necessário.'
 where status='running' and updated_at<now()-interval '3 minutes';
 return query
 with candidates as (select id from public.ao_runs where status='queued' and (p_id is null or id=p_id) order by created_at for update skip locked limit greatest(1,least(p_limit,3)))
 update public.ao_runs r set status='running',lease=gen_random_uuid(),started_at=coalesce(started_at,now()),error=null
 from candidates c where r.id=c.id returning r.*;
end $$;

create function public.ao_dispatch_schedules() returns integer language plpgsql security invoker set search_path='' as $$
declare s public.ao_schedules; r public.ao_runs; total integer:=0;
begin
 for s in select * from public.ao_schedules where enabled and next_run_at<=now() order by next_run_at for update skip locked limit 20 loop
  begin
   r:=public.ao_enqueue_run(gen_random_uuid(),s.workspace_id,s.owner_id,s.prompt,s.workflow,s.mode,s.context_snapshot,s.template_id,s.id);
   update public.ao_schedules set next_run_at=now()+make_interval(mins=>s.interval_minutes),last_run_at=now(),last_run_id=r.id,last_error=null where id=s.id;
   total:=total+1;
  exception when others then
   update public.ao_schedules set next_run_at=now()+interval '1 hour',last_error='Execução adiada: verifique tarefas ativas e o limite diário.' where id=s.id;
  end;
 end loop;
 return total;
end $$;
revoke all on function public.ao_sync_steps(),public.ao_enqueue_run(uuid,uuid,uuid,text,text,text,jsonb,text,uuid),public.ao_claim_runs(integer,uuid),public.ao_dispatch_schedules() from public,anon,authenticated;
grant execute on function public.ao_sync_steps(),public.ao_enqueue_run(uuid,uuid,uuid,text,text,text,jsonb,text,uuid),public.ao_claim_runs(integer,uuid),public.ao_dispatch_schedules() to service_role;
