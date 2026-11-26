---
description: "Reconcile a product with its stories and tests: report the gaps in three classes, fill the ones a human approves"
orbh-sessions:
  - "[[b196755f-5e21-43d7-94f0-4c43c6e0d2a6]]"
---

> [!important] THIS FILE IS AN INSTRUCTION. WHEN REFERENCED IT IS MEANT TO BE TAKEN AS AN ACTION.

Run `flint shard start ot` if you haven't already.

# Workflow: Gaps

Find what the product serves that no story describes, what no criterion has proof for in either layer, and what the definitions name that no longer exists. Fill what the human approves.

> [!headless]
> In a headless or subagent Orbh session, the stages and the commands are the same. The Stage 3 checkpoint is one question that carries the gap report and the fill plan. Report per [[dev-init-ot#Headless]]. Follow the `> [!headless]` callout in each stage.

# Input

- Product root, as the Products table of the Flint Init spells it
- (Optional) One story id to reconcile alone

# Actions

## Stage 1: Examine

| Step | Command | Exit |
|------|---------|------|
| Version handshake | `flint orbtest check --root <product-root>` | 0 required, and it runs before every other `flint orbtest` command. On 1, 2, or 3 follow [[dev-init-ot]], Version Handshake. |
| Definitions load | `flint orbtest validate --root <product-root>` | 0 required, warnings allowed. 2 refused: give the human the file and the error. |
| Definitions | `flint orbtest story list --root <product-root> --json`, `flint orbtest task list --root <product-root> --json`, `flint orbtest step list --root <product-root> --json` | 0 |
| Criterion states | `flint orbtest coverage --root <product-root> --json` | 0. One state per criterion from both layers: UI tests and behaviour tests. |
| Coverage | [[dev-sk-ot-record_story]] per story | |
| Drift | `flint orbtest drift --root <product-root> --check` | 0, 1. Read-only. |

- Read the product: the routes and commands it serves now. Write the coverage map as in [[dev-wkfl-ot-stories]] Stage 1.
- Once the map and the `(Story)` artifacts are current, progress to the next stage.

> [!headless]
> - `flint orbh session set phase examine`, `progress "stage 1/5"`. Run `flint orbtest check --root <product-root>` first, and act on its exit code per [[dev-init-ot#Headless]], Version Handshake, Headless. Then do the rest of this stage. Progress to the next stage.

## Stage 2: Classify

| Class | Test | Fill |
|-------|------|------|
| A, no story | A served route or command that no story mentions | A new story |
| B, no test | A criterion in state `gap`: no UI task and no behaviour case names it | A new journey through [[dev-wkfl-ot-tasks]], or a behaviour case through [[dev-wkfl-ot-behaviour]]. Choose the layer by the owner boundary: a journey of a person through the interface is a UI test; any other behaviour is a behaviour test. |
| C, gone | A story, a task, or a step that names a route, a component, or a command the product no longer serves | A retire, or `stale: true` on the story |
| Not a gap | `nav.goto` with `component: unknown`; an `informational` story with no test by decision | Nothing |

- Write the gap report: one row per gap with its class and the evidence. Progress to the next stage.

> [!headless]
> - `phase classify`. Write the gap report as this stage says. `flint orbh update "<a> no-story, <b> no-test, <c> gone" --kind finding`. When the report is empty, set `phase complete` and return. Progress to the next stage.

## Stage 3: Propose

- Draft per gap: a story with criteria for A, a journey for B, and for C the retire command with `--dry-run` output or `story set <id> stale=true`.
- Checkpoint: the human approves each fill, or drops it. Once approved, progress to the next stage.

> [!headless]
> - `phase propose`. Draft the fills. Set `phase blocked` and ask one question with the gap report and the fill plan as the body. Once the answer approves, progress to the next stage.

## Stage 4: Fill

| Fill | Command | Exit |
|------|---------|------|
| A | `flint orbtest story add <id> --name "<name>" --story "<text>" --tier <tier> --root <product-root>`, then `story criterion add` per criterion | 0, 2 |
| B | [[dev-wkfl-ot-tasks]] per journey, or [[dev-wkfl-ot-behaviour]] per behaviour | |
| C, retire a task | `flint orbtest task remove <id> --with-orphan-steps --root <product-root> --dry-run`, then without `--dry-run`. Set the `(Test)` to `retired`. | 0, 2 |
| C, retire a story | `flint orbtest story remove <id> --unbind --root <product-root>` after its tasks are retired | 0, 2 |
| C, changed story | `flint orbtest story set <id> stale=true --root <product-root>`, or `story criterion set <id> <n> "<text>"` with the 0-based index | 0, 2 |

- Commit the printed files after each command. Progress to the next stage.

> [!headless]
> - `phase fill`, `progress "stage 4/5 · fill <k>/<n>"`. Run the approved fills as this stage says, with [[dev-wkfl-ot-tasks]] (and its `> [!headless]` callouts) for class B. Commit after each command. Set `artifacts`. Progress to the next stage.

## Stage 5: Refresh

- Run [[dev-sk-ot-record_story]] per affected story and `flint orbtest drift --root <product-root> --check` (0 required after fills).
- Print the coverage table: story, criteria covered of total, and the gaps that stay open.

> [!headless]
> - `phase refresh`. Run [[dev-sk-ot-record_story]] per affected story and `drift --check`. `phase complete`. End with `flint orbh session return --finish "<result>"`: the gap report, the fills done, the coverage table, the commit SHAs, and the open gaps.

# Output

- The gap report with three classes
- The approved fills, committed, with their `(Story)` and `(Test)` artifacts
- The coverage table and the open gaps

> [!headless]
> - The output above, in the returned result
