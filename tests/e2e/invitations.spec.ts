import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

test("invitation privée, révocation, acceptation unique et noms persistants", async ({ page, browser }, testInfo) => {
  test.skip(process.env.CELESTE_E2E_REAL_AUTH !== "1", "Requires disposable local Supabase");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (!["localhost", "127.0.0.1"].includes(new URL(url).hostname)) throw new Error("Only disposable local fixtures");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const admin = createClient(url, process.env.CELESTE_E2E_LOCAL_ADMIN_KEY!, {auth:{persistSession:false,autoRefreshToken:false}});
  const password = randomUUID()+"Aa1!";
  const ownerEmail = "invite-owner-"+randomUUID()+"@celeste-test.invalid";
  const targetEmail = "invite-target-"+randomUUID()+"@celeste-test.invalid";
  const ids: string[] = [];
  const recipientContext = await browser.newContext({...testInfo.project.use, baseURL:"http://127.0.0.1:3100"});
  const recipientPage = await recipientContext.newPage();
  try {
    for (const [email,display_name] of [[ownerEmail,"Responsable test"],[targetEmail,"Prestataire test"]]) {
      const r = await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name}});
      if (r.error || !r.data.user) throw new Error("Fixture failed");
      ids.push(r.data.user.id);
    }
    const owner = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
    const target = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
    if ((await owner.auth.signInWithPassword({email:ownerEmail,password})).error
      || (await target.auth.signInWithPassword({email:targetEmail,password})).error) throw new Error("Fixture login failed");
    const created = await owner.rpc("create_organization", {p_name:"Invitations "+randomUUID()});
    if (created.error || !created.data) throw new Error("Org fixture failed");
    const org = created.data;
    await recipientPage.goto("/join");
    await expect(recipientPage.getByRole("heading", {name:"Connectez-vous d’abord"})).toBeVisible();
    expect((await recipientPage.request.get("/join")).headers()["cache-control"]).toContain("no-store");
    for (const [browserPage,email] of [[page,ownerEmail],[recipientPage,targetEmail]] as const) {
      await browserPage.goto("/login");
      await browserPage.getByLabel("Adresse email").fill(email);
      await browserPage.getByLabel("Mot de passe",{exact:true}).fill(password);
      await browserPage.getByRole("button",{name:"Se connecter",exact:true}).click();
      await expect(browserPage).toHaveURL(/\/workspace$/);
    }
    await page.getByRole("link",{name:"Gérer les membres"}).click();
    const invite = page.getByRole("form",{name:"Inviter un membre",exact:true});
    await invite.getByLabel("Email du destinataire").fill(targetEmail.toUpperCase());
    await invite.getByRole("combobox",{name:"Rôle de l’invitation",exact:true}).selectOption("vendor");
    await invite.getByRole("button",{name:"Créer l’invitation",exact:true}).click();
    await expect(invite.getByLabel("Code à transmettre")).toBeVisible();
    const revokedToken = await invite.getByLabel("Code à transmettre").inputValue();
    expect(revokedToken).toMatch(/^[a-f0-9]{64}$/);
    const listed = await owner.rpc("list_invitations",{p_org:org});
    expect(listed.error).toBeNull(); expect(listed.data).toHaveLength(1);
    expect(Object.keys(listed.data![0]).sort()).toEqual(["id","email","role","created_at","expires_at","status"].sort());
    const id = listed.data![0].id;
    expect((await owner.rpc("accept_invitation",{p_token:revokedToken})).error?.code).toBe("22023");
    expect((await target.rpc("list_invitations",{p_org:org})).error?.code).toBe("42501");
    await invite.getByLabel("Email du destinataire").fill(targetEmail);
    await invite.getByRole("button",{name:"Créer l’invitation",exact:true}).click();
    await expect(invite.getByRole("alert")).toContainText("déjà en attente");
    await page.locator('[data-invitation-id="'+id+'"]').getByRole("button",{name:"Révoquer l’invitation",exact:true}).click();
    await expect(page.locator('[data-invitation-id="'+id+'"]')).toContainText("Révoquée");
    await recipientPage.getByRole("link",{name:"Rejoindre un espace",exact:true}).click();
    await recipientPage.getByLabel("Code d’invitation").fill(revokedToken);
    await recipientPage.getByRole("button",{name:"Accepter l’invitation",exact:true}).click();
    await expect(recipientPage.locator(".auth-form").getByRole("alert")).toContainText("ne peut pas être accepté");
    expect((await target.from("memberships").select("id")).data).toEqual([]);
    // Hidden organization fields do not grant permission for another space.
    await invite.locator('input[name="organization_id"]').evaluate(el=>{(el as HTMLInputElement).value="00000000-0000-4000-8000-000000000000";});
    await invite.getByRole("button",{name:"Créer l’invitation",exact:true}).click();
    await expect(invite.getByRole("alert")).toContainText("ne pouvez pas inviter");
    await page.reload();
    await invite.getByLabel("Email du destinataire").fill(targetEmail);
    await invite.getByRole("combobox",{name:"Rôle de l’invitation",exact:true}).selectOption("vendor");
    await invite.getByRole("button",{name:"Créer l’invitation",exact:true}).click();
    await expect(invite.getByLabel("Code à transmettre")).toBeVisible();
    const token = await invite.getByLabel("Code à transmettre").inputValue();
    await recipientPage.getByLabel("Code d’invitation").fill(token);
    await recipientPage.getByRole("button",{name:"Accepter l’invitation",exact:true}).click();
    await expect(recipientPage).toHaveURL(/\/workspace$/);
    await expect(recipientPage.getByText("Prestataire",{exact:true})).toBeVisible();
    await recipientPage.reload();
    await expect(recipientPage.getByText("Prestataire",{exact:true})).toBeVisible();
    await expect(recipientPage.getByRole("link",{name:"Gérer les membres"})).toHaveCount(0);
    expect((await target.rpc("accept_invitation",{p_token:token})).error?.code).toBe("22023");
    expect((await target.from("memberships").select("role").eq("organization_id",org)).data).toEqual([{role:"vendor"}]);
    expect((await target.from("activity_events").select("id")).data).toEqual([]);
    await page.reload(); // Never capture a live invitation code in evidence.
    await expect(page.getByRole("heading",{name:"Prestataire test",exact:true})).toBeVisible();
    await expect(page.getByLabel("Code à transmettre")).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:testInfo.outputPath("invitation-history.png"),fullPage:true});
    const events = await owner.from("activity_events").select("action").eq("organization_id",org).like("action","invitation.%");
    expect(events.error).toBeNull(); expect(events.data).toHaveLength(4);
    // Two racing acceptances must create only one membership and one audit entry.
    const race = await owner.rpc("create_invitation",{p_org:org,p_email:targetEmail,p_role:"founder_admin"});
    if(race.error || !race.data?.[0]) throw new Error("Race fixture failed");
    const accepts = await Promise.all([target.rpc("accept_invitation",{p_token:race.data[0].token}),target.rpc("accept_invitation",{p_token:race.data[0].token})]);
    expect(accepts.filter(r=>!r.error)).toHaveLength(1);
    expect(accepts.filter(r=>r.error?.code==="22023")).toHaveLength(1);
    expect((await target.from("memberships").select("role").eq("organization_id",org)).data).toEqual([{role:"vendor"}]);
    expect((await owner.from("activity_events").select("id").eq("organization_id",org).eq("action","invitation.accepted")).data).toHaveLength(2);
  } finally {
    await recipientContext.close();
    const cleanup = await admin.from("organizations").delete().in("created_by",ids);
    const removed = await Promise.all(ids.map(id=>admin.auth.admin.deleteUser(id)));
    if(cleanup.error || removed.some(r=>r.error)) throw new Error("Fixture cleanup failed");
  }
});
