/** Pure EUR pilot ledger. Authorization and atomic persistence belong to the server. */
export type FounderId = string;
type Base = Readonly<{
  key: string;
  organizationId: string;
  currency: "EUR";
  amount: number;
}>;
export type Command = Base &
  (
    | Readonly<{ kind: "personal_expense" | "deposit"; founderId: FounderId }>
    | Readonly<{ kind: "fund_expense" }>
    | Readonly<{
        kind: "supplier_refund";
        expenseKey: string;
        destination: "personal" | "fund";
      }>
  );
export type Ledger = Readonly<{
  organizationId: string;
  founders: readonly FounderId[];
  entries: readonly Command[];
}>;
export type Totals = Readonly<{
  costs: number;
  cash: number;
  contributions: Readonly<Record<FounderId, number>>;
  reference: number;
  remaining: Readonly<Record<FounderId, number>>;
  equal: boolean;
  reimbursementRegime: "disabled";
}>;
export class LedgerError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.name = "LedgerError";
    this.code = code;
  }
}
function fail(code: string): never {
  throw new LedgerError(code);
}
const nonempty = (s: unknown): s is string =>
  typeof s === "string" && s.trim().length > 0;
function sum(a: number, b: number): number {
  const result = a + b;
  if (!Number.isSafeInteger(result)) fail("AMOUNT_OVERFLOW");
  return result;
}
export function createLedger(
  organizationId: string,
  founders: readonly FounderId[],
): Ledger {
  if (
    !nonempty(organizationId) ||
    founders.length === 0 ||
    founders.some((f) => !nonempty(f)) ||
    new Set(founders).size !== founders.length
  )
    fail("INVALID_CONTEXT");
  return Object.freeze({
    organizationId,
    founders: Object.freeze([...founders]),
    entries: Object.freeze([]),
  });
}
function normalized(command: Command): Command {
  // Ignore no payload fields: unknown fields could hide a changed retry payload.
  if (!command || typeof command !== "object") fail("INVALID_COMMAND");
  const common = ["key", "organizationId", "currency", "amount", "kind"];
  let extra: string[];
  switch (command.kind) {
    case "personal_expense":
    case "deposit":
      extra = ["founderId"];
      break;
    case "fund_expense":
      extra = [];
      break;
    case "supplier_refund":
      extra = ["expenseKey", "destination"];
      break;
    default:
      fail("UNSUPPORTED_OPERATION");
  }
  const keys = [...common, ...extra!].sort();
  if (Object.keys(command).sort().join("|") !== keys.join("|"))
    fail("INVALID_COMMAND");
  return Object.freeze(
    Object.fromEntries(
      keys.map((k) => [k, (command as unknown as Record<string, unknown>)[k]]),
    ),
  ) as Command;
}
export function totals(ledger: Ledger): Totals {
  const contributions: Record<string, number> = Object.fromEntries(
    ledger.founders.map((f) => [f, 0]),
  );
  let costs = 0,
    cash = 0;
  for (const e of ledger.entries) {
    switch (e.kind) {
      case "personal_expense":
        costs = sum(costs, e.amount);
        contributions[e.founderId] = sum(contributions[e.founderId]!, e.amount);
        break;
      case "deposit":
        cash = sum(cash, e.amount);
        contributions[e.founderId] = sum(contributions[e.founderId]!, e.amount);
        break;
      case "fund_expense":
        costs = sum(costs, e.amount);
        cash = sum(cash, -e.amount);
        break;
      case "supplier_refund": {
        const expense = ledger.entries.find((x) => x.key === e.expenseKey)!;
        costs = sum(costs, -e.amount);
        if (e.destination === "fund") cash = sum(cash, e.amount);
        else if (expense.kind === "personal_expense")
          contributions[expense.founderId] = sum(
            contributions[expense.founderId]!,
            -e.amount,
          );
        break;
      }
    }
  }
  const reference = Math.max(...Object.values(contributions));
  const remaining = Object.fromEntries(
    ledger.founders.map((f) => [f, reference - contributions[f]!]),
  );
  return Object.freeze({
    costs,
    cash,
    contributions: Object.freeze(contributions),
    reference,
    remaining: Object.freeze(remaining),
    equal: Object.values(remaining).every((a) => a === 0),
    reimbursementRegime: "disabled",
  });
}
export function record(ledger: Ledger, input: Command): Ledger {
  const command = normalized(input);
  if (!nonempty(command.key)) fail("INVALID_KEY");
  if (command.organizationId !== ledger.organizationId)
    fail("ORGANIZATION_MISMATCH");
  if (command.currency !== "EUR") fail("UNSUPPORTED_CURRENCY");
  if (!Number.isSafeInteger(command.amount) || command.amount <= 0)
    fail("INVALID_AMOUNT");
  const previous = ledger.entries.find((e) => e.key === command.key);
  if (previous) {
    if (JSON.stringify(previous) !== JSON.stringify(command))
      fail("IDEMPOTENCY_CONFLICT");
    return ledger;
  }
  if (
    (command.kind === "personal_expense" || command.kind === "deposit") &&
    !ledger.founders.includes(command.founderId)
  )
    fail("UNKNOWN_FOUNDER");
  if (command.kind === "fund_expense" && totals(ledger).cash < command.amount)
    fail("INSUFFICIENT_CASH");
  if (command.kind === "supplier_refund") {
    const expense = ledger.entries.find((e) => e.key === command.expenseKey);
    if (
      !expense ||
      !["personal_expense", "fund_expense"].includes(expense.kind)
    )
      fail("INVALID_REFUND_REFERENCE");
    if (command.destination !== "personal" && command.destination !== "fund")
      fail("INVALID_REFUND_DESTINATION");
    if (expense.kind === "fund_expense" && command.destination !== "fund")
      fail("INVALID_REFUND_DESTINATION");
    const refunded = ledger.entries
      .filter(
        (e) =>
          e.kind === "supplier_refund" && e.expenseKey === command.expenseKey,
      )
      .reduce((n, e) => sum(n, e.amount), 0);
    if (sum(refunded, command.amount) > expense.amount) fail("EXCESS_REFUND");
  }
  const next = Object.freeze({
    ...ledger,
    entries: Object.freeze([...ledger.entries, command]),
  });
  totals(next); // Reject unsafe aggregate arithmetic before appending the new entry.
  return next;
}
/** Decimal string conversion at the UI boundary, without binary float arithmetic. */
export function parseEuros(value: string): number {
  if (!/^\d{1,14}([.,]\d{1,2})?$/.test(value.trim())) fail("INVALID_AMOUNT");
  const [whole, fraction = ""] = value.trim().replace(",", ".").split(".");
  const cents = BigInt(whole!) * 100n + BigInt(fraction.padEnd(2, "0"));
  if (cents <= 0n || cents > BigInt(Number.MAX_SAFE_INTEGER))
    fail("INVALID_AMOUNT");
  return Number(cents);
}
const euroFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});
/** Display safe integer cents exactly, including the last cent at the boundary. */
export function formatEuros(cents: number): string {
  if (!Number.isSafeInteger(cents)) fail("INVALID_AMOUNT");
  const value = BigInt(cents);
  const whole = value / 100n;
  const fraction = (value < 0n ? -value : value) % 100n;
  // Preserve the sign for negative amounts below one euro without float division.
  const displayWhole = value < 0n && whole === 0n ? -0 : whole;
  return euroFormatter
    .formatToParts(displayWhole)
    .map((part) =>
      part.type === "fraction" ? fraction.toString().padStart(2, "0") : part.value,
    )
    .join("");
}

