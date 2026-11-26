---
description: "Where a profile shape comes from, the two halves of a profile, and the product patterns per platform family that a profile needs before orbtest can run it repeatably: web, terminal, and desktop"
---

# Knowledge: Platforms

What a product must provide per platform family, beyond the fields that `flint orbtest skills --section profiles` and `--section platforms` describe. Read the section of the family before the `init` workflow proposes a profile, and before the `suites` workflow proposes entries.

## The Two Halves of a Profile

A profile has two files, the environment and the UI profile. `init`, and `profile add --platform` with no `--environment`, give the two the same id. See [[dev-init-ot]], Layout and Terms.

| Half | File | Holds | Command |
|------|------|-------|---------|
| Environment | `orbtest/environments/<id>.yaml` | How the product runs and gets its state: `os`, `app_version`, `base_url`, `db`, `sources`, `secrets`, `setup`, `seeds`, `version_check`, `parallel`, and `isolation` with its `vars` | `environment add\|set\|unset\|rename\|remove` |
| UI profile | `orbtest/ui/profiles/<id>.yaml` | How a UI test drives the product: `environment`, `platform`, `browser`, `terminal`, `desktop`, `viewport`, `pacing`, `ready`, `agent`, `tier` | `profile add\|set\|unset\|rename\|remove` |

The rule for a field: a field that an integration test would need is in the environment. A field that exists only because a driver drives a screen is in the UI profile. The UI profile names its environment in `environment`. One environment can serve many UI profiles. The CLI refuses a field in the wrong half and names the command that owns it.

Where a profile shape comes from, in this order:

1. The field shapes: `flint orbtest skills --section profiles`. It has one table for the environment and one for the UI profile.
2. The scaffold of the family: `flint orbtest init --platform <web|terminal|desktop>` writes one environment and one UI profile with the same id (see [[dev-wkfl-ot-init]], Stage 2).
3. A whole profile of a product that already runs: pick a product from the Products table of the Flint Init, then run `flint orbtest profile list --root <product-root>` and `flint orbtest profile show <id> --root <product-root> --json`. `profile show` prints the resolved profile, the two halves joined, and names both files. `flint orbtest environment show <id> --root <product-root>` prints the environment half and the profiles that name it. Never read a profile file of another product by path.

The Half column of each table names where the pattern lives. The last column shows an example app. It shows the shape of a value, not a value to copy.

## Web

