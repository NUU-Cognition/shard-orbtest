# Orbtest

Operate the `flint orbtest` CLI on the products of a Flint, for UI tests and behaviour tests, and record their tests, runs, stories, suites, and releases in the Mesh. Shard version 0.11.0.

## Purpose

Orbtest has two layers of tests, and the shard names them clearly.

- **UI tests** (`orbtest/ui/`): the CLI runs journey tests and screen captures against the real product, in a browser, a terminal, or a desktop window. An agent explores a journey once. `flint orbtest author` freezes the trace into deterministic steps. `flint orbtest register --approve` writes them. Every later run replays the steps with no agent.
- **Behaviour tests** (`orbtest/behaviour/`): a Markdown spec says in words what each case proves, and test code in any language binds to each case. The agent designs the test architecture, the environments, the places, and the fixtures of each product. An environment can run on this machine, in a container, or on another machine. The healer repairs broken parts over time, and it never weakens an assertion.

Both layers share the stories, the environments, and one report standard. `flint orbtest coverage` shows the state of each criterion from both layers. The shard tells the agent which command to run at which stage, where the human decides, and what to write in the Mesh: `(Test)`, `(Run)`, `(Story)`, `(Suite)`, and `(Release)`.

The agent never creates, edits, or deletes a file of the UI layer or of the shared folders under `orbtest/` by hand. The behaviour layer is the one exception: the agent writes specs, tests, harness code, fixtures, kinds, and place files, and the CLI writes the sidecars and the runs. The exceptions are listed once, in `dev-init-ot.md`, Boundary. The shard holds no list of products: each Flint keeps a Products table in its Flint Init, and the `init` workflow adds a row. The examples are generic, a web app, a CLI app, a desktop app, and another machine, and show the shape of a value only. The shard describes the layout of format 0.0.1 in which the folders that only UI tests use are under `orbtest/ui/`, and each profile has an environment half in `orbtest/environments/`.

## Workflows

| Layer | Phase | Workflow | When |
|-------|-------|----------|------|
| UI | Adopt | `init` | The product has no `orbtest/`, or a new machine must run one. |
| Both | Plan | `stories` | Nothing says what the product must test. |
| UI | Author | `tasks` | One request becomes one confirmed UI test. |
| Behaviour | Author | `behaviour` | One behaviour needs proof: design, spec, bound test, fail first, bind, run, confirm, record. |
| Both | Reconcile | `gaps` | Find what no story describes, what no test proves, what no longer exists. |
| UI | Repair | `repair` | `drift` marked steps stale. |
| Behaviour | Heal | `heal` | Behaviour cases fail, error, or went stale. |
| Behaviour | Audit | `audit` | Unbound or low-value tests: keep what guards a contract, remove the rest with evidence. |
| UI | Snapshot | `suites` | Screens must keep looking the same. |

Each workflow except `audit` serves both modes: its `> [!headless]` callouts give the headless checkpoints, with the same commands. Six atomic skills sit between the workflows: `record_run`, `record_story`, `record_suite`, `record_release`, `add_negative_control`, and `add_check`.

## Files

Every file of the shard. The installer copies the source files without the `dev-` prefix into `Shards/Orbtest/`. It does not copy `README.md`, `RELEASE.md`, or `install/`, and it copies a migration file only when an installed shard needs it.

