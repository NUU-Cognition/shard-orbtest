---
id: be20692d-409d-415f-972c-2ea0d2a66fd5
tags:
  - "#f/metadata"
  - "#f/type"
---

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
