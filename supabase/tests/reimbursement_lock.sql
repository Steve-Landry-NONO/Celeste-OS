begin;
create function pg_temp.assert_ok(p_ok boolean,p_message text) returns void language plpgsql as $$
begin if p_ok is distinct from true then raise exception '%',p_message; end if; end; $$;

select set_config('test.reimbursement_owner',gen_random_uuid()::text,true);
select set_config('test.reimbursement_member',gen_random_uuid()::text,true);
select set_config('test.reimbursement_other',gen_random_uuid()::text,true);
insert into auth.users(id,email)
select current_setting('test.reimbursement_'||x)::uuid,
  x||'-'||current_setting('test.reimbursement_'||x)||'@celeste-test.invalid'
from unnest(array['owner','member','other']) x;

set local role authenticated;
select set_config('request.jwt.claims',json_build_object(
  'sub',current_setting('test.reimbursement_owner'),'role','authenticated'
)::text,true);
select set_config('test.reimbursement_org',public.create_organization('Remboursements A')::text,true);
select public.manage_membership(
  current_setting('test.reimbursement_org')::uuid,
  current_setting('test.reimbursement_member')::uuid,'member','active',0
);

select pg_temp.assert_ok(
  (select count(*)=1 from public.reimbursement_policies
    where organization_id=current_setting('test.reimbursement_org')::uuid
      and version=1 and status='disabled' and scope='founders'
      and reserve_minor is null and equality_tolerance_minor=0
      and approved_by is null and decision_reference is null),
  'A new organization has one explicit disabled reimbursement policy'
);
select pg_temp.assert_ok(
  (select count(*)=1 from public.get_reimbursement_policy(
    current_setting('test.reimbursement_org')::uuid
  ) where status='disabled' and reserve_minor is null and approved_by is null),
  'Finance readers can read the persisted disabled policy'
);
select pg_temp.assert_ok(
  (select count(*)=0 from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.proname ~ '^(activate|create|submit|record|pay)_reimbursement'),
  'No reimbursement activation, claim or payment command is exposed'
);
select pg_temp.assert_ok(
  (select count(*)=0 from public.cash_entries
    where organization_id=current_setting('test.reimbursement_org')::uuid),
  'Provisioning the policy creates no cash movement'
);
select pg_temp.assert_ok(
  (select count(*)=0 from public.contribution_entries
    where organization_id=current_setting('test.reimbursement_org')::uuid),
  'Provisioning the policy creates no contribution'
);

select set_config('request.jwt.claims',json_build_object(
  'sub',current_setting('test.reimbursement_member'),'role','authenticated',
  'user_metadata',json_build_object('role','founder_finance')
)::text,true);
select pg_temp.assert_ok(
  (select count(*)=0 from public.reimbursement_policies),
  'A regular member cannot read the policy through forged metadata'
);
do $member$begin
  begin
    perform * from public.get_reimbursement_policy(current_setting('test.reimbursement_org')::uuid);
    raise exception 'Member read reimbursement policy';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.reimbursement_policies(organization_id)
    values(current_setting('test.reimbursement_org')::uuid);
    raise exception 'Member inserted reimbursement policy';
  exception when insufficient_privilege then null;
  end;
end $member$;

select set_config('request.jwt.claims',json_build_object(
  'sub',current_setting('test.reimbursement_other'),'role','authenticated'
)::text,true);
select set_config('test.reimbursement_other_org',public.create_organization('Remboursements B')::text,true);
select pg_temp.assert_ok(
  (select count(*)=1 from public.reimbursement_policies
    where organization_id=current_setting('test.reimbursement_other_org')::uuid),
  'The second organization sees only its own disabled policy'
);
select pg_temp.assert_ok(
  (select count(*)=0 from public.reimbursement_policies
    where organization_id=current_setting('test.reimbursement_org')::uuid),
  'The second organization cannot see the first policy'
);
do $cross_org$begin
  begin
    perform * from public.get_reimbursement_policy(current_setting('test.reimbursement_org')::uuid);
    raise exception 'Cross-organization policy read accepted';
  exception when insufficient_privilege then null;
  end;
end $cross_org$;

set local role service_role;
do $service_guards$begin
  begin
    update public.reimbursement_policies set status='disabled'
    where organization_id=current_setting('test.reimbursement_org')::uuid;
    raise exception 'Disabled policy updated';
  exception when object_not_in_prerequisite_state then null;
  end;
  begin
    delete from public.reimbursement_policies
    where organization_id=current_setting('test.reimbursement_org')::uuid;
    raise exception 'Disabled policy deleted';
  exception when object_not_in_prerequisite_state then null;
  end;
  begin
    insert into public.reimbursement_policies(organization_id,version,status)
    values(current_setting('test.reimbursement_org')::uuid,2,'enabled');
    raise exception 'Enabled policy inserted';
  exception when check_violation then null;
  end;
  begin
    insert into public.reimbursement_policies(organization_id,version,reserve_minor)
    values(current_setting('test.reimbursement_org')::uuid,2,1);
    raise exception 'Undecided reserve inserted';
  exception when check_violation then null;
  end;
end $service_guards$;

set local role anon;
do $anon$begin
  begin
    perform 1 from public.reimbursement_policies;
    raise exception 'Anon read reimbursement policy';
  exception when insufficient_privilege then null;
  end;
  begin
    perform * from public.get_reimbursement_policy(current_setting('test.reimbursement_org')::uuid);
    raise exception 'Anon called reimbursement policy RPC';
  exception when insufficient_privilege then null;
  end;
end $anon$;
reset role;
rollback;
select 'Disabled reimbursement policy scenarios passed; fixtures rolled back' as result;
