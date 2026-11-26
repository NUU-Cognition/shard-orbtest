---
description: "Write or rewrite a (Story) from one orbtest story, link the (Test) artifacts of both layers, and copy the criterion states"
orb:
  - "@v1/nuucognition/session/43bf2b05-cc4e-4a9f-b82f-cc77e2b5af46#flint/nuu-orbh"
---

> [!important] THIS FILE IS AN INSTRUCTION. WHEN REFERENCED IT IS MEANT TO BE TAKEN AS AN ACTION.

Run `flint shard start ot` if you haven't already.

# Skill: Record Story

Bring one `(Story)` in step with the story YAML, the criterion states of both layers, and the `(Test)` artifacts of its UI tasks and behaviour specs.

# Input

- Product root, as the Products table of the Flint Init spells it
- Story id, for example `access.sign-in`

# Actions

1. **Check the folder.** Run `flint orbtest check --root <product-root>` before every other `flint orbtest` command. Exit 0 is required. On exit 1, 2, or 3 follow [[dev-init-ot]], Version Handshake, and stop. Then run `flint orbtest validate --root <product-root>`; exit 0 is required, and warnings are allowed.
2. **Load the story.** Run `flint orbtest story show <story-id> --root <product-root> --json`. Stop with the CLI message on exit 2. It prints the fields, the criteria by 0-based index, and the bound task ids.
3. **Load the states.** Run `flint orbtest coverage --root <product-root> --story <story-id> --json`. It gives the state of each criterion from both layers, the behaviour cases and UI tasks under each criterion, and the setup errors. Run `flint orbtest behaviour list --root <product-root> --story <story-id> --json` for the spec ids of the story.
4. **Find or create.** Find the `(Story)` under `Mesh/Types/Stories/` with this `story-id` and `product-root`. When none exists, mint the number with `flint helper type newnumber Story`, check that no file has it, and write the artifact per [[dev-tmp-ot-story-v0.2]]. A `(Story)` with the template `tmp-ot-story-v0.1` is rewritten in the form of v0.2, and its `template` field changes to `[[tmp-ot-story-v0.2]]`.
5. **Copy the fields.** Set `story-id`, `product-root`, `tier`, `stale`, and `acceptance` from step 2, and the `# Story` text. Set `criterion-states`, `covered-ui`, and `covered-behaviour` from step 3. When a criterion text changed while a `(Test)` covers it, add a Notes line `criterion <n> changed: <old> → <new>` and keep the number.
6. **Bind the tests.** `tests` is every `(Test)` under `Mesh/Types/Tests/` with a matching `product-root` whose `test-id` is a bound task id of step 2 (a `(Test)` with `layer: ui`, or with no `layer`) or a spec id of step 3 (a `(Test)` with `layer: behaviour`), in `(Test)` number order. Set `story` on each such `(Test)` to this `(Story)` wikilink when it is empty. List a bound task with no `(Test)` under Unrecorded tasks, and a spec with no `(Test)` under Unrecorded specs.
7. **Mark the coverage.** Rewrite the `# Acceptance Criteria` checklist per the template rule: a criterion is checked when its state is `proven`.
8. **Rewrite the table.** One `# Tests` row per entry of `tests`, from the `(Test)` frontmatter, with its layer.
9. **Log the change.** Add a Task Log entry `<date>: recorded from story <story-id>; <k>/<n> criteria proven (ui <a>, behaviour <b>)`. Stamp your session in `orb:`: run `flint address me`, and append its `by` address (quoted) to `orb:`. Add nothing when `orb:` or `orbh-sessions` already has an item that is exactly your `by` address, `@v1/<org>/session/<uuid>`, `[[<uuid>]]`, or your bare `<uuid>`. An old (Story) keeps `orbh-sessions`: never remove it, and add no new item to it. See [[knw-f-artifacts]] § Session Tracking.
10. **Stay read-only.** Run `story show`, `task show`, `coverage`, `behaviour list`, and `behaviour show` only. Write nothing under `orbtest/`.

# Output

- One `(Story)` under `Mesh/Types/Stories/` whose fields, criterion states, checklist, and table match the story and the tests of both layers
- Every `(Test)` of the story names the `(Story)`
