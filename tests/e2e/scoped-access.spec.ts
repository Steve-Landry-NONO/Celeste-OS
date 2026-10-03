import {test,expect} from "@playwright/test";
import {createClient} from "@supabase/supabase-js";
import {randomUUID} from "node:crypto";

test("projets et missions : accès explicites, révocation, concurrence et isolement",async ({page,context},testInfo)=>{
  test.skip(process.env.CELESTE_E2E_REAL_AUTH!=="1","Requires disposable Supabase");
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (!["localhost","127.0.0.1"].includes(new URL(url).hostname)) throw new Error("Only local fixtures");
  const admin=createClient(url,process.env.CELESTE_E2E_LOCAL_ADMIN_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const password=randomUUID()+"Aa1!";
  const ids:string[]=[];
  const clients:ReturnType<typeof createClient>[]=[];
  const emails:string[]=[];
  try {
    for (const name of ["Admin périmètres","Équipe périmètres","Prestataire périmètres"]) {
      const email="scope-"+randomUUID()+"@celeste-test.invalid";emails.push(email);
      const user=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:name}});
      if (user.error || !user.data.user) throw new Error("Fixture creation failed");ids.push(user.data.user.id);
      const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
      if ((await client.auth.signInWithPassword({email,password})).error) throw new Error("Fixture login failed");clients.push(client);
    }
    const [owner,member,vendor]=clients;
    const org=(await owner.rpc("create_organization",{p_name:"Périmètres "+randomUUID()})).data as string;
    expect(org).toBeTruthy();
    expect((await owner.rpc("manage_membership",{p_org:org,p_user:ids[1],p_role:"member",p_status:"active",p_expected_version:0})).error).toBeNull();
    expect((await owner.rpc("manage_membership",{p_org:org,p_user:ids[2],p_role:"vendor",p_status:"active",p_expected_version:0})).error).toBeNull();
    await page.goto("/login");
    await page.getByLabel("Adresse email").fill(emails[0]);await page.getByLabel("Mot de passe",{exact:true}).fill(password);
    await page.getByRole("button",{name:"Se connecter",exact:true}).click();await expect(page).toHaveURL(/\/workspace$/);
    await page.getByRole("link",{name:"Projets et missions",exact:true}).click();
    const projectForm=page.getByRole("form",{name:"Créer un projet",exact:true});
    await projectForm.getByLabel("Nom du projet").fill("Projet principal");await projectForm.getByRole("button",{name:"Créer le projet",exact:true}).click();
    await expect(page.getByRole("heading",{name:"Projet principal",exact:true})).toBeVisible();
    await page.reload();
    const projectResult=await owner.from("resource_scopes").select("id").eq("organization_id",org).eq("kind","project").single();
    expect(projectResult.error).toBeNull();const project=projectResult.data!.id as string;
    const missionForm=page.getByRole("form",{name:"Créer une mission",exact:true});
    await missionForm.getByLabel("Nom de la mission").fill("Mission autorisée");await missionForm.getByLabel("Projet de la mission").selectOption(project);
    await missionForm.getByRole("button",{name:"Créer la mission",exact:true}).click();await expect(page.getByRole("heading",{name:"Mission autorisée",exact:true})).toBeVisible();
    const mission=(await owner.from("resource_scopes").select("id").eq("organization_id",org).eq("kind","mission").single()).data!.id as string;
    expect((await owner.rpc("create_resource_scope",{p_org:org,p_kind:"mission",p_name:"Mission confidentielle",p_parent:project})).error).toBeNull();
    await page.reload();
    expect((await member.from("resource_scopes").select("id")).data).toEqual([]);
    expect((await vendor.from("resource_scopes").select("id")).data).toEqual([]);
    const projectCard=page.locator('[data-scope-id="'+project+'"]');
    const missionCard=page.locator('[data-scope-id="'+mission+'"]');
    await expect(projectCard.getByLabel("Membre à autoriser").locator('option[value="'+ids[2]+'"]')).toHaveCount(0);
    await projectCard.getByLabel("Membre à autoriser").selectOption(ids[1]);await projectCard.getByRole("button",{name:"Accorder la lecture",exact:true}).click();
    await expect(projectCard.locator('[data-scope-user="'+ids[1]+'"]')).toBeVisible();
    await expect(projectCard.getByText("Lecture active.",{exact:true})).toBeVisible();
    await missionCard.getByLabel("Membre à autoriser").selectOption(ids[2]);await missionCard.getByRole("button",{name:"Accorder la lecture",exact:true}).click();
    await expect(missionCard.locator('[data-scope-user="'+ids[2]+'"]')).toBeVisible();
    await expect(missionCard.getByRole("button",{name:"Accorder la lecture",exact:true})).toBeDisabled();
    const audit=await owner.from("activity_events").select("subject_user_id").eq("organization_id",org).eq("resource_id",mission).eq("action","scope.access_granted");
    expect(audit.error).toBeNull();expect(audit.data).toEqual([{subject_user_id:ids[2]}]);
    expect((await member.from("resource_scopes").select("id,kind")).data).toEqual([{id:project,kind:"project"}]);
    expect((await vendor.from("resource_scopes").select("id,kind",{count:"exact"}))).toMatchObject({data:[{id:mission,kind:"mission"}],count:1});
    expect((await vendor.rpc("list_scope_access",{p_org:org})).error?.code).toBe("42501");
    expect((await vendor.rpc("set_scope_access",{p_org:org,p_scope:project,p_user:ids[2],p_granted:true,p_expected_version:0})).error?.code).toBe("42501");
    expect((await owner.rpc("set_scope_access",{p_org:org,p_scope:project,p_user:ids[2],p_granted:true,p_expected_version:0})).error?.code).toBe("22023");
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:testInfo.outputPath("scope-administration.png"),fullPage:true});

    // A second tab carries version 1, which may not overwrite a newer decision.
    const stale=await context.newPage();await stale.goto(page.url());
    await projectCard.getByRole("button",{name:"Révoquer la lecture",exact:true}).click();
    await expect(projectCard.locator('[data-scope-user="'+ids[1]+'"]')).toHaveCount(0);
    await stale.locator('[data-scope-id="'+project+'"]').getByRole("button",{name:"Révoquer la lecture",exact:true}).click();
    await expect(stale.locator('[data-scope-id="'+project+'"]').getByRole("alert")).toContainText("autre session");await stale.close();
    expect((await member.from("resource_scopes").select("id")).data).toEqual([]);
    // Two simultaneous attempts with the same revision: exactly one succeeds.
    const competing=await Promise.all([true,false].map(granted=>owner.rpc("set_scope_access",{p_org:org,p_scope:project,p_user:ids[1],p_granted:granted,p_expected_version:2})));
    expect(competing.filter(r=>!r.error)).toHaveLength(1);expect(competing.find(r=>r.error)?.error?.code).toBe("40001");
    const foreign=(await member.rpc("create_organization",{p_name:"Espace étranger "+randomUUID()})).data as string;
    expect(foreign).toBeTruthy();
    // Falsifying the form scope must fail in the server action as well as the RPC.
    await page.reload();await projectForm.getByLabel("Nom du projet").fill("Projet falsifié");
    await projectForm.locator('input[name="organization_id"]').evaluate((el,id)=>{(el as HTMLInputElement).value=id;},foreign);
    await projectForm.getByRole("button",{name:"Créer le projet",exact:true}).click();
    await expect(projectForm.getByRole("alert")).toContainText("ne pouvez pas administrer");
    await page.goto("/workspace/scopes?organization="+foreign);await expect(page.getByRole("heading",{name:"Accès réservé"})).toBeVisible();
    await expect(page.locator("[data-scope-id]")).toHaveCount(0);
    await page.goto("/workspace");await page.getByRole("button",{name:"Se déconnecter",exact:true}).click();
    await page.getByLabel("Adresse email").fill(emails[2]);await page.getByLabel("Mot de passe",{exact:true}).fill(password);
    await page.getByRole("button",{name:"Se connecter",exact:true}).click();await expect(page).toHaveURL(/\/workspace$/);
    await page.getByRole("link",{name:"Projets et missions",exact:true}).click();
    await expect(page.getByRole("heading",{name:"Mission autorisée",exact:true})).toBeVisible();
    await expect(page.locator("[data-scope-id]")).toHaveCount(1);
    await expect(page.getByText("Projet principal",{exact:true})).toHaveCount(0);await expect(page.getByText("Mission confidentielle",{exact:true})).toHaveCount(0);
    await expect(page.getByRole("form")).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:testInfo.outputPath("vendor-mission-only.png"),fullPage:true});
    expect((await owner.rpc("manage_membership",{p_org:org,p_user:ids[2],p_role:"vendor",p_status:"suspended",p_expected_version:1})).error).toBeNull();
    await page.reload();await expect(page.getByRole("heading",{name:"Accès réservé"})).toBeVisible();
    expect((await vendor.from("resource_scopes").select("id")).data).toEqual([]);
    // A retained agreement must not be displayed as effective after status/role changes.
    expect((await owner.rpc("set_scope_access",{p_org:org,p_scope:project,p_user:ids[1],p_granted:true,p_expected_version:3})).error).toBeNull();
    expect((await owner.rpc("manage_membership",{p_org:org,p_user:ids[1],p_role:"vendor",p_status:"active",p_expected_version:1})).error).toBeNull();
    expect((await member.from("resource_scopes").select("id").eq("organization_id",org)).data).toEqual([]);
    await page.goto("/workspace");await page.getByRole("button",{name:"Se déconnecter",exact:true}).click();
    await page.getByLabel("Adresse email").fill(emails[0]);await page.getByLabel("Mot de passe",{exact:true}).fill(password);
    await page.getByRole("button",{name:"Se connecter",exact:true}).click();await expect(page).toHaveURL(/\/workspace$/);
    await page.goto("/workspace/scopes?organization="+org);
    await expect(missionCard.locator('[data-scope-user="'+ids[2]+'"]')).toContainText("Accord inactif — membre suspendu ou absent.");
    await expect(projectCard.locator('[data-scope-user="'+ids[1]+'"]')).toContainText("Accord inactif — rôle prestataire.");
    await page.screenshot({path:testInfo.outputPath("scope-inactive-grants.png"),fullPage:true});
    // Inactive grants remain revocable, so suspension need not become permanent access.
    await missionCard.getByRole("button",{name:"Révoquer la lecture",exact:true}).click();
    await expect(missionCard.locator('[data-scope-user="'+ids[2]+'"]')).toHaveCount(0);
  } finally {
    const cleanup=await admin.from("organizations").delete().in("created_by",ids);
    const removed=await Promise.all(ids.map(id=>admin.auth.admin.deleteUser(id)));
    if (cleanup.error || removed.some(r=>r.error)) throw new Error("Scope fixture cleanup failed");
  }
});
