---
description: "Record that one commit passed every orbtest gate, or refuse with the reason"
---

> [!important] THIS FILE IS AN INSTRUCTION. WHEN REFERENCED IT IS MEANT TO BE TAKEN AS AN ACTION.

Run `flint shard start ot` if you haven't already.

# Skill: Record Release

Write the one `(Release)` of a commit after a human ran the gate. The skill runs the drift check itself. It runs no task run and no snapshot run.

# Input

- Product root, as the Products table of the Flint Init spells it
- Commit, full or short, at which the human ran the gate. `HEAD` of the product repository must be at that commit.

# Actions

1. **Check the folder.** Run `flint orbtest check --root <product-root>` before every other `flint orbtest` command. Exit 0 is required. On exit 1, 2, or 3 follow [[dev-init-ot]], Version Handshake, and stop. Then run `flint orbtest validate --root <product-root>`; exit 0 is required, and warnings are allowed.
2. **Resolve the commit.** Run `git -C <product-root> rev-parse <commit>` for the full hash and `git -C <product-root> rev-parse HEAD` for `HEAD`. Stop with `HEAD is <x>, not <short>: check out the commit first` when `HEAD` differs. For the branch, run `git -C <product-root> symbolic-ref --quiet --short HEAD`: exit 0 prints the branch name. Exit 1 means a detached `HEAD`: the `branch` field is then empty. Never write `HEAD` as the branch.
3. **Refuse a duplicate.** Stop with `commit <short> is already recorded as (Release) NNN` when a file under `Mesh/Types/Releases/` has this `commit` and `product-root`.
4. **Find the profile runs.** Run `flint orbtest profile list --root <product-root> --json` and take every profile with tier `blocking`. For each, read the `run.json` of every task run directory under `<product-root>/orbtest/.local/runs/`, newest first. A task run directory has a name that is a `<time>` only, per [[dev-knw-ot-records]], Kinds of Run Directory: skip `author-*`, `doctor-*`, `snapshot-*`, `behaviour-*`, and `page`, although some of them have a `run.json` with no `kind`. Take the first with `profile.id` equal, `definitions.commit` equal to the commit, and `tasks[]` ids equal to the non-stale tasks of `flint orbtest task list --root <product-root> --profile <id>`. Stop with `no whole-profile run of <profile> at <short>` when none exists. Stop with `run <run-id> has <n> unmet task(s)` when `summary.tasks.unmet` is above 0.
5. **Find the suite runs.** Run `flint orbtest suite list --root <product-root> --json`. For each suite, read every `snapshot-*/run.json`, newest first, and take the first whose `suites` holds the id and whose `definitions.commit` equals the commit. Stop with `no snapshot run of <suite> at <short>` when none exists. Stop with `run <run-id> has <n> failed or new cell(s)` when `fail`, `error`, or `new` is above 0.
6. **Run the drift check.** Run `flint orbtest drift --root <product-root> --check`. Exit 0 is required. Stop with the CLI output on exit 1, 2, or 3.
7. **Record the runs.** Run [[dev-sk-ot-record_run]] for every profile run of step 4 that has no `(Run)`, with `confirm` from how the human started it. Run [[dev-sk-ot-record_suite]] for every suite with its run of step 5.
8. **Create the (Release).** Mint the number with `flint helper type newnumber Release` and check that no file has it. Write the artifact per [[dev-tmp-ot-release-v0.1]] with `status: green`, `machine` and `recorded-by` from `flint whoami`, the `(Run)` and `(Suite)` links, one Gate row per run and one for the drift check, and the four sums.
9. **Stay read-only.** Read `run.json` only under `.local/runs/`. Write nothing under `orbtest/`.

# Output

- One `(Release)` under `Mesh/Types/Releases/` with `status: green`, or a refusal line that names the missing gate
- The `(Run)` and `(Suite)` artifacts the release links
