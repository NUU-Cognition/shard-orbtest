# 0.11.1

- One workflow for each mode (NUU Orbh Task 748). Each headless workflow is merged into its workflow as `> [!headless]` callouts at the end of each stage: `init`, `stories`, `tasks`, `gaps`, `repair`, `suites`, `behaviour`, and `heal`. The headless init is the section `# Headless` of the init: the behaviour exception headless, the version handshake headless, what changes, the worker lock headless, the Orbh interface keys, the phase values, and the questions and results. The stages, the commands, and the checkpoints of each mode do not change.
- A headless session loads the shard with `flint shard start ot`. The mode comes from the Orbh session.
- The migration `mig-ot-0.11.0-to-0.11.1` changes no Mesh file. It keeps the migration chain complete.

---

# 0.11.0

This version needs an orbtest CLI with the behaviour layer: the `behaviour` commands, `coverage`, `init --layer behaviour`, `skills --section behaviour`, and `runs prune --kind behaviour`. An older `flint` binary refuses these commands with `unknown command`.

- The shard names two layers: **UI tests** under `orbtest/ui/` and **behaviour tests** under `orbtest/behaviour/`. The init has the section "Two Layers: UI Tests and Behaviour Tests": what each layer tests, where its files live, who writes them, how it runs, and what proves a criterion.
- The Boundary has the behaviour exception: the agent writes the specs, the test code, the harness, the fixtures, the kinds, and the place files. The CLI writes the sidecars, the anchors, and the runs. The init lists the safety rules of the behaviour layer.
- The Layout has `places/`, `behaviour/`, and `.local/places/`. The Terms table has UI test, behaviour test, spec, case, kind, binding, sidecar, anchor, place, behaviour fixture, harness, healer, and criterion address (0-based). The run-id term has `behaviour-<time>-<hex>`.
- The init has the section Behaviour States: the case states in display order, the criterion states in decision order, and what cannot prove. The Commands section has the commands of the behaviour layer, `coverage`, `init --layer behaviour`, and `skills --section behaviour`.
- New knowledge `knw-ot-behaviour`: the spec format, the binding, the runners, the kinds, the environments, the places and the place protocol, the hooks, the slot protocol, the fixtures, the runs and results, the states, drift, coverage, the healer, the authoring gate, the scope and cost rules, and a complete example of a CLI app.
- Tests cost time and compute. The init, the headless init, and the new section Scope and Cost of `knw-ot-behaviour` say: write a test only when it finds a failure that no other test finds; while you work, run only the tests that a change touches (`--spec`, `--case`, `--story`, `--kind`, `--task`); run everything only before a merge, a confirm, or a release; watch the time of each run, and report a slow test as a finding. The `behaviour` workflows check the number of cases in Stage 3 and the time of each case in Stage 7.
- The examples are generic: a web app, a CLI app, a desktop app, and another machine (`build-box`). No example names a product, a machine, or a path of one organisation, so the shard reads for any product.
- New workflows: `behaviour` and `hwkfl-ot-behaviour`, `heal` and `hwkfl-ot-heal`, and `audit` (the openclaw test audit, adapted; interactive only).
- The `(Test)` template is `tmp-ot-test-v0.3`: `layer`, and for a behaviour spec `spec`, `environment`, and the case table. The `(Story)` template is `tmp-ot-story-v0.2`: the criterion states from `coverage`, and the criteria that each layer proves. `record_story` copies both layers.
- The `tasks` workflow sets `proves` on each UI task. The `stories` and `gaps` workflows choose a layer for each criterion. `record_run` and `record_release` skip `behaviour-*` runs.
- The type files of Test and Story describe both layers. The migration `mig-ot-0.10.0-to-0.11.0` rewrites the two installed type files, gives each `(Test)` `layer: ui` and the template `tmp-ot-test-v0.3`, and rewrites each `(Story)` with `record_story`. Run it with `flint shard migrate run ot`, follow its steps, and run `flint shard migrate finish ot`.

---

# 0.10.0

This version needs an orbtest CLI with the layout of Plan 005: `ui/`, `environments/`, and the `environment` command (Task 051, `../Repos/flint` at `fcff1aef`). An older `flint` binary reads only the first layout of format 0.0.1: on a folder in the current layout its `check` exits 2, and it has no `environment` command.

