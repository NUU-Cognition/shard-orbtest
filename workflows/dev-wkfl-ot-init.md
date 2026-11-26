---
description: "Adopt a product or a new machine: examine, scaffold, satisfy the requirements, propose a profile, write it, verify, hand over"
orbh-sessions:
  - "[[b196755f-5e21-43d7-94f0-4c43c6e0d2a6]]"
---

> [!important] THIS FILE IS AN INSTRUCTION. WHEN REFERENCED IT IS MEANT TO BE TAKEN AS AN ACTION.

Run `flint shard start ot` if you haven't already.

# Workflow: Init

Give a product an `orbtest/` folder with one verified profile, its environment and its UI profile, and a row in the Products table of the Flint Init, or prepare a new machine for a product that has one. Read [[dev-knw-ot-platforms]], The Two Halves of a Profile, and the section of the platform family first.

> [!headless]
> In a headless or subagent Orbh session, the stages, the commands, and the exit codes are the same. The workflow writes both halves of a profile: the environment and the UI profile. Two decisions stay human: consent to `doctor --setup`, and the proposal of the environment and the UI profile with its Products row. They are questions per [[dev-init-ot#Headless]]. Secret values cannot be entered headless. Follow the `> [!headless]` callout in each stage.

# Input

- Product root, relative to the Flint root. For a product that is already in the Products table of the Flint Init, use the spelling of its row.
- Platform family of the first profile: `web`, `terminal`, or `desktop`
- (Align path) Nothing else: `orbtest/` exists and this machine must run it

# Actions

## Stage 1: Examine

- Read the Products table of the Flint Init (see [[dev-init-ot]], Products). Note whether the product root has a row.
- When `<product-root>/orbtest/` exists, this is the align path. Run `flint orbtest check --root <product-root>` first. Exit 0 is required; on 1, 2, or 3 follow [[dev-init-ot]], Version Handshake, before any other command. Then run `flint orbtest validate --root <product-root>` (0 required), `flint orbtest profile list --root <product-root>`, `flint orbtest environment list --root <product-root>`, and `flint orbtest requirement list --root <product-root>`. Progress to Stage 3.
- Else read the product: how it starts, its port or its program, its backend, its sign-in, and what a reset needs. Note every tool, file, and secret a run will assume. A product with no `orbtest/` needs no handshake yet; `init` writes the format stamp in Stage 2.
- Once the platform family and the base URL or the program are known, progress to the next stage.

> [!headless]
> - `flint orbh session set phase examine`, `progress "stage 1/6"`. Do this stage: read the Products table of the Flint Init first. On the align path, `flint orbtest check --root <product-root>` is the first command; act on its exit code per [[dev-init-ot#Headless]], Version Handshake, Headless, then progress to Stage 3.
> - Once the platform family and the base URL or the program are known, progress to the next stage.

## Stage 2: Scaffold

| Step | Command | Exit |
|------|---------|------|
| Scaffold a web product | `flint orbtest init --root <product-root> --platform web [--base-url <url> \| --port <n>]` | 0 written. 2 an existing `orbtest/`, or a bad flag. |
| Scaffold a terminal program | `flint orbtest init --root <product-root> --platform terminal` | 0, 2. `--base-url` and `--port` are refused. |
| Scaffold a desktop application | `flint orbtest init --root <product-root> --platform desktop` | 0, 2. `--base-url` and `--port` are refused. |
| Check | `flint orbtest check --root <product-root>` | 0 required. The new folder is current by construction. |
| Validate | `flint orbtest validate --root <product-root>` | 0 |

What each scaffold writes. The environment and the UI profile have the same id:

| Platform | Id | Environment `environments/<id>.yaml` | UI profile `ui/profiles/<id>.yaml` | Step in `ui/steps/` | Requirements |
|----------|----|--------------------------------------|------------------------------------|---------------------|--------------|
| `web` | `web-desktop-chromium` | `base_url` from `--base-url`, or `http://127.0.0.1:<port>` (port 3000 by default); `setup.verify` probes it | `platform: web`, `browser.name: chromium` | `nav.goto` | `node`, `probe-tool`, `playwright-chromium` |
| `terminal` | `cli-terminal` | `base_url: cli://app`, `setup.verify: "true"` | `platform: terminal`, `terminal.command: sh` | `cli.run` | `node`, `terminal-program` |
| `desktop` | `desktop-app` | `base_url: app://org.example.app`, `setup.verify: "true"` | `platform: desktop`, the `desktop` block | `app.restart` | `hyprland`, `wtype`, `grim`, `atspi` |

- Each environment also has `os`, `app_version`, and a placeholder `seeds.default`. Each UI profile also has `environment: <id>`, `viewport`, `pacing`, `ready`, and `tier`.
- Every scaffold also writes empty `ui/tasks/`, `ui/fixtures/`, and `stories/` folders, a README in `environments/`, `ui/profiles/`, and `requirements/`, `.gitignore` with the one entry `.local/`, and a commented `orbtest.toml` with the format stamp. The scaffold step has `component: unknown`. The tree is the Layout of [[dev-init-ot]].
- `init` ends with `next:` lines. Each is a command with `--root <absolute path>`, and the placeholders in `<...>` are yours to fill in: `profile set` for a field of the UI profile, `environment set` for a field of the environment. Use them in Stages 3 and 5.
- Commit the scaffold. Progress to the next stage.
- `init` does not create `orbtest/product/`. Create it with the first product script, per [[dev-init-ot]], Boundary.

> [!headless]
> - `phase scaffold`. Run `flint orbtest init --root <product-root> --platform <family>` with the flags of this stage. It writes one environment and one UI profile with the same id. Then run `flint orbtest check --root <product-root>` (0 required; on another code act per [[dev-init-ot#Headless]], Version Handshake, Headless) and `flint orbtest validate --root <product-root>` (0 required). Commit. Progress to the next stage.

## Stage 3: Requirements

| Step | Command | Exit |
|------|---------|------|
| Check | `flint orbtest doctor --root <product-root> --profile <id>` | 0 every check passes or is skipped. 3 a check failed: read the `req` lines. |
| Provision | `flint orbtest doctor --root <product-root> --profile <id> --setup [--setup-target <runtime/profile>]` | 0, 3. Only after the checkpoint below. |
| Machine-local services | `flint orbtest services set <name> command="<cmd>" ready="<probe>" --profile <id> --root <product-root>` | Only when the environment of the profile has `setup.local_start`. 0. 2 while git would commit the file, or when the environment has no `setup.local_start`. The file is under `orbtest/.local/services/`. |

- Plain `doctor` starts no service. On a profile whose environment has `setup.start` or `setup.local_start`, it reports `setup verify` as `skipped` and names `doctor --start`. That is not a failure. Stage 5 proves the services with `doctor --start`.
- The scaffold `setup.verify` of a web environment probes the base URL. On a scaffold with no `setup.start`, plain `doctor` fails that check (exit 3) until the product runs. That failure goes away in Stage 5, when the environment gets its `setup.start`.
- `services set` on an environment with no `setup.local_start` exits 2. Its hint names `environment set <environment> setup.local_start=start.local.yaml`. Do not run that hint: the path is at the definitions root, outside `.local/`, so git would commit the file and the next `services set` exits 2 again. When the product needs a machine-local services file, propose `setup.local_start=.local/services/start.yaml` in Stage 4. Stage 5 sets it with `environment set`, and then `services set` writes the file.
- Checkpoint: list the failing requirements with their guidance. Ask the human for consent before `--setup` changes this machine.
- List under `Missing` what no command writes: a reset script or a seed script under `orbtest/product/` (a script that reads a fixture names it `ui/fixtures/<name>`), and a `.gitignore` line when the product keeps machine-local state outside `.local/`. Propose the content. The human writes it, per [[dev-init-ot]], Boundary. The isolated home of a terminal profile is not on this list: a product script makes it under `orbtest/.local/services/`, and `.local/` is already gitignored.
- Once every requirement check passes, progress to the next stage. On the align path, `doctor` must exit 0; then progress to Stage 6.

> [!headless]
> - `phase requirements`, `progress "stage 3/6 · requirement <k>/<n>"`. Run `doctor --profile <id>`. A `skipped` line for `setup verify` is not a failure. On a web scaffold with no `setup.start`, a failed `setup verify` is expected until Stage 5, as this stage says; it is not a blocker.
> - On exit 3 for a requirement: `flint orbh update "<failing requirements>" --kind blocker`, set `phase blocked`, and ask the consent question for `--setup`. After consent, run `doctor --setup` and `services set` as this stage says.
> - Put every item that no command writes under `Missing` in the result.
> - Once every requirement check passes, progress to the next stage. On the align path, `doctor` must exit 0; then progress to Stage 6.

## Stage 4: Propose

- Draft one profile from the evidence, in its two halves. Start from the scaffold of Stage 2. Take the field shapes from the `environment` table and the `ui profile` table of `flint orbtest skills --section profiles`. To see a whole profile that already runs, take a product from the Products table and run `flint orbtest profile show <id> --root <that product root>`; it prints the resolved profile and names both files. Read [[dev-knw-ot-platforms]] for the half of each pattern of the family.
  - The environment: `base_url`, `app_version`, `os`, `setup.start` with `ready` probes, `setup.verify`, `seeds.default`, and when needed `secrets`, `sources`, `parallel`, and `version_check`.
  - The UI profile: `platform`, `viewport`, `pacing`, `ready`, `agent.target`, `tier`, `browser` for a web profile, `terminal.command`, `terminal.args`, and `terminal.env` for a terminal profile, and the `desktop` block for a desktop profile.
  - One id for both halves, unless the product already has an environment that the new profile must share. Then the UI profile names that environment, and only the UI profile is new.
- A terminal profile: `terminal.command` is the program under test, on `PATH` or as a path relative to the definitions root. The `base_url` of the environment is `cli://<name>`. Set the `terminal-program` requirement check to `command -v <program>`. Set the `cli.run` component to the source file of the command it runs.
- Draft the requirements: one entry per tool, file, and secret, each with a fast read-only `check` and a `guidance`. Draft the secret names.
- Draft the Products row: product name, product root, repository, canon branch (see [[dev-init-ot]], Products).
- Checkpoint: the human approves the environment, the UI profile, the requirements, the secret names, and the Products row. Once approved, progress to the next stage.

> [!headless]
> - `phase propose`. Draft the environment, the UI profile, the requirements, the secret names, and the Products row as this stage says. Take the field shapes from `flint orbtest skills --section profiles`. In the proposal, list the fields of each half apart. Set `phase blocked` and ask the question with the proposal as the body. Once the answer approves, progress to the next stage.

## Stage 5: Write and Verify

| Step | Command | Exit |
|------|---------|------|
| Change the scaffold environment | `flint orbtest environment set <id> <path>=<value...> --root <product-root>`, with `--file <path>` for a large value | 0, 2. `--dry-run` first. 2 on a field of the UI profile: the message names `profile set`. |
| Change the scaffold UI profile | `flint orbtest profile set <id> <path>=<value...> --root <product-root>`, with `--file <path>` for a large value | 0, 2. `--dry-run` first. 2 on a field of the environment: the message names `environment set`. |
| Or add a profile | `flint orbtest profile add <id> --platform <family> <path>=<value...> --root <product-root>` writes both halves with the same id; a field of the environment goes to the new environment. `--environment <env-id>` names an environment that exists and writes the UI profile only. `--from <id>` copies a UI profile and names the same environment. | 0, 2. 2 when an environment with the new id exists and no `--environment` is given. |
| Or add an environment | `flint orbtest environment add <env-id> --platform <family> <path>=<value...> --root <product-root>`, then `flint orbtest profile set <id> environment=<env-id> --root <product-root>` | 0, 2. `validate` warns while no profile names the environment. |
| Rename | `flint orbtest profile rename <old> <new> --root <product-root>` for the UI profile, and `flint orbtest environment rename <old> <new> --root <product-root>` for the environment | 0, 2. Only when the human asked for another id. `profile rename` keeps the environment id. `environment rename` rewrites the `environment` field of every profile that names it. |
| Requirements | `flint orbtest requirement set <id> <path>=<value...> --root <product-root>`, or `flint orbtest requirement add <id> name="<text>" check="<cmd>" guidance="<text>" --root <product-root>` for a new one | 0, 2 |
| Secret names | `flint orbtest secret add <NAME...> --root <product-root>` | 0 |
| Secret values | `flint orbtest secret enter --root <product-root>` | 0. The human types the values. 3 on timeout. |
| The scaffold step | `flint orbtest step set <step-id> component=<path> --root <product-root>`, with `nav.goto`, `cli.run`, or `app.restart` | 0, 2 |
| Settings | `flint orbtest settings set agent.target=<runtime/profile> --root <product-root>` | 0, 2. Only when the human asks. |
| Validate | `flint orbtest validate --root <product-root>` | 0. The summary line counts the profiles and the environments. |
| Read the result | `flint orbtest profile show <id> --root <product-root>` | 0. The resolved profile, with both files named. |
| Prove the environment | `flint orbtest doctor --root <product-root> --profile <id> --start` | 0 required. 3 with `ORBTEST_WORKER_BUSY`: another command holds the worker; run it again after the holder ends. |

- A profile whose environment has no `setup.start` has no service to start: `doctor --start` checks the same as plain `doctor`.
- Only this workflow runs a `profile` write command or an `environment` write command, and only for the approved profile and environment. Commit the printed files: they are under `environments/` and `ui/profiles/`. Progress to the next stage.

> [!headless]
> - `phase write`. Run the commands of this stage except `secret enter`: `environment set` for the fields of the environment and `profile set` for the fields of the UI profile. On exit 2 for a field in the wrong half, run the command that the message names. Run `secret add` for the names. Set `blockers "secret values: run flint orbtest secret enter --root <product-root>"` when a value is missing; `doctor --start` may then exit 3 on the secret requirements. On `ORBTEST_WORKER_BUSY`, act per [[dev-init-ot#Headless]]. Commit.
> - Once `validate` exits 0, progress to the next stage.

## Stage 6: Hand Over

- Write the Products row. Open `Mesh/(System) Flint Init.md` and find the Products table in its Orbtest section. When no row has this product root, add the approved row. When the section has no Products table, add the table header of [[dev-init-ot]], Products, and the row. On the align path, show the row to the human and write it after the approval. Never change a row that exists.
- Run `flint orbtest page --root <product-root> --open` (0) so the human sees the configuration.
- Print the output block.

> [!headless]
> - `phase handover`. When the Stage 4 answer approved a Products row, write it into the Flint Init as this stage says. On the align path there is no approval: put the proposed row under `Missing` in the result, and do not write it.
> - Run `page` without `--open`. Set `artifacts "<profile ids> · <environment ids>"`. `phase complete`. `flint orbh update "adopted <product-root>" --kind completed`.
> - End with `flint orbh session return --finish "<result>"`: the product root, the Products row, the profile ids, the environment ids, the requirement ids, the secret names and their state, the `Missing` list, the commit SHAs, and the page path.

# Output

- `orbtest/` with one verified profile (its environment and its UI profile), its requirements, and its secret names, committed
- On the align path: this machine passes `doctor`
- One row for the product in the Products table of the Flint Init
- The output block: product root, profile ids, environment ids, secret names, what is under `Missing`, and the next workflow, [[dev-wkfl-ot-stories]]

> [!headless]
> - The output above, with the `Missing` list and the open secret values in the returned result
