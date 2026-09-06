begin;
insert into auth.users(id,email) values('11111111-1111-4111-8111-111111111111','agent-os-qa-a@example.invalid'),('22222222-2222-4222-8222-222222222222','agent-os-qa-b@example.invalid');
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
insert into public.ao_workspaces(id,owner_id,name) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','QA isolated A');
do $$ begin
 begin
  insert into public.ao_workspaces(owner_id,name) values('22222222-2222-4222-8222-222222222222','Forbidden');
  raise exception 'SECURITY: foreign owner insert allowed';
 exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
insert into public.ao_workspaces(id,owner_id,name) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','QA isolated B');
do $$ begin
 if (select count(*) from public.ao_workspaces where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')<>0 then raise exception 'SECURITY: cross-tenant workspace read';end if;
 begin
 insert into public.ao_memory(workspace_id,owner_id,title,content) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','22222222-2222-4222-8222-222222222222','Cross reference','Blocked');
 raise exception 'SECURITY: cross-tenant FK allowed';
 exception when foreign_key_violation then null;end;
end $$;
reset role;
select public.ao_create_run('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','Teste de isolamento do Agent OS','engineering','demo');
select public.ao_create_run('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','Teste de isolamento do Agent OS','engineering','demo');
do $$begin
 if(select count(*) from public.ao_runs where id='cccccccc-cccc-4ccc-8ccc-cccccccccccc')<>1 then raise exception 'Idempotency failed';end if;
 if(select count(*) from public.ao_events where run_id='cccccccc-cccc-4ccc-8ccc-cccccccccccc')<>1 then raise exception 'Audit insert failed';end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
do $$begin
 if exists(select 1 from public.ao_runs where id='cccccccc-cccc-4ccc-8ccc-cccccccccccc') then raise exception 'SECURITY: cross-tenant run read';end if;
 if exists(select 1 from public.ao_events where run_id='cccccccc-cccc-4ccc-8ccc-cccccccccccc') then raise exception 'SECURITY: cross-tenant audit read';end if;
 begin
 update public.ao_runs set status='completed' where id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
 raise exception 'SECURITY: browser can approve runs';
 exception when insufficient_privilege then null;end;
 begin
 perform public.ao_create_run('dddddddd-dddd-4ddd-8ddd-dddddddddddd','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','Cannot bypass API quota','engineering','demo');
 raise exception 'SECURITY: browser can call privileged RPC';
 exception when insufficient_privilege then null;end;
end $$;
reset role;
select 'PASS: tenant isolation, composite FK, browser writes, RPC permissions, idempotency, audit' as result;
rollback;
