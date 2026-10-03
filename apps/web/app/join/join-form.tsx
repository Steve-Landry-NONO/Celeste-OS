"use client";
import { useActionState, useState } from "react";
import { acceptInvitation } from "./actions";
import type { FormState } from "../auth/actions";

export function JoinForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(acceptInvitation, {});
  const [token, setToken] = useState("");
  return <form action={action} className="auth-form" aria-busy={pending}>
    <label>Code d’invitation<textarea name="token" value={token} onChange={event => setToken(event.target.value)} required maxLength={64} minLength={64} rows={3} autoComplete="off" spellCheck={false}/></label>
    {state.error && <p role="alert" className="form-error">{state.error}</p>}
    <button type="submit" disabled={pending}>{pending ? "Vérification…" : "Accepter l’invitation"}</button>
  </form>;
}
