"use server";
import { redirect } from "next/navigation";
import { createServerSupabase } from "../../lib/supabase/server";
import { appOrigin, supabaseConfig } from "../../lib/supabase/config";

export type FormState = { error?: string; message?: string };
function credentials(form: FormData) {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 1 || password.length > 256) return null;
  return { email, password };
}
export async function signIn(_state: FormState, form: FormData): Promise<FormState> {
  if (!supabaseConfig()) return { error: "La connexion sera disponible après configuration de cet environnement." };
  const input = credentials(form);
  if (!input) return { error: "Vérifiez votre adresse email et votre mot de passe." };
  try {
    const client = await createServerSupabase(true);
    const { error } = await client.auth.signInWithPassword(input);
    if (error) return { error: "Connexion impossible. Vérifiez vos identifiants et la confirmation de votre email." };
  } catch { return { error: "Le service de connexion est indisponible. Réessayez dans un moment." }; }
  redirect("/workspace");
}
export async function signUp(_state: FormState, form: FormData): Promise<FormState> {
  const origin = appOrigin();
  if (!supabaseConfig() || !origin) return { error: "L’inscription sera disponible après configuration de cet environnement." };
  const input = credentials(form);
  const name = String(form.get("display_name") ?? "").trim();
  if (!input || input.password.length < 12 || name.length < 1 || name.length > 100) return { error: "Renseignez un nom, une adresse valide et un mot de passe de 12 caractères minimum." };
  let signedIn = false;
  try {
    const client = await createServerSupabase(true);
    const { data, error } = await client.auth.signUp({
      ...input,
      options: { data: { display_name: name }, emailRedirectTo: origin + "/auth/callback" },
    });
    if (error) return { error: "Inscription impossible pour le moment. Réessayez plus tard." };
    signedIn = !!data.session;
  } catch { return { error: "Le service d’inscription est indisponible. Réessayez dans un moment." }; }
  if (signedIn) redirect("/workspace");
  return { message: "Si votre inscription est acceptée, un lien de confirmation vous sera envoyé. Ouvrez-le dans le même navigateur, puis connectez-vous." };
}
export async function signOut() {
  const client = await createServerSupabase(true);
  await client.auth.signOut({ scope: "local" });
  redirect("/login");
}
export async function createOrganization(_state: FormState, form: FormData): Promise<FormState> {
  const name = String(form.get("name") ?? "").trim();
  if ([...name].length < 2 || [...name].length > 100) return { error: "Choisissez un nom de 2 à 100 caractères." };
  try {
    const client = await createServerSupabase(true);
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return { error: "Votre session a expiré. Reconnectez-vous." };
    const { error } = await client.rpc("create_organization", { p_name: name });
    if (error) return { error: "Création impossible. Vérifiez le nom ou rechargez votre espace." };
  } catch { return { error: "Votre espace est indisponible. Réessayez dans un moment." }; }
  redirect("/workspace");
}
