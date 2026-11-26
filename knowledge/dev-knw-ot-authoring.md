---
description: "Briefs, components maps, bundles, inputs and secrets, and how to review the steps that author or run --freeze froze from a trace"
---

# Knowledge: Authoring

The files the `tasks` workflow writes and reads that `flint orbtest skills` does not describe: the brief, the components map, and the bundle. Field shapes of steps, tasks, and verifications are in `flint orbtest skills --section steps|tasks|verification|checks`.

## Brief

`orbtest/ui/briefs/<task-id>.yaml`. Written with `flint orbtest brief add <id> --root <product-root> ...` and changed with `brief set|unset`. `brief show <id>` prints it with its problems. Never write the file. The id is a plain name (see [[dev-init-ot]], Changing Definitions): every `brief` verb refuses an id with `/`, `..`, or a leading `.`, with exit 2.

| Field | Flag on `brief add` | Meaning |
|-------|---------------------|---------|
| `description` | `--description <text>` | Required. What the user does and what must be true at the end. May hold `{{inputs.<key>}}`. The agent sees only this text, with the inputs filled in. |
| `name` | `--name <text>` | The task name. Default: the first sentence of the description. |
| `profile` | `--profile <id>` | The UI profile to run on. It brings its environment. Required when the product has more than one profile. |
| `story` | `--story <id>` | The story of the task. `register` writes it on the task. |
| `seed` | `--seed <id>` | Default: the default seed. |
| `inputs` | `--input <key=value...>` | Task inputs. A secret is written as `env://NAME`, never as a value. A fixture file is written as `ui/fixtures/<name>`, the path that `fixture add` prints. |
| `verify` | `--verify-file <path>` | The final verification, in the task `verify` shape. Read it from a JSON or YAML file outside `orbtest/`, for example under your session scratch directory. |

Example from a web app, `ui/briefs/home.sign-in.yaml`:

```yaml
id: home.sign-in
name: Sign in and see the sample project
description: A signed-out visitor opens /, signs in with email {{inputs.email}} and password {{inputs.password}}, and lands on the dashboard where the project list shows "Sample Project".
story: access.sign-in
inputs:
  email: env://APP_TEST_EMAIL
  password: env://APP_TEST_PASSWORD
verify:
  kind: deterministic
  route: /
  dom:
  - check: exists
    locator:
      strategy: testid
      value: dashboard-home
```

## Inputs and Secrets

- An input value `env://NAME` resolves from the environment or from `orbtest/.local/secrets` at run time. Every artifact redacts the value.
- The agent adds a name with `flint orbtest secret add <NAME> --root <product-root>`. The human enters the value in the page that `secret enter` opens. `secret list` prints each name with `set`, `empty`, or `missing`, and which task or suite references it. No command prints a value.
- `register --approve` writes the inputs as the brief holds them. An `env://NAME` reference stays a reference. No value reaches a task file, a bundle, or a trace.
- A value under a secret-looking key is redacted even without `env://`.

## Components Map

`orbtest/ui/briefs/<task-id>.components.json`. Written with `flint orbtest components set <brief-id> '<locator>' <path> --root <product-root>`. A key is a locator description as `bundle.json` prints it in `external:web:<locator>`, for example `label "Email"` or `role textbox "Email address"`, or `*` as the fallback. A value is a path that exists under the product root. `components set` refuses a path that does not exist. Example from a web app: `{ "*": "src/components/auth-gate.tsx" }`.

`author --components` takes the map in one of two forms: inline JSON (text that starts with `{`), or the path of a JSON file, which resolves against the current directory. The simple form is the path of the components map itself, `<product-root>/orbtest/ui/briefs/<task-id>.components.json`. `author --from-run <dir> --components <map>` converts an earlier trace again with the map, without a new agent run. `run --freeze --components` takes the same two forms.

## Bundle

`bundle.json`, JSON with a `kind`. `register --bundle <dir>` reads it. The shard never edits a bundle. `<time>` is the UTC start time, `YYYY-MM-DDTHH-MM-SSZ`. Take `<dir>` from the line the command prints, per [[dev-init-ot]], Commands, Where a run is.

| Kind | Written by | Where | What `register --approve` writes |
|------|------------|-------|----------------------------------|
| `author` | `author`, and `regen --task` | `.local/runs/author-<time>/bundle.json` | New steps into `ui/steps/<prefix>.yaml`, and the task into `ui/tasks/<id>.yaml` |
| `freeze` | `run --freeze` | `.local/runs/<run-id>/<task-id>/bundle.json` | New steps, and the task `steps` list, and grown `inputs` |
| `regen` | `regen --step` | `.local/runs/author-<time>/bundle.json` | The field updates of one step |

`register` refuses a bundle whose task id or new step id is not a plain name, with exit 2, and writes nothing.

An author bundle holds `run`, `achieved`, `met`, `steps` (proposed), `reused` (existing step ids), `taskDefinition`, `verification`, `dropped` (atoms the converter dropped), and `source`. `register` refuses a bundle whose brief changed after `author` wrote it, and a bundle the agent did not achieve.

## Review of Frozen Steps

Read the bundle before `register --approve`. Use `--dry-run` forms and `register` without `--approve` to see the diff. Fix a step after the write with `step set|rename` and `task set|rename`, never in the bundle.

| Check | Rule |
|-------|------|
| Collapse | One step is one atom on one element. A click that opened a menu and the click on the menu item are two steps. |
| Route | A step `route` is a pattern with `:id` segments, never a literal id. `/project/:id/note/:id2`, not `/project/j57.../note/Welcome`. |
| Parameters | A typed value that came from an input is a `{{param}}` with a `params` declaration, not a literal. A secret is always a param bound to `env://NAME`. |
| Reuse | A proposed step that equals a step in `reused` by atom, locator, and route is a duplicate. Prefer the existing id. `step list --unused` finds orphans later. |
| Ids and names | `<prefix>.<verb>-<object>`, for example `root.click-continue`, `project.type-name`. The prefix groups the file `ui/steps/<prefix>.yaml`. |
| Component | Every step whose component is `external:web:<locator>` has no file mapped. Map it with `components set` and convert again with `author --from-run`, or set it after the write with `step set <id> component=<path>`. A component may leave the product root with `../` inside the same repository, for example `../cli/src/commands/note.ts`. |
| Final verification | At least one deterministic check that proves the outcome, not only the route. Add one later with `task check add`. |
| Dropped atoms | Read `dropped`. A dropped `wait` is fine. A dropped `type` or `click` means the journey is incomplete. |

## Negative Control

`flint orbtest task negative add <source-id> --input <key=wrong-value> --root <product-root>` copies a task with one wrong input and `expect: fail` into `ui/tasks/<id>.yaml`. Default id `<source-id>.wrong-<key>`. Example from a CLI app: `cli.read-note.wrong-lookup`. `validate` warns `no negative control` until a product has one task with `expect: fail`.
