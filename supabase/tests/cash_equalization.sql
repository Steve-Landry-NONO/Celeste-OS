begin;
create function pg_temp.assert_ok(p_ok boolean,p_message text) returns void language plpgsql as $$
begin if p_ok is distinct from true then raise exception '%',p_message; end if; end; $$;

select set_config('test.cash_maeva',gen_random_uuid()::text,true);
select set_config('test.cash_steve',gen_random_uuid()::text,true);
select set_config('test.cash_stephane',gen_random_uuid()::text,true);
select set_config('test.cash_member',gen_random_uuid()::text,true);
select set_config('test.cash_other',gen_random_uuid()::text,true);
insert into auth.users(id,email)
select current_setting('test.cash_'||x)::uuid,x||'-'||current_setting('test.cash_'||x)||'@celeste-test.invalid'
from unnest(array['maeva','steve','stephane','member','other']) x;

set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.cash_maeva'),'role','authenticated')::text,true);
select set_config('test.cash_org',public.create_organization('Caisse A')::text,true);
select public.manage_membership(current_setting('test.cash_org')::uuid,current_setting('test.cash_steve')::uuid,'founder_finance','active',0);
select public.manage_membership(current_setting('test.cash_org')::uuid,current_setting('test.cash_stephane')::uuid,'founder_finance','active',0);
select public.manage_membership(current_setting('test.cash_org')::uuid,current_setting('test.cash_member')::uuid,'member','active',0);
select set_config('test.cash_project',public.create_resource_scope(current_setting('test.cash_org')::uuid,'project','Projet caisse',null)::text,true);
select set_config('test.cash_category',public.create_expense_category(current_setting('test.cash_org')::uuid,'Achats',null)::text,true);
select set_config('test.cash_account',public.create_cash_account(current_setting('test.cash_org')::uuid,'Caisse principale')::text,true);

set local role service_role;
select set_config('test.cash_receipt',gen_random_uuid()::text,true);
insert into public.scope_files(
  id,organization_id,scope_id,object_key,file_name,content_type,size_bytes,checksum_sha256,
  status,created_by,finalized_at
) values(
  current_setting('test.cash_receipt')::uuid,current_setting('test.cash_org')::uuid,current_setting('test.cash_project')::uuid,
  current_setting('test.cash_org')||'/'||current_setting('test.cash_project')||'/cash-receipt',
  'caisse.pdf','application/pdf',12,repeat('b',64),'ready',current_setting('test.cash_maeva')::uuid,now()
);

set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.cash_maeva'),'role','authenticated')::text,true);
select public.record_personal_expense(
  current_setting('test.cash_org')::uuid,current_setting('test.cash_project')::uuid,
  current_setting('test.cash_category')::uuid,current_setting('test.cash_receipt')::uuid,
  'Dépense Maeva',120000,current_date,current_setting('test.cash_maeva')::uuid,gen_random_uuid()
);
select public.record_personal_expense(
  current_setting('test.cash_org')::uuid,current_setting('test.cash_project')::uuid,
  current_setting('test.cash_category')::uuid,current_setting('test.cash_receipt')::uuid,
  'Dépense Steve',30000,current_date,current_setting('test.cash_steve')::uuid,gen_random_uuid()
);
select public.record_personal_expense(
  current_setting('test.cash_org')::uuid,current_setting('test.cash_project')::uuid,
  current_setting('test.cash_category')::uuid,current_setting('test.cash_receipt')::uuid,
  'Dépense Stéphane',10000,current_date,current_setting('test.cash_stephane')::uuid,gen_random_uuid()
);
select set_config('test.cash_deposit_command',gen_random_uuid()::text,true);
select set_config('test.cash_deposit_steve',public.record_fund_deposit(
  current_setting('test.cash_org')::uuid,current_setting('test.cash_account')::uuid,
  current_setting('test.cash_steve')::uuid,'Versement Steve',90000,current_date,
  current_setting('test.cash_deposit_command')::uuid
)::text,true);
select public.record_fund_deposit(
  current_setting('test.cash_org')::uuid,current_setting('test.cash_account')::uuid,
  current_setting('test.cash_stephane')::uuid,'Versement Stéphane',110000,current_date,gen_random_uuid()
);
select set_config('test.cash_fund_expense',public.record_fund_expense(
  current_setting('test.cash_org')::uuid,current_setting('test.cash_project')::uuid,
  current_setting('test.cash_category')::uuid,current_setting('test.cash_receipt')::uuid,
  current_setting('test.cash_account')::uuid,'Dépense du fonds',50000,current_date,gen_random_uuid()
)::text,true);

select pg_temp.assert_ok((select count(*)=2 from public.fund_deposits),'Two deposits persisted');
select pg_temp.assert_ok((select count(*)=3 from public.cash_entries),'Every cash effect persisted once');
select pg_temp.assert_ok((select count(*)=5 from public.contribution_entries),'Deposits and personal expenses each contribute once');
select pg_temp.assert_ok((select count(*)=0 from public.contribution_entries where expense_id=current_setting('test.cash_fund_expense')::uuid),'Fund expense creates no contribution');
select pg_temp.assert_ok((select cost_minor=210000 and cash_minor=150000 and contribution_minor=360000
  and reference_minor=120000 and equalized from public.get_finance_totals(current_setting('test.cash_org')::uuid)),
  'FIN-02 exact totals are derived without double counting');
