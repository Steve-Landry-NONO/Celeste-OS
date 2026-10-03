-- CE-003: invitations are private, single-use and bound to verified Auth email.
create table private_celeste.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null check (char_length(email) between 3 and 254),
  role text not null check (role in ('founder_admin','founder_finance','member','support','vendor')),
  token_hash bytea not null unique,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now()+interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id),
  revoked_at timestamptz,
  check (expires_at>created_at),
  check ((accepted_at is null)=(accepted_by is null)),
  check (accepted_at is null or revoked_at is null)
);
create unique index invitation_pending_email on private_celeste.organization_invitations(organization_id,email)
  where accepted_at is null and revoked_at is null;
create index invitations_created_by on private_celeste.organization_invitations(created_by);
create index invitations_accepted_by on private_celeste.organization_invitations(accepted_by);
alter table private_celeste.organization_invitations enable row level security;
revoke all on private_celeste.organization_invitations from public,anon,authenticated;

create function private_celeste.create_invitation(p_org uuid,p_email text,p_role text)
returns table(id uuid,token text) language plpgsql security definer set search_path='' as $$
declare v_email text:=lower(btrim(p_email)); v_token text; v_id uuid;
begin
  perform 1 from public.organizations where organizations.id=p_org for update;
  if not private_celeste.can(p_org,'membership.manage') then
    raise exception 'Permission denied' using errcode='42501';
  end if;
  if v_email is null or char_length(v_email)>254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or p_role is null or p_role not in ('founder_admin','founder_finance','member','support','vendor') then
    raise exception 'Invalid invitation' using errcode='22023';
  end if;
  -- Retire expired entries before enforcing one pending invitation per email.
  update private_celeste.organization_invitations i set revoked_at=now()
    where i.organization_id=p_org and i.email=v_email and i.accepted_at is null
      and i.revoked_at is null and i.expires_at<=now();
  if exists(select 1 from private_celeste.organization_invitations i where i.organization_id=p_org
    and i.email=v_email and i.accepted_at is null and i.revoked_at is null) then
    raise exception 'Invitation already pending' using errcode='23505';
  end if;
  if (select count(*) from private_celeste.organization_invitations i where i.organization_id=p_org
    and i.accepted_at is null and i.revoked_at is null and i.expires_at>now())>=100 then
    raise exception 'Too many pending invitations' using errcode='22023';
  end if;
  v_token:=encode(extensions.gen_random_bytes(32),'hex');
  insert into private_celeste.organization_invitations(organization_id,email,role,token_hash,created_by)
    values(p_org,v_email,p_role,extensions.digest(v_token,'sha256'),auth.uid()) returning organization_invitations.id into v_id;
  insert into public.activity_events(organization_id,actor_id,action,resource_id)
    values(p_org,auth.uid(),'invitation.created',v_id);
  return query select v_id,v_token;
end;
$$;

create function private_celeste.list_invitations(p_org uuid)
returns table(id uuid,email text,role text,created_at timestamptz,expires_at timestamptz,status text)
language plpgsql stable security definer set search_path='' as $$
begin
  if not private_celeste.can(p_org,'membership.manage') then
    raise exception 'Permission denied' using errcode='42501';
  end if;
  return query select i.id,i.email,i.role,i.created_at,i.expires_at,
    case when i.accepted_at is not null then 'accepted' when i.revoked_at is not null then 'revoked'
      when i.expires_at<=now() then 'expired' else 'pending' end
    from private_celeste.organization_invitations i where i.organization_id=p_org order by i.created_at desc,i.id;
end;
$$;

