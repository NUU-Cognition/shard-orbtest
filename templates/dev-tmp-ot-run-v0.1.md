---
description: "(Run) artifact: the Mesh record of one orbtest task run directory"
orb:
  - "@v1/nuucognition/session/43bf2b05-cc4e-4a9f-b82f-cc77e2b5af46#flint/nuu-orbh"
---

# Filename: Mesh/Types/Runs/(Run) NNN [basename of product root] [run-id].md

/* One (Run) per task run directory, for example `(Run) 007 my-app 2026-09-23T17-13-24Z`.
   Only the record_run skill creates it.
   NNN: flint helper type newnumber Run. Check that no file with NNN exists before you write.
   Every number and id is copied from run.json. Compute nothing.
   Never embed a screenshot or a DOM snapshot. Name the run directory in run-dir. */

```markdown
---
id: [generate-uuid4]
tags:
  - "#ot/run"
run-id: "[run.json id]"
product-root: [product root relative to the Flint root]
run-dir: [product-root]/orbtest/.local/runs/[run-id]
profile: [run.json profile.id]
tier: [blocking|informational, run.json profile.tier]
commit: [run.json definitions.commit, empty when null]
started: "[run.json started]"
ended: "[run.json ended]"
confirm: [true|false, true only when the run was started with --confirm]
outcome: [met when summary.tasks.unmet is 0, else unmet]
tasks-total: [summary.tasks.total]
tasks-met: [summary.tasks.met]
tasks-unmet: [summary.tasks.unmet]
evidence-asserted: [summary.tiers.asserted]
evidence-captured: [summary.tiers.captured]
evidence-claimed: [summary.tiers.claimed]
tests:
  - "[[(Test) NNN name]]"
  - (continue)
orb:
  - "[the output of flint address me]"
template: "[[tmp-ot-run-v0.1]]"
authors:
  - "[[@Person Name]]"
---

/* Quote run-id, started, and ended so YAML keeps the strings.
   tests: one wikilink per (Test) whose test-id and product-root match a tasks[] entry.
   Leave the key empty when no task has a (Test). */

# Tasks

| Task | Expect | Outcome | Met | Failure |
|------|--------|---------|-----|---------|
| [tasks[].id] | [tasks[].expect] | [tasks[].outcome] | [tasks[].met] | [tasks[].failure.reason, or empty] |
| (continue) |

/* One row per run.json tasks[] entry, in run.json order. */

# Notes

- Unrecorded tasks:
  - [task id of tasks[] with no (Test)]
  - (continue)

/* When every task has a (Test), write `- Unrecorded tasks: none`. */
```
