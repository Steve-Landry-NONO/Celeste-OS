begin;
create function pg_temp.assert_ok(p_ok boolean,p_message text) returns void language plpgsql as $$
begin if p_ok is distinct from true then raise exception '%',p_message; end if; end; $$;

select set_config('test.fin_owner',gen_random_uuid()::text,true);
select set_config('test.fin_finance',gen_random_uuid()::text,true);
select set_config('test.fin_member',gen_random_uuid()::text,true);
select set_config('test.fin_other',gen_random_uuid()::text,true);
insert into auth.users(id,email)
select current_setting('test.fin_'||x)::uuid,x||'-'||current_setting('test.fin_'||x)||'@celeste-test.invalid'
from unnest(array['owner','finance','member','other']) x;

set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.fin_owner'),'role','authenticated')::text,true);
select set_config('test.fin_org',public.create_organization('Finance A')::text,true);
select public.manage_membership(current_setting('test.fin_org')::uuid,current_setting('test.fin_finance')::uuid,'founder_finance','active',0);
select public.manage_membership(current_setting('test.fin_org')::uuid,current_setting('test.fin_member')::uuid,'member','active',0);
select set_config('test.fin_project',public.create_resource_scope(current_setting('test.fin_org')::uuid,'project','Projet finance',null)::text,true);
select set_config('test.fin_mission',public.create_resource_scope(current_setting('test.fin_org')::uuid,'mission','Mission finance',current_setting('test.fin_project')::uuid)::text,true);
select set_config('test.fin_category',public.create_expense_category(current_setting('test.fin_org')::uuid,'Communication',null)::text,true);

set local role service_role;
select set_config('test.fin_receipt',gen_random_uuid()::text,true);
insert into public.scope_files(
  id,organization_id,scope_id,object_key,file_name,content_type,size_bytes,checksum_sha256,
  status,created_by,finalized_at
) values(
  current_setting('test.fin_receipt')::uuid,current_setting('test.fin_org')::uuid,current_setting('test.fin_project')::uuid,
  current_setting('test.fin_org')||'/'||current_setting('test.fin_project')||'/receipt',
  'facture.pdf','application/pdf',12,repeat('a',64),'ready',
  current_setting('test.fin_owner')::uuid,now()
);

set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.fin_owner'),'role','authenticated')::text,true);
select set_config('test.fin_command',gen_random_uuid()::text,true);
select set_config('test.fin_expense',public.record_personal_expense(
  current_setting('test.fin_org')::uuid,current_setting('test.fin_project')::uuid,
  current_setting('test.fin_category')::uuid,current_setting('test.fin_receipt')::uuid,
  'Impression des supports',12345,current_date,current_setting('test.fin_owner')::uuid,
  current_setting('test.fin_command')::uuid
)::text,true);
select pg_temp.assert_ok((select count(*)=1 from public.expenses),'Expense persisted once');
select pg_temp.assert_ok((select count(*)=1 from public.contribution_entries),'One contribution effect persisted');
select pg_temp.assert_ok((select signed_amount_minor=12345 from public.contribution_entries),'Contribution amount exact');
select pg_temp.assert_ok((select source_type='personal' and treatment='contribution' from public.expenses),'Personal contribution treatment fixed');
select pg_temp.assert_ok(public.record_personal_expense(
  current_setting('test.fin_org')::uuid,current_setting('test.fin_project')::uuid,
  current_setting('test.fin_category')::uuid,current_setting('test.fin_receipt')::uuid,
  'Impression des supports',12345,current_date,current_setting('test.fin_owner')::uuid,
  current_setting('test.fin_command')::uuid
)=current_setting('test.fin_expense')::uuid,'Identical retry returns same result');
select pg_temp.assert_ok((select count(*)=1 from public.expenses),'Retry did not duplicate expense');
select pg_temp.assert_ok((select amount_minor=12345 from public.list_finance_contributions(current_setting('test.fin_org')::uuid)
  where user_id=current_setting('test.fin_owner')::uuid),'Finance summary uses derived contribution');

