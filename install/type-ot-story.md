---
id: 63b15d89-d72d-44e0-81ab-0b261c516938
tags:
  - "#f/metadata"
  - "#f/type"
---

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
