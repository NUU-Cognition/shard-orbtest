---
description: "Rewrite the Test and Story type files for the two layers, give each UI (Test) the field layer and the template tmp-ot-test-v0.3, and rewrite each (Story) with record_story"
type: agent
migration:
  from: "0.10.0"
  to: "0.11.0"
---

> [!important] THIS FILE IS A MIGRATION. WHEN RUN, EXECUTE THE STEPS AGAINST THE WORKSPACE, THEN MARK IT FINISHED.

# Migration: Orbtest 0.10.0 → 0.11.0 (two layers: UI tests and behaviour tests)

Shard 0.11.0 adds the behaviour layer. A `(Test)` now records a UI test (`layer: ui`) or a behaviour spec (`layer: behaviour`), with the template `tmp-ot-test-v0.3`. A `(Story)` now copies the state of each criterion from both layers, with the template `tmp-ot-story-v0.2`. The templates `tmp-ot-test-v0.2` and `tmp-ot-story-v0.1` are gone from the shard.

The type files install with mode `once`, so the installer never overwrites them. This migration rewrites the body of the two installed type files that changed, gives each existing `(Test)` its layer and its new template, and rewrites each existing `(Story)` with the `record_story` skill.

The 0.11.0 bodies are in this migration, under 0.11.0 Bodies. The installed copy of a shard can have no `install/` folder, so do not look for the text there.

| Installed file | 0.11.0 body |
|----------------|-------------|
| `Mesh/Metadata/Types/(Type) Test (Orbtest Shard).md` | Test |
| `Mesh/Metadata/Types/(Type) Story (Orbtest Shard).md` | Story |

# Steps

1. **Record the ids.** For each installed file of the table, read the frontmatter. Write down its `id` and its `tags` list. Keep what each file has.
2. **Rewrite each installed type file.** For each row of the table:
   - Keep the frontmatter of the installed file as it is: the same `id`, the same `tags`, and every other key it has.
   - Replace everything after the closing `---` of the frontmatter with a blank line and the 0.11.0 body of that type from 0.11.0 Bodies. The body starts at its `#` heading. Copy the text inside the four-backtick fence only, not the fence lines. The body holds its own three-backtick fence.
   - When an installed file is missing, write it with the frontmatter `id: <a new UUID v4>` and `tags: ["#f/metadata", "#f/type"]`, then the body.
3. **Give each (Test) its layer.** For each file under `Mesh/Types/Tests/` and `Mesh/Archive/Tests/` whose frontmatter has `template: "[[tmp-ot-test-v0.2]]"`:
   - Add the line `layer: ui` directly after the `tags` list.
   - Change the `template` value to `"[[tmp-ot-test-v0.3]]"`.
   - Change nothing else. The body of a UI `(Test)` has the same sections in v0.3. Do not add a `# Cases` section, and do not change `covers`.
4. **Rewrite each (Story).** For each file under `Mesh/Types/Stories/` whose frontmatter has `template: "[[tmp-ot-story-v0.1]]"`:
   - Find the row of its `product-root` in the Products table of the Orbtest section of `Mesh/(System) Flint Init.md`.
   - When the row exists and `flint orbtest check --root <product-root>` exits 0, run [[dev-sk-ot-record_story]] for its `story-id`. The skill rewrites the `(Story)` in the form of v0.2 and sets `template: "[[tmp-ot-story-v0.2]]"`.
   - When the product root has no row, the check does not exit 0, or `flint orbtest coverage` is not a command of the CLI (an older `flint` binary), change nothing in that `(Story)`, and name it in the report. The next run of the skill rewrites it.
   - Do not rewrite a `(Story)` in `Mesh/Archive/Stories/`: an archived story keeps its v0.1 form.
5. **Change nothing else.** The type files of Run, Suite, and Release, the `(Run)`, `(Suite)`, and `(Release)` artifacts, and an installed `Mesh/(Dashboard) Tests.md` do not change. Write nothing under the `orbtest/` folder of a product.

## Verification

Run each check. When one fails, stop and report. Do not finish the migration.

1. Each of the two installed type files has the `id` and the tags of step 1, and its body after the frontmatter is equal to its 0.11.0 body. This command prints 1 for each file:
   `grep -cE '^- \[\[tmp-ot-(test-v0.3|story-v0.2)\]\]$' "Mesh/Metadata/Types/(Type) <Name> (Orbtest Shard).md"`
