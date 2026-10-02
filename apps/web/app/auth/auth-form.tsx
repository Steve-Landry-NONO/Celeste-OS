"use client";
import { useActionState } from "react";
import { signIn, signUp, createOrganization, type FormState } from "./actions";
import Link from "next/link";

export function AuthForm({ mode, configured }: { mode: "login" | "register"; configured: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === "login" ? signIn : signUp, {});
  return <form action={action} className="auth-form" aria-busy={pending}>
    {mode === "register" && <label>Nom affiché<input name="display_name" autoComplete="name" required maxLength={100} /></label>}
    <label>Adresse email<input name="email" type="email" autoComplete="username" required maxLength={254} /></label>
    <label>Mot de passe<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "register" ? 12 : 1} maxLength={256} /></label>
    {mode === "register" && <p className="form-hint">12 caractères minimum. Votre email doit être confirmé.</p>}
    {state.error && <p role="alert" className="form-error">{state.error}</p>}
    {state.message && <p role="status">{state.message}</p>}
    <button disabled={!configured || pending} type="submit">{pending ? "Un instant…" : mode === "login" ? "Se connecter" : "Créer mon compte"}</button>
    <Link href={mode === "login" ? "/register" : "/login"}>{mode === "login" ? "Créer un compte" : "J’ai déjà un compte"}</Link>
  </form>;
}
export function OrganizationForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createOrganization, {});
  return <form action={action} className="auth-form" aria-busy={pending}>
    <label>Nom de l’organisation<input name="name" required minLength={2} maxLength={100} placeholder="Votre espace de travail" /></label>
    {state.error && <p role="alert" className="form-error">{state.error}</p>}
    <button disabled={pending} type="submit">{pending ? "Création…" : "Créer un espace"}</button>
  </form>;
}
