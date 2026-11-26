---
required-reading:
  - "[[dev-knw-ot-records]]"
  - "[[dev-knw-ot-authoring]]"
orbh-sessions:
  - "[[b196755f-5e21-43d7-94f0-4c43c6e0d2a6]]"
---

# Orbtest

The Orbtest shard operates the `flint orbtest` CLI on the products of a Flint and records the results in the Mesh. Orbtest has two layers of tests. **UI tests** run journeys and screen captures against the real product in a browser, a terminal, or a desktop window: an agent explores a journey once, `flint orbtest author` freezes the trace into deterministic steps, `flint orbtest register --approve` writes them, and every later run replays the steps with no agent. **Behaviour tests** prove the behaviour of any software in any language: a Markdown spec says in words what a case proves, and test code that the agent writes binds to each case. Both layers share the stories, the environments, and the report standard. The shard writes the Mesh artifacts `(Test)`, `(Run)`, `(Story)`, `(Suite)`, and `(Release)`.

## Two Layers: UI Tests and Behaviour Tests

Always name the layer. "A test" alone is not clear: say "a UI test" or "a behaviour test".

| | UI tests | Behaviour tests |
|---|---|---|
| What they test | A journey of a person through the product's own interface, and how its screens look | The behaviour of a function, a module, a command, a file format, a protocol, or an agent, at its public boundary |
| Where the files live | `orbtest/ui/`: `profiles/`, `steps/`, `tasks/`, `briefs/`, `fixtures/`, `suites/`, `baselines/` | `orbtest/behaviour/`: `specs/`, `bindings/`, `fixtures/`, `kinds/`, `harness/`, `tests/`; and `orbtest/places/` |
| Shared by both | `orbtest.toml`, `stories/`, `environments/`, `requirements/`, `product/`, `.local/runs/` | the same |
| The unit | A task (a journey) of one story | A case (one `###` section of a spec) of one story |
| Who writes them | The CLI only: `author`, `register --approve`, and the `<kind> <verb>` commands. The agent never writes a UI file by hand. | The agent designs the test architecture, the environments, and the places of each product, and writes the specs, the test code, the harness, the fixtures, and the place files by hand. The CLI writes the sidecars, the anchors, and the runs. |
| How they run | `flint orbtest run --root <product-root> --profile <id>`, and `flint orbtest snapshot --root <product-root>` for the suites. The harness replays steps with a driver on this machine. | `flint orbtest behaviour run --root <product-root>`. Any runner (vitest, bash, a command, or the check objects of the spec) in a place: this machine, a container, or another machine. |
| What proves a criterion | A confirmed task (`run --confirm`) that names the criterion in its `proves` field, and whose newest run met | A confirmed case (`behaviour run --confirm`) that names the criterion in `proves`, whose newest run passed on the first attempt with `asserted` or `captured` evidence, and that is not stale, suspect, ungated, repaired, quarantined, or waived |
| Its workflows | [[dev-wkfl-ot-init]], [[dev-wkfl-ot-stories]], [[dev-wkfl-ot-tasks]], [[dev-wkfl-ot-repair]], [[dev-wkfl-ot-suites]] | [[dev-wkfl-ot-behaviour]], [[dev-wkfl-ot-heal]], [[dev-wkfl-ot-audit]] |
| Its reference | [[dev-knw-ot-authoring]], [[dev-knw-ot-platforms]], [[dev-knw-ot-records]] | [[dev-knw-ot-behaviour]] |

**Tests cost time and compute on every run.** This applies to both layers. Write only a test that finds a failure that no other test finds. While you work, run only the tests that the change touches: select them with `--spec`, `--case`, `--story`, or `--kind` for behaviour tests, and with `--task` or `--story` for UI tests. Run everything only before a merge, a `--confirm`, or a release. Watch the time of each run, and report a slow test as a finding. [[dev-knw-ot-behaviour]], Scope and Cost, has the rules.

`flint orbtest coverage --root <product-root>` shows one state for each criterion of each story from both layers. The `(Test)` of a UI test has `layer: ui`, and the `(Test)` of a behaviour spec has `layer: behaviour`. Read [[dev-knw-ot-behaviour]] before you do any behaviour work.

## Operating Model

| Who | Does | Where |
|-----|------|-------|
| The agent | Runs every `flint orbtest` command. Proposes each change. Writes the Mesh artifacts. | The Orbh session and the shell |
| The agent | Designs the behaviour tests of each product: the test architecture, the environments, the places, the fixtures, and the harness. Writes the specs and the bound test code. | The product repository, under `orbtest/behaviour/` and `orbtest/places/` |
| The human | Decides at each checkpoint: a profile and its environment, a change of a story that exists, a register, a baseline, a regen, a release. For behaviour tests: an environment design, the words of a spec, a fixture recipe, a heal patch, an audit deletion batch. | The Orbh session |
| The human | Reads the evidence of a run. | `.local/runs/<run-id>/report.html`, the `report <path>` line that `run`, `snapshot`, and `behaviour run` print |
| The human | Reads the configuration without an agent. | `flint orbtest page --root <product-root> --open` |
| The human | Reads the criterion states of both layers. | `flint orbtest coverage --root <product-root>` |
| The human | Reads coverage and status across products. | `(Dashboard) Tests` |

## Boundary

**The agent never creates, edits, or deletes a file of the UI layer or of the shared folders under `orbtest/` by hand.** Every change there is a `flint orbtest` command. Git is the undo. The behaviour layer is the one exception to the rule, and this is the one place that lists every exception.

**The behaviour exception.** Behaviour tests are arbitrary code of each product, and the agent designs them. So the agent writes these files by hand, with its own tools:

| Path under `orbtest/` | What the agent writes | Rule |
|-----------------------|-----------------------|------|
| `behaviour/specs/<spec-id>.md` | The specs: the words of each case | The human approves the words before the test code binds to them. Only the human removes a spec. |
| `behaviour/tests/**` | The test code, in any language | Each bound test carries its marker `orbtest: <spec-id>/<case-id>`. |
| `behaviour/harness/**` | The support code: test helpers, hook scripts, the program of a `command` place | Never a secret, and never a path of the real home. |
| `behaviour/fixtures/<id>.yaml`, `<id>.mjs`, `<id>.sh` | The fixture recipes and scripts | The human approves each recipe and each recipe change. |
| `behaviour/kinds/<id>.yaml` | A kind override or a product kind | Case defaults only, never environment keys. |
| `behaviour/package.json`, `tsconfig.json`, `vitest.config.*` | The test package of the product | A dependency change goes through the package manager of the product. |
| `places/<id>.yaml`, `.local/places/<id>.yaml` | The place files | Never a key or a credential. A machine-local place goes under `.local/places/`. |

An environment file stays a CLI write: `flint orbtest environment add|set|unset` writes its behaviour fields (`place`, `isolation`, `hooks`, `vars`, `allow_dirty_remote`) too, and validates them. The agent writes the code that the hooks run, under `behaviour/harness/`.

**What only the CLI writes in the behaviour layer.** Never write these by hand:

- `behaviour/bindings/<spec-id>.yaml`, the sidecars. `flint orbtest behaviour bind --root <product-root> --scan` writes them. `behaviour run --confirm` writes the anchors in them. The healer writes `quarantined` and `repaired` in them.
- `.local/runs/behaviour-*/`, the run folders and their heal records.
- `orbtest.toml` and the scaffold of `flint orbtest init --root <product-root> --layer behaviour`.

**The exceptions of the human.** The CLI cannot do these, so a human does them:

| Exception | Who writes it | How |
|-----------|---------------|-----|
| The value of a secret in `orbtest/.local/secrets` | The human | In the local browser page that `flint orbtest secret enter --root <product-root>` opens. The agent adds the name with `secret add`. No command prints a value. A folder that `upgrade` has not moved yet still holds the old secrets file at the root; `upgrade` moves it. |
| A product script, for example a reset script or a seed script | The human | Product scripts live under `orbtest/product/`, and git commits them. The agent proposes the content in the Orbh session. No command writes a script. |
| A line in `orbtest/.gitignore` that the `init` scaffold did not write | The human | The scaffold writes one entry, `.local/`, and it covers every machine-local file of format 0.0.1. A product needs a hand line only when it keeps machine-local state at the definitions root, outside `.local/`. A product that keeps all machine-local state under `.local/` needs none. The agent names the line; no command writes `.gitignore`. |
| The move of the product's own plumbing into `orbtest/product/` | The human | `upgrade` never moves a product file, because it cannot read the product's own commands. Its notes name every root entry that stays. `check` reports each one as a stray entry until it moves. |
| The move of a folder that has the first layout of format 0.0.1 into `ui/` and `environments/` | The human | `check` exits 2 and prints the move list (see Version Handshake). `upgrade` has no step for this move. The human moves each entry with `git mv`, splits each profile into its two halves, and changes each path that the list names, in the definitions and in the product scripts. Git is the undo. |

