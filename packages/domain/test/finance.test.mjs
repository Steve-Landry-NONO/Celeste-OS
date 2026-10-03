import { test } from "node:test";
import assert from "node:assert/strict";
import { createLedger, record, totals, parseEuros } from "../src/index.ts";
const empty = () => createLedger("test-only", ["A", "B", "C"]);
const command = (key, kind, amount, extra = {}) => ({
  key,
  kind,
  amount,
  currency: "EUR",
  organizationId: "test-only",
  ...extra,
});
const rejects = (fn, code) => assert.throws(fn, (e) => e.code === code);
function scenario() {
  let l = empty();
  for (const c of [
    command("a", "personal_expense", 120000, { founderId: "A" }),
    command("b", "personal_expense", 30000, { founderId: "B" }),
    command("c", "personal_expense", 10000, { founderId: "C" }),
    command("d", "deposit", 90000, { founderId: "B" }),
    command("e", "deposit", 110000, { founderId: "C" }),
    command("f", "fund_expense", 50000),
  ])
    l = record(l, c);
  return l;
}
test("FIN-R02/03/04: costs, cash and equal contributions do not double count", () => {
  const t = totals(scenario());
  assert.equal(t.costs, 210000);
  assert.equal(t.cash, 150000);
  assert.deepEqual(t.contributions, { A: 120000, B: 120000, C: 120000 });
  assert.equal(t.equal, true);
  assert.deepEqual(t.remaining, { A: 0, B: 0, C: 0 });
  assert.equal(
    Object.values(t.contributions).reduce((a, b) => a + b, 0),
    t.costs + t.cash,
  );
});
test("dynamic reference measures contributions, not legal shares or debt", () => {
  const t = totals(
    record(
      empty(),
      command("a", "personal_expense", 120000, { founderId: "A" }),
    ),
  );
  assert.deepEqual(t.remaining, { A: 0, B: 120000, C: 120000 });
  assert.equal(t.reimbursementRegime, "disabled");
});
test("FIN-R09: reordered identical retry is a no-op; changed retry conflicts", () => {
  const c = command("a", "deposit", 200, { founderId: "A" });
  const l = record(empty(), c);
  assert.equal(record(l, Object.fromEntries(Object.entries(c).reverse())), l);
  rejects(() => record(l, { ...c, amount: 201 }), "IDEMPOTENCY_CONFLICT");
});
test("FIN-R01/10: reject floating point, zero, unsafe integer and mixed currency", () => {
  for (const amount of [0, -1, 0.1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])
    rejects(
      () =>
        record(empty(), command("a", "deposit", amount, { founderId: "A" })),
      "INVALID_AMOUNT",
    );
  rejects(
    () =>
      record(empty(), {
        ...command("a", "deposit", 1, { founderId: "A" }),
        currency: "USD",
      }),
    "UNSUPPORTED_CURRENCY",
  );
});
test("unknown founder and cross-organization operations are rejected", () => {
  rejects(
    () => record(empty(), command("a", "deposit", 1, { founderId: "X" })),
    "UNKNOWN_FOUNDER",
  );
  rejects(
    () =>
      record(empty(), {
        ...command("a", "deposit", 1, { founderId: "A" }),
        organizationId: "other",
      }),
    "ORGANIZATION_MISMATCH",
  );
});
test("fund cannot spend unavailable cash; rejected write does not mutate ledger", () => {
  const l = empty();
  rejects(
    () => record(l, command("a", "fund_expense", 1)),
    "INSUFFICIENT_CASH",
  );
  assert.equal(l.entries.length, 0);
});
test("confirmed records and context are immutable and detached from input", () => {
  const members = ["A"];
  const l = createLedger("test-only", members);
  members.push("B");
  const c = command("a", "deposit", 10, { founderId: "A" });
  const n = record(l, c);
  c.amount = 20;
  assert.equal(totals(n).cash, 10);
  assert.equal(l.entries.length, 0);
  assert.deepEqual(n.founders, ["A"]);
  assert.throws(() => {
    n.entries[0].amount = 99;
  }, TypeError);
});
test("fund supplier refund lowers net costs and restores cash without contribution", () => {
  const l = record(
    scenario(),
    command("refund", "supplier_refund", 20000, {
      expenseKey: "f",
      destination: "fund",
    }),
  );
  const t = totals(l);
  assert.equal(t.costs, 190000);
  assert.equal(t.cash, 170000);
  assert.deepEqual(t.contributions, totals(scenario()).contributions);
});
test("personal supplier refund lowers contribution; payment to fund retains economic contribution", () => {
  let l = record(
    empty(),
    command("a", "personal_expense", 100, { founderId: "A" }),
  );
  const personal = totals(
    record(
      l,
      command("r", "supplier_refund", 30, {
        expenseKey: "a",
        destination: "personal",
      }),
    ),
  );
  assert.equal(personal.costs, 70);
  assert.equal(personal.contributions.A, 70);
  assert.equal(personal.cash, 0);
  const fund = totals(
    record(
      l,
      command("r", "supplier_refund", 30, {
        expenseKey: "a",
        destination: "fund",
      }),
    ),
  );
  assert.equal(fund.costs, 70);
  assert.equal(fund.contributions.A, 100);
  assert.equal(fund.cash, 30);
});
test("partial refunds are bounded cumulatively; references and destinations enforced", () => {
  let l = record(
    scenario(),
    command("r", "supplier_refund", 40000, {
      expenseKey: "f",
      destination: "fund",
    }),
  );
  rejects(
    () =>
      record(
        l,
        command("r2", "supplier_refund", 10001, {
          expenseKey: "f",
          destination: "fund",
        }),
      ),
    "EXCESS_REFUND",
  );
  rejects(
    () =>
      record(
        l,
        command("r3", "supplier_refund", 1, {
          expenseKey: "d",
          destination: "fund",
        }),
      ),
    "INVALID_REFUND_REFERENCE",
  );
  rejects(
    () =>
      record(
        l,
        command("r4", "supplier_refund", 1, {
          expenseKey: "f",
          destination: "personal",
        }),
      ),
    "INVALID_REFUND_DESTINATION",
  );
});
test("reimbursement, pending amounts and unsupported payloads cannot enter confirmed ledger", () => {
  for (const kind of ["reimbursement", "pending_expense", "advance"])
    rejects(
      () => record(empty(), command("a", kind, 1)),
      "UNSUPPORTED_OPERATION",
    );
  rejects(
    () =>
      record(empty(), {
        ...command("a", "fund_expense", 1),
        status: "pending",
      }),
    "INVALID_COMMAND",
  );
});
test("aggregate overflow rejects append even when each amount is safe", () => {
  let l = record(
    empty(),
    command("a", "deposit", Number.MAX_SAFE_INTEGER, { founderId: "A" }),
  );
  rejects(
    () => record(l, command("b", "deposit", 1, { founderId: "B" })),
    "AMOUNT_OVERFLOW",
  );
  assert.equal(l.entries.length, 1);
});
test("decimal input is converted exactly with comma or dot; invalid precision rejected", () => {
  assert.equal(parseEuros("12,34"), 1234);
  assert.equal(parseEuros("0.01"), 1);
  assert.equal(parseEuros("12.3"), 1230);
  for (const s of ["0", "-1", "1.001", "1e3", "", "abc", "90071992547410"])
    rejects(() => parseEuros(s), "INVALID_AMOUNT");
});
test("context requires unique nonempty founders", () => {
  for (const f of [[], ["A", "A"], [""]])
    rejects(() => createLedger("test-only", f), "INVALID_CONTEXT");
});