create function private_celeste.revoke_invitation(p_org uuid,p_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform 1 from public.organizations where id=p_org for update;
  if not private_celeste.can(p_org,'membership.manage') then
    raise exception 'Permission denied' using errcode='42501';
  end if;
  update private_celeste.organization_invitations set revoked_at=now()
    where id=p_id and organization_id=p_org and accepted_at is null and revoked_at is null;
  if not found then raise exception 'Invitation unavailable' using errcode='22023'; end if;
  insert into public.activity_events(organization_id,actor_id,action,resource_id)
    values(p_org,auth.uid(),'invitation.revoked',p_id);
end;
$$;

create function private_celeste.accept_invitation(p_token text) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid(); v_org uuid; v_email text; v_inv private_celeste.organization_invitations%rowtype;
  v_member public.memberships%rowtype;
begin
  if v_actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
    raise exception 'Authentication required' using errcode='42501';
  end if;
  if p_token is null or p_token !~ '^[a-f0-9]{64}$' then
    raise exception 'Invitation unavailable' using errcode='22023';
  end if;
  -- Read trusted Auth state, never editable metadata or a user-supplied email.
  select lower(btrim(u.email)) into v_email from auth.users u where u.id=v_actor and u.email_confirmed_at is not null;
  if v_email is null then raise exception 'Verified email required' using errcode='42501'; end if;
  select organization_id into v_org from private_celeste.organization_invitations
    where token_hash=extensions.digest(p_token,'sha256');
  if v_org is null then raise exception 'Invitation unavailable' using errcode='22023'; end if;
  -- Same lock order as management/revocation; serialize duplicate acceptances.
  perform 1 from public.organizations where id=v_org for update;
  select * into v_inv from private_celeste.organization_invitations
    where token_hash=extensions.digest(p_token,'sha256') for update;
  if not found or v_inv.email<>v_email or v_inv.expires_at<=now()
    or v_inv.accepted_at is not null or v_inv.revoked_at is not null
    or not exists(select 1 from public.memberships m where m.organization_id=v_org
      and m.user_id=v_inv.created_by and m.role='founder_admin' and m.status='active') then
    raise exception 'Invitation unavailable' using errcode='22023';
  end if;
  select * into v_member from public.memberships where organization_id=v_org and user_id=v_actor;
  if found then
    if v_member.status<>'active' then raise exception 'Suspended membership' using errcode='42501'; end if;
    -- Existing active members retain their role; an invitation cannot upgrade them.
  else
    insert into public.memberships(organization_id,user_id,role) values(v_org,v_actor,v_inv.role);
  end if;
  update private_celeste.organization_invitations set accepted_at=now(),accepted_by=v_actor where id=v_inv.id;
  insert into public.activity_events(organization_id,actor_id,action,resource_id)
    values(v_org,v_actor,'invitation.accepted',v_inv.id);
  return v_org;
end;
$$;

create function public.create_invitation(p_org uuid,p_email text,p_role text)
returns table(id uuid,token text) language sql security invoker set search_path='' as $$
  select * from private_celeste.create_invitation(p_org,p_email,p_role);
$$;
create function public.list_invitations(p_org uuid)
returns table(id uuid,email text,role text,created_at timestamptz,expires_at timestamptz,status text)
language sql stable security invoker set search_path='' as $$ select * from private_celeste.list_invitations(p_org); $$;
create function public.revoke_invitation(p_org uuid,p_id uuid) returns void
language sql security invoker set search_path='' as $$ select private_celeste.revoke_invitation(p_org,p_id); $$;
create function public.accept_invitation(p_token text) returns uuid
language sql security invoker set search_path='' as $$ select private_celeste.accept_invitation(p_token); $$;

revoke all on function private_celeste.create_invitation(uuid,text,text),public.create_invitation(uuid,text,text),
  private_celeste.list_invitations(uuid),public.list_invitations(uuid),
  private_celeste.revoke_invitation(uuid,uuid),public.revoke_invitation(uuid,uuid),
  private_celeste.accept_invitation(text),public.accept_invitation(text) from public,anon;
grant execute on function private_celeste.create_invitation(uuid,text,text),public.create_invitation(uuid,text,text),
  private_celeste.list_invitations(uuid),public.list_invitations(uuid),
  private_celeste.revoke_invitation(uuid,uuid),public.revoke_invitation(uuid,uuid),
  private_celeste.accept_invitation(text),public.accept_invitation(text) to authenticated;
