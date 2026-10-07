-- CE-007: persistent project phases, tasks and permission-safe Today data.
-- Read access follows the existing project/mission scope exactly. Task writing
-- is a distinct capability and never follows from read access alone.

alter table public.resource_scopes
  add column project_id uuid generated always as (coalesce(parent_project_id,id)) stored;
alter table public.resource_scopes
  add constraint resource_scopes_task_parent_unique unique (id,organization_id,project_id,kind);

alter table private_celeste.scope_grants
  add column task_write boolean not null default false;

insert into private_celeste.role_permissions(role,capability) values
  ('founder_admin','project.write'),
  ('founder_admin','task.assign');

create function private_celeste.can_write_task_scope_for(p_scope uuid,p_user uuid)
returns boolean language sql stable security definer set search_path='' as $function$
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
          where r.role=m.role and r.capability='task.assign'
        )
        or (
          (m.role<>'vendor' or s.kind='mission')
          and exists (
            select 1 from private_celeste.scope_grants g
            where g.scope_id=s.id
              and g.user_id=m.user_id
              and g.granted
              and g.task_write
          )
        )
      )
  );
$function$;
revoke all on function private_celeste.can_write_task_scope_for(uuid,uuid)
  from public,anon,authenticated;

create function private_celeste.can_write_task_scope(p_scope uuid)
returns boolean language sql stable security definer set search_path='' as $function$
  select (select auth.uid()) is not null
    and not coalesce(((select auth.jwt())->>'is_anonymous')::boolean,false)
    and private_celeste.can_write_task_scope_for(p_scope,(select auth.uid()));
$function$;
revoke all on function private_celeste.can_write_task_scope(uuid) from public,anon;
grant execute on function private_celeste.can_write_task_scope(uuid) to authenticated;

create table public.project_phases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null,
  project_kind text not null default 'project' check (project_kind='project'),
  name text not null check (char_length(btrim(name)) between 2 and 100),
  start_on date,
  due_on date,
  status text not null check (status in ('planned','active','done','cancelled')),
  row_version integer not null default 1 check (row_version>0),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id,organization_id,project_id),
  foreign key (project_id,organization_id,project_kind)
    references public.resource_scopes(id,organization_id,kind) on delete cascade,
  check (start_on is null or due_on is null or start_on<=due_on)
);
create index project_phases_project_status
  on public.project_phases(project_id,status,created_at,id);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  scope_id uuid not null,
  project_id uuid not null,
  scope_kind text not null check (scope_kind in ('project','mission')),
  phase_id uuid,
  assignee_id uuid not null references auth.users(id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 2 and 160),
  status text not null check (status in ('todo','in_progress','blocked','in_review','done','cancelled')),
  priority text not null check (priority in ('urgent','high','normal','low')),
  due_on date,
  blocked_reason text,
  row_version integer not null default 1 check (row_version>0),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id,organization_id,scope_id),
  foreign key (scope_id,organization_id,project_id,scope_kind)
    references public.resource_scopes(id,organization_id,project_id,kind) on delete cascade,
  foreign key (phase_id,organization_id,project_id)
    references public.project_phases(id,organization_id,project_id) on delete restrict,
  check (
    (status='blocked' and blocked_reason is not null and char_length(btrim(blocked_reason)) between 2 and 500)
    or (status<>'blocked' and blocked_reason is null)
  )
);
create index tasks_assignee_today
  on public.tasks(organization_id,assignee_id,status,due_on,created_at,id);
create index tasks_scope_status on public.tasks(scope_id,status,created_at,id);
create index tasks_phase on public.tasks(phase_id) where phase_id is not null;

create table public.task_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid not null,
  scope_id uuid not null,
  previous_status text check (previous_status is null or previous_status in ('todo','in_progress','blocked','in_review','done','cancelled')),
  status text not null check (status in ('todo','in_progress','blocked','in_review','done','cancelled')),
  blocked_reason text,
  row_version integer not null check (row_version>0),
  actor_id uuid not null references auth.users(id) on delete restrict,
  occurred_at timestamptz not null default now(),
  foreign key (task_id) references public.tasks(id) on delete cascade,
  foreign key (scope_id,organization_id)
    references public.resource_scopes(id,organization_id) on delete cascade
);
create index task_history_task_time on public.task_history(task_id,occurred_at,id);
create index task_history_scope_time on public.task_history(scope_id,occurred_at,id);

alter table public.project_phases enable row level security;
alter table public.tasks enable row level security;
alter table public.task_history enable row level security;
revoke all on public.project_phases,public.tasks,public.task_history
  from public,anon,authenticated;
