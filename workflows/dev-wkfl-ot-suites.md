---
description: "Plan and prove a snapshot suite: propose the screens, write the suite, capture, review, approve the baselines, prove them"
orbh-sessions:
  - "[[b196755f-5e21-43d7-94f0-4c43c6e0d2a6]]"
---

> [!important] THIS FILE IS AN INSTRUCTION. WHEN REFERENCED IT IS MEANT TO BE TAKEN AS AN ACTION.

Run `flint shard start ot` if you haven't already.

# Workflow: Suites

Keep screens looking the same. Plan a suite, approve its baselines, and prove them with a second run. The same workflow extends a suite and re-baselines it after a failed run. Read [[dev-knw-ot-platforms]] for the family first.

> [!headless]
> In a headless or subagent Orbh session, the stages and the commands are the same. The entry plan and every baseline approval are questions, because a baseline approval is always a human decision. Report per [[dev-init-ot#Headless]]. Follow the `> [!headless]` callout in each stage.

# Input

- Product root, as the Products table of the Flint Init spells it
- Suite id and name, for example `pages.main`, `Main screens`, or an existing suite id
- Profile ids of the matrix

# Actions

## Stage 1: Plan

| Step | Command | Exit |
|------|---------|------|
| Version handshake | `flint orbtest check --root <product-root>` | 0 required, and it runs before every other `flint orbtest` command. On 1, 2, or 3 follow [[dev-init-ot]], Version Handshake. |
| Definitions load | `flint orbtest validate --root <product-root>` | 0 required, warnings allowed. 2 refused: give the human the file and the error. |
| What exists | `flint orbtest suite list --root <product-root>`, `flint orbtest suite show <id> --root <product-root>`, `flint orbtest task list --root <product-root>` | 0, 2 |

- Propose one entry per screen: the entry id, the route pattern, how to reach it (a literal route, or the steps of a confirmed task), the masks for what changes between runs (times, counters, version labels, a development toolbar), `full_page`, and the threshold. Shapes: `flint orbtest skills --section suites`. Example: the suite `pages.main` of a web app reaches every page behind the sign-in through the sign-in steps of `home.sign-in`, and masks the development toolbar `[data-dev-toolbar]`.
- Checkpoint: the human approves the entry plan. Once approved, progress to the next stage.

> [!headless]
> - `flint orbh session set phase plan`, `progress "stage 1/5"`. Run `flint orbtest check --root <product-root>` first, and act on its exit code per [[dev-init-ot#Headless]], Version Handshake, Headless. Then do the rest of this stage. Set `phase blocked` and ask one question with the entry plan as the body. Once approved, progress to the next stage.

## Stage 2: Write

| Step | Command | Exit |
|------|---------|------|
| New suite | `flint orbtest suite add <id> --name "<name>" --profile <id...> --entry <entry> --route <route> [--setup-from-task <task>] [--full-page] [--pixel-ratio <n>] [--per-pixel <n>] --root <product-root>` | 0, 2. `--dry-run` first. |
| More entries | `flint orbtest suite entry add <id> <entry> --route <route> [--setup-from-task <task>] [--full-page] --root <product-root>` | 0, 2 |
| Masks | `flint orbtest suite mask add <id> <entry> "{strategy: css, selector: '[data-dev-toolbar]'}" --root <product-root>` | 0, 2 |
| Entry fields | `flint orbtest suite entry set <id> <entry> <path>=<value> --root <product-root>`, for example `threshold={pixel_ratio: 0.01, per_pixel: 12}` | 0, 2 |
| Validate | `flint orbtest validate --root <product-root>` | 0 |

- Commit the printed files. Create the `(Suite)` per [[dev-tmp-ot-suite-v0.1]] with `status: new`. Progress to the next stage.

> [!headless]
> - `phase write`, `progress "stage 2/5 · entry <k>/<n>"`. Run the commands of this stage. Commit. Create the `(Suite)`. Set `artifacts`. Progress to the next stage.

## Stage 3: Capture and Review

| Step | Command | Exit |
|------|---------|------|
| Capture | `flint orbtest snapshot --root <product-root> --suite <id> [--profile <id>] [--entry <entry...>]` | 0 no failed cell, `new` cells allowed. 1 a failed cell on a blocking profile. 2 refused. 3 environment; with `ORBTEST_WORKER_BUSY`, run it again after the holder ends. |

- Give the human the `report <path>` line. `report.html` shows baseline, current, and diff per cell. The snapshot run id is the name of the folder of `report.html`, `snapshot-<time>`.
- Checkpoint: one verdict per cell: `approve`, `mask <locator>`, `change <what>`, or `drop`. Apply a mask with `suite mask add`, a change with `suite entry set`, a drop with `flint orbtest suite entry remove <id> <entry> --root <product-root>`, or `flint orbtest suite remove <id> --root <product-root>` when it was the only entry. Commit, then capture again. Once every cell is `approve`, progress to the next stage.

> [!headless]
> - `phase capture`. Run `snapshot`. On `ORBTEST_WORKER_BUSY`, act per [[dev-init-ot#Headless]]. Set `phase blocked` and ask one question with the report path and one line per cell as the body. Apply the verdicts as this stage says, commit, and capture again until every cell is `approve`. Progress to the next stage.

## Stage 4: Approve

| Step | Command | Exit |
|------|---------|------|
| Approve | `flint orbtest approve --root <product-root> --run <snapshot-run-id> [--cell <suite/entry/profile...>] [--by <name>]` | 0, 2 |

- `approve` is the only writer under `ui/baselines/`. Commit `orbtest/ui/baselines/<id>/`. Run [[dev-sk-ot-record_suite]] with the run. Progress to the next stage.

> [!headless]
> - `phase approve`. Run `approve --run <snapshot-run-id>` with the approved cells and `--by <the name the answer gave>`. Commit the baselines. Run [[dev-sk-ot-record_suite]]. Progress to the next stage.

## Stage 5: Prove

- Run `flint orbtest snapshot --root <product-root> --suite <id>` again (0 required, no `new` cell). Run [[dev-sk-ot-record_suite]] with the run. The `(Suite)` becomes `approved` when the run started after the baseline commit; the rule is in [[dev-knw-ot-records]], Suite Status From the Records. Commit the baselines before this run. The move of a folder from the first layout of format 0.0.1 also counts as a baseline commit. After such a move, one new snapshot run that passes brings the `(Suite)` back to `approved`; no new `approve` is needed.
- On exit 1, the baseline is not stable: go back to Stage 3 with the report path.

> [!headless]
> - `phase prove`. Run `snapshot` again and [[dev-sk-ot-record_suite]].
> - Exit 0: `phase complete`, `flint orbh update "suite <id> <status>" --kind completed`.
> - Any other exit: `phase blocked`, `blockers "suite <id> not proven: <report path>"`, `flint orbh update "suite <id> not proven: <report path>" --kind blocker`. With `ORBTEST_WORKER_BUSY`, act per [[dev-init-ot#Headless]] first.
> - End with `flint orbh session return --finish "<result>"`: the suite id, the cells, the two snapshot run ids, the `(Suite)` name and status, the commit SHAs, and the report paths.

# Output

- The suite under `orbtest/ui/suites/` and its baselines under `orbtest/ui/baselines/<id>/`, committed
- One `(Suite)` with `status: approved`, its Entries table, and two Runs rows

> [!headless]
> - The output above, in the returned result
