---
description: "Author one journey test from a request: brief, explore and freeze, review, register, confirm"
orbh-sessions:
  - "[[b196755f-5e21-43d7-94f0-4c43c6e0d2a6]]"
---

> [!important] THIS FILE IS AN INSTRUCTION. WHEN REFERENCED IT IS MEANT TO BE TAKEN AS AN ACTION.

Run `flint shard start ot` if you haven't already.

# Workflow: Tasks

Turn one request into one registered and confirmed test, with its `(Test)`, its `(Run)`, and its `(Story)` up to date.

> [!headless]
> In a headless or subagent Orbh session, the stages, the commands, and the exit codes are the same. The three checkpoints are gone: the request is the approval of the brief, the review block goes into the result, and a failed confirm ends the turn with the report path. Report per [[dev-init-ot#Headless]]. Follow the `> [!headless]` callout in each stage.

# Input

- Product root, as the Products table of the Flint Init spells it, for example `../Repos/app/apps/my-app`
- Profile id, for example `web-desktop-chromium`
- The request: one sentence, or a story id and a criterion number
- (Optional) Files the journey uploads

> [!headless]
> - Product root, profile id, the request, and any fixture files, as above
> - Every secret the journey needs already has a value: `flint orbtest secret list --root <product-root>` prints `set`. A missing value is a blocker; no human can type it in a headless run.

# Actions

## Stage 1: Brief

| Step | Command | Exit |
|------|---------|------|
| Version handshake | `flint orbtest check --root <product-root>` | 0 required, and it runs before every other `flint orbtest` command. On 1, 2, or 3 follow [[dev-init-ot]], Version Handshake. |
| Definitions load | `flint orbtest validate --root <product-root>` | 0 required, warnings allowed. 2 refused: give the human the file and the error. |
| Read the story | `flint orbtest story show <story-id> --root <product-root>` | 0 |
| Check the secrets | `flint orbtest secret list --root <product-root>` | 0. Add a missing name with `flint orbtest secret add <NAME> --root <product-root>`. |
| Add a fixture | `flint orbtest fixture add <source> --as <name> --root <product-root>` | 0, 2. It prints the name `ui/fixtures/<name>`; use that name in the brief. |

- Draft the brief per [[dev-knw-ot-authoring]], Brief: id `<prefix>.<verb>-<object>`, a description with `{{inputs.<key>}}` for every typed value, every secret as `env://NAME`, and a final verification with one deterministic check that proves the outcome. Write the verify file under your session scratch directory, never under `orbtest/`.
- Checkpoint: show the brief to the human. When a secret has no value, ask the human to run `flint orbtest secret enter --root <product-root>` and type it.
- Once the human approves, run `flint orbtest brief add <id> --description "<text>" --name "<name>" --profile <profile> --story <story-id> --input <key=value...> --verify-file <path> --root <product-root>` (0 written, 2 refused), then `flint orbtest brief show <id> --root <product-root>`. Commit the brief file. Progress to the next stage.

> [!headless]
> - `flint orbh session set phase brief`, `flint orbh session set progress "stage 1/5"`.
> - Run the commands of this stage in order. `flint orbtest check --root <product-root>` is the first one; act on its exit code per [[dev-init-ot#Headless]], Version Handshake, Headless. Then `validate`, `story show`, `secret list`, `fixture add`, then `brief add` and `brief show`. Commit the brief. There is no checkpoint: the request is the approval of the brief.
> - A secret with no value: set `phase blocked`, set `blockers "secret <NAME> has no value; run flint orbtest secret enter --root <product-root>"`, and return with the question.
> - Once the brief is committed, progress to the next stage.

## Stage 2: Explore and Freeze

| Step | Command | Exit |
|------|---------|------|
| Environment | `flint orbtest doctor --root <product-root> --profile <profile>` | 0 required. A `skipped` line for `setup verify` on a profile whose environment has `setup.start` is not a failure. On 3, give the human the failing lines and stop, or propose `--setup` and wait for consent. |
| Services | `flint orbtest doctor --root <product-root> --profile <profile> --start` | Only on a profile whose environment has `setup.start` or `setup.local_start`. 0 required. 3 with `ORBTEST_WORKER_BUSY`: another command holds the worker; run it again after the holder ends. Other 3: give the human the failing lines and stop. |
| Explore | `flint orbtest author --root <product-root> --brief <product-root>/orbtest/ui/briefs/<id>.yaml --profile <profile>` | 0 achieved. 1 not achieved: give the human the `report.html` of the author run, refine the brief with `brief set`, run again, at most twice. 2 refused. 3 no agent, or `ORBTEST_WORKER_BUSY`. |
| Map components | `flint orbtest components set <id> '<locator>' <path> --root <product-root>` | 0, 2 when the path does not exist |
| Convert again | `flint orbtest author --root <product-root> --brief <product-root>/orbtest/ui/briefs/<id>.yaml --from-run <author-run-dir> --components <product-root>/orbtest/ui/briefs/<id>.components.json` | 0, 2 |

- The author run directory is `<product-root>/orbtest/.local/runs/author-<time>/`. Take it from the line that `author` prints with the path of its `bundle.json`, the line that ends with `/bundle.json`: the directory is the folder of that file. It is the last line on stdout; hint lines on stderr can come after it. In this workflow, `<author-run-dir>` is that directory. `report.html` is in the same directory.
- Read `<author-run-dir>/bundle.json`. For every proposed step whose component is `external:<platform>:<locator>`, find the file that renders the element in the product source, map it, and convert again. `*` maps every unmapped locator. `--components` takes the path of the components map, or inline JSON.
- Once the bundle has `achieved: true` and every component is a file, progress to the next stage.

> [!headless]
> - `phase explore`, `progress "stage 2/5 · author attempt <k>/3"`.
> - Run `doctor`, `doctor --start` on a profile whose environment has `setup.start`, `author`, `components set`, and `author --from-run` as this stage says. Take the author run directory from the line of `author` that ends with `/bundle.json`. On a `doctor` exit 3 for a failed check, set `phase blocked` with the failing lines and return; never run `doctor --setup` without consent. On `ORBTEST_WORKER_BUSY`, act per [[dev-init-ot#Headless]].
> - After three `author` attempts with exit 1, set `phase blocked`, `blockers "brief <id> not achieved: <report path>"`, and return.
> - Once the bundle is achieved and mapped, progress to the next stage.

## Stage 3: Review

- Run `flint orbtest register --root <product-root> --bundle <author-run-dir>`. It exits 2 and prints the diff.
- Apply the review table of [[dev-knw-ot-authoring]], Review of Frozen Steps. Write the review block: the new steps with atom, locator, route, and component; the reused steps; the task verification; the dropped atoms; every finding.
- Checkpoint: the human approves the bundle, or asks for a change. A change to the journey goes back to Stage 2 with `brief set`. A field change is noted for Stage 4.
- Once the human approves, progress to the next stage.

> [!headless]
> - `phase review`. Run `register --bundle` (exit 2) and apply the review table of [[dev-knw-ot-authoring]]. Write the review block into the result. `flint orbh update "<one-line summary of the review>" --kind finding`. There is no checkpoint.
> - A finding that changes the journey goes back to Stage 2 once. A finding that changes a field is applied in Stage 4.
> - Once the review block is written, progress to the next stage.

## Stage 4: Register

| Step | Command | Exit |
|------|---------|------|
| Write | `flint orbtest register --root <product-root> --bundle <author-run-dir> --approve` | 0 written. 2 refused: read the message. |
| Field fixes | `flint orbtest step set <step-id> <path>=<value> --root <product-root>`, `step rename <old> <new>`, `task set <id> <path>=<value>`, `task rename <old> <new>` | 0, 2. Use `--dry-run` first for a fix the human did not see in Stage 3. |
| Validate | `flint orbtest validate --root <product-root>` | 0 |

- Commit the files the commands printed with `git -C <product-root> add <files>` and `git -C <product-root> commit -m "orbtest: register <id>" -- <files>`.
- Set the criteria that the task proves: `flint orbtest task set <id> 'proves=["<story-id>#<n>"]' --root <product-root>`, with the 0-based address of each criterion that the final verification proves (Mesh number minus one). Story membership alone proves no criterion. Commit the task file.
- Create the `(Test)` per [[dev-tmp-ot-test-v0.3]] from `flint orbtest task show <id> --root <product-root> --json`, with `layer: ui`, `status: registered`, `story`, and `covers` (each address of `proves` plus one). Progress to the next stage.

> [!headless]
> - `phase register`. Run `register --approve`, the field fixes, `validate`, and `task set <id> proves=...` as this stage says. Commit. Create the `(Test)` with `layer: ui`. Set `artifacts`.
> - Once the `(Test)` exists, progress to the next stage.

## Stage 5: Confirm

| Step | Command | Exit |
|------|---------|------|
| Freeze, when `task list` shows the task `agentic` | `flint orbtest run --root <product-root> --profile <profile> --task <id> --freeze`, then `flint orbtest register --root <product-root> --bundle <freeze-dir> --approve` | 0, 1, 2, 3. `<freeze-dir>` is `<run dir>/<id>`; take it from the `freeze <id>: ... review with register --bundle <dir>` line. Commit the printed files. |
| Confirm | `flint orbtest run --root <product-root> --profile <profile> --task <id> --confirm` | 0 anchored: the summary line prints `confirmed 1`. 1 unmet: give the human the `report <path>` line. 2 dirty tree: commit first, then run again; any other 2: give the human the message and stop. 3 `ORBTEST_WORKER_BUSY`: run again after the holder ends; any other 3: give the human the message and stop. |

- On exit 0, commit the task file and run [[dev-sk-ot-record_run]] with `confirm` true. On exit 1, checkpoint: the human decides between a brief change (Stage 2) and a stop.
- Run [[dev-sk-ot-record_story]] for the story. Propose [[dev-sk-ot-add_negative_control]] when the story has no task with `expect: fail`.

> [!headless]
> - `phase confirm`. Freeze when needed, then `run --confirm` as this stage says.
> - Exit 0: commit the task file. [[dev-sk-ot-record_run]], [[dev-sk-ot-record_story]], `phase complete`, `flint orbh update "registered and confirmed <id>" --kind completed`.
> - Exit 1: `phase blocked`, `blockers "confirm of <id> unmet: <report path>"`, `flint orbh update "confirm of <id> unmet" --kind blocker`. The task stays `registered`.
> - Exit 2: when the message says the tree is dirty, commit the files this workflow wrote and run `run --confirm` once more. Any other exit 2, or a second one: `phase blocked`, `blockers "confirm of <id> refused: <first line of the message>"`, `flint orbh update "<the same text>" --kind blocker`. The task stays `registered`.
> - Exit 3: with `ORBTEST_WORKER_BUSY`, act per [[dev-init-ot#Headless]]. Any other exit 3: `phase blocked`, `blockers "confirm of <id>: environment: <first line of the message>"`, `flint orbh update "<the same text>" --kind blocker`. The task stays `registered`.
> - End with `flint orbh session return --finish "<result>"`: the task id, the `(Test)`, the `(Run)`, the `(Story)`, the commit SHAs, the report paths, and the review block.

# Output

- The brief under `orbtest/ui/briefs/`, the steps under `orbtest/ui/steps/`, and the task under `orbtest/ui/tasks/`, committed, with a `confirmed` anchor
- One `(Test)` with `status: confirmed`, one `(Run)`, and the `(Story)` up to date
- The commit SHAs and the report paths

> [!headless]
> - The output above, plus the review block in the returned result