- Every path names the current layout: `ui/profiles`, `ui/steps`, `ui/tasks`, `ui/briefs`, `ui/fixtures`, `ui/suites`, `ui/baselines`, `environments`, and the unchanged `requirements`, `stories`, `product`, and `.local`. The init has a Layout section.
- The Terms table defines `environment` beside `profile`. A profile is the UI profile, the driver half, and it names one environment. The Boundary section and the product folder rules name the new places: a product script reads `ui/fixtures/<name>`.
- The Changing Definitions table has the `environment` kind and its verbs, and says which half each `set` changes. Only the `init` workflow runs an `environment` write verb, as for `profile`.
- The `init` workflow writes both halves: `environment set` for the environment, `profile set` for the UI profile. It takes the field shapes from `skills --section profiles`, which has one table per half. The scaffold table shows both halves.
- The Version Handshake says that a folder in the first layout of format 0.0.1 gives `check` exit 2 with a move list, that a human moves it by hand, and that `upgrade` has no step for it. The headless init says the same.
- The suite rule names `git -C <product-root> log -1 --format=%cI -- orbtest/ui/baselines/<suite-id>`, and says that the move commit counts as a baseline commit. After the move, a suite is `new` until a new snapshot run passes.
- `knw-ot-platforms` has a section on the two halves and a Half column in each pattern table. `knw-ot-records` names the new baseline path and the fields that `run.json` copies from the UI profile.
- The migration `mig-ot-0.9.2-to-0.10.0` changes no Mesh file. No installed Mesh file names a changed path: the five `(Type)` files and the `(Dashboard) Tests` payload do not change. The migration exists because the installer needs a complete migration chain when the `migrations/` folder holds a file. Run it with `flint shard migrate run ot`, check that nothing changed, and run `flint shard migrate finish ot`. The 0.9.1 → 0.9.2 migration stays.

---

# 0.9.2

This version needs an orbtest CLI with `init --platform`, the worker lock (`ORBTEST_WORKER_BUSY`), and usage errors at exit 2. With an older `flint` binary, `flint orbtest` refuses some commands of this shard with `unknown option`.

- Every skill, workflow, and the headless init load the shard with `flint shard start ot` or `flint shard hstart ot`. A Flint with no dev copy can load them.
- The Products table moved from the shard to the Flint Init of each Flint. The init says where the table is, what a row holds, and how to add a row. The `init` workflow writes the row in Stage 6.
- The `init` workflow scaffolds with `init --platform web|terminal|desktop`, has a terminal path, and takes profile shapes from `skills --section profiles` and from `profile show` on a product of the Products table.
- Rules that were written for NUU Onyx are general rules. NUU Onyx stays as the example.
- Author runs are `.local/runs/author-<time>/`. The init has one table that says which printed line gives the path of each run.
- Plain `doctor` reports `setup verify` as skipped on a profile with `setup.start`; the `tasks` workflow runs `doctor --start` for the services.
- `author --components` takes inline JSON or a file path. A relative `page --out` resolves against the current directory.
- The exit code tables have the usage errors (exit 2), `ORBTEST_INTERNAL` (exit 2), `ORBTEST_SYSTEM` (exit 3), and `ORBTEST_WORKER_BUSY` (exit 3). The init describes the worker lock.
- The init has the id rule, the `files` path rule, and the requirement text rule of the CLI.
- One suite status rule, in `knw-ot-records`, with the `git log` command that prints the baseline commit time.
- The suite template writes a `css` mask as `css <selector>`. `knw-ot-records` says `viewport` and `threshold` come from the sidecar JSON only.
- `record_run` and `record_release` skip `author-*`, `doctor-*`, and `page` directories. `record_release` writes an empty `branch` on a detached `HEAD`.
- The Test lifecycle has `registered → stale`. The repair workflow treats `component_touched` as report only.
- The headless init and the headless repair workflow agree on the retire question. The headless `init` workflow runs `check`. The headless `tasks` workflow has blocker paths for exit 2 and 3. The headless `suites` workflow sends `--kind blocker` when it is blocked.
- The dashboard payload has a product column. An installed `(Dashboard) Tests.md` keeps its old payload, because its install mode is `once`.
- The Story template example is the NUU Onyx story `cli.sync`.
- The five type files have a Properties table, a Lifecycle section, and a Templates section. The migration `mig-ot-0.9.1-to-0.9.2` rewrites the installed type files and keeps their ids.

---

# 0.9.1

- The version handshake runs `flint orbtest check` first, and `flint orbtest upgrade` on exit 1.
- Every run path names the `orbtest/.local/` layout: runs, secrets, and machine-local service files.
- The init tells the agent that product plumbing lives under `orbtest/product/`.

---

# 0.9.0

- The shard is rebuilt from scratch on 2026-09-24 with the Knap create workflow, against the orbtest CLI of that day (Plan 004, stream 7). It replaces shard 0.8.0.
- Six workflows, each with a headless twin, and six atomic skills.
- Three knowledge files, records, authoring, and platforms, replace the six knowledge files of 0.8.0. `flint orbtest skills` gives the field shapes.
- Five artifact types: `(Test)`, `(Run)`, `(Story)`, `(Suite)`, and `(Release)`. The templates keep the stems and the fields of 0.8.0.
- The `(Dashboard) Tests` payload gains a Suites section and a Releases section.
- Every example comes from NUU Onyx.
- The script `flint shard ot lint` checks every `flint orbtest` command of the shard against the CLI.

---

# 0.1.0

- Initial shard scaffold
