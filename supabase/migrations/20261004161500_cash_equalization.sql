-- CE-005: fund deposits, cash movements and equalization.
-- A cost and a cash movement are separate effects. Founder reimbursements remain disabled.
create table public.cash_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  name text not null check (char_length(btrim(name)) between 2 and 80),
  normalized_name text not null check (normalized_name=lower(btrim(name))),
  currency text not null check (currency='EUR'),
  active boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (id,organization_id),
  unique (organization_id,normalized_name)
);

create table public.fund_deposits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  cash_account_id uuid not null,
  founder_id uuid not null references auth.users(id) on delete restrict,
  label text not null check (char_length(btrim(label)) between 2 and 160),
  amount_minor bigint not null check (amount_minor between 1 and 9007199254740991),
  currency text not null check (currency='EUR'),
  deposited_on date not null,
  status text not null check (status='confirmed'),
  confirmed_by uuid not null references auth.users(id) on delete restrict,
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (id,organization_id),
  foreign key (cash_account_id,organization_id)
    references public.cash_accounts(id,organization_id) on delete restrict
);
create index fund_deposits_org_date on public.fund_deposits(organization_id,deposited_on desc,id);

alter table public.expenses drop constraint expenses_source_type_check;
alter table public.expenses drop constraint expenses_treatment_check;
alter table public.expenses alter column payer_id drop not null;
alter table public.expenses add column cash_account_id uuid;
alter table public.expenses add constraint expenses_cash_account_org_fkey
  foreign key (cash_account_id,organization_id)
  references public.cash_accounts(id,organization_id) on delete restrict;
alter table public.expenses add constraint expenses_source_type_check
  check (source_type in ('personal','fund'));
alter table public.expenses add constraint expenses_treatment_check
  check (treatment in ('contribution','fund_expense'));
alter table public.expenses add constraint expenses_source_shape_check check (
  (source_type='personal' and treatment='contribution' and payer_id is not null and cash_account_id is null)
  or
  (source_type='fund' and treatment='fund_expense' and payer_id is null and cash_account_id is not null)
);

alter table public.contribution_entries drop constraint contribution_entries_kind_check;
alter table public.contribution_entries alter column expense_id drop not null;
alter table public.contribution_entries add column deposit_id uuid;
alter table public.contribution_entries add constraint contribution_entries_deposit_fkey
  foreign key (deposit_id,organization_id)
  references public.fund_deposits(id,organization_id) on delete restrict;
alter table public.contribution_entries add constraint contribution_entries_deposit_unique unique(deposit_id);
alter table public.contribution_entries add constraint contribution_entries_kind_check
  check (kind in ('personal_expense','fund_deposit'));
alter table public.contribution_entries add constraint contribution_entries_source_shape_check check (
  (kind='personal_expense' and expense_id is not null and deposit_id is null)
  or
  (kind='fund_deposit' and expense_id is null and deposit_id is not null)
);

create table public.supplier_refunds (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  expense_id uuid not null,
  cash_account_id uuid not null,
  label text not null check (char_length(btrim(label)) between 2 and 160),
  amount_minor bigint not null check (amount_minor between 1 and 9007199254740991),
  currency text not null check (currency='EUR'),
  received_on date not null,
  status text not null check (status='confirmed'),
  confirmed_by uuid not null references auth.users(id) on delete restrict,
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (id,organization_id),
  foreign key (expense_id,organization_id)
    references public.expenses(id,organization_id) on delete restrict,
  foreign key (cash_account_id,organization_id)
    references public.cash_accounts(id,organization_id) on delete restrict
);
create index supplier_refunds_expense on public.supplier_refunds(expense_id,created_at);

create table public.cash_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  cash_account_id uuid not null,
  source_type text not null check (source_type in ('fund_deposit','fund_expense','supplier_refund')),
  source_id uuid not null,
  signed_amount_minor bigint not null check (
    signed_amount_minor between -9007199254740991 and 9007199254740991
    and signed_amount_minor<>0
  ),
  currency text not null check (currency='EUR'),
  created_at timestamptz not null default now(),
  unique (organization_id,source_type,source_id),
  foreign key (cash_account_id,organization_id)
    references public.cash_accounts(id,organization_id) on delete restrict
);
create index cash_entries_account_time on public.cash_entries(cash_account_id,created_at,id);

alter table public.cash_accounts enable row level security;
alter table public.fund_deposits enable row level security;
alter table public.supplier_refunds enable row level security;
alter table public.cash_entries enable row level security;
revoke all on public.cash_accounts,public.fund_deposits,public.supplier_refunds,public.cash_entries
  from public,anon,authenticated;
