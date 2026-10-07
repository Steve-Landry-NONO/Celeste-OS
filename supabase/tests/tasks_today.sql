begin;
create or replace function pg_temp.assert_ok(p_ok boolean,p_message text)
returns void language plpgsql as $$
begin
  if p_ok is distinct from true then raise exception '%',p_message; end if;
end;
$$;

select set_config('test.task_owner',gen_random_uuid()::text,true);
select set_config('test.task_member',gen_random_uuid()::text,true);
select set_config('test.task_vendor',gen_random_uuid()::text,true);
select set_config('test.task_other',gen_random_uuid()::text,true);
insert into auth.users(id,email)
select current_setting('test.task_'||actor)::uuid,
  actor||'-'||current_setting('test.task_'||actor)||'@celeste-test.invalid'
from unnest(array['owner','member','vendor','other']) actor;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub',current_setting('test.task_owner'),'role','authenticated')::text,
  true
);
select set_config('test.task_org',public.create_organization('Tâches A')::text,true);
select public.manage_membership(
  current_setting('test.task_org')::uuid,current_setting('test.task_member')::uuid,
  'member','active',0
);
select public.manage_membership(
  current_setting('test.task_org')::uuid,current_setting('test.task_vendor')::uuid,
  'vendor','active',0
);
select set_config(
  'test.task_project',
  public.create_resource_scope(current_setting('test.task_org')::uuid,'project','Projet pilote',null)::text,
  true
);
select set_config(
  'test.task_mission',
  public.create_resource_scope(
    current_setting('test.task_org')::uuid,'mission','Mission pilote',
    current_setting('test.task_project')::uuid
  )::text,
  true
);
select set_config(
  'test.task_phase',
  public.create_project_phase(
    current_setting('test.task_org')::uuid,current_setting('test.task_project')::uuid,
    'Préparation','2026-10-01','2026-10-10','active'
  )::text,
  true
);
select set_config(
  'test.task_admin_task',
  public.create_task(
    current_setting('test.task_org')::uuid,current_setting('test.task_project')::uuid,
    current_setting('test.task_phase')::uuid,current_setting('test.task_owner')::uuid,
    'Préparer la recette','todo','urgent','2026-10-07',null
  )::text,
  true
);
select pg_temp.assert_ok(
  (select count(*)=1 from public.tasks where id=current_setting('test.task_admin_task')::uuid),
  'Admin creates one persisted task'
);
select pg_temp.assert_ok(
  (select count(*)=1 from public.task_history where task_id=current_setting('test.task_admin_task')::uuid),
  'Task creation has one persisted history event'
);

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub',current_setting('test.task_member'),'role','authenticated',
    'user_metadata',json_build_object('role','founder_admin')
  )::text,
  true
);
select pg_temp.assert_ok((select count(*)=0 from public.tasks),'Member denied before scope grant');
do $$
begin
  begin
    perform public.create_task(
      current_setting('test.task_org')::uuid,current_setting('test.task_project')::uuid,
      null,current_setting('test.task_member')::uuid,'Droit forgé','todo','normal',null,null
    );
    raise exception 'Readless member created task';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.tasks(
      organization_id,scope_id,project_id,scope_kind,assignee_id,title,status,priority,created_by,updated_by
    ) values(
      current_setting('test.task_org')::uuid,current_setting('test.task_project')::uuid,
      current_setting('test.task_project')::uuid,'project',current_setting('test.task_member')::uuid,
      'Écriture directe','todo','normal',auth.uid(),auth.uid()
    );
    raise exception 'Direct task insert permitted';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config(
  'request.jwt.claims',
  json_build_object('sub',current_setting('test.task_owner'),'role','authenticated')::text,
  true
);
select pg_temp.assert_ok(
  public.set_scope_access(
    current_setting('test.task_org')::uuid,current_setting('test.task_project')::uuid,
    current_setting('test.task_member')::uuid,true,0
  )=1,
  'Project read grant version one'
);
select set_config(
  'request.jwt.claims',
  json_build_object('sub',current_setting('test.task_member'),'role','authenticated')::text,
  true
);
select pg_temp.assert_ok((select count(*)=1 from public.tasks),'Read grant exposes project task');
select pg_temp.assert_ok(not public.can_write_task_scope(current_setting('test.task_project')::uuid),'Read alone is not task write');
do $$
begin
  begin
    perform public.create_task(
      current_setting('test.task_org')::uuid,current_setting('test.task_project')::uuid,
      null,current_setting('test.task_member')::uuid,'Lecture seule','todo','normal',null,null
    );
    raise exception 'Read-only member created task';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config(
  'request.jwt.claims',
  json_build_object('sub',current_setting('test.task_owner'),'role','authenticated')::text,
  true
);
select pg_temp.assert_ok(
  public.set_scope_task_write(
    current_setting('test.task_org')::uuid,current_setting('test.task_project')::uuid,
    current_setting('test.task_member')::uuid,true,1
  )=2,
  'Task write grant increments shared scope version'
);
select set_config(
  'request.jwt.claims',
  json_build_object('sub',current_setting('test.task_member'),'role','authenticated')::text,
  true
);
select pg_temp.assert_ok(public.can_write_task_scope(current_setting('test.task_project')::uuid),'Explicit task write effective');
select set_config(
  'test.task_member_task',
  public.create_task(
    current_setting('test.task_org')::uuid,current_setting('test.task_project')::uuid,
    current_setting('test.task_phase')::uuid,current_setting('test.task_member')::uuid,
    'Relire le parcours','in_progress','high','2026-10-06',null
  )::text,
  true
);
do $$
begin
  begin
    perform public.create_task(
      current_setting('test.task_org')::uuid,current_setting('test.task_project')::uuid,
      null,current_setting('test.task_owner')::uuid,'Assigner sans droit','todo','normal',null,null
    );
    raise exception 'Delegated writer assigned another member';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.create_task(
      current_setting('test.task_org')::uuid,current_setting('test.task_project')::uuid,
      null,current_setting('test.task_member')::uuid,'Tâche bloquée','blocked','normal',null,null
    );
    raise exception 'Blocked task without reason accepted';
  exception when invalid_parameter_value then null;
  end;
