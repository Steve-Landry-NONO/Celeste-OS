import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "../../../lib/supabase/server";
import { supabaseConfig } from "../../../lib/supabase/config";
import { CreateScopeForm, GrantScopeForm, RevokeScopeForm } from "./forms";
import { ScopeFileUpload, ScopeFileWriteForm } from "./file-forms";
export const dynamic="force-dynamic";

export default async function Scopes({searchParams}:{searchParams:Promise<{organization?:string}>}) {
  if (!supabaseConfig()) return <section className="panel"><h1>Connexion à préparer</h1><p>Configurez cet environnement pour consulter vos projets et missions.</p></section>;
  const client=await createServerSupabase();
  const {data:{user},error}=await client.auth.getUser();
  if (error || !user) redirect("/login");
  const {organization:org}=await searchParams;
  if (!org || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(org)) redirect("/workspace");
  const [actor,organization,scopes,files]=await Promise.all([
    client.from("memberships").select("role,status").eq("organization_id",org).eq("user_id",user.id).maybeSingle(),
    client.from("organizations").select("name").eq("id",org).maybeSingle(),
    client.from("resource_scopes").select("id,kind,name,parent_project_id").eq("organization_id",org).order("created_at").order("id"),
    client.from("scope_files").select("id,scope_id,file_name,content_type,size_bytes,checksum_sha256,created_at").eq("organization_id",org).order("created_at"),
  ]);
  if (actor.error || organization.error || scopes.error || files.error) return <section className="notice" role="alert"><p>Les projets, missions et fichiers sont indisponibles. Rechargez la page dans un instant.</p></section>;
  if (!organization.data || actor.data?.status!=="active") return <section className="panel"><h1>Accès réservé</h1><p>Vous n’avez pas accès à cet espace.</p><Link href="/workspace">Retour à mes espaces</Link></section>;
  const isAdmin=actor.data.role==="founder_admin";
  const [members,grants]=isAdmin ? await Promise.all([
    client.rpc("list_organization_members",{p_org:org}),client.rpc("list_scope_access",{p_org:org}),
  ]) : [{data:[],error:null},{data:[],error:null}];
  if (members.error || grants.error) return <section className="notice" role="alert"><p>Les droits sont indisponibles. Rechargez la page.</p></section>;
  const projects=scopes.data?.filter(s=>s.kind==="project")??[];
  const writeChecks=await Promise.all((scopes.data??[]).map(async scope=>{
    const result=await client.rpc("can_write_scope_file",{p_scope:scope.id});
    return [scope.id,!result.error && result.data===true] as const;
  }));
  const writable=new Map(writeChecks);
  const filesByScope=new Map<string,typeof files.data>();
  for (const file of files.data??[]) filesByScope.set(file.scope_id,[...(filesByScope.get(file.scope_id)??[]),file]);
  return <><div className="page-heading"><Link href="/workspace">← Mes espaces</Link><p className="eyebrow">PROJETS ET MISSIONS</p><h1>Vos périmètres,<br/><em>{organization.data.name}.</em></h1><p className="lead">Seuls les projets et missions que vous pouvez lire apparaissent ici. Chaque accès est indépendant.</p></div>
    {isAdmin && <><section className="panel auth-panel"><h2>Nouveau projet</h2><CreateScopeForm organization={org} kind="project"/></section><section className="panel auth-panel"><h2>Nouvelle mission</h2><CreateScopeForm organization={org} kind="mission" projects={projects}/></section><section className="notice"><p>Administrateurs et profils Finance lisent tous les périmètres. Les autres membres ont besoin d’un accès explicite. Les prestataires peuvent recevoir uniquement des missions. Retirer un accès explicite ne retire pas un droit accordé par le rôle.</p></section></>}
    <section className="cards" aria-label="Mes projets et missions">{scopes.data?.map(scope=>{
      const access=grants.data?.filter(g=>g.scope_id===scope.id)??[];
      const eligible=members.data?.filter(m=>m.status==="active" && ["member","support","vendor"].includes(m.role) && (scope.kind==="mission" || m.role!=="vendor"))??[];
      const scopeFiles=filesByScope.get(scope.id)??[];
      return <article className="card" key={scope.id} data-scope-id={scope.id}><p className="eyebrow">{scope.kind==="project"?"Projet":"Mission"}</p><h2 className="member-name">{scope.name}</h2>
        {isAdmin && <><h3>Accords de lecture</h3>{access.filter(g=>g.granted).length ? <ul className="invitation-list">{access.filter(g=>g.granted).map(g=>{
          const member=members.data?.find(m=>m.user_id===g.user_id);
          const status=member?.status!=="active" ? "Accord inactif — membre suspendu ou absent."
            : scope.kind==="project" && member.role==="vendor" ? "Accord inactif — rôle prestataire."
            : "Lecture active.";
          return <li key={g.user_id} data-scope-user={g.user_id}><p className="member-name">{member?.display_name??"Membre"}</p><p>{status} {g.file_write && status==="Lecture active."?"Dépôt autorisé.":""}</p>{status==="Lecture active." ? <ScopeFileWriteForm key={"write-"+g.row_version} organization={org} scope={scope.id} grant={g}/> : null}<RevokeScopeForm key={"read-"+g.row_version} organization={org} scope={scope.id} grant={g}/></li>;
        })}</ul>:<p>Aucun accès explicite.</p>}<GrantScopeForm organization={org} scope={scope.id} members={eligible} grants={access}/></>}
        <h3>Fichiers privés</h3>{scopeFiles.length ? <ul className="scope-file-list">{scopeFiles.map(file=><li key={file.id}><Link href={"/workspace/files/"+file.id}>{file.file_name}</Link><span>{Math.ceil(file.size_bytes/1024)} Ko · SHA-256 {file.checksum_sha256.slice(0,12)}…</span></li>)}</ul>:<p>Aucun fichier partagé.</p>}
        {writable.get(scope.id) ? <ScopeFileUpload organization={org} scope={scope.id}/> : <p className="form-hint">Lecture seule : le dépôt nécessite une permission distincte.</p>}
      </article>;
    })}</section>{!scopes.data?.length && <section className="notice"><p>Aucun projet ou mission accessible pour le moment.</p></section>}</>;
}
