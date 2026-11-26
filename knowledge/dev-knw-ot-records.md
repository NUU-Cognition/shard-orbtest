---
description: "Run directory kinds, run records, snapshot records, baseline sidecars, the one suite status rule, drift signals, pruning, and the gate rules that the Mesh artifacts copy"
---

# Knowledge: Records

What the shard reads under `orbtest/.local/runs/` and `orbtest/ui/baselines/`, and which field goes into which Mesh artifact. `flint orbtest skills --section run-layout` lists the paths. This file lists the fields inside them. Copy every value. Compute nothing except the four sums of a `(Release)`.

## Kinds of Run Directory

Every run directory sits under `.local/runs/`. The name gives the kind. See [[dev-init-ot]], Terms, run-id.

| Name | Kind | A Mesh record |
|------|------|---------------|
| `<time>`, for example `2026-09-23T17-13-24Z` | Task run | One `(Run)` |
| `snapshot-<time>` | Snapshot run, `kind: snapshot` | One row of a `(Suite)` |
| `author-<time>` | Author run, or the review bundle of `regen`. Its `run.json` has no `kind`. | None |
| `doctor-<time>` | Doctor run: service logs and `provision.jsonl`, no `run.json` | None |
| `page` | The default folder of `flint orbtest page` | None |
| `behaviour-<time>-<hex>`, for example `behaviour-2026-09-27T09-12-30-123Z-3f9a1c2b` | Behaviour run, `kind: behaviour`, `schema: orbtest-behaviour-run/1` | No `(Run)`. The behaviour `(Test)` names the run id and the report path in its Task Log. The fields are in [[dev-knw-ot-behaviour]], Runs, Results, and Evidence. |

A skill that looks for task runs reads only the directories whose name is a `<time>`. It never reads `author-*`, `doctor-*`, or `behaviour-*` as a task run. An author run has a `run.json` with no `kind`, so its name is the only sign of its kind. A doctor run holds service logs and `provision.jsonl`, and no `run.json`.

## Task Run Record

`.local/runs/<run-id>/run.json`. A `(Run)` copies these fields.

| `(Run)` field | Source in `run.json` |
|---------------|----------------------|
| `run-id` | `id` |
| `profile` | `profile.id`, the id of the UI profile |
| `tier` | `profile.tier`, a field of the UI profile |
| `commit` | `definitions.commit`, empty when `null` |
| `started`, `ended` | `started`, `ended` |
| `outcome` | `met` when `summary.tasks.unmet` is 0, else `unmet` |
| `tasks-total`, `tasks-met`, `tasks-unmet` | `summary.tasks.total`, `.met`, `.unmet` |
| `evidence-asserted`, `evidence-captured`, `evidence-claimed` | `summary.tiers.asserted`, `.captured`, `.claimed` |
| `confirm` | Not in `run.json`. `true` only when the caller ran `--confirm`. The summary line of `run` shows it: `confirmed <n>` after `--confirm`, `confirmed - (no --confirm)` without it. |
| Tasks table row | `tasks[].id`, `.expect`, `.outcome`, `.met`, `.failure.reason` |

The `profile` object of `run.json` holds `id` and `tier` only. It does not name the environment: `flint orbtest profile show <id> --root <product-root>` names both files of the profile. A task entry is `met` when `outcome` equals `expect`. A negative control, `expect: fail`, is met when its final verification fails. `summary.tasks.confirmed` counts the tasks this run anchored. `report` is the run-relative path of `report.html`; the absolute path is `<product-root>/orbtest/.local/runs/<run-id>/report.html`.

## Evidence Tiers

| Tier | Meaning |
|------|---------|
| `asserted` | A deterministic check passed. |
| `captured` | A screenshot, a DOM snapshot, or a route was recorded. |
| `claimed` | An agent judged the evidence. An agentic verification is claimed-tier only. |

## Snapshot Run Record

`.local/runs/snapshot-<time>/run.json` has `kind: snapshot`. It is never a `(Run)`. It is one row of the `(Suite)` Runs table.

| Runs table column | Source |
|-------------------|--------|
| Run | `id` |
| Cells, Pass, Fail, Error, New | `summary.cells.total`, `.pass`, `.fail`, `.error`, `.new` |
| Outcome | `pass` when `fail` and `error` are 0, else `fail` |

`summary.blocking_failed` is what the gate counts. A `new` cell has no baseline; it counts in `total` and `new` only. `cells[]` has one entry per cell with `suite`, `entry`, `profile`, `route`, `status`, and the metrics. The commit is `definitions.commit`.

## Baseline Sidecar

`ui/baselines/<suite>/<entry>/<profile>.json`, next to the `.png`, under the definitions root. `<profile>` is the id of the UI profile. `flint orbtest baseline list --root <product-root> [--suite <id>] --json` prints `approved_by`, `approved_at`, `run`, and `app_version` of each sidecar, with the paths of the two files. It does not print `viewport` or `threshold`: read those from the sidecar JSON file.

