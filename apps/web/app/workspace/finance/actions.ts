"use server";
import { parseEuros } from "@celeste/domain";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "../../../lib/supabase/server";
import type { FormState } from "../../auth/actions";

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const date=/^\d{4}-\d{2}-\d{2}$/;

async function financeClient(organization:string) {
  const client=await createServerSupabase(true);
  const {data:{user},error}=await client.auth.getUser();
  if (error || !user) return null;
  const actor=await client.from("memberships").select("role,status")
    .eq("organization_id",organization).eq("user_id",user.id).maybeSingle();
  return !actor.error && actor.data?.status==="active"
    && ["founder_admin","founder_finance"].includes(actor.data.role) ? client : null;
}

function amount(form:FormData) {
  return parseEuros(String(form.get("amount")??""));
}

function financeError(code:string|undefined,fallback:string):FormState {
  if (code==="40001") return {error:"Cette tentative ne correspond plus au même formulaire. Rechargez la page."};
  if (code==="22023") return {error:"Écriture refusée. Vérifiez la date et les éléments sélectionnés."};
  if (code==="23514") return {error:"Écriture refusée : solde insuffisant ou montant supérieur à l’écriture d’origine."};
  if (code==="22003") return {error:"Le montant cumulé dépasse la limite autorisée."};
  return {error:fallback};
}

export async function createExpenseCategory(_state:FormState,form:FormData):Promise<FormState> {
  const organization=String(form.get("organization_id")??"");
  const title=String(form.get("title")??"").trim();
  if (!uuid.test(organization) || title.length<2 || title.length>80) return {error:"Saisissez un nom de catégorie entre 2 et 80 caractères."};
  try {
    const client=await financeClient(organization);
    if (!client) return {error:"Vous ne pouvez pas gérer la finance de cet espace."};
    const result=await client.rpc("create_expense_category",{p_org:organization,p_title:title,p_parent:null});
    if (result.error?.code==="23505") return {error:"Cette catégorie existe déjà."};
    if (result.error) return {error:"La catégorie n’a pas été créée. Vérifiez vos droits."};
  } catch { return {error:"Le service est indisponible. Réessayez dans un moment."}; }
  revalidatePath("/workspace/finance");
  return {message:"Catégorie créée."};
}

export async function createCashAccount(_state:FormState,form:FormData):Promise<FormState> {
  const organization=String(form.get("organization_id")??"");
  const name=String(form.get("name")??"").trim();
  if (!uuid.test(organization) || name.length<2 || name.length>80) return {error:"Saisissez un nom de caisse entre 2 et 80 caractères."};
  try {
    const client=await financeClient(organization);
    if (!client) return {error:"Vous ne pouvez pas gérer la finance de cet espace."};
    const result=await client.rpc("create_cash_account",{p_org:organization,p_name:name});
    if (result.error?.code==="23505") return {error:"Cette caisse existe déjà."};
    if (result.error) return {error:"La caisse n’a pas été créée. Vérifiez vos droits."};
  } catch { return {error:"Le service est indisponible. Réessayez dans un moment."}; }
  revalidatePath("/workspace/finance");
  return {message:"Caisse créée avec un solde initial de 0,00 €."};
}

export async function recordPersonalExpense(_state:FormState,form:FormData):Promise<FormState> {
  const organization=String(form.get("organization_id")??"");
  const scope=String(form.get("scope_id")??"");
  const category=String(form.get("category_id")??"");
  const receipt=String(form.get("receipt_file_id")??"");
  const payer=String(form.get("payer_id")??"");
  const commandKey=String(form.get("command_key")??"");
  const label=String(form.get("label")??"").trim();
  const spentOn=String(form.get("spent_on")??"");
  let parsedAmount:number;
  try { parsedAmount=amount(form); }
  catch { return {error:"Saisissez un montant EUR positif avec deux décimales maximum."}; }
  if (![organization,scope,category,receipt,payer,commandKey].every(value=>uuid.test(value))
    || label.length<2 || label.length>160 || !date.test(spentOn)) {
    return {error:"Vérifiez le libellé, la date, le périmètre, la catégorie, le payeur et le justificatif."};
  }
  try {
    const client=await financeClient(organization);
    if (!client) return {error:"Vous ne pouvez pas confirmer une dépense dans cet espace."};
    const result=await client.rpc("record_personal_expense",{
      p_org:organization,p_scope:scope,p_category:category,p_receipt:receipt,
      p_label:label,p_amount_minor:parsedAmount,p_spent_on:spentOn,p_payer:payer,p_command_key:commandKey,
    });
    if (result.error) return financeError(result.error.code,"La dépense n’a pas été enregistrée. Vérifiez vos droits.");
  } catch { return {error:"Le service est indisponible. Réessayez dans un moment."}; }
  revalidatePath("/workspace/finance");
  return {message:"Dépense confirmée : coût et contribution augmentés, caisse inchangée."};
}

