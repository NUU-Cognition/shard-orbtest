---
description: "(Test) artifact: the Mesh record of one UI test (a registered orbtest task) or one behaviour spec and its cases"
orb:
  - "@v1/nuucognition/session/43bf2b05-cc4e-4a9f-b82f-cc77e2b5af46#flint/nuu-orbh"
---

# Filename: Mesh/Types/Tests/(Test) NNN [task name or spec name].md

/* One (Test) per UI task per product root (layer ui), or one (Test) per behaviour spec per
   product root (layer behaviour).
   UI: create it in the Register stage of the tasks workflow, in the add_negative_control skill,
   or when a task has no (Test) yet. The name after NNN is the task `name` from
   `flint orbtest task show <id> --root <product-root>`.
   Behaviour: create it in the Record stage of the behaviour workflow, or in the audit workflow.
   The name after NNN is the spec `name`, else its first `#` heading, from
   `flint orbtest behaviour show <spec-id> --root <product-root> --json`.
   NNN: flint helper type newnumber Test. Check that no file with NNN exists before you write.
   Copy every id, commit, and time from the CLI output, the task YAML, or the sidecar. Compute nothing.
   Criterion numbers in the Mesh are 1-based. The CLI criterion addresses are 0-based:
   Mesh number n is the address <story-id>#<n-1>.
   Never embed a screenshot or a DOM snapshot. */

```markdown
---
id: [generate-uuid4]
tags:
  - "#ot/test"
layer: [ui|behaviour]
status: [registered|confirmed|stale|retired]
test-id: [ui: task id, for example home.sign-in | behaviour: spec id, for example app.home.example]
product-root: [product root relative to the Flint root, for example ../Repos/app/apps/my-app]
spec: [behaviour: the spec path relative to the product root, for example orbtest/behaviour/specs/app.home.example.md | ui: empty]
environment: [behaviour: the environment of the spec, or local | ui: empty]
profile: [ui: task profile id | behaviour: empty]
story: "[[(Story) NNN name]]"
covers:
  - [criterion number, 1-based, of the story acceptance list]
  - (continue)
expect: [ui: pass|fail | behaviour: empty]
steps:
  - [ui: step id, in task order, repeats kept | behaviour: none, leave the list empty]
  - (continue)
components:
  - [ui: component of each step, unique, in first-use order | behaviour: the `components` of the spec front matter]
  - (continue)
confirmed-commit: [ui: confirmed.commit from the task | behaviour: the newest confirmed.commit among the sidecar entries of the spec | or empty]
confirmed-run: [the run of the same anchor, or empty]
confirmed-at: "[the at of the same anchor, byte for byte, or empty]"
last-outcome: [met|unmet|empty]
runs:
  - "[[(Run) NNN name]]"
  - (continue)
wip-commits:
orb:
  - "[the output of flint address me]"
template: "[[tmp-ot-test-v0.3]]"
authors:
  - "[[@Person Name]]"
---

/* status rules are in the init, Test lifecycle. The status of a behaviour (Test) comes from the
   case states of its spec: confirmed when every case that proves a criterion is `proven`,
   stale when a case is `stale` or `suspect`, else registered. retired is a human decision.
   story: the (Story) whose story-id equals the task `story` or the spec `story`. Empty when none.
   covers: ui: the criteria of the task field `proves`, each address plus one. A negative control
           copies the covers of its source (Test).
           behaviour: every criterion that a case of the spec names in `proves`, each address plus one,
           unique, in number order. Empty when none.
   expect: ui: the task `expect`, `pass` when absent.
   components: ui: `flint orbtest step show <id>` prints the component of a step.
   confirmed-at: quote it so YAML keeps the string.
   last-outcome: ui: from the record_run skill. behaviour: met when every case of the spec passed
           in the newest behaviour run that selected them, else unmet.
   runs: ui only: empty until the record_run skill links a (Run). A behaviour run has no (Run);
           the Task Log names the behaviour run id and its report path.
   wip-commits: the SHAs of the definition commits of this task or spec. */

# Description

[ui: the task `description`, copied | behaviour: the prose of the spec before its first case, copied]

/* ui: write # Final Verification, and no # Cases.
   behaviour: write # Cases, and no # Final Verification. */

# Final Verification

- [deterministic|agentic]
  - [one line per check: `<type> <check or pattern or command>`, for example `dom exists testid dashboard-home` or `route /`. For agentic, the instruction.]
  - (continue)
- (continue)

# Cases

| Case | Kind | Criteria | CLI proves | State | Runner | Test file |
|------|------|----------|------------|-------|--------|-----------|
| [case id without the spec prefix] | [kind] | [1-based numbers, comma-separated, or —] | [the 0-based addresses of `proves`, or —] | [the first flag of the case, for example proven, stale, or ungated] | [vitest, bash, command, or checks] | [the bound file relative to the product root, or — for checks] |
| (continue) |

/* One row per case of the spec, in file order, from `behaviour show <spec-id> --json` and the
   sidecar. Copy the state; compute nothing. An invalid case keeps its row with state invalid. */

# Task Log

- [YYYY-MM-DD]: [what happened, for example registered at commit 64498f8, run 2026-09-23T17-19-10Z met, or case create-refuses-a-home-with-no-identity failed first at behaviour-2026-09-27T09-12-30-123Z-3f9a1c2b and was confirmed at behaviour-2026-09-27T09-20-02-511Z-a07c33e1, report <path>]
- (continue)

# Notes

- [caveats and open questions, or none]
- (continue)
```
