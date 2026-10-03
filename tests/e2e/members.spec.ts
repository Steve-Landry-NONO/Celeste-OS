import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

test("administration des membres, concurrence, suspension et refus serveur", async ({ page, context }, testInfo) => {
  test.skip(process.env.CELESTE_E2E_REAL_AUTH !== "1", "Requires a disposable local Supabase stack");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (!["localhost", "127.0.0.1"].includes(new URL(url).hostname)) throw new Error("Only disposable local fixtures");
  const admin = createClient(url, process.env.CELESTE_E2E_LOCAL_ADMIN_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const password = randomUUID() + "Aa1!";
  const ids: string[] = [];
  let org: string | undefined;
  try {
    const ownerEmail = "owner-" + randomUUID() + "@celeste-test.invalid";
    const memberEmail = "member-" + randomUUID() + "@celeste-test.invalid";
    for (const email of [ownerEmail, memberEmail]) {
      const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (created.error || !created.data.user) throw new Error("Fixture failed");
      ids.push(created.data.user.id);
    }
    const owner = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const member = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    if ((await owner.auth.signInWithPassword({email:ownerEmail,password})).error
      || (await member.auth.signInWithPassword({email:memberEmail,password})).error) throw new Error("Fixture login failed");
    const createdOrg = await owner.rpc("create_organization", {p_name:"Équipe " + randomUUID()});
    if (createdOrg.error || !createdOrg.data) throw new Error("Organization fixture failed");
    org = createdOrg.data;
    const added = await owner.rpc("manage_membership", {p_org:org,p_user:ids[1],p_role:"member",p_status:"active",p_expected_version:0});
    if (added.error) throw new Error("Membership fixture failed");

    await page.goto("/login");
    await page.getByLabel("Adresse email").fill(ownerEmail);
    await page.getByLabel("Mot de passe", {exact:true}).fill(password);
    await page.getByRole("button", {name:"Se connecter",exact:true}).click();
    await page.getByRole("link", {name:"Gérer les membres"}).click();
    await expect(page).toHaveURL(/\/workspace\/members\?organization=/);
    const ownCard = page.locator('[data-member-id="'+ids[0]+'"]');
    await ownCard.getByRole("combobox", {name:"Accès",exact:true}).selectOption("suspended");
    await ownCard.getByRole("button", {name:"Enregistrer l’accès"}).click();
    await expect(ownCard.getByRole("alert")).toContainText("dernier administrateur doit rester actif");
    expect((await owner.from("memberships").select("status,row_version").eq("user_id",ids[0]).eq("organization_id",org).single()).data)
      .toMatchObject({status:"active",row_version:1});

    const stale = await context.newPage();
    await stale.goto(page.url());
    const card = page.locator('[data-member-id="'+ids[1]+'"]');
    await card.getByRole("combobox", {name:"Rôle",exact:true}).selectOption("founder_finance");
    await card.getByRole("button", {name:"Enregistrer l’accès"}).click();
    await expect(card.locator('input[name="row_version"]')).toHaveValue("2");
    await page.reload();
    await expect(card.getByRole("combobox", {name:"Rôle",exact:true})).toHaveValue("founder_finance");
    const staleCard = stale.locator('[data-member-id="'+ids[1]+'"]');
    await staleCard.getByRole("combobox", {name:"Rôle",exact:true}).selectOption("support");
    await staleCard.getByRole("button", {name:"Enregistrer l’accès"}).click();
    await expect(staleCard.getByRole("alert")).toContainText("autre session");
    expect((await owner.from("memberships").select("role,row_version").eq("user_id",ids[1]).eq("organization_id",org).single()).data)
      .toMatchObject({role:"founder_finance",row_version:2});
    await stale.close();

    // A tampered hidden organization field must fail inside the Server Action.
    const foreign = await member.rpc("create_organization",{p_name:"Autre espace "+randomUUID()});
    if (foreign.error || !foreign.data) throw new Error("Second organization failed");
    await card.locator('input[name="organization_id"]').evaluate((input, id) => { (input as HTMLInputElement).value = id; }, foreign.data);
    await card.getByRole("button",{name:"Enregistrer l’accès"}).click();
    await expect(card.getByRole("alert")).toContainText("ne pouvez pas administrer");
    await page.reload();

    await card.getByRole("combobox", {name:"Accès",exact:true}).selectOption("suspended");
    await card.getByRole("button",{name:"Enregistrer l’accès"}).click();
    await expect(card.locator('input[name="row_version"]')).toHaveValue("3");
    await expect(card.getByRole("combobox", {name:"Accès",exact:true})).toHaveValue("suspended");
    const denied = await member.from("organizations").select("id").eq("id",org);
    expect(denied.error).toBeNull(); expect(denied.data).toEqual([]);
    const escalation = await member.rpc("manage_membership",{p_org:org,p_user:ids[1],p_role:"founder_admin",p_status:"active",p_expected_version:3});
    expect(escalation.error?.code).toBe("42501");
    await card.getByRole("combobox",{name:"Accès",exact:true}).selectOption("active");
    await card.getByRole("button",{name:"Enregistrer l’accès"}).click();
    await expect(card.locator('input[name="row_version"]')).toHaveValue("4");
    await expect(card.getByRole("combobox",{name:"Accès",exact:true})).toHaveValue("active");
    await page.reload();
    expect((await member.from("organizations").select("id").eq("id",org)).data).toHaveLength(1);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:testInfo.outputPath("members.png"),fullPage:true});
    const audit = await owner.from("activity_events").select("id").eq("organization_id",org).eq("action","membership.changed");
    expect(audit.error).toBeNull(); expect(audit.data).toHaveLength(4); // add, role, suspend, restore; failed writes add nothing

    await page.goto("/workspace");
    await page.getByRole("button",{name:"Se déconnecter",exact:true}).click();
    await page.getByLabel("Adresse email").fill(memberEmail);
    await page.getByLabel("Mot de passe",{exact:true}).fill(password);
    await page.getByRole("button",{name:"Se connecter",exact:true}).click();
    await expect(page).toHaveURL(/\/workspace$/);
    await page.goto("/workspace/members?organization="+org);
    await expect(page.getByRole("heading",{name:"Accès réservé"})).toBeVisible();
    await expect(page.locator("[data-member-id]")).toHaveCount(0);
  } finally {
    const cleanup = await admin.from("organizations").delete().in("created_by",ids);
    const removed = await Promise.all(ids.map(id=>admin.auth.admin.deleteUser(id)));
    if (cleanup.error || removed.some(r=>r.error)) throw new Error("Fixture cleanup failed");
  }
});
