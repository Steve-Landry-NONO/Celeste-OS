import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

test("finance : dépense, versement et caisse sans double comptage",async({page},testInfo)=>{
  test.skip(process.env.CELESTE_E2E_REAL_AUTH!=="1","Requires a disposable local Supabase stack");
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (!["localhost","127.0.0.1"].includes(new URL(url).hostname)) throw new Error("Finance fixtures must run only on local Supabase");
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const admin=createClient(url,process.env.CELESTE_E2E_LOCAL_ADMIN_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
  const password=randomUUID()+"Aa1!";
  const suffix=randomUUID();
  const emails=["finance-owner-","finance-member-"].map(prefix=>prefix+suffix+"@celeste-test.invalid");
  const created=await Promise.all(emails.map((email,index)=>admin.auth.admin.createUser({
    email,password,email_confirm:true,user_metadata:{display_name:index===0?"Fondatrice pilote":"Membre sans finance"},
  })));
  if (created.some(result=>result.error || !result.data.user)) throw new Error("Could not create finance fixtures");
  const ids=created.map(result=>result.data.user!.id);
  const owner=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const member=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  expect((await owner.auth.signInWithPassword({email:emails[0],password})).error).toBeNull();
  expect((await member.auth.signInWithPassword({email:emails[1],password})).error).toBeNull();
  const organization=(await owner.rpc("create_organization",{p_name:"Finance "+suffix})).data as string;
  expect(organization).toBeTruthy();
  expect((await owner.rpc("manage_membership",{p_org:organization,p_user:ids[1],p_role:"member",p_status:"active",p_expected_version:0})).error).toBeNull();

  await page.goto("/login");
  await page.getByLabel("Adresse email").fill(emails[0]);
  await page.getByLabel("Mot de passe",{exact:true}).fill(password);
  await page.getByRole("button",{name:"Se connecter",exact:true}).click();
  await expect(page).toHaveURL(/\/workspace$/);
  await page.getByRole("link",{name:"Projets et missions",exact:true}).click();
  const projectForm=page.getByRole("form",{name:"Créer un projet",exact:true});
  await projectForm.getByLabel("Nom du projet").fill("Lancement pilote");
  await projectForm.getByRole("button",{name:"Créer le projet",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Lancement pilote",exact:true})).toBeVisible();
  const project=(await owner.from("resource_scopes").select("id").eq("organization_id",organization).single()).data!.id;
  const projectCard=page.locator('[data-scope-id="'+project+'"]');
  const upload=projectCard.getByRole("form",{name:"Ajouter un fichier privé"});
  await upload.getByLabel("Fichier privé").setInputFiles({
    name:"facture-impression.pdf",mimeType:"application/pdf",
    buffer:Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF\n"),
  });
  await upload.getByRole("button",{name:"Ajouter le fichier",exact:true}).click();
  await expect(projectCard.getByRole("status")).toContainText("Fichier privé ajouté");

  await page.goto("/workspace");
  await page.getByRole("link",{name:"Finance et contributions",exact:true}).click();
  await expect(page.getByRole("heading",{name:/Une lecture exacte/})).toBeVisible();
  const categoryForm=page.getByRole("form",{name:"Créer une catégorie de dépense"});
  await categoryForm.getByLabel("Nouvelle catégorie").fill("Communication");
  await categoryForm.getByRole("button",{name:"Créer la catégorie",exact:true}).click();
  await expect(categoryForm.getByRole("status")).toContainText("Catégorie créée");
  const accountForm=page.getByRole("form",{name:"Créer une caisse"});
  await accountForm.getByLabel("Nom de la caisse").fill("Caisse principale");
  await accountForm.getByRole("button",{name:"Créer la caisse",exact:true}).click();
  await expect(accountForm.getByRole("status")).toContainText("solde initial de 0,00 €");

  const today=new Date().toISOString().slice(0,10);
  const expenseForm=page.getByRole("form",{name:"Confirmer une dépense personnelle"});
  await expenseForm.getByLabel("Libellé").fill("Impression des supports");
  await expenseForm.getByLabel("Montant en euros").fill("123,45");
  await expenseForm.getByLabel("Date de dépense").fill(today);
  await expenseForm.getByLabel("Catégorie").selectOption({label:"Communication"});
  await expenseForm.getByLabel("Payeur").selectOption(ids[0]);
  await expenseForm.getByLabel("Justificatif privé").selectOption({label:"facture-impression.pdf"});
  await expenseForm.getByRole("button",{name:"Confirmer la dépense",exact:true}).click();
  await expect(expenseForm.getByRole("status")).toContainText("coût et contribution augmentés, caisse inchangée");

  const depositForm=page.getByRole("form",{name:"Confirmer un versement à la caisse"});
  await depositForm.getByLabel("Libellé").fill("Apport au fonds");
  await depositForm.getByLabel("Montant en euros").fill("100,00");
  await depositForm.getByLabel("Date du versement").fill(today);
  await depositForm.getByLabel("Caisse").selectOption({label:"Caisse principale"});
  await depositForm.getByLabel("Fondateur").selectOption(ids[0]);
  await depositForm.getByRole("button",{name:"Confirmer le versement",exact:true}).click();
  await expect(depositForm.getByRole("status")).toContainText("contribution et caisse augmentées une seule fois");

  const fundExpenseForm=page.getByRole("form",{name:"Confirmer une dépense payée par la caisse"});
  await fundExpenseForm.getByLabel("Libellé").fill("Achat du fonds");
  await fundExpenseForm.getByLabel("Montant en euros").fill("40,00");
  await fundExpenseForm.getByLabel("Date de dépense").fill(today);
  await fundExpenseForm.getByLabel("Catégorie").selectOption({label:"Communication"});
  await fundExpenseForm.getByLabel("Justificatif privé").selectOption({label:"facture-impression.pdf"});
  await fundExpenseForm.getByLabel("Caisse").selectOption({label:"Caisse principale"});
  await fundExpenseForm.getByRole("button",{name:"Confirmer la dépense du fonds",exact:true}).click();
  await expect(fundExpenseForm.getByRole("status")).toContainText("coût augmenté, caisse diminuée, contributions inchangées");

  const refundForm=page.getByRole("form",{name:"Confirmer un avoir fournisseur"});
  await refundForm.getByLabel("Dépense d’origine").selectOption({label:"Achat du fonds"});
  await refundForm.getByLabel("Libellé").fill("Avoir partiel");
  await refundForm.getByLabel("Montant en euros").fill("10,00");
  await refundForm.getByLabel("Date de réception").fill(today);
  await refundForm.getByRole("button",{name:"Confirmer l’avoir",exact:true}).click();
  await expect(refundForm.getByRole("status")).toContainText("coût net réduit et caisse restaurée, contributions inchangées");

  const summary=page.getByRole("region",{name:"Totaux financiers"});
  await expect(summary).toContainText("153,45 €");
  await expect(summary).toContainText("70,00 €");
  await expect(summary).toContainText("223,45 €");
  await expect(page.getByText(/remboursements aux fondateurs restent désactivés/i)).toBeVisible();
  const reimbursementPolicy=page.getByRole("region",{name:"Politique de remboursement"});
  await expect(reimbursementPolicy).toContainText("Régime désactivé");
  await expect(reimbursementPolicy).toContainText("Réserve minimale : non décidée");
  await expect(reimbursementPolicy).toContainText("Approbateurs : non décidés");
  await expect(reimbursementPolicy.getByRole("button")).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath("finance-cash-ledger.png"),fullPage:true});

  const totals=await owner.rpc("get_finance_totals",{p_org:organization});
  expect(totals.error).toBeNull();
  expect(totals.data).toEqual([expect.objectContaining({cost_minor:15345,cash_minor:7000,contribution_minor:22345})]);
  const effects=await owner.from("contribution_entries").select("expense_id,deposit_id,signed_amount_minor,founder_id").order("created_at");
  expect(effects.error).toBeNull();
  expect(effects.data).toHaveLength(2);
  expect(effects.data).toEqual(expect.arrayContaining([
    expect.objectContaining({expense_id:expect.any(String),deposit_id:null,signed_amount_minor:12345,founder_id:ids[0]}),
    expect.objectContaining({expense_id:null,deposit_id:expect.any(String),signed_amount_minor:10000,founder_id:ids[0]}),
  ]));
  expect((await member.from("cash_entries").select("id")).data).toEqual([]);
  expect((await member.rpc("get_finance_totals",{p_org:organization})).error?.code).toBe("42501");

  await page.goto("/workspace");
  await page.getByRole("button",{name:"Se déconnecter",exact:true}).click();
  await page.getByLabel("Adresse email").fill(emails[1]);
  await page.getByLabel("Mot de passe",{exact:true}).fill(password);
  await page.getByRole("button",{name:"Se connecter",exact:true}).click();
  await expect(page).toHaveURL(/\/workspace$/);
  await expect(page.getByRole("link",{name:"Finance et contributions",exact:true})).toHaveCount(0);
  await page.goto("/workspace/finance?organization="+organization);
  await expect(page.getByRole("heading",{name:"Accès réservé"})).toBeVisible();
});
