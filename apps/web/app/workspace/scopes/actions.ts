"use server";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "../../../lib/supabase/server";
import type { FormState } from "../../auth/actions";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function administrator(org: string) {
  const client = await createServerSupabase(true);
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;
  const actor = await client.from("memberships").select("role,status")
    .eq("organization_id",org).eq("user_id",user.id).maybeSingle();
  return !actor.error && actor.data?.role === "founder_admin" && actor.data.status === "active" ? client : null;
}
export async function createScope(_state: FormState, form: FormData): Promise<FormState> {
  const org=String(form.get("organization_id")??"");
  const kind=String(form.get("kind")??"");
  const name=String(form.get("name")??"").trim();
  const parent=String(form.get("parent_project_id")??"");
  if (!uuid.test(org) || !["project","mission"].includes(kind) || name.length<2 || name.length>100
    || (kind==="project" && parent!=="") || (kind==="mission" && !uuid.test(parent))) return {error:"Vérifiez le nom et le projet de la mission."};
  try {
    const client=await administrator(org);
    if (!client) return {error:"Vous ne pouvez pas administrer cet espace."};
    const {error}=await client.rpc("create_resource_scope",{p_org:org,p_kind:kind,p_name:name,p_parent:parent||null});
    if (error) return {error:"Création refusée. Rechargez la page et vérifiez vos accès."};
  } catch { return {error:"Le service est indisponible. Réessayez dans un moment."}; }
  revalidatePath("/workspace/scopes");
  return {message:kind==="project"?"Projet créé.":"Mission créée."};
}
export async function setScopeAccess(_state: FormState, form: FormData): Promise<FormState> {
  const org=String(form.get("organization_id")??"");
  const scope=String(form.get("scope_id")??"");
  const user=String(form.get("user_id")??"");
  const granted=String(form.get("granted")??"");
  const rawVersion=String(form.get("row_version")??"");
  const version=Number(rawVersion);
  if (![org,scope,user].every(x=>uuid.test(x)) || !["true","false"].includes(granted)
    || !/^(0|[1-9]\d*)$/.test(rawVersion) || !Number.isSafeInteger(version)) return {error:"Accès invalide. Rechargez la page."};
  try {
    const client=await administrator(org);
    if (!client) return {error:"Vous ne pouvez pas administrer cet espace."};
    const {error}=await client.rpc("set_scope_access",{p_org:org,p_scope:scope,p_user:user,p_granted:granted==="true",p_expected_version:version});
    if (error?.code==="40001") return {error:"Cet accès a changé dans une autre session. Rechargez la page."};
    if (error) return {error:"Accès refusé. Vérifiez le rôle, le statut du membre et le périmètre."};
  } catch { return {error:"Le service est indisponible. Réessayez dans un moment."}; }
  revalidatePath("/workspace/scopes");
  return {message:granted==="true"?"Lecture accordée.":"Lecture révoquée."};
}
