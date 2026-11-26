---
description: "Behaviour tests: the spec format, the binding, kinds, environments, places, hooks, the slot protocol, fixtures, results and states, scope and cost, drift, coverage, the healer rules, the authoring gate, and a complete example of a CLI app"
---

# Knowledge: Behaviour Tests

The behaviour layer of Orbtest, in depth. [[dev-init-ot]], Two Layers, gives the short form. The workflows [[dev-wkfl-ot-behaviour]], [[dev-wkfl-ot-heal]], and [[dev-wkfl-ot-audit]] tell you what to do. This file tells you what each part is.

**The agent designs the tests.** Orbtest does not prescribe a test architecture. For each application, the agent designs the test architecture, the environments, the places, the fixtures, and the harness code, so that the tests prove real behaviour of that application. Orbtest fixes five standards and gives slots for arbitrary code everywhere else. An environment can run on this machine, in a container, or on another machine, and the same specs run in each place.

**Loose about form. Strict about safety and evidence.** A stale case, a broken fixture, or a case block that does not parse is a state in the report, not a failure of the whole run. The loader loads past a bad part and records a `LoadIssue`. The healer repairs broken parts over time. Two things never bend: no test touches the real home, and only a real observed pass proves a criterion.

## The Five Standards

| Standard | What it fixes |
|----------|---------------|
| Ids | The story, the criterion address, the spec, the case, and the run id. An id does not change after a run confirms it. |
| The spec file | One Markdown file per behaviour of one story. Required: `id` and `story` in the front matter, and one `###` heading per case. |
| The report | One case result per case, from any runner, in one format. The harness writes the run record. A runner never writes it. |
| The states | One word for each case state and each criterion state. A report means the same thing in every application. |
| Safety | The scratch guard, no touch of the real state of the product, no real external service unless an environment names it, and no Mesh write by the CLI. |

Everything else is a slot: harness code, environments, places, hooks, fixtures, kinds, runners, and checks.

## Ids

| Id | Form | Example |
|----|------|---------|
| story | The story `id` | `app.home` |
| criterion address | `<story-id>#<n>`, **0-based**, as the CLI counts | `app.home#0` is the first entry of `acceptance` |
| criterion number | **1-based**, as the Mesh writes it | criterion 1 of `(Story)` `app.home` is `app.home#0` |
| spec | The spec `id` | `app.home.example` |
| case | `<spec-id>/<case-id>`. The `<case-id>` part is the text of the `###` heading, in kebab-case. | `app.home.example/create-refuses-a-home-with-no-profile` |
| run | `behaviour-<UTC time with milliseconds>-<8 hex>` | `behaviour-2026-09-27T09-12-30-123Z-3f9a1c2b` |

The Mesh keeps 1-based criterion numbers in `(Test)` `covers` and in `(Story)`. The CLI uses 0-based addresses in `proves`, in `coverage`, and in `story criterion set <id> <n>`. Always translate: Mesh number `n` is CLI address `<story-id>#<n-1>`.

## Layout

The behaviour layer adds two folders to the definitions root `<product-root>/orbtest/`. The format stays `0.0.1`; the change is additive.

```
orbtest/
  orbtest.toml  .gitignore  .local/
  environments/  requirements/  stories/  product/    shared by both layers
  places/                                              shared place files (optional)
  ui/                                                  UI tests, unchanged
  behaviour/
    specs/        one Markdown spec per behaviour (required when the layer is used)
    bindings/     one CLI-written sidecar per spec
    fixtures/     recipes (<id>.yaml) or scripts (<id>.mjs, <id>.sh) (optional)
    kinds/        one kind override per file (optional)
    harness/      arbitrary support code of the product (optional)
    tests/        arbitrary test code (optional)
    package.json  tsconfig.json  vitest.config.*  node_modules    allowed; never stray
  .local/places/  machine-local place files; a file here replaces a shared place with the same id
  .local/runs/    the run folders of both layers
```

- A folder with only `orbtest.toml`, `.gitignore`, and `behaviour/specs/` is well formed. `ui/profiles/` and `environments/` are required only when `ui/` exists.
- `flint orbtest init --root <product-root> --layer behaviour` scaffolds the smallest behaviour layer: the environment `local`, an example story, and the example spec `example.hello`, whose one case needs no test code. Replace the example with the first real spec.
- `.gitignore` holds `.local/` and `behaviour/node_modules/`.
- `check` and `validate` report the findings of the behaviour layer as warnings. `--strict` makes them exit 2.

## The Spec File

A spec is one Markdown file, `orbtest/behaviour/specs/<spec-id>.md`, for one behaviour of one story. It has three parts: the front matter, free prose, and one `###` heading per case. The words come first. A person reviews the words before any test code exists. The test code binds to the words.

### Front Matter

| Key | Required | Meaning |
|-----|----------|---------|
| `id` | Yes | The spec id. |
| `story` | Yes | The story whose criteria the cases prove. |
| `name` | No | A short name for people. |
| `environment` | No | The default environment of the cases. |
| `components` | No | Source paths, relative to the product root, that the spec protects. Drift reads them. |

### Cases

- Each `###` heading outside a code fence is one case. The heading text is the case id, in kebab-case.
- Under the heading, free prose explains the case for people. An optional fenced block with the info string `case` holds the fields that tools read.
- A case with no `case` block is `kind: unit` and `ungated`.
- A `case` block that does not parse makes only that case `invalid`. The other cases of the spec load and run.
- Two cases with one id make each duplicate `invalid`.
- `caseHash` is the sha256 of the case section: the heading line to the next `###` or the end of the file, trimmed. A change of any word of the section changes the hash.

### The `case` Block

Every field is optional.

