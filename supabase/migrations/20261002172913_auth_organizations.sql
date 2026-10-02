-- CE-002/003: identities, organizations and server-controlled membership permissions.
create schema if not exists private_celeste;
revoke all on schema private_celeste from public, anon, authenticated;
grant usage on schema private_celeste to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Membre' check (char_length(display_name) between 1 and 100),
  created_at timestamptz not null default now()
);
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 100),
  timezone text not null default 'Europe/Paris',
  base_currency text not null default 'EUR' check (base_currency = 'EUR'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create unique index organizations_creator_name on public.organizations(created_by, lower(btrim(name)));
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('founder_admin','founder_finance','member','support','vendor')),
  status text not null default 'active' check (status in ('active','suspended')),
  row_version integer not null default 1 check (row_version > 0),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index memberships_user_org_active on public.memberships(user_id,organization_id) where status='active';
create table private_celeste.role_permissions (
  role text not null,
  capability text not null,
  primary key (role,capability)
);
insert into private_celeste.role_permissions(role,capability) values
  ('founder_admin','organization.manage'),('founder_admin','membership.manage'),
  ('founder_admin','audit.read'),('founder_admin','finance.read'),('founder_admin','finance.confirm'),
  ('founder_finance','finance.read'),('founder_finance','finance.confirm');
create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid not null references auth.users(id),
  action text not null,
  resource_id uuid not null,
  occurred_at timestamptz not null default now()
);
create index activity_events_org_date on public.activity_events(organization_id,occurred_at desc);

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.activity_events enable row level security;
alter table private_celeste.role_permissions enable row level security;
revoke all on public.profiles,public.organizations,public.memberships,public.activity_events from anon,authenticated;
grant select on public.profiles,public.organizations,public.memberships,public.activity_events to authenticated;
grant update(display_name) on public.profiles to authenticated;
grant update(name) on public.organizations to authenticated;