grant select on public.project_phases,public.tasks,public.task_history to authenticated;
grant all on public.project_phases,public.tasks,public.task_history to service_role;

create policy project_phase_read on public.project_phases for select to authenticated
  using (private_celeste.can_read_scope(project_id));
create policy task_scope_read on public.tasks for select to authenticated
  using (private_celeste.can_read_scope(scope_id));
create policy task_history_scope_read on public.task_history for select to authenticated
  using (exists (
    select 1 from public.tasks t
    where t.id=task_id
      and t.organization_id=organization_id
      and private_celeste.can_read_scope(t.scope_id)
  ));

create function private_celeste.validate_task_assignee()
returns trigger language plpgsql security definer set search_path='' as $function$
begin
  if not exists (
    select 1 from public.memberships m
    where m.organization_id=new.organization_id
      and m.user_id=new.assignee_id
      and m.status='active'
  ) then
    raise exception 'Assignee must be an active organization member' using errcode='23514';
  end if;
  return new;
end;
$function$;
revoke all on function private_celeste.validate_task_assignee()
  from public,anon,authenticated;
create trigger tasks_active_assignee
  before insert or update of organization_id,assignee_id on public.tasks
  for each row execute function private_celeste.validate_task_assignee();

create function private_celeste.create_project_phase(
  p_org uuid,p_project uuid,p_name text,p_start_on date,p_due_on date,p_status text
) returns uuid language plpgsql security definer set search_path='' as $function$
declare v_id uuid; v_actor uuid:=(select auth.uid());
begin
  perform 1 from public.organizations where id=p_org for update;
  if not private_celeste.can(p_org,'project.write') then
    raise exception 'Permission denied' using errcode='42501';
  end if;
  if p_name is null or char_length(btrim(p_name)) not between 2 and 100
    or p_status is null or p_status not in ('planned','active','done','cancelled')
    or (p_start_on is not null and p_due_on is not null and p_start_on>p_due_on)
    or not exists (
      select 1 from public.resource_scopes s
      where s.id=p_project and s.organization_id=p_org and s.kind='project'
    ) then
    raise exception 'Invalid project phase' using errcode='22023';
  end if;
  insert into public.project_phases(
    organization_id,project_id,name,start_on,due_on,status,created_by,updated_by
  ) values(p_org,p_project,btrim(p_name),p_start_on,p_due_on,p_status,v_actor,v_actor)
  returning id into v_id;
  insert into public.activity_events(organization_id,actor_id,action,resource_id)
  values(p_org,v_actor,'project_phase.created',v_id);
  return v_id;
end;
$function$;

create function private_celeste.create_task(
  p_org uuid,p_scope uuid,p_phase uuid,p_assignee uuid,p_title text,
  p_status text,p_priority text,p_due_on date,p_blocked_reason text
) returns uuid language plpgsql security definer set search_path='' as $function$
declare
  v_id uuid:=gen_random_uuid();
  v_actor uuid:=(select auth.uid());
  v_scope public.resource_scopes%rowtype;
  v_reason text:=nullif(btrim(p_blocked_reason),'');
begin
  perform 1 from public.organizations where id=p_org for update;
  if not private_celeste.can_write_task_scope(p_scope) then
    raise exception 'Permission denied' using errcode='42501';
  end if;
  select * into v_scope from public.resource_scopes
    where id=p_scope and organization_id=p_org;
  if v_scope.id is null
    or p_title is null or char_length(btrim(p_title)) not between 2 and 160
    or p_status is null or p_status not in ('todo','in_progress','blocked','in_review','done','cancelled')
    or p_priority is null or p_priority not in ('urgent','high','normal','low')
    or (p_status='blocked' and (v_reason is null or char_length(v_reason) not between 2 and 500))
    or (p_status<>'blocked' and v_reason is not null)
    or not exists (
      select 1 from public.memberships m
      where m.organization_id=p_org and m.user_id=p_assignee and m.status='active'
    )
    or (p_phase is not null and not exists (
      select 1 from public.project_phases ph
      where ph.id=p_phase and ph.organization_id=p_org and ph.project_id=v_scope.project_id
        and ph.status<>'cancelled'
    )) then
    raise exception 'Invalid task' using errcode='22023';
  end if;
  insert into public.tasks(
    id,organization_id,scope_id,project_id,scope_kind,phase_id,assignee_id,
    title,status,priority,due_on,blocked_reason,created_by,updated_by
  ) values(
    v_id,p_org,p_scope,v_scope.project_id,v_scope.kind,p_phase,p_assignee,
    btrim(p_title),p_status,p_priority,p_due_on,v_reason,v_actor,v_actor
  );
  insert into public.task_history(
    organization_id,task_id,scope_id,previous_status,status,blocked_reason,row_version,actor_id
  ) values(p_org,v_id,p_scope,null,p_status,v_reason,1,v_actor);
  insert into public.activity_events(organization_id,actor_id,action,resource_id,subject_user_id)
  values(p_org,v_actor,'task.created',v_id,p_assignee);
  return v_id;
