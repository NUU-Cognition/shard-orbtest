---
description: "(Release) artifact: the Mesh record that one commit passed every orbtest gate"
orb:
  - "@v1/nuucognition/session/43bf2b05-cc4e-4a9f-b82f-cc77e2b5af46#flint/nuu-orbh"
---

# Filename: Mesh/Types/Releases/(Release) NNN [basename of product root] [short commit].md

/* One (Release) per commit per product root, for example `(Release) 001 my-app 64498f84`.
   Only the record_release skill creates it.
   NNN: flint helper type newnumber Release. Check that no file with NNN exists before you write.
   Every count is copied from the linked (Run) artifacts and the snapshot run.json files, except
   the four sums the skill names. Never embed a screenshot. */

```markdown
---
id: [generate-uuid4]
tags:
  - "#ot/release"
status: [green|disputed|retired]
product-root: [product root relative to the Flint root]
commit: [full 40-character commit hash]
branch: [branch name at record time, or empty when detached]
machine: [machine name from flint whoami]
recorded-by: [operator Name from flint whoami]
recorded-at: "[ISO 8601 date-time of the record]"
profiles:
  - [blocking profile id, in profile list order]
  - (continue)
runs:
  - "[[(Run) NNN name]]"
  - (continue)
suites:
  - "[[(Suite) NNN name]]"
  - (continue)
drift-check: [exit code of flint orbtest drift --check at the commit, 0]
tasks-total: [sum of tasks-total over the linked (Run) artifacts]
tasks-met: [sum of tasks-met over the linked (Run) artifacts]
cells-total: [sum of summary.cells.total over the snapshot runs of the Gate table]
cells-pass: [sum of summary.cells.pass over the same runs]
disputed-by: [run id of the run that contradicted this release, or empty]
orb:
  - "[the output of flint address me]"
template: "[[tmp-ot-release-v0.1]]"
authors:
  - "[[@Person Name]]"
---

/* status rules are in the init, Release lifecycle. Quote recorded-at so YAML keeps the string. */

# Gate

| Kind | Run | Profile or suite | Started | Result |
|------|-----|------------------|---------|--------|
| [run|snapshot|drift] | [run id, or `drift --check`] | [profile id, or suite id] | [run.json started, or the time of the drift check] | [tasks met n/n, cells pass n/n, or exit 0] |
| (continue) |

/* One row per blocking profile, one row per suite, one row for the drift check. */

# Task Log

- [YYYY-MM-DD]: recorded from [the run ids]
- (continue)

# Notes

- [the machines that ran the gate, agentic verifications the gate needed, open questions]
- (continue)
```
