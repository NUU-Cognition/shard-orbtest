---
description: "Repair drift: read the drift report, triage every stale step, regenerate only what moved, re-confirm, record"
orbh-sessions:
  - "[[b196755f-5e21-43d7-94f0-4c43c6e0d2a6]]"
---

> [!important] THIS FILE IS AN INSTRUCTION. WHEN REFERENCED IT IS MEANT TO BE TAKEN AS AN ACTION.

Run `flint shard start ot` if you haven't already.

# Workflow: Repair

Bring stale tasks back to `confirmed` after a product change, and make the drift gate green.

> [!headless]
> In a headless or subagent Orbh session, the stages and the commands are the same. The triage checkpoint is dropped: the triage table is the plan. A `regen` that exits 0 needs no question. A `regen` that exits 2 is one question per bundle. A retire is always one question, also when a re-authored task needs a retire before its `register`. This agrees with the repair row of [[dev-init-ot#Headless]], What Changes. Report per [[dev-init-ot#Headless]]. Follow the `> [!headless]` callout in each stage.

# Input

- Product root, as the Products table of the Flint Init spells it
- Profile id
- (Optional) Task ids to restrict to

# Actions

## Stage 1: Report

| Step | Command | Exit |
|------|---------|------|
| Version handshake | `flint orbtest check --root <product-root>` | 0 required, and it runs before every other `flint orbtest` command. On 1, 2, or 3 follow [[dev-init-ot]], Version Handshake. |
| Definitions load | `flint orbtest validate --root <product-root>` | 0 required, warnings allowed. 2 refused: give the human the file and the error. |
| Clean tree | `git -C <product-root> status --porcelain` | Empty required. `run --confirm` refuses a dirty tree. |
| Drift | `flint orbtest drift --root <product-root> --profile <profile> [--task <id...>] --json` | 0 report printed and `stale: true` written to the newly stale steps. 2 refused. 3 git missing. |
| Marks | `flint orbtest task list --root <product-root> --stale`, `flint orbtest step list --root <product-root> --stale` | 0 |

- Commit the step files that `drift` marked. Once the report is read, progress to the next stage.

> [!headless]
> - `flint orbh session set phase report`, `progress "stage 1/4"`. Run `flint orbtest check --root <product-root>` first, and act on its exit code per [[dev-init-ot#Headless]], Version Handshake, Headless. Then do the rest of this stage. A dirty tree is a blocker: set `phase blocked`, `blockers "dirty tree under <product-root>"`, and return. Commit the marks. Progress to the next stage.

## Stage 2: Triage

| Signal, see [[dev-knw-ot-records]], Drift Report | Class | Action in Stage 3 |
|------|-------|-------------------|
| `component_touched` only | Report only | None. `drift` writes no mark for this signal, so there is no mark to clear. Name the step in the output. |
| `testid_missing`, a locator failure, or a route mismatch in a run | Moved | `regen --step` |
| The journey itself changed: a new screen, a removed action | Structural | `regen --task`, or a retire |
| `fingerprint_mismatch` only | Suspect | `run --confirm` clears it after a met run |
| A stale mark whose task meets when it runs now, for example a mark from a run that failed for an environment reason | Disproved | `step mark --clear` |

- Run `flint orbtest run --root <product-root> --profile <profile> --task <ids of the tasks with a stale step>` (0, 1, 2, 3) once. A task that meets with its stale step is in the Disproved class. A task that does not meet stays in its class. Give the human the `report <path>` line.
- Checkpoint: the human approves the triage plan: which marks to clear, which steps to regenerate, which tasks to re-author, and which to retire. Once approved, progress to the next stage.

> [!headless]
> - `phase triage`, `progress "stage 2/4 · step <k>/<n>"`. Class every signal per the table of this stage, and run the tasks with a stale step once to find the Disproved class. A `component_touched` signal is report only: list it in the result, and clear nothing for it. `flint orbh update "<plan summary>" --kind decision`. There is no checkpoint: the triage table is the plan. Progress to the next stage.

## Stage 3: Regenerate

| Step | Command | Exit |
|------|---------|------|
| Clear a mark the run disproved | `flint orbtest step mark <id> --clear --root <product-root>` | 0, 2 |
| Regenerate a step | `flint orbtest regen --root <product-root> --profile <profile> --step <id> --task <task-id>` | 0 identical, marks cleared. 1 the replay failed: give the human the run directory from the hint line `Open <dir>/run.json.` 2 differs: the error line ends with `review bundle: <dir>`. 3 no agent, or `ORBTEST_WORKER_BUSY`. |
| Re-author a task | `flint orbtest regen --root <product-root> --profile <profile> --task <task-id>` | Same codes. |
| Review | `flint orbtest register --root <product-root> --bundle <dir>` | 2, prints the diff |
| Write | `flint orbtest register --root <product-root> --bundle <dir> --approve` | 0, 2 |
| Retire | `flint orbtest task remove <id> --with-orphan-steps --root <product-root> --dry-run`, then without `--dry-run` | 0, 2 |

- `<dir>` is the review bundle directory, `<product-root>/orbtest/.local/runs/author-<time>/`. Take it from the `review bundle: <dir>` line of `regen`.
- Checkpoint on every exit 2 of `regen`: show the diff; the human approves the bundle or asks for a change. Commit the printed files after each write.
- A re-authored task that differs cannot replace the task in one step: `register` refuses a bundle whose task id exists. The hint lines of `regen` name the order: retire the task with `task remove <id>` (without `--with-orphan-steps`, so that the bundle can reuse its steps), then `register --approve`, then remove the steps that `step list --unused` prints. The retire is a human decision, as every retire is.
- Once every step of the plan is handled, progress to the next stage.

> [!headless]
> - `phase regenerate`, `progress "stage 3/4 · step <k>/<n>"`. Run `step mark --clear` and `regen` per the plan. On `regen` exit 0 continue. On exit 2, take the directory from the `review bundle: <dir>` line, run `register --bundle <dir>` for the diff, set `phase blocked`, and ask one question with the diff as the body; after approval run `register --approve`. On exit 1, or on an exit 3 that is not `ORBTEST_WORKER_BUSY`, record the step and the run directory that the error line or the hint line names, and continue with the next step. On `ORBTEST_WORKER_BUSY`, act per [[dev-init-ot#Headless]]. Never retire without a question. Commit after each write. Progress to the next stage.

## Stage 4: Confirm and Record

| Step | Command | Exit |
|------|---------|------|
| Confirm | `flint orbtest run --root <product-root> --profile <profile> --task <ids> --confirm` | 0, 1, 2, 3 |
| Gate | `flint orbtest drift --root <product-root> --check` | 0 required |

- Commit the task files. Run [[dev-sk-ot-record_run]] with `confirm` true, and [[dev-sk-ot-record_story]] per affected story. Set a retired `(Test)` to `status: retired`.
- On exit 1 of the confirm, give the human the `report <path>` line and stop.

> [!headless]
> - `phase confirm`. Run `run --confirm` on the repaired tasks and `drift --check`. Run [[dev-sk-ot-record_run]] and [[dev-sk-ot-record_story]]. Set `artifacts`.
> - `phase complete` when `drift --check` exits 0, else `phase blocked` with the failing tasks. End with `flint orbh session return --finish "<result>"`: the plan, each step with its outcome, the tasks confirmed, the gate exit code, the artifacts, the commit SHAs, and the report paths.

# Output

- Every task of the plan `confirmed` again, or retired, committed
- `drift --check` at exit 0
- The `(Run)`, `(Test)`, and `(Story)` artifacts up to date, and the report paths of what did not confirm

> [!headless]
> - The output above, in the returned result
