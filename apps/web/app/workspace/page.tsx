import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabase } from "../../lib/supabase/server";
import { supabaseConfig } from "../../lib/supabase/config";
import { OrganizationForm } from "../auth/auth-form";
import { signOut } from "../auth/actions";
export const dynamic = "force-dynamic";
const roles: Record<string,string> = {founder_admin:"Administrateur",founder_finance:"Finance",member:"Équipe",support:"Support",vendor:"Prestataire"};
export default async function Workspace() {
  if (!supabaseConfig()) return <section className="panel"><h1>Connexion à préparer</h1><p>Les accès de cet environnement doivent être configurés pour ouvrir vos espaces.</p></section>;
  const client = await createServerSupabase();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) redirect("/login");
  const [organizations, memberships, profile] = await Promise.all([
    client.from("organizations").select("id,name,timezone,base_currency").order("created_at"),
    client.from("memberships").select("organization_id,role").eq("user_id",user.id).eq("status","active"),
    client.from("profiles").select("display_name").eq("id",user.id).maybeSingle(),
  ]);
  return <><div className="page-heading"><p className="eyebrow">ESPACE PERSONNEL</p><h1>Bonjour,<br/><em>{profile.data?.display_name ?? "à vous"}.</em></h1><p className="lead">Vos espaces et vos accès sont lus depuis CELESTE OS.</p><form action={signOut}><button className="secondary-button" type="submit">Se déconnecter</button></form></div>
    {organizations.error || memberships.error || profile.error ? <section className="notice" role="alert"><p>Vos espaces ne sont pas disponibles pour le moment. Rechargez cette page dans un instant.</p></section> :
      <><section className="cards" aria-label="Mes organisations">{organizations.data?.map(org => { const role=memberships.data?.find(m=>m.organization_id===org.id)?.role??""; return <article className="card" key={org.id}><p className="eyebrow">{roles[role]??"Membre"}</p><h2>{org.name}</h2><p>{org.timezone} · {org.base_currency}</p><p>Consultez vos projets, missions et écritures autorisées.</p><Link className="text-link" href={"/workspace/scopes?organization="+org.id}>Projets et missions</Link>{["founder_admin","founder_finance"].includes(role) && <Link className="text-link" href={"/workspace/finance?organization="+org.id}>Finance et contributions</Link>}{role === "founder_admin" && <Link className="text-link" href={"/workspace/members?organization="+org.id}>Gérer les membres</Link>}</article>;})}</section>
      {!organizations.data?.length && <section className="notice"><p>Vous n’avez aucun espace pour le moment. Vous pouvez en créer un, ou demander à un administrateur de vous ajouter à son organisation.</p></section>}</>}
    <section className="panel auth-panel"><h2>Votre équipe vous attend</h2><p>Vous avez reçu un code d’invitation ?</p><Link href="/join">Rejoindre un espace</Link></section>
    <section className="panel auth-panel"><h2>Un nouvel espace</h2><p>Vous administrerez l’organisation que vous créez. Les autres espaces restent privés.</p><OrganizationForm/></section></>;
}