| Field | Meaning |
|-------|---------|
| `kind` | The kind of the case. Default `unit`, or `[behaviour] kind` of `orbtest.toml`. |
| `proves` | Criterion addresses, 0-based, of the story of this spec only. A case with no `proves` is an orphan. |
| `fixtures` | Fixture ids. The harness builds them before the case. |
| `environment` | The environment of this case. It overrides the spec. |
| `protects` | Gate: the observable behaviour, invariant, or contract that the case protects. |
| `regression` | Gate: a credible regression that makes the case fail. |
| `oracle` | Gate: who or what decides that the expected result is correct. |
| `owner` | Gate: the owner boundary of the contract, and why no other test already catches the failure. |
| `seam` | A production seam (an export, a flag, an injection hook) that the test needs and no production caller needs. Absent when there is none. |
| `given`, `when` | Prose, or a list of prose lines. |
| `then` | Prose, or check objects of the check registry, or both in one list. |
| `budget` | `{ ms: <n> }`. A case over its budget ends `budget_exceeded`. |
| `repeats`, `pass_rate` | For `live-agent`: the number of runs, and the part of them that must pass (0 to 1). |
| `waive` | `{ reason, owner, until }`: a human decision to exclude the case. It ends at 00:00 UTC after the `until` date. |

### Example

The spec `app.home.example` of a CLI app, `app`, that keeps its state in a home folder. The variable `APP_HOME` names the home, and `app create` needs a profile (the name of the user) in the home. Two of its three cases:

````markdown
---
id: app.home.example
story: app.home
name: The home folder and the profile (the example)
environment: app-scratch
components:
  - src/home.ts
  - src/commands/create.ts
---

# The home folder and the profile

Each case runs the built CLI in a scratch world: its own home folder,
temporary folder, and Git config, with no network.

### create-refuses-a-home-with-no-profile

A bash check: the CLI runs `app create Probe --json` on an empty home.

```case
kind: check
proves: [app.home#1]
fixtures: [home-no-profile]
protects: The profile guard of app create.
regression: A create path that skips the guard, a guard that exits 1, or a guard that writes into the home first.
oracle: The refusal contract of the CLI (exit 2, one JSON value, a next command).
owner: app-cli
when: app create Probe --path <parent> --json
then:
  - the exit code is 2
  - the home and the parent folder are byte for byte the same as before
  - type: file
    path: "{{case_dir}}/home"
    expect: { kind: dir, empty: true }
```

### the-cli-writes-to-the-home-that-app-home-names

```case
kind: integration
proves: [app.home#0]
fixtures: [project-basic]
protects: Every write of app create to the state goes to the home that APP_HOME names.
regression: A command writes the registry of the first home, or of the real home, after APP_HOME changes.
oracle: The registry file registry.json of each home.
owner: app-cli
given: home A with the project Basic (fixture project-basic), and a second home B with a profile
when: app create Beta with APP_HOME=B
then:
  - the registry of B lists Beta and not Basic
  - the registry of A lists Basic and not Beta, and it is byte for byte the same as before
```
````

The first case binds to the bash script `tests/app/home.sh`, and its `then` also holds one check object, which runs after the bash runner. The second case binds to a vitest test. A case whose `then` holds only check objects needs no test file: the built-in `checks` runner runs it. The example spec `example.hello` of `init --layer behaviour` is such a case.

## The Authoring Gate

The gate comes from the openclaw test-audit skill. Answer the four questions before you write a test. A missing answer means: do not write the test yet.

| Question | Field |
|----------|-------|
| 1. What observable behaviour, invariant, or independent contract does the case protect? | `protects` |
| 2. What credible regression makes it fail? | `regression` |
| 3. Why does the present coverage not catch that failure? Each contract has one primary test at the strongest boundary. | `owner` |
| 4. Does the test need a production seam that no production caller needs? If yes, move the test to the real boundary. | `seam` |

Orbtest adds `oracle`: who or what decides that the expected value is correct. An expected value that the code under test makes is not an oracle.

A case with a missing `protects`, `regression`, `oracle`, or `owner` is `ungated`. It loads and runs, and it never proves a criterion.

Then check the test against each junk pattern. A match fails the gate, unless the retention bar ([[dev-wkfl-ot-audit]]) names the contract that the test guards alone.

- An assertion-free probe.
- A self-comparison, or an identity copy.
- A copied fixture, inventory, manifest, or export list.
- An exact source, import, or string grep.
- A private predicate or call-shape test that a real boundary test duplicates.
- Two invocations of the same contract.
- A test that exists only to keep a test-only export, global, or wrapper alive.
- An expected value that the helper or the renderer under test makes.
- A mock that implements the asserted behaviour, or one mock for different APIs.
- A fixture that supplies the receipt, the admission, or the callback order that the owner must make.
- A negative control that passes for an unrelated reason, such as a refusal from another guard.
- A name or a fixture that promises more than the input exercises.

More rules for the test code:

- **Test at the public boundary**: a command, an exported function, a file format, a protocol. A test that breaks under a refactor that keeps the behaviour asserts implementation.
- **Real state, not mocks.** Use real files, real processes, and real git in scratch folders. Fixtures build real state with the real tools. A stub replaces only a part that the product does not own, for example a package registry or a payment API.
- **Fail first.** A new case must fail before the behaviour exists, or against a planted fault, for the intended reason. A regression case must fail on the code before the fix. A test that never failed proves the mock, not the fix.
- **One owner per contract.** Do not repeat one scenario at each layer that it crosses.

## Binding

A binding links a case to its test code. Nobody writes a binding by hand.

