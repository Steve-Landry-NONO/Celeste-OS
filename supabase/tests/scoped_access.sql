begin;
create function pg_temp.assert_ok(p_ok boolean,p_message text) returns void language plpgsql as $$
begin if p_ok is distinct from true then raise exception '%',p_message; end if; end; $$;
select set_config('test.scope_owner',gen_random_uuid()::text,true);
select set_config('test.scope_member',gen_random_uuid()::text,true);
select set_config('test.scope_vendor',gen_random_uuid()::text,true);
select set_config('test.scope_other',gen_random_uuid()::text,true);
insert into auth.users(id,email) select current_setting('test.scope_'||x)::uuid,x||'-'||current_setting('test.scope_'||x)||'@celeste-test.invalid'
 from unnest(array['owner','member','vendor','other']) x;
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.scope_owner'),'role','authenticated')::text,true);
select set_config('test.scope_org',public.create_organization('Scopes A')::text,true);
select public.manage_membership(current_setting('test.scope_org')::uuid,current_setting('test.scope_member')::uuid,'member','active',0);
select public.manage_membership(current_setting('test.scope_org')::uuid,current_setting('test.scope_vendor')::uuid,'vendor','active',0);
select set_config('test.scope_project',public.create_resource_scope(current_setting('test.scope_org')::uuid,'project','Projet privé',null)::text,true);
select set_config('test.scope_mission',public.create_resource_scope(current_setting('test.scope_org')::uuid,'mission','Mission A',current_setting('test.scope_project')::uuid)::text,true);
select set_config('test.scope_sibling',public.create_resource_scope(current_setting('test.scope_org')::uuid,'mission','Mission B',current_setting('test.scope_project')::uuid)::text,true);
select pg_temp.assert_ok((select count(*)=3 from public.resource_scopes),'Admin scope read');
select pg_temp.assert_ok((select count(*)=3 from public.activity_events where action='scope.created'),'Creation audited');
do $$begin
 begin perform public.create_resource_scope(current_setting('test.scope_org')::uuid,'mission','Invalid',current_setting('test.scope_mission')::uuid); raise exception 'Mission parent accepted'; exception when invalid_parameter_value then null; end;
 begin perform public.create_resource_scope(current_setting('test.scope_org')::uuid,'project','Invalid',current_setting('test.scope_project')::uuid); raise exception 'Project parent accepted'; exception when invalid_parameter_value then null; end;
 begin perform public.create_resource_scope(current_setting('test.scope_org')::uuid,'mission','Invalid',null); raise exception 'Missing parent accepted'; exception when invalid_parameter_value then null; end;
 begin perform public.create_resource_scope(current_setting('test.scope_org')::uuid,'project',' ',null); raise exception 'Invalid name accepted'; exception when invalid_parameter_value then null; end;
 begin perform public.set_scope_access(current_setting('test.scope_org')::uuid,current_setting('test.scope_project')::uuid,current_setting('test.scope_vendor')::uuid,true,0); raise exception 'Vendor project access accepted'; exception when invalid_parameter_value then null; end;
 begin perform public.set_scope_access(current_setting('test.scope_org')::uuid,current_setting('test.scope_mission')::uuid,current_setting('test.scope_other')::uuid,true,0); raise exception 'Nonmember grant accepted'; exception when invalid_parameter_value then null; end;
 begin perform public.set_scope_access(current_setting('test.scope_org')::uuid,current_setting('test.scope_mission')::uuid,current_setting('test.scope_member')::uuid,null,0); raise exception 'Null access accepted'; exception when invalid_parameter_value then null; end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.scope_member'),'role','authenticated','user_metadata',json_build_object('role','founder_admin'))::text,true);
