"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "../../../lib/supabase/server";
import type { FormState } from "../../auth/actions";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const civilDate = /^\d{4}-\d{2}-\d{2}$/;
const phaseStatuses = new Set(["planned", "active", "done", "cancelled"]);
const taskStatuses = new Set(["todo", "in_progress", "blocked", "in_review", "done", "cancelled"]);
const priorities = new Set(["urgent", "high", "normal", "low"]);

function optionalDate(value: FormDataEntryValue | null): string | null | undefined {
  const text = String(value ?? "").trim();
  if (!text) return null;
  return civilDate.test(text) ? text : undefined;
}

async function authenticatedClient() {
  const client = await createServerSupabase(true);
  const { data: { user }, error } = await client.auth.getUser();
  return error || !user ? null : client;
}

export async function createProjectPhase(_state: FormState, form: FormData): Promise<FormState> {
  const org = String(form.get("organization_id") ?? "");
  const project = String(form.get("project_id") ?? "");
  const name = String(form.get("name") ?? "").trim();
  const status = String(form.get("status") ?? "");
  const startOn = optionalDate(form.get("start_on"));
  const dueOn = optionalDate(form.get("due_on"));
  if (!uuid.test(org) || !uuid.test(project) || name.length < 2 || name.length > 100
    || !phaseStatuses.has(status) || startOn === undefined || dueOn === undefined
    || (startOn && dueOn && startOn > dueOn)) {
    return { error: "Vérifiez le projet, le nom, l’état et les dates de la phase." };
  }
  try {
    const client = await authenticatedClient();
    if (!client) return { error: "Votre session a expiré. Reconnectez-vous." };
    const { error } = await client.rpc("create_project_phase", {
      p_org: org, p_project: project, p_name: name,
      p_start_on: startOn, p_due_on: dueOn, p_status: status,
    });
    if (error?.code === "42501") return { error: "Vous ne pouvez pas gérer les phases de ce projet." };
    if (error) return { error: "Phase refusée. Vérifiez le projet et les dates." };
  } catch {
    return { error: "Le service est indisponible. Réessayez dans un moment." };
  }
  revalidatePath("/workspace/tasks");
  return { message: "Phase créée." };
}

export async function createTask(_state: FormState, form: FormData): Promise<FormState> {
  const org = String(form.get("organization_id") ?? "");
  const scope = String(form.get("scope_id") ?? "");
  const phaseRaw = String(form.get("phase_id") ?? "");
  const assignee = String(form.get("assignee_id") ?? "");
  const title = String(form.get("title") ?? "").trim();
  const status = String(form.get("status") ?? "");
  const priority = String(form.get("priority") ?? "");
  const dueOn = optionalDate(form.get("due_on"));
  const reason = String(form.get("blocked_reason") ?? "").trim();
  if (![org, scope, assignee].every((value) => uuid.test(value))
    || (phaseRaw !== "" && !uuid.test(phaseRaw))
    || title.length < 2 || title.length > 160
    || !taskStatuses.has(status) || !priorities.has(priority) || dueOn === undefined
    || (status === "blocked" ? reason.length < 2 || reason.length > 500 : reason.length > 0)) {
    return { error: "Vérifiez le périmètre, le responsable, l’état et les détails de la tâche." };
  }
  try {
    const client = await authenticatedClient();
    if (!client) return { error: "Votre session a expiré. Reconnectez-vous." };
    const { error } = await client.rpc("create_task", {
      p_org: org, p_scope: scope, p_phase: phaseRaw || null, p_assignee: assignee,
      p_title: title, p_status: status, p_priority: priority, p_due_on: dueOn,
      p_blocked_reason: reason || null,
    });
    if (error?.code === "42501") return { error: "Vous n’avez pas le droit d’écrire des tâches dans ce périmètre." };
    if (error) return { error: "Tâche refusée. Rechargez la page et vérifiez le périmètre, la phase et le responsable." };
  } catch {
    return { error: "Le service est indisponible. Réessayez dans un moment." };
  }
  revalidatePath("/workspace/tasks");
  return { message: "Tâche créée et historisée." };
}

export async function updateTaskStatus(_state: FormState, form: FormData): Promise<FormState> {
  const task = String(form.get("task_id") ?? "");
  const scope = String(form.get("scope_id") ?? "");
  const phaseRaw = String(form.get("phase_id") ?? "");
  const assignee = String(form.get("assignee_id") ?? "");
  const title = String(form.get("title") ?? "").trim();
  const status = String(form.get("status") ?? "");
  const priority = String(form.get("priority") ?? "");
  const dueOn = optionalDate(form.get("due_on"));
  const reason = String(form.get("blocked_reason") ?? "").trim();
  const rawVersion = String(form.get("row_version") ?? "");
  const version = Number(rawVersion);
  if (![task, scope, assignee].every((value) => uuid.test(value))
    || (phaseRaw !== "" && !uuid.test(phaseRaw))
    || !/^[1-9]\d*$/.test(rawVersion) || !Number.isSafeInteger(version)
    || title.length < 2 || title.length > 160
    || !taskStatuses.has(status) || !priorities.has(priority) || dueOn === undefined
    || (status === "blocked" ? reason.length < 2 || reason.length > 500 : reason.length > 0)) {
    return { error: "Mise à jour invalide. Rechargez la page." };
  }
  try {
    const client = await authenticatedClient();
    if (!client) return { error: "Votre session a expiré. Reconnectez-vous." };
    const { error } = await client.rpc("update_task", {
      p_task: task, p_expected_version: version, p_scope: scope,
      p_phase: phaseRaw || null, p_assignee: assignee, p_title: title,
      p_status: status, p_priority: priority, p_due_on: dueOn,
      p_blocked_reason: reason || null,
    });
    if (error?.code === "40001") return { error: "Cette tâche a changé dans une autre session. Rechargez la page." };
    if (error?.code === "42501") return { error: "Vous n’avez plus le droit de modifier cette tâche." };
    if (error) return { error: "Mise à jour refusée. Vérifiez l’état et le motif de blocage." };
  } catch {
    return { error: "Le service est indisponible. Réessayez dans un moment." };
  }
  revalidatePath("/workspace/tasks");
  return { message: "Tâche mise à jour et historisée." };
}
