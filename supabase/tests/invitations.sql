-- Run on migrated DB. All fixtures and writes are rolled back, including Auth.
begin;
select set_config('test.inv_owner',gen_random_uuid()::text,true);
select set_config('test.inv_target',gen_random_uuid()::text,true);
select set_config('test.inv_other',gen_random_uuid()::text,true);
select set_config('test.inv_unconfirmed',gen_random_uuid()::text,true);
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
 (current_setting('test.inv_owner')::uuid,'owner-'||current_setting('test.inv_owner')||'@celeste-test.invalid',now(),'{}'),
 (current_setting('test.inv_target')::uuid,'target-'||current_setting('test.inv_target')||'@celeste-test.invalid',now(),'{"role":"founder_admin"}'),
 (current_setting('test.inv_other')::uuid,'other-'||current_setting('test.inv_other')||'@celeste-test.invalid',now(),'{}'),
 (current_setting('test.inv_unconfirmed')::uuid,'unconfirmed-'||current_setting('test.inv_unconfirmed')||'@celeste-test.invalid',null,'{}');
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.inv_owner'),'role','authenticated')::text,true);
select set_config('test.inv_org',public.create_organization('Invitations A')::text,true);
select set_config('test.inv_id',id::text,true),set_config('test.inv_token',token,true)
 from public.create_invitation(current_setting('test.inv_org')::uuid,' TARGET-'||current_setting('test.inv_target')||'@CELESTE-TEST.INVALID ','vendor');
do $$begin
  if current_setting('test.inv_token') !~ '^[a-f0-9]{64}$' then raise exception 'Token entropy/format'; end if;
  if (select status from public.list_invitations(current_setting('test.inv_org')::uuid))<>'pending' then raise exception 'Pending status'; end if;
  begin perform * from public.create_invitation(current_setting('test.inv_org')::uuid,'target-'||current_setting('test.inv_target')||'@celeste-test.invalid','member'); raise exception 'Duplicate pending';
  exception when unique_violation then null; end;
  begin perform * from public.create_invitation(current_setting('test.inv_org')::uuid,'bad email','vendor'); raise exception 'Bad email'; exception when invalid_parameter_value then null; end;
  begin perform * from public.create_invitation(current_setting('test.inv_org')::uuid,'a@b.invalid','root'); raise exception 'Bad role'; exception when invalid_parameter_value then null; end;
  begin perform * from public.create_invitation(current_setting('test.inv_org')::uuid,'a@b.invalid',null); raise exception 'Null role'; exception when invalid_parameter_value then null; end;
  begin perform * from private_celeste.organization_invitations; raise exception 'Private table readable'; exception when insufficient_privilege then null; end;
  begin update private_celeste.organization_invitations set role='founder_admin'; raise exception 'Private table writable'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.inv_other'),'role','authenticated')::text,true);
select set_config('test.inv_foreign',public.create_organization('Invitations B')::text,true);
do $$begin
  begin perform public.accept_invitation(current_setting('test.inv_token')); raise exception 'Wrong recipient'; exception when invalid_parameter_value then null; end;
  begin perform * from public.list_invitations(current_setting('test.inv_org')::uuid); raise exception 'Foreign admin reads'; exception when insufficient_privilege then null; end;
  begin perform * from private_celeste.list_invitations(current_setting('test.inv_org')::uuid); raise exception 'Helper bypass'; exception when insufficient_privilege then null; end;
  begin perform * from public.create_invitation(current_setting('test.inv_org')::uuid,'a@b.invalid','member'); raise exception 'Foreign admin creates'; exception when insufficient_privilege then null; end;
  begin perform public.revoke_invitation(current_setting('test.inv_org')::uuid,current_setting('test.inv_id')::uuid); raise exception 'Foreign admin revokes'; exception when insufficient_privilege then null; end;
  begin perform public.revoke_invitation(current_setting('test.inv_foreign')::uuid,current_setting('test.inv_id')::uuid); raise exception 'Cross-org id'; exception when invalid_parameter_value then null; end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.inv_target'),'role','authenticated')::text,true);
do $$begin
  if public.accept_invitation(current_setting('test.inv_token'))<>current_setting('test.inv_org')::uuid then raise exception 'Accepted wrong org'; end if;
  if not exists(select 1 from public.memberships where organization_id=current_setting('test.inv_org')::uuid and user_id=auth.uid() and role='vendor') then raise exception 'Invited role lost'; end if;
  begin perform public.accept_invitation(current_setting('test.inv_token')); raise exception 'Replay accepted'; exception when invalid_parameter_value then null; end;
  begin perform public.accept_invitation(repeat('a',64)); raise exception 'Unknown token'; exception when invalid_parameter_value then null; end;
  begin perform public.accept_invitation('invalid'); raise exception 'Malformed token'; exception when invalid_parameter_value then null; end;
  begin perform * from public.list_invitations(current_setting('test.inv_org')::uuid); raise exception 'Member read invites'; exception when insufficient_privilege then null; end;
  begin perform * from public.create_invitation(current_setting('test.inv_org')::uuid,'a@b.invalid','founder_admin'); raise exception 'Member invites admin'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.inv_owner'),'role','authenticated')::text,true);
