import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

test("connexion, persistance d’organisation, isolation API et déconnexion", async ({ page }, testInfo) => {
  test.skip(process.env.CELESTE_E2E_REAL_AUTH !== "1", "Requires a disposable local Supabase stack");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (!["localhost","127.0.0.1"].includes(new URL(url).hostname)) throw new Error("Auth fixtures must run only on local Supabase");
  const admin = createClient(url,process.env.CELESTE_E2E_LOCAL_ADMIN_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
  const suffix = randomUUID();
  const email = "pilot-"+suffix+"@celeste-test.invalid";
  const password = randomUUID()+"Aa1!";
  const created = await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:"Pilote test"}});
  if (created.error || !created.data.user) throw new Error("Could not create local fixture");
  const other = await admin.auth.admin.createUser({email:"other-"+suffix+"@celeste-test.invalid",password,email_confirm:true});
  const ids = [created.data.user.id, ...(other.data.user ? [other.data.user.id] : [])];
  try {
    if (other.error || !other.data.user) throw new Error("Could not create second local fixture");
    await page.goto("/workspace");
    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel("Adresse email").fill(email);
    await page.getByLabel("Mot de passe", {exact:true}).fill("InvalidPassword123!");
    await page.getByRole("button",{name:"Se connecter",exact:true}).click();
    await expect(page.locator(".auth-form").getByRole("alert")).toContainText("Connexion impossible");
    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel("Mot de passe", {exact:true}).fill(password);
    await page.getByRole("button",{name:"Se connecter",exact:true}).click();
    await expect(page).toHaveURL(/\/workspace$/);
    await expect(page.getByRole("heading",{name:/Pilote test/})).toBeVisible();
    await page.getByLabel("Nom de l’organisation").fill("Espace "+suffix);
    await page.getByRole("button",{name:"Créer un espace",exact:true}).click();
    await expect(page.getByRole("heading",{name:"Espace "+suffix,exact:true})).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading",{name:"Espace "+suffix,exact:true})).toBeVisible();
    const sessionCookies = (await page.context().cookies()).filter(c=>c.name.startsWith("sb-") && c.name.includes("auth-token"));
    expect(sessionCookies.length).toBeGreaterThan(0);
    expect(sessionCookies.every(c=>c.httpOnly && c.secure && c.sameSite === "Lax")).toBe(true);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:testInfo.outputPath("workspace.png"),fullPage:true});

    const orgs = await admin.from("organizations").select("id").eq("created_by",created.data.user.id);
    if (orgs.error || orgs.data?.length!==1) throw new Error("Persistent organization missing");
    const otherClient = createClient(url,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
    const login = await otherClient.auth.signInWithPassword({email:other.data.user.email!,password});
    if (login.error) throw new Error("Second local user login failed");
    const denied = await otherClient.from("organizations").select("*").eq("id",orgs.data[0].id);
    expect(denied.error).toBeNull();
    expect(denied.data).toEqual([]);
    const escalation = await otherClient.rpc("manage_membership",{p_org:orgs.data[0].id,p_user:other.data.user.id,p_role:"founder_admin",p_status:"active",p_expected_version:0});
    expect(escalation.error?.code).toBe("42501");

    await page.getByRole("button",{name:"Se déconnecter",exact:true}).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/workspace");
    await expect(page).toHaveURL(/\/login$/);
    const callback = await page.goto("/auth/callback?code=invalid&next=https://example.com");
    await expect(page).toHaveURL(/\/login\?confirmation=failed$/);
    expect(callback?.headers()["cache-control"]).toContain("no-store");
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  } finally {
    // Only disposable local fixture IDs; production URLs are rejected above.
    const cleanup = await admin.from("organizations").delete().eq("created_by",created.data.user.id);
    const deletions = await Promise.all(ids.map(id=>admin.auth.admin.deleteUser(id)));
    if (cleanup.error || deletions.some(result=>result.error)) throw new Error("Disposable fixtures could not be cleaned up");
  }
});


test("inscription locale sans accès implicite à une organisation", async ({ page }) => {
  test.skip(process.env.CELESTE_E2E_REAL_AUTH !== "1", "Requires a disposable local Supabase stack");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (!["localhost","127.0.0.1"].includes(new URL(url).hostname)) throw new Error("Auth fixtures must run only on local Supabase");
  const admin = createClient(url,process.env.CELESTE_E2E_LOCAL_ADMIN_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
  const email = "signup-"+randomUUID()+"@celeste-test.invalid";
  const password = randomUUID()+"Aa1!";
  let userId: string | undefined;
  try {
    await page.goto("/register");
    await page.getByLabel("Nom affiché").fill("Nouvel utilisateur");
    await page.getByLabel("Adresse email").fill(email);
    await page.getByLabel("Mot de passe", {exact:true}).fill(password);
    await page.getByRole("button",{name:"Créer mon compte",exact:true}).click();
    // Confirmation is disabled only in the disposable local stack.
    await expect(page).toHaveURL(/\/workspace$/);
    await expect(page.getByRole("heading",{name:/Nouvel utilisateur/})).toBeVisible();
    await expect(page.getByText("Vous n’avez aucun espace pour le moment.",{exact:false})).toBeVisible();
    const publicClient = createClient(url,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
    const login = await publicClient.auth.signInWithPassword({email,password});
    if (login.error || !login.data.user) throw new Error("Signup account could not be verified");
    userId=login.data.user.id;
    const memberships = await publicClient.from("memberships").select("id");
    expect(memberships.error).toBeNull();
    expect(memberships.data).toEqual([]);
    await page.getByRole("button",{name:"Se déconnecter",exact:true}).click();
    await expect(page).toHaveURL(/\/login$/);
  } finally {
    // Recover the local fixture if the UI assertion failed after account creation.
    if (!userId) {
      const users = await admin.auth.admin.listUsers();
      userId = users.data.users.find(user=>user.email===email)?.id;
      if (users.error) throw new Error("Could not inspect local signup fixture cleanup");
    }
    if (userId && (await admin.auth.admin.deleteUser(userId)).error) throw new Error("Could not delete local signup fixture");
  }
});