grant select on public.cash_accounts,public.fund_deposits,public.supplier_refunds,public.cash_entries
  to authenticated;
grant all on public.cash_accounts,public.fund_deposits,public.supplier_refunds,public.cash_entries
  to service_role;

create policy finance_cash_account_read on public.cash_accounts for select to authenticated
  using (private_celeste.can(organization_id,'finance.read'));
create policy finance_deposit_read on public.fund_deposits for select to authenticated
  using (private_celeste.can(organization_id,'finance.read'));
create policy finance_supplier_refund_read on public.supplier_refunds for select to authenticated
  using (private_celeste.can(organization_id,'finance.read'));
create policy finance_cash_entry_read on public.cash_entries for select to authenticated
  using (private_celeste.can(organization_id,'finance.read'));

create trigger fund_deposits_immutable before update or delete on public.fund_deposits
  for each row execute function private_celeste.reject_confirmed_finance_mutation();
create trigger supplier_refunds_immutable before update or delete on public.supplier_refunds
  for each row execute function private_celeste.reject_confirmed_finance_mutation();
create trigger cash_entries_immutable before update or delete on public.cash_entries
  for each row execute function private_celeste.reject_confirmed_finance_mutation();

create function private_celeste.reject_unsafe_finance_aggregate()
returns trigger language plpgsql security definer set search_path='' as $aggregate$
declare v_total numeric;
begin
  case tg_table_name
    when 'contribution_entries' then
      select coalesce(sum(c.signed_amount_minor),0)+new.signed_amount_minor into v_total
        from public.contribution_entries c where c.organization_id=new.organization_id;
    when 'cash_entries' then
      select coalesce(sum(c.signed_amount_minor),0)+new.signed_amount_minor into v_total
        from public.cash_entries c where c.organization_id=new.organization_id;
    when 'expenses' then
      select coalesce((select sum(e.amount_minor) from public.expenses e
          where e.organization_id=new.organization_id),0)
        -coalesce((select sum(r.amount_minor) from public.supplier_refunds r
          where r.organization_id=new.organization_id),0)
        +new.amount_minor into v_total;
    when 'supplier_refunds' then
      select coalesce((select sum(e.amount_minor) from public.expenses e
          where e.organization_id=new.organization_id),0)
        -coalesce((select sum(r.amount_minor) from public.supplier_refunds r
          where r.organization_id=new.organization_id),0)
        -new.amount_minor into v_total;
    else
      raise exception 'Unsupported finance aggregate' using errcode='55000';
  end case;
  if v_total not between -9007199254740991 and 9007199254740991 then
    raise exception 'Finance aggregate exceeds safe integer range' using errcode='22003';
  end if;
  return new;
end;
$aggregate$;
revoke all on function private_celeste.reject_unsafe_finance_aggregate()
  from public,anon,authenticated;

create trigger contribution_entries_safe_aggregate before insert on public.contribution_entries
  for each row execute function private_celeste.reject_unsafe_finance_aggregate();
create trigger cash_entries_safe_aggregate before insert on public.cash_entries
  for each row execute function private_celeste.reject_unsafe_finance_aggregate();
create trigger expenses_safe_aggregate before insert on public.expenses
  for each row execute function private_celeste.reject_unsafe_finance_aggregate();
create trigger supplier_refunds_safe_aggregate before insert on public.supplier_refunds
  for each row execute function private_celeste.reject_unsafe_finance_aggregate();

