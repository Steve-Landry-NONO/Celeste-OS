begin;
create function pg_temp.assert_ok(p_ok boolean,p_message text) returns void language plpgsql as $$
begin if p_ok is distinct from true then raise exception '%',p_message; end if; end; $$;
select set_config('test.file_owner',gen_random_uuid()::text,true);
select set_config('test.file_member',gen_random_uuid()::text,true);
select set_config('test.file_vendor',gen_random_uuid()::text,true);
select set_config('test.file_other',gen_random_uuid()::text,true);
insert into auth.users(id,email) select current_setting('test.file_'||x)::uuid,x||'-'||current_setting('test.file_'||x)||'@celeste-test.invalid'
  from unnest(array['owner','member','vendor','other']) x;
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.file_owner'),'role','authenticated')::text,true);
select set_config('test.file_org',public.create_organization('Fichiers A')::text,true);
select public.manage_membership(current_setting('test.file_org')::uuid,current_setting('test.file_member')::uuid,'member','active',0);
select public.manage_membership(current_setting('test.file_org')::uuid,current_setting('test.file_vendor')::uuid,'vendor','active',0);
select set_config('test.file_project',public.create_resource_scope(current_setting('test.file_org')::uuid,'project','Projet fichiers',null)::text,true);
select set_config('test.file_mission',public.create_resource_scope(current_setting('test.file_org')::uuid,'mission','Mission fichiers',current_setting('test.file_project')::uuid)::text,true);
select pg_temp.assert_ok(public.can_write_scope_file(current_setting('test.file_project')::uuid),'Admin has role-based file write');
select public.set_scope_access(current_setting('test.file_org')::uuid,current_setting('test.file_project')::uuid,current_setting('test.file_member')::uuid,true,0);
select public.set_scope_access(current_setting('test.file_org')::uuid,current_setting('test.file_mission')::uuid,current_setting('test.file_vendor')::uuid,true,0);

select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.file_member'),'role','authenticated')::text,true);
select pg_temp.assert_ok(not public.can_write_scope_file(current_setting('test.file_project')::uuid),'Read grant does not imply file write');
do $$begin
  begin perform * from public.reserve_scope_file(current_setting('test.file_org')::uuid,current_setting('test.file_project')::uuid,'lecture.pdf','application/pdf',12,repeat('a',64)); raise exception 'Read-only member reserved upload'; exception when insufficient_privilege then null; end;
  begin insert into public.scope_files(organization_id,scope_id,object_key,file_name,content_type,size_bytes,checksum_sha256,created_by) values(current_setting('test.file_org')::uuid,current_setting('test.file_project')::uuid,'forged','forged.pdf','application/pdf',12,repeat('a',64),auth.uid()); raise exception 'Direct metadata insert permitted'; exception when insufficient_privilege then null; end;
  begin perform public.set_scope_file_write(current_setting('test.file_org')::uuid,current_setting('test.file_project')::uuid,auth.uid(),true,1); raise exception 'Member granted own write'; exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.file_owner'),'role','authenticated')::text,true);
select pg_temp.assert_ok(public.set_scope_file_write(current_setting('test.file_org')::uuid,current_setting('test.file_project')::uuid,current_setting('test.file_member')::uuid,true,1)=2,'Admin grants distinct file write');
select pg_temp.assert_ok(public.set_scope_file_write(current_setting('test.file_org')::uuid,current_setting('test.file_mission')::uuid,current_setting('test.file_vendor')::uuid,true,1)=2,'Vendor may receive mission file write');
do $$begin
  begin perform public.set_scope_file_write(current_setting('test.file_org')::uuid,current_setting('test.file_project')::uuid,current_setting('test.file_member')::uuid,false,1); raise exception 'Stale file write changed'; exception when serialization_failure then null; end;
  begin perform * from public.reserve_scope_file(current_setting('test.file_org')::uuid,current_setting('test.file_project')::uuid,'bad.exe','application/octet-stream',12,repeat('a',64)); raise exception 'Executable reservation accepted'; exception when invalid_parameter_value then null; end;
  begin perform * from public.reserve_scope_file(current_setting('test.file_org')::uuid,current_setting('test.file_project')::uuid,'../bad.pdf','application/pdf',12,repeat('a',64)); raise exception 'Unsafe name accepted'; exception when invalid_parameter_value then null; end;
  begin perform * from public.reserve_scope_file(current_setting('test.file_org')::uuid,current_setting('test.file_project')::uuid,'bad.pdf','application/pdf',0,repeat('a',64)); raise exception 'Empty file accepted'; exception when invalid_parameter_value then null; end;
end $$;

select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.file_member'),'role','authenticated')::text,true);
select pg_temp.assert_ok(public.can_write_scope_file(current_setting('test.file_project')::uuid),'Explicit file write effective');
select set_config('test.file_reservation',(select id::text from public.reserve_scope_file(current_setting('test.file_org')::uuid,current_setting('test.file_project')::uuid,'preuve.pdf','application/pdf',12,repeat('a',64))),true);
select pg_temp.assert_ok((select count(*)=0 from public.scope_files),'Reserved metadata is not published');
select pg_temp.assert_ok(private_celeste.can_insert_storage_object(current_setting('test.file_org')||'/'||current_setting('test.file_project')||'/'||current_setting('test.file_reservation')),'Only reserved object path accepted');
select pg_temp.assert_ok(not private_celeste.can_insert_storage_object('other/path'),'Unknown object path rejected');

select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.file_owner'),'role','authenticated')::text,true);
select pg_temp.assert_ok(public.set_scope_file_write(current_setting('test.file_org')::uuid,current_setting('test.file_project')::uuid,current_setting('test.file_member')::uuid,false,2)=3,'File write revoked');
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.file_member'),'role','authenticated')::text,true);
select pg_temp.assert_ok(not public.can_write_scope_file(current_setting('test.file_project')::uuid),'File write revocation immediate');
select pg_temp.assert_ok(private_celeste.can_cancel_storage_object(current_setting('test.file_org')||'/'||current_setting('test.file_project')||'/'||current_setting('test.file_reservation')),'Uploader may still clean reserved object after revocation');
select public.cancel_scope_file(current_setting('test.file_reservation')::uuid);

select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.file_vendor'),'role','authenticated')::text,true);
select pg_temp.assert_ok(public.can_write_scope_file(current_setting('test.file_mission')::uuid),'Vendor mission file write effective');
select pg_temp.assert_ok(not public.can_write_scope_file(current_setting('test.file_project')::uuid),'Vendor project file write denied');

select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.file_other'),'role','authenticated')::text,true);
select set_config('test.file_foreign_org',public.create_organization('Fichiers B')::text,true);
do $$begin
  begin perform * from public.reserve_scope_file(current_setting('test.file_foreign_org')::uuid,current_setting('test.file_project')::uuid,'cross.pdf','application/pdf',12,repeat('a',64)); raise exception 'Cross-organization reservation accepted'; exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.file_owner'),'role','authenticated','is_anonymous',true)::text,true);
select pg_temp.assert_ok(not public.can_write_scope_file(current_setting('test.file_project')::uuid),'Anonymous Auth denied');
set local role anon;
do $$begin
  begin perform public.can_write_scope_file(current_setting('test.file_project')::uuid); raise exception 'Anon RPC exposed'; exception when insufficient_privilege then null; end;
  begin select 1 from public.scope_files; raise exception 'Anon metadata read'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'Private scope file scenarios passed; fixtures rolled back' as result;
