---
description: "(Story) artifact: the Mesh record of one orbtest story and the criterion states of both layers, UI tests and behaviour tests"
orb:
  - "@v1/nuucognition/session/43bf2b05-cc4e-4a9f-b82f-cc77e2b5af46#flint/nuu-orbh"
---

# Filename: Mesh/Types/Stories/(Story) NNN [story name].md

/* One (Story) per story id per product root, for example `(Story) 004 Export writes every note to a file`
   for the story `cli.export` of a CLI app.
   Only the record_story skill creates or rewrites the copied parts: the frontmatter fields
   story-id, product-root, tier, stale, acceptance, criterion-states, covered-ui,
   covered-behaviour, tests; the # Story text; the # Acceptance Criteria checklist; the # Tests
   table. Workflows add Task Log and Notes only.
   NNN: flint helper type newnumber Story. Check that no file with NNN exists before you write.
   The name after NNN is the story `name` from `flint orbtest story show <id> --root <product-root>`.
   The criterion states come from `flint orbtest coverage --root <product-root> --story <id> --json`,
   which counts both layers. Copy them; compute nothing. */

```markdown
---
id: [generate-uuid4]
tags:
  - "#ot/story"
story-id: [story id, for example cli.export]
product-root: [product root relative to the Flint root]
tier: [blocking|informational, or empty when the YAML has none]
stale: [stale from the YAML, false when absent]
acceptance:
  - [criterion text, copied, in YAML order]
  - (continue)
criterion-states:
  - [proven|failing|stale|gap|not-run|waived, the state of the criterion of the same position]
  - (continue)
covered-ui: [the number of criteria that a UI test proves]
covered-behaviour: [the number of criteria that a behaviour case proves]
tests:
  - "[[(Test) NNN name]]"
  - (continue)
orb:
  - "[the output of flint address me]"
template: "[[tmp-ot-story-v0.2]]"
authors:
  - "[[@Person Name]]"
---

/* The criterion number is the 1-based position in acceptance. The CLI address is 0-based:
   number n is the address <story-id>#<n-1>. criterion-states has one entry per entry of
   acceptance, in the same order.
   covered-ui: the criteria in state proven that a UI task of the coverage output proves.
   covered-behaviour: the criteria in state proven that a behaviour case of the coverage output
   proves. A criterion that both layers prove counts in both.
   tests: every (Test) of either layer whose task or spec names this story, in (Test) number order.
   Empty when no task and no spec of the story has a (Test). acceptance and criterion-states are
   empty lists when the YAML has no criteria. */

# Story

[the story `story` text, copied]

# Acceptance Criteria

- [x] [n]. [criterion text] — proven — [[(Test) NNN name]] (ui), [[(Test) NNN name]] (behaviour)
- [ ] [n]. [criterion text] — [state] — [[(Test) NNN name]] (behaviour)
- [ ] [n]. [criterion text] — gap
- (continue)

/* One line per criterion, in number order. Write `- [x]` when the state is proven, else `- [ ]`.
   After the text write ` — ` and the state. Then write ` — ` and every (Test) whose covers holds n,
   comma-separated, in number order, each followed by its layer in parentheses. A criterion with
   no such (Test) has no third part. When the coverage output shows setup errors for the
   criterion, append ` (setup error: <case ids>)`. */

# Tests

| Test | Layer | test-id | status | covers |
|------|-------|---------|--------|--------|
| [[(Test) NNN name]] | [ui or behaviour] | [test-id] | [status] | [covers numbers, comma-separated, or —] |
| (continue) |

/* One row per entry of tests, in order, copied from the (Test) frontmatter.
   Write `*None*` instead of the table when tests is empty. */

# Task Log

- [YYYY-MM-DD]: [what happened, for example recorded from story cli.export; 5/6 criteria proven (ui 4, behaviour 3)]
- (continue)

# Notes

- Unrecorded tasks:
  - [UI task id of the story with no (Test)]
  - (continue)
- Unrecorded specs:
  - [behaviour spec id of the story with no (Test)]
  - (continue)

/* When every task of the story has a (Test), write `- Unrecorded tasks: none`. When every spec
   of the story has a (Test), write `- Unrecorded specs: none`. */
```
