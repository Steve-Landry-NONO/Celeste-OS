"use client";
import { useActionState, useState } from "react";
import type { FormState } from "../../auth/actions";
import { createExpenseCategory, recordPersonalExpense } from "./actions";

function Status({state}:{state:FormState}) {
  return <>{state.error ? <p role="alert">{state.error}</p> : null}{state.message ? <p role="status">{state.message}</p> : null}</>;
}

export function ExpenseCategoryForm({organization}:{organization:string}) {
  const [state,action,pending]=useActionState(createExpenseCategory,{});
  return <form action={action} className="auth-form" aria-label="Créer une catégorie de dépense">
    <input type="hidden" name="organization_id" value={organization}/>
    <label>Nouvelle catégorie<input name="title" required minLength={2} maxLength={80}/></label>
    <Status state={state}/><button className="secondary-button" disabled={pending}>{pending?"Création…":"Créer la catégorie"}</button>
  </form>;
}

type Scope={id:string;name:string;kind:string};
type Receipt={id:string;scope_id:string;file_name:string};
type Category={id:string;title:string};
type Payer={user_id:string;display_name:string};

export function PersonalExpenseForm({organization,commandKey,today,scopes,categories,receipts,payers}:{
  organization:string;commandKey:string;today:string;scopes:Scope[];categories:Category[];receipts:Receipt[];payers:Payer[];
}) {
  const [scope,setScope]=useState(scopes[0]?.id??"");
  const [state,action,pending]=useActionState(recordPersonalExpense,{});
  const scopeReceipts=receipts.filter(receipt=>receipt.scope_id===scope);
  const ready=scopes.length>0 && categories.length>0 && payers.length>0 && scopeReceipts.length>0;
  return <form action={action} className="auth-form finance-form" aria-label="Confirmer une dépense personnelle">
    <input type="hidden" name="organization_id" value={organization}/>
    <input type="hidden" name="command_key" value={commandKey}/>
    <label>Libellé<input name="label" required minLength={2} maxLength={160}/></label>
    <label>Montant en euros<input name="amount" required inputMode="decimal" placeholder="0,00" pattern="[0-9]{1,14}([.,][0-9]{1,2})?"/></label>
    <label>Date de dépense<input name="spent_on" type="date" required max={today}/></label>
    <label>Projet ou mission<select name="scope_id" required value={scope} onChange={event=>setScope(event.target.value)}><option value="" disabled>Choisir un périmètre</option>{scopes.map(item=><option key={item.id} value={item.id}>{item.kind==="project"?"Projet":"Mission"} · {item.name}</option>)}</select></label>
    <label>Catégorie<select name="category_id" required defaultValue=""><option value="" disabled>Choisir une catégorie</option>{categories.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
    <label>Payeur<select name="payer_id" required defaultValue=""><option value="" disabled>Choisir un fondateur</option>{payers.map(item=><option key={item.user_id} value={item.user_id}>{item.display_name}</option>)}</select></label>
    <label>Justificatif privé<select name="receipt_file_id" required key={scope} defaultValue=""><option value="" disabled>Choisir un fichier du périmètre</option>{scopeReceipts.map(item=><option key={item.id} value={item.id}>{item.file_name}</option>)}</select></label>
    <p className="form-hint">Traitement fixe pour ce lot : dépense personnelle retenue en contribution. Aucun mouvement de caisse et aucun remboursement.</p>
    {!scopeReceipts.length ? <p className="form-hint">Ajoutez d’abord un justificatif privé dans le projet ou la mission.</p> : null}
    <Status state={state}/><button className="primary-button" disabled={pending || !ready}>{pending?"Confirmation…":"Confirmer la dépense"}</button>
  </form>;
}
