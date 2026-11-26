---
description: "Plan the stories a product needs: examine it, propose stories, decompose them into UI journeys and behaviour specs, author each approved one"
orbh-sessions:
  - "[[b196755f-5e21-43d7-94f0-4c43c6e0d2a6]]"
---

> [!important] THIS FILE IS AN INSTRUCTION. WHEN REFERENCED IT IS MEANT TO BE TAKEN AS AN ACTION.

Run `flint shard start ot` if you haven't already.

# Workflow: Stories

Give a product the story set that says what it must keep doing, and one confirmed test per acceptance criterion.

> [!headless]
> In a headless or subagent Orbh session, the stages and the commands are the same. A new story needs no approval. The one checkpoint becomes one question that carries the journey list and the spec list. Report per [[dev-init-ot#Headless]]. Follow the `> [!headless]` callout in each stage.

# Input

- Product root, as the Products table of the Flint Init spells it, for example `../Repos/app/apps/my-app`
- Profile id per platform the stories cover
- (Optional) A scope: one feature, one route, or one program

# Actions

## Stage 1: Examine

| Step | Command | Exit |
|------|---------|------|
| Version handshake | `flint orbtest check --root <product-root>` | 0 required, and it runs before every other `flint orbtest` command. On 1, 2, or 3 follow [[dev-init-ot]], Version Handshake. |
| Definitions load | `flint orbtest validate --root <product-root>` | 0 required, warnings allowed. 2 refused: give the human the file and the error. |
| What exists | `flint orbtest story list --root <product-root>`, `flint orbtest task list --root <product-root>` | 0 |

- Read the product: the routes it serves, the actions each screen offers, the commands a program accepts. Write the coverage map: one row per route or command, with the stories and tasks that touch it, or none.
- Once the coverage map is written, progress to the next stage.

> [!headless]
> - `flint orbh session set phase examine`, `progress "stage 1/4"`. Run `flint orbtest check --root <product-root>` first, and act on its exit code per [[dev-init-ot#Headless]], Version Handshake, Headless. Then do the rest of this stage. Once the coverage map is written, progress to the next stage.

## Stage 2: Propose Stories

- Draft one story per feature with no story: `id` as `<area>.<feature>`, a `name`, the `story` text as `As a <role>, I want <goal>, so that <benefit>`, one acceptance criterion per sentence in EARS form ("When <trigger>, the <system> shall <response>." or "If <condition>, then the <system> shall <response>."), and a `tier`. Shapes: `flint orbtest skills --section stories`. Example: the story `access.sign-in` of a web app has four criteria.
- A new story needs no approval. Write each story from what the product does, not from what you expect. Show the human the list of the new stories and their criteria, and continue.

| Step | Command | Exit |
|------|---------|------|
| Write a story | `flint orbtest story add <id> --name "<name>" --story "<text>" --tier <blocking\|informational> --root <product-root>` | 0, 2 |
| Add a criterion | `flint orbtest story criterion add <id> "<text>" --root <product-root>`, once per criterion, in order | 0, 2 |
| Validate | `flint orbtest validate --root <product-root>` | 0 |

- Commit the printed files. Run [[dev-sk-ot-record_story]] per story. Progress to the next stage.

> [!headless]
> - `phase propose`. Draft the stories as this stage says. Run `story add` and `story criterion add` for every story, then `validate`. Commit. Run [[dev-sk-ot-record_story]] per story. Set `artifacts`. `flint orbh update "<n> stories added: <ids>" --kind decision`.

## Stage 3: Decompose

- For every criterion that is not `proven` in `flint orbtest coverage --root <product-root> --json`, choose its layer by its owner boundary. A journey of a person through the interface of the product is a UI test. Any other behaviour (a function, a command, a file format, a protocol) is a behaviour test.
- For a UI test, draft one journey: the task id, the profile, the one-sentence request, the inputs, the expected final state, and `covers`. Reuse a step that `flint orbtest step list --root <product-root>` already lists when the journey passes through it.
- For a behaviour test, draft one spec: the spec id, the criteria it proves, and one line per case. [[dev-wkfl-ot-behaviour]] writes it in Stage 4.
- Checkpoint: the human approves the journey list, the spec list, and their order. Once approved, progress to the next stage.

> [!headless]
> - Draft, for every criterion, the journey or the spec, as this stage says. Set `phase blocked` and ask one question with the journey list and the spec list as the body.
> - Once the answer approves: `phase decompose`. Keep only the approved journeys and specs, in the approved order. `flint orbh update "<n> stories, <m> journeys approved" --kind decision`. Progress to the next stage.

## Stage 4: Author

- Run [[dev-wkfl-ot-tasks]] once per approved journey, and [[dev-wkfl-ot-behaviour]] once per approved spec, in order. Each run ends with a confirmed `(Test)` or a report path.
- After the first confirmed task of a story, run [[dev-sk-ot-add_negative_control]] with one wrong input.
- Run [[dev-sk-ot-record_story]] per story. Print the coverage table: story, criteria covered of total.
- When this workflow changed a story that exists and the Flint has the shard `ite`, follow [[sk-ite-check_after_task]], step 4, with the changed story ids. It never blocks this workflow.

> [!headless]
> - `phase author`, `progress "stage 4/4 · journey <k>/<m>"`. Run [[dev-wkfl-ot-tasks]] per journey and [[dev-wkfl-ot-behaviour]] per spec, with their `> [!headless]` callouts. Then [[dev-sk-ot-add_negative_control]] after the first confirmed task of each story, and [[dev-sk-ot-record_story]] per story.
> - `phase complete`. End with `flint orbh session return --finish "<result>"`: the story ids, the coverage table, the `(Story)` and `(Test)` names, the commit SHAs, and every journey that did not confirm with its report path.
> - When this workflow changed a story that exists and the Flint has the shard `ite`, follow [[sk-ite-check_after_task]], step 4, with the changed story ids. It never blocks this workflow.

# Output

- The stories under `orbtest/stories/`, committed
- One `(Story)` per story, and one confirmed `(Test)` per authored journey or spec
- The coverage table and the list of journeys that did not confirm, with their report paths

> [!headless]
> - The output above, in the returned result
