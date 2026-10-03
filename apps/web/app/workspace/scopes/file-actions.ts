"use server";
import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "../../../lib/supabase/server";
import type { FormState } from "../../auth/actions";

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const maxSize=20*1024*1024;
const mimeTypes=new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/markdown","text/plain","image/png","image/jpeg",
]);
const officeTypes=new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);
function signatureMatches(type:string,bytes:Uint8Array) {
  if (type==="application/pdf") return Buffer.from(bytes.subarray(0,5)).toString()==="%PDF-";
  if (type==="image/png") return [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a].every((value,index)=>bytes[index]===value);
  if (type==="image/jpeg") return bytes[0]===0xff && bytes[1]===0xd8 && bytes[2]===0xff;
  if (officeTypes.has(type)) return bytes[0]===0x50 && bytes[1]===0x4b && bytes[2]===0x03 && bytes[3]===0x04;
  return type==="text/markdown" || type==="text/plain";
}

export async function uploadScopeFile(_state:FormState,form:FormData):Promise<FormState> {
  const organization=String(form.get("organization_id")??"");
  const scope=String(form.get("scope_id")??"");
  const file=form.get("file");
  if (!uuid.test(organization) || !uuid.test(scope) || !(file instanceof File)
    || file.size<1 || file.size>maxSize || file.name.length<1 || file.name.length>160
    || /[\x00-\x1f\x7f/\\]/.test(file.name) || !mimeTypes.has(file.type)) {
    return {error:"Choisissez un fichier autorisé de 20 Mo maximum."};
  }
  const bytes=new Uint8Array(await file.arrayBuffer());
  if (!signatureMatches(file.type,bytes)) return {error:"Le contenu du fichier ne correspond pas à son format."};
  const checksum=createHash("sha256").update(bytes).digest("hex");
  let reservation:{id:string;object_key:string}|undefined;
  let uploaded=false;
  try {
    const client=await createServerSupabase(true);
    const {data:{user},error:authError}=await client.auth.getUser();
    if (authError || !user) return {error:"Votre session a expiré. Reconnectez-vous."};
    const reserved=await client.rpc("reserve_scope_file",{
      p_org:organization,p_scope:scope,p_file_name:file.name,p_content_type:file.type,
      p_size_bytes:file.size,p_checksum_sha256:checksum,
    });
    reservation=reserved.data?.[0];
    if (reserved.error || !reservation) return {error:"Dépôt refusé. Vérifiez votre accès en écriture."};
    const stored=await client.storage.from("celeste-private").upload(reservation.object_key,bytes,{contentType:file.type,upsert:false});
    if (stored.error) {
      await client.rpc("cancel_scope_file",{p_file:reservation.id});
      return {error:"Le transfert du fichier a échoué. Aucun fichier n’a été publié."};
    }
    uploaded=true;
    const finalized=await client.rpc("finalize_scope_file",{p_file:reservation.id});
    if (finalized.error) {
      await client.storage.from("celeste-private").remove([reservation.object_key]);
      await client.rpc("cancel_scope_file",{p_file:reservation.id});
      return {error:"Le fichier n’a pas pu être finalisé. Aucun fichier n’a été publié."};
    }
  } catch {
    if (reservation) {
      try {
        const client=await createServerSupabase(true);
        if (uploaded) await client.storage.from("celeste-private").remove([reservation.object_key]);
        await client.rpc("cancel_scope_file",{p_file:reservation.id});
      } catch { /* La réservation expirée sera nettoyée par l’exploitation future. */ }
    }
    return {error:"Le service de fichiers est indisponible. Réessayez dans un moment."};
  }
  revalidatePath("/workspace/scopes");
  return {message:"Fichier privé ajouté."};
}

export async function setScopeFileWrite(_state:FormState,form:FormData):Promise<FormState> {
  const organization=String(form.get("organization_id")??"");
  const scope=String(form.get("scope_id")??"");
  const user=String(form.get("user_id")??"");
  const allowed=String(form.get("allowed")??"");
  const rawVersion=String(form.get("row_version")??"");
  const version=Number(rawVersion);
  if (![organization,scope,user].every(value=>uuid.test(value)) || !["true","false"].includes(allowed)
    || !/^[1-9]\d*$/.test(rawVersion) || !Number.isSafeInteger(version)) return {error:"Permission invalide. Rechargez la page."};
  try {
    const client=await createServerSupabase(true);
    const {data:{user:actor},error:authError}=await client.auth.getUser();
    if (authError || !actor) return {error:"Votre session a expiré. Reconnectez-vous."};
    const membership=await client.from("memberships").select("role,status").eq("organization_id",organization).eq("user_id",actor.id).maybeSingle();
    if (membership.error || membership.data?.role!=="founder_admin" || membership.data.status!=="active") return {error:"Vous ne pouvez pas administrer cet espace."};
    const result=await client.rpc("set_scope_file_write",{p_org:organization,p_scope:scope,p_user:user,p_allowed:allowed==="true",p_expected_version:version});
    if (result.error?.code==="40001") return {error:"Cet accès a changé dans une autre session. Rechargez la page."};
    if (result.error) return {error:"Permission refusée. Vérifiez le rôle, le statut et l’accès de lecture."};
  } catch { return {error:"Le service est indisponible. Réessayez dans un moment."}; }
  revalidatePath("/workspace/scopes");
  return {message:allowed==="true"?"Dépôt autorisé.":"Dépôt révoqué."};
}
