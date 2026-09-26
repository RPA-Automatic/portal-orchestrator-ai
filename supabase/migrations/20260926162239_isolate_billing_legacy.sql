-- Arquivo reversível do domínio que foi implantado no projeto errado.
-- Não apaga dados, não usa CASCADE e não modifica o projeto Portal Faturamento.
create schema if not exists billing_legacy;
revoke all on schema billing_legacy from public,anon,authenticated;
do $$
declare obj text; routine record;
begin
 -- auth.users pertence ao serviço Auth. Mantemos o trigger e tornamos sua rotina inerte.
 if to_regprocedure('public.handle_new_auth_user_profile()') is not null then
  execute $fn$create or replace function public.handle_new_auth_user_profile() returns trigger language plpgsql security invoker set search_path='' as 'begin return new; end'$fn$;
 end if;
 foreach obj in array array['areas','profiles','operation_states','import_runs','operations','partners','contracts','logistics_orders','fiscal_documents','documents','rules','exceptions','pending_items','evidence','state_history','job_logs','audit_logs','stg_es4004_contracts','stg_gg4164_purchase_contracts','stg_gg2037_sales_contracts','stg_gplp40180_logistics_orders','stg_fiscal_documents'] loop
  if to_regclass('public.'||obj) is not null then execute format('alter table public.%I set schema billing_legacy',obj);end if;
 end loop;
 foreach obj in array array['v_operations_farol','v_area_backlog','v_contract_drilldown'] loop
  if to_regclass('public.'||obj) is not null then execute format('alter view public.%I set schema billing_legacy',obj);end if;
 end loop;
 for routine in select p.oid::regprocedure as signature from pg_proc p where p.pronamespace='public'::regnamespace and p.proname=any(array['audit_row_change','bootstrap_admin_profile','current_profile_access_level','current_profile_area','current_profile_can_read_document','current_profile_can_read_internal_data','current_profile_can_read_operation','current_profile_can_read_partner','current_profile_can_read_storage_path','current_profile_can_write_internal_data','current_profile_is_active','current_profile_is_admin','current_profile_partner_id','handle_new_auth_user_profile','normalize_contract_status','recalculate_operation_farol','recalculate_operation_farol_trigger','resolve_pending_item','set_updated_at']) loop
  execute format('alter function %s set schema billing_legacy',routine.signature);
 end loop;
end $$;
comment on schema billing_legacy is 'Arquivo desativado do domínio de faturamento. Restaurar objetos para public e restaurar a rotina do gatilho somente mediante plano de rollback; não é parte do Orchestrator.';
