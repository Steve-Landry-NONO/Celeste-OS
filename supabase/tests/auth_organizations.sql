-- Disposable .invalid fixtures; all changes are rolled back, including Auth users.
begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('00000000-0000-4000-8000-000000000001','owner-a@celeste-test.invalid','{"display_name":"Owner A"}'),
 ('00000000-0000-4000-8000-000000000002','owner-b@celeste-test.invalid','{"display_name":"Owner B"}'),
 ('00000000-0000-4000-8000-000000000003','member@celeste-test.invalid','{"role":"founder_admin"}'),
 ('00000000-0000-4000-8000-000000000004','vendor@celeste-test.invalid','{}');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select set_config('test.org_a',public.create_organization('Isolation A')::text,true);
select public.manage_membership(current_setting('test.org_a')::uuid,'00000000-0000-4000-8000-000000000003','member','active',0);
select public.manage_membership(current_setting('test.org_a')::uuid,'00000000-0000-4000-8000-000000000004','vendor','active',0);
do $$begin
  if (select count(*) from public.organizations)<>1 then raise exception 'Owner A must see only A'; end if;
  if (select count(*) from public.memberships)<>3 then raise exception 'Admin roster wrong'; end if;
  if (select count(*) from public.activity_events)<>3 then raise exception 'Atomic audit missing'; end if;
  begin
    perform public.manage_membership(current_setting('test.org_a')::uuid,'00000000-0000-4000-8000-000000000001','member','active',1);
    raise exception 'Last admin demotion accepted';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.manage_membership(current_setting('test.org_a')::uuid,'00000000-0000-4000-8000-000000000003','support','active',99);
    raise exception 'Stale membership accepted';
  exception when serialization_failure then null; end;
end $$;

select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select set_config('test.org_b',public.create_organization('Isolation B')::text,true);
do $$declare n integer; begin
  if (select count(*) from public.organizations)<>1 then raise exception 'Cross-org read leaked'; end if;
  if exists(select 1 from public.organizations where id=current_setting('test.org_a')::uuid) then raise exception 'A leaked to B'; end if;
  update public.organizations set name='Unauthorized' where id=current_setting('test.org_a')::uuid;
  get diagnostics n=row_count;
  if n<>0 then raise exception 'Cross-org update accepted'; end if;
  begin
    perform public.manage_membership(current_setting('test.org_a')::uuid,'00000000-0000-4000-8000-000000000002','founder_admin','active',0);
    raise exception 'Cross-org admin RPC accepted';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000003","role":"authenticated","user_metadata":{"role":"founder_admin"}}',true);
do $$declare n integer; begin
  if (select count(*) from public.organizations)<>1 then raise exception 'Member org visibility wrong'; end if;
  if (select count(*) from public.memberships)<>1 then raise exception 'Member roster leaked'; end if;
  if (select count(*) from public.profiles)<>1 then raise exception 'Other profiles leaked'; end if;
  if (select count(*) from public.activity_events)<>0 then raise exception 'Member audit leaked'; end if;
  if private_celeste.can(current_setting('test.org_a')::uuid,'finance.read') then raise exception 'Member finance capability leaked'; end if;
  begin
    perform public.manage_membership(current_setting('test.org_a')::uuid,'00000000-0000-4000-8000-000000000003','founder_admin','active',1);
    raise exception 'Editable metadata escalated membership';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.memberships(organization_id,user_id,role) values(current_setting('test.org_b')::uuid,auth.uid(),'founder_admin');
    raise exception 'Direct membership write accepted';
  exception when insufficient_privilege then null; end;
  update public.organizations set name='Unauthorized' where id=current_setting('test.org_a')::uuid;
  get diagnostics n=row_count;
  if n<>0 then raise exception 'Member changed organization'; end if;
end $$;

select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000004","role":"authenticated"}',true);
do $$begin
  if (select count(*) from public.memberships)<>1 then raise exception 'Vendor roster leaked'; end if;
  if (select count(*) from public.activity_events)<>0 then raise exception 'Vendor audit leaked'; end if;
  if private_celeste.can(current_setting('test.org_a')::uuid,'finance.read') then raise exception 'Vendor finance capability leaked'; end if;
end $$;

select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select public.manage_membership(current_setting('test.org_a')::uuid,'00000000-0000-4000-8000-000000000003','member','suspended',1);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
do $$begin
  if (select count(*) from public.organizations)<>0 then raise exception 'Revoked member still sees organization'; end if;
  if (select count(*) from public.memberships)<>0 then raise exception 'Revoked member still sees membership'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated","is_anonymous":true}',true);
do $$begin
  if (select count(*) from public.organizations)<>0 then raise exception 'Anonymous Auth user sees organization'; end if;
  begin perform public.create_organization('Anonymous'); raise exception 'Anonymous created organization';
  exception when insufficient_privilege then null; end;
end $$;
set local role anon;
do $$begin
  begin perform * from public.organizations; raise exception 'Unauthenticated organization read accepted';
  exception when insufficient_privilege then null; end;
  begin perform public.create_organization('Unauthenticated'); raise exception 'Unauthenticated RPC accepted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'All 26 authorization assertions passed; fixtures rolled back' as result;