**Product plumbing lives under `orbtest/product/`.** The folder holds the product's own scripts and their README, and git commits every one of them. For example, a web app keeps `token.mjs`, `clean.mjs`, `scripts/`, and `README.md` there. A script under `product/` runs with the definitions root as its working directory, not with `product/`. So an environment calls it as `node product/token.mjs`, and a script reads a fixture as `ui/fixtures/<name>`: `product/clean.mjs` of that app reads `ui/fixtures/sample-upload.png`. `init` does not create `orbtest/product/`; the first hand move does. The `init` workflow names the folder when a product needs a reset script or a seed script. The agent proposes the content, the human writes the file, and the human moves an existing root entry into the folder.

**Nothing generated and nothing machine-local goes under `orbtest/product/`.** Two examples show the rule. The `parallel.prepare` command of an environment writes the config file of the backend and a `package.json` into the worker directory `orbtest/.local/services/workers/<n>/` for every worker, worker 0 included, because the backend CLI of the app takes its project root from its working directory. The isolated home of a terminal profile is machine-local too: the UI profile field `terminal.env.APP_HOME` of a CLI app is `.local/services/app-home`, and `product/token.mjs` mints the token there. Both paths sit under `.local/`, so the one `.gitignore` entry covers them and git never commits a token.

Rules that never change:

- The shard never writes under `orbtest/.local/runs/`. The harness writes there. The shard reads `run.json`, `bundle.json`, `agent.jsonl`, `dom.json`, `report.html`, and `.png` files there, and for a behaviour run also its case files (`stdout.txt`, `stderr.txt`, `evidence/`) and heal records, and nothing else. It names the path of `report.html` for the human and does not open the file. The same list is in [[dev-knw-ot-records]].
- `orbtest/.local/` holds every machine-local file: the run history under `.local/runs/`, the secrets under `.local/secrets`, and the machine-local service files and worker directories under `.local/services/`. Git never commits it. `check` exits 2 when git would.
- `flint orbtest approve` is the only writer under `orbtest/ui/baselines/`.
- Only the `init` workflow runs a `profile add|set|unset|rename|remove` command, and only for the profile the human approved in that run. Only the `init` workflow and Stage 2 of the `behaviour` workflow run an `environment add|set|unset|rename|remove` command, and only for the environment the human approved in that run. Every other workflow runs `profile list`, `profile show`, `environment list`, and `environment show` only.
- A story is a statement about the product. The agent writes a new story and a new criterion with no approval: it runs `story add` and `story criterion add`, and it names each new story and each new criterion in its report. The human approves a change or a removal of a story or a criterion that exists, before the agent runs `story set`, `story remove`, or `story criterion set|remove`. Never reorder the criteria of a story: a UI test and a behaviour case name a criterion by its position.
- The CLI never writes the Mesh. The shard is the only writer of a `(Test)`, `(Run)`, `(Story)`, `(Suite)`, or `(Release)`.
- A write command validates the planned definitions first. It writes nothing and exits 2 when the result is invalid. When the definitions do not load (exit 2 on `validate`), no command can change them. Stop, and give the human the file and the error. A bad spec, case, fixture, kind, place, or sidecar of the behaviour layer does not stop the load: it is a warning, and the other cases still run.

Safety rules of the behaviour layer. They have no exceptions:

- A case folder is never inside the product repository, and never a folder that holds the home folder of the account. The guard of the harness refuses such a path before any write, on each place. As a note, the guard also protects the state of Flint itself: it refuses a path that overlaps the NUU home of the account (the state folder of Flint), or that is inside a real Flint or Tinderbox.
- A test never touches the real state of the product. Each environment variable that selects a state folder, a home, or a config folder of the product (for example `APP_HOME`) points under `{{case_dir}}`, never at the real folder. The guard checks such a variable itself only for the home variable of Flint. For every other variable, the environment design is the protection: the human checks it at the environment checkpoint.
- A behaviour run never talks to a real external service that the product does not own (for example a package registry or a production API) unless an environment says so explicitly. A stub replaces it.
- Secrets come only from explicit `env://` references. Never put a secret, a key, or a credential in a spec, a test, a fixture, a harness file, an environment, or a place file.
- Only a real observed pass proves a criterion. Never weaken an assertion, never copy an observed value into an expected value, and never add a skip to make a case pass.

## Version Handshake

Every `orbtest/` folder is written for one definitions format. `orbtest.toml` declares it in the `[orbtest]` table as `format`. A folder with no `format` key is the legacy flat layout. This CLI reads format `0.0.1` and the legacy layout.

**Run `flint orbtest check --root <product-root>` first.** Do it in Stage 1 of every workflow, and as the first action of every skill that runs a command. The one exception is a product with no `orbtest/` folder: `check` exits 2 on it, so the `init` workflow and the `behaviour` workflow scaffold it first (`init`, or `init --layer behaviour`), and run `check` after the scaffold. `check` never writes. It prints one line per finding and one summary line, `format <x> · CLI reads <y> · <status>`. `--json` prints the same report on stdout. Act on its exit code:

| Exit | Meaning | What you do |
|------|---------|-------------|
| 0 | The folder is current for this CLI. | Continue with the workflow or the skill. |
| 1 | The folder is older than the CLI. It must be upgraded. | Run `flint orbtest upgrade --root <product-root> --dry-run`. Give the human every operation and every note it prints. Run `flint orbtest upgrade --root <product-root>` only after the human approves in the Orbh session. Then run `check` again and expect exit 0. |
| 2 | The folder is malformed for its own format, or it has the first layout of format 0.0.1. | Stop. Give the human every finding line. `check` names each stray root entry itself, and moving one is a hand move by the human. A move list of the first layout is also a hand move by the human (see below). Do not run `upgrade` to learn more: on a folder already at the current format `upgrade --dry-run` exits 2 with `nothing to upgrade: orbtest/ is already format "0.0.1"` and prints no note. Only an upgrade of an older folder prints notes, and they name every root entry that stays. Never repair the folder by hand for your own convenience. |
| 3 | The CLI is older than the folder. | Stop. Ask the human to update the `flint` binary. No command of this CLI can read the folder. |

**The first layout of format 0.0.1.** Format `0.0.1` changed its layout in place, and the format key did not change. The first layout had every folder at the definitions root. The current layout keeps the folders that only UI tests use under `ui/`, and splits each profile into an environment and a UI profile (see Layout). A folder in the first layout declares `0.0.1`, so `check` does not call it older than the CLI. It calls it malformed:

- `check` exits 2. It prints one `move` line per entry to move under `ui/`, with its new path. It prints one `split` line per profile, with the fields of each half, and one `rewrite` line per definition file that names a fixture outside `ui/`. The `move` line of the fixtures also names each product script that reads a fixture outside `ui/`. The summary line is `format 0.0.1 · CLI reads 0.0.1 · current` with `✘` in front.
- `upgrade` has no step for this move. `upgrade --dry-run` exits 2 with `nothing to upgrade`.
- `validate`, `drift`, `task list`, and every other command that loads the definitions exit 2 with a line that names `check`.
- A human moves such a folder by hand, per the `check` lines, with `git mv` so git keeps the history. Git is the undo. The agent gives the human the whole `check` output and stops. After the move, `check` and `validate` must exit 0.
- The move commit changes the baselines too. See [[dev-knw-ot-records]], Suite Status From the Records.
- A legacy folder does not pass through the first layout: the `legacy → 0.0.1` step of `upgrade` writes the current layout directly.

More rules of the handshake:

- The behaviour layer does not change the format. `behaviour/` and `places/` are additive to format `0.0.1`. `check` and `validate` report the findings of the behaviour layer (a spec that does not load, an invalid case, a malformed fixture, kind, place, or sidecar) as warnings, and the exit code stays 0. `flint orbtest check --root <product-root> --strict` and `flint orbtest validate --root <product-root> --strict` make them exit 2. The workflows of the behaviour layer read these warnings in their first stage.
- Exit 2 wins over exit 1. A folder that is both older and malformed exits 2, and the malformed findings come first.
- `upgrade` refuses a dirty git tree with exit 2, and it refuses a folder that is not in a git repository. Commit or stash first. Git is the undo of an upgrade: `upgrade` writes files, and `git checkout` is how you go back.
- `upgrade --dry-run` writes nothing. `--to <format>` names another target in the chain. `--json` prints the result on stdout.
- `flint orbtest settings show --root <product-root>` prints `orbtest.format`. Reading it is allowed.
- The `format` key is never changed by hand and never with `settings set`. `init` and `upgrade` own it. `settings set orbtest.format=...` is refused.
- After the handshake, `validate` is still the command that proves the definitions load. A write command that refuses with exit 2 and the line `orbtest/ is format <x>; this CLI reads <y>; run flint orbtest upgrade --root <product-root>` means the handshake was skipped. Run `check` and start again.

