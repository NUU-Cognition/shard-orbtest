---
description: "Write a (Run) from a task run.json and link it from every (Test) it covers"
orb:
  - "@v1/nuucognition/session/43bf2b05-cc4e-4a9f-b82f-cc77e2b5af46#flint/nuu-orbh"
---

> [!important] THIS FILE IS AN INSTRUCTION. WHEN REFERENCED IT IS MEANT TO BE TAKEN AS AN ACTION.

Run `flint shard start ot` if you haven't already.

# Skill: Record Run

Write one `(Run)` for one task run directory and bring every covered `(Test)` up to date.

# Input

- Product root, as the Products table of the Flint Init spells it, for example `../Repos/app/apps/my-app`
- Run id, the directory name under `orbtest/.local/runs/`, for example `2026-09-23T17-13-24Z`
- Whether the run was started with `--confirm`. The summary line of `run` shows it: `confirmed <n>` after `--confirm`, `confirmed - (no --confirm)` without it.

# Actions

1. **Check the folder.** Run `flint orbtest check --root <product-root>` before every other `flint orbtest` command. Exit 0 is required. On exit 1, 2, or 3 follow [[dev-init-ot]], Version Handshake, and stop. Then run `flint orbtest validate --root <product-root>`; exit 0 is required, and warnings are allowed.
2. **Read the record.** Check the kind of the run directory by its name, per [[dev-knw-ot-records]], Kinds of Run Directory. Stop with `run <run-id> is not a task run` when the name starts with `author-`, `doctor-`, `behaviour-`, or `page`: those directories are never a `(Run)`. A behaviour run is recorded in the behaviour `(Test)`, per [[dev-wkfl-ot-behaviour]], Stage 9. An author run has a `run.json` with no `kind`, so check the name first. Read `<product-root>/orbtest/.local/runs/<run-id>/run.json`. Stop with `run <run-id> is a snapshot run; use record_suite` when the name starts with `snapshot-` or the record has `kind: snapshot`. Stop with `run <run-id> has not ended` when `ended` is absent.
3. **Refuse a duplicate.** Stop with `run <run-id> is already recorded as (Run) NNN` when a file under `Mesh/Types/Runs/` has this `run-id` and this `product-root`.
4. **Create the (Run).** Mint the number with `flint helper type newnumber Run` and check that no file has it. Write the artifact per [[dev-tmp-ot-run-v0.1]]. The field sources are in [[dev-knw-ot-records]], Task Run Record. Set `confirm` from the input.
5. **Link the Tests.** For every `tasks[]` entry, find the `(Test)` under `Mesh/Types/Tests/` with the same `test-id` and `product-root`. When none exists, list the task id under Unrecorded tasks. For each found `(Test)`:
   - Append the `(Run)` wikilink to `runs`, and add the `(Test)` wikilink to `tests` of the `(Run)`.
   - Set `last-outcome` to `met` or `unmet` from `tasks[].met`.
   - When `tasks[].stale` is true, or the entry has a step marked stale, set `status: stale`.
   - When the run was `--confirm` and `tasks[].confirmed.run` equals this run id, run `flint orbtest task show <id> --root <product-root> --json`, copy `confirmed.commit`, `confirmed.run`, and `confirmed.at` into `confirmed-commit`, `confirmed-run`, and `confirmed-at`, and set `status: confirmed`.
   - Add a Task Log entry `<date>: run <run-id> <met|unmet>`. Stamp your session in `orb:`: run `flint address me`, and append its `by` address (quoted) to `orb:`. Add nothing when `orb:` or `orbh-sessions` already has an item that is exactly your `by` address, `@v1/<org>/session/<uuid>`, `[[<uuid>]]`, or your bare `<uuid>`. An old (Test) keeps `orbh-sessions`: never remove it, and add no new item to it. See [[knw-f-artifacts]] § Session Tracking.
6. **Dispute a release.** When a `(Release)` under `Mesh/Types/Releases/` has this `product-root`, a `commit` equal to `definitions.commit`, and `status: green`, and this run is a whole-profile run of a blocking profile with `summary.tasks.unmet` above 0, set the `(Release)` to `status: disputed` and `disputed-by: <run-id>`, with a Task Log entry. A whole-profile run is one whose `tasks[]` ids equal the non-stale tasks that `flint orbtest task list --root <product-root> --profile <id>` prints.
7. **Stay read-only.** Read `run.json` only under `.local/runs/`. Write nothing under `orbtest/`.

# Output

- One new `(Run)` under `Mesh/Types/Runs/`
- Every covered `(Test)` links the run, and carries its outcome, its status, and its confirmed fields
- A disputed `(Release)` when the run contradicts one