select pg_temp.assert_ok((select count(*)=0 from public.resource_scopes),'Member denied by default and metadata ignored');
do $$begin
 begin perform public.create_resource_scope(current_setting('test.scope_org')::uuid,'project','Unauthorized',null); raise exception 'Member created scope'; exception when insufficient_privilege then null; end;
 begin perform public.set_scope_access(current_setting('test.scope_org')::uuid,current_setting('test.scope_project')::uuid,auth.uid(),true,0); raise exception 'Member self-granted'; exception when insufficient_privilege then null; end;
 begin perform * from public.list_scope_access(current_setting('test.scope_org')::uuid); raise exception 'Member read grants'; exception when insufficient_privilege then null; end;
 begin perform * from private_celeste.list_scope_access(current_setting('test.scope_org')::uuid); raise exception 'Private helper bypass'; exception when insufficient_privilege then null; end;
 begin insert into public.resource_scopes(organization_id,kind,name) values(current_setting('test.scope_org')::uuid,'project','Forged'); raise exception 'Direct insert permitted'; exception when insufficient_privilege then null; end;
 begin update public.resource_scopes set name='Forged'; raise exception 'Direct update permitted'; exception when insufficient_privilege then null; end;
 begin delete from public.resource_scopes; raise exception 'Direct delete permitted'; exception when insufficient_privilege then null; end;
 begin select 1 from private_celeste.scope_grants; raise exception 'Private table exposed'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.scope_owner'),'role','authenticated')::text,true);
select pg_temp.assert_ok(public.set_scope_access(current_setting('test.scope_org')::uuid,current_setting('test.scope_project')::uuid,current_setting('test.scope_member')::uuid,true,0)=1,'Grant initial version');
select public.set_scope_access(current_setting('test.scope_org')::uuid,current_setting('test.scope_mission')::uuid,current_setting('test.scope_vendor')::uuid,true,0);
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.scope_member'),'role','authenticated')::text,true);
select pg_temp.assert_ok((select count(*)=1 from public.resource_scopes),'Project grant does not inherit missions');
select pg_temp.assert_ok((select kind='project' from public.resource_scopes),'Correct project visible');
select pg_temp.assert_ok((select count(*)=0 from public.activity_events),'No global audit exposed');
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.scope_vendor'),'role','authenticated')::text,true);
select pg_temp.assert_ok((select count(*)=1 from public.resource_scopes),'Vendor exactly one mission');
select pg_temp.assert_ok((select id=current_setting('test.scope_mission')::uuid from public.resource_scopes),'Vendor mission correct');
select pg_temp.assert_ok(not private_celeste.can_read_scope(current_setting('test.scope_project')::uuid),'No parent project privilege');
select pg_temp.assert_ok(not private_celeste.can_read_scope(current_setting('test.scope_sibling')::uuid),'No sibling mission privilege');
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.scope_other'),'role','authenticated')::text,true);
select set_config('test.scope_foreign_org',public.create_organization('Scopes B')::text,true);
select set_config('test.scope_foreign_project',public.create_resource_scope(current_setting('test.scope_foreign_org')::uuid,'project','Projet étranger',null)::text,true);
select pg_temp.assert_ok((select count(*)=1 from public.resource_scopes),'Foreign admin sees own scope only');
do $$begin
 begin perform public.set_scope_access(current_setting('test.scope_org')::uuid,current_setting('test.scope_mission')::uuid,auth.uid(),true,0); raise exception 'Foreign admin granted'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.scope_owner'),'role','authenticated')::text,true);
do $$begin
 begin perform public.create_resource_scope(current_setting('test.scope_org')::uuid,'mission','Forged parent',current_setting('test.scope_foreign_project')::uuid); raise exception 'Cross-org parent accepted'; exception when invalid_parameter_value then null; end;
 begin perform public.set_scope_access(current_setting('test.scope_org')::uuid,current_setting('test.scope_foreign_project')::uuid,current_setting('test.scope_member')::uuid,true,0); raise exception 'Cross-org scope accepted'; exception when invalid_parameter_value then null; end;
 begin perform public.set_scope_access(current_setting('test.scope_org')::uuid,current_setting('test.scope_project')::uuid,current_setting('test.scope_member')::uuid,false,0); raise exception 'Stale access overwritten'; exception when serialization_failure then null; end;