## The Proof in the ITE

Orbtest answers "does the product do this?". The ITE shard (`ite`) answers "what is the product, and how does a person use it?" with a program of the template `software`: its parts and its views. A part and a view node can name stories and criteria of Orbtest, and `flint ite proof` shows the proof of each node from the coverage of Orbtest. No workflow of this shard makes, changes, or reviews a part or a view.

## Products

The shard holds no list of products. Each Flint that uses the shard keeps a **Products table** in its Flint Init, `Mesh/(System) Flint Init.md`, in the Orbtest section. Read the table at the start of a session. It gives the product root, and every command takes the product root as `--root`.

| Column | What the row holds |
|--------|--------------------|
| Product | The product name. |
| Product root | The parent folder of `orbtest/`, relative to the Flint root. Use the exact spelling. Every `(Test)`, `(Run)`, `(Story)`, `(Suite)`, and `(Release)` copies this string, and every skill matches artifacts on it. Never change the spelling of a row that artifacts use. |
| Repository | The root of the git repository that holds the product, relative to the Flint root. |
| Canon branch | The branch on which the release gate runs, or `-` when the product has none. |

How to add a row:

- Only [[dev-wkfl-ot-init]] adds a row, in Stage 6, and [[dev-wkfl-ot-behaviour]], in Stage 2, for a product that starts with behaviour tests. The human approves the row with the profile and the environment in Stage 4 of `init`, or with the environment design in Stage 2 of `behaviour`. On the align path of `init`, the human approves the row in Stage 6.
- When the Orbtest section of the Flint Init has no Products table, the workflow writes the table header and the first row there.
- A product root that has no row is not adopted in this Flint. Run [[dev-wkfl-ot-init]] or [[dev-wkfl-ot-behaviour]] for it first. Only the human removes a row. One row serves both layers.

Example row, for a web app in a repository with more than one app:

| Product | Product root | Repository | Canon branch |
|---------|--------------|------------|--------------|
| My App | `../Repos/app/apps/my-app` | `../Repos/app` | `main` |

The examples in this shard are generic: a web app, a CLI app, a desktop app, and another machine. They show the shape of a value only. Use the values of your own product.

## Layout

The layout of format `0.0.1`, under the definitions root `<product-root>/orbtest/`. `flint orbtest check` compares a folder with it.

```
orbtest/
  orbtest.toml  .gitignore  .local/
  requirements/     shared: one machine requirement per file
  environments/     shared: the environment half of each profile
  stories/          shared: the stories and their criteria
  product/          shared: the product's own scripts (a hand move creates it)
  places/           shared, optional: one place file per place where an environment runs
  ui/               only for UI tests: journey tests and snapshot suites
  ui/profiles/      the UI profile, the driver half; each names its environment
  ui/steps/  ui/tasks/  ui/briefs/  ui/fixtures/  ui/suites/  ui/baselines/
  behaviour/        only for behaviour tests
  behaviour/specs/      one Markdown spec per behaviour (required when the layer is used)
  behaviour/bindings/   one CLI-written sidecar per spec
  behaviour/fixtures/   fixture recipes and scripts (optional)
  behaviour/kinds/      one kind override per file (optional)
  behaviour/harness/    arbitrary support code of the product (optional)
  behaviour/tests/      arbitrary test code (optional)
  behaviour/package.json  tsconfig.json  vitest.config.*  node_modules   allowed; never stray
```

- The folders at the root serve both layers. The folders under `ui/` serve the UI tests only. The folders under `behaviour/` serve the behaviour tests only. `places/` serves the behaviour tests today.
- A folder with only `orbtest.toml`, `.gitignore`, and `behaviour/specs/` is well formed. `ui/profiles/` and `environments/` are required only when `ui/` exists.
- Every relative path in a definition file resolves against the definitions root. Every command of a definition (`setup`, `seeds`, `parallel.prepare`, a `command` check, a hook) runs with the definitions root as its working directory. So a UI fixture is `ui/fixtures/<name>` in a task, a step, a brief, and a product script, and a hook script is `behaviour/harness/<name>`.
- `.local/` keeps its own layout: `.local/runs/`, `.local/secrets`, `.local/services/`, and `.local/places/` (machine-local place files; a file there replaces a shared place with the same id). `.gitignore` holds `.local/` and `behaviour/node_modules/`.

## Terms

| Term | Meaning |
|------|---------|
| product root | The parent folder of `orbtest/`, relative to the Flint root, as the Products table spells it, for example `../Repos/app/apps/my-app`. |
| definitions root | `<product-root>/orbtest`. See Layout. |
| profile | The UI profile, one file `orbtest/ui/profiles/<id>.yaml`, for example `web-desktop-chromium` or `cli-terminal`: how a UI test drives the product (`platform`, `browser`, `terminal`, `desktop`, `viewport`, `pacing`, `ready`, `agent`, `tier`). It is the driver half of a profile, and it names exactly one environment in its required field `environment`. `--profile`, the task field `profile`, and the suite field `profiles` name it. `profile show` prints the resolved profile, the two halves joined, and names both files. An Orbh runtime and profile pair such as `claude/o5m` is always called the agent target. |
| environment | One file, `orbtest/environments/<id>.yaml`: how the product runs and gets its state. Both layers share it. For a UI test it is the environment half of a profile (`os`, `app_version`, `base_url`, `secrets`, `sources`, `parallel`, `setup`, `seeds`, `version_check`); one environment can serve many profiles; `init`, and `profile add --platform` with no `--environment`, give a new profile and its new environment the same id; a field in the wrong half fails `validate` with exit 2. For a behaviour test only `id` is required, and the optional fields `place`, `isolation`, `hooks`, `vars`, and `allow_dirty_remote` say where and how the cases run. A UI run applies `isolation` too: each process of a UI worker gets the isolated variables and a scratch `HOME` and `NUU_HOME`, the scratch guard checks its state folders and its worker directory, and each service needs `identity` (see [[dev-knw-ot-platforms]], Web). When no environment is named, a case runs in the built-in environment `local`. |
| UI test | A journey task or a snapshot suite under `orbtest/ui/`. |
| behaviour test | A case of a behaviour spec under `orbtest/behaviour/specs/`, bound to test code in any language. |
| spec | One Markdown file `orbtest/behaviour/specs/<spec-id>.md` for one behaviour of one story. Its front matter has `id` and `story`. |
| case | One `###` section of a spec. Its id is `<spec-id>/<case-id>`, and the heading text is the `<case-id>`. The unit of a behaviour run and of coverage. An optional `case` block holds its fields. |
| kind | A set of defaults for a case: `unit`, `integration`, `check`, `property`, `migration`, `live-agent`, or a product kind in `behaviour/kinds/<id>.yaml`. |
| binding | The link from a case to its test code: the marker `orbtest: <spec-id>/<case-id>` in a comment of the test file, and the reported test name. |
| sidecar | `orbtest/behaviour/bindings/<spec-id>.yaml`: the bindings of one spec, their hashes, and their anchors. Only the CLI writes it. |
| anchor | `{ commit, run, at }` and the hashes of the last confirmed pass. A UI task keeps it in its `confirmed` field. A behaviour case keeps it in the `confirmed` field of its sidecar entry. |
| place | Where an environment runs: `local` (built-in, this machine), `ssh` (another machine), `docker` (a container), or `command` (a product program that implements the place protocol). `orbtest/places/<id>.yaml` is shared; `orbtest/.local/places/<id>.yaml` is machine-local and wins. |
| behaviour fixture | A recipe `orbtest/behaviour/fixtures/<id>.yaml`, or a script `<id>.mjs` or `<id>.sh`, that builds real state for a case. |
| harness | `orbtest/behaviour/harness/`: the arbitrary support code of the product for its behaviour tests. |
| healer | The self-healing agent runner: `flint orbtest behaviour heal`. It gives one verdict per failed case. |
| criterion address | `<story-id>#<n>`, **0-based**, as the CLI writes it in `proves` and in `coverage`: `access.sign-in#0` is the first criterion. It is the criterion number minus one. |
| requirement | One file, `orbtest/requirements/<id>.yaml`. One machine requirement per file. `doctor` checks every requirement that reaches the profile: a requirement with no `profiles` field, or one whose `profiles` field names the profile or its environment. |
| platform family | The `platform` field of the UI profile: `web`, `terminal`, `desktop`, or `mobile`. It selects the driver, and the columns of `skills --section atoms` and `--section locators`. `mobile` has no driver; a run on it exits 3. |
| test-id | The task `id`, for example `home.sign-in`. |
| story-id | The story `id`, for example `access.sign-in`. |
| criterion number | The 1-based position of a criterion in the story `acceptance` list, as the Mesh writes it in `(Test)` `covers` and in `(Story)`. The CLI is 0-based: `story criterion set <id> <n>` takes the number minus one, and the criterion address `<story-id>#<n>` is the number minus one. Never reorder criteria once a `(Test)` covers one. |
| suite-id | The suite `id`, for example `pages.main`. |
| cell | One suite entry on one profile, written `<suite>/<entry>/<profile>`. |
| run-id | The name of one folder under `orbtest/.local/runs/`. A task run is `<time>`, for example `2026-09-23T17-13-24Z`. A snapshot run is `snapshot-<time>`. An author run and the review bundle of `regen` are `author-<time>`. A doctor run is `doctor-<time>`. `<time>` is the UTC start time, `YYYY-MM-DDTHH-MM-SSZ`. A behaviour run is `behaviour-<UTC time with milliseconds>-<8 hex>`, for example `behaviour-2026-09-27T09-12-30-123Z-3f9a1c2b`. Every kind sits in the same directory. Never make a run-id by hand: take the path from the line the command prints (see Commands). |
| brief | The authoring request, `orbtest/ui/briefs/<task-id>.yaml`, written with `brief add`. See [[dev-knw-ot-authoring]]. |
| components map | `orbtest/ui/briefs/<task-id>.components.json`, written with `components set`: a locator description to the file that renders it. |
| fixture | A file that a UI journey uploads or reads, `orbtest/ui/fixtures/<name>`, written with `fixture add`. A definition names it `ui/fixtures/<name>`. It is not a behaviour fixture. |
| bundle | `bundle.json` that `author`, `run --freeze`, and `regen` write under `.local/runs/`. `register` reads it. |
| worker | One set of services and one working directory, `orbtest/.local/services/workers/<n>/` by default. Worker 0 serves every run with no `--jobs`. `parallel.worker_dir` is a field of the environment. Two profiles that name the same environment share their workers, and so do two environments with the same `parallel.worker_dir`. |
| component | A step field: a path relative to the product root, for example `src/components/auth-gate.tsx` or `../cli/src/commands/note.ts`, or `external:<platform>:<locator>`. The scaffold step `nav.goto` ships `component: unknown`; `validate` accepts it and `drift` cannot diff it. |
| gate run | A whole-profile `run`, a `snapshot`, or `drift --check` on a `blocking` profile whose exit code decides a release. A run with `--task`, `--story`, or `--watch` is never a gate run. |
| checkpoint | A point where the workflow stops and the human decides in the Orbh session. |