- **The marker.** A bound test file has the line `orbtest: <spec-id>/<case-id>` in a comment of its language, next to the test. For example `// orbtest: app.home.example/the-cli-writes-to-the-home-that-app-home-names` in a vitest file, or `# orbtest: app.home.example/create-refuses-a-home-with-no-profile` in a bash file.
- **The test name.** The reported title path of the test, joined with `/`, ends with `<spec-id>/<case-id>`. For vitest: `describe('<spec-id>')` with `it('<case-id>')`, or one `it('<spec-id>/<case-id>')`.
- **The sidecar.** `flint orbtest behaviour bind --root <product-root> --scan` reads the markers and writes `orbtest/behaviour/bindings/<spec-id>.yaml`. Only the CLI writes a sidecar. Git commits it. `flint orbtest behaviour bind --root <product-root> --check` writes nothing and exits 1 when a sidecar is not current, a marker names no case, or a case has two markers. With no flag, `bind` reports the markers, the unbound cases, and the test files with no marker, and writes nothing.
- **The anchor.** `behaviour run --confirm` writes `confirmed` into the sidecar entry of a case: the commit, the run, the time, and the hashes of the case, the test, the spec front matter, and each proven criterion text. A scan keeps the anchors and never refreshes proof.

```yaml
# orbtest/behaviour/bindings/app.home.example.yaml
spec: app.home.example
cases:
  create-refuses-a-home-with-no-profile:
    runner: bash
    file: orbtest/behaviour/tests/app/home.sh          # relative to the product root
    line: 5
    case_hash: b7535a1c...
    test_hash: a52665b0...
  the-cli-writes-to-the-home-that-app-home-names:
    runner: vitest
    file: orbtest/behaviour/tests/app/home.test.ts
    line: 46
    case_hash: 9e74081f...
    test_hash: 7421e2d3...
    confirmed: { commit: <40 hex>, run: behaviour-2026-09-27T09-12-30-123Z-3f9a1c2b, at: 2026-09-27T09:13:02Z,
                 case_hash: 9e74081f..., test_hash: 7421e2d3..., spec_hash: 77e0..., criteria: { "app.home#0": 5d1e... } }
    quarantined: { at: ..., reason: ..., fail_rate: 0.3 }   # healer-written, optional
    repaired: { at: ..., heal: <run-id> }                   # healer-written, optional
```

Every file of the behaviour layer uses snake_case keys: `run.json`, the runner JSON, the sidecars, the heal records, and `exports.json`.

## Runners

A runner is any command that writes the report. That is the full contract of a runner.

| Runner | Covers | How it maps a result |
|--------|--------|----------------------|
| `vitest` | Every selected case of one file in one invocation | The title path of each test. A vitest harness helper reads `ORBTEST_CASES` and gives each test its own case folder. |
| `bash` | One case per invocation: `bash <file>` with `ORBTEST_CASE=<spec-id>/<case-id>` | Exit 0 is `pass`, any other exit is `fail`. A line `PASS <text>` or `FAIL <text>` on stdout is an `asserted` note. A `FAIL` line also prevents `pass`. |
| `command` | What the kind selects | The kind gives `command: { argv, cwd?, format }`. `format` is `junit` or `orbtest-case-results/1`. |
| `checks` | One case whose `then` holds only check objects | No test file and no binding. The checks run through the place `exec` with the isolated environment. |

- Runners report at the edge in JUnit XML or in the runner JSON `{ "schema": "orbtest-case-results/1", "results": [...] }`. The harness refuses an unknown or a duplicate case id.
- A selected case with no result is `error` with `no_result`. A spawn, transport, or parse failure is `runner_error`.
- The `then` checks of a case run after its bound runner.
- A process that changes environment variables serves one case at a time.
- A test file with no marker is `unaccounted` in the coverage report. Only bound tests run through Orbtest.

## Kinds

A kind is a set of defaults for a case, and nothing else. A kind never holds environment keys, and an environment never holds a runner command. Orbtest ships six kinds. A product adds a kind or overrides one with one file, `orbtest/behaviour/kinds/<id>.yaml`, key by key.

| Kind | Use | Notes |
|------|-----|-------|
| `unit` | A function or a module at its exported boundary | The default kind. |
| `integration` | Several modules with real files, a private case folder, and a private home | |
| `check` | The built CLI or a product script as a process | Often `bash`, or check objects with the `checks` runner. |
| `property` | Generated inputs | Record the seed. |
| `migration` | A fixture of the old state, then the migration | |
| `live-agent` | A real agent does a task | `repeats` and `pass_rate`. Never anchored by `--confirm`: it is not deterministic. Report pass@k (the agent can) and pass^k (the agent always does). A case over its budget fails, even with a correct answer. |

`flint orbtest skills --section behaviour` prints the current default runner, budget, and flags of each kind. Do not copy those values into the Mesh.

```yaml
# orbtest/behaviour/kinds/check.yaml
runner: bash
budget: { ms: 60000 }
```

## Environments

An environment is one file, `orbtest/environments/<id>.yaml`. Both layers share the folder. A behaviour environment needs only `id`. The UI fields (`os`, `app_version`, `base_url`, `setup`, `seeds`) stay optional for the behaviour layer, and the UI layer still validates them for the environment of a UI profile.

| Field | Meaning |
|-------|---------|
| `place` | The default place of the environment. `--place` overrides it. |
| `isolation.env` | Declared variables. Values can hold placeholders. |
| `isolation.unset` | Names or glob patterns (`ORBH_*`) to remove from the environment of the place. |
| `isolation.path_prepend` | Paths to put before `PATH`. A relative path resolves from the definitions root on the place. |
| `hooks` | `prepare`, `stage`, `case_open`, `case_close`, `teardown`. See Hooks. |
| `vars` | Named values for `{{<key>}}` placeholders. |
| `parallel.max` | The most workers. |
| `allow_dirty_remote` | `true` lets a dirty tree run on a place that is not `local`. |

