import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

test("Expo conserve la session et applique l’habilitation Finance", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-web", "Mobile Expo evidence runs once");
  test.skip(process.env.CELESTE_E2E_REAL_AUTH !== "1", "Requires a disposable local Supabase stack");
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  if (!["localhost", "127.0.0.1"].includes(new URL(url).hostname)) throw new Error("Mobile fixtures must run only on local Supabase");
  const admin = createClient(url, process.env.CELESTE_E2E_LOCAL_ADMIN_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
  const publishable = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const suffix = randomUUID();
  const password = randomUUID() + "Aa1!";
  const ownerEmail = `mobile-owner-${suffix}@celeste-test.invalid`;
  const memberEmail = `mobile-member-${suffix}@celeste-test.invalid`;
  const created = await Promise.all([
    admin.auth.admin.createUser({ email: ownerEmail, password, email_confirm: true, user_metadata: { display_name: "Responsable mobile" } }),
    admin.auth.admin.createUser({ email: memberEmail, password, email_confirm: true, user_metadata: { display_name: "Membre mobile" } }),
  ]);
  const ids = created.map(result => result.data.user?.id).filter((id): id is string => Boolean(id));
  let organization: string | undefined;
  try {
    if (created.some(result => result.error) || ids.length !== 2) throw new Error("Could not create mobile fixtures");
    const owner = createClient(url, publishable, { auth: { persistSession: false, autoRefreshToken: false } });
    if ((await owner.auth.signInWithPassword({ email: ownerEmail, password })).error) throw new Error("Owner login failed");
    const organizationResult = await owner.rpc("create_organization", { p_name: `Mobile ${suffix}` });
    if (organizationResult.error || !organizationResult.data) throw new Error("Could not create mobile organization");
    organization = organizationResult.data as string;
    const membership = await owner.rpc("manage_membership", { p_org: organization, p_user: ids[1], p_role: "member", p_status: "active", p_expected_version: 0 });
    if (membership.error) throw new Error("Could not prepare mobile membership");

    await page.goto("http://127.0.0.1:8081");
    await page.getByLabel("Adresse email").fill(ownerEmail);
    await page.getByLabel("Mot de passe").fill(password);
    await page.getByRole("button", { name: "Se connecter", exact: true }).click();
    await expect(page.getByText(`Mobile ${suffix}`, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: `Ouvrir la finance de Mobile ${suffix}` }).click();
    await expect(page.getByText("Régime désactivé", { exact: true })).toBeVisible();
    await expect(page.getByText("Lecture calculée depuis les écritures autorisées.", { exact: false })).toBeVisible();
    await expect(page.getByLabel("Totaux financiers mobiles")).toContainText(/0,00\s?€/);
    await page.screenshot({ path: testInfo.outputPath("mobile-finance-owner.png"), fullPage: true });

    await page.reload();
    await expect(page.getByText(`Mobile ${suffix}`, { exact: true })).toBeVisible();
    await expect(page.getByLabel("Mot de passe")).toHaveCount(0);
    await page.getByRole("button", { name: "Se déconnecter", exact: true }).click();
    await expect(page.getByLabel("Mot de passe")).toBeVisible();

    await page.getByLabel("Adresse email").fill(memberEmail);
    await page.getByLabel("Mot de passe").fill(password);
    await page.getByRole("button", { name: "Se connecter", exact: true }).click();
    await expect(page.getByText("Finance non autorisée pour ce profil.", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: `Ouvrir la finance de Mobile ${suffix}` })).toHaveCount(0);
    const member = createClient(url, publishable, { auth: { persistSession: false, autoRefreshToken: false } });
    if ((await member.auth.signInWithPassword({ email: memberEmail, password })).error) throw new Error("Member login failed");
    expect((await member.rpc("get_finance_totals", { p_org: organization })).error?.code).toBe("42501");
    await page.screenshot({ path: testInfo.outputPath("mobile-finance-denied.png"), fullPage: true });
  } finally {
    if (organization) {
      const cleanup = await admin.from("organizations").delete().eq("id", organization);
      if (cleanup.error) throw new Error("Could not clean mobile organization fixture");
    }
    const deletions = await Promise.all(ids.map(id => admin.auth.admin.deleteUser(id)));
    if (deletions.some(result => result.error)) throw new Error("Could not clean mobile user fixtures");
  }
});
