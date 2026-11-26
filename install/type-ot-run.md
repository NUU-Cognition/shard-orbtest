---
id: add10bf8-4114-4170-a069-6dbf997b49c8
tags:
  - "#f/metadata"
  - "#f/type"
---

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
