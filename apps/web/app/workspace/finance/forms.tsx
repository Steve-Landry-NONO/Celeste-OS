"use client";
import { useActionState, useState } from "react";
import type { FormState } from "../../auth/actions";
import {
  createCashAccount, createExpenseCategory, recordFundDeposit, recordFundExpense,
  recordPersonalExpense, recordSupplierRefund,
} from "./actions";

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

export function CashAccountForm({organization}:{organization:string}) {
  const [state,action,pending]=useActionState(createCashAccount,{});
  return <form action={action} className="auth-form" aria-label="Créer une caisse">
    <input type="hidden" name="organization_id" value={organization}/>
    <label>Nom de la caisse<input name="name" required minLength={2} maxLength={80}/></label>
    <p className="form-hint">Le solde initial est toujours 0,00 €. Un solde réel entre par un versement traçable.</p>
    <Status state={state}/><button className="secondary-button" disabled={pending}>{pending?"Création…":"Créer la caisse"}</button>
  </form>;
}

type Scope={id:string;name:string;kind:string};
type Receipt={id:string;scope_id:string;file_name:string};
type Category={id:string;title:string};
type Founder={user_id:string;display_name:string};
type Account={id:string;name:string};
type FundExpense={id:string;cash_account_id:string;label:string;amount_minor:number};

type ExpenseProps={
  organization:string;commandKey:string;today:string;scopes:Scope[];categories:Category[];receipts:Receipt[];
};

