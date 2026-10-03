"use client";
import { useActionState } from "react";
import { inviteMember, revokeInvitation, type InvitationState } from "./invitation-actions";
import type { FormState } from "../../auth/actions";

export function InvitationForm({ organization }: { organization: string }) {
  const [state, action, pending] = useActionState<InvitationState, FormData>(inviteMember, {});
  return <form action={action} className="auth-form" aria-label="Inviter un membre" aria-busy={pending}>
    <input type="hidden" name="organization_id" value={organization}/>
    <label>Email du destinataire<input name="email" type="email" required maxLength={254} autoComplete="off"/></label>
    <label>Rôle de l’invitation<select name="role" defaultValue="member" disabled={pending}>
      <option value="member">Équipe</option><option value="support">Support</option><option value="vendor">Prestataire</option>
      <option value="founder_finance">Finance</option><option value="founder_admin">Administrateur</option>
    </select></label>
    <p className="form-hint">Le destinataire devra se connecter avec cette adresse et confirmer son email. Aucun message n’est envoyé automatiquement.</p>
    {state.error && <p role="alert" className="form-error">{state.error}</p>}
    {state.message && <p role="status">{state.message}</p>}
    {state.token && <div className="invitation-code"><label>Code à transmettre<textarea readOnly value={state.token} rows={3}/></label><p>Ouvrez CELESTE OS, puis « Rejoindre un espace ». Après rechargement, créez une nouvelle invitation si vous avez perdu ce code.</p></div>}
    <button type="submit" disabled={pending}>{pending ? "Création…" : "Créer l’invitation"}</button>
  </form>;
}

export function RevokeInvitationForm({ organization, invitation }: { organization: string; invitation: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(revokeInvitation, {});
  return <form action={action} className="auth-form" aria-label="Révoquer cette invitation" aria-busy={pending}>
    <input type="hidden" name="organization_id" value={organization}/><input type="hidden" name="invitation_id" value={invitation}/>
    {state.error && <p role="alert" className="form-error">{state.error}</p>}
    <button type="submit" disabled={pending}>{pending ? "Révocation…" : "Révoquer l’invitation"}</button>
  </form>;
}
