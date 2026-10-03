"use server";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "../../../lib/supabase/server";
import type { FormState } from "../../auth/actions";

export type InvitationState = FormState & { token?: string };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function inviteMember(_state: InvitationState, form: FormData): Promise<InvitationState> {
  const org = String(form.get("organization_id") ?? "");
  const email = String(form.get("email") ?? "").trim();
  const role = String(form.get("role") ?? "");
  if (!uuid.test(org) || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    || !["founder_admin", "founder_finance", "member", "support", "vendor"].includes(role)) {
    return { error: "Renseignez une adresse valide et un rôle." };
  }
  try {
    const client = await createServerSupabase(true);
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return { error: "Votre session a expiré. Reconnectez-vous." };
    const { data, error } = await client.rpc("create_invitation", { p_org: org, p_email: email, p_role: role });
    if (error?.code === "42501") return { error: "Vous ne pouvez pas inviter dans cet espace." };
    if (error?.code === "23505") return { error: "Une invitation est déjà en attente pour cette adresse. Révoquez-la avant d’en créer une autre." };
    if (error || !data?.[0]) return { error: "L’invitation n’a pas été créée. Réessayez dans un moment." };
    revalidatePath("/workspace/members");
    return { message: "Invitation créée pour 7 jours. Transmettez le code au destinataire ; il n’est affiché qu’ici.", token: data[0].token };
  } catch { return { error: "Le service est indisponible. Réessayez dans un moment." }; }
}

export async function revokeInvitation(_state: FormState, form: FormData): Promise<FormState> {
  const org = String(form.get("organization_id") ?? "");
  const id = String(form.get("invitation_id") ?? "");
  if (!uuid.test(org) || !uuid.test(id)) return { error: "Rechargez la liste des invitations." };
  try {
    const client = await createServerSupabase(true);
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return { error: "Votre session a expiré. Reconnectez-vous." };
    const { error } = await client.rpc("revoke_invitation", { p_org: org, p_id: id });
    if (error?.code === "42501") return { error: "Vous ne pouvez pas gérer les invitations de cet espace." };
    if (error) return { error: "Cette invitation a changé. Rechargez la page." };
    revalidatePath("/workspace/members");
    return { message: "Invitation révoquée." };
  } catch { return { error: "Le service est indisponible. Réessayez dans un moment." }; }
}
