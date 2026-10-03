"use client";
import { useActionState, useState } from "react";
import type { FormState } from "../../auth/actions";
import { createScope, setScopeAccess } from "./actions";

function Status({state}:{state:FormState}) {
  return <>{state.error && <p role="alert">{state.error}</p>}{state.message && <p role="status">{state.message}</p>}</>;
}
export function CreateScopeForm({organization,kind,projects=[]}:{organization:string;kind:"project"|"mission";projects?:{id:string;name:string}[]}) {
  const [state,action,pending]=useActionState(createScope,{});
  return <form action={action} className="auth-form" aria-label={kind==="project"?"Créer un projet":"Créer une mission"}>
    <input type="hidden" name="organization_id" value={organization}/><input type="hidden" name="kind" value={kind}/>
    <label>{kind==="project"?"Nom du projet":"Nom de la mission"}<input name="name" required minLength={2} maxLength={100}/></label>
    {kind==="mission" && <label>Projet de la mission<select name="parent_project_id" required defaultValue=""><option value="" disabled>Choisir un projet</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}
    <Status state={state}/><button className="primary-button" disabled={pending || (kind==="mission" && projects.length===0)}>{pending?"Création…":kind==="project"?"Créer le projet":"Créer la mission"}</button>
  </form>;
}
type Grant={user_id:string;granted:boolean;row_version:number};
export function GrantScopeForm({organization,scope,members,grants}:{organization:string;scope:string;members:{user_id:string;display_name:string}[];grants:Grant[]}) {
  const [selected,setSelected]=useState("");
  const [state,action,pending]=useActionState(setScopeAccess,{});
  return <form action={action} className="auth-form" aria-label="Accorder un accès" onReset={()=>setSelected("")}>
    <input type="hidden" name="organization_id" value={organization}/><input type="hidden" name="scope_id" value={scope}/><input type="hidden" name="granted" value="true"/>
    <input type="hidden" name="row_version" value={grants.find(g=>g.user_id===selected)?.row_version??0}/>
    <label>Membre à autoriser<select name="user_id" required value={selected} onChange={e=>setSelected(e.target.value)}><option value="" disabled>Choisir un membre</option>{members.map(m=><option key={m.user_id} value={m.user_id}>{m.display_name} · {m.user_id.slice(0,8)}</option>)}</select></label>
    <Status state={state}/><button className="secondary-button" disabled={pending || !selected}>{pending?"Enregistrement…":"Accorder la lecture"}</button>
  </form>;
}
export function RevokeScopeForm({organization,scope,grant}:{organization:string;scope:string;grant:Grant}) {
  const [state,action,pending]=useActionState(setScopeAccess,{});
  return <form action={action} className="auth-form">
    <input type="hidden" name="organization_id" value={organization}/><input type="hidden" name="scope_id" value={scope}/><input type="hidden" name="user_id" value={grant.user_id}/><input type="hidden" name="granted" value="false"/><input type="hidden" name="row_version" value={grant.row_version}/>
    <Status state={state}/><button className="secondary-button" disabled={pending}>{pending?"Révocation…":"Révoquer la lecture"}</button>
  </form>;
}
