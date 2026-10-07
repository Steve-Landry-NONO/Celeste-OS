import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const todayParis = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date());

test("phases, tâches et Aujourd’hui : persistance, historique et révocation", async ({ page }, testInfo) => {
  test.skip(process.env.CELESTE_E2E_REAL_AUTH !== "1", "Requires disposable Supabase");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (!["localhost", "127.0.0.1"].includes(new URL(url).hostname)) throw new Error("Only local fixtures");
  const admin = createClient(url, process.env.CELESTE_E2E_LOCAL_ADMIN_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const password = randomUUID() + "Aa1!";
  const ids: string[] = [];
  const emails: string[] = [];
  const clients: ReturnType<typeof createClient>[] = [];
  try {
    for (const name of ["Admin tâches", "Membre tâches"]) {
      const email = "tasks-" + randomUUID() + "@celeste-test.invalid";
      emails.push(email);
      const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: name } });
      if (created.error || !created.data.user) throw new Error("Fixture creation failed");
      ids.push(created.data.user.id);
      const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
      if ((await client.auth.signInWithPassword({ email, password })).error) throw new Error("Fixture login failed");
      clients.push(client);
    }
    const [owner, member] = clients;
    const org = (await owner.rpc("create_organization", { p_name: "Travail " + randomUUID() })).data as string;
    expect(org).toBeTruthy();
    expect((await owner.rpc("manage_membership", { p_org: org, p_user: ids[1], p_role: "member", p_status: "active", p_expected_version: 0 })).error).toBeNull();
    const project = (await owner.rpc("create_resource_scope", { p_org: org, p_kind: "project", p_name: "Pilote CELESTE", p_parent: null })).data as string;
    expect(project).toBeTruthy();
    expect((await owner.rpc("set_scope_access", { p_org: org, p_scope: project, p_user: ids[1], p_granted: true, p_expected_version: 0 })).error).toBeNull();
    expect((await owner.rpc("set_scope_task_write", { p_org: org, p_scope: project, p_user: ids[1], p_allowed: true, p_expected_version: 1 })).error).toBeNull();

    await page.goto("/login");
    await page.getByLabel("Adresse email").fill(emails[0]);
    await page.getByLabel("Mot de passe", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Se connecter", exact: true }).click();
    await expect(page).toHaveURL(/\/workspace$/);
    await page.getByRole("link", { name: "Tâches et Aujourd’hui", exact: true }).click();
    await expect(page.getByRole("heading", { name: /Travail/ })).toBeVisible();

    const phaseForm = page.getByRole("form", { name: "Créer une phase", exact: true });
    await phaseForm.getByLabel("Projet").selectOption(project);
    await phaseForm.getByLabel("Nom de la phase").fill("Recette pilote");
    await phaseForm.getByLabel("État").selectOption("active");
    await phaseForm.getByRole("button", { name: "Créer la phase", exact: true }).click();
    await expect(phaseForm.getByRole("status")).toContainText("Phase créée");
    const phase = (await owner.from("project_phases").select("id").eq("organization_id", org).single()).data!.id as string;

    const taskForm = page.getByRole("form", { name: "Créer une tâche", exact: true });
    await taskForm.getByLabel("Périmètre").selectOption(project);
    await taskForm.getByLabel("Phase").selectOption(phase);
    await taskForm.getByLabel("Responsable unique").selectOption(ids[0]);
    await taskForm.getByLabel("Titre").fill("Valider le parcours pilote");
    await taskForm.getByLabel("Priorité").selectOption("urgent");
    await taskForm.getByLabel("Échéance").fill(todayParis());
    await taskForm.getByRole("button", { name: "Créer la tâche", exact: true }).click();
    await expect(page.getByTestId("workspace-today-total")).toHaveText("1");
    await expect(page.getByTestId("workspace-today-task")).toContainText("Valider le parcours pilote");
    const task = (await owner.from("tasks").select("id,row_version").eq("organization_id", org).single()).data!;
    expect(task.row_version).toBe(1);

    const statusForm = page.getByRole("form", { name: "Mettre à jour Valider le parcours pilote", exact: true });
    await statusForm.getByLabel("État").selectOption("blocked");
    await statusForm.getByLabel("Motif du blocage").fill("Validation nécessaire");
    await statusForm.getByRole("button", { name: "Enregistrer l’état", exact: true }).click();
    await expect(page.getByText("Validation nécessaire", { exact: true }).first()).toBeVisible();
    expect((await owner.from("task_history").select("id", { count: "exact" }).eq("task_id", task.id)).count).toBe(2);
    expect((await owner.rpc("update_task", {
      p_task: task.id, p_expected_version: 1, p_scope: project, p_phase: phase,
      p_assignee: ids[0], p_title: "Écrasement obsolète", p_status: "done",
      p_priority: "normal", p_due_on: null, p_blocked_reason: null,
    })).error?.code).toBe("40001");

    await page.screenshot({ path: testInfo.outputPath("tasks-today-admin.png"), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.goto("/workspace");
    await page.getByRole("button", { name: "Se déconnecter", exact: true }).click();
    await page.getByLabel("Adresse email").fill(emails[1]);
    await page.getByLabel("Mot de passe", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Se connecter", exact: true }).click();
    await expect(page).toHaveURL(/\/workspace$/);
    await page.goto("/workspace/tasks?organization=" + org);
    await expect(page.getByRole("form", { name: "Créer une tâche", exact: true })).toBeVisible();
    await expect(page.getByRole("form", { name: "Créer une phase", exact: true })).toHaveCount(0);
    await taskForm.getByLabel("Responsable unique").selectOption(ids[1]);
    await taskForm.getByLabel("Titre").fill("Préparer mon compte rendu");
    await taskForm.getByLabel("Échéance").fill(todayParis());
    await taskForm.getByRole("button", { name: "Créer la tâche", exact: true }).click();
    await expect(page.getByTestId("workspace-today-total")).toHaveText("1");
    await expect(page.getByTestId("workspace-today-task")).toContainText("Préparer mon compte rendu");
    await page.screenshot({ path: testInfo.outputPath("tasks-today-member.png"), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    expect((await owner.rpc("set_scope_task_write", { p_org: org, p_scope: project, p_user: ids[1], p_allowed: false, p_expected_version: 2 })).error).toBeNull();
    await page.reload();
    await expect(page.getByRole("form", { name: "Créer une tâche", exact: true })).toHaveCount(0);
    const memberTask = (await member.from("tasks").select("id,row_version,assignee_id,title,status,priority,due_on,phase_id,scope_id").eq("assignee_id", ids[1]).single()).data!;
    expect((await member.rpc("update_task", {
      p_task: memberTask.id, p_expected_version: memberTask.row_version,
      p_scope: memberTask.scope_id, p_phase: memberTask.phase_id,
      p_assignee: memberTask.assignee_id, p_title: memberTask.title,
      p_status: "done", p_priority: memberTask.priority,
      p_due_on: memberTask.due_on, p_blocked_reason: null,
    })).error?.code).toBe("42501");
  } finally {
    const cleanup = await admin.from("organizations").delete().in("created_by", ids);
    const removed = await Promise.all(ids.map((id) => admin.auth.admin.deleteUser(id)));
    if (cleanup.error || removed.some((result) => result.error)) throw new Error("Task fixture cleanup failed");
  }
});