| Pattern | Half | Rule | Example |
|---------|------|------|----------|
| Isolated backend | Environment | The environment starts its own backend in `setup.start` and never the developer's. A seed resets it before every task. | A local backend of the app on `127.0.0.1:3210`, started from the worker directory under `orbtest/.local/services/workers/`, so its state stays gitignored under `orbtest/.local/`. |
| Reset script | Environment and `product/` | The seed of the environment runs a product script that drops what earlier runs created, then seeds. The human writes the script; no command does. | `node product/token.mjs && node product/clean.mjs`, then two idempotent `npm run seed` commands. `product/clean.mjs` reads the fixture `ui/fixtures/sample-upload.png`. |
| Third-party sign-in | UI profile and steps | A hosted widget swaps forms after a submit. The UI profile `ready` needs `stable_ms`, and the sign-in steps use `role` locators with `exact: true`. | A hosted sign-in widget. `ready: { network_idle_ms: 500, stable_ms: 500 }`. `root.click-email-address` uses `role textbox "Email address"`. |
| Dev server host | Environment | Use `localhost` in `base_url` when the dev server blocks its chunks from another host. | `base_url: http://localhost:{{port:3031}}`, not `127.0.0.1`. |
| Ports and workers | Environment | Placeholders `{{port:<n>}}`, `{{port:<n>:<step>}}`, `{{worker_dir}}`, `{{worker_suffix}}` in `base_url`, `setup`, `seeds`, and `sources` give each `--jobs` worker its own ports and folders. A step of 0 and two placeholders that give one port are refused. A run reserves its ports below `<tmp>/orbtest-ui/ports/`; when another live run holds one, all its ports move by one offset to the next free block. `parallel.prepare` clones the backend state once per worker. The worker directory holds the lock file `orbtest.lock` of the command that runs `prepare`: a `prepare` must keep that file and never empty the whole directory. The CLI writes the lock again after `prepare` when it is missing, but a second command can take the worker in that gap. | `parallel: { max: 4, prepare: ... }`. Its `prepare` writes two files into the worker directory and keeps the rest. |
| Secrets | Environment | Credentials are `env://NAME` inputs. The `secrets` field of the environment says where a human finds the values. | `APP_TEST_EMAIL`, `APP_TEST_PASSWORD`, and a second account. |
| Services | Environment | `setup.start` starts the services, and `setup.verify` proves them. Plain `doctor` starts no service, so it reports `setup verify` as `skipped`; `doctor --start` checks the services for real. A service that was ready before a command is reused and never stopped. | Two services in `setup.start`, `backend` and `web` (the dev server of the web app). `setup.verify` probes both. |
| Isolation | Environment | An `isolation` block (`env`, `unset`, `path_prepend`, `state_dirs`; also `isolation: {}`) applies to every process of a UI worker: `parallel.prepare`, the services, the `ready` and `identity` probes, `setup.verify`, `setup.stop`, the seeds, and the `command` checks. The final environment of each process is built one time: the safe variables of the controller without the `unset` names, the scratch homes, the declared `env`, the own `env` of the service or the check, and the reserved worker variables last. `HOME` is `{{case_dir}}/home` and `NUU_HOME` is `{{case_dir}}/home/.nuucognition` unless `env` declares them; a tool manager gets the real `HOME` only when `env` names it, and then no state folder may point into it. The access of an agent (profiles, credentials) is never inherited: the environment provisions it. The guard reads `HOME`, `NUU_HOME`, `ORBH_HOME`, and each `state_dirs` variable of the final environment, and the worker directory when it is outside the definitions root, before the first write (exit 2). With no `isolation`, a process gets the environment of the controller, as before. | `isolation: { unset: ["NUU_*", "ORBH_*"], env: { NUU_HOME: "{{case_dir}}/home/.nuucognition" }, state_dirs: [NUU_HOME] }`. The backend reads its home from `NUU_HOME`, so it never sees the home of the developer. |
| Service identity | Environment | With `isolation`, every service needs `identity`. A service that already answers its `ready` probe is used only when `identity.command` prints `identity.contains`; a service that the run starts passes it after it is ready. A run stops only the processes that it started, and it owns the process group of each one until the group is empty, also on SIGINT and SIGTERM. | `identity: { command: "curl -sf http://127.0.0.1:{{port:13240}}/identity", contains: "{{case_dir}}" }`: a backend of another run, or the real backend on that port, stops the run. |
| Frames | Steps | An element inside an `<iframe>` needs `frames` in its locator: one locator for each `<iframe>` element from the page to the frame of the element, outermost first. `author` writes it from the trace. A `dom` check and the `to` locator of `drag` and `scroll` take it too. | A plate that the web app shows in an `<iframe>`: `{ strategy: role, role: button, name: Launch, exact: true, frames: [{ strategy: css, selector: 'iframe[title="OrbCode"]' }] }`. |
| Decider | UI profile | A UI profile may set `agent.decider` (kind `jev`) for hybrid locator repair. `mode: shadow` records, `mode: active` decides. | `decider: { kind: jev, mode: shadow, min_confidence: 0.8 }`. |

## Terminal

`init --platform terminal` scaffolds the environment `cli-terminal` with `base_url: cli://app`, the UI profile `cli-terminal` with `terminal.command: sh`, the step `cli.run` (a `goto` with the words in `{{args}}`), and the requirements `node` and `terminal-program`. It writes no browser requirement. Point the UI profile at the program with `profile set cli-terminal terminal.command=<program>`, the environment with `environment set cli-terminal base_url=cli://<name>`, and the requirement with `requirement set terminal-program check='command -v <program>'`.

The route of a terminal profile is `cli://<name>/<positional words of the last goto>`, with `?exit=<code>` after the program exits. The screen is the observation. Only `goto`, `reload`, `type`, `key`, `chord`, and `wait` are available, and only `text` and `coords` locators. `fingerprint()` is always null, so a terminal step is never `suspect`.