```yaml
# orbtest/environments/app-scratch.yaml of the CLI app of the example
id: app-scratch
place: local
parallel: { max: 4 }
isolation:
  unset: ["APP_*", FORCE_COLOR, NODE_OPTIONS, GIT_DIR, GIT_WORK_TREE]
  env:
    APP_HOME: "{{case_dir}}/home"                     # the state of the app: never the real home
    TMPDIR: "{{case_dir}}/tmp"
    GIT_CONFIG_GLOBAL: "{{case_dir}}/gitconfig"
    APP_REGISTRY_URL: "http://127.0.0.1:9"            # a closed port: no real registry
    APP_TEST_PROTECTED: "{{local_product_root}}"
    NO_COLOR: "1"
  path_prepend: [behaviour/harness/git-shim]
hooks:
  stage: ["node", "behaviour/harness/stage.mjs", "--from", "{{local_product_root}}"]
  case_open: ["node", "behaviour/harness/case-open.mjs"]
  case_close: ["node", "behaviour/harness/case-close.mjs"]
vars:
  app_bin: "{{stage_dir}}/app/bin/app.js"
  app: "node {{stage_dir}}/app/bin/app.js"
```

**Resolution.** The environment of a case: CLI `--environment` > the case block > the spec > `[behaviour] environment` of `orbtest.toml` > the built-in `local` environment (no isolation, place `local`). A malformed environment is a `LoadIssue`; the cases that do not use it still run.

**The agent designs the environments of each application.** Ask what the product needs to run for real and in isolation: a private home, a stub for a service that the product does not own, a build copy of the product, a Git guard, ports per worker, a container with a clean OS. Put that contract into the environment as data, and put the code into `behaviour/harness/`. One harness module can give the same contract to vitest and to bash, so both build state in the same way.

**The order of variables.** The harness applies `unset` first, then the declared variables, then the reserved `ORBTEST_*` variables. It never changes the environment of the controller process.

**Safety.** Each variable that selects a state folder, a home, or a config folder of the product (for example `APP_HOME`) points under `{{case_dir}}`, never at the real folder. The guard of the harness checks such a variable itself only for the home variable of Flint; for every other variable, the environment design is the protection. Secrets come only from explicit `env://` references. The harness never sends the whole controller environment or the secrets file to a place. A behaviour run never talks to a real external service that the product does not own unless an environment says so explicitly: point its URL at a stub or at a closed port.

## Places

A place is where an environment runs. **A place is a transport**: it moves files and runs processes, and it does nothing else. Hooks of the application do the provisioning, the product selection, the dependency installs, the builds, and the services.

| Kind | Keys | How it works |
|------|------|--------------|
| `local` | `root` (default `$TMPDIR/orbtest`) | This machine. The built-in place. The scratch root is never inside the repository. |
| `ssh` | `host`, `root`, `product_root` (optional) | Runs every command through `ssh`. Copies with `rsync`, else `tar` over ssh. The ssh config and the agent give the auth; a place file never holds a key. |
| `docker` | `image`, `run_args` (optional), `root` | `docker run -d … sleep infinity`, then `docker exec` and `docker cp`. |
| `command` | `argv`, `root` | A program on the controller that implements the place protocol. |

```yaml
# orbtest/places/build-box.yaml, or orbtest/.local/places/build-box.yaml (machine-local; it wins)
kind: ssh
host: ci@build-box
root: ~/.orbtest/places/app
```

An environment for another place usually has its own hooks. In the example, `app-remote` has the place `build-box` and the same isolation as `app-scratch`. Its `prepare` hook (`behaviour/harness/prepare-remote.mjs`, on the controller) puts the committed tree and the build of this checkout. Its `stage` hook (`behaviour/harness/stage.mjs --supplied`, on `build-box`) extracts them, runs `pnpm install --frozen-lockfile` for the OS of `build-box`, and makes the stage. It sets `allow_dirty_remote: true`, because no uncommitted source reaches the place.

- **Place resolution**: CLI `--place` > the environment `place` > the built-in `local` place.
- **What goes to a place.** The harness always puts the definitions folder (`orbtest/` without `.local/` and `node_modules/`) at `<root>/<run-id>/defs`. The controller hook `prepare` declares what else to put, for example the product tree or a built bundle. The hook `stage` on the place makes `product_root` ready (for example: copy or fetch the commit, `pnpm install --frozen-lockfile`, build). The default `product_root` is `<root>/<run-id>/product`. An existing checkout on a place is a read source only.
- **The same specs run in each place.** Only the place changes, and the evidence comes back to the controller in `<defs-root>/.local/runs/<run-id>/`. A dirty tree runs on a place that is not `local` only when the environment sets `allow_dirty_remote: true`.
- **A run can move.** `run --resume <run-id>` continues a run. A copied run folder can resume on another controller or on another place after the harness verifies the inputs. The run id and the completed results stay. Hooks rebuild the state that cannot move. Live processes do not move.
- A container and an ssh run folder live for one run. `--keep-scratch` keeps them.
- `flint orbtest behaviour place list --root <product-root>`, `flint orbtest behaviour place show <id> --root <product-root>`, and `flint orbtest behaviour place check <id> --root <product-root>` (reachable, tools present) read the places.

### The Place Protocol

The `command` kind sends one JSON request on stdin and reads one JSON response on stdout. Logs go to stderr. The `local`, `ssh`, and `docker` kinds implement the same interface in TypeScript.

```text
request:  { "schema": "orbtest-place/1", "requestId": "<id>", "op": "<op>", "args": { ... } }
response: { "requestId": "<id>", "ok": true, "value": { ... } }
       or { "requestId": "<id>", "ok": false, "error": { "code": "<code>", "message": "<text>" } }

open  { runId, config }                                  → { handle, root, os, arch }
check { config }                                         → { ok, checks }        (optional)
exec  { handle, argv, cwd, env, timeoutMs, unset?, pathPrepend? } → { code, signal, stdout, stderr, timedOut }
put   { handle, local, remote }                          → {}
get   { handle, local, remote }                          → {}
close { handle }                                         → {}
```

