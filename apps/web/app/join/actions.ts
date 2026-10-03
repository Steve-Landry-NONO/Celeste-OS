"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "../../lib/supabase/server";
import type { FormState } from "../auth/actions";

export async function acceptInvitation(_state: FormState, form: FormData): Promise<FormState> {
  const token = String(form.get("token") ?? "").trim();
  if (!/^[a-f0-9]{64}$/.test(token)) return { error: "Copiez le code complet de votre invitation." };
  try {
    const client = await createServerSupabase(true);
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return { error: "Connectez-vous avant de rejoindre un espace." };
    const { error } = await client.rpc("accept_invitation", { p_token: token });
    if (error) return { error: "Ce code ne peut pas être accepté. Vérifiez l’adresse de votre compte et sa confirmation, ou demandez une nouvelle invitation." };
  } catch { return { error: "Le service est indisponible. Votre code est conservé ; réessayez." }; }
  revalidatePath("/workspace");
  redirect("/workspace");
}