| Pattern | Half | Rule | Example |
|---------|------|------|----------|
| One process per goto | UI profile | `goto` kills the running program and spawns `terminal.command` with the words of the URL. A `goto` URL is a `cli://` URL, a `/`-path, or a bare command line split like a POSIX shell. | `cli.note-get` runs `note get "{{title}}" --store "{{store}}"`. |
| Screen, not scrollback | UI profile | Scrollback is 0. A line that scrolled off is gone. Keep the `viewport` wide enough for the longest line the journey reads. | `viewport: { width: 120, height: 40 }`. Screen checks read the human table; command checks read `--json`. |
| A stable screen | UI profile and steps | The driver waits for the first output, then for quiet. A program that prints nothing before it reads is neither idle nor stable, so the `ready` of the UI profile times out. Give such a step `ready: {}`. | `cli.type-body` has `ready: {}` because `note create --stdin` prints nothing while it waits. |
| Keys and chords | Steps | `key` takes the names of the driver key table: `enter`, `tab`, `escape`, `up`, `end`, `f1`. `chord` takes `ctrl`, `alt`, `shift` plus one key. | `cli.end-input` is `chord [ctrl, d]`. |
| A program that logs in | UI profile and `product/` | The program reads an isolated home from `terminal.env`, so the developer's login is never touched. A product script mints the token into it. The home is machine-local, so it sits under `orbtest/.local/services/`, and the one `.gitignore` entry `.local/` already covers it. The human writes the script only. | `APP_HOME: .local/services/app-home`, minted by `product/token.mjs` in the seed of the environment. |
| Verify through the program | Environment | A `command` check runs the program with the same home and backend, and compares JSON. Declare a `command` source with the env in `sources` of the environment. | `sources.app: { type: command, env: { APP_HOME, APP_API_URL, NO_COLOR } }`. |
| Plain text | UI profile | Set `NO_COLOR: "1"` in `terminal.env` so the screen holds no escape codes. | In `terminal.env`. |
| Exit line | Task | After the program exits the screen shows `[orbtest: process exited with code <n>]`. A `text` check with `exact: true` on that line asserts the exit code. | `cli.read-note.wrong-lookup` checks `[orbtest: process exited with code 0]`. |
| Companion profile | UI profile and task | A task step may run on another UI profile of the same product with `on: <profile>`. The task seed and tier come from the primary profile. | The UI profile `local-editor` runs `node product/scripts/edit-paragraph.mjs` for the merge-conflict journey. Its environment `local-editor` has no state of its own. |
| Snapshots | - | The screen renders to PNG with a fixed bitmap font, so a baseline holds on every machine. | Not used in the example app. |

## Desktop

The rules come from the desktop driver. `init --platform desktop` scaffolds the environment `desktop-app` with `base_url: app://<app_id>`, the UI profile `desktop-app` with the `desktop` block, the step `app.restart`, and the requirements `hyprland`, `wtype`, `grim`, and `atspi`. Point the UI profile at the application with `profile set desktop-app desktop.command=<launch command> desktop.app_id=<window class>`, and the environment with `environment set desktop-app base_url=app://<window class>`. Every rule below is about the UI profile, the steps, or the requirements. The route is `app://<app_id>/<title of the focused frame>`. The observation is the AT-SPI accessibility tree of the application. The driver runs on a live Wayland session under Hyprland with `python3`, `hyprctl`, `wtype`, and `grim`.

| Pattern | Rule |
|---------|------|
| An accessible tree | Every element the journey touches needs a role and a name, or an accessible id. `testid` is the GtkBuilder id of a GTK4 widget. Only a showing accessible matches. |
| Clicks are actions | `click` runs the first AT-SPI action of the element. On a text field it moves focus instead. `move`, `press`, `drag`, `scroll`, `hover`, `upload`, and `back` are refused; `validate` refuses such a step. |
| Keyboard focus | Focus moves with `Tab` through `wtype`. A chord with `logo`, `super`, `meta`, `win`, or `cmd` is refused. |
| The focus guard | Before `type`, `key`, `chord`, and a `Tab` focus, the driver checks that the active window belongs to the application. It refuses rather than steals focus. Nothing else may take focus during a run. |
| Window placement | `launch()` floats the window, resizes it to the `viewport` of the UI profile, moves it to `64,64`, and focuses it. It refuses when the compositor did not do so. |
| Captures | `grim` captures the screen region of the window, so whatever covers the window is in the image. |
| Requirements | One file per requirement under `orbtest/requirements/`. Declare `python3` with `gi.repository.Atspi`, `hyprctl`, `wtype`, and `grim`. The scaffold writes them as the four requirements `hyprland`, `wtype`, `grim`, and `atspi`, each with `platforms: [linux]`. The `platforms` field of a requirement names operating systems (`linux`, `darwin`, `win32`), not platform families. On another operating system, `doctor` reports the requirement as skipped. |
| Locators | `testid`, `role`, `text`, `label`, and `coords`. `css` is refused. A GTK4 button and its child label carry the same name, so use `role` for a button. |
