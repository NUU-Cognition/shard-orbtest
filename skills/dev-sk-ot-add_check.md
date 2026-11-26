---
description: "Add a dom, route, sql, or command check to the final verification of a task, re-confirm the task, and update its (Test)"
orb:
  - "@v1/nuucognition/session/43bf2b05-cc4e-4a9f-b82f-cc77e2b5af46#flint/nuu-orbh"
---

> [!important] THIS FILE IS AN INSTRUCTION. WHEN REFERENCED IT IS MEANT TO BE TAKEN AS AN ACTION.

Run `flint shard start ot` if you haven't already.

# Skill: Add Check

Tighten the final verification of a task with one deterministic check.

# Input

- Product root, as the Products table of the Flint Init spells it
- Task id
- Check type: `dom`, `route`, `sql`, or `command`
- The check fields as `<path>=<value>` pairs, for example `check=exists locator.strategy=testid locator.value=dashboard-home`, or a JSON or YAML file outside `orbtest/` with the fields. The shapes are in `flint orbtest skills --section checks`.

# Actions

1. **Check the folder.** Run `flint orbtest check --root <product-root>` before every other `flint orbtest` command. Exit 0 is required. On exit 1, 2, or 3 follow [[dev-init-ot]], Version Handshake, and stop. Then run `flint orbtest validate --root <product-root>`; exit 0 is required, and warnings are allowed.
2. **Read the verification.** Run `flint orbtest task check list <task-id> --root <product-root>`. It prints every deterministic check with its 0-based index.
3. **Show the change.** Run `flint orbtest task check add <task-id> --kind <type> --arg <path=value...> --root <product-root> --dry-run`, or with `--file <path>`. Exit 0 is required. Print the diff.
4. **Write the check.** Run the same command without `--dry-run`. Exit 0 is required. It prints the file it changed.
5. **Re-confirm.** Run `flint orbtest run --root <product-root> --profile <task profile> --task <task-id> --confirm`. Exit 0 anchors the task again. On exit 1 print the `report <path>` line, remove the check with `flint orbtest task check remove <task-id> <n> --root <product-root>` where `<n>` is the new index, and stop with `check failed: <failure.detail>`. On exit 2 with a dirty tree, commit the task file first and run again. On exit 3 with `ORBTEST_WORKER_BUSY`, run again after the holder ends. On another exit 2 or 3, stop with the message.
6. **Commit.** Commit the task file with `git -C <product-root> add <file>` and `git -C <product-root> commit -m "orbtest: check on <task-id>" -- <file>`.
7. **Update the (Test).** When a `(Test)` with this `test-id` and `product-root` exists, rewrite its Final Verification section from `task show --json`, copy the new `confirmed-*` fields, and add a Task Log entry `<date>: added <type> check; run <run-id> met`. Stamp your session in `orb:`: run `flint address me`, and append its `by` address (quoted) to `orb:`. Add nothing when `orb:` or `orbh-sessions` already has an item that is exactly your `by` address, `@v1/<org>/session/<uuid>`, `[[<uuid>]]`, or your bare `<uuid>`. An old (Test) keeps `orbh-sessions`: never remove it, and add no new item to it. See [[knw-f-artifacts]] § Session Tracking.
8. **Record the run.** Run [[dev-sk-ot-record_run]] for the run of step 5 with `confirm` true.

# Output

- The task carries one more deterministic check and a new `confirmed` anchor, committed
- The `(Test)` and a new `(Run)` reflect it