- `local` paths are on the controller. `remote` paths are on the place. `put` and `get` copy files and folders and refuse links that leave the tree.
- A timeout ends the whole process group on the place. `close` is idempotent.
- Each place makes a private run root. A missing operation is a `setup_error`.
- The error codes are `unsupported_op`, `unreachable`, `refused`, `timeout`, and `failed`. A place can send other codes.

## Hooks

Hooks are arbitrary commands of the application. A string runs through `sh -c` on the place. A list is an argv and runs with no shell: give a substituted path as its own argv item. The working directory is the definitions root on the place.

| Order | Hook | Where | When |
|-------|------|-------|------|
| 1 | `prepare` | The controller | Once per run and place. It declares what to `put`: the product, the tests, the support code. Never `.local/` or a credential. |
| 2 | `stage` | The place | Once per environment and place. Install dependencies and build, or verify a supplied artifact. Never assume that copied `node_modules` work. |
| 3 | fixtures | The place | Per case, before `case_open`. |
| 4 | `case_open` | The place | Per case. |
| 5 | the runner, then the `then` checks | The place | Per invocation. |
| 6 | `case_close` | The place | Per case. |
| 7 | `teardown` | The place | Once per run. |

- A hook writes optional JSON `{ "env": {}, "exports": {} }` to the file `ORBTEST_SLOT_OUTPUT`. `prepare` can also give `put: [{ local, remote }]`. Stdout is log output only.
- `env` of a hook adds variables for the later slots of the same case (of the run, for `stage`).
- Run-level hooks (`prepare`, `stage`, `teardown`) get no case variables.
- The harness collects the evidence before `teardown` and `close`. Cleanup also runs after a partial setup failure.
- `stage` or the place check failing before any case makes the run exit 3.

## The Slot Protocol

Every hook, fixture, runner command, place command, and check gets these variables. They are the fixed interface for arbitrary code. Every path is an absolute path on the place.

| Variable | Value | Set for |
|----------|-------|---------|
| `ORBTEST_RUN_ID` | The run id | Every slot |
| `ORBTEST_RUN_DIR` | The evidence folder of the run on the place. The controller collects it into `<defs-root>/.local/runs/<run-id>/`. | Every slot |
| `ORBTEST_STAGE_DIR` | The stage folder of the run | Every slot |
| `ORBTEST_PRODUCT_ROOT` | The product root on the place | Every slot |
| `ORBTEST_DEFS_ROOT` | The definitions root on the place, `<root>/<run-id>/defs` | Every slot |
| `ORBTEST_PLACE` | The place id | Every slot |
| `ORBTEST_ENVIRONMENT` | The environment id | Every slot |
| `ORBTEST_COMMIT` | The 40-hex commit of the product, or empty | Every slot |
| `ORBTEST_DIRTY` | `1` when the product tree is dirty, else `0` | Every slot |
| `ORBTEST_WORKER` | The worker number, from 0 | Each invocation and case slot |
| `ORBTEST_CASES` | A JSON file `{ "<spec>/<case>": { "case_dir", "exports", "report" } }` for every case of the invocation | Each invocation and case slot |
| `ORBTEST_CASE` | `<spec-id>/<case-id>` | A case slot, and an invocation of one case only |
| `ORBTEST_CASE_DIR` | The private folder of the case | A case slot, and an invocation of one case only |
| `ORBTEST_REPORT` | The file where a runner or a script writes its results | A case slot, and an invocation of one case only |
| `ORBTEST_EXPORTS` | The JSON file of the fixture exports of the case | A case slot, and an invocation of one case only |
| `ORBTEST_EVIDENCE_DIR` | `<case_dir>/evidence/`. The harness collects it as `captured` evidence. | A case slot |
| `ORBTEST_FIXTURE_DIR` | `<case_dir>/fixtures/<id>/`, or `<stage_dir>/fixtures/<id>/` for a `cache: snapshot` build | A fixture build |
| `ORBTEST_SLOT_OUTPUT` | The file where a hook or a fixture writes its slot output | Each hook and fixture action |

Placeholders resolve in `isolation`, `hooks`, `vars`, fixture recipes, and `then` checks:

| Placeholder | Value |
|-------------|-------|
| `{{case_dir}}`, `{{stage_dir}}`, `{{run_dir}}`, `{{product_root}}`, `{{defs_root}}`, `{{worker}}` | The slot of the same name |
| `{{<key>}}` of `vars` | The value of the key |
| `{{port:BASE}}`, `{{port:BASE:STEP}}` | A port per worker |
| `{{local_product_root}}` | The product root on the controller |

An unknown or a cyclic placeholder is a `setup_error`. Give a substituted path as an argv item, or quote it for the shell.

## Fixtures

A fixture builds one real state with the real tools. It is a recipe or a script in `orbtest/behaviour/fixtures/`. This is not the UI fixture `ui/fixtures/<name>`, which is a file that a journey uploads or reads.

```yaml
# orbtest/behaviour/fixtures/project-basic.yaml of the CLI app of the example: a chain on the script fixture home-seeded
uses: [home-seeded]
build:
  - run: ["mkdir", "-p", "{{case_dir}}/projects"]
  - run: ["node", "{{app_bin}}", "create", "Basic", "--path", "{{case_dir}}/projects", "--json"]
verify:
  - type: file
    path: "{{case_dir}}/projects/Basic/project.toml"
    expect: { kind: file, contains: 'name = "Basic"' }
exports:
  project: "{{case_dir}}/projects/Basic"
```

