-- Disposable fixtures, including Auth identities, always rolled back.
begin;
select set_config('test.directory_owner',gen_random_uuid()::text,true);
select set_config('test.directory_member',gen_random_uuid()::text,true);
select set_config('test.directory_outsider',gen_random_uuid()::text,true);
insert into auth.users(id,email,raw_user_meta_data) values
 (current_setting('test.directory_owner')::uuid,'directory-owner-'||current_setting('test.directory_owner')||'@celeste-test.invalid','{"display_name":"Équipe propriétaire"}'),
 (current_setting('test.directory_member')::uuid,'directory-member-'||current_setting('test.directory_member')||'@celeste-test.invalid','{"display_name":"Membre partagé","role":"founder_admin"}'),
 (current_setting('test.directory_outsider')::uuid,'directory-outsider-'||current_setting('test.directory_outsider')||'@celeste-test.invalid','{"display_name":"Profil hors espace"}');

set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.directory_owner'),'role','authenticated')::text,true);
select set_config('test.directory_org',public.create_organization('Annuaire A')::text,true);
select public.manage_membership(current_setting('test.directory_org')::uuid,current_setting('test.directory_member')::uuid,'member','active',0);
do $$begin
  if (select count(*) from public.list_organization_members(current_setting('test.directory_org')::uuid))<>2 then raise exception 'Authorized roster incomplete'; end if;
  if not exists(select 1 from public.list_organization_members(current_setting('test.directory_org')::uuid) where display_name='Membre partagé') then raise exception 'Member name missing'; end if;
  if exists(select 1 from public.list_organization_members(current_setting('test.directory_org')::uuid) where user_id=current_setting('test.directory_outsider')::uuid) then raise exception 'Unrelated profile leaked'; end if;
  if (select count(*) from public.profiles)<>1 then raise exception 'Direct profiles RLS widened'; end if;
  begin perform * from public.list_organization_members(null); raise exception 'Null org accepted';
  exception when insufficient_privilege then null; end;
  begin perform * from public.list_organization_members(gen_random_uuid()); raise exception 'Unknown org accepted';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.directory_outsider'),'role','authenticated')::text,true);
select public.create_organization('Annuaire B');
do $$begin
  begin perform * from public.list_organization_members(current_setting('test.directory_org')::uuid); raise exception 'Foreign administrator read roster';
  exception when insufficient_privilege then null; end;
  begin perform * from private_celeste.list_organization_members(current_setting('test.directory_org')::uuid); raise exception 'Private helper bypassed scope';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.directory_member'),'role','authenticated','user_metadata',json_build_object('role','founder_admin'))::text,true);
do $$begin
  begin perform * from public.list_organization_members(current_setting('test.directory_org')::uuid); raise exception 'Member or editable metadata leaked roster';
  exception when insufficient_privilege then null; end;
  begin perform * from private_celeste.list_organization_members(current_setting('test.directory_org')::uuid); raise exception 'Private helper bypassed capability';
  exception when insufficient_privilege then null; end;
end $$;
update public.profiles set display_name='Nom actualisé' where id=auth.uid();
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.directory_owner'),'role','authenticated')::text,true);
do $$begin
  if not exists(select 1 from public.list_organization_members(current_setting('test.directory_org')::uuid) where display_name='Nom actualisé') then raise exception 'Stale profile copied into roster'; end if;
end $$;

-- Every non-administrative role must be refused, including finance.
do $$declare v_role text; v_version integer := 1; begin
  foreach v_role in array array['founder_finance','support','vendor'] loop
    perform public.manage_membership(current_setting('test.directory_org')::uuid,current_setting('test.directory_member')::uuid,v_role,'active',v_version);
    v_version := v_version+1;
    perform set_config('request.jwt.claims',json_build_object('sub',current_setting('test.directory_member'),'role','authenticated')::text,true);
    begin perform * from public.list_organization_members(current_setting('test.directory_org')::uuid); raise exception 'Non-admin role % read roster',v_role;
    exception when insufficient_privilege then null; end;
    perform set_config('request.jwt.claims',json_build_object('sub',current_setting('test.directory_owner'),'role','authenticated')::text,true);
  end loop;
end $$;
select public.manage_membership(current_setting('test.directory_org')::uuid,current_setting('test.directory_member')::uuid,'founder_admin','suspended',4);
do $$begin
  if not exists(select 1 from public.list_organization_members(current_setting('test.directory_org')::uuid) where display_name='Nom actualisé' and status='suspended') then raise exception 'Admin lost suspended member name'; end if;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.directory_member'),'role','authenticated')::text,true);
do $$begin
  begin perform * from public.list_organization_members(current_setting('test.directory_org')::uuid); raise exception 'Suspended admin read roster';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.directory_owner'),'role','authenticated','is_anonymous',true)::text,true);
do $$begin
  begin perform * from public.list_organization_members(current_setting('test.directory_org')::uuid); raise exception 'Anonymous Auth account read roster';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{}',true);
do $$begin
  begin perform * from public.list_organization_members(current_setting('test.directory_org')::uuid); raise exception 'Missing identity read roster';
  exception when insufficient_privilege then null; end;
end $$;
set local role anon;
do $$begin
  begin perform * from public.list_organization_members(current_setting('test.directory_org')::uuid); raise exception 'Unauthenticated RPC executable';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'Member directory authorization scenarios passed; fixtures rolled back' as result;