```
Shards/(Source Local) Orbtest/
  shard.yaml                              # Version 0.11.1; types Test, Run, Story, Suite, Release; the dashboard; the folders
  README.md                               # This file
  RELEASE.md                              # Release notes per version
  dev-init-ot.md                          # Two layers, operating model, boundary with the behaviour exception, safety, version handshake, Products table rule, layout, terms, lifecycles, behaviour states, commands of both layers, worker lock; the section # Headless: the behaviour exception headless, what changes, the worker lock headless, reporting keys, phase values, questions and results
  skills/
    dev-sk-ot-record_run.md               # Write a (Run) from run.json and link its (Test) artifacts
    dev-sk-ot-record_story.md             # Rewrite a (Story) and the criterion states of both layers
    dev-sk-ot-record_suite.md             # Rewrite a (Suite) from the suite, the sidecars, and a snapshot run
    dev-sk-ot-record_release.md           # Record that one commit passed every gate, or refuse
    dev-sk-ot-add_negative_control.md     # task negative add, confirm, record
    dev-sk-ot-add_check.md                # task check add, re-confirm, update the (Test)
  workflows/
    dev-wkfl-ot-init.md                   # Adopt a product or a machine: write the environment and the UI profile, and add the Products row
    dev-wkfl-ot-stories.md                # Plan the stories and author their journeys
    dev-wkfl-ot-tasks.md                  # Author one journey test
    dev-wkfl-ot-gaps.md                   # Reconcile a product with its stories and tests
    dev-wkfl-ot-repair.md                 # Repair drift
    dev-wkfl-ot-suites.md                 # Plan and prove a snapshot suite
    dev-wkfl-ot-behaviour.md              # Prove one behaviour: design, spec, bound test, bind, fail first, run, confirm, record
    dev-wkfl-ot-heal.md                   # Run the healer, review each verdict and repair, confirm, record
    dev-wkfl-ot-audit.md                  # The openclaw test audit, adapted to behaviour tests (interactive only)
  templates/
    dev-tmp-ot-test-v0.3.md               # (Test) of either layer: layer, spec, environment, the case table
    dev-tmp-ot-run-v0.1.md                # (Run)
    dev-tmp-ot-story-v0.2.md              # (Story) with the criterion states of both layers
    dev-tmp-ot-suite-v0.1.md              # (Suite)
    dev-tmp-ot-release-v0.1.md            # (Release)
  knowledge/
    dev-knw-ot-records.md                 # Run directory kinds, run.json, snapshot run.json, sidecars, the suite status rule and the move commit, drift signals, pruning, the gate
    dev-knw-ot-authoring.md               # Briefs, components maps, bundles, secrets, review of frozen steps
    dev-knw-ot-platforms.md               # The two halves of a profile; where a profile shape comes from; product patterns per platform family: web, terminal, desktop
    dev-knw-ot-behaviour.md               # Behaviour tests: spec, binding, runners, kinds, environments, places, hooks, slots, fixtures, runs, states, drift, coverage, healer, authoring gate, the Flint example
  migrations/
    dev-mig-ot-0.9.1-to-0.9.2.md          # Rewrite the five installed (Type) files and keep their ids
    dev-mig-ot-0.9.2-to-0.10.0.md         # No Mesh file changes; keeps the migration chain complete for the installer
    dev-mig-ot-0.10.0-to-0.11.0.md        # Rewrite the Test and Story type files; layer and template v0.3 on each (Test); record_story on each (Story)
    dev-mig-ot-0.11.0-to-0.11.1.md        # No Mesh file changes; keeps the migration chain complete for the installer
  install/
    type-ot-test.md                       # → Mesh/Metadata/Types/(Type) Test (Orbtest Shard).md
    type-ot-run.md                        # → (Type) Run (Orbtest Shard).md
    type-ot-story.md                      # → (Type) Story (Orbtest Shard).md
    type-ot-suite.md                      # → (Type) Suite (Orbtest Shard).md
    type-ot-release.md                    # → (Type) Release (Orbtest Shard).md
    inst-ot-dashboard_tests.md            # → Mesh/(Dashboard) Tests.md, mode once
  scripts/
    dev-lint.js                           # flint shard ot lint: every `flint orbtest` command in the shard exists in the CLI
```

## Lint

`flint shard ot lint` reads every markdown file of the shard, extracts every `flint orbtest` invocation, and checks the command path and its `--flags` against `skills --section commands --json`.

It reads the command tree from a standalone launcher of the orbtest CLI when that file exists (default `../Repos/flint/apps/orbtest-cli/bin/orbtest.js`, a checkout of the Flint repository beside this Flint), else from `flint orbtest`. `ORBTEST_CLI` overrides both with a whole command line. The launcher comes first because `ndv build orbtest` rebuilds it from the flint working tree, while the `flint` binary carries an older bundled copy and a session must never rebuild that binary.

Exit 0 when every command exists. Exit 1 with one line per unknown command or flag. Exit 2 when no CLI answered. `--verbose` prints which CLI it read and the invocation count. Run it before every shard release, and after every CLI update.

## Design decisions

Decisions made by the headless sessions that wrote 0.9.0 and 0.9.1 on 2026-09-24, 0.9.2 and 0.10.0 on 2026-09-25, and 0.11.0 on 2026-09-27 (Task 1057 of the NUU Flint, work package WP10), and 0.11.1 on 2026-10-18 (Task 748 of the NUU Orbh), where the Knap workflows expected a human. A row marked with a version adds a decision of that version, or replaces the row it names.