## Test Lifecycle

A `(Test)` records one UI task (`layer: ui`) or one behaviour spec (`layer: behaviour`). Both layers use the same statuses:

```
registered → confirmed → stale → confirmed
registered → stale
any status → retired
```

A `registered` task becomes `stale` when a step it invokes gets `stale: true` before any `run --confirm` anchored the task.

For a behaviour `(Test)`, the statuses come from the case states of its spec (see Behaviour States):

| Status | Behaviour `(Test)` |
|--------|--------------------|
| `registered` | The spec is written, and not every case that proves a criterion is `proven`. |
| `confirmed` | Every case of the spec that proves a criterion is `proven`. |
| `stale` | A case of the spec is `stale` or `suspect`. |
| `retired` | The human removed the spec. Never delete the `(Test)`. |

For a UI `(Test)`:

| Status | Meaning |
|--------|---------|
| `registered` | The task is written and valid. No `run --confirm` has anchored it. A task with an agentic step stays `registered`: freeze it with `run --freeze` and `register --approve`, then confirm. |
| `confirmed` | `run --confirm` met the task with no agentic step, no repair, and no stale step, and wrote `confirmed: { commit, run, at }` into the task. |
| `stale` | The task has `stale: true` (set by `task mark --stale`), or a step it invokes has `stale: true` (written by the harness after a repair, an unresolved locator, or a route mismatch, or by `drift`), or the newest recorded run marks it stale. `drift` writes `stale: true` into step YAML only, never into a task. The record_run skill copies the state into the `(Test)`. |
| `retired` | The task was removed. A human decides. Run `flint orbtest task remove <id> --with-orphan-steps --root <product-root> --dry-run`, show the diff, then run it without `--dry-run`. Commit the files it printed. Set the `(Test)` to `retired` with a Task Log entry, then run [[dev-sk-ot-record_story]] for its story. Never delete the `(Test)`. |

`task list --root <product-root>` prints the state of every task: `confirmed`, `unconfirmed`, `agentic`, or `stale`. `step list --stale` prints the stale steps.

## Behaviour States

A behaviour case has one or more flags. The report keeps every flag that applies and shows the first one in this order: `invalid`, `unbound`, `quarantined`, `waived`, `repaired`, `stale`, `suspect`, `ungated`, `error`, `failing`, `proven`, `passed`, `not-run`.

| Case state | Meaning |
|------------|---------|
| `invalid` | The case block does not parse, or the case id is a duplicate. The other cases of the spec still load and run. |
| `unbound` | The case has no test code and no check objects. |
| `quarantined` | The healer took the case out of the gate: it is flaky, or it needed a second heal in a row. |
| `waived` | A human excluded the case with a reason, an owner, and an end date. The waiver ends at 00:00 UTC after its `until` date. |
| `repaired` | The healer changed the test. It waits for the review of a human. |
| `stale` | The words, a component, a proven criterion, or the binding changed after the anchor. |
| `suspect` | The test text changed after the anchor. |
| `ungated` | A gate field (`protects`, `regression`, `oracle`, `owner`) is missing. The case still runs. |
| `error` | Setup failed: a fixture, a hook, the runner, or no result. It says nothing about the product. |
| `failing` | The newest run failed. |
| `proven` | The case is confirmed, and its newest run passed on the first attempt with `asserted` or `captured` evidence. |
| `passed` | The newest run passed, and the case has no anchor. |
| `not-run` | No run has the case. |

A case that is `invalid`, `unbound`, `quarantined`, `waived`, `repaired`, `stale`, `suspect`, or `ungated` cannot prove a criterion. A retry pass (a pass after a failed attempt in the same run) and `claimed` evidence alone cannot prove either. A later clean first-attempt pass with `--confirm` restores proof.

| Criterion state | Decided in this order |
|-----------------|-----------------------|
| `failing` | A linked case or UI task is actively failing. |
| `proven` | Else a linked case or UI task gives eligible proof. |
| `stale` | Else a linked case is a stale candidate. |
| `gap` | Else no case and no UI task names the criterion. |
| `waived` | Else every linked case is waived. |
| `not-run` | Else. |

`flint orbtest coverage --root <product-root>` prints these states for both layers. The details are in [[dev-knw-ot-behaviour]], States.

## Run Lifecycle

A `(Run)` has no status. Its copied fields never change. Only `tests` and the Unrecorded tasks list change, when a `(Test)` is created later for a task the run covered. The field sources are in [[dev-knw-ot-records]]. A `(Run)` records a UI task run only. A behaviour run has no `(Run)`: the behaviour `(Test)` names the run id and the report path in its Task Log.

## Story Coverage

A `(Story)` has no status. It copies `story-id`, `tier`, `stale`, and `acceptance` from the story, and the state of each criterion from `flint orbtest coverage --root <product-root> --story <id> --json`, which counts both layers. A `(Test)` of either layer names its story in `story` and the criteria it proves in `covers`, with 1-based numbers. A criterion is covered when its state is `proven`. The `(Story)` also counts the covered criteria per layer. Only [[dev-sk-ot-record_story]] rewrites the coverage. A story with a criterion in `gap` is a gap; the `gaps` workflow fills it with a UI test or a behaviour case.

## Suite Lifecycle

```
new → approved → failing → approved
approved → new
any status → retired
```

| Status | Meaning |
|--------|---------|
| `new` | No baseline is proven yet. |
| `approved` | The baselines are approved and a later snapshot run proved them. |
| `failing` | The newest recorded snapshot run did not pass. |
| `retired` | The suite was removed. A human decides. Run `flint orbtest suite remove <id> --root <product-root> --dry-run`, show the diff, then run it without `--dry-run`. It deletes the suite and `ui/baselines/<id>/` unless `--keep-baselines` is given. Commit the files it printed. Set the `(Suite)` to `retired` with a Task Log entry. Never delete the `(Suite)`. |

The rule that sets `new`, `approved`, or `failing` is written once, in [[dev-knw-ot-records]], Suite Status From the Records. [[dev-sk-ot-record_suite]] applies it. Only a human sets `retired`.