| Field | Source | Use |
|-------|--------|-----|
| `approved_by`, `approved_at` | `baseline list` | The Entries table of the `(Suite)`. `approved-at` of the `(Suite)` is the newest `approved_at`. |
| `run` | `baseline list` | The snapshot run the capture came from. `approved-run` of the `(Suite)` is the `run` of the newest sidecar. A snapshot run named here is never pruned. |
| `app_version` | `baseline list` | Notes only. |
| `viewport`, `threshold` | The sidecar JSON file only | Notes only. |

## Suite Status From the Records

This is the one rule for the status of a `(Suite)`. [[dev-init-ot]], Suite Lifecycle, links here, and [[dev-sk-ot-record_suite]] applies it. Take the first row that matches:

| Condition | Status |
|-----------|--------|
| `suite show` prints a missing cell, or no snapshot run of the suite is recorded | `new` |
| The newest recorded snapshot run has `fail` or `error` above 0 | `failing` |
| The newest recorded snapshot run has `fail`, `error`, and `new` at 0, and its `started` is later than the baseline commit time | `approved` |
| Any other case | `new` |

The baseline commit time is the commit time of the newest commit that changed the baselines of the suite. This command prints it:

```
git -C <product-root> log -1 --format=%cI -- orbtest/ui/baselines/<suite-id>
```

It prints nothing when the baselines are not committed yet; the status is then `new`. The commit that moved a folder from the first layout of format 0.0.1 (see [[dev-init-ot]], Version Handshake) counts as a baseline commit: it is the newest commit that changed `orbtest/ui/baselines/<suite-id>`. So after the move the suite is `new` until a snapshot run that started after the move commit passes with `fail`, `error`, and `new` at 0. A release after the move needs that new snapshot run. git prints the time with a local offset, for example `2026-09-23T12:43:59+10:00`, and `run.json` has UTC, for example `2026-09-23T05:11:50.123Z`. Compare the two as points in time, not as text.

`proven-run` is the newest run that gave `approved`. `last-outcome` is the Outcome of the newest row.

## Drift Report

`flint orbtest drift --root <product-root> --json` prints one entry per step with signals. Without `--check` it writes `stale: true` into the step YAML of each newly stale step. It never writes a task.

| Signal | Meaning | Marks |
|--------|---------|-------|
| `testid_missing` | A `testid` value left the component file since the confirmed commit. | stale |
| `component_touched` | The component file changed, but the value is still present. | report only: no mark is written, so there is no mark to clear |
| `fingerprint_mismatch` | A run passed the step, but the target fingerprint differed from the stored one. | suspect |
| route or locator failure in a run | A run could not resolve the step. | stale |

`task list --stale` and `step list --stale` print the marks. `drift --check` exits 1 when a blocking task is stale or has no `confirmed` anchor. A task with an agentic step is never unconfirmed for the gate. `run --confirm` and `regen` clear `suspect`.

## Pruning

`runs prune` deletes old run folders per kind: task runs, `author-*`, `snapshot-*`, `doctor-*`, and `behaviour-*`. The newest `--keep` of each kind stay. A snapshot run that a baseline names in `run` always stays. A behaviour run that a sidecar anchor names always stays. `run --keep <n>` and `runs.keep` in `orbtest.toml` prune task runs after each run. A `(Run)` whose directory was pruned keeps its copied numbers and loses its artifacts.

## The Gate and a Release

A `(Release)` needs, at one commit, all of these:

| Gate | Command | Passes when |
|------|---------|-------------|
| One whole-profile run per blocking profile | `flint orbtest run --root <product-root> --profile <id>` | Exit 0, and `definitions.commit` equals the commit |
| One snapshot run per suite | `flint orbtest snapshot --root <product-root> --suite <id>` | Every cell `pass`, no `new` cell, and `definitions.commit` equals the commit |
| The drift check | `flint orbtest drift --root <product-root> --check` | Exit 0 with `HEAD` at the commit |

A run started with `--task`, `--story`, or `--watch` never counts. Two gate commands on the same worker cannot overlap: the worker lock refuses the second with exit 3 and `ORBTEST_WORKER_BUSY` (see [[dev-init-ot]], Commands). That exit is not a gate result; run the command again after the holder ends. The four sums of a `(Release)` are `tasks-total` and `tasks-met` over its linked `(Run)` artifacts, and `cells-total` and `cells-pass` over its snapshot runs. A commit has at most one `(Release)`.

## What the Shard Reads Under .local/runs/

`run.json`, `bundle.json`, `agent.jsonl`, `dom.json`, `report.html`, and `.png` files. For a behaviour run also the case files `cases/<encoded case id>/stdout.txt`, `stderr.txt`, and `evidence/`, and the heal records `heal/<encoded case id>.json`. Nothing else. The shard names the path of `report.html` for the human and does not open the file. The shard never writes there. The same list is in [[dev-init-ot]], Boundary.
