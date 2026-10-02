"use client";
import { useState } from "react";
import {
  createLedger,
  record,
  totals,
  parseEuros,
  formatEuros as euros,
  LedgerError,
} from "@celeste/domain";
import type { Command, Ledger } from "@celeste/domain";
const founders = ["A", "B", "C"];
const blank = () => createLedger("simulation-only", founders);
const labels = {
  personal_expense: "Dépense personnelle",
  deposit: "Versement au fonds",
  fund_expense: "Dépense du fonds",
};
const errors: Record<string, string> = {
  INVALID_AMOUNT: "Saisir un montant positif avec deux décimales maximum.",
  INSUFFICIENT_CASH: "La caisse du simulateur ne contient pas ce montant.",
  AMOUNT_OVERFLOW: "Ce montant dépasse la capacité de calcul exacte.",
};
function recipe(): Ledger {
  let l = blank();
  const commands: Command[] = [
    {
      key: "1",
      kind: "personal_expense",
      amount: 120000,
      founderId: "A",
      organizationId: "simulation-only",
      currency: "EUR",
    },
    {
      key: "2",
      kind: "personal_expense",
      amount: 30000,
      founderId: "B",
      organizationId: "simulation-only",
      currency: "EUR",
    },
    {
      key: "3",
      kind: "personal_expense",
      amount: 10000,
      founderId: "C",
      organizationId: "simulation-only",
      currency: "EUR",
    },
    {
      key: "4",
      kind: "deposit",
      amount: 90000,
      founderId: "B",
      organizationId: "simulation-only",
      currency: "EUR",
    },
    {
      key: "5",
      kind: "deposit",
      amount: 110000,
      founderId: "C",
      organizationId: "simulation-only",
      currency: "EUR",
    },
    {
      key: "6",
      kind: "fund_expense",
      amount: 50000,
      organizationId: "simulation-only",
      currency: "EUR",
    },
  ];
  for (const c of commands) l = record(l, c);
  return l;
}
export default function Simulator() {
  const [ledger, setLedger] = useState(blank);
  const [kind, setKind] = useState<keyof typeof labels>("personal_expense");
  const [founder, setFounder] = useState("A");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const result = totals(ledger);
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const base = {
        key: String(ledger.entries.length + 1),
        organizationId: "simulation-only",
        currency: "EUR" as const,
        amount: parseEuros(amount),
      };
      const command: Command =
        kind === "fund_expense"
          ? { ...base, kind }
          : { ...base, kind, founderId: founder };
      setLedger(record(ledger, command));
      setAmount("");
      setMessage("Opération fictive ajoutée au simulateur.");
    } catch (e) {
      setError(
        e instanceof LedgerError
          ? (errors[e.code] ??
              "Cette opération est refusée par les règles financières.")
          : "Impossible de calculer cette opération.",
      );
    }
  }
  return (
    <>
      <section className="notice simulation">
        <span className="notice-icon" aria-hidden="true">
          ↔
        </span>
        <div>
          <strong>Simulation isolée · aucun enregistrement réel</strong>
          <p>
            Les fondateurs A, B et C sont fictifs. Recharger la page efface ce
            scénario. Le régime de remboursement reste désactivé.
          </p>
        </div>
      </section>
      <div className="lab-toolbar">
        <button
          className="primary"
          onClick={() => {
            setLedger(recipe());
            setError("");
            setMessage("Scénario de recette fictif chargé : six opérations.");
          }}
        >
          Charger le scénario de recette
        </button>
        <button
          className="secondary"
          onClick={() => {
            setLedger(blank());
            setError("");
            setMessage("Simulation effacée.");
          }}
        >
          Réinitialiser
        </button>
      </div>
      <p role="status" className="status">
        {message}
      </p>
      <div className="bottom-grid">
        <section className="panel">
          <h2>Ajouter une opération fictive</h2>
          <form onSubmit={submit}>
            <label htmlFor="kind">Nature de l’opération</label>
            <select
              id="kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as keyof typeof labels)}
            >
              {Object.entries(labels).map(([key, label]) => (
                <option value={key} key={key}>
                  {label}
                </option>
              ))}
            </select>
            {kind !== "fund_expense" && (
              <>
                <label htmlFor="founder">Fondateur fictif</label>
                <select
                  id="founder"
                  value={founder}
                  onChange={(e) => setFounder(e.target.value)}
                >
                  {founders.map((f) => (
                    <option key={f} value={f}>
                      Fondateur {f}
                    </option>
                  ))}
                </select>
              </>
            )}
            <label htmlFor="amount">Montant en euros</label>
            <input
              id="amount"
              inputMode="decimal"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ex. 120,50"
              aria-describedby={error ? "form-error" : undefined}
            />
            {error && (
              <p id="form-error" role="alert" className="error">
                {error}
              </p>
            )}
            <button className="primary" type="submit">
              Ajouter au simulateur
            </button>
          </form>
        </section>
        <section className="panel">
          <p className="eyebrow">RÉSULTATS FICTIFS</p>
          <div className="stat">
            <span>Coûts payés nets</span>
            <strong data-testid="costs">{euros(result.costs)}</strong>
          </div>
          <div className="stat">
            <span>Caisse de roulement</span>
            <strong data-testid="cash">{euros(result.cash)}</strong>
          </div>
          <div className="table-wrap">
            <table>
              <caption>Égalisation des contributions fictives</caption>
              <thead>
                <tr>
                  <th>Fondateur</th>
                  <th>Contribution</th>
                  <th>Reste à apporter</th>
                </tr>
              </thead>
              <tbody>
                {founders.map((f) => (
                  <tr key={f}>
                    <th scope="row">{f}</th>
                    <td>{euros(result.contributions[f]!)}</td>
                    <td>{euros(result.remaining[f]!)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted">
            {result.equal
              ? "Contributions égales dans ce scénario."
              : "Référence : " +
                euros(result.reference) +
                ", contribution maximale du scénario."}{" "}
            Ce calcul ne détermine pas les parts juridiques.
          </p>
        </section>
      </div>
      <section className="panel history">
        <h2>Journal de la simulation</h2>
        {ledger.entries.length === 0 ? (
          <p className="muted">Aucune opération fictive ajoutée.</p>
        ) : (
          <ol>
            {ledger.entries.map((e) => (
              <li key={e.key}>
                <span>
                  {e.kind in labels
                    ? labels[e.kind as keyof typeof labels]
                    : e.kind}
                  {"founderId" in e ? " · " + e.founderId : ""}
                </span>
                <strong>{euros(e.amount)}</strong>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
