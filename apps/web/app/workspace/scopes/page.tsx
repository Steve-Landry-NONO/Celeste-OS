import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "../../../lib/supabase/server";
import { supabaseConfig } from "../../../lib/supabase/config";
import { CreateScopeForm, GrantScopeForm, RevokeScopeForm } from "./forms";
export const dynamic="force-dynamic";

export default async function Scopes({searchParams}:{searchParams:Promise<{organization?:string}>}) {
  if (!supabaseConfig()) return <section className="panel"><h1>Connexion à préparer</h1><p>Configurez cet environnement pour consulter vos projets et missions.</p></section>;
  const client=await createServerSupabase();
  const {data:{user},error}=await client.auth.getUser();
  if (error || !user) redirect("/login");
  const {organization:org}=await searchParams;
  if (!org || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(org)) redirect("/workspace");
  const [actor,organization,scopes]=await Promise.all([
    client.from("memberships").select("role,status").eq("organization_id",org).eq("user_id",user.id).maybeSingle(),
    client.from("organizations").select("name").eq("id",org).maybeSingle(),
    client.from("resource_scopes").select("id,kind,name,parent_project_id").eq("organization_id",org).order("created_at").order("id"),
  ]);
  if (actor.error || organization.error || scopes.error) return <section className="notice" role="alert"><p>Les projets et missions sont indisponibles. Rechargez la page dans un instant.</p></section>;
  if (!organization.data || actor.data?.status!=="active") return <section className="panel"><h1>Accès réservé</h1><p>Vous n’avez pas accès à cet espace.</p><Link href="/workspace">Retour à mes espaces</Link></section>;
  const isAdmin=actor.data.role==="founder_admin";
  const [members,grants]=isAdmin ? await Promise.all([
    client.rpc("list_organization_members",{p_org:org}),client.rpc("list_scope_access",{p_org:org}),
  ]) : [{data:[],error:null},{data:[],error:null}];
  if (members.error || grants.error) return <section className="notice" role="alert"><p>Les droits sont indisponibles. Rechargez la page.</p></section>;
  const projects=scopes.data?.filter(s=>s.kind==="project")??[];
  return <><div className="page-heading"><Link href="/workspace">← Mes espaces</Link><p className="eyebrow">PROJETS ET MISSIONS</p><h1>Vos périmètres,<br/><em>{organization.data.name}.</em></h1><p className="lead">Seuls les projets et missions que vous pouvez lire apparaissent ici. Chaque accès est indépendant.</p></div>
    {isAdmin && <><section className="panel auth-panel"><h2>Nouveau projet</h2><CreateScopeForm organization={org} kind="project"/></section><section className="panel auth-panel"><h2>Nouvelle mission</h2><CreateScopeForm organization={org} kind="mission" projects={projects}/></section><section className="notice"><p>Administrateurs et profils Finance lisent tous les périmètres. Les autres membres ont besoin d’un accès explicite. Les prestataires peuvent recevoir uniquement des missions. Retirer un accès explicite ne retire pas un droit accordé par le rôle.</p></section></>}
    <section className="cards" aria-label="Mes projets et missions">{scopes.data?.map(scope=>{
      const access=grants.data?.filter(g=>g.scope_id===scope.id)??[];
      const eligible=members.data?.filter(m=>m.status==="active" && ["member","support","vendor"].includes(m.role) && (scope.kind==="mission" || m.role!=="vendor"))??[];
      return <article className="card" key={scope.id} data-scope-id={scope.id}><p className="eyebrow">{scope.kind==="project"?"Projet":"Mission"}</p><h2 className="member-name">{scope.name}</h2>
        {isAdmin && <><h3>Lecture accordée</h3>{access.filter(g=>g.granted).length ? <ul className="invitation-list">{access.filter(g=>g.granted).map(g=><li key={g.user_id} data-scope-user={g.user_id}><p className="member-name">{members.data?.find(m=>m.user_id===g.user_id)?.display_name??"Membre"}</p><RevokeScopeForm key={g.row_version} organization={org} scope={scope.id} grant={g}/></li>)}</ul>:<p>Aucun accès explicite.</p>}<GrantScopeForm organization={org} scope={scope.id} members={eligible} grants={access}/></>}
      </article>;
    })}</section>{!scopes.data?.length && <section className="notice"><p>Aucun projet ou mission accessible pour le moment.</p></section>}</>;
}