`home-seeded.mjs` and `home-no-profile.mjs` are script fixtures of the same example. `home-seeded` writes a profile into the home of the case (the folder that `APP_HOME` names), and `home-no-profile` leaves the home empty on purpose (a fault fixture).

| Key | Meaning |
|-----|---------|
| `uses` | Fixtures to build first. A cycle is refused. |
| `build` | Steps, each `{ run: <command> }`. |
| `verify` | Check objects. Only a verified fixture is usable. |
| `exports` | Named values. The harness merges the exports of the `uses` chain, then of `case_open`, into `ORBTEST_EXPORTS`. A duplicate key is refused. |
| `cache` | `snapshot`: opt-in. The fixture builds once in `<stage_dir>/fixtures/<id>/`, and `materialize` makes independent state and fresh exports for each case. |
| `materialize`, `cleanup` | Commands. Cleanups run in reverse order, also after a partial failure. |
| `inputs` | Declared external inputs of the cache key, relative to the product root. |

- A script fixture is `<id>.mjs` or `<id>.sh`. It builds state in `ORBTEST_CASE_DIR` and can write `exports.json` there.
- Fixtures build per case by default. Use `cache: snapshot` only for a fixture whose state can be copied. Never copy process ids, sockets, or absolute cache paths as usable handles.
- The cache key holds the fixture and its dependencies, the environment, the place, the product digest, and the declared inputs.
- **A failed build, materialize, or verify is `error` with `setup_error` on each case that uses the fixture, never `fail`.** A broken fixture is not a broken product.
- Fault fixtures make bad states on purpose: an offline registry, a home with no profile, an interrupted migration, a Git history that diverges.
- `flint orbtest behaviour fixture list --root <product-root>` lists the fixtures. `flint orbtest behaviour fixture build <id> --root <product-root>` builds one fixture alone, optionally with `--place <id>`.
- `flint orbtest behaviour fixture author --root <product-root> --brief "<state in words>"`: an agent can try the steps in a scratch folder and proposes a recipe with a `verify` block. The CLI writes the proposal under `.local/runs/fixture-author-<time>/fixture.yaml`, never under `behaviour/fixtures/`. A person approves the recipe before the agent copies it to `behaviour/fixtures/` and commits it.

## Runs, Results, and Evidence

`flint orbtest behaviour run --root <product-root>` runs the selected cases. Select with `--spec`, `--case`, `--story`, and `--kind`. Choose where with `--environment` and `--place`. `--jobs <n>` runs workers in parallel. `--confirm` anchors passed deterministic cases. `--keep-scratch` keeps the case folders and the place run folder. `--resume <run-id>` continues a run. `--json` prints one JSON value on stdout; progress and the `report <path>` line go to stderr.

| Exit | Meaning |
|------|---------|
| 0 | No case of a blocking story ended `fail`, `error`, or `budget_exceeded`. |
| 1 | A case of a blocking story ended `fail`, `error`, or `budget_exceeded`. |
| 2 | Refused before any write: a bad argument, an unknown id, or an unsafe path. |
| 3 | An infrastructure error: the place check or the `stage` hook failed before any case. |

Behaviour stories default to `blocking`. After execution starts, the harness keeps the evidence whatever the exit.

**The run folder** `<defs-root>/.local/runs/<run-id>/`:

```
run.json                     kind "behaviour", schema "orbtest-behaviour-run/1"
report.html                  the report for people; the run prints `report <path>`
cases/<encodeURIComponent(case id)>/
  stdout.txt  stderr.txt  <the runner report>  exports.json  evidence/
heal/<encodeURIComponent(case id)>.json          one heal record per heal
```

`run.json` holds the place, the environment, `definitions: { commit, dirty }`, the product facts (digest, commit, dirty, lock-file digest, toolchain versions, image digest), the selection, `started_at` and `finished_at`, the resume state, the summary, and one record per case. A case record holds the result, the story, the tier, the kind, the environment, the place, the runner, the file, the hashes, every attempt, a snapshot of the case definition, and the fixture records. A later pass never replaces a failed attempt. A reader selects a record by `kind` and `schema`.

**A case result** (snake_case in every file):

| Key | Values |
|-----|--------|
| `status` | `pass`, `fail`, `error`, `skipped`, `budget_exceeded`, `not_run` |
| `error_reason` | `setup_error` (a fixture, a hook, or a placeholder), `runner_error` (spawn, transport, or parse), `no_result`, `timeout` |
| `attempts`, `passes` | The attempts, and the attempts that passed |
| `evidence` | `{ tier, path?, note? }`: `asserted` (a test assertion), `captured` (a file in `ORBTEST_EVIDENCE_DIR`), `claimed` (an agent says so) |

**`--confirm`** anchors each passed deterministic case of the run. It needs unchanged inputs, eligible evidence (`asserted` or `captured`), a clean tree, and a product digest on the place that matches the commit. A retry pass never anchors.

**Retention.** `flint orbtest runs prune --root <product-root> --kind behaviour` prunes behaviour runs. A run that a sidecar anchor names always stays.

## Scope and Cost

Each case costs time and compute on every run. A large suite is slow. People and agents then stop running it, and it proves nothing. Keep the suite small. Run only the part that a change touches. Watch the time of each run.

**Run only the relevant part.** A run does not have to run every case.

| When | What to run |
|------|-------------|
| You change the product | Only the cases of the code that you change. Select them with `--spec`, `--case`, `--story`, or `--kind`. Find them through the `components` of each spec, the story of the change, and `behaviour drift` (a `component_changed` case). |
| You write or repair a case | Only its spec: Stage 6 and Stage 7 of [[dev-wkfl-ot-behaviour]]. |
| Before a merge into the canon branch, before `--confirm`, and before a release | The full run. |
| Another place (`ssh`, `docker`, `command`) | Only the specs whose behaviour depends on the place. A run on another place copies the definitions and prepares the product there, so it costs more. |

