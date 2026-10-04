-- CE-004: confirmed personal expenses and their single contribution effect.
-- Fund spending and reimbursements remain disabled until their dedicated ledgers exist.
create table public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  parent_id uuid,
  title text not null check (char_length(btrim(title)) between 2 and 80),
  normalized_title text not null check (normalized_title=lower(btrim(title))),
  active boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (id,organization_id),
  foreign key (parent_id,organization_id)
    references public.expense_categories(id,organization_id) on delete restrict
);
create unique index expense_categories_unique_title
  on public.expense_categories(organization_id,coalesce(parent_id,'00000000-0000-0000-0000-000000000000'::uuid),normalized_title);
create index expense_categories_org_active on public.expense_categories(organization_id,active,title);

alter table public.scope_files
  add constraint scope_files_id_org_scope_unique unique(id,organization_id,scope_id);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  scope_id uuid not null,
  category_id uuid not null,
  receipt_file_id uuid not null,
  label text not null check (char_length(btrim(label)) between 2 and 160),
  amount_minor bigint not null check (amount_minor between 1 and 9007199254740991),
  currency text not null check (currency='EUR'),
  spent_on date not null,
  source_type text not null check (source_type='personal'),
  treatment text not null check (treatment='contribution'),
  payer_id uuid not null references auth.users(id) on delete restrict,
  status text not null check (status='confirmed'),
  confirmed_by uuid not null references auth.users(id) on delete restrict,
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (id,organization_id),
  foreign key (scope_id,organization_id)
    references public.resource_scopes(id,organization_id) on delete restrict,
  foreign key (category_id,organization_id)
    references public.expense_categories(id,organization_id) on delete restrict,
  foreign key (receipt_file_id,organization_id,scope_id)
    references public.scope_files(id,organization_id,scope_id) on delete restrict
);
create index expenses_org_date on public.expenses(organization_id,spent_on desc,id);
create index expenses_scope_date on public.expenses(scope_id,spent_on desc);
create index expenses_category_date on public.expenses(category_id,spent_on desc);

create table public.contribution_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  founder_id uuid not null references auth.users(id) on delete restrict,
  expense_id uuid not null unique,
  signed_amount_minor bigint not null check (signed_amount_minor between 1 and 9007199254740991),
  currency text not null check (currency='EUR'),
  kind text not null check (kind='personal_expense'),
  created_at timestamptz not null default now(),
  foreign key (expense_id,organization_id)
    references public.expenses(id,organization_id) on delete restrict
);
create index contribution_entries_org_founder
  on public.contribution_entries(organization_id,founder_id,created_at);

create table private_celeste.finance_commands (
  organization_id uuid not null,
  actor_id uuid not null,
  command_key uuid not null,
  command text not null,
  payload jsonb not null,
  result_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (organization_id,actor_id,command_key),
  foreign key (organization_id) references public.organizations(id) on delete restrict,
  foreign key (actor_id) references auth.users(id) on delete restrict
);

alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;
alter table public.contribution_entries enable row level security;
alter table private_celeste.finance_commands enable row level security;
revoke all on public.expense_categories,public.expenses,public.contribution_entries from public,anon,authenticated;
revoke all on private_celeste.finance_commands from public,anon,authenticated;
grant select on public.expense_categories,public.expenses,public.contribution_entries to authenticated;
grant all on public.expense_categories,public.expenses,public.contribution_entries to service_role;

create policy finance_category_read on public.expense_categories for select to authenticated
  using (private_celeste.can(organization_id,'finance.read'));
create policy finance_expense_read on public.expenses for select to authenticated
  using (private_celeste.can(organization_id,'finance.read'));
create policy finance_contribution_read on public.contribution_entries for select to authenticated
  using (private_celeste.can(organization_id,'finance.read'));

create function private_celeste.reject_confirmed_finance_mutation() returns trigger
language plpgsql set search_path='' as $$
begin
  raise exception 'Confirmed finance records are immutable' using errcode='55000';
