-- CE-006: persist the disabled founder reimbursement regime.
-- Activation requires a later reviewed migration after Q-002 and Q-003 are decided.
create table public.reimbursement_policies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  version integer not null default 1 check (version>0),
  status text not null default 'disabled' check (status='disabled'),
  scope text not null default 'founders' check (scope='founders'),
  effective_from timestamptz not null default now(),
  reserve_minor bigint,
  equality_tolerance_minor bigint not null default 0,
  approved_by uuid references auth.users(id) on delete restrict,
  decision_reference text,
  created_at timestamptz not null default now(),
  unique (id,organization_id),
  unique (organization_id,version),
  check (
    reserve_minor is null
    and equality_tolerance_minor=0
    and approved_by is null
    and decision_reference is null
  )
);
create index reimbursement_policies_org_effective
  on public.reimbursement_policies(organization_id,effective_from desc,version desc);

alter table public.reimbursement_policies enable row level security;
revoke all on public.reimbursement_policies from public,anon,authenticated;
grant select on public.reimbursement_policies to authenticated;
grant all on public.reimbursement_policies to service_role;

create policy reimbursement_policy_read on public.reimbursement_policies
  for select to authenticated
  using (private_celeste.can(organization_id,'finance.read'));

create function private_celeste.provision_disabled_reimbursement_policy()
returns trigger language plpgsql security definer set search_path='' as $policy$
begin
  insert into public.reimbursement_policies(organization_id)
  values(new.id);
  return new;
end;
$policy$;
revoke all on function private_celeste.provision_disabled_reimbursement_policy()
  from public,anon,authenticated;

insert into public.reimbursement_policies(organization_id)
select o.id from public.organizations o
where not exists (
  select 1 from public.reimbursement_policies p
  where p.organization_id=o.id
);

create trigger organizations_provision_reimbursement_policy
after insert on public.organizations
for each row execute function private_celeste.provision_disabled_reimbursement_policy();

create function private_celeste.reject_reimbursement_policy_mutation()
returns trigger language plpgsql security definer set search_path='' as $policy$
begin
  if tg_op='DELETE' and not exists (
    select 1 from public.organizations o where o.id=old.organization_id
  ) then
    return old;
  end if;
  raise exception 'Reimbursement policy is immutable' using errcode='55000';
end;
$policy$;
revoke all on function private_celeste.reject_reimbursement_policy_mutation()
  from public,anon,authenticated;

create trigger reimbursement_policy_immutable
before update or delete on public.reimbursement_policies
for each row execute function private_celeste.reject_reimbursement_policy_mutation();

create trigger reimbursement_policy_no_truncate
before truncate on public.reimbursement_policies
for each statement execute function private_celeste.reject_reimbursement_policy_mutation();

create function private_celeste.get_reimbursement_policy(p_org uuid)
returns table(
  id uuid,version integer,status text,scope text,effective_from timestamptz,
  reserve_minor bigint,equality_tolerance_minor bigint,approved_by uuid,
  decision_reference text
) language plpgsql stable security definer set search_path='' as $policy$
begin
  if not private_celeste.can(p_org,'finance.read') then
    raise exception 'Permission denied' using errcode='42501';
  end if;
  return query
    select p.id,p.version,p.status,p.scope,p.effective_from,p.reserve_minor,
      p.equality_tolerance_minor,p.approved_by,p.decision_reference
    from public.reimbursement_policies p
    where p.organization_id=p_org
    order by p.version desc
    limit 1;
end;
$policy$;

create function public.get_reimbursement_policy(p_org uuid)
returns table(
  id uuid,version integer,status text,scope text,effective_from timestamptz,
  reserve_minor bigint,equality_tolerance_minor bigint,approved_by uuid,
  decision_reference text
) language sql stable security invoker set search_path='' as $policy$
  select * from private_celeste.get_reimbursement_policy(p_org);
$policy$;

revoke all on function
  private_celeste.get_reimbursement_policy(uuid),
  public.get_reimbursement_policy(uuid)
from public,anon,authenticated;
grant execute on function
  private_celeste.get_reimbursement_policy(uuid),
  public.get_reimbursement_policy(uuid)
to authenticated;