## Release Lifecycle

```
green → disputed
any status → retired
```

| Status | Meaning |
|--------|---------|
| `green` | Every gate passed at the commit: one whole-profile run per blocking profile with no unmet task, one snapshot run per suite with every cell `pass`, and `drift --check` at exit 0, all with `definitions.commit` equal to the release commit. Only [[dev-sk-ot-record_release]] writes it. |
| `disputed` | A later whole-profile run or snapshot run at the same commit did not pass. [[dev-sk-ot-record_run]] or [[dev-sk-ot-record_suite]] wrote it and named the run in `disputed-by`. The facts of the release do not change. |
| `retired` | By hand only. |

## Commands

Exit codes come from `apps/orbtest-cli/src/support/exit-codes.ts` and are printed by `flint orbtest skills --section commands`. Every command that reads or changes a folder takes `--root <product-root>`. `skills` is the one exception: it reads no folder, and it refuses `--root` with exit 2. The path flags `--brief`, `--bundle`, `--from-run`, `--components` (a file path), and `page --out` resolve against the current directory, not against `--root`: from the Flint root write `<product-root>/orbtest/...`, or give an absolute path. `run` and `regen` default `--profile` to the only profile, and `author` to the `profile` of the brief, so give `--profile <id>` when the product has more than one profile. `doctor` with no `--profile` checks every profile; the workflows give `--profile <id>` to check one.

| Code | Meaning |
|------|---------|
| 0 | Done: valid, met, written, green, or identical. |
| 1 | Unmet: a blocking task or cell did not pass, the agent did not achieve the brief, the drift gate failed, a regen replay failed, or `check` found a folder older than this CLI. Exit 1 is never a usage error. |
| 2 | Refused, and nothing is written: a usage error on any command (an unknown command or option, a missing argument or option value, a bad number such as `--jobs abc`), the definitions do not load, an id is unknown or is not a plain name, the planned change is invalid, `register` without `--approve`, a regen result that needs review, a folder malformed for its own format, or a write command on a folder older than this CLI. Also an unexpected fault in orbtest (`ORBTEST_INTERNAL`). |
| 3 | Environment: services, browser, driver, git, agent, a page that could not be written or opened, a folder that declares a format newer than this CLI reads, a worker that another live command holds (`ORBTEST_WORKER_BUSY`), or an unexpected system error such as `EACCES` (`ORBTEST_SYSTEM`). |

An unexpected error prints one line that names it. `DEBUG=1` before the command prints the stack trace. When `flint orbtest` refuses a command or a flag that this shard names with `unknown command` or `unknown option`, the `flint` binary is older than this shard. A current CLI exits 2 on that error, and a binary from before the usage error rule exits 1. Stop, and ask the human to update the binary. An older binary also gives other exit codes than this shard names: for example, its plain `doctor` has no `skipped` line, so it exits 3 on a profile with `setup.start` when no service runs. A binary from before the layout of this shard reads only the first layout of format 0.0.1. On a folder in the current layout, its `check` exits 2: it asks for the profile folder at the root, and it names `environments` and `ui` as stray entries. It has no `environment` command. Do not move the folder back. Ask the human to update the binary.

**Where a run is.** Never make a run path by hand. Take it from what the command prints:

| Command | The line to read |
|---------|------------------|
| `run`, `snapshot` | `report <path>`: `<path>` is `<run dir>/report.html`. The run directory is the folder of the file. |
| `author` | The line that ends with `/bundle.json`: `<absolute product root>/orbtest/.local/runs/author-<time>/bundle.json`. It is the last line on stdout. Hint lines and error lines go to stderr and can come after it in a terminal. The run directory is the folder of the file. With `--json` the bundle goes to stdout; take `run` from it. |
| `regen` | On exit 2, the error line ends with `review bundle: <dir>`, and the hint lines name the next command. On exit 1, `regen --task` ends its error line with `review bundle: <dir>`, and `regen --step` names the directory in the hint line `Open <dir>/run.json.` |
| `run --freeze` | `freeze <task-id>: ... review with register --bundle <dir>`. |
| `behaviour run` | `report <path>`: `<path>` is `<run dir>/report.html`, and the run directory `behaviour-<time>-<hex>` is the folder of the file. With `--json` the line goes to stderr, and stdout holds one JSON value. |

**Worker lock.** `run`, `snapshot`, `author`, `regen`, and `doctor --start` take the lock file `orbtest.lock` in each worker directory they use, from before `parallel.prepare` until they exit. `run --jobs <n>` takes one lock per worker. Two profiles that share a worker directory share its lock. A second command on a held worker exits 3 with `ORBTEST_WORKER_BUSY` and one line that names the holder pid and command. This exit is not a result of the product: wait until the holder ends, then run the command again. A lock whose pid no longer runs is stale: the next command takes it and prints one line. Other commands take no lock. A command stops only the services it started: a service that was ready before the command is reused and left running, and a `setup.stop` command runs only when the command started a service.

Commands the shard runs:

