-- Infraestrutura do despachante. O token permanece no Vault e nunca sai para o frontend.
create extension if not exists pg_cron;
create extension if not exists pg_net;
do $$ begin
 if not exists(select 1 from vault.secrets where name='ao_worker_token') then
  perform vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'ao_worker_token','Autenticação interna do worker RPA Automatic');
 end if;
end $$;
create function public.ao_verify_worker(p_token text) returns boolean language sql security invoker set search_path='' as $$
 select exists(select 1 from vault.decrypted_secrets where name='ao_worker_token' and decrypted_secret=p_token and length(p_token)=64)
$$;
revoke all on function public.ao_verify_worker(text) from public,anon,authenticated;
grant execute on function public.ao_verify_worker(text) to service_role;
-- Apenas o despachante lê o segredo. A função verificadora não pode retornar seu valor.
grant usage on schema vault to service_role;
grant select on vault.decrypted_secrets to service_role;
create function orchestrator_private.dispatch_worker() returns bigint language sql security invoker set search_path='' as $$
 select net.http_post(
  url:='https://lvsocwetuhhqxlwyfdrw.supabase.co/functions/v1/agent-orchestrator',
  headers:=jsonb_build_object('Content-Type','application/json','x-worker-token',(select decrypted_secret from vault.decrypted_secrets where name='ao_worker_token')),
  body:='{"action":"tick"}'::jsonb,timeout_milliseconds:=90000)
$$;
revoke all on function orchestrator_private.dispatch_worker() from public,anon,authenticated;
select cron.schedule('ao-autonomous-worker','* * * * *','select orchestrator_private.dispatch_worker()');