Give each spec a correct `components` list. The selection of the relevant cases and drift both use it. A spec with no `components` must run for every change.

**Write few cases, and give each one a reason.**

- Before you add a case, answer this question: which failure does this case find that no other case finds? The answer is the `protects` field of the authoring gate. With no answer, do not write the case.
- Write one case per claim. Do not write one case per input value: one case with a table of inputs proves the same claim.
- Prove a claim once, at its owner boundary. Do not repeat a scenario at a weaker boundary when a stronger case proves it.
- A case that proves no criterion is an orphan. Bind it to a criterion, or remove it with [[dev-wkfl-ot-audit]].
- More cases are not better coverage. Coverage counts criteria, not cases.

**Watch the performance.**

- The run prints the time of each case, and each case result has `duration_ms`. After each full run, read the slowest cases and compare the time of the full run with the time of the previous full run. A case that becomes much slower is a finding: report it.
- Give a slow case a `budget: { ms: <n> }`. A case over its budget ends `budget_exceeded`, and a case of a blocking story then fails the run. A higher budget needs the approval of a person.
- Build expensive state once. A fixture with `cache: snapshot` builds once per run and gives each case a copy. Build the product once, in the `stage` hook, never in each case.
- Run independent cases in parallel with `--jobs <n>`.
- Do not wait with a fixed sleep. Wait for the condition, with a timeout.
- Keep the `repeats` of a `live-agent` case low. Each repeat is an agent turn, which costs time and tokens.

Example: the full run of a CLI app has 180 cases and takes about 4 minutes on one worker. Three cases take more than 10 seconds each: a `live-agent` case, a timeout case that waits for its process to end, and a case that runs on the place `build-box`.

## States

The report keeps every flag that applies to a case and shows the first flag in this display order:

| Case state | Meaning | Can prove? |
|------------|---------|------------|
| `invalid` | The case block does not parse, or the case id is a duplicate. The other cases still run. | No |
| `unbound` | The case has no test code and no check objects. | No |
| `quarantined` | The healer took the case out of the gate: it is flaky, or it needed a second heal in a row. | No |
| `waived` | A person excluded it, with a reason, an owner, and an end date. | No |
| `repaired` | The healer changed the test. It waits for review. | No |
| `stale` | The words, a component, a criterion text, or the binding changed after the anchor. | No |
| `suspect` | The test text changed after the anchor. The next confirmed run decides. | No |
| `ungated` | A gate field is missing. The case runs. | No |
| `error` | Setup failed. It says nothing about the product. | No |
| `failing` | The newest run failed. | No |
| `proven` | Confirmed, and the newest run passed. | Yes |
| `passed` | The newest run passed, and the case has no anchor. | No |
| `not-run` | No run has the case. | No |

A criterion is proven only by a confirmed case whose newest run passed on the first attempt with `asserted` or `captured` evidence. `claimed` evidence alone, a retry pass, a repaired case, and a quarantined case never prove. A later clean first-attempt pass with `--confirm` restores proof.

| Criterion state | Decided in this order |
|-----------------|-----------------------|
| `failing` | A linked case is actively failing. |
| `proven` | Else a linked case gives eligible proof. |
| `stale` | Else a linked case is a stale candidate. |
| `gap` | Else no case and no UI task names the criterion. |
| `waived` | Else every linked case is waived. |
| `not-run` | Else. |

The report shows setup errors beside the criterion state. A UI task proves a criterion only through its `proves` field. Story membership alone proves no criterion.

## Drift

`flint orbtest behaviour drift --root <product-root>` compares each case with its anchor. It writes nothing.

| Signal | Cause | State |
|--------|-------|-------|
| `spec_changed` | The case text or the spec front matter changed. | `stale` |
| `binding_changed` | The test file changed. | `suspect` |
| `binding_missing` | The file or the marker is gone. | `stale` |
| `component_changed` | A `components` path changed after the anchor. | `stale` |
| `criterion_changed` | The text or the order of a proven criterion changed. | `stale` |
| `unconfirmed` | The case has no anchor. | reported |

`flint orbtest behaviour drift --root <product-root> --check` exits 1 when a case of a blocking story is stale or unconfirmed. It exits 3 when git cannot diff a component of an anchored case. Never reorder the criteria of a story: the order is part of the anchor.

## Coverage

`flint orbtest coverage --root <product-root>` prints a state for each criterion of each story from both layers. `--story <id>` selects one story. `--layer ui`, `--layer behaviour`, or `--layer all` (the default) selects the layers. `--json` prints the report as one value.

```text
app.home  A machine has one home with one profile          blocking
  #0 When APP_HOME changes, the app shall write its state to the new home.   proven
       integration  app.home.example/the-cli-writes-to-the-home-that-app-home-names  pass  2.4 s  confirmed a8ad06f
  #1 If the home has no profile, then create shall exit 2 and write nothing.   stale
       check        app.home.example/create-refuses-a-home-with-no-profile   pass  3.1 s  stale: create.ts changed since 5266b4c
       ui     task setup.first-project                              met   12 s   confirmed 95b3318
```

The report also lists orphans (a case that proves no criterion), unaccounted test files (test code that carries no case), quarantined cases, and repaired cases that wait for review. The coverage report counts criteria, not lines. It cannot show a behaviour that nobody wrote down.

## The Healer

The healer is the self-healing agent runner. It works through the cases that are not green, one at a time, and gives one verdict per case with a rationale that cites the evidence.

