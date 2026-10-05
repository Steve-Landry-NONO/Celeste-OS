import { formatEuros } from "@celeste/domain";
import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "../../../lib/supabase/server";
import { supabaseConfig } from "../../../lib/supabase/config";
import {
  CashAccountForm, ExpenseCategoryForm, FundDepositForm, FundExpenseForm,
  PersonalExpenseForm, SupplierRefundForm,
} from "./forms";
export const dynamic="force-dynamic";

function civilDateInTimeZone(timeZone:string) {
  const values=Object.fromEntries(new Intl.DateTimeFormat("en-US",{
    timeZone,year:"numeric",month:"2-digit",day:"2-digit"
  }).formatToParts(new Date()).map(({type,value})=>[type,value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export default async function Finance({searchParams}:{searchParams:Promise<{organization?:string}>}) {
  if (!supabaseConfig()) return <section className="panel"><h1>Connexion à préparer</h1><p>Configurez cet environnement pour consulter la finance.</p></section>;
  const client=await createServerSupabase();
  const {data:{user},error}=await client.auth.getUser();
  if (error || !user) redirect("/login");
  const {organization:org}=await searchParams;
  if (!org || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(org)) redirect("/workspace");
  const [actor,organization,scopes,categories,receipts,expenses,contributions,accounts,deposits,cashEntries,refunds,policy,totals]=await Promise.all([
    client.from("memberships").select("role,status").eq("organization_id",org).eq("user_id",user.id).maybeSingle(),
    client.from("organizations").select("name,timezone").eq("id",org).maybeSingle(),
    client.from("resource_scopes").select("id,kind,name").eq("organization_id",org).order("created_at"),
    client.from("expense_categories").select("id,title").eq("organization_id",org).eq("active",true).order("title"),
    client.from("scope_files").select("id,scope_id,file_name").eq("organization_id",org).order("created_at"),
    client.from("expenses").select("id,scope_id,category_id,receipt_file_id,cash_account_id,label,amount_minor,spent_on,payer_id,source_type").eq("organization_id",org).order("spent_on",{ascending:false}).order("created_at",{ascending:false}),
    client.rpc("list_finance_contributions",{p_org:org}),
    client.from("cash_accounts").select("id,name").eq("organization_id",org).eq("active",true).order("created_at"),
    client.from("fund_deposits").select("id,cash_account_id,founder_id,label,amount_minor,deposited_on").eq("organization_id",org).order("deposited_on",{ascending:false}),
    client.from("cash_entries").select("cash_account_id,signed_amount_minor").eq("organization_id",org),
    client.from("supplier_refunds").select("id,expense_id,label,amount_minor,received_on").eq("organization_id",org).order("received_on",{ascending:false}),
    client.rpc("get_reimbursement_policy",{p_org:org}),
    client.rpc("get_finance_totals",{p_org:org}),
  ]);
  const allowed=actor.data?.status==="active" && ["founder_admin","founder_finance"].includes(actor.data.role);
  if (!organization.data || !allowed) return <section className="panel"><h1>Accès réservé</h1><p>La finance est réservée aux profils habilités.</p><Link href="/workspace">Retour à mes espaces</Link></section>;
  if ([actor,organization,scopes,categories,receipts,expenses,contributions,accounts,deposits,cashEntries,refunds,policy,totals].some(result=>result.error)) return <section className="notice" role="alert"><p>La finance est indisponible. Rechargez la page dans un instant.</p></section>;
  const scopeById=new Map((scopes.data??[]).map(item=>[item.id,item]));
  const categoryById=new Map((categories.data??[]).map(item=>[item.id,item]));
  const receiptById=new Map((receipts.data??[]).map(item=>[item.id,item]));
  const founderById=new Map((contributions.data??[]).map(item=>[item.user_id,item]));
  const eligibleFounders=(contributions.data??[]).filter(item=>item.can_confirm);
  const accountById=new Map((accounts.data??[]).map(item=>[item.id,item]));
  const accountBalances=new Map<string,number>();
  for (const entry of cashEntries.data??[]) accountBalances.set(entry.cash_account_id,(accountBalances.get(entry.cash_account_id)??0)+entry.signed_amount_minor);
  const organizationToday=civilDateInTimeZone(organization.data.timezone);
  const reimbursementPolicy=policy.data?.[0];
  if (!reimbursementPolicy) return <section className="notice" role="alert"><p>La politique de remboursement persistée est introuvable. Aucune opération financière n’est disponible.</p></section>;
  const summary=totals.data?.[0]??{cost_minor:0,cash_minor:0,contribution_minor:0,reference_minor:0,equalized:false};
  const fundExpenses=(expenses.data??[]).filter(expense=>expense.source_type==="fund" && expense.cash_account_id)
    .map(expense=>({id:expense.id,cash_account_id:expense.cash_account_id!,label:expense.label,amount_minor:expense.amount_minor}));
  return <><div className="page-heading"><Link href="/workspace">← Mes espaces</Link><p className="eyebrow">FINANCE · CAISSE · ÉGALISATION</p><h1>Une lecture exacte,<br/><em>{organization.data.name}.</em></h1><p className="lead">Coûts, contributions et caisse sont calculés depuis des écritures distinctes. Aucun versement n’est recompté comme coût.</p></div>
    <section className="cards finance-summary" aria-label="Totaux financiers">
      <article className="card"><p className="eyebrow">COÛT NET</p><p className="finance-amount">{formatEuros(summary.cost_minor)}</p></article>
      <article className="card"><p className="eyebrow">CAISSE</p><p className="finance-amount">{formatEuros(summary.cash_minor)}</p></article>
      <article className="card"><p className="eyebrow">CONTRIBUTIONS</p><p className="finance-amount">{formatEuros(summary.contribution_minor)}</p></article>
      <article className="card"><p className="eyebrow">RÉFÉRENCE</p><p className="finance-amount">{formatEuros(summary.reference_minor)}</p><span>{summary.equalized?"Fondateurs à égalité":"Égalisation en cours"}</span></article>
    </section>
    <section className="panel" aria-label="Politique de remboursement"><p className="eyebrow">REMBOURSEMENTS · POLITIQUE V{reimbursementPolicy.version}</p><h2>Régime désactivé</h2><p>Les dépenses personnelles confirmées restent des contributions non remboursables. Aucune demande, activation ou paiement de remboursement n’est disponible.</p><ul><li>Réserve minimale : non décidée</li><li>Approbateurs : non décidés</li><li>Activation : nouvelle décision explicite et migration revue requises</li></ul></section>
    <section className="cards finance-summary" aria-label="Égalisation des fondateurs">{contributions.data?.map(item=><article className="card" key={item.user_id}><p className="eyebrow">{item.can_confirm?"FONDATEUR ACTIF":"HISTORIQUE"}</p><h2>{item.display_name}</h2><p className="finance-amount">{formatEuros(item.amount_minor)}</p>{item.remaining_minor===null?<span>Non éligible aux futurs apports</span>:<span>Reste à apporter : {formatEuros(item.remaining_minor)}</span>}</article>)}</section>
    <section className="bottom-grid"><article className="panel auth-panel"><h2>Référentiels</h2><p>Catégories et caisses ont des identifiants stables.</p><ExpenseCategoryForm organization={org}/><CashAccountForm organization={org}/></article><article className="panel"><h2>Soldes par caisse</h2>{accounts.data?.length?<ul className="finance-list">{accounts.data.map(account=><li key={account.id}><strong>{account.name}</strong><strong>{formatEuros(accountBalances.get(account.id)??0)}</strong></li>)}</ul>:<p>Créez une caisse avant le premier versement. Son solde initial restera nul.</p>}</article></section>
    <section className="bottom-grid"><article className="panel auth-panel"><h2>Dépense personnelle</h2><PersonalExpenseForm organization={org} commandKey={randomUUID()} today={organizationToday} scopes={scopes.data??[]} categories={categories.data??[]} receipts={receipts.data??[]} payers={eligibleFounders}/><Link className="text-link" href={"/workspace/scopes?organization="+org}>Gérer les justificatifs privés</Link></article><article className="panel auth-panel"><h2>Versement à la caisse</h2><FundDepositForm organization={org} commandKey={randomUUID()} today={organizationToday} accounts={accounts.data??[]} founders={eligibleFounders}/></article></section>
    <section className="bottom-grid"><article className="panel auth-panel"><h2>Dépense payée par la caisse</h2><FundExpenseForm organization={org} commandKey={randomUUID()} today={organizationToday} scopes={scopes.data??[]} categories={categories.data??[]} receipts={receipts.data??[]} accounts={accounts.data??[]}/></article><article className="panel auth-panel"><h2>Avoir fournisseur</h2><SupplierRefundForm organization={org} commandKey={randomUUID()} today={organizationToday} expenses={fundExpenses} accounts={accounts.data??[]}/></article></section>
    <section className="panel"><p className="eyebrow">ÉCRITURES CONFIRMÉES</p><h2>Dépenses immuables</h2>{expenses.data?.length ? <ul className="finance-list">{expenses.data.map(expense=><li key={expense.id}><div><strong>{expense.label}</strong><span>{expense.spent_on} · {scopeById.get(expense.scope_id)?.name??"Périmètre"} · {categoryById.get(expense.category_id)?.title??"Catégorie"}</span><span>{expense.source_type==="personal"?<>Payeur : {founderById.get(expense.payer_id??"")?.display_name??expense.payer_id?.slice(0,8)}</>:<>Payée par : {accountById.get(expense.cash_account_id??"")?.name??"Caisse"}</>} · <Link href={"/workspace/files/"+expense.receipt_file_id}>{receiptById.get(expense.receipt_file_id)?.file_name??"Justificatif"}</Link></span></div><strong>{formatEuros(expense.amount_minor)}</strong></li>)}</ul> : <p>Aucune dépense confirmée.</p>}</section>
    <section className="bottom-grid"><article className="panel"><p className="eyebrow">VERSEMENTS</p><h2>Entrées de caisse</h2>{deposits.data?.length?<ul className="finance-list">{deposits.data.map(deposit=><li key={deposit.id}><div><strong>{deposit.label}</strong><span>{deposit.deposited_on} · {founderById.get(deposit.founder_id)?.display_name??"Fondateur"} · {accountById.get(deposit.cash_account_id)?.name??"Caisse"}</span></div><strong>{formatEuros(deposit.amount_minor)}</strong></li>)}</ul>:<p>Aucun versement confirmé.</p>}</article><article className="panel"><p className="eyebrow">AVOIRS FOURNISSEUR</p><h2>Retours à la caisse</h2>{refunds.data?.length?<ul className="finance-list">{refunds.data.map(refund=><li key={refund.id}><div><strong>{refund.label}</strong><span>{refund.received_on}</span></div><strong>{formatEuros(refund.amount_minor)}</strong></li>)}</ul>:<p>Aucun avoir confirmé.</p>}</article></section>
    <section className="notice"><p>Les remboursements aux fondateurs restent désactivés jusqu’à décision de politique. Un avoir fournisseur n’est pas un remboursement : il revient sur la même caisse et ne réduit aucune contribution individuelle.</p></section></>;
}