2. No `(Test)` pins the old template. This command prints nothing and exits 1:
   `grep -rl 'tmp-ot-test-v0.2' Mesh/Types/Tests Mesh/Archive/Tests`
3. Each `(Test)` has a layer. This command prints nothing:
   `grep -rL '^layer: ' Mesh/Types/Tests Mesh/Archive/Tests`
4. Each `(Story)` under `Mesh/Types/Stories/` pins `tmp-ot-story-v0.2`, or the report names it with its reason (step 4).

Then run `flint shard migrate finish ot`. Check that `flint shard status ot` prints `No pending migrations` and version `0.11.0`.

# 0.11.0 Bodies

## Test

````markdown
# Test

A Test is the Mesh record of one UI test or one behaviour spec in one product repository. Its `layer` field says which. A UI Test (`layer: ui`) records one registered orbtest task: the task id, the profile, the story and the criteria that the task proves, the steps, the component files the steps bind to, and the commit at which `run --confirm` last anchored the task. It links every recorded Run that covered the task. A UI Test whose task holds an agentic step stays `registered`, because `run --confirm` anchors deterministic tasks only. A behaviour Test (`layer: behaviour`) records one behaviour spec: the spec path, the environment, the story and the criteria that its cases prove, the components, a table of its cases with their states, and the newest anchor. A Test with no `layer` field is a UI Test. A Test is not a Projects `(Task)`: a Test is a behaviour the product must keep passing, not a unit of work that closes once.

## Properties

| Property | Value |
|----------|-------|
| Tag | `#ot/test` |
| Naming | `(Test) NNN <name>.md`, with the task `name` from `flint orbtest task show`, or the spec `name` from `flint orbtest behaviour show` |
| Location | `Mesh/Types/Tests/` |
| Archive | `Mesh/Archive/Tests/` |
| Key | `layer`, `test-id`, and `product-root`: one Test per task id or spec id per product root |
| Written by | UI: the `tasks` workflow, and the `add_negative_control` skill; the `record_run`, `record_story`, and `add_check` skills update it. Behaviour: the `behaviour` and `audit` workflows; the `heal` workflow and the `record_story` skill update it. |

## Lifecycle

```
registered → confirmed → stale → confirmed
registered → stale
any status → retired
```

| Status | UI Test | Behaviour Test |
|--------|---------|----------------|
| `registered` | The task is written and valid. No `run --confirm` has anchored it. | The spec is written, and not every case that proves a criterion is `proven`. |
| `confirmed` | `run --confirm` met the task and wrote its `confirmed` anchor. | Every case of the spec that proves a criterion is `proven`. |
| `stale` | The task, or a step it invokes, is marked stale. | A case of the spec is `stale` or `suspect`. |
| `retired` | The task was removed. A human decides. The Test is never deleted. | The spec was removed. A human decides. The Test is never deleted. |

Criterion numbers in `covers` are 1-based, as the Mesh writes them. The CLI addresses are 0-based: number `n` is the address `<story-id>#<n-1>`.

## Templates

- [[tmp-ot-test-v0.3]]
````

## Story

````markdown
# Story

A Story is the Mesh record of one orbtest story in one product repository. It copies the user story and its acceptance criteria from the story YAML, and the state of each criterion from `flint orbtest coverage`, which counts both layers: UI tests and behaviour tests. It links every Test of either layer whose task or spec names the story, and it counts the criteria that each layer proves. A Story owns no steps and no cases: the Tests do, and each Test names its story and the criteria it proves. A criterion in the state `gap` has no UI task and no behaviour case. A Story is not a `(Plan)` or a Projects `(Task)`: it describes a feature that must stay covered, not work that ends.

## Properties

| Property | Value |
|----------|-------|
| Tag | `#ot/story` |
| Naming | `(Story) NNN <story name>.md`, with the story `name` from `flint orbtest story show` |
| Location | `Mesh/Types/Stories/` |
| Archive | `Mesh/Archive/Stories/` |
| Key | `story-id` and `product-root`: one Story per story id per product root |
| Written by | The `record_story` skill writes the copied parts. Workflows add Task Log and Notes lines only. |

## Lifecycle

```
recorded → rewritten by record_story (no status field)
```

A Story has no status. It copies `stale` from the story YAML. A criterion is covered when its state is `proven`. Criterion numbers are 1-based, as the Mesh writes them; the CLI addresses are 0-based.

## Templates

- [[tmp-ot-story-v0.2]]
````
