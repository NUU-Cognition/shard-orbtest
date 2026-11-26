---
id: 7cdca3bb-ffbd-4cf6-bf08-d0c9c30f36d5
tags:
  - "#f/metadata"
  - "#f/type"
---

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