do $$begin
  begin perform public.record_personal_expense(
    current_setting('test.fin_org')::uuid,current_setting('test.fin_project')::uuid,
    current_setting('test.fin_category')::uuid,current_setting('test.fin_receipt')::uuid,
    'Impression des supports',12346,current_date,current_setting('test.fin_owner')::uuid,
    current_setting('test.fin_command')::uuid
  ); raise exception 'Changed idempotent retry accepted'; exception when serialization_failure then null; end;
  begin perform public.record_personal_expense(
    current_setting('test.fin_org')::uuid,current_setting('test.fin_project')::uuid,
    current_setting('test.fin_category')::uuid,current_setting('test.fin_receipt')::uuid,
    'Date future',100,current_date+1,current_setting('test.fin_owner')::uuid,gen_random_uuid()
  ); raise exception 'Future expense accepted'; exception when invalid_parameter_value then null; end;
  begin perform public.record_personal_expense(
    current_setting('test.fin_org')::uuid,current_setting('test.fin_mission')::uuid,
    current_setting('test.fin_category')::uuid,current_setting('test.fin_receipt')::uuid,
    'Wrong receipt scope',100,current_date,current_setting('test.fin_owner')::uuid,gen_random_uuid()
  ); raise exception 'Cross-scope receipt accepted'; exception when invalid_parameter_value then null; end;
  begin perform public.record_personal_expense(
    current_setting('test.fin_org')::uuid,current_setting('test.fin_project')::uuid,
    current_setting('test.fin_category')::uuid,current_setting('test.fin_receipt')::uuid,
    'Member payer',100,current_date,current_setting('test.fin_member')::uuid,gen_random_uuid()
  ); raise exception 'Non-founder payer accepted'; exception when invalid_parameter_value then null; end;
  begin insert into public.expenses(
    organization_id,scope_id,category_id,receipt_file_id,label,amount_minor,currency,spent_on,
    source_type,treatment,payer_id,status,confirmed_by
  ) values(
    current_setting('test.fin_org')::uuid,current_setting('test.fin_project')::uuid,
    current_setting('test.fin_category')::uuid,current_setting('test.fin_receipt')::uuid,
    'Forged',1,'EUR',current_date,'personal','contribution',
    current_setting('test.fin_owner')::uuid,'confirmed',current_setting('test.fin_owner')::uuid
  ); raise exception 'Direct expense insert accepted'; exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.fin_member'),'role','authenticated','user_metadata',json_build_object('role','founder_finance'))::text,true);
select pg_temp.assert_ok((select count(*)=0 from public.expenses),'Member cannot read finance through metadata');
select pg_temp.assert_ok((select count(*)=0 from public.expense_categories),'Member cannot read categories');
select pg_temp.assert_ok((select count(*)=0 from public.contribution_entries),'Member cannot read contributions');
do $$begin
  begin perform public.create_expense_category(current_setting('test.fin_org')::uuid,'Forgée',null); raise exception 'Member created category'; exception when insufficient_privilege then null; end;
  begin perform public.record_personal_expense(
    current_setting('test.fin_org')::uuid,current_setting('test.fin_project')::uuid,
    current_setting('test.fin_category')::uuid,current_setting('test.fin_receipt')::uuid,
    'Forged',1,current_date,current_setting('test.fin_owner')::uuid,gen_random_uuid()
  ); raise exception 'Member confirmed expense'; exception when insufficient_privilege then null; end;
  begin perform * from public.list_finance_contributions(current_setting('test.fin_org')::uuid); raise exception 'Member read finance summary'; exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.fin_other'),'role','authenticated')::text,true);
select set_config('test.fin_foreign_org',public.create_organization('Finance B')::text,true);
select pg_temp.assert_ok((select count(*)=0 from public.expenses),'Other organization sees no expense');
do $$begin
  begin perform public.record_personal_expense(
    current_setting('test.fin_foreign_org')::uuid,current_setting('test.fin_project')::uuid,
    current_setting('test.fin_category')::uuid,current_setting('test.fin_receipt')::uuid,
    'Cross org',1,current_date,auth.uid(),gen_random_uuid()
  ); raise exception 'Cross-organization expense accepted'; exception when invalid_parameter_value then null; when insufficient_privilege then null; end;
end $$;

set local role service_role;
do $$begin
  begin update public.expenses set label='Réécrite' where id=current_setting('test.fin_expense')::uuid; raise exception 'Confirmed expense updated'; exception when object_not_in_prerequisite_state then null; end;
  begin delete from public.expenses where id=current_setting('test.fin_expense')::uuid; raise exception 'Confirmed expense deleted'; exception when object_not_in_prerequisite_state then null; end;
  begin update public.contribution_entries set signed_amount_minor=1 where expense_id=current_setting('test.fin_expense')::uuid; raise exception 'Contribution rewritten'; exception when object_not_in_prerequisite_state then null; end;
end $$;

set local role anon;
do $$begin
  begin select 1 from public.expenses; raise exception 'Anon read expenses'; exception when insufficient_privilege then null; end;
  begin perform public.create_expense_category(current_setting('test.fin_org')::uuid,'Anon',null); raise exception 'Anon category RPC exposed'; exception when insufficient_privilege then null; end;
  begin perform public.record_personal_expense(
    current_setting('test.fin_org')::uuid,current_setting('test.fin_project')::uuid,
    current_setting('test.fin_category')::uuid,current_setting('test.fin_receipt')::uuid,
    'Anon',1,current_date,current_setting('test.fin_owner')::uuid,gen_random_uuid()
  ); raise exception 'Anon expense RPC exposed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'Personal expense scenarios passed; fixtures rolled back' as result;