create function private_celeste.create_cash_account(p_org uuid,p_name text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
  perform 1 from public.organizations where id=p_org for update;
  if not private_celeste.can(p_org,'finance.confirm') then
    raise exception 'Permission denied' using errcode='42501';
  end if;
  if p_name is null or char_length(btrim(p_name)) not between 2 and 80 then
    raise exception 'Invalid cash account' using errcode='22023';
  end if;
  insert into public.cash_accounts(organization_id,name,normalized_name,currency,created_by)
  values(p_org,btrim(p_name),lower(btrim(p_name)),'EUR',(select auth.uid()))
  returning id into v_id;
  insert into public.activity_events(organization_id,actor_id,action,resource_id)
  values(p_org,(select auth.uid()),'cash_account.created',v_id);
  return v_id;
exception when unique_violation then
  raise exception 'Cash account already exists' using errcode='23505';
end;
$$;

create function private_celeste.record_fund_deposit(
  p_org uuid,p_account uuid,p_founder uuid,p_label text,p_amount_minor bigint,
  p_deposited_on date,p_command_key uuid
) returns uuid language plpgsql security definer set search_path='' as $$
declare
  v_actor uuid:=(select auth.uid());
  v_id uuid:=gen_random_uuid();
  v_payload jsonb;
  v_previous private_celeste.finance_commands%rowtype;
  v_timezone text;
  v_today date;
  v_total numeric;
begin
  select timezone into v_timezone from public.organizations where id=p_org for update;
  perform 1 from public.cash_accounts where id=p_account and organization_id=p_org and active for update;
  if not private_celeste.can(p_org,'finance.confirm') then
    raise exception 'Permission denied' using errcode='42501';
  end if;
  v_today:=(statement_timestamp() at time zone v_timezone)::date;
  if p_command_key is null or p_label is null or char_length(btrim(p_label)) not between 2 and 160
    or p_amount_minor is null or p_amount_minor not between 1 and 9007199254740991
    or p_deposited_on is null or p_deposited_on>v_today
    or not exists(select 1 from public.cash_accounts where id=p_account and organization_id=p_org and active)
    or not exists(select 1 from public.memberships where organization_id=p_org and user_id=p_founder
      and status='active' and role in ('founder_admin','founder_finance')) then
    raise exception 'Invalid fund deposit' using errcode='22023';
  end if;
  v_payload:=jsonb_build_object(
    'account',p_account,'founder',p_founder,'label',btrim(p_label),'amount_minor',p_amount_minor,
    'deposited_on',p_deposited_on,'currency','EUR'
  );
  select * into v_previous from private_celeste.finance_commands
    where organization_id=p_org and actor_id=v_actor and command_key=p_command_key;
  if v_previous.command is not null then
    if v_previous.command<>'record_fund_deposit' or v_previous.payload<>v_payload then
      raise exception 'Idempotency key conflict' using errcode='40001';
    end if;
    return v_previous.result_id;
  end if;
  select coalesce(sum(signed_amount_minor),0) into v_total from public.contribution_entries
    where organization_id=p_org and founder_id=p_founder;
  if v_total>9007199254740991-p_amount_minor then
    raise exception 'Contribution amount overflow' using errcode='22003';
  end if;
  select coalesce(sum(signed_amount_minor),0) into v_total from public.cash_entries
    where organization_id=p_org and cash_account_id=p_account;
  if v_total>9007199254740991-p_amount_minor then
    raise exception 'Cash amount overflow' using errcode='22003';
  end if;
  insert into public.fund_deposits(
    id,organization_id,cash_account_id,founder_id,label,amount_minor,currency,deposited_on,status,confirmed_by
  ) values(v_id,p_org,p_account,p_founder,btrim(p_label),p_amount_minor,'EUR',p_deposited_on,'confirmed',v_actor);
  insert into public.contribution_entries(
    organization_id,founder_id,deposit_id,signed_amount_minor,currency,kind
  ) values(p_org,p_founder,v_id,p_amount_minor,'EUR','fund_deposit');
  insert into public.cash_entries(
    organization_id,cash_account_id,source_type,source_id,signed_amount_minor,currency
  ) values(p_org,p_account,'fund_deposit',v_id,p_amount_minor,'EUR');
  insert into private_celeste.finance_commands(organization_id,actor_id,command_key,command,payload,result_id)
  values(p_org,v_actor,p_command_key,'record_fund_deposit',v_payload,v_id);
  insert into public.activity_events(organization_id,actor_id,action,resource_id,subject_user_id)
  values(p_org,v_actor,'fund_deposit.confirmed',v_id,p_founder);
  return v_id;
end;
$$;

create function private_celeste.record_fund_expense(
  p_org uuid,p_scope uuid,p_category uuid,p_receipt uuid,p_account uuid,p_label text,
  p_amount_minor bigint,p_spent_on date,p_command_key uuid
) returns uuid language plpgsql security definer set search_path='' as $$
declare
  v_actor uuid:=(select auth.uid());
  v_id uuid:=gen_random_uuid();
  v_payload jsonb;
  v_previous private_celeste.finance_commands%rowtype;
  v_timezone text;
  v_today date;
  v_balance numeric;
begin
  select timezone into v_timezone from public.organizations where id=p_org for update;
  perform 1 from public.cash_accounts where id=p_account and organization_id=p_org and active for update;
  if not private_celeste.can(p_org,'finance.confirm') then
    raise exception 'Permission denied' using errcode='42501';
  end if;
  v_today:=(statement_timestamp() at time zone v_timezone)::date;
  if p_command_key is null or p_label is null or char_length(btrim(p_label)) not between 2 and 160
    or p_amount_minor is null or p_amount_minor not between 1 and 9007199254740991
    or p_spent_on is null or p_spent_on>v_today
    or not exists(select 1 from public.cash_accounts where id=p_account and organization_id=p_org and active)
    or not exists(select 1 from public.resource_scopes where id=p_scope and organization_id=p_org)
    or not exists(select 1 from public.expense_categories where id=p_category and organization_id=p_org and active)
    or not exists(select 1 from public.scope_files where id=p_receipt and organization_id=p_org and scope_id=p_scope and status='ready') then
    raise exception 'Invalid fund expense' using errcode='22023';
  end if;
  v_payload:=jsonb_build_object(
    'scope',p_scope,'category',p_category,'receipt',p_receipt,'account',p_account,
    'label',btrim(p_label),'amount_minor',p_amount_minor,'spent_on',p_spent_on,
    'currency','EUR','source_type','fund','treatment','fund_expense'
  );
  select * into v_previous from private_celeste.finance_commands
    where organization_id=p_org and actor_id=v_actor and command_key=p_command_key;
  if v_previous.command is not null then
    if v_previous.command<>'record_fund_expense' or v_previous.payload<>v_payload then
      raise exception 'Idempotency key conflict' using errcode='40001';
    end if;
    return v_previous.result_id;
  end if;
  select coalesce(sum(signed_amount_minor),0) into v_balance from public.cash_entries
    where organization_id=p_org and cash_account_id=p_account;
  if v_balance<p_amount_minor then
    raise exception 'Insufficient cash' using errcode='23514';
  end if;
  insert into public.expenses(
    id,organization_id,scope_id,category_id,receipt_file_id,cash_account_id,label,amount_minor,
    currency,spent_on,source_type,treatment,payer_id,status,confirmed_by
  ) values(
    v_id,p_org,p_scope,p_category,p_receipt,p_account,btrim(p_label),p_amount_minor,
    'EUR',p_spent_on,'fund','fund_expense',null,'confirmed',v_actor
  );
  insert into public.cash_entries(
    organization_id,cash_account_id,source_type,source_id,signed_amount_minor,currency
  ) values(p_org,p_account,'fund_expense',v_id,-p_amount_minor,'EUR');
  insert into private_celeste.finance_commands(organization_id,actor_id,command_key,command,payload,result_id)
  values(p_org,v_actor,p_command_key,'record_fund_expense',v_payload,v_id);
  insert into public.activity_events(organization_id,actor_id,action,resource_id)
  values(p_org,v_actor,'fund_expense.confirmed',v_id);
  return v_id;
end;
$$;

create function private_celeste.record_supplier_refund(
  p_org uuid,p_expense uuid,p_account uuid,p_label text,p_amount_minor bigint,
  p_received_on date,p_command_key uuid
) returns uuid language plpgsql security definer set search_path='' as $$
declare
  v_actor uuid:=(select auth.uid());
  v_id uuid:=gen_random_uuid();
  v_payload jsonb;
  v_previous private_celeste.finance_commands%rowtype;
  v_timezone text;
  v_today date;
  v_expense_amount bigint;
  v_refunded numeric;
  v_balance numeric;
begin
  select timezone into v_timezone from public.organizations where id=p_org for update;
  perform 1 from public.cash_accounts where id=p_account and organization_id=p_org and active for update;
  select amount_minor into v_expense_amount from public.expenses
    where id=p_expense and organization_id=p_org and source_type='fund'
      and cash_account_id=p_account and status='confirmed' for update;
  if not private_celeste.can(p_org,'finance.confirm') then
    raise exception 'Permission denied' using errcode='42501';
  end if;
  v_today:=(statement_timestamp() at time zone v_timezone)::date;
  if p_command_key is null or p_label is null or char_length(btrim(p_label)) not between 2 and 160
    or p_amount_minor is null or p_amount_minor not between 1 and 9007199254740991
    or p_received_on is null or p_received_on>v_today or v_expense_amount is null then
    raise exception 'Invalid supplier refund' using errcode='22023';
  end if;
  v_payload:=jsonb_build_object(
    'expense',p_expense,'account',p_account,'label',btrim(p_label),'amount_minor',p_amount_minor,
    'received_on',p_received_on,'currency','EUR','destination','fund'
  );
  select * into v_previous from private_celeste.finance_commands
    where organization_id=p_org and actor_id=v_actor and command_key=p_command_key;
  if v_previous.command is not null then
    if v_previous.command<>'record_supplier_refund' or v_previous.payload<>v_payload then
      raise exception 'Idempotency key conflict' using errcode='40001';
    end if;
    return v_previous.result_id;
  end if;
  select coalesce(sum(amount_minor),0) into v_refunded from public.supplier_refunds
    where organization_id=p_org and expense_id=p_expense;
  if v_refunded+p_amount_minor>v_expense_amount then
    raise exception 'Refund exceeds expense' using errcode='23514';
  end if;
  select coalesce(sum(signed_amount_minor),0) into v_balance from public.cash_entries
    where organization_id=p_org and cash_account_id=p_account;
  if v_balance>9007199254740991-p_amount_minor then
    raise exception 'Cash amount overflow' using errcode='22003';
  end if;
  insert into public.supplier_refunds(
    id,organization_id,expense_id,cash_account_id,label,amount_minor,currency,received_on,status,confirmed_by
  ) values(v_id,p_org,p_expense,p_account,btrim(p_label),p_amount_minor,'EUR',p_received_on,'confirmed',v_actor);
  insert into public.cash_entries(
    organization_id,cash_account_id,source_type,source_id,signed_amount_minor,currency
  ) values(p_org,p_account,'supplier_refund',v_id,p_amount_minor,'EUR');
  insert into private_celeste.finance_commands(organization_id,actor_id,command_key,command,payload,result_id)
  values(p_org,v_actor,p_command_key,'record_supplier_refund',v_payload,v_id);
  insert into public.activity_events(organization_id,actor_id,action,resource_id)
  values(p_org,v_actor,'supplier_refund.confirmed',v_id);
  return v_id;
end;
$$;

drop function public.list_finance_contributions(uuid);
drop function private_celeste.list_finance_contributions(uuid);

create function private_celeste.list_finance_contributions(p_org uuid)
returns table(
  user_id uuid,display_name text,amount_minor bigint,can_confirm boolean,
  reference_minor bigint,remaining_minor bigint
) language plpgsql stable security definer set search_path='' as $$
begin
  if not private_celeste.can(p_org,'finance.read') then
    raise exception 'Permission denied' using errcode='42501';
  end if;
  return query
    with eligible as (
      select m.user_id from public.memberships m
      where m.organization_id=p_org and m.status='active'
        and m.role in ('founder_admin','founder_finance')
    ), amounts as (
      select c.founder_id,coalesce(sum(c.signed_amount_minor),0)::bigint amount_minor
      from public.contribution_entries c where c.organization_id=p_org group by c.founder_id
    ), people as (
      select e.user_id from eligible e union select a.founder_id from amounts a
    ), active_reference as (
      select coalesce(max(coalesce(a.amount_minor,0)),0)::bigint amount_minor
      from eligible e left join amounts a on a.founder_id=e.user_id
    )
    select people.user_id,p.display_name,coalesce(a.amount_minor,0)::bigint,
      (e.user_id is not null),r.amount_minor,
      case when e.user_id is null then null else greatest(r.amount_minor-coalesce(a.amount_minor,0),0)::bigint end
    from people
    join public.profiles p on p.id=people.user_id
    left join eligible e on e.user_id=people.user_id
    left join amounts a on a.founder_id=people.user_id
    cross join active_reference r
    order by p.display_name,people.user_id;
end;
$$;

create function private_celeste.get_finance_totals(p_org uuid)
returns table(
  cost_minor bigint,cash_minor bigint,contribution_minor bigint,reference_minor bigint,equalized boolean
) language plpgsql stable security definer set search_path='' as $$
begin
  if not private_celeste.can(p_org,'finance.read') then
    raise exception 'Permission denied' using errcode='42501';
  end if;
  return query
    with eligible as (
      select user_id from public.memberships where organization_id=p_org and status='active'
        and role in ('founder_admin','founder_finance')
    ), amounts as (
      select c.founder_id,coalesce(sum(c.signed_amount_minor),0)::bigint amount_minor
      from public.contribution_entries c where c.organization_id=p_org group by c.founder_id
    ), active_amounts as (
      select e.user_id,coalesce(a.amount_minor,0)::bigint amount_minor
      from eligible e left join amounts a on a.founder_id=e.user_id
    ), reference as (
      select coalesce(max(amount_minor),0)::bigint amount_minor from active_amounts
    )
    select
      (coalesce((select sum(amount_minor) from public.expenses where organization_id=p_org),0)
        -coalesce((select sum(amount_minor) from public.supplier_refunds where organization_id=p_org),0))::bigint,
      coalesce((select sum(signed_amount_minor) from public.cash_entries where organization_id=p_org),0)::bigint,
      coalesce((select sum(signed_amount_minor) from public.contribution_entries where organization_id=p_org),0)::bigint,
      r.amount_minor,
      coalesce((select bool_and(a.amount_minor=r.amount_minor) from active_amounts a),false)
    from reference r;
end;
$$;

create function public.create_cash_account(p_org uuid,p_name text)
returns uuid language sql security invoker set search_path='' as $$
  select private_celeste.create_cash_account(p_org,p_name);
$$;
create function public.record_fund_deposit(
  p_org uuid,p_account uuid,p_founder uuid,p_label text,p_amount_minor bigint,
  p_deposited_on date,p_command_key uuid
) returns uuid language sql security invoker set search_path='' as $$
  select private_celeste.record_fund_deposit(
    p_org,p_account,p_founder,p_label,p_amount_minor,p_deposited_on,p_command_key
  );
$$;
create function public.record_fund_expense(
  p_org uuid,p_scope uuid,p_category uuid,p_receipt uuid,p_account uuid,p_label text,
  p_amount_minor bigint,p_spent_on date,p_command_key uuid
) returns uuid language sql security invoker set search_path='' as $$
  select private_celeste.record_fund_expense(
    p_org,p_scope,p_category,p_receipt,p_account,p_label,p_amount_minor,p_spent_on,p_command_key
  );
$$;
create function public.record_supplier_refund(
  p_org uuid,p_expense uuid,p_account uuid,p_label text,p_amount_minor bigint,
  p_received_on date,p_command_key uuid
) returns uuid language sql security invoker set search_path='' as $$
  select private_celeste.record_supplier_refund(
    p_org,p_expense,p_account,p_label,p_amount_minor,p_received_on,p_command_key
  );
$$;
create function public.list_finance_contributions(p_org uuid)
returns table(
  user_id uuid,display_name text,amount_minor bigint,can_confirm boolean,
  reference_minor bigint,remaining_minor bigint
) language sql stable security invoker set search_path='' as $$
  select * from private_celeste.list_finance_contributions(p_org);
$$;
create function public.get_finance_totals(p_org uuid)
returns table(
  cost_minor bigint,cash_minor bigint,contribution_minor bigint,reference_minor bigint,equalized boolean
) language sql stable security invoker set search_path='' as $$
  select * from private_celeste.get_finance_totals(p_org);
$$;

revoke all on function
  private_celeste.create_cash_account(uuid,text),
  private_celeste.record_fund_deposit(uuid,uuid,uuid,text,bigint,date,uuid),
  private_celeste.record_fund_expense(uuid,uuid,uuid,uuid,uuid,text,bigint,date,uuid),
  private_celeste.record_supplier_refund(uuid,uuid,uuid,text,bigint,date,uuid),
  private_celeste.list_finance_contributions(uuid),
  private_celeste.get_finance_totals(uuid),
  public.create_cash_account(uuid,text),
  public.record_fund_deposit(uuid,uuid,uuid,text,bigint,date,uuid),
  public.record_fund_expense(uuid,uuid,uuid,uuid,uuid,text,bigint,date,uuid),
  public.record_supplier_refund(uuid,uuid,uuid,text,bigint,date,uuid),
  public.list_finance_contributions(uuid),
  public.get_finance_totals(uuid)
from public,anon,authenticated;
grant execute on function
  private_celeste.create_cash_account(uuid,text),
  private_celeste.record_fund_deposit(uuid,uuid,uuid,text,bigint,date,uuid),
  private_celeste.record_fund_expense(uuid,uuid,uuid,uuid,uuid,text,bigint,date,uuid),
  private_celeste.record_supplier_refund(uuid,uuid,uuid,text,bigint,date,uuid),
  private_celeste.list_finance_contributions(uuid),
  private_celeste.get_finance_totals(uuid),
  public.create_cash_account(uuid,text),
  public.record_fund_deposit(uuid,uuid,uuid,text,bigint,date,uuid),
  public.record_fund_expense(uuid,uuid,uuid,uuid,uuid,text,bigint,date,uuid),
  public.record_supplier_refund(uuid,uuid,uuid,text,bigint,date,uuid),
  public.list_finance_contributions(uuid),
  public.get_finance_totals(uuid)
to authenticated;
