---
description: "Rewrite a (Suite) from the suite, its baseline sidecars, and the newest snapshot run, and set its status"
orb:
  - "@v1/nuucognition/session/43bf2b05-cc4e-4a9f-b82f-cc77e2b5af46#flint/nuu-orbh"
---

> [!important] THIS FILE IS AN INSTRUCTION. WHEN REFERENCED IT IS MEANT TO BE TAKEN AS AN ACTION.

Run `flint shard start ot` if you haven't already.

# Skill: Record Suite

Bring one `(Suite)` in step with the suite YAML, the approved baselines, and one snapshot run.

# Input

- Product root, as the Products table of the Flint Init spells it
- Suite id, for example `pages.main`
- (Optional) Snapshot run id, for example `snapshot-2026-09-23T05-11-50Z`. Default: the newest snapshot run that names the suite.

# Actions

1. **Check the folder.** Run `flint orbtest check --root <product-root>` before every other `flint orbtest` command. Exit 0 is required. On exit 1, 2, or 3 follow [[dev-init-ot]], Version Handshake, and stop. Then run `flint orbtest validate --root <product-root>`; exit 0 is required, and warnings are allowed.
2. **Load the suite.** Run `flint orbtest suite show <suite-id> --root <product-root> --json` and `flint orbtest baseline list --suite <suite-id> --root <product-root> --json`. Stop with the CLI message on exit 2.
3. **Resolve the run.** Read `<product-root>/orbtest/.local/runs/<run-id>/run.json` of the input, or of the newest `snapshot-*` directory whose `suites` holds the suite id. Stop with `run <run-id> is not a snapshot run` when `kind` is not `snapshot`. Continue with no run when none exists.
4. **Find or create.** Find the `(Suite)` under `Mesh/Types/Suites/` with this `suite-id` and `product-root`. When none exists, mint the number with `flint helper type newnumber Suite`, check that no file has it, and write the artifact per [[dev-tmp-ot-suite-v0.1]].
5. **Copy the fields.** Set `profiles`, `threshold`, `entries`, and the Entries table from `suite show` and `baseline list`. Set `approved-run` and `approved-at` from the newest sidecar, per [[dev-knw-ot-records]], Baseline Sidecar. `baseline list` does not print `viewport` or `threshold` of a baseline; read them from the sidecar JSON file when a Note needs them.
6. **Add the run.** Append one Runs row from the run per [[dev-knw-ot-records]], Snapshot Run Record, unless the row exists. Set `last-outcome` to its Outcome.
7. **Set the status.** Apply [[dev-knw-ot-records]], Suite Status From the Records. It is the one rule; do not use another. For the `approved` row, get the baseline commit time with `git -C <product-root> log -1 --format=%cI -- orbtest/ui/baselines/<suite-id>` and compare it with `started` of the run as points in time. Set `proven-run` to the run when the status is `approved`. Never set `retired`.
8. **Log the change.** Add a Task Log entry `<date>: run <run-id> <outcome>; status <status>`. Stamp your session in `orb:`: run `flint address me`, and append its `by` address (quoted) to `orb:`. Add nothing when `orb:` or `orbh-sessions` already has an item that is exactly your `by` address, `@v1/<org>/session/<uuid>`, `[[<uuid>]]`, or your bare `<uuid>`. An old (Suite) keeps `orbh-sessions`: never remove it, and add no new item to it. See [[knw-f-artifacts]] § Session Tracking.
9. **Dispute a release.** When a `(Release)` under `Mesh/Types/Releases/` has this `product-root`, a `commit` equal to the run `definitions.commit`, and `status: green`, and the run has a `fail` or `error` cell on a blocking profile, set the `(Release)` to `status: disputed` and `disputed-by: <run-id>`, with a Task Log entry.
10. **Stay read-only.** Read `run.json` only under `.local/runs/`. Write nothing under `orbtest/`, and nothing under `orbtest/ui/baselines/`.

# Output

- One `(Suite)` under `Mesh/Types/Suites/` with its entries, its runs, and its status
- A disputed `(Release)` when the run contradicts one
