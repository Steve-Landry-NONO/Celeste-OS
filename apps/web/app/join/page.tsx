import Link from "next/link";
import { createServerSupabase } from "../../lib/supabase/server";
import { supabaseConfig } from "../../lib/supabase/config";
import { JoinForm } from "./join-form";
export const dynamic = "force-dynamic";

export default async function Join() {
  if (!supabaseConfig()) return <section className="panel"><h1>Connexion à préparer</h1><p>Configurez cet environnement pour rejoindre un espace.</p></section>;
  const client = await createServerSupabase();
  const { data: { user }, error } = await client.auth.getUser();
  return <><div className="page-heading"><p className="eyebrow">VOTRE ÉQUIPE</p><h1>Rejoindre<br/><em>un espace.</em></h1><p className="lead">Une invitation dure 7 jours et s’utilise une seule fois. Connectez-vous avec l’adresse email invitée.</p></div>
    <section className="panel auth-panel">{!error && user ? <><h2>Votre invitation</h2><JoinForm/><Link href="/workspace">Retour à mes espaces</Link></> : <><h2>Connectez-vous d’abord</h2><p>Gardez votre code : vous pourrez le saisir ici après connexion et confirmation de votre email.</p><Link href="/login">Se connecter</Link><p><Link href="/register">Créer mon compte</Link></p></>}</section></>;
}