function ExpenseFields({today,scopes,categories,receipts,scope,onScope}:{
  today:string;scopes:Scope[];categories:Category[];receipts:Receipt[];scope:string;onScope:(value:string)=>void;
}) {
  const scopeReceipts=receipts.filter(receipt=>receipt.scope_id===scope);
  return <>
    <label>Libellé<input name="label" required minLength={2} maxLength={160}/></label>
    <label>Montant en euros<input name="amount" required inputMode="decimal" placeholder="0,00" pattern="[0-9]{1,14}([.,][0-9]{1,2})?"/></label>
    <label>Date de dépense<input name="spent_on" type="date" required max={today}/></label>
    <label>Projet ou mission<select name="scope_id" required value={scope} onChange={event=>onScope(event.target.value)}><option value="" disabled>Choisir un périmètre</option>{scopes.map(item=><option key={item.id} value={item.id}>{item.kind==="project"?"Projet":"Mission"} · {item.name}</option>)}</select></label>
    <label>Catégorie<select name="category_id" required defaultValue=""><option value="" disabled>Choisir une catégorie</option>{categories.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
    <label>Justificatif privé<select name="receipt_file_id" required key={scope} defaultValue=""><option value="" disabled>Choisir un fichier du périmètre</option>{scopeReceipts.map(item=><option key={item.id} value={item.id}>{item.file_name}</option>)}</select></label>
    {!scopeReceipts.length ? <p className="form-hint">Ajoutez d’abord un justificatif privé dans le projet ou la mission.</p> : null}
  </>;
}

export function PersonalExpenseForm({organization,commandKey,today,scopes,categories,receipts,payers}:ExpenseProps&{payers:Founder[]}) {
  const [scope,setScope]=useState(scopes[0]?.id??"");
  const [state,action,pending]=useActionState(recordPersonalExpense,{});
  const ready=scopes.length>0 && categories.length>0 && payers.length>0 && receipts.some(receipt=>receipt.scope_id===scope);
  return <form action={action} className="auth-form finance-form" aria-label="Confirmer une dépense personnelle">
    <input type="hidden" name="organization_id" value={organization}/><input type="hidden" name="command_key" value={commandKey}/>
    <ExpenseFields today={today} scopes={scopes} categories={categories} receipts={receipts} scope={scope} onScope={setScope}/>
    <label>Payeur<select name="payer_id" required defaultValue=""><option value="" disabled>Choisir un fondateur</option>{payers.map(item=><option key={item.user_id} value={item.user_id}>{item.display_name}</option>)}</select></label>
    <p className="form-hint">Effet fixe : coût + contribution du payeur. Aucun mouvement de caisse.</p>
    <Status state={state}/><button className="primary-button" disabled={pending || !ready}>{pending?"Confirmation…":"Confirmer la dépense"}</button>
  </form>;
}

export function FundDepositForm({organization,commandKey,today,accounts,founders}:{
  organization:string;commandKey:string;today:string;accounts:Account[];founders:Founder[];
}) {
  const [state,action,pending]=useActionState(recordFundDeposit,{});
  const ready=accounts.length>0 && founders.length>0;
  return <form action={action} className="auth-form finance-form" aria-label="Confirmer un versement à la caisse">
    <input type="hidden" name="organization_id" value={organization}/><input type="hidden" name="command_key" value={commandKey}/>
    <label>Libellé<input name="label" required minLength={2} maxLength={160}/></label>
    <label>Montant en euros<input name="amount" required inputMode="decimal" placeholder="0,00" pattern="[0-9]{1,14}([.,][0-9]{1,2})?"/></label>
    <label>Date du versement<input name="deposited_on" type="date" required max={today}/></label>
    <label>Caisse<select name="cash_account_id" required defaultValue=""><option value="" disabled>Choisir une caisse</option>{accounts.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <label>Fondateur<select name="founder_id" required defaultValue=""><option value="" disabled>Choisir un fondateur</option>{founders.map(item=><option key={item.user_id} value={item.user_id}>{item.display_name}</option>)}</select></label>
    <p className="form-hint">Effet fixe : contribution + caisse. Aucun coût supplémentaire.</p>
    <Status state={state}/><button className="primary-button" disabled={pending || !ready}>{pending?"Confirmation…":"Confirmer le versement"}</button>
  </form>;
}

export function FundExpenseForm({organization,commandKey,today,scopes,categories,receipts,accounts}:ExpenseProps&{accounts:Account[]}) {
  const [scope,setScope]=useState(scopes[0]?.id??"");
  const [state,action,pending]=useActionState(recordFundExpense,{});
  const ready=accounts.length>0 && scopes.length>0 && categories.length>0 && receipts.some(receipt=>receipt.scope_id===scope);
  return <form action={action} className="auth-form finance-form" aria-label="Confirmer une dépense payée par la caisse">
    <input type="hidden" name="organization_id" value={organization}/><input type="hidden" name="command_key" value={commandKey}/>
    <ExpenseFields today={today} scopes={scopes} categories={categories} receipts={receipts} scope={scope} onScope={setScope}/>
    <label>Caisse<select name="cash_account_id" required defaultValue=""><option value="" disabled>Choisir une caisse</option>{accounts.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <p className="form-hint">Effet fixe : coût + sortie de caisse. Aucune contribution individuelle.</p>
    <Status state={state}/><button className="primary-button" disabled={pending || !ready}>{pending?"Confirmation…":"Confirmer la dépense du fonds"}</button>
  </form>;
}

export function SupplierRefundForm({organization,commandKey,today,expenses,accounts}:{
  organization:string;commandKey:string;today:string;expenses:FundExpense[];accounts:Account[];
}) {
  const [expenseId,setExpenseId]=useState(expenses[0]?.id??"");
  const [state,action,pending]=useActionState(recordSupplierRefund,{});
  const expense=expenses.find(item=>item.id===expenseId);
  return <form action={action} className="auth-form finance-form" aria-label="Confirmer un avoir fournisseur">
    <input type="hidden" name="organization_id" value={organization}/><input type="hidden" name="command_key" value={commandKey}/>
    <input type="hidden" name="cash_account_id" value={expense?.cash_account_id??""}/>
    <label>Dépense d’origine<select name="expense_id" required value={expenseId} onChange={event=>setExpenseId(event.target.value)}><option value="" disabled>Choisir une dépense du fonds</option>{expenses.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
    <label>Libellé<input name="label" required minLength={2} maxLength={160}/></label>
    <label>Montant en euros<input name="amount" required inputMode="decimal" placeholder="0,00" pattern="[0-9]{1,14}([.,][0-9]{1,2})?"/></label>
    <label>Date de réception<input name="received_on" type="date" required max={today}/></label>
    <p className="form-hint">L’avoir ne peut pas dépasser la dépense. Il réduit le coût net et restaure la même caisse, sans modifier les contributions.</p>
    <Status state={state}/><button className="secondary-button" disabled={pending || !expense || !accounts.length}>{pending?"Confirmation…":"Confirmer l’avoir"}</button>
  </form>;
}
