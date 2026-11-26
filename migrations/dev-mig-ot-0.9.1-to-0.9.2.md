---
description: "Rewrite the five installed Orbtest (Type) files with the 0.9.2 Properties table, Lifecycle, and Templates, and keep each file's id"
type: agent
migration:
  from: "0.9.1"
  to: "0.9.2"
---

> [!important] THIS FILE IS A MIGRATION. WHEN RUN, EXECUTE THE STEPS AGAINST THE WORKSPACE, THEN MARK IT FINISHED.

# Migration: Orbtest 0.9.1 → 0.9.2 (full type files)

The five type files install with mode `once`. The installer never overwrites a type file that exists, so a Flint that has the shard keeps the 0.9.1 type files. They have no Properties table, no Lifecycle section, and no Templates section, and the Flint health checker requires all three. This migration rewrites the body of the five installed files with the 0.9.2 body. It keeps the frontmatter of each installed file, so the `id` and the tags stay. Wikilinks and other Flints can point at the `id`.

The 0.9.2 body of each file is in this migration, under 0.9.2 Bodies. It is the same text as the file `install/type-ot-<type>.md` of shard 0.9.2 after its frontmatter. The installed copy of a shard can have no `install/` folder, so do not look for the text there.

| Installed file | 0.9.2 body |
|----------------|------------|
| `Mesh/Metadata/Types/(Type) Test (Orbtest Shard).md` | Test |
| `Mesh/Metadata/Types/(Type) Run (Orbtest Shard).md` | Run |
| `Mesh/Metadata/Types/(Type) Story (Orbtest Shard).md` | Story |
| `Mesh/Metadata/Types/(Type) Suite (Orbtest Shard).md` | Suite |
| `Mesh/Metadata/Types/(Type) Release (Orbtest Shard).md` | Release |

# Steps

1. **Record the ids.** For each installed file of the table, read the frontmatter. Write down its `id` and its `tags` list. Some files have the tag `#readonly`, and some do not. Keep what each file has.
2. **Rewrite each installed file.** For each row of the table:
   - Keep the frontmatter of the installed file as it is: the same `id`, the same `tags`, and every other key it has.
   - Replace everything after the closing `---` of the frontmatter with a blank line and the 0.9.2 body of that type from 0.9.2 Bodies. The body starts at its `#` heading. Copy the text inside the fence only, not the fence lines.
   - When an installed file is missing, write it with the frontmatter `id: <a new UUID v4>` and `tags: ["#f/metadata", "#f/type"]`, then the body.
3. **Change nothing else.** No other file under `Mesh/` changes in this migration. An installed `Mesh/(Dashboard) Tests.md` keeps its payload.

## Verification

Run each check. When one fails, stop and report. Do not finish the migration.

1. Each of the five installed files has the `id` and the tags of step 1.
2. Each of the five installed files has a table row for `Tag`, `Naming`, `Location`, and `Archive`, and the headings `## Lifecycle` and `## Templates`. This command prints 6 for each file:
   `grep -cE '^\| (Tag|Naming|Location|Archive) \||^## (Lifecycle|Templates)$' "Mesh/Metadata/Types/(Type) <Name> (Orbtest Shard).md"`
3. The body of each installed file after its frontmatter is equal to its 0.9.2 body.

Then run `flint shard migrate finish ot`. It marks this step done and deletes the migration file. Check that `flint shard status ot` prints `No pending migrations` and version `0.9.2`.

# 0.9.2 Bodies

## Test

````markdown
# Test

A Test is the Mesh record of one registered orbtest task in one product repository. It names the task id, the profile, the story and the acceptance criteria the task proves, the steps, the component files the steps bind to, and the commit at which `run --confirm` last anchored the task. It links every recorded Run that covered the task. A Test whose task holds an agentic step stays `registered`, because `run --confirm` anchors deterministic tasks only. A Test is not a Projects `(Task)`: a Test is a journey the product must keep passing, not a unit of work that closes once.

## Properties

| Property | Value |
|----------|-------|
| Tag | `#ot/test` |
| Naming | `(Test) NNN <task name>.md`, with the task `name` from `flint orbtest task show` |
| Location | `Mesh/Types/Tests/` |
| Archive | `Mesh/Archive/Tests/` |
| Key | `test-id` and `product-root`: one Test per task id per product root |
| Written by | The `tasks` workflow, and the `add_negative_control` skill. The `record_run`, `record_story`, and `add_check` skills update it. |

## Lifecycle

```
registered → confirmed → stale → confirmed
registered → stale
any status → retired
```