| Decision | Reason |
|----------|--------|
| The templates keep the stems `tmp-ot-test-v0.2`, `tmp-ot-run-v0.1`, `tmp-ot-story-v0.1`, `tmp-ot-suite-v0.1`, and `tmp-ot-release-v0.1`, with the same frontmatter fields as 0.8.0. | Existing artifacts in this Flint and in NUU Mesh pin these stems. Same fields, same tags, so the dashboard and the artifacts keep working. |
| Three knowledge files: records, authoring, platforms. The six files of 0.8.0 are folded into them. | `flint orbtest skills` generates the field shapes. The shard keeps only what it does not generate. One file per platform family was too thin. |
| 0.9.1: the version handshake uses `check` first, and `upgrade` on exit 1. | (Task) 038 and (Task) 039 shipped both commands. `settings show` now prints `orbtest.format`, so the shard no longer reads `orbtest.toml` by hand. |
| 0.9.1: the lint reads the standalone launcher before the `flint` binary. | The binary lags the flint working tree, and no session may rebuild it. The launcher is the source of truth the tasks name. |
| 0.9.1: every run path is `orbtest/.local/runs/`, secrets are `orbtest/.local/secrets`, service files are under `orbtest/.local/services/`. | (Plan) 003 phases 4 and 5 moved them. One gitignore entry, `.local/`, covers all three. |
| 0.9.1: product plumbing lives under `orbtest/product/`, and `init` does not create it. | `upgrade` never moves a product file, so the first hand move creates the folder. |
| Every example is NUU Onyx. No fixture product, and no earlier fixture app. | The operator decided on 2026-09-24 that NUU Onyx is the only product and that the framework fixture is removed too. |
| The desktop section of the platforms knowledge has no product example. | No product with a desktop profile exists. The rules come from the desktop driver. |
| `add_negative_control` and `add_check` run `run --confirm` themselves. | A skill has no checkpoint, and a task whose verification changed must be anchored again before it counts. |
| The `(Dashboard) Tests` payload gains a Suites section and a Releases section. | The shard installs both types. The Mesh copy installs once, so an existing dashboard is not changed. |
| The `gaps` workflow retires with `task remove --with-orphan-steps` and `story remove --unbind`. | Both commands exist. The 0.8.0 text called the retire a follow-up. |
| The headless twins restate each stage in short form and name the interactive stage for the commands. | Same command set per pair, one place to change, and the validator sees stages, keys, and outputs in every twin. |
| The 0.8.0 claim that `story criterion add` needs `--` before a text that starts with `-` is not repeated. | It cannot be verified with a read-only command. |
| Unverified 0.8.0 claim resolved: `author --components` takes inline JSON. | The help says `--components <json>`. The workflow passes the components map file inline with `$(cat ...)`. |
| 0.9.2: every skill, workflow, and the init load the shard with `start ot`, never the dev variants. The 0.11.1 row removes the headless start. | An installed shard is loaded in a Flint that has no dev copy. The Knap rule for dev context lines does not apply to this shard. |
| 0.9.2: the Products table lives in the Flint Init, and only the `init` workflow adds a row. | The shard serves every Flint and every product. A Flint owns its own list. |
| 0.9.2: `author --components` takes inline JSON or a file path. This replaces the 0.9.0 row above. | `loadComponentResolver` in `apps/orbtest-cli/src/support/components.ts` reads a file when the text does not start with `{`. The workflow passes the map file by path. |
| 0.9.2: the migration holds the five type bodies itself. | The installed copy of a dev shard has no `install/` folder, so the migration cannot read the source there. |
| 0.9.2: the migration rewrites the type files only, not the dashboard. | Report 003 and Task 049 ask for a migration that installs the fixed type files. The dashboard fix reaches new Flints through the payload. |
| 0.9.2: a stale mark whose task meets again is cleared by hand (the Disproved class of the repair workflow). `component_touched` is report only. | `drift` writes no mark for `component_touched`. The 0.9.0 Untouched class cleared a mark that did not exist. |
| 0.10.0: the shard names the layout of Plan 005: `ui/` for the folders that only UI tests use, and `environments/` for the environment half of each profile. The init has one Layout section. | (Task) 051 changed the CLI in place, with the format kept at `0.0.1`. |
| 0.10.0: the word "profile" means the UI profile, the driver half, as `--profile` does. The environment is its own term and its own kind. | `--profile`, the task field `profile`, and the suite field `profiles` keep their meaning in the CLI. |
| 0.10.0: the rule that only the `init` workflow writes a profile covers the `environment` write verbs too. | An environment serves every profile that names it, so a change to it is a change to those profiles. |
| 0.10.0: the first layout of format 0.0.1 is a hand move by a human, and the shard stops on the `check` move list. It never runs `upgrade` for it. | `upgrade` has no step for the move. The operator authorized the manual move of NUU Onyx (Task 052). |
| 0.10.0: the migration `mig-ot-0.9.2-to-0.10.0` changes no Mesh file. The 0.9.1 → 0.9.2 migration stays. | No installed Mesh file names a changed path: the five type files and the dashboard payload do not change. The installer needs a complete migration chain when `migrations/` holds a file, so a step with no change is needed. Decision of the dispatcher session `7b4c36f1` on 2026-09-25. |
| 0.10.0: the shard text names no path of the first layout, also where it describes the `check` move list. | Then `grep` of the old folder names finds nothing, and no agent copies an old path. |
| 0.11.0: the shard names two layers, UI tests (`orbtest/ui/`) and behaviour tests (`orbtest/behaviour/`), in one table of the init, and every text names the layer of a test. | The operator asked for two clearly named layers (Task 1057, rule 6). |
| 0.11.0: the Boundary keeps "no hand edit under `orbtest/`" for the UI layer and the shared folders, and adds one exception: the agent writes the specs, tests, harness, fixtures, kinds, and place files of the behaviour layer. The CLI writes the sidecars, the anchors, and the runs. An environment file stays a CLI write. | The agent designs the tests of each application, and that code has no CLI writer. `environment add|set` validates the behaviour fields, so the environment keeps its writer. |
| 0.11.0: the template of `(Test)` is `tmp-ot-test-v0.3`, and of `(Story)` is `tmp-ot-story-v0.2`. The old stems are gone, and the migration moves the artifacts. This replaces the 0.9.0 row that kept the stems. | The fields change: `layer`, `spec`, `environment`, the case table, and the criterion states. A new field set needs a new template version. |
| 0.11.0: one `(Test)` per behaviour spec, not per case. Its status comes from the case states: `confirmed` when every proving case is `proven`, `stale` when a case is `stale` or `suspect`. | A spec is the unit that a person reviews. The case table keeps the state of each case. |
| 0.11.0: a behaviour run has no `(Run)`. The behaviour `(Test)` names the run id and the report path in its Task Log. `record_run` refuses a `behaviour-*` run. | The `(Run)` template copies the fields of a task run. A behaviour `(Run)` can come later when a Flint needs it. |
| 0.11.0: the `(Story)` copies the criterion states from `flint orbtest coverage --json`, and it checks a criterion when its state is `proven`. The dashboard keeps its Mesh rule (a confirmed `(Test)` lists the number). | The CLI decides proof for both layers (C15.6 of Task 1057). The shard copies and computes nothing. The dashboard installs once and reads the Mesh only. |
| 0.11.0: the `tasks` workflow sets `proves` on each UI task, and `covers` of the UI `(Test)` is `proves` plus one. | Story membership alone proves no criterion in the CLI (C15.6). |
| 0.11.0: Mesh criterion numbers stay 1-based. The CLI addresses are 0-based. Every text that names both says how to translate. | C15.11 of Task 1057. |
| 0.11.0: the `behaviour` workflow binds before the fail-first run: design, spec, bound test, bind, fail first, run, confirm, record. | `behaviour run` plans a case from its binding (`PlannedCase.binding` in `contract.ts`), so a case must be bound before any run. |
| 0.11.0: the `audit` workflow has no headless twin. Headless, its read-only stages run and return the ledger. | A human approves each deletion batch. |
| 0.11.0: headless, the healer may apply a `test_wrong` patch alone; a headless session never confirms a `repaired` case. | The healer rules allow the apply, and a `repaired` case proves nothing until a human accepts the diff. |
| 0.11.0: the `behaviour` workflow may add a Products row (Stage 2), as the `init` workflow does. | A product can start with behaviour tests only, and the `init` workflow asks for a UI platform. |
| 0.11.0: the examples are generic: a web app (`../Repos/app/apps/my-app`), a CLI app with the home variable `APP_HOME` (spec `app.home.example`, environments `app-scratch` and `app-remote`), a desktop app, and another machine (`build-box`, `ci@build-box`). The safety rules name the real state of any product, and the Flint paths that the guard protects only as a note. This replaces the row "Every example is NUU Onyx". | The operator asked on 2026-09-27 for a shard that reads for any product, not only for the products of NUU. |
| 0.11.1: one workflow for each mode. The headless twins and the headless init are merged into `> [!headless]` callouts at the end of each stage and the section `# Headless` of the init. Each workflow and skill loads the shard with `start ot` in both modes. This replaces the row on the headless twins, and the headless start of the 0.9.2 row. | NUU Orbh Task 748 removes the headless files. After a compaction, the agent reads only the stage that the hint line `read:` names, so each callout is complete for its stage. The mode comes from the Orbh session. |
