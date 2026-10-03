import { AuthForm } from "../auth/auth-form";
import { supabaseConfig } from "../../lib/supabase/config";
export default async function Login({ searchParams }: { searchParams: Promise<{ confirmation?: string }> }) {
  const configured = !!supabaseConfig();
  const confirmationFailed = (await searchParams).confirmation === "failed";
  return <><div className="page-heading"><p className="eyebrow">VOTRE ESPACE CELESTE</p><h1>Heureux de<br/><em>vous retrouver.</em></h1><p className="lead">Connectez-vous pour retrouver vos organisations et vos accès.</p></div>
    <section className="panel auth-panel"><h2>Connexion</h2>{confirmationFailed && <p role="alert">La confirmation du compte a échoué. Vérifiez le lien reçu avant de réessayer.</p>}{!configured && <p role="status">La connexion n’est pas encore configurée dans cet environnement.</p>}<AuthForm mode="login" configured={configured}/></section></>;
}