| Command | Exit codes and notes |
|---------|----------------------|
| `flint orbtest check --root <product-root> [--json]` | 0 the folder is current. 1 the folder is older than this CLI: upgrade it. 2 the folder is malformed for its own format: a missing required folder or file, a stray entry at the root or under `ui/`, or a machine-local entry git would commit; also the first layout of format 0.0.1 (the move list, see Version Handshake), `orbtest/` is absent, `orbtest.toml` is unreadable, or the declared format is not one this CLI knows. 3 the folder declares a format newer than this CLI reads. Never writes. A missing gitignore line, a missing advised folder, and an ignore check git could not answer are warnings, and never change the exit code. |
| `flint orbtest upgrade --root <product-root> [--dry-run] [--to <format>] [--json]` | 0 written and valid. 2 refused: the tree under the product root is dirty or is not a git repository, the folder is already at the target (also a folder in the first layout of format 0.0.1), it is newer than the target, its format is not one this CLI knows, `--to` is not a target in the chain, the chain has a gap, the folder cannot be migrated as it is, or the planned result does not load or does not validate and nothing was written. `--dry-run` prints the operations and the notes and writes nothing. |
| `flint orbtest validate --root <product-root>` | 0 valid, warnings allowed. An environment that no profile names is a warning. 2 refused: also a field in the wrong half (the line names the right file), a profile that names an environment that does not exist, an environment id that is not a plain name, or the first layout of format 0.0.1. The summary line counts profiles and environments. |
| `flint orbtest doctor --root <product-root> --profile <id>` | 0 every check passes or is skipped. 3 a check failed. Plain `doctor` starts no service and takes no lock. It checks the requirements that reach the profile or its environment. On a profile whose environment has `setup.start` or `setup.local_start`, it reports `setup verify` (and `app version` when the environment has `version_check`) as `skipped`, with a line that names `doctor --start`; a skipped check is not a failure. Plain `doctor` creates worker 0's directory under `orbtest/.local/services/workers/` and does **not** run `parallel.prepare`. |
| `flint orbtest doctor --root <product-root> --profile <id> --start [--keep-services]` | 0 all checks pass with the services up. 3 a check failed, or `ORBTEST_WORKER_BUSY`. Takes the worker lock, runs `parallel.prepare`, starts the `setup.start` services, checks them for real, and stops them again unless `--keep-services` is given. |
| `flint orbtest doctor --root <product-root> --profile <id> --setup [--setup-target <runtime/profile>]` | 0, 3. Provisions the machine from the requirements through one Orbh session, then checks again. Only after the human consents. |
| `flint orbtest run --root <product-root> --profile <id> --task <id...> [--json]` | 0 met, 1 unmet, 2 refused, 3 environment or `ORBTEST_WORKER_BUSY`. Every run writes `.local/runs/<run-id>/report.html` and prints `report <path>`. The summary line prints `confirmed - (no --confirm)` on a run with no `--confirm`. |
| `flint orbtest run --root <product-root> --profile <id> --task <id> --freeze [--components <json-or-file>]` | Same codes. After a met run, the agentic steps with a trace become deterministic steps, and a freeze bundle is written at `.local/runs/<run-id>/<task-id>/bundle.json`. |
| `flint orbtest run --root <product-root> --profile <id> --task <id> --confirm` | Same codes. 2 when the product tree is dirty or not in git. Writes `confirmed` into each met deterministic task. The summary line prints `confirmed <n>`, the number of tasks this run anchored. |
| `flint orbtest run --root <product-root> --profile <id> --story <id...> [--confirm]` | Same codes. |
| `flint orbtest run --root <product-root> --profile <id> [--jobs <n>] [--confirm]` | Every task of one profile. A gate run. `--jobs` takes a whole number of 1 or more, else exit 2, and needs `parallel` on the environment of the profile. |
| `flint orbtest run --root <product-root> --profile <id> --task <id> --watch [--slow <ms>] [--hold <ms>]` | Shows the run on the display. One worker. 2 with `--confirm` or `--jobs`. 3 with no display. Never a gate run. |
| `flint orbtest author --root <product-root> --brief <file> [--profile <id>] [--components <json-or-file>] [--from-run <dir>] [--json]` | 0 achieved and met, 1 not achieved (bundle still written), 2 refused, 3 no agent or `ORBTEST_WORKER_BUSY`. Writes `.local/runs/author-<time>/bundle.json` and `report.html`, and prints the path of `bundle.json` as the last line on stdout. `--components` takes inline JSON (text that starts with `{`) or the path of a JSON file, for example the components map `<product-root>/orbtest/ui/briefs/<task-id>.components.json`. `--from-run` converts the trace of an earlier author run again and runs no agent. |
| `flint orbtest register --root <product-root> --bundle <dir>` | 2 always: prints the diff and writes nothing. |
| `flint orbtest register --root <product-root> --bundle <dir> --approve` | 0 written and valid. 2 refused, and nothing written: also when a task id or a new step id in the bundle is not a plain name. An author bundle adds steps and a task. A freeze bundle replaces the agentic steps of a task. A regen bundle sets fields. An `env://NAME` input stays a reference; no value is written. |
| `flint orbtest drift --root <product-root> [--profile <id>] [--task <id...>] [--json]` | 0 report printed and `stale: true` written to the newly stale steps. 2 refused. 3 git missing. |
| `flint orbtest drift --root <product-root> --check` | 0 gate green. 1 a blocking task is stale or unconfirmed. 2 refused. 3 git missing. Writes nothing. |
| `flint orbtest regen --root <product-root> --profile <id> --step <id> --task <id>` | 0 identical and marks cleared. 1 the replay or the agentic step failed. 2 the result differs and a review bundle is written. 3 no agent or `ORBTEST_WORKER_BUSY`. |
| `flint orbtest regen --root <product-root> --profile <id> --task <id>` | Re-authors the task from its description. Same codes. `register` refuses a bundle whose task id exists, so a different result replaces the task only after a retire; the hint lines of exit 2 name the commands. |
| `flint orbtest snapshot --root <product-root> [--suite <id...>] [--profile <id>] [--entry <id...>] [--json]` | 0 no `fail` or `error` cell on a blocking profile, `new` cells allowed. 1 one is. 2 refused. 3 environment or `ORBTEST_WORKER_BUSY`. Prints `report <path>`. |
| `flint orbtest approve --root <product-root> --run <snapshot-run-id> [--cell <suite/entry/profile...>] [--by <name>]` | 0 approved, or nothing to approve. 2 refused: also a cell whose suite, entry, or profile is not a plain name, and a folder older than this CLI. |
| `flint orbtest page --root <product-root> [--open] [--out <path>]` | 0 written. 2 bad `--out`. 3 not written or not opened. The default page is `<product-root>/orbtest/.local/runs/page/index.html`. A relative `--out` resolves against the current directory, not against `--root`; give an absolute path. |
| `flint orbtest init --root <product-root> [--platform <web\|terminal\|desktop>] [--base-url <url> \| --port <n>] [--force]` | 0 scaffolded: the layout of format 0.0.1, with one environment and one UI profile of the same id. 2 an existing `orbtest/` without `--force`, an unknown platform, `--base-url` or `--port` on a platform that is not `web`, or a bad flag. The default platform is `web`. Each `next:` line it prints is a command with `--root <absolute path>`: `profile set` for a field of the UI profile, `environment set` for a field of the environment. The scaffolds are in [[dev-wkfl-ot-init]], Stage 2. |
| `flint orbtest init --root <product-root> --layer behaviour` | 0 scaffolded: the smallest behaviour layer, in a new `orbtest/` or beside an existing UI layer: `orbtest.toml`, the `.gitignore` lines, the environment `local` that runs on this machine, the example story, and the example spec `example.hello`, whose one case needs no test code, so `behaviour run` passes at once. Replace the example with the first real spec; a human decides the removal of the example story. 2 the behaviour scaffold exists, a UI flag (`--platform`, `--base-url`, `--port`) with `--layer behaviour`, or an unknown layer. With no `--layer`, `init` scaffolds the UI layer. |
| `flint orbtest skills [--section <name>] [--json]` | 0. 2 unknown section, or `--root`. The sections are `atoms`, `fixtures`, `locators`, `platforms`, `steps`, `tasks`, `stories`, `profiles`, `verification`, `checks`, `sources`, `suites`, `commands`, `run-layout`, `behaviour`. `--section behaviour` prints the spec fields, the kinds with their defaults, the runners, the slot variables, and the states. |
| `flint orbtest coverage --root <product-root> [--story <id>] [--layer ui\|behaviour\|all] [--json]` | 0 report printed. 2 refused. One state per criterion of each story from both layers (`--layer all` is the default), the cases and UI tasks under each criterion, the orphans, the unaccounted test files, the quarantined cases, and the repaired cases. Writes nothing. |

Commands of the behaviour layer. Every one takes `--root <product-root>`, and every one reads the behaviour layer only. The exit codes are the table above: 0 done, 1 unmet, 2 refused and nothing written, 3 environment.

| Command | Exit codes and notes |
|---------|----------------------|
| `flint orbtest behaviour list --root <product-root> [--story <id>] [--kind <k>] [--json]` | 0. The specs and their cases, with kind, criteria, and state. Writes nothing. |
| `flint orbtest behaviour show <spec-id or case-id> --root <product-root> [--json]` | 0, 2 unknown id. One spec with its cases, or one case: the fields, the gate, the binding, the anchor, the flags, and the newest result. Writes nothing. |
| `flint orbtest behaviour run --root <product-root> [--spec <id...>] [--case <id...>] [--story <id...>] [--kind <k...>] [--environment <id>] [--place <id>] [--jobs <n>] [--confirm] [--keep-scratch] [--resume <run-id>] [--json]` | 0 no case of a blocking story ended `fail`, `error`, or `budget_exceeded`. 1 one did. 2 refused before any write: a bad argument, an unknown id, an unsafe path, or `--confirm` on a dirty tree. 3 the place check or the `stage` hook failed before any case. Writes the run folder and prints `report <path>`. `--confirm` anchors each passed deterministic case in its sidecar. `--resume` continues a run, also on another controller or place. |
| `flint orbtest behaviour bind --root <product-root> [--json]` | 0. Reports the markers and the sidecars, and writes nothing. |
| `flint orbtest behaviour bind --root <product-root> --scan [--json]` | 0 written. 2 refused. Reads the markers and writes the sidecars. Keeps every anchor. Prints each file it wrote. |
| `flint orbtest behaviour bind --root <product-root> --check [--json]` | 0 every sidecar is current, every marker names a case, and no case has two markers. 1 one is not. Writes nothing. `--scan` and `--check` together exit 2. |
| `flint orbtest behaviour drift --root <product-root> [--check] [--json]` | 0 report printed. With `--check`: 1 when a case of a blocking story is stale or unconfirmed. 3 git cannot diff a component of an anchored case. Writes nothing. |
| `flint orbtest behaviour heal --root <product-root> [--run <run-id>] [--case <id...>] [--apply] [--target <runtime/profile>] [--json]` | 0 a verdict for each case. 2 refused: also an unknown run. 3 no agent. Writes one heal record per case under `<run dir>/heal/`. Without `--apply` it changes no test. With `--apply` it applies each `test_wrong` patch that no rule refused, and the case becomes `repaired`. It may rebuild a fixture once and quarantine a flaky case alone. Each call asks the agent again and replaces the heal records of the run, so never run it again to apply a patch that a human approved: [[dev-wkfl-ot-heal]], Stage 4, applies the stored patch. |
| `flint orbtest behaviour fixture list --root <product-root>` | 0. The fixtures, with form, `uses`, and cache. |
| `flint orbtest behaviour fixture build <id> --root <product-root> [--place <id>]` | 0 built and verified. 1 the build or the verify failed. 2 unknown id. 3 the place failed. Builds in a scratch folder only. |
| `flint orbtest behaviour fixture author --root <product-root> --brief "<state in words>" [--id <id>] [--target <runtime/profile>]` | 0 a recipe proposed. 1 the agent proposed no valid recipe. 2 an empty brief or a bad id. 3 no agent. An agent can try the steps in a scratch folder, and the CLI writes the proposal, the brief, the prompt, and the reply under `.local/runs/fixture-author-<time>/`, never under `behaviour/fixtures/`. After the human approves the recipe, the agent copies it to `behaviour/fixtures/<id>.yaml` and commits it. |
| `flint orbtest behaviour place list --root <product-root>` | 0. The built-in `local` place, the shared places, and the machine-local places. |
| `flint orbtest behaviour place show <id> --root <product-root>` | 0, 2 unknown id. |
| `flint orbtest behaviour place check <id> --root <product-root>` | 0 the place is reachable and its tools are present. 3 not. |
| `flint orbtest runs prune --root <product-root> --kind behaviour [--keep <n>]` | 0. Prunes behaviour runs. A run that a sidecar anchor names always stays. |