export type TaskStatus =
  | "todo"
  | "in_progress"
  | "blocked"
  | "in_review"
  | "done"
  | "cancelled";

export type TaskPriority = "urgent" | "high" | "normal" | "low";

export type WorkTask = Readonly<{
  id: string;
  organizationId: string;
  projectId: string;
  missionId?: string;
  assigneeId: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: string;
  blockedReason?: string;
}>;

export type TodayScope = Readonly<{
  organizationId: string;
  actorId: string;
  projectIds: readonly string[];
  missionIds: readonly string[];
}>;

export type TodayItem = Readonly<{
  task: WorkTask;
  timing: "overdue" | "today" | "upcoming" | "unscheduled";
}>;

export type TodayView = Readonly<{
  items: readonly TodayItem[];
  counts: Readonly<{
    total: number;
    overdue: number;
    today: number;
    blocked: number;
    inReview: number;
  }>;
}>;

export class TaskError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = "TaskError";
    this.code = code;
  }
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const instantPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

function isCivilDate(value: string): boolean {
  if (!datePattern.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year!, month! - 1, day!));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month! - 1 &&
    parsed.getUTCDate() === day
  );
}

function failTask(code: string): never {
  throw new TaskError(code);
}

export function validateTask(task: WorkTask): WorkTask {
  if (
    !task ||
    typeof task !== "object" ||
    !nonempty(task.id) ||
    !nonempty(task.organizationId) ||
    !nonempty(task.projectId) ||
    !nonempty(task.assigneeId) ||
    !nonempty(task.title) ||
    !["todo", "in_progress", "blocked", "in_review", "done", "cancelled"].includes(
      task.status,
    ) ||
    !["urgent", "high", "normal", "low"].includes(task.priority)
  )
    failTask("INVALID_TASK");
  if (task.missionId !== undefined && !nonempty(task.missionId))
    failTask("INVALID_TASK");
  if (task.dueDate !== undefined && !isCivilDate(task.dueDate))
    failTask("INVALID_DUE_DATE");
  if (
    !instantPattern.test(task.createdAt) ||
    Number.isNaN(Date.parse(task.createdAt))
  )
    failTask("INVALID_CREATED_AT");
  if (task.status === "blocked" && !nonempty(task.blockedReason))
    failTask("BLOCKED_REASON_REQUIRED");
  return Object.freeze({ ...task });
}

