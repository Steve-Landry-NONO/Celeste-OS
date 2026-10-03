import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "../../../lib/supabase/server";
import { supabaseConfig } from "../../../lib/supabase/config";
import { MemberForm } from "./member-form";
import { InvitationForm, RevokeInvitationForm } from "./invitation-form";
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
  const [organization, members, invitations] = await Promise.all([
    client.from("organizations").select("name").eq("id", org).maybeSingle(),
    client.rpc("list_organization_members", { p_org: org }),
    client.rpc("list_invitations", { p_org: org }),
  ]);
  if (organization.error || members.error || invitations.error || !organization.data) return <section className="notice" role="alert"><p>La liste des membres est indisponible. Rechargez la page.</p></section>;
  return <><div className="page-heading"><Link href="/workspace">← Mes espaces</Link><p className="eyebrow">ADMINISTRATION</p><h1>Membres de<br/><em>{organization.data.name}</em></h1><p className="lead">Modifiez le rôle ou suspendez un accès. Une suspension retire les droits sur cet espace dès la prochaine opération.</p></div>
    <section className="cards" aria-label="Membres de l’organisation">{members.data?.map(member => <article className="card" key={member.id} data-member-id={member.user_id}>
      <h2 className="member-name">{member.display_name}</h2>{member.user_id === user.id && <p className="muted">Votre compte</p>}<p className="member-reference">Référence : {member.user_id}</p>
      <MemberForm key={member.row_version} membership={member}/>
    </article>)}</section>
    <section className="panel auth-panel"><h2>Inviter un membre</h2><InvitationForm organization={org}/></section>
    <section className="panel"><h2>Historique des invitations</h2>{invitations.data?.length ? <ul className="invitation-list">{invitations.data.map(invitation => <li key={invitation.id} data-invitation-id={invitation.id}>
      <h3>{invitation.email}</h3><p>{({pending:"En attente",accepted:"Acceptée",revoked:"Révoquée",expired:"Expirée"} as Record<string,string>)[invitation.status]} · {({member:"Équipe",support:"Support",vendor:"Prestataire",founder_finance:"Finance",founder_admin:"Administrateur"} as Record<string,string>)[invitation.role]}</p>
      <p className="muted">Expire le {new Intl.DateTimeFormat("fr-FR",{dateStyle:"medium",timeStyle:"short",timeZone:"Europe/Paris"}).format(new Date(invitation.expires_at))}</p>
      {invitation.status === "pending" && <RevokeInvitationForm organization={org} invitation={invitation.id}/>}
    </li>)}</ul> : <p>Aucune invitation pour le moment.</p>}</section></>;
}