## Changing Definitions

Every change under `orbtest/` is `flint orbtest <kind> <verb> [id] [args]`, except the files of the behaviour exception in Boundary, which the agent writes with its own tools. The verbs are `list`, `show`, `add`, `set`, `unset`, `rename`, `remove`, and for steps and tasks `mark`. A kind has only the verbs that apply to it.

- A UI task proves a criterion only through its field `proves`: a list of 0-based criterion addresses of its own story, for example `task set <id> 'proves=["access.sign-in#0"]'`. Story membership alone proves no criterion. The `(Test)` of the task lists the same criteria in `covers` with 1-based numbers.

- `set <id> <path>=<value> [...]` changes any field. `<path>` is dotted. `<value>` is YAML. `--file <json|yaml>` gives the value of one bare `<path>`. `unset <id> <path>` deletes a key.
- A profile has two halves, and each half has its own kind. `profile set|unset` changes the UI profile. `environment set|unset` changes the environment. A field in the wrong half is refused with exit 2, and the message names the command that owns the field: `profile set <id> base_url=...` names `environment set <environment> base_url=<value>`. `profile set <id> environment=<environment-id>` makes the profile name another environment.
- Because `<value>` is YAML, text that YAML reads as a boolean, a number, or null must be in quotes: `'seeds.default.command="true"'`, not `seeds.default.command=true`, which the command refuses with exit 2 and `Expected string, received boolean`. The text fields of a requirement are the one exception (see below).
- `set` and `unset` refuse `id`, `confirmed`, and `fingerprint`. `stale` and `suspect` are set with `mark`: `step mark --stale|--suspect|--clear`, `task mark --stale|--clear`. `task mark` has no `--suspect`.
- `--dry-run` prints the diff and writes nothing. Show the diff to the human before a write the human did not approve yet.
- `rename` rewrites every reference. `remove` refuses while a reference exists and names it.
- Every `<n>` index is 0-based. `list` and `show` print it.
- A write command prints each file it changed. Commit exactly those files.
- An id names a file, so it must be a plain name: not empty, no `/` or `\`, no `..`, no leading `.`, no control character, and at most 200 bytes. `validate`, `approve`, `register`, and every `brief` and `components` verb refuse any other id with exit 2 and write nothing.
- A path in a `files` parameter of a fixture or an upload is relative to the definitions root and stays inside it, so a fixture is `ui/fixtures/<name>`. An absolute path, or a path that leaves the root, is refused.
- The text fields of a requirement (`name`, `check`, `guidance`, `version.command`, `version.expect`) stay text on the command line: `check=true` writes the string `"true"`.

| Kind | Verbs |
|------|-------|
| `profile` | The UI profile, `ui/profiles/<id>.yaml`. `list`, `show`, `add --platform <web\|terminal\|desktop> \| --from <id> \| --file <path> [--environment <id>]`, `set`, `unset`, `rename`, `remove`. `add --platform` writes both halves with the same id; with `--environment <id>` it writes the UI profile only and names that environment. `add --from <id>` copies the UI profile and names the same environment. `add --file` takes a whole profile and writes its environment fields to the new environment. `show` prints the resolved profile and names both files. `rename` keeps the environment id. `remove` keeps the environment. `set agent.target=<runtime/profile>` checks the Orbh profiles. |
| `environment` | The environment, `environments/<id>.yaml`. `list`, `show`, `add --platform <web\|terminal\|desktop> \| --from <id> \| --file <path>`, `set`, `unset`, `rename`, `remove`. `show` names the profiles that name the environment. `rename` rewrites the `environment` field of every profile that names it; it refuses while a requirement names the old id and no profile has that id, and names the requirement. `remove` refuses while a profile names it. The behaviour fields (`place`, `isolation`, `hooks`, `vars`, `allow_dirty_remote`) are set with `set` too; a behaviour environment needs only its `id`. |
| `requirement` | `list`, `show`, `add`, `set`, `unset`, `remove`, each with `--in <file>` for another requirements file. The `profiles` field of a requirement names profile ids or environment ids. |
| `settings` | `show`, `set <table.key>=<value>`, `unset <table.key>`, for `agent.target` and `runs.keep` in `orbtest.toml`. `show` prints `orbtest.format` too. `set` and `unset` refuse `orbtest.format`: `init` and `upgrade` own it. |
| `services` | `set <name> <path>=<value>`, `remove <name>`, for the machine-local services file under `orbtest/.local/services/` that `setup.local_start` of the environment names. `--profile <id>` picks the environment of that profile. Refused while git would commit the file. |
| `secret` | `list`, `add <name...>`, `enter [name...]`, for the names in `orbtest/.local/secrets`. No command prints a value. |
| `step` | The steps, `ui/steps/<prefix>.yaml`. `list [--task <id>] [--file <path>] [--stale] [--unused]`, `show`, `set`, `unset`, `rename`, `remove`, `mark`. New steps come only from `register`. |
| `task` | The tasks, `ui/tasks/<id>.yaml`. `list [--story <id>] [--profile <id>] [--stale] [--unconfirmed]`, `show`, `set`, `unset`, `rename`, `remove [--with-orphan-steps]`, `mark`, `step add\|set\|remove`, `check add\|list\|remove`, `negative add`. New tasks come from `register` and `task negative add`. |
| `story` | The stories, `stories/<prefix>.yaml`. `list`, `show`, `add <id> --name <text> --story <text> [--tier <tier>]`, `set`, `unset`, `rename`, `remove [--unbind]`, `criterion add\|set\|remove`. |
| `suite` | The snapshot suites, `ui/suites/<id>.yaml`. `list`, `show`, `add`, `set`, `unset`, `rename`, `remove [--keep-baselines]`, `entry add\|set\|unset\|remove`, `mask add\|remove`. |
| `baseline` | The baselines, `ui/baselines/<suite>/<entry>/<profile>.png` and `.json`. `list [--suite <id>]`, `remove <suite> [entry] [profile]`, `prune`. `approve` is the only writer of a baseline. |
| `runs` | `prune [--kind run\|author\|snapshot\|doctor\|behaviour] [--keep <n>]`. A snapshot run that a baseline names always stays. A behaviour run that a sidecar anchor names always stays. Every other run kind, snapshot runs and behaviour runs included, is pruned. |
| `brief` | The briefs, `ui/briefs/<id>.yaml`. `list`, `show`, `add`, `set`, `unset`, `rename`, `remove`. |
| `components` | The components map of a brief, `ui/briefs/<id>.components.json`. `set <brief-id> <locator> <path>`, `remove <brief-id> <locator>`. |
| `fixture` | The fixtures, `ui/fixtures/<name>`. `add <source> [--as <name>] [--force]`, `list`, `remove <name>`. |

Field shapes come from `flint orbtest skills --section <name>`. `skills --section profiles` has one table for the environment, one for the UI profile, and one for a requirement. Do not copy them into the Mesh.

## Choosing a Workflow

| Layer | Phase | Workflow | When |
|-------|-------|----------|------|
| UI | Adopt | [[dev-wkfl-ot-init]] | The product has no `orbtest/`, or a new machine must run a product that has one. |
| Both | Plan | [[dev-wkfl-ot-stories]] | Nothing says what the product must test. |
| UI | Author | [[dev-wkfl-ot-tasks]] | One request becomes one registered and confirmed UI test. |
| Behaviour | Author | [[dev-wkfl-ot-behaviour]] | One behaviour of a story needs proof: design the environments and fixtures, write the spec, write the bound test, see it fail first, bind, run, confirm, record. Also to adopt the behaviour layer in a product. |
| Both | Reconcile | [[dev-wkfl-ot-gaps]] | Find what the product serves that no story describes, what no criterion has proof for, and what no longer exists. |
| UI | Repair | [[dev-wkfl-ot-repair]] | `drift` marked steps stale, or a UI run failed after a product change. |
| Behaviour | Heal | [[dev-wkfl-ot-heal]] | Behaviour cases fail, error, or went stale: run the healer, review each verdict and repair, record. |
| Behaviour | Audit | [[dev-wkfl-ot-audit]] | Test files that no case binds, or cases of low value: find them, keep what guards a contract, bind it, and remove the rest with evidence. |
| UI | Snapshot | [[dev-wkfl-ot-suites]] | Screens must keep looking the same. Also to extend a suite or re-baseline it after a failed run. |
| UI | Release | [[dev-sk-ot-record_release]] | A human ran the gate at one commit and wants the `(Release)`. |

The skills are atomic. [[dev-sk-ot-add_negative_control]] follows the first confirmed task of a story. [[dev-sk-ot-add_check]] tightens a final verification. [[dev-sk-ot-record_run]], [[dev-sk-ot-record_story]], and [[dev-sk-ot-record_suite]] bring the Mesh up to date after a run outside a workflow.

## Artifact Numbers

`flint helper type newnumber <Type>` is not safe across concurrent sessions. Mint the number right before you write the file, and check that no file with that number exists. When another session works on the same type, agree a range by message first.

## Dashboards

| Dashboard | Purpose | Maintained by |
|-----------|---------|---------------|
| `(Dashboard) Tests.md` | Tests of both layers by story, uncovered criteria, tests without a story, recent runs, suites, and releases, each with its product root. It reads the Mesh only: a criterion is covered there when a confirmed `(Test)` lists it. `flint orbtest coverage` is the source of truth for criterion states. | DataviewJS |

## Scripts

| Script | Command | Output |
|--------|---------|--------|
| lint | `flint shard ot lint` | Checks every `flint orbtest` invocation in the shard files against `skills --section commands --json`. It reads the command tree from a standalone launcher of the orbtest CLI when that file exists (default `../Repos/flint/apps/orbtest-cli/bin/orbtest.js`, a checkout of the Flint repository beside this Flint), else from `flint orbtest`. `ORBTEST_CLI` overrides both. Exit 0 when every command and flag exists. Exit 1 with one line per unknown command or flag. Exit 2 when no CLI answered. `--verbose` prints which CLI it read and the invocation count. |

# Headless

A headless or subagent Orbh session has no person at the terminal. It loads this init with `flint shard start ot`, as an interactive session does. The two layers, the boundary, the terms, the states, the lifecycles, and the commands above do not change. Follow the `> [!headless]` callouts of each workflow.

The main rule of Boundary holds without a human: never create, edit, or delete a file of the UI layer or of the shared folders under `orbtest/` by hand. The one exception is the behaviour layer: you write specs, test code, harness code, fixtures, kinds, and place files with your own tools, per Boundary. Only the CLI writes the sidecars and the runs. Read [[dev-knw-ot-behaviour]] before any behaviour work.

Headless, a decision that the interactive behaviour workflows give to a human is a question: the words of a new spec, an environment design, a fixture recipe, an audit deletion. A heal patch is the one exception: the healer may apply a `test_wrong` patch alone, because the case then stays `repaired` until a human accepts the diff. Never run `--confirm` on a `repaired` case headless.

## Version Handshake, Headless

`flint orbtest check --root <product-root>` is the first command of every workflow and of every skill, as in Version Handshake above. On a product with no `orbtest/` folder, the `init` and `behaviour` workflows scaffold first and run `check` after the scaffold. Headless, you never ask a human to repair a folder. You report and you stop.

| Exit | What you do headless |
|------|----------------------|
| 0 | Continue with the stage. |
| 1 | Run `flint orbtest upgrade --root <product-root> --dry-run`. Set `phase blocked` and `blockers "orbtest/ under <product-root> is older than the CLI"`. A root or manager session asks one approval question with the operations and the notes as the body. A subagent returns the same text and stops. Run `flint orbtest upgrade --root <product-root>` only after the approval, then `check` again and expect 0. |
| 2 | Stop. Set `phase blocked` and `blockers "orbtest/ under <product-root> is malformed"`. Return the whole `check` output, every finding line included. Never repair the folder by hand. A move list of the first layout of format 0.0.1 is exit 2 too: only a human moves that folder, per Version Handshake above. Do not run `upgrade`; it has no step for that move. |
| 3 | Stop. Set `phase blocked` and `blockers "the flint binary is older than orbtest/ under <product-root>"`. Return the whole `check` output. Only a human updates the binary. |

`--json` gives the report as one document when the result goes into a message or a session key. The `format` key is never changed by hand and never with `settings set`.

## What Changes

Each workflow has the same stages, the same commands, and the same outputs in both modes. Only the checkpoints change, in the `> [!headless]` callouts of each stage:

| Workflow | Checkpoints in a headless session |
|----------|-----------------------------------|
| [[dev-wkfl-ot-init]] | The proposal of the environment and the UI profile with its Products row, and the provisioning consent, are questions. |
| [[dev-wkfl-ot-stories]] | A new story needs no approval: `story add` runs before the question. The journey plan and the spec plan are one question. |
| [[dev-wkfl-ot-tasks]] | None. The review block goes into the result. |
| [[dev-wkfl-ot-gaps]] | The gap report and the fill plan are one question. |
| [[dev-wkfl-ot-repair]] | None when every regen is identical and nothing is retired. One question per regen bundle that differs, and one question per retire. |
| [[dev-wkfl-ot-suites]] | The entry plan and every baseline approval are questions. A baseline approval is always a human decision. |
| [[dev-wkfl-ot-behaviour]] | The environment design and the words of a new spec are one question. A new criterion needs no approval. A dispatch that already approved the words and the environment asks none. |
| [[dev-wkfl-ot-heal]] | None for a verdict, a quarantine, a fixture rebuild, or a `test_wrong` patch. A proposed change of the words, the product, or a fixture recipe goes into the result as a proposal. |

[[dev-wkfl-ot-audit]] runs interactive: an audit deletes tests only after a human approves each batch. Headless, run its read-only stages (Discover and Evidence) and return the ledger.

A command that exits 3 with `ORBTEST_WORKER_BUSY` found a worker that another live command holds; see Commands, Worker lock, above. Headless, run `ps -p <holder pid>`. When the holder has ended, run the command once more. When the holder still runs, set `phase blocked` and `blockers "<the holder line>"`, and return. Never delete a lock file.

The six skills run unchanged: [[dev-sk-ot-record_run]], [[dev-sk-ot-record_story]], [[dev-sk-ot-record_suite]], [[dev-sk-ot-record_release]], [[dev-sk-ot-add_negative_control]], and [[dev-sk-ot-add_check]]. They have no checkpoints.

## Orbh Interface Keys

Do not print progress for a human. Report through the session interface and the update channel.

| Channel | Command | When |
|---------|---------|------|
| phase | `flint orbh session set phase <value>` | At the start of every stage. The values are below. |
| progress | `flint orbh session set progress "stage <n>/<total> · <unit> <k>/<m>"` | At the start of every stage and every loop item. |
| artifacts | `flint orbh session set artifacts "<names>"` | After every Mesh artifact write, for example `(Test) 012 Sign in, (Run) 008 my-app 2026-09-24T10-08-32Z`. |
| blockers | `flint orbh session set blockers "<reason>"` | When `phase` is `blocked`. |
| update | `flint orbh update "<text>" --kind finding\|decision\|completed\|blocker` | A finding worth keeping, a decision you made, a completed stage, a blocker. |

### Phase Values

Every workflow has `complete` and `blocked`. `blocked` means a question is open or a stage failed.

| Workflow | Phases in stage order |
|----------|-----------------------|
| init | `examine`, `scaffold`, `requirements`, `propose`, `write`, `handover` |
| stories | `examine`, `propose`, `decompose`, `author` |
| tasks | `brief`, `explore`, `review`, `register`, `confirm` |
| gaps | `examine`, `classify`, `propose`, `fill`, `refresh` |
| repair | `report`, `triage`, `regenerate`, `confirm` |
| suites | `plan`, `write`, `capture`, `approve`, `prove` |
| behaviour | `examine`, `design`, `spec`, `test`, `bind`, `fail-first`, `run`, `confirm`, `record` |
| heal | `report`, `heal`, `review`, `confirm`, `record` |
| audit (read-only stages) | `discover`, `evidence` |

## Questions and Results

A question is a human decision the workflow cannot make. How you ask depends on your role:

| Role | How |
|------|-----|
| Root or manager session | `flint orbh session set phase blocked`, then `flint orbh approval request "<title>" --body "<proposal>"`, then `flint orbh session return --await "<what is waiting>"`. The verdict wakes you. Set the stage phase again and continue from the stage that asked. |
| Subagent | Never ask a human. Set `phase blocked`, and end with `flint orbh session return --finish "<the question, the stage, and the state>"`. The dispatcher answers and continues the session, or runs the workflow itself. |

A turn that completes ends with `flint orbh session return --finish "<result>"`. The result names the product root, the ids, the Mesh artifacts, the commit SHAs, and the report paths, or the failure and its reason.
