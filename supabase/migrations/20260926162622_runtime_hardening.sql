create index ao_runs_workspace_owner on public.ao_runs(workspace_id,owner_id);
create index ao_memory_workspace_owner on public.ao_memory(workspace_id,owner_id);
create index ao_schedules_workspace_owner on public.ao_schedules(workspace_id,owner_id);
-- O limite de agendas é transacional, inclusive com requisições concorrentes.
create function public.ao_limit_schedules() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(new.owner_id::text,1));
 if (select count(*) from public.ao_schedules where owner_id=new.owner_id)>=20 then raise exception 'schedule_limit';end if;
 return new;
end $$;
revoke all on function public.ao_limit_schedules() from public,anon,authenticated;
grant execute on function public.ao_limit_schedules() to service_role;
create trigger ao_schedule_limit before insert on public.ao_schedules for each row execute function public.ao_limit_schedules();

-- pg_net não é relocável. A reinstalação só ocorre com a fila de rede vazia.
-- Apenas metadados temporários de respostas HTTP são descartados; os jobs ficam em ao_runs.
select cron.alter_job((select jobid from cron.job where jobname='ao-autonomous-worker'),active:=false);
do $$ begin
 if exists(select 1 from net.http_request_queue) then raise exception 'network_queue_not_empty';end if;
end $$;
drop extension pg_net;
create extension pg_net with schema extensions;
revoke usage on schema net from public,anon,authenticated;
revoke execute on all functions in schema net from public,anon,authenticated;
select cron.alter_job((select jobid from cron.job where jobname='ao-autonomous-worker'),active:=true);
