import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "../../../lib/supabase/server";
import { supabaseConfig } from "../../../lib/supabase/config";
import { MemberForm } from "./member-form";
export const dynamic = "force-dynamic";

export default async function Members({ searchParams }: { searchParams: Promise<{ organization?: string }> }) {
  if (!supabaseConfig()) return <section className="panel"><h1>Connexion à préparer</h1><p>Configurez cet environnement pour administrer un espace.</p></section>;
  const client = await createServerSupabase();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) redirect("/login");
  const { organization: org } = await searchParams;
  if (!org || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(org)) redirect("/workspace");
  const actor = await client.from("memberships").select("role,status")
    .eq("organization_id", org).eq("user_id", user.id).maybeSingle();
  if (actor.error) return <section className="notice" role="alert"><p>Les accès sont indisponibles. Rechargez la page dans un instant.</p></section>;
  if (actor.data?.role !== "founder_admin" || actor.data.status !== "active") return <section className="panel"><h1>Accès réservé</h1><p>Seul un administrateur actif peut gérer les membres de cet espace.</p><Link href="/workspace">Retour à mes espaces</Link></section>;
  const [organization, members] = await Promise.all([
    client.from("organizations").select("name").eq("id", org).maybeSingle(),
    client.from("memberships").select("*").eq("organization_id", org).order("created_at").order("id"),
  ]);
  if (organization.error || members.error || !organization.data) return <section className="notice" role="alert"><p>La liste des membres est indisponible. Rechargez la page.</p></section>;
  return <><div className="page-heading"><Link href="/workspace">← Mes espaces</Link><p className="eyebrow">ADMINISTRATION</p><h1>Membres de<br/><em>{organization.data.name}</em></h1><p className="lead">Modifiez le rôle ou suspendez un accès. Une suspension retire les droits sur cet espace dès la prochaine opération.</p><p className="muted">Les invitations et les noms des autres membres seront ajoutés dans le prochain incrément. Les comptes existants sont identifiés par leur référence.</p></div>
    <section className="cards" aria-label="Membres de l’organisation">{members.data.map(member => <article className="card" key={member.id} data-member-id={member.user_id}>
      <h2>{member.user_id === user.id ? "Votre compte" : "Compte membre"}</h2><p className="member-reference">Référence : {member.user_id}</p>
      <MemberForm key={member.row_version} membership={member}/>
    </article>)}</section></>;
}
