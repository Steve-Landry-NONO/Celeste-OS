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

export async function recordPersonalExpense(_state:FormState,form:FormData):Promise<FormState> {
  const organization=String(form.get("organization_id")??"");
  const scope=String(form.get("scope_id")??"");
  const category=String(form.get("category_id")??"");
  const receipt=String(form.get("receipt_file_id")??"");
  const payer=String(form.get("payer_id")??"");
  const commandKey=String(form.get("command_key")??"");
  const label=String(form.get("label")??"").trim();
  const spentOn=String(form.get("spent_on")??"");
  let amount:number;
  try { amount=parseEuros(String(form.get("amount")??"")); }
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
      p_label:label,p_amount_minor:amount,p_spent_on:spentOn,p_payer:payer,p_command_key:commandKey,
    });
    if (result.error?.code==="40001") return {error:"Cette tentative ne correspond plus au même formulaire. Rechargez la page."};
    if (result.error?.code==="22023") return {error:"Dépense refusée. Vérifiez la date, le payeur et que le justificatif appartient au périmètre choisi."};
    if (result.error) return {error:"La dépense n’a pas été enregistrée. Vérifiez vos droits."};
  } catch { return {error:"Le service est indisponible. Réessayez dans un moment."}; }
  revalidatePath("/workspace/finance");
  return {message:"Dépense confirmée : coût et contribution augmentés, caisse inchangée."};
}

