---
description: "(Suite) artifact: the Mesh record of one orbtest snapshot suite, its baselines, and its snapshot runs"
orb:
  - "@v1/nuucognition/session/43bf2b05-cc4e-4a9f-b82f-cc77e2b5af46#flint/nuu-orbh"
---

# Filename: Mesh/Types/Suites/(Suite) NNN [suite name].md

/* One (Suite) per suite id per product root, for example `(Suite) 001 Core screens`.
   The suites workflow creates it. The record_suite skill rewrites it.
   NNN: flint helper type newnumber Suite. Check that no file with NNN exists before you write.
   Approver names, times, and counts come from `flint orbtest baseline list` and from the
   snapshot run.json. Compute nothing. Never embed a capture, a baseline, or a diff. */

```markdown
---
id: [generate-uuid4]
tags:
  - "#ot/suite"
status: [new|approved|failing|retired]
suite-id: [suite id, for example pages.main]
product-root: [product root relative to the Flint root]
profiles:
  - [profile id, in suite order]
  - (continue)
threshold: "[pixel_ratio <n> / per_pixel <n>, the suite default]"
entries:
  - [entry id, in suite order]
  - (continue)
approved-run: [snapshot run id whose captures were approved last, or empty]
approved-at: "[approved_at of the newest baseline, or empty]"
proven-run: [snapshot run id of the last run in which every cell passed, or empty]
last-outcome: [pass|fail|empty]
wip-commits:
orb:
  - "[the output of flint address me]"
template: "[[tmp-ot-suite-v0.1]]"
authors:
  - "[[@Person Name]]"
---

/* status rules are in the init, Suite lifecycle. Quote every time so YAML keeps the string.
   last-outcome: the outcome of the newest row of the Runs table. */

# Entries

| Entry | Route | Reach | Masks | Baseline approved by | Approved at |
|-------|-------|-------|-------|----------------------|-------------|
| [entry id] | [entry route] | [literal, or the setup step ids joined by `, `] | [each mask as `<strategy> <locator value>`, joined by `, `, or `-`] | [approved_by of the baseline, or `-`] | [approved_at, or `-`] |
| (continue) |

/* One row per entry, in suite order. With several profiles, the approver columns show the first
   profile. The Notes name the other baselines.
   Masks: the locator value of each strategy, from `suite show --json`:
   testid, text, label: `<strategy> <value>`, for example `testid dashboard-home`.
   role: `role <role> "<name>"`, or `role <role>` with no name.
   css: `css <selector>`, for example `css [data-dev-toolbar]`. A css mask has no `value`.
   coords: `coords <x>,<y>`.
   Write each `|` inside a value as `\|`, so the table keeps its columns. */

# Runs

| Run | Cells | Pass | Fail | Error | New | Outcome |
|-----|-------|------|------|-------|-----|---------|
| [snapshot run id] | [summary.cells.total] | [pass] | [fail] | [error] | [new] | [pass when fail and error are 0, else fail] |
| (continue) |

/* One row per snapshot run the workflow ran or the skill recorded, oldest first. */

# Task Log

- [YYYY-MM-DD]: [what happened, for example suite written at commit abc1234, or approved 9 baselines from snapshot-2026-09-22T06-58-54Z]
- (continue)

# Notes

- [the machine the baselines were approved on, the masks and why, open questions]
- (continue)
```
