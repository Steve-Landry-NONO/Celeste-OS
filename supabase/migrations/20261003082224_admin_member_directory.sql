-- CE-003: expose display names only within the existing membership administration.
-- Keep profiles' own-row RLS unchanged; never expose emails or Auth metadata.
create function private_celeste.list_organization_members(p_org uuid)
returns table (
  id uuid, organization_id uuid, user_id uuid, role text, status text,
  row_version integer, created_at timestamptz, display_name text
)
language plpgsql stable security definer set search_path='' as $$
begin
  if not private_celeste.can(p_org,'membership.manage') then
    raise exception 'Permission denied' using errcode='42501';
  end if;
  return query
    select m.id,m.organization_id,m.user_id,m.role,m.status,m.row_version,m.created_at,
      coalesce(p.display_name,'Membre')
    from public.memberships m
    left join public.profiles p on p.id=m.user_id
    where m.organization_id=p_org
    order by m.created_at,m.id;
end;
$$;

create function public.list_organization_members(p_org uuid)
returns table (
  id uuid, organization_id uuid, user_id uuid, role text, status text,
  row_version integer, created_at timestamptz, display_name text
)
language sql stable security invoker set search_path='' as $$
  select * from private_celeste.list_organization_members(p_org);
$$;

revoke all on function private_celeste.list_organization_members(uuid),
  public.list_organization_members(uuid) from public,anon;
grant execute on function private_celeste.list_organization_members(uuid),
  public.list_organization_members(uuid) to authenticated;