select pg_temp.assert_ok((select count(*)=3 from public.list_finance_contributions(current_setting('test.cash_org')::uuid)
  where amount_minor=120000 and reference_minor=120000 and remaining_minor=0 and can_confirm),
  'All active founders are exactly equalized');
select pg_temp.assert_ok(public.record_fund_deposit(
  current_setting('test.cash_org')::uuid,current_setting('test.cash_account')::uuid,
  current_setting('test.cash_steve')::uuid,'Versement Steve',90000,current_date,
  current_setting('test.cash_deposit_command')::uuid
)=current_setting('test.cash_deposit_steve')::uuid,'Identical deposit retry returns the same result');
select pg_temp.assert_ok((select count(*)=2 from public.fund_deposits),'Deposit retry did not duplicate any effect');

do $$begin
  begin perform public.record_fund_deposit(
    current_setting('test.cash_org')::uuid,current_setting('test.cash_account')::uuid,
    current_setting('test.cash_steve')::uuid,'Versement Steve',90001,current_date,
    current_setting('test.cash_deposit_command')::uuid
  ); raise exception 'Changed idempotent deposit accepted'; exception when serialization_failure then null; end;
  begin perform public.record_fund_expense(
    current_setting('test.cash_org')::uuid,current_setting('test.cash_project')::uuid,
    current_setting('test.cash_category')::uuid,current_setting('test.cash_receipt')::uuid,
    current_setting('test.cash_account')::uuid,'Solde insuffisant',150001,current_date,gen_random_uuid()
  ); raise exception 'Overdraft accepted'; exception when check_violation then null; end;
end $$;

select public.record_supplier_refund(
  current_setting('test.cash_org')::uuid,current_setting('test.cash_fund_expense')::uuid,
  current_setting('test.cash_account')::uuid,'Avoir fournisseur',10000,current_date,gen_random_uuid()
);
select pg_temp.assert_ok((select cost_minor=200000 and cash_minor=160000 and contribution_minor=360000
  from public.get_finance_totals(current_setting('test.cash_org')::uuid)),
  'Supplier refund reduces net cost and restores cash without changing contributions');
do $$begin
  begin perform public.record_supplier_refund(
    current_setting('test.cash_org')::uuid,current_setting('test.cash_fund_expense')::uuid,
    current_setting('test.cash_account')::uuid,'Avoir excessif',40001,current_date,gen_random_uuid()
  ); raise exception 'Excess supplier refund accepted'; exception when check_violation then null; end;
  begin perform public.record_fund_deposit(
    current_setting('test.cash_org')::uuid,current_setting('test.cash_account')::uuid,
    current_setting('test.cash_steve')::uuid,'Date future',100,current_date+1,gen_random_uuid()
  ); raise exception 'Future deposit accepted'; exception when invalid_parameter_value then null; end;
end $$;

select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.cash_member'),'role','authenticated','user_metadata',json_build_object('role','founder_finance'))::text,true);
select pg_temp.assert_ok((select count(*)=0 from public.cash_accounts),'Member cannot read cash accounts through metadata');
select pg_temp.assert_ok((select count(*)=0 from public.cash_entries),'Member cannot read cash entries through metadata');
do $$begin
  begin perform public.create_cash_account(current_setting('test.cash_org')::uuid,'Forgée'); raise exception 'Member created account'; exception when insufficient_privilege then null; end;
  begin perform public.record_fund_deposit(
    current_setting('test.cash_org')::uuid,current_setting('test.cash_account')::uuid,
    current_setting('test.cash_steve')::uuid,'Forgé',1,current_date,gen_random_uuid()
  ); raise exception 'Member deposited'; exception when insufficient_privilege then null; end;
  begin perform * from public.get_finance_totals(current_setting('test.cash_org')::uuid); raise exception 'Member read totals'; exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.cash_other'),'role','authenticated')::text,true);
select set_config('test.cash_other_org',public.create_organization('Caisse B')::text,true);
select pg_temp.assert_ok((select count(*)=0 from public.cash_entries),'Other organization sees no cash movement');
do $$begin
  begin perform public.record_fund_deposit(
    current_setting('test.cash_other_org')::uuid,current_setting('test.cash_account')::uuid,
    current_setting('test.cash_other')::uuid,'Croisé',1,current_date,gen_random_uuid()
  ); raise exception 'Cross-organization deposit accepted'; exception when invalid_parameter_value then null; when insufficient_privilege then null; end;
end $$;

set local role service_role;
do $$begin
  begin update public.fund_deposits set label='Réécrit' where id=current_setting('test.cash_deposit_steve')::uuid; raise exception 'Deposit updated'; exception when object_not_in_prerequisite_state then null; end;
  begin delete from public.cash_entries where source_id=current_setting('test.cash_deposit_steve')::uuid; raise exception 'Cash entry deleted'; exception when object_not_in_prerequisite_state then null; end;
  begin update public.supplier_refunds set amount_minor=1; raise exception 'Supplier refund updated'; exception when object_not_in_prerequisite_state then null; end;
end $$;

set local role anon;
do $$begin
  begin select 1 from public.cash_accounts; raise exception 'Anon read accounts'; exception when insufficient_privilege then null; end;
  begin perform public.record_fund_deposit(
    current_setting('test.cash_org')::uuid,current_setting('test.cash_account')::uuid,
    current_setting('test.cash_steve')::uuid,'Anon',1,current_date,gen_random_uuid()
  ); raise exception 'Anon deposit RPC exposed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'Cash and equalization scenarios passed; fixtures rolled back' as result;