end;
$$;
select pg_temp.assert_ok(
  public.update_task(
    current_setting('test.task_member_task')::uuid,1,current_setting('test.task_project')::uuid,
    current_setting('test.task_phase')::uuid,current_setting('test.task_member')::uuid,
    'Relire le parcours','blocked','high','2026-10-06','Dépendance indisponible'
  )=2,
  'Task becomes blocked with a reason'
);
select pg_temp.assert_ok(
  (select count(*)=2 from public.task_history where task_id=current_setting('test.task_member_task')::uuid),
  'Creation and update history persisted'
);
do $$
begin
  begin
    perform public.update_task(
      current_setting('test.task_member_task')::uuid,1,current_setting('test.task_project')::uuid,
      current_setting('test.task_phase')::uuid,current_setting('test.task_member')::uuid,
      'Écrasement obsolète','done','normal',null,null
    );
    raise exception 'Stale task update accepted';
  exception when serialization_failure then null;
  end;
  begin
    update public.tasks set title='Écriture directe';
    raise exception 'Direct task update permitted';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.task_history;
    raise exception 'Task history delete permitted';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config(
  'request.jwt.claims',
  json_build_object('sub',current_setting('test.task_owner'),'role','authenticated')::text,
  true
);
select public.set_scope_access(
  current_setting('test.task_org')::uuid,current_setting('test.task_mission')::uuid,
  current_setting('test.task_vendor')::uuid,true,0
);
select pg_temp.assert_ok(
  public.set_scope_task_write(
    current_setting('test.task_org')::uuid,current_setting('test.task_mission')::uuid,
    current_setting('test.task_vendor')::uuid,true,1
  )=2,
  'Vendor task write limited to granted mission'
);
select set_config(
  'request.jwt.claims',
  json_build_object('sub',current_setting('test.task_vendor'),'role','authenticated')::text,
  true
);
select set_config(
  'test.task_vendor_task',
  public.create_task(
    current_setting('test.task_org')::uuid,current_setting('test.task_mission')::uuid,
    null,current_setting('test.task_vendor')::uuid,
    'Livrer la maquette','in_review','normal','2026-10-08',null
  )::text,
  true
);
select pg_temp.assert_ok((select count(*)=1 from public.tasks),'Vendor reads only mission task');
select pg_temp.assert_ok((select count(*)=0 from public.project_phases),'Vendor does not inherit project phase read');
select pg_temp.assert_ok(not public.can_write_task_scope(current_setting('test.task_project')::uuid),'Vendor cannot write parent project');

select set_config(
  'request.jwt.claims',
  json_build_object('sub',current_setting('test.task_other'),'role','authenticated')::text,
  true
);
select set_config('test.task_other_org',public.create_organization('Tâches B')::text,true);
select set_config(
  'test.task_other_project',
  public.create_resource_scope(current_setting('test.task_other_org')::uuid,'project','Projet étranger',null)::text,
  true
);
do $$
begin
  begin
    perform public.create_project_phase(
      current_setting('test.task_org')::uuid,current_setting('test.task_other_project')::uuid,
      'Phase étrangère',null,null,'planned'
    );
    raise exception 'Cross-organization phase accepted';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config(
  'request.jwt.claims',
  json_build_object('sub',current_setting('test.task_owner'),'role','authenticated')::text,
  true
);
select pg_temp.assert_ok(
  public.set_scope_access(
    current_setting('test.task_org')::uuid,current_setting('test.task_project')::uuid,
    current_setting('test.task_member')::uuid,false,2
  )=3,
  'Read revocation clears task write atomically'
);
select set_config(
  'request.jwt.claims',
  json_build_object('sub',current_setting('test.task_member'),'role','authenticated')::text,
  true
);
select pg_temp.assert_ok((select count(*)=0 from public.tasks),'Revocation hides tasks without token refresh');
select pg_temp.assert_ok(not public.can_write_task_scope(current_setting('test.task_project')::uuid),'Revocation removes task write');

reset role;
rollback;
select 'Task and Today persistence scenarios passed; fixtures rolled back' as result;
