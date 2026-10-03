-- CE-003: private files attached to an existing project or mission.
-- Reading a scope never grants upload rights; write access is explicit.
alter table private_celeste.scope_grants
  add column file_write boolean not null default false;

insert into private_celeste.role_permissions(role,capability)
values ('founder_admin','file.write');

create function private_celeste.can_write_scope_file_for(p_scope uuid,p_user uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select p_user is not null and exists (
      select 1
      from public.resource_scopes s
      join public.memberships m
        on m.organization_id=s.organization_id
       and m.user_id=p_user
       and m.status='active'
      where s.id=p_scope
        and (
          exists (
            select 1 from private_celeste.role_permissions r
            where r.role=m.role and r.capability='file.write'
          )
          or (
            (m.role<>'vendor' or s.kind='mission')
            and exists (
              select 1 from private_celeste.scope_grants g
              where g.scope_id=s.id
                and g.user_id=m.user_id
                and g.granted
                and g.file_write
            )
          )
        )
    );
$$;
revoke all on function private_celeste.can_write_scope_file_for(uuid,uuid) from public,anon,authenticated;

create function private_celeste.can_write_scope_file(p_scope uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select (select auth.uid()) is not null
    and not coalesce(((select auth.jwt())->>'is_anonymous')::boolean,false)
    and private_celeste.can_write_scope_file_for(p_scope,(select auth.uid()));
$$;
revoke all on function private_celeste.can_write_scope_file(uuid) from public,anon;
grant execute on function private_celeste.can_write_scope_file(uuid) to authenticated;

create table public.scope_files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  scope_id uuid not null,
  object_key text not null unique,
  file_name text not null check (
    char_length(file_name) between 1 and 160
    and file_name !~ '[[:cntrl:]]'
    and position('/' in file_name)=0
    and position(E'\\' in file_name)=0
  ),
  content_type text not null,
  size_bytes bigint not null check (size_bytes between 1 and 20971520),
  checksum_sha256 text not null check (checksum_sha256 ~ '^[0-9a-f]{64}$'),
  status text not null default 'reserved' check (status in ('reserved','ready')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  finalized_at timestamptz,
  unique (id,organization_id),
  foreign key (scope_id,organization_id)
    references public.resource_scopes(id,organization_id) on delete cascade,
  check ((status='reserved' and finalized_at is null) or (status='ready' and finalized_at is not null))
);
create index scope_files_scope_ready on public.scope_files(scope_id,created_at) where status='ready';
create index scope_files_reserved on public.scope_files(created_at) where status='reserved';
alter table public.scope_files enable row level security;
revoke all on public.scope_files from public,anon,authenticated;
grant select on public.scope_files to authenticated;
grant all on public.scope_files to service_role;
create policy scope_files_read on public.scope_files for select to authenticated
  using (status='ready' and private_celeste.can_read_scope(scope_id));

create function private_celeste.can_read_storage_object(p_name text) returns boolean
language sql stable security definer set search_path='' as $$
  select exists (
    select 1 from public.scope_files f
    where f.object_key=p_name
      and f.status='ready'
      and private_celeste.can_read_scope(f.scope_id)
  );
$$;
revoke all on function private_celeste.can_read_storage_object(text) from public,anon;
grant execute on function private_celeste.can_read_storage_object(text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values (
  'celeste-private',
  'celeste-private',
  false,
  20971520,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/markdown',
    'text/plain',
    'image/png',
    'image/jpeg'
  ]
)
on conflict (id) do update set
  public=false,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

create policy celeste_private_read on storage.objects for select to authenticated
  using (
    bucket_id='celeste-private'
    and private_celeste.can_read_storage_object(name)
  );
create function private_celeste.reserve_scope_file(
  p_org uuid,
  p_scope uuid,
  p_file_name text,
  p_content_type text,
  p_size_bytes bigint,
  p_checksum_sha256 text
) returns table(id uuid,object_key text)
language plpgsql security definer set search_path='' as $$
declare v_id uuid:=gen_random_uuid(); v_name text:=btrim(p_file_name);
begin
  if not private_celeste.can_write_scope_file(p_scope) then
    raise exception 'Permission denied' using errcode='42501';
  end if;
  if not exists(select 1 from public.resource_scopes s where s.id=p_scope and s.organization_id=p_org)
    or v_name is null or char_length(v_name) not between 1 and 160
    or v_name ~ '[[:cntrl:]]' or position('/' in v_name)>0 or position(E'\\' in v_name)>0
    or p_content_type is null or p_content_type<>all(array[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/markdown','text/plain','image/png','image/jpeg'
    ])
    or p_size_bytes is null or p_size_bytes not between 1 and 20971520
    or p_checksum_sha256 is null or p_checksum_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid file' using errcode='22023';
  end if;
  insert into public.scope_files(
    id,organization_id,scope_id,object_key,file_name,content_type,size_bytes,checksum_sha256,created_by
  ) values (
    v_id,p_org,p_scope,p_org::text||'/'||p_scope::text||'/'||v_id::text,
    v_name,p_content_type,p_size_bytes,p_checksum_sha256,(select auth.uid())
  );
  insert into public.activity_events(organization_id,actor_id,action,resource_id)
  values(p_org,(select auth.uid()),'scope_file.reserved',v_id);
  return query select v_id,p_org::text||'/'||p_scope::text||'/'||v_id::text;
end;
$$;

create function private_celeste.finalize_scope_file(p_file uuid,p_actor uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_org uuid; v_file public.scope_files%rowtype; v_object storage.objects%rowtype;
begin
  -- Opaque sb_secret keys select the service_role database role without
  -- necessarily exposing a JWT payload to auth.jwt(). Check the effective
  -- PostgREST role so both current secret keys and legacy service JWTs work.
  if coalesce(current_setting('role',true),'')<>'service_role' then
    raise exception 'Permission denied' using errcode='42501';
  end if;
  select organization_id into v_org from public.scope_files where id=p_file;
  perform 1 from public.organizations where id=v_org for update;
  select * into v_file from public.scope_files where id=p_file for update;
  if v_file.id is null or v_file.created_by<>p_actor then
    raise exception 'Permission denied' using errcode='42501';
  end if;
  if v_file.status='ready' then return v_file.id; end if;
  if not private_celeste.can_write_scope_file_for(v_file.scope_id,p_actor) then
    raise exception 'Permission denied' using errcode='42501';
  end if;
  select * into v_object from storage.objects
    where bucket_id='celeste-private' and name=v_file.object_key;
  if v_object.id is null
    or coalesce((v_object.metadata->>'size')::bigint,-1)<>v_file.size_bytes
    or coalesce(v_object.metadata->>'mimetype','')<>v_file.content_type then
    raise exception 'Uploaded object does not match reservation' using errcode='22023';
  end if;
  update public.scope_files set status='ready',finalized_at=now() where id=v_file.id;
  insert into public.activity_events(organization_id,actor_id,action,resource_id)
  values(v_file.organization_id,p_actor,'scope_file.ready',v_file.id);
  return v_file.id;
end;
$$;

create function private_celeste.cancel_scope_file(p_file uuid) returns void
language plpgsql security definer set search_path='' as $$
declare v_file public.scope_files%rowtype;
begin
  select * into v_file from public.scope_files where id=p_file for update;
  if v_file.id is null then return; end if;
  if v_file.created_by<>(select auth.uid()) or v_file.status<>'reserved' then
    raise exception 'Permission denied' using errcode='42501';
  end if;
  if exists(select 1 from storage.objects where bucket_id='celeste-private' and name=v_file.object_key) then
    raise exception 'Remove stored object first' using errcode='55000';
  end if;
  delete from public.scope_files where id=v_file.id;
end;
$$;

create function private_celeste.set_scope_file_write(
  p_org uuid,p_scope uuid,p_user uuid,p_allowed boolean,p_expected_version integer
) returns integer
language plpgsql security definer set search_path='' as $$
declare v_kind text; v_member public.memberships%rowtype; v_grant private_celeste.scope_grants%rowtype; v_version integer;
begin
  perform 1 from public.organizations where id=p_org for update;
  if not private_celeste.can(p_org,'membership.manage') then
    raise exception 'Permission denied' using errcode='42501';
  end if;
  select kind into v_kind from public.resource_scopes where id=p_scope and organization_id=p_org;
  select * into v_member from public.memberships where organization_id=p_org and user_id=p_user;
  select * into v_grant from private_celeste.scope_grants where scope_id=p_scope and user_id=p_user;
  if v_kind is null or v_member.id is null or v_member.status<>'active'
    or (v_member.role='vendor' and v_kind<>'mission')
    or v_grant.scope_id is null or not v_grant.granted
    or p_allowed is null or p_expected_version is null or p_expected_version<1 then
    raise exception 'Invalid file access' using errcode='22023';
  end if;
  if v_grant.row_version<>p_expected_version then
    raise exception 'Scope access changed; reload' using errcode='40001';
  end if;
  update private_celeste.scope_grants
    set file_write=p_allowed,row_version=row_version+1
    where scope_id=p_scope and user_id=p_user
    returning row_version into v_version;
  insert into public.activity_events(organization_id,actor_id,action,resource_id,subject_user_id)
  values(p_org,(select auth.uid()),case when p_allowed then 'scope.file_write_granted' else 'scope.file_write_revoked' end,p_scope,p_user);
  return v_version;
end;
$$;

create or replace function private_celeste.set_scope_access(
  p_org uuid,p_scope uuid,p_user uuid,p_granted boolean,p_expected_version integer
) returns integer language plpgsql security definer set search_path='' as $$
declare v_kind text; v_member public.memberships%rowtype; v_version integer;
begin
  perform 1 from public.organizations where id=p_org for update;
  if not private_celeste.can(p_org,'membership.manage') then
    raise exception 'Permission denied' using errcode='42501';
  end if;
  select kind into v_kind from public.resource_scopes where id=p_scope and organization_id=p_org;
  select * into v_member from public.memberships where organization_id=p_org and user_id=p_user;
  if v_kind is null or v_member.id is null or p_granted is null or p_expected_version is null or p_expected_version<0
    or (p_granted and (v_member.status<>'active' or (v_member.role='vendor' and v_kind<>'mission'))) then
    raise exception 'Invalid scope access' using errcode='22023';
  end if;
  select row_version into v_version from private_celeste.scope_grants where scope_id=p_scope and user_id=p_user;
  if coalesce(v_version,0)<>p_expected_version then
    raise exception 'Scope access changed; reload' using errcode='40001';
  end if;
  insert into private_celeste.scope_grants(organization_id,scope_id,user_id,granted,file_write,row_version)
  values(p_org,p_scope,p_user,p_granted,false,1)
  on conflict (scope_id,user_id) do update set
    granted=excluded.granted,
    file_write=case when excluded.granted then scope_grants.file_write else false end,
    row_version=scope_grants.row_version+1
  returning row_version into v_version;
  insert into public.activity_events(organization_id,actor_id,action,resource_id,subject_user_id)
  values(p_org,(select auth.uid()),case when p_granted then 'scope.access_granted' else 'scope.access_revoked' end,p_scope,p_user);
  return v_version;
end;
$$;

drop function public.list_scope_access(uuid);
drop function private_celeste.list_scope_access(uuid);
create function private_celeste.list_scope_access(p_org uuid)
returns table(scope_id uuid,user_id uuid,granted boolean,file_write boolean,row_version integer)
language plpgsql stable security definer set search_path='' as $$
begin
  if not private_celeste.can(p_org,'membership.manage') then
    raise exception 'Permission denied' using errcode='42501';
  end if;
  return query
    select g.scope_id,g.user_id,g.granted,g.file_write,g.row_version
    from private_celeste.scope_grants g where g.organization_id=p_org;
end;
$$;

create function public.reserve_scope_file(
  p_org uuid,p_scope uuid,p_file_name text,p_content_type text,p_size_bytes bigint,p_checksum_sha256 text
) returns table(id uuid,object_key text)
language sql security invoker set search_path='' as $$
  select * from private_celeste.reserve_scope_file(p_org,p_scope,p_file_name,p_content_type,p_size_bytes,p_checksum_sha256);
$$;
create function public.finalize_scope_file(p_file uuid,p_actor uuid) returns uuid
language sql security invoker set search_path='' as $$ select private_celeste.finalize_scope_file(p_file,p_actor); $$;
create function public.cancel_scope_file(p_file uuid) returns void
language sql security invoker set search_path='' as $$ select private_celeste.cancel_scope_file(p_file); $$;
create function public.set_scope_file_write(
  p_org uuid,p_scope uuid,p_user uuid,p_allowed boolean,p_expected_version integer
) returns integer
language sql security invoker set search_path='' as $$
  select private_celeste.set_scope_file_write(p_org,p_scope,p_user,p_allowed,p_expected_version);
$$;
create function public.can_write_scope_file(p_scope uuid) returns boolean
language sql stable security invoker set search_path='' as $$
  select private_celeste.can_write_scope_file(p_scope);
$$;
create function public.list_scope_access(p_org uuid)
returns table(scope_id uuid,user_id uuid,granted boolean,file_write boolean,row_version integer)
language sql stable security invoker set search_path='' as $$
  select * from private_celeste.list_scope_access(p_org);
$$;

revoke all on function
  private_celeste.reserve_scope_file(uuid,uuid,text,text,bigint,text),
  private_celeste.finalize_scope_file(uuid,uuid),
  private_celeste.cancel_scope_file(uuid),
  private_celeste.set_scope_file_write(uuid,uuid,uuid,boolean,integer),
  private_celeste.list_scope_access(uuid),
  public.reserve_scope_file(uuid,uuid,text,text,bigint,text),
  public.finalize_scope_file(uuid,uuid),
  public.cancel_scope_file(uuid),
  public.set_scope_file_write(uuid,uuid,uuid,boolean,integer),
  public.can_write_scope_file(uuid),
  public.list_scope_access(uuid)
from public,anon,authenticated;
grant execute on function
  private_celeste.reserve_scope_file(uuid,uuid,text,text,bigint,text),
  private_celeste.cancel_scope_file(uuid),
  private_celeste.set_scope_file_write(uuid,uuid,uuid,boolean,integer),
  private_celeste.list_scope_access(uuid),
  public.reserve_scope_file(uuid,uuid,text,text,bigint,text),
  public.cancel_scope_file(uuid),
  public.set_scope_file_write(uuid,uuid,uuid,boolean,integer),
  public.can_write_scope_file(uuid),
  public.list_scope_access(uuid)
to authenticated;
grant execute on function
  private_celeste.finalize_scope_file(uuid,uuid),
  public.finalize_scope_file(uuid,uuid)
to service_role;
