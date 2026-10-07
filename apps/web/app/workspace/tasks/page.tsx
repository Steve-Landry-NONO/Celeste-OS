import Link from "next/link";
import { redirect } from "next/navigation";
import { buildTodayView, projectProgress } from "@celeste/domain";
import type { TodayScope, WorkTask } from "@celeste/domain";
import { createServerSupabase } from "../../../lib/supabase/server";
import { supabaseConfig } from "../../../lib/supabase/config";
import { PhaseForm, TaskForm, TaskStatusForm } from "./forms";

export const dynamic = "force-dynamic";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const statusLabels: Record<string, string> = { todo: "À faire", in_progress: "En cours", blocked: "Bloquée", in_review: "À valider", done: "Terminée", cancelled: "Annulée" };
const timingLabels = { overdue: "En retard", today: "Aujourd’hui", upcoming: "À venir", unscheduled: "Sans échéance" };

function civilToday(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ organization?: string }> }) {
  if (!supabaseConfig()) return <section className="panel"><h1>Connexion à préparer</h1><p>Configurez cet environnement pour consulter les tâches persistées.</p></section>;
  const client = await createServerSupabase();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) redirect("/login");
  const { organization: org } = await searchParams;
  if (!org || !uuid.test(org)) redirect("/workspace");
  const [actor, organization, scopes, phases, tasks, profile] = await Promise.all([
    client.from("memberships").select("role,status").eq("organization_id", org).eq("user_id", user.id).maybeSingle(),
    client.from("organizations").select("name,timezone").eq("id", org).maybeSingle(),
    client.from("resource_scopes").select("id,kind,name,parent_project_id,project_id").eq("organization_id", org).order("created_at").order("id"),
    client.from("project_phases").select("id,project_id,name,status,start_on,due_on").eq("organization_id", org).order("created_at").order("id"),
    client.from("tasks").select("id,organization_id,scope_id,project_id,scope_kind,phase_id,assignee_id,title,status,priority,due_on,blocked_reason,row_version,created_at").eq("organization_id", org).order("created_at").order("id"),
    client.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
  ]);
  if (actor.error || organization.error || scopes.error || phases.error || tasks.error || profile.error) return <section className="notice" role="alert"><p>Les tâches sont indisponibles. Rechargez la page dans un instant.</p></section>;
  if (!organization.data || actor.data?.status !== "active") return <section className="panel"><h1>Accès réservé</h1><p>Vous n’avez pas accès à cet espace.</p><Link href="/workspace">Retour à mes espaces</Link></section>;

  const visibleScopes = scopes.data ?? [];
  const writeChecks = await Promise.all(visibleScopes.map(async (scope) => {
    const result = await client.rpc("can_write_task_scope", { p_scope: scope.id });
    return [scope.id, !result.error && result.data === true] as const;
  }));
  const writable = new Map(writeChecks);
  const writableScopes = visibleScopes.filter((scope) => writable.get(scope.id));
  const isAdmin = actor.data.role === "founder_admin";
  let assignees: { user_id: string; display_name: string }[];
  if (isAdmin) {
    const members = await client.rpc("list_organization_members", { p_org: org });
    if (members.error) return <section className="notice" role="alert"><p>Les responsables disponibles sont indisponibles. Rechargez la page.</p></section>;
    assignees = (members.data ?? []).filter((member) => member.status === "active").map((member) => ({ user_id: member.user_id, display_name: member.display_name }));
  } else {
    assignees = [{ user_id: user.id, display_name: profile.data?.display_name ?? "Moi" }];
  }

  const workTasks: WorkTask[] = (tasks.data ?? []).map((task) => ({
    id: task.id, organizationId: task.organization_id, projectId: task.project_id,
    ...(task.scope_kind === "mission" ? { missionId: task.scope_id } : {}),
    assigneeId: task.assignee_id, title: task.title, status: task.status,
    priority: task.priority, ...(task.due_on ? { dueDate: task.due_on } : {}),
    createdAt: new Date(task.created_at).toISOString(), ...(task.blocked_reason ? { blockedReason: task.blocked_reason } : {}),
  }));
  const todayScope: TodayScope = {
    organizationId: org, actorId: user.id,
    projectIds: visibleScopes.filter((scope) => scope.kind === "project").map((scope) => scope.id),
    missionIds: visibleScopes.filter((scope) => scope.kind === "mission").map((scope) => scope.id),
  };
  const today = buildTodayView(workTasks, todayScope, civilToday(organization.data.timezone));
  const projects = visibleScopes.filter((scope) => scope.kind === "project");
  const scopeNames = new Map(visibleScopes.map((scope) => [scope.id, scope.name]));
  const phaseNames = new Map((phases.data ?? []).map((phase) => [phase.id, phase.name]));

  return <>
    <div className="page-heading"><Link href="/workspace">← Mes espaces</Link><p className="eyebrow">TRAVAIL PERSISTÉ</p><h1>Aujourd’hui,<br /><em>{organization.data.name}.</em></h1><p className="lead">La liste et les compteurs utilisent les mêmes périmètres autorisés. Les tâches terminées ou annulées sortent de votre attention.</p></div>
    <section className="today-summary" aria-label="Résumé du jour"><div><span>À traiter</span><strong data-testid="workspace-today-total">{today.counts.total}</strong></div><div><span>En retard</span><strong>{today.counts.overdue}</strong></div><div><span>À valider</span><strong>{today.counts.inReview}</strong></div><div><span>Bloquée</span><strong>{today.counts.blocked}</strong></div></section>
    <div className="today-layout"><section className="panel today-panel"><div className="section-heading"><div><p className="eyebrow">MON ATTENTION</p><h2>Tâches prioritaires</h2></div><span className="badge">{today.counts.today} aujourd’hui</span></div>
      {today.items.length ? <ol className="task-list">{today.items.map(({ task, timing }) => <li key={task.id} data-testid="workspace-today-task"><span className={`task-dot priority-${task.priority}`} aria-hidden="true" /><div className="task-copy"><strong>{task.title}</strong><span>{statusLabels[task.status]} · {scopeNames.get(task.missionId ?? task.projectId)}</span>{task.blockedReason && <small>{task.blockedReason}</small>}</div><span className={`timing timing-${timing}`}>{timingLabels[timing]}</span></li>)}</ol> : <p>Aucune tâche ne réclame votre attention. Créez une tâche autorisée ou profitez de cette vue vide.</p>}
    </section><aside className="today-side"><section className="panel"><p className="eyebrow">PROJETS VISIBLES</p><h2>Progression calculée</h2><div className="project-progress-list">{projects.map((project) => { const progress = projectProgress(workTasks, todayScope, project.id); return <div key={project.id}><span>{project.name}<strong>{progress === null ? "Non calculée" : `${progress} %`}</strong></span>{progress !== null && <progress value={progress} max="100">{progress} %</progress>}</div>; })}</div>{projects.length === 0 && <p>Aucun projet visible.</p>}</section></aside></div>

    {isAdmin && <section className="panel auth-panel"><p className="eyebrow">ROADMAP</p><h2>Créer une phase</h2><PhaseForm organization={org} projects={projects} /></section>}
    {writableScopes.length > 0 && <section className="panel auth-panel"><p className="eyebrow">ACTION</p><h2>Créer une tâche</h2><TaskForm organization={org} scopes={writableScopes} phases={phases.data ?? []} assignees={assignees} /></section>}
    <section className="cards" aria-label="Tâches accessibles">{(tasks.data ?? []).map((task) => <article className="card" key={task.id} data-task-id={task.id}><p className="eyebrow">{task.priority} · {scopeNames.get(task.scope_id)}</p><h2>{task.title}</h2><p>{statusLabels[task.status]} · {task.due_on ?? "Sans échéance"}{task.phase_id ? ` · ${phaseNames.get(task.phase_id) ?? "Phase"}` : ""}</p>{task.blocked_reason && <p>{task.blocked_reason}</p>}{writable.get(task.scope_id) && <TaskStatusForm task={task} />}</article>)}</section>
    {!tasks.data?.length && <section className="notice"><p>Aucune tâche accessible pour le moment.</p></section>}
  </>;
}
