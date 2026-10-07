import type { SupabaseClient } from "@supabase/supabase-js";

export type Organization = Readonly<{ id: string; name: string; role: string; financeAllowed: boolean }>;
export type Contribution = Readonly<{ userId: string; name: string; amountMinor: number; remainingMinor: number | null; active: boolean }>;
export type FinanceSnapshot = Readonly<{
  organizationId: string;
  costMinor: number;
  cashMinor: number;
  contributionMinor: number;
  referenceMinor: number;
  equalized: boolean;
  reimbursementVersion: number;
  contributions: readonly Contribution[];
}>;

type QueryResult<T> = { data: T | null; error: { code?: string; message: string } | null };

function failure(result: QueryResult<unknown>, fallback: string): never {
  const error = new Error(result.error?.message || fallback);
  error.name = result.error?.code === "42501" ? "ForbiddenError" : "DataError";
  throw error;
}

export async function loadOrganizations(client: SupabaseClient): Promise<Organization[]> {
  const memberships = await client.from("memberships").select("organization_id,role,status").eq("status", "active") as QueryResult<Array<{ organization_id: string; role: string; status: string }>>;
  if (memberships.error) failure(memberships, "Impossible de charger les espaces.");
  const active = memberships.data ?? [];
  if (!active.length) return [];
  const organizations = await client.from("organizations").select("id,name").in("id", active.map(item => item.organization_id)) as QueryResult<Array<{ id: string; name: string }>>;
  if (organizations.error) failure(organizations, "Impossible de charger les espaces.");
  const nameById = new Map((organizations.data ?? []).map(item => [item.id, item.name]));
  return active.flatMap(item => {
    const name = nameById.get(item.organization_id);
    return name ? [{ id: item.organization_id, name, role: item.role, financeAllowed: ["founder_admin", "founder_finance"].includes(item.role) }] : [];
  });
}

export async function loadFinance(client: SupabaseClient, organizationId: string): Promise<FinanceSnapshot> {
  const [totals, contributions, policy] = await Promise.all([
    client.rpc("get_finance_totals", { p_org: organizationId }) as unknown as Promise<QueryResult<Array<{ cost_minor: number; cash_minor: number; contribution_minor: number; reference_minor: number; equalized: boolean }>>>,
    client.rpc("list_finance_contributions", { p_org: organizationId }) as unknown as Promise<QueryResult<Array<{ user_id: string; display_name: string; amount_minor: number; remaining_minor: number | null; can_confirm: boolean }>>>,
    client.rpc("get_reimbursement_policy", { p_org: organizationId }) as unknown as Promise<QueryResult<Array<{ version: number; status: string }>>>,
  ]);
  if (totals.error) failure(totals, "Finance indisponible.");
  if (contributions.error) failure(contributions, "Finance indisponible.");
  if (policy.error) failure(policy, "Politique de remboursement indisponible.");
  const summary = totals.data?.[0];
  const reimbursement = policy.data?.[0];
  if (!summary || !reimbursement || reimbursement.status !== "disabled") throw new Error("FINANCE_INCOMPLETE");
  return {
    organizationId,
    costMinor: summary.cost_minor,
    cashMinor: summary.cash_minor,
    contributionMinor: summary.contribution_minor,
    referenceMinor: summary.reference_minor,
    equalized: summary.equalized,
    reimbursementVersion: reimbursement.version,
    contributions: (contributions.data ?? []).map(item => ({
      userId: item.user_id, name: item.display_name, amountMinor: item.amount_minor,
      remainingMinor: item.remaining_minor, active: item.can_confirm,
    })),
  };
}
