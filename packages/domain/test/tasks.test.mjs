import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildTodayView,
  projectProgress,
  validateTask,
} from "../src/index.ts";

const task = (id, overrides = {}) => ({
  id,
  organizationId: "celeste",
  projectId: "product",
  assigneeId: "steve",
  title: `Tâche ${id}`,
  status: "todo",
  priority: "normal",
  dueDate: "2026-10-02",
  createdAt: "2026-10-01T08:00:00Z",
  ...overrides,
});

const scope = {
  organizationId: "celeste",
  actorId: "steve",
  projectIds: ["product"],
  missionIds: ["designer-mission"],
};

test("TODAY-01 contract: counters and list use the same organization and actor scope", () => {
  const view = buildTodayView(
    [
      task("visible"),
      task("other-org", { organizationId: "other" }),
      task("other-actor", { assigneeId: "maeva" }),
      task("other-project", { projectId: "finance" }),
      task("mission", { projectId: "brand", missionId: "designer-mission" }),
      task("other-mission", { missionId: "other-mission" }),
    ],
    scope,
    "2026-10-02",
  );
  assert.deepEqual(view.items.map((item) => item.task.id), ["mission", "visible"]);
  assert.equal(view.counts.total, view.items.length);
  assert.equal(view.counts.today, 2);
});

test("TODAY-01 contract: urgent first, then timing, creation and stable id", () => {
  const view = buildTodayView(
    [
      task("normal-overdue", { dueDate: "2026-10-01" }),
      task("urgent-upcoming", { priority: "urgent", dueDate: "2026-10-03" }),
      task("high-today-late", { priority: "high", createdAt: "2026-10-01T09:00:00Z" }),
      task("high-today-early", { priority: "high", createdAt: "2026-10-01T07:00:00Z" }),
    ],
    scope,
    "2026-10-02",
  );
  assert.deepEqual(view.items.map((item) => item.task.id), [
    "urgent-upcoming",
    "high-today-early",
    "high-today-late",
    "normal-overdue",
  ]);
  assert.equal(view.counts.overdue, 1);
});

test("completed and cancelled work never appears in Today", () => {
  const view = buildTodayView(
    [task("done", { status: "done" }), task("cancelled", { status: "cancelled" })],
    scope,
    "2026-10-02",
  );
  assert.equal(view.items.length, 0);
  assert.deepEqual(view.counts, {
    total: 0,
    overdue: 0,
    today: 0,
    blocked: 0,
    inReview: 0,
  });
});

test("TASK-01 contract: blocked work requires a reason and dates are explicit", () => {
  assert.throws(() => validateTask(task("blocked", { status: "blocked" })), {
    code: "BLOCKED_REASON_REQUIRED",
  });
  assert.doesNotThrow(() =>
    validateTask(task("blocked", { status: "blocked", blockedReason: "Accès requis" })),
  );
  assert.throws(() => validateTask(task("bad-date", { dueDate: "02/10/2026" })), {
    code: "INVALID_DUE_DATE",
  });
  assert.throws(() => validateTask(task("impossible-date", { dueDate: "2026-02-30" })), {
    code: "INVALID_DUE_DATE",
  });
});

test("project progress follows the access scope, excludes cancelled work and never invents a percentage", () => {
  const tasks = [
    task("done", { status: "done" }),
    task("todo"),
    task("cancelled", { status: "cancelled" }),
    task("other-org", { organizationId: "other", status: "done" }),
    task("hidden-mission", { missionId: "other-mission", status: "done" }),
  ];
  assert.equal(projectProgress(tasks, scope, "product"), 50);
  assert.equal(projectProgress(tasks, scope, "missing"), null);
});

test("derived views are immutable and detached from mutable input", () => {
  const source = task("one");
  const view = buildTodayView([source], scope, "2026-10-02");
  source.title = "Modifiée";
  assert.equal(view.items[0].task.title, "Tâche one");
  assert.throws(() => {
    view.items.push(task("two"));
  }, TypeError);
});
