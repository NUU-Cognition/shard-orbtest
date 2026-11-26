---
description: "Prove one behaviour with a behaviour test: design the environments and fixtures, write the spec, write the bound test, see it fail first, bind, run, confirm, record"
orbh-sessions:
  - "[[b196755f-5e21-43d7-94f0-4c43c6e0d2a6]]"
---

> [!important] THIS FILE IS AN INSTRUCTION. WHEN REFERENCED IT IS MEANT TO BE TAKEN AS AN ACTION.

Run `flint shard start ot` if you haven't already.

# Workflow: Behaviour

Prove the criteria of one story with behaviour tests. You design the test architecture of the product: the environments, the places, the fixtures, and the harness. Then you write the words of each case, bind real test code to them, see each case fail for the intended reason, and confirm it. Read [[dev-knw-ot-behaviour]] before Stage 1. The files that you write by hand are listed in [[dev-init-ot]], Boundary, the behaviour exception. Write nothing else under `orbtest/` by hand.

> [!headless]
> In a headless or subagent Orbh session, the stages and the commands are the same. The checkpoints of Stage 2 and Stage 3 become one question: the environment design (with a Products row when the product has none) and the words of each new case. A new story and a new criterion need no approval. Ask it after you wrote the design and the spec, and before you write test code. A dispatch whose prompt already approves the design and the words asks no question; name the approval in the result. Report per [[dev-init-ot#Headless]]. Read [[dev-knw-ot-behaviour]] first. Follow the `> [!headless]` callout in each stage.

# Input

- Product root, as the Products table of the Flint Init spells it
- Story id, and the criteria to prove, as 1-based Mesh numbers or as a behaviour in words
- (Optional) Spec id, environment id, place ids

# Actions

## Stage 1: Examine

Adopt the behaviour layer first when the product does not have it. The order depends on what exists, because `check` exits 2 on a product with no `orbtest/` folder:

| The product | Order |
|-------------|-------|
| No `<product-root>/orbtest/` folder: a fresh product | `init --layer behaviour` first, then `check`. A product with no `orbtest/` needs no handshake before the scaffold, because `init` writes the format stamp. |
| An `orbtest/` folder with no `behaviour/specs/`, for example a product with UI tests only | `check` first, and exit 0 is required. Then `init --layer behaviour`, then `check` again. `init` does not repair an existing folder that is older, malformed, or newer: `check` stops the stage before it. |
| An `orbtest/` folder with `behaviour/specs/` | `check` only. |

| Step | Command | Exit |
|------|---------|------|
| Existing folder: version handshake | When `<product-root>/orbtest/` exists: `flint orbtest check --root <product-root>` | 0 required before any other `flint orbtest` command. On 1, 2, or 3 follow [[dev-init-ot]], Version Handshake, and stop. |
| Behaviour layer | When `<product-root>/orbtest/` or `<product-root>/orbtest/behaviour/specs/` is absent: `flint orbtest init --root <product-root> --layer behaviour` | 0. It writes `orbtest.toml` and `.gitignore` in a new folder, the environment `local`, an example story, and the example spec `example.hello`. Commit the files it printed. Replace the example spec with the first real spec in Stage 3. 2: give the human the message and stop; nothing was written. |
| Version handshake after the scaffold | `flint orbtest check --root <product-root>` | 0 required. Read each warning of the behaviour layer. In an existing folder, the scaffold does not add the line `behaviour/node_modules/` to `orbtest/.gitignore`, and `check` warns about it: give the human the line to add (see [[dev-init-ot]], Boundary). |
| Definitions load | `flint orbtest validate --root <product-root>` | 0 required. Each warning of the behaviour layer names a file and a line: an invalid case, a spec that does not load, a malformed fixture, kind, place, or sidecar. |
| The story | `flint orbtest story show <story-id> --root <product-root> --json` | 0. 2 unknown story: run [[dev-wkfl-ot-stories]] first. |
| Coverage | `flint orbtest coverage --root <product-root> --story <story-id> --json` | 0. Take the criteria in `gap`, `stale`, `failing`, and `not-run`. |
| Specs | `flint orbtest behaviour list --root <product-root> --story <story-id> --json` | 0 |
| Environments, places, fixtures | `flint orbtest environment list --root <product-root>`, `flint orbtest behaviour place list --root <product-root>`, `flint orbtest behaviour fixture list --root <product-root>` | 0 |
| Kinds and slots | `flint orbtest skills --section behaviour` | 0 |

- When the product has no row in the Products table of the Flint Init, propose one (Product, Product root, Repository, Canon branch). The human approves it in the checkpoint of Stage 2, and you write it then. This workflow and [[dev-wkfl-ot-init]] are the only writers of a row.
- Read the product. For each criterion, find its **owner boundary**: the command, the exported function, the file format, or the protocol where the behaviour is observable. Read the code paths behind it, the harness that exists, and the tests of the story that exist, bound or not.
- Translate every Mesh number `n` into the address `<story-id>#<n-1>`.
- Write the examine table: each criterion with its address, its state, its owner boundary, and the specs, environments, and fixtures that you can reuse. Once the table is complete, progress to the next stage.

> [!headless]
> - `flint orbh session set phase examine`, `progress "stage 1/9"`. Adopt the behaviour layer in the order of this stage:
>   - No `<product-root>/orbtest/` folder: run `flint orbtest init --root <product-root> --layer behaviour` first, commit the printed files, then run `flint orbtest check --root <product-root>`.
>   - An `orbtest/` folder with no `behaviour/specs/`: run `flint orbtest check --root <product-root>` first, then `init --layer behaviour`, commit the printed files, and run `check` again.
>   - An `orbtest/` folder with `behaviour/specs/`: run `check` only.
>   - Act on each exit code of `check` per [[dev-init-ot#Headless]], Version Handshake, Headless. A refusal of `init` (exit 2) is a blocker: set `phase blocked`, `blockers "init --layer behaviour refused under <product-root>"`, and return its message. A warning about the `.gitignore` line `behaviour/node_modules/` goes into the result for a human.
> - Then run the other steps of this stage. Write the examine table into the result. Progress to the next stage.

## Stage 2: Design Environments and Fixtures

You design the test architecture of this product. Orbtest gives slots. It does not prescribe a design. Answer these questions, and reuse what exists first:

| Question | Where the answer goes |
|----------|-----------------------|
| Which kinds do the cases need: `unit`, `integration`, `check`, `property`, `migration`, `live-agent`, or a product kind? | The `kind` of each case; a product kind in `behaviour/kinds/<id>.yaml` |
| What does the product need to run for real and in isolation: a private home, a build copy, a stub for a service that the product does not own, a Git guard, ports per worker? | The environment: `isolation`, `vars`, `hooks`; the code in `behaviour/harness/` |
| Where must it run: this machine, a container with a clean OS, another machine? | The `place` of the environment; `places/<id>.yaml` or `.local/places/<id>.yaml` |
| What must the controller send to a place, and how does the place make the product ready? | The hooks `prepare` and `stage` |
| Which real states do the cases start from, including bad states on purpose? | Fixture recipes and scripts in `behaviour/fixtures/` |

- Write the harness code, the fixtures, the kinds, and the place files by hand. Never put a secret, a key, or a path of the real home in them.
- For a state that is hard to build by hand, `flint orbtest behaviour fixture author --root <product-root> --brief "<state in words>"` asks an agent for a recipe. It writes the proposal under `.local/runs/fixture-author-<time>/` only. Read it, and copy it to `behaviour/fixtures/<id>.yaml` after the checkpoint of this stage.
- Write an environment with the CLI: `flint orbtest environment add <id> --root <product-root> --file <path>` for a whole new environment from a file outside `orbtest/`, or `flint orbtest environment set <id> <path>=<value> --root <product-root>` for one field. Use `--dry-run` first. Each variable that selects a state folder, a home, or a config folder of the product (for example `APP_HOME`) must point under `{{case_dir}}`, never at the real folder.

| Check | Command | Exit |
|-------|---------|------|
| Definitions load | `flint orbtest validate --root <product-root>` | 0 with no new warning of the behaviour layer |
| Each place | `flint orbtest behaviour place check <place-id> --root <product-root>` | 0 required. 3: the place is not reachable or a tool is missing. |
| Each new or changed fixture | `flint orbtest behaviour fixture build <fixture-id> --root <product-root> [--place <place-id>]` | 0 built and verified. 1: fix the recipe. A fixture that does not verify is never used. |

- Checkpoint: the human approves the design: the environment file, the places, each fixture recipe, the harness entry points, and the Products row when Stage 1 proposed one. Show the isolation block and the safety of each path.
- Commit the files. Write the approved Products row in the Orbtest section of the Flint Init. Once approved, progress to the next stage.

> [!headless]
> - `phase design`, `progress "stage 2/9"`. Design and write as this stage says. Run `validate`, `behaviour place check` for each place, and `behaviour fixture build` for each new fixture. A place that exits 3 is a blocker: set `phase blocked`, `blockers "place <id>: <reason>"`, and return. Commit. The checkpoint of this stage is part of the one question of Stage 3. Progress to the next stage.

## Stage 3: Write the Spec

The words come first. A person reviews the words before any test code exists.

- When the story lacks a criterion that you must prove, write its text in EARS form ("When <trigger>, the <system> shall <response>." or "If <condition>, then the <system> shall <response>."), and run `flint orbtest story criterion add <story-id> "<text>" --root <product-root>`. A new criterion needs no approval; name it in your report. When the product has no story for the behaviour, add the story in the same way with `flint orbtest story add`. Never reorder or rewrite a criterion that a case or a task already proves.
- Write `orbtest/behaviour/specs/<spec-id>.md` per [[dev-knw-ot-behaviour]], The Spec File: the front matter with `id`, `story`, `environment`, and `components`; free prose; one `###` heading per case.
- For each case, fill the authoring gate: `protects`, `regression`, `oracle`, `owner`, and `seam` when the test needs a seam. A missing answer means: do not write this case yet. Check the case against the junk patterns of [[dev-knw-ot-behaviour]], The Authoring Gate.
- `proves` holds the 0-based addresses of this spec's story only. One case per claim. One owner per contract: do not repeat a scenario that another case already proves at a stronger boundary.
- Keep the number of cases small. Each case costs time on every run. Write a case only when it finds a failure that no other case finds. Fill `components` with the paths that the cases test, so that a change selects only the relevant cases. See [[dev-knw-ot-behaviour]], Scope and Cost.
- Write `then` as prose for a case with test code, or as check objects for a case that the `checks` runner can prove with no test code.

| Check | Command | Exit |
|-------|---------|------|
| Load | `flint orbtest validate --root <product-root>` | 0 with no warning for this spec |
| The cases | `flint orbtest behaviour show <spec-id> --root <product-root>` | 0. No case is `invalid` or `ungated`. |

- Checkpoint: the human approves the words of each case. Commit the spec. Once approved, progress to the next stage.

> [!headless]
> - `phase spec`, `progress "stage 3/9 · case <k>/<n>"`. Write the spec as this stage says, with the four gate answers and `oracle` for each case. `behaviour show <spec-id>` must show no `invalid` and no `ungated` case.
> - When the dispatch did not approve the design and the words: set `phase blocked`, and ask one question per [[dev-init-ot#Headless]], Questions and Results, with the environment file, the place files, the fixture recipes, the Products row, and the spec as the body. A subagent returns with that question. A new criterion is not part of the question: run `story criterion add` before you write the spec, and name the criterion in the result. Commit the spec after the answer. Progress to the next stage.

## Stage 4: Write the Bound Test

- For each case with no check objects, write test code at its owner boundary, with the runner that fits the product: vitest, bash, or a `command` kind. Put it under `orbtest/behaviour/tests/`.
- Put the marker `orbtest: <spec-id>/<case-id>` in a comment next to the test. Give the test the name that [[dev-knw-ot-behaviour]], Binding, requires.
- Build state only in the case folder of the harness (`ORBTEST_CASE_DIR`, or the entry of `ORBTEST_CASES` for a vitest file). Use real files, real processes, and real git. A stub replaces only a part that the product does not own. Put evidence files in `ORBTEST_EVIDENCE_DIR`.
- Take each expected value from the words and the oracle, never from the code under test. Assert what the `then` lines say, and nothing weaker.
- Once every case has test code or check objects, progress to the next stage.

> [!headless]
> - `phase test`, `progress "stage 4/9 · case <k>/<n>"`. Write the test code as this stage says. Progress to the next stage.

## Stage 5: Bind

| Step | Command | Exit |
|------|---------|------|
| Scan | `flint orbtest behaviour bind --root <product-root> --scan` | 0. It prints each sidecar that it wrote. |
| Check | `flint orbtest behaviour bind --root <product-root> --check` | 0 required: each sidecar is current, each marker names a case, and no case has two markers. |

- Commit the sidecars that the scan printed, with the test files. Progress to the next stage.

> [!headless]
> - `phase bind`. Run `flint orbtest behaviour bind --root <product-root> --scan`, then `flint orbtest behaviour bind --root <product-root> --check`. Exit 0 is required. Commit the sidecars with the tests. Progress to the next stage.

## Stage 6: See It Fail First

A case that never failed proves nothing. Make each case fail for the intended reason before you trust its pass.

| Case | How to make it fail |
|------|---------------------|
| A new behaviour | Run it before the product change exists. |
| A present behaviour | Plant a fault in the owner code that breaks exactly the claim, for example a cached value in place of a fresh read. Plant it in a checkout that no other session uses, or in a scratch copy of the product. Never commit it. |
| A regression | Run it on the commit before the fix. |

- Run `flint orbtest behaviour run --root <product-root> --case <case-id...>`. Expect exit 1, the case `fail` (not `error`), and a failure message that names the claim. Give the human the `report <path>` line.
- `error` is a setup failure, not a proof: go back to Stage 2. A case that passes against the fault proves nothing: go back to Stage 4 and make the test assert the claim.
- Remove the planted fault with the reverse edit, and check with `git -C <product-root> status --porcelain` that no product file stays changed.
- Record for each case the run id, the report path, and the failing line. Once each case failed for the intended reason, progress to the next stage.

> [!headless]
> - `phase fail-first`, `progress "stage 6/9 · case <k>/<n>"`. Make each case fail as this stage says. Plant a fault only in a checkout that no other session uses, or in a scratch copy. Never commit it, and check afterwards that no product file stays changed. Each case must end `fail` for the intended reason. `flint orbh update "<case>: failed first at <run-id>" --kind finding` per case. Progress to the next stage.

## Stage 7: Run

| Step | Command | Exit |
|------|---------|------|
| This machine | `flint orbtest behaviour run --root <product-root> --spec <spec-id>` | 0 required: each case `pass`. |
| Each other place of the design | `flint orbtest behaviour run --root <product-root> --spec <spec-id> --place <place-id>` | 0 required. The same specs run there, and the evidence comes back to `.local/runs/`. |

- On exit 1: read the case folder of the run (`stdout.txt`, `stderr.txt`, the runner report, `evidence/`). A test that does not match the words goes back to Stage 4. A product that does not do what the words say is a product bug: the case stays failing, and you report the bug to the human. Never weaken an assertion to make a case pass.
- On exit 3: the place check or the `stage` hook failed. Go back to Stage 2.
- Read the time of each case in the run output. A case that is much slower than the other cases of the spec needs a reason: make it faster (a snapshot fixture, the build in the `stage` hook, no fixed sleep), or give it a `budget` and tell the human. See [[dev-knw-ot-behaviour]], Scope and Cost.
- Give the human the `report <path>` line of each run. Once every run exits 0, progress to the next stage.

> [!headless]
> - `phase run`. Run the spec on this machine and on each other place of the design. On exit 1 with a test that does not match the words, go back to Stage 4. On a product bug, keep the case failing, `flint orbh update "<case>: product bug: <evidence>" --kind finding`, and continue with the other cases. On exit 3, set `phase blocked` with the place or the `stage` hook, and return. Read the time of each case as this stage says; report a slow case with `flint orbh update "<case>: slow: <ms> ms" --kind finding`. Progress to the next stage.

## Stage 8: Confirm

| Step | Command | Exit |
|------|---------|------|
| Clean tree | `git -C <product-root> status --porcelain` | Empty required. Commit the spec, the tests, the harness, the fixtures, and the sidecars first. |
| Confirm | `flint orbtest behaviour run --root <product-root> --spec <spec-id> --confirm` | 0: each passed deterministic case is anchored. 1: give the human the `report <path>` line and stop. 2 dirty tree: commit first, then run again. |
| Anchors | Commit the sidecars that the confirm changed. | |
| Drift | `flint orbtest behaviour drift --root <product-root> --check` | 0 required for the cases of this story. |
| Coverage | `flint orbtest coverage --root <product-root> --story <story-id>` | 0. Each criterion of the plan is `proven`. |

- A `live-agent` case is never anchored. Report its pass rate from the run. Once the criteria are `proven`, progress to the next stage.

> [!headless]
> - `phase confirm`. Commit everything, run `behaviour run --spec <spec-id> --confirm`, commit the changed sidecars, then run `behaviour drift --check` and `coverage --story <story-id>`. A dirty tree is a blocker: set `phase blocked`, `blockers "dirty tree under <product-root>"`, and return. Progress to the next stage.

## Stage 9: Record

- Find the `(Test)` under `Mesh/Types/Tests/` with `layer: behaviour`, this `test-id` (the spec id), and this `product-root`. When none exists, mint the number with `flint helper type newnumber Test`, check that no file has it, and write the artifact per [[dev-tmp-ot-test-v0.3]] from `flint orbtest behaviour show <spec-id> --root <product-root> --json` and the sidecar anchors. Else update its case table, `covers`, `status`, and the confirmed fields.
- Add Task Log lines: the fail-first run of each case, the confirm run, and the report paths.
- Run [[dev-sk-ot-record_story]] for the story.

> [!headless]
> - `phase record`. Write or update the `(Test)` as this stage says, and run [[dev-sk-ot-record_story]]. Set `artifacts`.
> - `phase complete` when each criterion of the plan is `proven`, else `phase blocked` with the cases that are not. End with `flint orbh session return --finish "<result>"`: the product root, the spec id, each case with its state, the fail-first run and the confirm run, the criterion states, the commit SHAs, the report paths, the artifacts, and each product bug with its evidence.

# Output

- The spec, the test code, the harness, the fixtures, the places, and the sidecars under `<product-root>/orbtest/`, committed
- Each case of the spec `proven`, and each criterion of the plan `proven` in `coverage`
- One `(Test)` with `layer: behaviour`, and the `(Story)` up to date
- The report paths of the fail-first runs and of the confirm run

> [!headless]
> - The output above, in the returned result