export async function recordFundDeposit(_state:FormState,form:FormData):Promise<FormState> {
  const organization=String(form.get("organization_id")??"");
  const account=String(form.get("cash_account_id")??"");
  const founder=String(form.get("founder_id")??"");
  const commandKey=String(form.get("command_key")??"");
  const label=String(form.get("label")??"").trim();
  const depositedOn=String(form.get("deposited_on")??"");
  let parsedAmount:number;
  try { parsedAmount=amount(form); }
  catch { return {error:"Saisissez un montant EUR positif avec deux décimales maximum."}; }
  if (![organization,account,founder,commandKey].every(value=>uuid.test(value))
    || label.length<2 || label.length>160 || !date.test(depositedOn)) {
    return {error:"Vérifiez le libellé, la date, la caisse et le fondateur."};
  }
  try {
    const client=await financeClient(organization);
    if (!client) return {error:"Vous ne pouvez pas confirmer un versement dans cet espace."};
    const result=await client.rpc("record_fund_deposit",{
      p_org:organization,p_account:account,p_founder:founder,p_label:label,
      p_amount_minor:parsedAmount,p_deposited_on:depositedOn,p_command_key:commandKey,
    });
    if (result.error) return financeError(result.error.code,"Le versement n’a pas été enregistré. Vérifiez vos droits.");
  } catch { return {error:"Le service est indisponible. Réessayez dans un moment."}; }
  revalidatePath("/workspace/finance");
  return {message:"Versement confirmé : contribution et caisse augmentées une seule fois."};
}

export async function recordFundExpense(_state:FormState,form:FormData):Promise<FormState> {
  const organization=String(form.get("organization_id")??"");
  const scope=String(form.get("scope_id")??"");
  const category=String(form.get("category_id")??"");
  const receipt=String(form.get("receipt_file_id")??"");
  const account=String(form.get("cash_account_id")??"");
  const commandKey=String(form.get("command_key")??"");
  const label=String(form.get("label")??"").trim();
  const spentOn=String(form.get("spent_on")??"");
  let parsedAmount:number;
  try { parsedAmount=amount(form); }
  catch { return {error:"Saisissez un montant EUR positif avec deux décimales maximum."}; }
  if (![organization,scope,category,receipt,account,commandKey].every(value=>uuid.test(value))
    || label.length<2 || label.length>160 || !date.test(spentOn)) {
    return {error:"Vérifiez le libellé, la date, la caisse, le périmètre, la catégorie et le justificatif."};
  }
  try {
    const client=await financeClient(organization);
    if (!client) return {error:"Vous ne pouvez pas confirmer une dépense du fonds dans cet espace."};
    const result=await client.rpc("record_fund_expense",{
      p_org:organization,p_scope:scope,p_category:category,p_receipt:receipt,p_account:account,
      p_label:label,p_amount_minor:parsedAmount,p_spent_on:spentOn,p_command_key:commandKey,
    });
    if (result.error) return financeError(result.error.code,"La dépense du fonds n’a pas été enregistrée. Vérifiez vos droits.");
  } catch { return {error:"Le service est indisponible. Réessayez dans un moment."}; }
  revalidatePath("/workspace/finance");
  return {message:"Dépense du fonds confirmée : coût augmenté, caisse diminuée, contributions inchangées."};
}

export async function recordSupplierRefund(_state:FormState,form:FormData):Promise<FormState> {
  const organization=String(form.get("organization_id")??"");
  const expense=String(form.get("expense_id")??"");
  const account=String(form.get("cash_account_id")??"");
  const commandKey=String(form.get("command_key")??"");
  const label=String(form.get("label")??"").trim();
  const receivedOn=String(form.get("received_on")??"");
  let parsedAmount:number;
  try { parsedAmount=amount(form); }
  catch { return {error:"Saisissez un montant EUR positif avec deux décimales maximum."}; }
  if (![organization,expense,account,commandKey].every(value=>uuid.test(value))
    || label.length<2 || label.length>160 || !date.test(receivedOn)) {
    return {error:"Vérifiez le libellé, la date, la caisse et la dépense d’origine."};
  }
  try {
    const client=await financeClient(organization);
    if (!client) return {error:"Vous ne pouvez pas confirmer un avoir dans cet espace."};
    const result=await client.rpc("record_supplier_refund",{
      p_org:organization,p_expense:expense,p_account:account,p_label:label,
      p_amount_minor:parsedAmount,p_received_on:receivedOn,p_command_key:commandKey,
    });
    if (result.error) return financeError(result.error.code,"L’avoir fournisseur n’a pas été enregistré. Vérifiez vos droits.");
  } catch { return {error:"Le service est indisponible. Réessayez dans un moment."}; }
  revalidatePath("/workspace/finance");
  return {message:"Avoir fournisseur confirmé : coût net réduit et caisse restaurée, contributions inchangées."};
}