| Verdict | Meaning | What the healer may do alone |
|---------|---------|------------------------------|
| `environment_broken` | A fixture or the environment failed. | Rebuild the fixture once in a fresh folder, and run again once. Propose a recipe change. |
| `test_wrong` | The test code does not match the words. | Write a repair patch of the test code. With `--apply`, apply it; the case is then `repaired`. |
| `flaky` | The case passed on a re-run with no change. | Quarantine the case, with its fail rate. |
| `spec_outdated` | The product changed on purpose, and the words are old. | Propose a change of the words. |
| `product_bug` | The product does not do what the words say. | Report it, and propose a failing regression case. The case stays failing. |
| `unknown` | The healer cannot decide. | Report to a person. |

**Rules that stop the healer from hiding a real bug.** A repair that breaks one of them is refused, and the record names the rule:

1. It never weakens an assertion (`weakens_assertion`).
2. It never replaces an expected value with the value that the failed run observed (`replaces_expected_value`).
3. It never adds a skip or an `expect: fail` (`adds_skip`).
4. It never changes the words (`changes_words`) or the product (`changes_product`).
5. It never changes a test and the product in one step (`changes_test_and_product`).
6. A case that needs a second heal in a row goes to quarantine (`second_heal_in_a_row`).

More rules:

- The words are the judge. A repair argues from the `then` lines.
- A repaired test must still fail against a planted fault, or against the commit before a fix.
- A repaired case is `repaired`, never `proven`, until a person accepts the diff and a new confirmed run passes.
- The healer gets only redacted inputs. The core takes the healer agent by injection (`HealClient`); the Orbh implementation lives in `packages/orbtest-agent-orbh`.
- Every heal writes `<run-dir>/heal/<encoded case id>.json` (`schema: orbtest-heal/1`): the verdict, the rationale, the citations, the confidence, the action, the patch with `applied`, the refused rules, the heal count, the client, and the time.

`flint orbtest behaviour heal --root <product-root>` heals the non-green cases of the newest behaviour run. `--run <run-id>` and `--case <id...>` narrow it. `--apply` applies the `test_wrong` patches that no rule refused. `--target <runtime/profile>` selects the Orbh agent target.

Each `heal` call asks the agent for a new verdict and writes a new record over the old one. So `--apply` applies the patch of its own call, never a patch that a person approved from an earlier record. To apply an approved patch, apply the stored `patch.diff` of the record after three checks: its digest is the approved digest, the test file still has the `hashes.test` of the run, and `git apply --check` passes. [[dev-wkfl-ot-heal]], Stage 4, gives the commands. The headless twin runs `heal --apply` once per run, and a person reviews the `repaired` cases later.

**A person approves** each change of the words or the criteria, each product change, each fixture recipe change, each weaker assertion or removed coverage, new external access, and a higher budget. The research found a benchmark where AI repair tools made false heals about 25% of the time. This list is the answer to that risk.

## A Complete Example: a CLI App

The example of this file is a CLI app, `app`, in the repository `../Repos/app` beside the Flint. The app keeps its state in a home folder that the variable `APP_HOME` names, else `~/.app`. `app create <name>` needs a profile in the home, makes a project, and lists the project in the registry of the home. The values below show the shape of a value; read the files of your own product for its values.

```
../Repos/app/orbtest/
  orbtest.toml                       [orbtest] format = "0.0.1"
  stories/app.yaml                   app.home
  environments/app-scratch.yaml      the CLI in a scratch world on this machine (place local)
  environments/app-remote.yaml       the same world on another machine (place build-box): hooks prepare and stage
  places/build-box.yaml              kind ssh
  behaviour/
    package.json  tsconfig.json  vitest.config.ts   the behaviour test package
    specs/app.home.example.md        the example: three cases of the story app.home
    harness/world.mjs                the one contract of the world: the stage, the case folder, the home, the Git guard
    harness/app-world.ts             the vitest helper on world.mjs; it reads ORBTEST_CASES
    harness/lib.sh                   the bash helpers on world.mjs
    harness/stage.mjs  prepare-remote.mjs  case-open.mjs  case-close.mjs  git-shim/   the hook code
    fixtures/home-seeded.mjs         a script fixture: a profile in the home of the case
    fixtures/home-no-profile.mjs     a fault fixture: an empty home
    fixtures/project-basic.yaml      a recipe on home-seeded: the real app create makes the project Basic
    tests/app/home.test.ts           bound vitest tests
    tests/app/home.sh                a bound bash check
    bindings/                        the CLI-written sidecars
```

`harness/world.mjs` gives one contract to the vitest tests, to the bash checks, to the fixture scripts, and to the hooks of both environments. So a bash check and a vitest test build a world in the same way, and the same cases run in `app-scratch` and in `app-remote`.

A bound vitest test of the example spec, shortened:

```ts
import { describe, expect, it } from 'vitest';
import { appWorld } from '../../harness/app-world.js';

const SPEC = 'app.home.example';

describe(SPEC, () => {
  // orbtest: app.home.example/the-cli-writes-to-the-home-that-app-home-names
  it('the-cli-writes-to-the-home-that-app-home-names', async () => {
    const w = await appWorld(`${SPEC}/the-cli-writes-to-the-home-that-app-home-names`, { fixtures: ['project-basic'] });
    const b = w.otherHome('b');
    const result = w.app(['create', 'Beta', '--path', w.projects, '--json'], { env: b.env });
    expect(result.code, result.stderr).toBe(0);
    // ... the registry of home B lists Beta; the registry of home A did not change
  });
});
```

Run the same spec on this machine, then on `build-box`:

```bash
flint orbtest behaviour run --root ../Repos/app --spec app.home.example
flint orbtest behaviour run --root ../Repos/app --spec app.home.example --environment app-remote
flint orbtest coverage --root ../Repos/app --story app.home
```

A tool can test itself in the same way: the orbtest CLI has specs of its own modules that prove its own stories, with real files, real processes, and real git in scratch folders. When a product brings old tests into the behaviour layer, an old test comes back only when a spec binds it. The [[dev-wkfl-ot-audit]] workflow decides each file.
