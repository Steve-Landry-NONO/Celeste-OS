"use client";

import { useActionState, useMemo, useState } from "react";
import type { FormState } from "../../auth/actions";
import { createProjectPhase, createTask, updateTaskStatus } from "./actions";

type Scope = { id: string; name: string; kind: string; project_id: string };
type Phase = { id: string; project_id: string; name: string; status: string };
type Assignee = { user_id: string; display_name: string };
type Task = {
  id: string; scope_id: string; phase_id: string | null; assignee_id: string;
  title: string; status: string; priority: string; due_on: string | null;
  blocked_reason: string | null; row_version: number;
};

function Status({ state }: { state: FormState }) {
  return <>{state.error && <p role="alert">{state.error}</p>}{state.message && <p role="status">{state.message}</p>}</>;
}

export function PhaseForm({ organization, projects }: { organization: string; projects: Scope[] }) {
  const [state, action, pending] = useActionState(createProjectPhase, {});
  return <form action={action} className="auth-form" aria-label="Créer une phase">
    <input type="hidden" name="organization_id" value={organization} />
    <label>Projet<select name="project_id" required defaultValue=""><option value="" disabled>Choisir un projet</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
    <label>Nom de la phase<input name="name" required minLength={2} maxLength={100} /></label>
    <label>État<select name="status" defaultValue="planned"><option value="planned">Planifiée</option><option value="active">Active</option><option value="done">Terminée</option><option value="cancelled">Annulée</option></select></label>
    <label>Début<input name="start_on" type="date" /></label>
    <label>Échéance<input name="due_on" type="date" /></label>
    <Status state={state} />
    <button className="secondary-button" disabled={pending || projects.length === 0}>{pending ? "Création…" : "Créer la phase"}</button>
  </form>;
}

export function TaskForm({ organization, scopes, phases, assignees }: { organization: string; scopes: Scope[]; phases: Phase[]; assignees: Assignee[] }) {
  const [state, action, pending] = useActionState(createTask, {});
  const [scopeId, setScopeId] = useState(scopes[0]?.id ?? "");
  const [status, setStatus] = useState("todo");
  const scope = scopes.find((item) => item.id === scopeId);
  const matchingPhases = useMemo(() => phases.filter((phase) => phase.project_id === scope?.project_id && phase.status !== "cancelled"), [phases, scope?.project_id]);
  return <form action={action} className="auth-form" aria-label="Créer une tâche">
    <input type="hidden" name="organization_id" value={organization} />
    <label>Périmètre<select name="scope_id" required value={scopeId} onChange={(event) => setScopeId(event.target.value)}>{scopes.map((item) => <option key={item.id} value={item.id}>{item.kind === "project" ? "Projet" : "Mission"} · {item.name}</option>)}</select></label>
    <label>Phase<select name="phase_id" defaultValue=""><option value="">Sans phase</option>{matchingPhases.map((phase) => <option key={phase.id} value={phase.id}>{phase.name}</option>)}</select></label>
    <label>Responsable unique<select name="assignee_id" required defaultValue={assignees[0]?.user_id ?? ""}>{assignees.map((person) => <option key={person.user_id} value={person.user_id}>{person.display_name}</option>)}</select></label>
    <label>Titre<input name="title" required minLength={2} maxLength={160} /></label>
    <label>Priorité<select name="priority" defaultValue="normal"><option value="urgent">Urgente</option><option value="high">Haute</option><option value="normal">Normale</option><option value="low">Basse</option></select></label>
    <label>État<select name="status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="todo">À faire</option><option value="in_progress">En cours</option><option value="blocked">Bloquée</option><option value="in_review">À valider</option><option value="done">Terminée</option><option value="cancelled">Annulée</option></select></label>
    <label>Échéance<input name="due_on" type="date" /></label>
    {status === "blocked" && <label>Motif du blocage<textarea name="blocked_reason" required minLength={2} maxLength={500} /></label>}
    <Status state={state} />
    <button className="primary-button" disabled={pending || scopes.length === 0 || assignees.length === 0}>{pending ? "Création…" : "Créer la tâche"}</button>
  </form>;
}

export function TaskStatusForm({ task }: { task: Task }) {
  const [state, action, pending] = useActionState(updateTaskStatus, {});
  const [status, setStatus] = useState(task.status);
  return <form action={action} className="auth-form" aria-label={`Mettre à jour ${task.title}`}>
    <input type="hidden" name="task_id" value={task.id} /><input type="hidden" name="scope_id" value={task.scope_id} />
    <input type="hidden" name="phase_id" value={task.phase_id ?? ""} /><input type="hidden" name="assignee_id" value={task.assignee_id} />
    <input type="hidden" name="title" value={task.title} /><input type="hidden" name="priority" value={task.priority} />
    <input type="hidden" name="due_on" value={task.due_on ?? ""} /><input type="hidden" name="row_version" value={task.row_version} />
    <label>État<select name="status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="todo">À faire</option><option value="in_progress">En cours</option><option value="blocked">Bloquée</option><option value="in_review">À valider</option><option value="done">Terminée</option><option value="cancelled">Annulée</option></select></label>
    {status === "blocked" && <label>Motif du blocage<textarea name="blocked_reason" required minLength={2} maxLength={500} defaultValue={task.blocked_reason ?? ""} /></label>}
    <Status state={state} />
    <button className="secondary-button" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer l’état"}</button>
  </form>;
}