| Status | Meaning |
|--------|---------|
| `registered` | The task is written and valid. No `run --confirm` has anchored it. |
| `confirmed` | `run --confirm` met the task and wrote its `confirmed` anchor. |
| `stale` | The task, or a step it invokes, is marked stale. |
| `retired` | The task was removed. A human decides. The Test is never deleted. |

## Templates

- [[tmp-ot-test-v0.2]]
````

## Run

````markdown
# Run

A Run is the Mesh record of one orbtest task run directory. It copies the outcome counts, the evidence tier counts, and the definitions commit from `run.json`, and it names the run directory by path. It never copies a screenshot, a DOM snapshot, or an agent trace. It links the Tests the run covered and lists the task ids that have no Test yet. A snapshot run, an author run, and a doctor run are not a Run: a snapshot run is one row of a Suite, and the other two have no Mesh record. A Run is not a `(Report)`: a Run records a machine result, not an analysis.

## Properties

| Property | Value |
|----------|-------|
| Tag | `#ot/run` |
| Naming | `(Run) NNN <basename of product root> <run-id>.md` |
| Location | `Mesh/Types/Runs/` |
| Archive | `Mesh/Archive/Runs/` |
| Key | `run-id` and `product-root`: one Run per task run directory |
| Written by | The `record_run` skill only |

## Lifecycle

```
recorded (no status field)
```

A Run has no status. Its copied fields never change. Only `tests` and the Unrecorded tasks list change, when a Test is created later for a task the run covered.

## Templates

- [[tmp-ot-run-v0.1]]
````

## Story

````markdown
# Story

A Story is the Mesh record of one orbtest story in one product repository. It copies the user story and its acceptance criteria from the story YAML, links every Test bound to the story, and marks which criterion a confirmed Test covers. A Story owns no steps: the Tests do, and each Test names its story and the criteria it proves. A criterion with no confirmed Test is a gap. A Story is not a `(Plan)` or a Projects `(Task)`: it describes a feature that must stay covered, not work that ends.

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

A Story has no status. It copies `stale` from the story YAML. A criterion is covered when one linked Test with `status: confirmed` lists it in `covers`.

## Templates

- [[tmp-ot-story-v0.1]]
````

## Suite

````markdown
# Suite

A Suite is the Mesh record of one orbtest snapshot suite in one product repository: its entries, its profiles, the approver and time of each baseline, and every snapshot run recorded against it. It copies approver names and times from `flint orbtest baseline list` and cell counts from the snapshot `run.json`. It never embeds a capture, a baseline, or a diff image. A Suite is not a Test: a Suite proves that screens still look the same, a Test proves that a journey still works.

## Properties

| Property | Value |
|----------|-------|
| Tag | `#ot/suite` |
| Naming | `(Suite) NNN <suite name>.md` |
| Location | `Mesh/Types/Suites/` |
| Archive | `Mesh/Archive/Suites/` |
| Key | `suite-id` and `product-root`: one Suite per suite id per product root |
| Written by | The `suites` workflow creates it. The `record_suite` skill rewrites it and sets its status. |

## Lifecycle

```
new → approved → failing → approved
approved → new
any status → retired
```

The rule that sets `new`, `approved`, and `failing` is in the shard knowledge file `knw-ot-records`, Suite Status From the Records. Only a human sets `retired`. The Suite is never deleted.

## Templates

- [[tmp-ot-suite-v0.1]]
````

## Release

````markdown
# Release

A Release is the Mesh record that one commit of one product passed every orbtest gate: a whole-profile run per blocking profile with no unmet task, a snapshot run per suite with every cell passed, and a green drift check, all at that commit. It links the Runs and Suites that prove it and copies their counts. A commit has at most one Release. A later run at the same commit that does not pass disputes the Release; the facts of the Release do not change. A Release is not a Run: a Run is one machine result, a Release is the human decision that a commit is safe to ship.

## Properties

| Property | Value |
|----------|-------|
| Tag | `#ot/release` |
| Naming | `(Release) NNN <basename of product root> <short commit>.md` |
| Location | `Mesh/Types/Releases/` |
| Archive | `Mesh/Archive/Releases/` |
| Key | `commit` and `product-root`: at most one Release per commit per product root |
| Written by | The `record_release` skill only. The `record_run` and `record_suite` skills can set `disputed`. |

## Lifecycle

```
green → disputed
any status → retired
```

| Status | Meaning |
|--------|---------|
| `green` | Every gate passed at the commit. |
| `disputed` | A later whole-profile run or snapshot run at the same commit did not pass. `disputed-by` names it. |
| `retired` | By hand only. |

## Templates

- [[tmp-ot-release-v0.1]]
````