function isAccessible(task: WorkTask, scope: TodayScope): boolean {
  if (task.organizationId !== scope.organizationId) return false;
  return task.missionId
    ? scope.missionIds.includes(task.missionId)
    : scope.projectIds.includes(task.projectId);
}

function validateScope(scope: TodayScope): void {
  if (!nonempty(scope.organizationId) || !nonempty(scope.actorId))
    failTask("INVALID_TODAY_CONTEXT");
  const projectIds = new Set(scope.projectIds);
  const missionIds = new Set(scope.missionIds);
  if (
    projectIds.size !== scope.projectIds.length ||
    missionIds.size !== scope.missionIds.length ||
    [...projectIds, ...missionIds].some((id) => !nonempty(id))
  )
    failTask("INVALID_TODAY_CONTEXT");
}

const priorityRank: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

const timingRank: Record<TodayItem["timing"], number> = {
  overdue: 0,
  today: 1,
  upcoming: 2,
  unscheduled: 3,
};

function taskTiming(
  dueDate: string | undefined,
  today: string,
): TodayItem["timing"] {
  if (!dueDate) return "unscheduled";
  if (dueDate < today) return "overdue";
  if (dueDate === today) return "today";
  return "upcoming";
}

export function buildTodayView(
  tasks: readonly WorkTask[],
  scope: TodayScope,
  today: string,
): TodayView {
  validateScope(scope);
  if (!isCivilDate(today)) failTask("INVALID_TODAY_CONTEXT");

  const items = tasks
    .filter(
      (task) =>
        task.assigneeId === scope.actorId && isAccessible(task, scope),
    )
    .map(validateTask)
    .filter((task) => !["done", "cancelled"].includes(task.status))
    .map((task) =>
      Object.freeze({ task, timing: taskTiming(task.dueDate, today) }),
    )
    .sort((a, b) =>
      priorityRank[a.task.priority] - priorityRank[b.task.priority] ||
      timingRank[a.timing] - timingRank[b.timing] ||
      (a.task.dueDate ?? "9999-12-31").localeCompare(
        b.task.dueDate ?? "9999-12-31",
      ) ||
      a.task.createdAt.localeCompare(b.task.createdAt) ||
      a.task.id.localeCompare(b.task.id),
    );

  return Object.freeze({
    items: Object.freeze(items),
    counts: Object.freeze({
      total: items.length,
      overdue: items.filter((item) => item.timing === "overdue").length,
      today: items.filter((item) => item.timing === "today").length,
      blocked: items.filter((item) => item.task.status === "blocked").length,
      inReview: items.filter((item) => item.task.status === "in_review").length,
    }),
  });
}

export function projectProgress(
  tasks: readonly WorkTask[],
  scope: TodayScope,
  projectId: string,
): number | null {
  validateScope(scope);
  if (!nonempty(projectId)) failTask("INVALID_PROJECT_CONTEXT");
  const eligible = tasks
    .filter(
      (task) =>
        task.projectId === projectId && isAccessible(task, scope),
    )
    .map(validateTask)
    .filter((task) => task.status !== "cancelled");
  if (eligible.length === 0) return null;
  return Math.round(
    (eligible.filter((task) => task.status === "done").length / eligible.length) *
      100,
  );
}