end $$;
select pg_temp.assert_ok((select count(*)=2 from public.list_scope_access(current_setting('test.scope_org')::uuid)),'Failed writes did not add grants');
select pg_temp.assert_ok((select count(*)=2 from public.activity_events where action='scope.access_granted'),'Failed writes not audited as success');
select pg_temp.assert_ok(exists(select 1 from public.activity_events where action='scope.access_granted' and resource_id=current_setting('test.scope_mission')::uuid and subject_user_id=current_setting('test.scope_vendor')::uuid),'Audit identifies beneficiary of mission grant');
select pg_temp.assert_ok(public.set_scope_access(current_setting('test.scope_org')::uuid,current_setting('test.scope_project')::uuid,current_setting('test.scope_member')::uuid,false,1)=2,'Revocation version');
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.scope_member'),'role','authenticated')::text,true);
select pg_temp.assert_ok((select count(*)=0 from public.resource_scopes),'Revocation effective without JWT refresh');
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.scope_owner'),'role','authenticated')::text,true);
select public.set_scope_access(current_setting('test.scope_org')::uuid,current_setting('test.scope_project')::uuid,current_setting('test.scope_member')::uuid,true,2);
select public.manage_membership(current_setting('test.scope_org')::uuid,current_setting('test.scope_member')::uuid,'vendor','active',1);
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.scope_member'),'role','authenticated')::text,true);
select pg_temp.assert_ok((select count(*)=0 from public.resource_scopes),'Role changed to vendor disables old project grant');
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.scope_owner'),'role','authenticated')::text,true);
select public.manage_membership(current_setting('test.scope_org')::uuid,current_setting('test.scope_member')::uuid,'founder_finance','active',2);
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.scope_member'),'role','authenticated')::text,true);
select pg_temp.assert_ok((select count(*)=3 from public.resource_scopes),'Finance global read per matrix');
do $$begin
 begin perform public.create_resource_scope(current_setting('test.scope_org')::uuid,'project','Finance write',null); raise exception 'Finance created scope'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.scope_owner'),'role','authenticated')::text,true);
select public.manage_membership(current_setting('test.scope_org')::uuid,current_setting('test.scope_vendor')::uuid,'vendor','suspended',1);
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.scope_vendor'),'role','authenticated')::text,true);
select pg_temp.assert_ok((select count(*)=0 from public.resource_scopes),'Suspension effective for mission without JWT refresh');
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.scope_owner'),'role','authenticated','is_anonymous',true)::text,true);
select pg_temp.assert_ok((select count(*)=0 from public.resource_scopes),'Anonymous Auth account denied');
do $$begin
 begin perform public.create_resource_scope(current_setting('test.scope_org')::uuid,'project','Anonymous',null); raise exception 'Anonymous created'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{}',true);
select pg_temp.assert_ok((select count(*)=0 from public.resource_scopes),'Missing identity denied');
set local role anon;
do $$begin
 begin select 1 from public.resource_scopes; raise exception 'Anon read table'; exception when insufficient_privilege then null; end;
 begin perform public.create_resource_scope(current_setting('test.scope_org')::uuid,'project','Anon',null); raise exception 'Anon RPC exposed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
-- Relational constraints also apply to trusted imports, independently of RPC.
do $$begin
 begin insert into public.resource_scopes(organization_id,kind,name,parent_project_id) values(current_setting('test.scope_org')::uuid,'mission','Wrong organization',current_setting('test.scope_foreign_project')::uuid); raise exception 'Cross-org FK missing'; exception when foreign_key_violation then null; end;
 begin insert into public.resource_scopes(organization_id,kind,name,parent_project_id) values(current_setting('test.scope_org')::uuid,'mission','Wrong kind',current_setting('test.scope_mission')::uuid); raise exception 'Parent kind FK missing'; exception when foreign_key_violation then null; end;
end $$;
rollback;
select 'Scoped access scenarios passed; fixtures rolled back' as result;