end;
$function$;

create function private_celeste.update_task(
  p_task uuid,p_expected_version integer,p_scope uuid,p_phase uuid,p_assignee uuid,
  p_title text,p_status text,p_priority text,p_due_on date,p_blocked_reason text
) returns integer language plpgsql security definer set search_path='' as $function$
declare
  v_task public.tasks%rowtype;
  v_scope public.resource_scopes%rowtype;
  v_actor uuid:=(select auth.uid());
  v_reason text:=nullif(btrim(p_blocked_reason),'');
  v_version integer;
begin
  select * into v_task from public.tasks where id=p_task for update;
  if v_task.id is null then
    raise exception 'Task not found' using errcode='22023';
  end if;
  perform 1 from public.organizations where id=v_task.organization_id for update;
  if not private_celeste.can_write_task_scope(v_task.scope_id)
    or not private_celeste.can_write_task_scope(p_scope) then
    raise exception 'Permission denied' using errcode='42501';
  end if;
  if p_expected_version is null or v_task.row_version<>p_expected_version then
    raise exception 'Task changed; reload' using errcode='40001';
  end if;
  select * into v_scope from public.resource_scopes
    where id=p_scope and organization_id=v_task.organization_id;
  if v_scope.id is null
    or p_title is null or char_length(btrim(p_title)) not between 2 and 160
    or p_status is null or p_status not in ('todo','in_progress','blocked','in_review','done','cancelled')
    or p_priority is null or p_priority not in ('urgent','high','normal','low')
    or (p_status='blocked' and (v_reason is null or char_length(v_reason) not between 2 and 500))
    or (p_status<>'blocked' and v_reason is not null)
    or not exists (
      select 1 from public.memberships m
      where m.organization_id=v_task.organization_id and m.user_id=p_assignee and m.status='active'
    )
    or (p_phase is not null and not exists (
      select 1 from public.project_phases ph
      where ph.id=p_phase and ph.organization_id=v_task.organization_id
        and ph.project_id=v_scope.project_id and ph.status<>'cancelled'
    )) then
    raise exception 'Invalid task' using errcode='22023';
  end if;
  update public.tasks set
    scope_id=p_scope,project_id=v_scope.project_id,scope_kind=v_scope.kind,
    phase_id=p_phase,assignee_id=p_assignee,title=btrim(p_title),status=p_status,
    priority=p_priority,due_on=p_due_on,blocked_reason=v_reason,
    row_version=row_version+1,updated_by=v_actor,updated_at=now()
  where id=v_task.id returning row_version into v_version;
  insert into public.task_history(
    organization_id,task_id,scope_id,previous_status,status,blocked_reason,row_version,actor_id
  ) values(
    v_task.organization_id,v_task.id,p_scope,v_task.status,p_status,v_reason,v_version,v_actor
  );
  insert into public.activity_events(organization_id,actor_id,action,resource_id,subject_user_id)
  values(v_task.organization_id,v_actor,'task.updated',v_task.id,p_assignee);
  return v_version;
end;
$function$;

create function private_celeste.set_scope_task_write(
  p_org uuid,p_scope uuid,p_user uuid,p_allowed boolean,p_expected_version integer
) returns integer language plpgsql security definer set search_path='' as $function$
declare
  v_kind text;
  v_member public.memberships%rowtype;
  v_grant private_celeste.scope_grants%rowtype;
  v_version integer;
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
    raise exception 'Invalid task access' using errcode='22023';
  end if;
  if v_grant.row_version<>p_expected_version then
    raise exception 'Scope access changed; reload' using errcode='40001';
  end if;
  update private_celeste.scope_grants
    set task_write=p_allowed,row_version=row_version+1
    where scope_id=p_scope and user_id=p_user
    returning row_version into v_version;
  insert into public.activity_events(organization_id,actor_id,action,resource_id,subject_user_id)
  values(
    p_org,(select auth.uid()),
    case when p_allowed then 'scope.task_write_granted' else 'scope.task_write_revoked' end,
    p_scope,p_user
  );
  return v_version;
end;
$function$;

