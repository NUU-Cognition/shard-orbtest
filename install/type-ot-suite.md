---
id: d7471c1d-99dc-4591-be33-a3a5cdf077f1
tags:
  - "#f/metadata"
  - "#f/type"
---

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
