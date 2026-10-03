-- CE-003: explicit read scopes. No inheritance from a mission to its project,
-- or from a project to its missions. Future writes require separate capabilities.
alter table public.activity_events add column subject_user_id uuid references auth.users(id) on delete set null;
create index activity_events_subject on public.activity_events(subject_user_id) where subject_user_id is not null;
create table public.resource_scopes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  kind text not null check (kind in ('project','mission')),
  name text not null check (char_length(btrim(name)) between 2 and 100),
  parent_project_id uuid,
  parent_kind text generated always as (case when parent_project_id is not null then 'project' end) stored,
  created_at timestamptz not null default now(),
  unique (id,organization_id),
  unique (id,organization_id,kind),
  check ((kind='project' and parent_project_id is null) or (kind='mission' and parent_project_id is not null)),
  foreign key (parent_project_id,organization_id,parent_kind)
    references public.resource_scopes(id,organization_id,kind)
);
create index resource_scopes_org on public.resource_scopes(organization_id);
create index resource_scopes_parent on public.resource_scopes(parent_project_id,organization_id,parent_kind);
create table private_celeste.scope_grants (
  organization_id uuid not null,
  scope_id uuid not null,
  user_id uuid not null,
  granted boolean not null,
  row_version integer not null default 1 check (row_version>0),
  primary key (scope_id,user_id),
  foreign key (scope_id,organization_id) references public.resource_scopes(id,organization_id) on delete cascade,
  foreign key (organization_id,user_id) references public.memberships(organization_id,user_id) on delete cascade
);
create index scope_grants_org_user on private_celeste.scope_grants(organization_id,user_id);
alter table public.resource_scopes enable row level security;
alter table private_celeste.scope_grants enable row level security;
revoke all on public.resource_scopes from public,anon,authenticated;
revoke all on private_celeste.scope_grants from public,anon,authenticated;
grant select on public.resource_scopes to authenticated;
grant all on public.resource_scopes to service_role;
insert into private_celeste.role_permissions(role,capability) values
 ('founder_admin','project.read'),('founder_admin','mission.read'),
 ('founder_finance','project.read'),('founder_finance','mission.read');

create function private_celeste.can_read_scope(p_scope uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null
   and not coalesce((auth.jwt()->>'is_anonymous')::boolean,false)
   and exists (
     select 1 from public.resource_scopes s
     join public.memberships m on m.organization_id=s.organization_id and m.user_id=auth.uid() and m.status='active'
     where s.id=p_scope and (
       exists(select 1 from private_celeste.role_permissions r where r.role=m.role and r.capability=s.kind||'.read')
       or ((m.role<>'vendor' or s.kind='mission') and exists (
         select 1 from private_celeste.scope_grants g
         where g.scope_id=s.id and g.user_id=m.user_id and g.granted
       ))
     )
   );
$$;
revoke all on function private_celeste.can_read_scope(uuid) from public,anon;
grant execute on function private_celeste.can_read_scope(uuid) to authenticated;
create policy scoped_resource_read on public.resource_scopes for select to authenticated
 using (private_celeste.can_read_scope(id));

create function private_celeste.create_resource_scope(p_org uuid,p_kind text,p_name text,p_parent uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 perform 1 from public.organizations where id=p_org for update;
 if not private_celeste.can(p_org,'membership.manage') then
   raise exception 'Permission denied' using errcode='42501';
 end if;
 if p_kind is null or p_kind not in ('project','mission') or p_name is null
   or char_length(btrim(p_name)) not between 2 and 100
   or (p_kind='project' and p_parent is not null)
   or (p_kind='mission' and not exists(select 1 from public.resource_scopes
     where id=p_parent and organization_id=p_org and kind='project')) then
   raise exception 'Invalid scope' using errcode='22023';
 end if;
 insert into public.resource_scopes(organization_id,kind,name,parent_project_id)
 values(p_org,p_kind,btrim(p_name),p_parent) returning id into v_id;
 insert into public.activity_events(organization_id,actor_id,action,resource_id)
 values(p_org,auth.uid(),'scope.created',v_id);
 return v_id;
end;
$$;
create function public.create_resource_scope(p_org uuid,p_kind text,p_name text,p_parent uuid)
returns uuid language sql security invoker set search_path='' as $$
 select private_celeste.create_resource_scope(p_org,p_kind,p_name,p_parent);
$$;

create function private_celeste.set_scope_access(p_org uuid,p_scope uuid,p_user uuid,p_granted boolean,p_expected_version integer)
returns integer language plpgsql security definer set search_path='' as $$
declare v_kind text; v_member public.memberships%rowtype; v_version integer;
begin
 -- Shared organization lock serializes with membership role/status changes.
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
 insert into private_celeste.scope_grants(organization_id,scope_id,user_id,granted,row_version)
 values(p_org,p_scope,p_user,p_granted,1)
 on conflict (scope_id,user_id) do update set granted=excluded.granted,row_version=scope_grants.row_version+1
 returning row_version into v_version;
 insert into public.activity_events(organization_id,actor_id,action,resource_id,subject_user_id)
 values(p_org,auth.uid(),case when p_granted then 'scope.access_granted' else 'scope.access_revoked' end,p_scope,p_user);
 return v_version;
end;
$$;
create function public.set_scope_access(p_org uuid,p_scope uuid,p_user uuid,p_granted boolean,p_expected_version integer)
returns integer language sql security invoker set search_path='' as $$
 select private_celeste.set_scope_access(p_org,p_scope,p_user,p_granted,p_expected_version);
$$;
create function private_celeste.list_scope_access(p_org uuid)
returns table(scope_id uuid,user_id uuid,granted boolean,row_version integer)
language plpgsql stable security definer set search_path='' as $$
begin
 if not private_celeste.can(p_org,'membership.manage') then
   raise exception 'Permission denied' using errcode='42501';
 end if;
 return query select g.scope_id,g.user_id,g.granted,g.row_version from private_celeste.scope_grants g where g.organization_id=p_org;
end;
$$;
create function public.list_scope_access(p_org uuid)
returns table(scope_id uuid,user_id uuid,granted boolean,row_version integer)
language sql stable security invoker set search_path='' as $$ select * from private_celeste.list_scope_access(p_org); $$;
revoke all on function private_celeste.create_resource_scope(uuid,text,text,uuid),public.create_resource_scope(uuid,text,text,uuid),
 private_celeste.set_scope_access(uuid,uuid,uuid,boolean,integer),public.set_scope_access(uuid,uuid,uuid,boolean,integer),
 private_celeste.list_scope_access(uuid),public.list_scope_access(uuid) from public,anon;
grant execute on function private_celeste.create_resource_scope(uuid,text,text,uuid),public.create_resource_scope(uuid,text,text,uuid),
 private_celeste.set_scope_access(uuid,uuid,uuid,boolean,integer),public.set_scope_access(uuid,uuid,uuid,boolean,integer),
 private_celeste.list_scope_access(uuid),public.list_scope_access(uuid) to authenticated;
