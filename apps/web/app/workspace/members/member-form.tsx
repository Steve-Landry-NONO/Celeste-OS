"use client";
import { useActionState } from "react";
import { updateMembership } from "./actions";
import type { FormState } from "../../auth/actions";
import type { Tables } from "../../../lib/supabase/database.types";

export function MemberForm({ membership }: { membership: Tables<"memberships"> }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateMembership, {});
  return <form action={action} className="auth-form" aria-label="Modifier cet accès" aria-busy={pending}>
    <input type="hidden" name="organization_id" value={membership.organization_id} />
    <input type="hidden" name="user_id" value={membership.user_id} />
    <input type="hidden" name="row_version" value={membership.row_version} />
    <label>Rôle<select name="role" defaultValue={membership.role} disabled={pending}>
      <option value="founder_admin">Administrateur</option><option value="founder_finance">Finance</option>
      <option value="member">Équipe</option><option value="support">Support</option><option value="vendor">Prestataire</option>
    </select></label>
    <label>Accès<select name="status" defaultValue={membership.status} disabled={pending}>
      <option value="active">Actif</option><option value="suspended">Suspendu</option>
    </select></label>
    {state.error && <p role="alert" className="form-error">{state.error}</p>}
    {state.message && <p role="status">{state.message}</p>}
    <button type="submit" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer l’accès"}</button>
  </form>;
}
