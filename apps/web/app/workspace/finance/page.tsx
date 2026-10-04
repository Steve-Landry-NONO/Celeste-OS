import { formatEuros } from "@celeste/domain";
import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "../../../lib/supabase/server";
import { supabaseConfig } from "../../../lib/supabase/config";
import { ExpenseCategoryForm, PersonalExpenseForm } from "./forms";
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
  const [actor,organization,scopes,categories,receipts,expenses,contributions]=await Promise.all([
    client.from("memberships").select("role,status").eq("organization_id",org).eq("user_id",user.id).maybeSingle(),
    client.from("organizations").select("name,timezone").eq("id",org).maybeSingle(),
    client.from("resource_scopes").select("id,kind,name").eq("organization_id",org).order("created_at"),
    client.from("expense_categories").select("id,title").eq("organization_id",org).eq("active",true).order("title"),
    client.from("scope_files").select("id,scope_id,file_name").eq("organization_id",org).order("created_at"),
    client.from("expenses").select("id,scope_id,category_id,receipt_file_id,label,amount_minor,spent_on,payer_id").eq("organization_id",org).order("spent_on",{ascending:false}).order("created_at",{ascending:false}),
    client.rpc("list_finance_contributions",{p_org:org}),
  ]);
  const allowed=actor.data?.status==="active" && ["founder_admin","founder_finance"].includes(actor.data.role);
  if (!organization.data || !allowed) return <section className="panel"><h1>Accès réservé</h1><p>La finance est réservée aux profils habilités.</p><Link href="/workspace">Retour à mes espaces</Link></section>;
  if ([actor,organization,scopes,categories,receipts,expenses,contributions].some(result=>result.error)) return <section className="notice" role="alert"><p>La finance est indisponible. Rechargez la page dans un instant.</p></section>;
  const scopeById=new Map((scopes.data??[]).map(item=>[item.id,item]));
  const categoryById=new Map((categories.data??[]).map(item=>[item.id,item]));
  const receiptById=new Map((receipts.data??[]).map(item=>[item.id,item]));
  const payerById=new Map((contributions.data??[]).map(item=>[item.user_id,item]));
  const eligiblePayers=(contributions.data??[]).filter(item=>item.can_confirm);
  const organizationToday=civilDateInTimeZone(organization.data.timezone);
  return <><div className="page-heading"><Link href="/workspace">← Mes espaces</Link><p className="eyebrow">FINANCE · CONTRIBUTIONS</p><h1>Dépenses suivies,<br/><em>{organization.data.name}.</em></h1><p className="lead">Chaque dépense confirmée ci-dessous augmente une seule fois le coût et la contribution du payeur. La caisse reste inchangée.</p></div>
    <section className="cards finance-summary" aria-label="Contributions">{contributions.data?.map(item=><article className="card" key={item.user_id}><p className="eyebrow">CONTRIBUTION CONFIRMÉE</p><h2>{item.display_name}</h2><p className="finance-amount">{formatEuros(item.amount_minor)}</p></article>)}</section>
    <section className="bottom-grid"><article className="panel auth-panel"><h2>Nouvelle catégorie</h2><p>Les catégories ont un identifiant stable et ne réécrivent pas l’historique.</p><ExpenseCategoryForm organization={org}/></article><article className="panel auth-panel"><h2>Nouvelle dépense personnelle</h2><PersonalExpenseForm organization={org} commandKey={randomUUID()} today={organizationToday} scopes={scopes.data??[]} categories={categories.data??[]} receipts={receipts.data??[]} payers={eligiblePayers}/><Link className="text-link" href={"/workspace/scopes?organization="+org}>Gérer les justificatifs privés</Link></article></section>
    <section className="panel"><p className="eyebrow">ÉCRITURES CONFIRMÉES</p><h2>Historique immuable</h2>{expenses.data?.length ? <ul className="finance-list">{expenses.data.map(expense=><li key={expense.id}><div><strong>{expense.label}</strong><span>{expense.spent_on} · {scopeById.get(expense.scope_id)?.name??"Périmètre"} · {categoryById.get(expense.category_id)?.title??"Catégorie"}</span><span>Payeur : {payerById.get(expense.payer_id)?.display_name??expense.payer_id.slice(0,8)} · <Link href={"/workspace/files/"+expense.receipt_file_id}>{receiptById.get(expense.receipt_file_id)?.file_name??"Justificatif"}</Link></span></div><strong>{formatEuros(expense.amount_minor)}</strong></li>)}</ul> : <p>Aucune dépense confirmée.</p>}</section>
    <section className="notice"><p>Les dépenses du fonds, versements et remboursements ne sont pas activés dans ce lot. Ils auront leurs propres écritures atomiques afin de ne jamais compter deux fois un coût ou un mouvement de caisse.</p></section></>;
}
