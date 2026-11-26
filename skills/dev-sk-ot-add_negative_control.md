---
description: "Create an expect-fail task from a confirmed task and one wrong input, confirm it, and record its (Test)"
---

> [!important] THIS FILE IS AN INSTRUCTION. WHEN REFERENCED IT IS MEANT TO BE TAKEN AS AN ACTION.

Run `flint shard start ot` if you haven't already.

# Skill: Add Negative Control

Prove that a journey fails when one input is wrong. Run it after the first confirmed task of a story.

# Input

- Product root, as the Products table of the Flint Init spells it
- Source task id, for example `cli.read-note`
- The one input to replace and its wrong value, as `<key>=<value>`, for example `lookup="Orbtest Missing Note"`
- (Optional) Id, name, and description of the new task. Defaults: `<source-id>.wrong-<key>`, `<source name> with the wrong <key>`, a negative-control sentence.
- (Optional) `--verify <n>` to keep one deterministic verify entry only

# Actions

1. **Check the folder.** Run `flint orbtest check --root <product-root>` before every other `flint orbtest` command. Exit 0 is required. On exit 1, 2, or 3 follow [[dev-init-ot]], Version Handshake, and stop. Then run `flint orbtest validate --root <product-root>`; exit 0 is required, and warnings are allowed.
2. **Show the new task.** Run `flint orbtest task negative add <source-id> --input <key=value> --root <product-root> --dry-run` with the optional flags. Exit 0 is required. Print the diff.
3. **Write the new task.** Run the same command without `--dry-run`. Exit 0 is required. Commit the file it printed with `git -C <product-root> add <file>` and `git -C <product-root> commit -m "orbtest: negative control <new-id>" -- <file>`.
4. **Confirm it.** Run `flint orbtest run --root <product-root> --profile <profile of the source task> --task <new-id> --confirm`. Exit 0 means the final verification failed as expected and the task is anchored. On exit 1 print the `report <path>` line and continue; the task stays `registered`. On exit 3 with `ORBTEST_WORKER_BUSY`, run again after the holder ends. On another exit 2 or 3, stop with the message. Commit the task file when `confirmed` was written.
5. **Create the (Test).** Mint the number with `flint helper type newnumber Test`, check that no file has it, and write the artifact per [[dev-tmp-ot-test-v0.3]] from `flint orbtest task show <new-id> --root <product-root> --json`, with `layer: ui`, `expect: fail`, the same `story` and `covers` as the source `(Test)`, and `status` per the outcome of step 4.
6. **Record the run.** Run [[dev-sk-ot-record_run]] for the run of step 4 with `confirm` true.
7. **Record the story.** Run [[dev-sk-ot-record_story]] for the story of the task when it has one.

# Output

- One new task with `expect: fail` under `orbtest/ui/tasks/`, committed
- One new `(Test)`, one new `(Run)`, and the `(Story)` brought up to date
