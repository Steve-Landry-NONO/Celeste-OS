import { AuthForm } from "../auth/auth-form";
import { appOrigin, supabaseConfig } from "../../lib/supabase/config";
export default function Register() {
  const configured = !!supabaseConfig() && !!appOrigin();
  return <><div className="page-heading"><p className="eyebrow">UN COMPTE, VOS ESPACES</p><h1>Une place pour<br/><em>avancer ensemble.</em></h1><p className="lead">Créer un compte ne donne pas accès aux organisations existantes. Un administrateur doit vous y ajouter.</p></div>
    <section className="panel auth-panel"><h2>Créer mon compte</h2>{!configured && <p role="status">L’inscription n’est pas encore configurée dans cet environnement.</p>}<AuthForm mode="register" configured={configured}/></section></>;
}