create or replace function private_celeste.set_scope_access(
  p_org uuid,p_scope uuid,p_user uuid,p_granted boolean,p_expected_version integer
) returns integer language plpgsql security definer set search_path='' as $function$
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
  insert into private_celeste.scope_grants(
    organization_id,scope_id,user_id,granted,file_write,task_write,row_version
  ) values(p_org,p_scope,p_user,p_granted,false,false,1)
  on conflict (scope_id,user_id) do update set
    granted=excluded.granted,
    file_write=case when excluded.granted then scope_grants.file_write else false end,
    task_write=case when excluded.granted then scope_grants.task_write else false end,
    row_version=scope_grants.row_version+1
  returning row_version into v_version;
  insert into public.activity_events(organization_id,actor_id,action,resource_id,subject_user_id)
  values(
    p_org,(select auth.uid()),
    case when p_granted then 'scope.access_granted' else 'scope.access_revoked' end,
    p_scope,p_user
  );
  return v_version;
end;
$function$;

drop function public.list_scope_access(uuid);
drop function private_celeste.list_scope_access(uuid);
create function private_celeste.list_scope_access(p_org uuid)
returns table(
  scope_id uuid,user_id uuid,granted boolean,file_write boolean,task_write boolean,row_version integer
) language plpgsql stable security definer set search_path='' as $function$
begin
  if not private_celeste.can(p_org,'membership.manage') then
    raise exception 'Permission denied' using errcode='42501';
  end if;
  return query
    select g.scope_id,g.user_id,g.granted,g.file_write,g.task_write,g.row_version
    from private_celeste.scope_grants g where g.organization_id=p_org;
end;
$function$;

create function public.create_project_phase(
  p_org uuid,p_project uuid,p_name text,p_start_on date,p_due_on date,p_status text
) returns uuid language sql security definer set search_path='' as $function$
  select private_celeste.create_project_phase(p_org,p_project,p_name,p_start_on,p_due_on,p_status);
$function$;
create function public.create_task(
  p_org uuid,p_scope uuid,p_phase uuid,p_assignee uuid,p_title text,
  p_status text,p_priority text,p_due_on date,p_blocked_reason text
) returns uuid language sql security definer set search_path='' as $function$
  select private_celeste.create_task(
    p_org,p_scope,p_phase,p_assignee,p_title,p_status,p_priority,p_due_on,p_blocked_reason
  );
$function$;
create function public.update_task(
  p_task uuid,p_expected_version integer,p_scope uuid,p_phase uuid,p_assignee uuid,
  p_title text,p_status text,p_priority text,p_due_on date,p_blocked_reason text
) returns integer language sql security definer set search_path='' as $function$
  select private_celeste.update_task(
    p_task,p_expected_version,p_scope,p_phase,p_assignee,p_title,p_status,p_priority,p_due_on,p_blocked_reason
  );
$function$;
create function public.set_scope_task_write(
  p_org uuid,p_scope uuid,p_user uuid,p_allowed boolean,p_expected_version integer
) returns integer language sql security definer set search_path='' as $function$
  select private_celeste.set_scope_task_write(p_org,p_scope,p_user,p_allowed,p_expected_version);
$function$;
create function public.can_write_task_scope(p_scope uuid)
returns boolean language sql stable security definer set search_path='' as $function$
  select private_celeste.can_write_task_scope(p_scope);
$function$;
create function public.list_scope_access(p_org uuid)
returns table(
  scope_id uuid,user_id uuid,granted boolean,file_write boolean,task_write boolean,row_version integer
) language sql stable security definer set search_path='' as $function$
  select * from private_celeste.list_scope_access(p_org);
$function$;

revoke all on function
  private_celeste.create_project_phase(uuid,uuid,text,date,date,text),
  private_celeste.create_task(uuid,uuid,uuid,uuid,text,text,text,date,text),
  private_celeste.update_task(uuid,integer,uuid,uuid,uuid,text,text,text,date,text),
  private_celeste.set_scope_task_write(uuid,uuid,uuid,boolean,integer),
  private_celeste.list_scope_access(uuid),
  public.create_project_phase(uuid,uuid,text,date,date,text),
  public.create_task(uuid,uuid,uuid,uuid,text,text,text,date,text),
  public.update_task(uuid,integer,uuid,uuid,uuid,text,text,text,date,text),
  public.set_scope_task_write(uuid,uuid,uuid,boolean,integer),
  public.can_write_task_scope(uuid),
  public.list_scope_access(uuid)
from public,anon,authenticated;
grant execute on function
  public.create_project_phase(uuid,uuid,text,date,date,text),
  public.create_task(uuid,uuid,uuid,uuid,text,text,text,date,text),
  public.update_task(uuid,integer,uuid,uuid,uuid,text,text,text,date,text),
  public.set_scope_task_write(uuid,uuid,uuid,boolean,integer),
  public.can_write_task_scope(uuid),
  public.list_scope_access(uuid)
to authenticated;
