"use client";
import { useActionState } from "react";
import type { FormState } from "../../auth/actions";
import { setScopeFileWrite, uploadScopeFile } from "./file-actions";

function Status({state}:{state:FormState}) {
  return <>{state.error ? <p role="alert">{state.error}</p> : null}{state.message ? <p role="status">{state.message}</p> : null}</>;
}
export function ScopeFileUpload({organization,scope}:{organization:string;scope:string}) {
  const [state,action,pending]=useActionState(uploadScopeFile,{});
  return <form action={action} className="auth-form" aria-label="Ajouter un fichier privé">
    <input type="hidden" name="organization_id" value={organization}/><input type="hidden" name="scope_id" value={scope}/>
    <label>Fichier privé<input name="file" type="file" required accept=".pdf,.docx,.xlsx,.pptx,.md,.png,.jpg,.jpeg"/></label>
    <p className="form-hint">PDF, Office, Markdown, PNG ou JPEG · 20 Mo maximum.</p>
    <Status state={state}/><button disabled={pending}>{pending?"Transfert…":"Ajouter le fichier"}</button>
  </form>;
}
export function ScopeFileWriteForm({organization,scope,grant}:{organization:string;scope:string;grant:{user_id:string;file_write:boolean;row_version:number}}) {
  const [state,action,pending]=useActionState(setScopeFileWrite,{});
  return <form action={action} className="scope-file-permission">
    <input type="hidden" name="organization_id" value={organization}/><input type="hidden" name="scope_id" value={scope}/>
    <input type="hidden" name="user_id" value={grant.user_id}/><input type="hidden" name="allowed" value={String(!grant.file_write)}/>
    <input type="hidden" name="row_version" value={grant.row_version}/>
    <Status state={state}/><button className="secondary-button" disabled={pending}>{pending?"Enregistrement…":grant.file_write?"Retirer le dépôt":"Autoriser le dépôt"}</button>
  </form>;
}
