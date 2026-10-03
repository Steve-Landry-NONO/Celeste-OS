"use server";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "../../../lib/supabase/server";
import type { FormState } from "../../auth/actions";

export async function updateMembership(_state: FormState, form: FormData): Promise<FormState> {
  const org = String(form.get("organization_id") ?? "");
  const userId = String(form.get("user_id") ?? "");
  const role = String(form.get("role") ?? "");
  const status = String(form.get("status") ?? "");
  const rawVersion = String(form.get("row_version") ?? "");
  const version = Number(rawVersion);
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid.test(org) || !uuid.test(userId) || !/^[1-9]\d*$/.test(rawVersion) || !Number.isSafeInteger(version)
    || !["founder_admin", "founder_finance", "member", "support", "vendor"].includes(role)
    || !["active", "suspended"].includes(status)) return { error: "La modification est invalide. Rechargez la liste des membres." };
  try {
    const client = await createServerSupabase(true);
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return { error: "Votre session a expiré. Reconnectez-vous." };
    // Hidden fields are untrusted. RLS and the atomic RPC recheck the actor's rights.
    const actor = await client.from("memberships").select("role,status")
      .eq("organization_id", org).eq("user_id", user.id).maybeSingle();
    if (actor.error || actor.data?.role !== "founder_admin" || actor.data.status !== "active") {
      return { error: "Vous ne pouvez pas administrer les membres de cet espace." };
    }
    const { error } = await client.rpc("manage_membership", {
      p_org: org, p_user: userId, p_role: role, p_status: status, p_expected_version: version,
    });
    if (error?.code === "40001") return { error: "Ce membre a été modifié dans une autre session. Rechargez la page avant de recommencer." };
    if (error?.code === "42501") return { error: "Vos droits ont changé. Rechargez votre espace." };
    if (error?.message === "Last administrator must remain active") return { error: "Le dernier administrateur doit rester actif. Désignez un autre administrateur avant de modifier votre accès." };
    if (error) return { error: "La modification n’a pas été enregistrée. Rechargez la liste des membres." };
  } catch { return { error: "Le service est indisponible. Réessayez dans un moment." }; }
  revalidatePath("/workspace");
  revalidatePath("/workspace/members");
  return { message: "Accès enregistré." };
}