-- Private DEFINER helpers avoid recursive membership RLS. They expose only booleans,
-- always bind the actor to auth.uid(), and never trust editable user_metadata.
create function private_celeste.is_member(p_org uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select (select auth.uid()) is not null
    and not coalesce(((select auth.jwt())->>'is_anonymous')::boolean,false)
    and exists(select 1 from public.memberships m where m.organization_id=p_org
      and m.user_id=(select auth.uid()) and m.status='active');
$$;
create function private_celeste.can(p_org uuid,p_capability text) returns boolean
language sql stable security definer set search_path='' as $$
  select (select auth.uid()) is not null
    and not coalesce(((select auth.jwt())->>'is_anonymous')::boolean,false)
    and exists(select 1 from public.memberships m join private_celeste.role_permissions r on r.role=m.role
      where m.organization_id=p_org and m.user_id=(select auth.uid())
      and m.status='active' and r.capability=p_capability);
$$;
revoke all on function private_celeste.is_member(uuid),private_celeste.can(uuid,text) from public,anon;
grant execute on function private_celeste.is_member(uuid),private_celeste.can(uuid,text) to authenticated;

create policy own_profile_read on public.profiles for select to authenticated
  using (id=(select auth.uid()));
create policy own_profile_update on public.profiles for update to authenticated
  using (id=(select auth.uid())) with check (id=(select auth.uid()));
create policy organization_member_read on public.organizations for select to authenticated
  using (private_celeste.is_member(id));
create policy organization_admin_update on public.organizations for update to authenticated
  using (private_celeste.can(id,'organization.manage')) with check (private_celeste.can(id,'organization.manage'));
create policy own_or_admin_membership_read on public.memberships for select to authenticated
  using ((user_id=(select auth.uid()) and private_celeste.is_member(organization_id))
    or private_celeste.can(organization_id,'membership.manage'));
create policy admin_audit_read on public.activity_events for select to authenticated
  using (private_celeste.can(organization_id,'audit.read'));

create function private_celeste.handle_new_user() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  insert into public.profiles(id,display_name) values(new.id,
    left(coalesce(nullif(btrim(new.raw_user_meta_data->>'display_name'),''),'Membre'),100));
  return new;
end;
$$;
revoke all on function private_celeste.handle_new_user() from public,anon,authenticated;
create trigger celeste_profile_after_signup after insert on auth.users
  for each row execute function private_celeste.handle_new_user();

create function private_celeste.create_organization(p_name text) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_actor uuid := auth.uid(); v_org uuid;
begin
  if v_actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
    raise exception 'Authentication required' using errcode='42501';
  end if;
  if p_name is null or char_length(btrim(p_name)) not between 2 and 100 then
    raise exception 'Invalid organization name' using errcode='22023';
  end if;
  insert into public.organizations(name,created_by) values(btrim(p_name),v_actor) returning id into v_org;
  insert into public.memberships(organization_id,user_id,role) values(v_org,v_actor,'founder_admin');
  insert into public.activity_events(organization_id,actor_id,action,resource_id)
    values(v_org,v_actor,'organization.created',v_org);
  return v_org;
end;
$$;
create function public.create_organization(p_name text) returns uuid
language sql security invoker set search_path='' as $$ select private_celeste.create_organization(p_name); $$;

-- Only an existing administrator can assign roles. Lock the organization to
-- serialize changes, require optimistic versioning and preserve the last admin.
create function private_celeste.manage_membership(p_org uuid,p_user uuid,p_role text,p_status text,p_expected_version integer)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_actor uuid := auth.uid(); v_existing public.memberships%rowtype; v_id uuid;
begin
  if v_actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
    raise exception 'Authentication required' using errcode='42501';
  end if;
  perform 1 from public.organizations where id=p_org for update;
  if not private_celeste.can(p_org,'membership.manage') then
    raise exception 'Permission denied' using errcode='42501';
  end if;
  if p_user is null or p_role is null or p_status is null
    or p_role not in ('founder_admin','founder_finance','member','support','vendor')
    or p_status not in ('active','suspended') or p_expected_version is null then
    raise exception 'Invalid membership' using errcode='22023';
  end if;
  select * into v_existing from public.memberships where organization_id=p_org and user_id=p_user;
  if found then
    if v_existing.row_version<>p_expected_version then
      raise exception 'Membership changed; reload' using errcode='40001';
    end if;
    if v_existing.role='founder_admin' and v_existing.status='active'
      and (p_role<>'founder_admin' or p_status<>'active')
      and (select count(*) from public.memberships where organization_id=p_org and role='founder_admin' and status='active')=1 then
      raise exception 'Last administrator must remain active' using errcode='22023';
    end if;
    update public.memberships set role=p_role,status=p_status,row_version=row_version+1
      where id=v_existing.id returning id into v_id;
  else
    if p_expected_version<>0 then raise exception 'Membership changed; reload' using errcode='40001'; end if;
    insert into public.memberships(organization_id,user_id,role,status)
      values(p_org,p_user,p_role,p_status) returning id into v_id;
  end if;
  insert into public.activity_events(organization_id,actor_id,action,resource_id)
    values(p_org,v_actor,'membership.changed',v_id);
  return v_id;
end;
$$;
create function public.manage_membership(p_org uuid,p_user uuid,p_role text,p_status text,p_expected_version integer)
returns uuid language sql security invoker set search_path='' as $$
  select private_celeste.manage_membership(p_org,p_user,p_role,p_status,p_expected_version);
$$;
revoke all on function private_celeste.create_organization(text),public.create_organization(text),
  private_celeste.manage_membership(uuid,uuid,text,text,integer),public.manage_membership(uuid,uuid,text,text,integer) from public,anon;
grant execute on function private_celeste.create_organization(text),public.create_organization(text),
  private_celeste.manage_membership(uuid,uuid,text,text,integer),public.manage_membership(uuid,uuid,text,text,integer) to authenticated;