do $$begin
  if (select status from public.list_invitations(current_setting('test.inv_org')::uuid))<>'accepted' then raise exception 'Missing acceptance'; end if;
  if (select count(*) from public.activity_events where organization_id=current_setting('test.inv_org')::uuid and action like 'invitation.%')<>2 then raise exception 'Failed attempts wrote audit'; end if;
end $$;
-- Existing active member consumes the invitation without role change or duplicate.
select set_config('test.inv_upgrade',token,true) from public.create_invitation(current_setting('test.inv_org')::uuid,'target-'||current_setting('test.inv_target')||'@celeste-test.invalid','founder_admin');
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.inv_target'),'role','authenticated')::text,true);
select public.accept_invitation(current_setting('test.inv_upgrade'));
do $$begin
  if (select count(*) from public.memberships where organization_id=current_setting('test.inv_org')::uuid and user_id=auth.uid())<>1 then raise exception 'Duplicate member'; end if;
  if (select role from public.memberships where organization_id=current_setting('test.inv_org')::uuid and user_id=auth.uid())<>'vendor' then raise exception 'Invitation upgraded existing member'; end if;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.inv_owner'),'role','authenticated')::text,true);
select public.manage_membership(current_setting('test.inv_org')::uuid,current_setting('test.inv_target')::uuid,'vendor','suspended',1);
select set_config('test.inv_suspended',token,true) from public.create_invitation(current_setting('test.inv_org')::uuid,'target-'||current_setting('test.inv_target')||'@celeste-test.invalid','founder_admin');
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.inv_target'),'role','authenticated')::text,true);
do $$begin
  begin perform public.accept_invitation(current_setting('test.inv_suspended')); raise exception 'Suspension bypassed'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.inv_owner'),'role','authenticated')::text,true);
select set_config('test.inv_revoked_id',id::text,true),set_config('test.inv_revoked',token,true)
 from public.create_invitation(current_setting('test.inv_org')::uuid,'other-'||current_setting('test.inv_other')||'@celeste-test.invalid','member');
select public.revoke_invitation(current_setting('test.inv_org')::uuid,current_setting('test.inv_revoked_id')::uuid);
select set_config('test.inv_expired_id',id::text,true),set_config('test.inv_expired',token,true)
 from public.create_invitation(current_setting('test.inv_org')::uuid,'other-'||current_setting('test.inv_other')||'@celeste-test.invalid','member');
select set_config('test.inv_unconfirmed_token',token,true) from public.create_invitation(current_setting('test.inv_org')::uuid,'unconfirmed-'||current_setting('test.inv_unconfirmed')||'@celeste-test.invalid','member');
reset role;
update private_celeste.organization_invitations set created_at=now()-interval '8 days',expires_at=now()-interval '1 day' where id=current_setting('test.inv_expired_id')::uuid;
do $$begin
  if exists(select 1 from private_celeste.organization_invitations where token_hash=convert_to(current_setting('test.inv_token'),'UTF8')) then raise exception 'Plain token stored'; end if;
  if not exists(select 1 from private_celeste.organization_invitations where token_hash=extensions.digest(current_setting('test.inv_token'),'sha256')) then raise exception 'Hash missing'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.inv_other'),'role','authenticated')::text,true);
do $$begin
  begin perform public.accept_invitation(current_setting('test.inv_revoked')); raise exception 'Revoked accepted'; exception when invalid_parameter_value then null; end;
  begin perform public.accept_invitation(current_setting('test.inv_expired')); raise exception 'Expired accepted'; exception when invalid_parameter_value then null; end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.inv_unconfirmed'),'role','authenticated','email','unconfirmed-'||current_setting('test.inv_unconfirmed')||'@celeste-test.invalid','user_metadata',json_build_object('email_confirmed',true))::text,true);
do $$begin
  begin perform public.accept_invitation(current_setting('test.inv_unconfirmed_token')); raise exception 'Unconfirmed accepted'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.inv_owner'),'role','authenticated')::text,true);
select set_config('test.inv_issuer',token,true) from public.create_invitation(current_setting('test.inv_org')::uuid,'other-'||current_setting('test.inv_other')||'@celeste-test.invalid','support');
select public.manage_membership(current_setting('test.inv_org')::uuid,current_setting('test.inv_unconfirmed')::uuid,'founder_admin','active',0);
select public.manage_membership(current_setting('test.inv_org')::uuid,current_setting('test.inv_owner')::uuid,'member','active',1);
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.inv_other'),'role','authenticated')::text,true);
do $$begin
  begin perform public.accept_invitation(current_setting('test.inv_issuer')); raise exception 'Former issuer privileges survived'; exception when invalid_parameter_value then null; end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.inv_target'),'role','authenticated','is_anonymous',true)::text,true);
do $$begin
  begin perform public.accept_invitation(current_setting('test.inv_suspended')); raise exception 'Anonymous Auth accepted'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{}',true);
do $$begin
  begin perform public.accept_invitation(current_setting('test.inv_suspended')); raise exception 'Missing identity'; exception when insufficient_privilege then null; end;
end $$;
set local role anon;
do $$begin
  begin perform public.accept_invitation(repeat('a',64)); raise exception 'Anon execute'; exception when insufficient_privilege then null; end;
  begin perform * from public.list_invitations(null); raise exception 'Anon listing'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'Invitation lifecycle and authorization passed; fixtures rolled back' as result;