end;
$$;
create trigger expenses_immutable before update or delete on public.expenses
  for each row execute function private_celeste.reject_confirmed_finance_mutation();
create trigger contribution_entries_immutable before update or delete on public.contribution_entries
  for each row execute function private_celeste.reject_confirmed_finance_mutation();
revoke all on function private_celeste.reject_confirmed_finance_mutation() from public,anon,authenticated;

create function private_celeste.create_expense_category(p_org uuid,p_title text,p_parent uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
  perform 1 from public.organizations where id=p_org for update;
  if not private_celeste.can(p_org,'finance.confirm') then
    raise exception 'Permission denied' using errcode='42501';
  end if;
  if p_title is null or char_length(btrim(p_title)) not between 2 and 80
    or (p_parent is not null and not exists(
      select 1 from public.expense_categories
      where id=p_parent and organization_id=p_org and active
    )) then
    raise exception 'Invalid expense category' using errcode='22023';
  end if;
  insert into public.expense_categories(organization_id,parent_id,title,normalized_title,created_by)
  values(p_org,p_parent,btrim(p_title),lower(btrim(p_title)),(select auth.uid()))
  returning id into v_id;
  insert into public.activity_events(organization_id,actor_id,action,resource_id)
  values(p_org,(select auth.uid()),'expense_category.created',v_id);
  return v_id;
exception when unique_violation then
  raise exception 'Expense category already exists' using errcode='23505';
end;
$$;

create function private_celeste.record_personal_expense(
  p_org uuid,p_scope uuid,p_category uuid,p_receipt uuid,p_label text,
  p_amount_minor bigint,p_spent_on date,p_payer uuid,p_command_key uuid
) returns uuid language plpgsql security definer set search_path='' as $$
declare
  v_actor uuid:=(select auth.uid());
  v_id uuid:=gen_random_uuid();
  v_payload jsonb;
  v_previous private_celeste.finance_commands%rowtype;
  v_total numeric;
  v_timezone text;
  v_today date;
begin
  select o.timezone into v_timezone
    from public.organizations o where o.id=p_org for update;
  if not private_celeste.can(p_org,'finance.confirm') then
    raise exception 'Permission denied' using errcode='42501';
  end if;
  v_today:=(statement_timestamp() at time zone v_timezone)::date;
  if p_command_key is null or p_label is null or char_length(btrim(p_label)) not between 2 and 160
    or p_amount_minor is null or p_amount_minor not between 1 and 9007199254740991
    or p_spent_on is null or p_spent_on>v_today
    or not exists(select 1 from public.resource_scopes where id=p_scope and organization_id=p_org)
    or not exists(select 1 from public.expense_categories where id=p_category and organization_id=p_org and active)
    or not exists(select 1 from public.scope_files where id=p_receipt and organization_id=p_org and scope_id=p_scope and status='ready')
    or not exists(select 1 from public.memberships where organization_id=p_org and user_id=p_payer
      and status='active' and role in ('founder_admin','founder_finance')) then
    raise exception 'Invalid personal expense' using errcode='22023';
  end if;
  v_payload:=jsonb_build_object(
    'scope',p_scope,'category',p_category,'receipt',p_receipt,'label',btrim(p_label),
    'amount_minor',p_amount_minor,'spent_on',p_spent_on,'payer',p_payer,
    'currency','EUR','source_type','personal','treatment','contribution'
  );
  select * into v_previous from private_celeste.finance_commands
    where organization_id=p_org and actor_id=v_actor and command_key=p_command_key;
  if v_previous.command is not null then
    if v_previous.command<>'record_personal_expense' or v_previous.payload<>v_payload then
      raise exception 'Idempotency key conflict' using errcode='40001';
    end if;
    return v_previous.result_id;
  end if;
  select coalesce(sum(signed_amount_minor),0) into v_total
    from public.contribution_entries where organization_id=p_org and founder_id=p_payer;
  if v_total>9007199254740991-p_amount_minor then
    raise exception 'Contribution amount overflow' using errcode='22003';
  end if;
  insert into public.expenses(
    id,organization_id,scope_id,category_id,receipt_file_id,label,amount_minor,currency,
    spent_on,source_type,treatment,payer_id,status,confirmed_by
  ) values (
    v_id,p_org,p_scope,p_category,p_receipt,btrim(p_label),p_amount_minor,'EUR',
    p_spent_on,'personal','contribution',p_payer,'confirmed',v_actor
  );
  insert into public.contribution_entries(
    organization_id,founder_id,expense_id,signed_amount_minor,currency,kind
  ) values(p_org,p_payer,v_id,p_amount_minor,'EUR','personal_expense');
  insert into private_celeste.finance_commands(
    organization_id,actor_id,command_key,command,payload,result_id
  ) values(p_org,v_actor,p_command_key,'record_personal_expense',v_payload,v_id);
  insert into public.activity_events(organization_id,actor_id,action,resource_id,subject_user_id)
  values(p_org,v_actor,'expense.confirmed',v_id,p_payer);
  return v_id;
end;
$$;

create function private_celeste.list_finance_contributions(p_org uuid)
returns table(user_id uuid,display_name text,amount_minor bigint,can_confirm boolean)
language plpgsql stable security definer set search_path='' as $$
begin
  if not private_celeste.can(p_org,'finance.read') then
    raise exception 'Permission denied' using errcode='42501';
  end if;
  return query
    with eligible as (
      select m.user_id
      from public.memberships m
      where m.organization_id=p_org and m.status='active'
        and m.role in ('founder_admin','founder_finance')
    ), people as (
      select e.user_id from eligible e
      union
      select c.founder_id from public.contribution_entries c where c.organization_id=p_org
    )
    select people.user_id,p.display_name,coalesce(sum(c.signed_amount_minor),0)::bigint,
      (eligible.user_id is not null) as can_confirm
    from people
    join public.profiles p on p.id=people.user_id
    left join eligible on eligible.user_id=people.user_id
    left join public.contribution_entries c
      on c.organization_id=p_org and c.founder_id=people.user_id
    group by people.user_id,p.display_name,eligible.user_id
    order by p.display_name,people.user_id;
end;
$$;

create function public.create_expense_category(p_org uuid,p_title text,p_parent uuid default null)
returns uuid language sql security invoker set search_path='' as $$
  select private_celeste.create_expense_category(p_org,p_title,p_parent);
$$;
create function public.record_personal_expense(
  p_org uuid,p_scope uuid,p_category uuid,p_receipt uuid,p_label text,
  p_amount_minor bigint,p_spent_on date,p_payer uuid,p_command_key uuid
) returns uuid language sql security invoker set search_path='' as $$
  select private_celeste.record_personal_expense(
    p_org,p_scope,p_category,p_receipt,p_label,p_amount_minor,p_spent_on,p_payer,p_command_key
  );
$$;
create function public.list_finance_contributions(p_org uuid)
returns table(user_id uuid,display_name text,amount_minor bigint,can_confirm boolean)
language sql stable security invoker set search_path='' as $$
  select * from private_celeste.list_finance_contributions(p_org);
$$;

revoke all on function
  private_celeste.create_expense_category(uuid,text,uuid),
  private_celeste.record_personal_expense(uuid,uuid,uuid,uuid,text,bigint,date,uuid,uuid),
  private_celeste.list_finance_contributions(uuid),
  public.create_expense_category(uuid,text,uuid),
  public.record_personal_expense(uuid,uuid,uuid,uuid,text,bigint,date,uuid,uuid),
  public.list_finance_contributions(uuid)
from public,anon,authenticated;
grant execute on function
  private_celeste.create_expense_category(uuid,text,uuid),
  private_celeste.record_personal_expense(uuid,uuid,uuid,uuid,text,bigint,date,uuid,uuid),
  private_celeste.list_finance_contributions(uuid),
  public.create_expense_category(uuid,text,uuid),
  public.record_personal_expense(uuid,uuid,uuid,uuid,text,bigint,date,uuid,uuid),
  public.list_finance_contributions(uuid)
to authenticated;
