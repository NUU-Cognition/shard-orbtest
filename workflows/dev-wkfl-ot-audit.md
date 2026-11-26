---
description: "Audit behaviour tests (the openclaw test audit, adapted): discover low-value and unbound tests read-only, record the evidence of each candidate, decide per batch with the human, bind what guards a contract, remove the rest, validate, record"
---

> [!important] THIS FILE IS AN INSTRUCTION. WHEN REFERENCED IT IS MEANT TO BE TAKEN AS AN ACTION.

Run `flint shard start ot` if you haven't already.

# Workflow: Audit

Raise the value of the behaviour tests of one product. The audit finds test files that no case binds, cases of low value, tests that assert implementation, and duplicates of a stronger proof. It keeps each test that guards a contract and binds it to a case, and it removes the rest with evidence. Optimize for confidence, not for the number of deleted files. This workflow adapts the openclaw test-audit skill to Orbtest: the authoring gate and the junk patterns are in [[dev-knw-ot-behaviour]], The Authoring Gate.

It has no headless twin: a human approves each deletion batch. Headless, run Stage 1 and Stage 2 only, and return the ledger.

# Input

- Product root, as the Products table of the Flint Init spells it
- Mode: `audit` (a focused sweep that prefers a few high-confidence candidates) or `campaign` (every test file that one package or one area owns)
- Scope: a package, a folder of test files, a story, or a junk pattern
- (Optional) The Mesh artifact that asked for the audit, for example a `(Task)`

# Actions

## Stage 1: Discover

This stage is read-only. Change no file.

| Step | Command | Exit |
|------|---------|------|
| Version handshake | `flint orbtest check --root <product-root>` | 0 required, and it runs before every other `flint orbtest` command. On 1, 2, or 3 follow [[dev-init-ot]], Version Handshake. |
| Definitions load | `flint orbtest validate --root <product-root>` | 0 required. |
| Coverage | `flint orbtest coverage --root <product-root> --json` | 0. Keep it as the baseline: the criterion states, the orphans, the unaccounted test files, the quarantined cases, the repaired cases. |
| Bindings | `flint orbtest behaviour bind --root <product-root> --check --json` | 0 or 1. The unbound cases, the markers that name no case, the cases with two markers, the test files with no marker. |
| Baseline run | `flint orbtest behaviour run --root <product-root> --story <story-id...>` for the stories of the scope | Keep the `report <path>` line and the state of each case. |

- Read the instructions of the product first: `AGENTS.md`, `CLAUDE.md`, and the testing rules of its docs.
- For each candidate, read the complete test, its production owner, the entry point, the callers, the callees, the sibling implementations, the overlapping tests and cases, and the history (`git -C <product-root> log --follow -- <file>`). When a test claims a behaviour of a dependency, read the dependency source or its types.
- Hunt for the junk patterns. An unaccounted test file (a test that no case binds, for example an old test that a product brings back from an archive) is a candidate too: either it guards a contract and gets a case, or it goes.
- For a broad scope, run parallel discovery lanes, one per package or folder, plus one sweep for each junk pattern. In `audit` mode, prefer a few candidates of high confidence over a large inventory.
- Once each candidate is found, progress to the next stage.

## Stage 2: Evidence

Write the ledger: one row per candidate. Record every field before any edit. A missing field means the candidate is not ready for deletion.

| Field | What to write |
|-------|---------------|
| Test | The exact test name and location, and its case id when it has one |
| Detects | The failure that it can actually detect |
| Callers | The non-test callers of the production code or the support seam that it covers |
| Stronger proof | The case (by case id) at the owner boundary that still proves the contract after a deletion, or why no proof is needed |
| History | Why the test or the seam exists, from the history |
| Unlocks | The production code or test support that a deletion removes |
| Risk | The risk, and the focused command that validates the decision |
| Decision | `retain` (bind it to a case), `repair` (rewrite it at the owner boundary), `consolidate` (merge into a table-driven case or a shared fixture), or `delete` |

**The retention bar.** Retain a test that alone enforces a public API, protocol, config, migration, storage, security, platform, default, package, release, or architecture contract. Also retain:

- call ordering when the order is observable behaviour;
- a regression with a credible failure mode;
- a source inspection when it is the cheapest independent guard: it fails when the contract changes (the key, the byte, the path that a user sees) and survives a rename of an identifier;
- a retained test that fails on the baseline: it is a possible product bug, not a deletion. Reproduce it, and repair the owner.

Static or slow is not a reason to delete. A test that looks like implementation can still be the only guard of a contract: prove the opposite before a deletion.

- Once the ledger is complete, progress to the next stage.

## Stage 3: Decide

- Group the ledger into batches. One batch is one coherent owner: one module, one command, or one contract.
- Checkpoint: the human approves each batch, row by row. Only an approved `delete` row is deleted. Once a batch is approved, progress to the next stage with that batch.

## Stage 4: Edit

Work on one approved batch at a time. Do not edit a test or the product while a test run is live in the checkout.

| Decision | What you do |
|----------|-------------|
| `retain` | Write the case of the test in a spec per [[dev-wkfl-ot-behaviour]], Stage 3, with the four gate answers and `oracle`. Put the marker `orbtest: <spec-id>/<case-id>` next to the test. When the product keeps its behaviour tests in `orbtest/behaviour/tests/`, move the test there. For a retained regression, see it fail first per [[dev-wkfl-ot-behaviour]], Stage 6. |
| `repair` | Rewrite the test at its owner boundary, bind it, and see it fail first. |
| `consolidate` | Merge the tests into one table-driven case or one shared fixture. Keep one case per contract. |
| `delete` | Delete the approved files. Delete the test-only exports, globals, wrappers, and dead production paths that only these tests used, in the same batch. Do not keep an alias for them. Do not add a replacement test that restates the same implementation. |

- Then run `flint orbtest behaviour bind --root <product-root> --scan`, and commit the batch with the files that the scan printed.

## Stage 5: Validate

| Step | Command | Exit |
|------|---------|------|
| Bindings | `flint orbtest behaviour bind --root <product-root> --check` | 0 for the specs of the batch |
| The owner cases | `flint orbtest behaviour run --root <product-root> --spec <spec-id...>` | 0 required |
| Coverage | `flint orbtest coverage --root <product-root> --json` | Compare with the baseline of Stage 1: no criterion lost `proven`, and fewer unaccounted test files |
| Confirm | `flint orbtest behaviour run --root <product-root> --spec <spec-id...> --confirm` on a clean tree | 0 |
| Drift | `flint orbtest behaviour drift --root <product-root> --check` | 0 |
| Size | `git -C <product-root> diff --numstat <start>..HEAD` | Report the production lines and the test lines apart. |

- A criterion that lost `proven` stops the batch: restore the proof, or give the human the reason. Once the batch validates, go back to Stage 4 for the next approved batch, or progress to the next stage.

## Stage 6: Record and Hand Off

- Write the ledger, with the decision and the commit of each row, into the Mesh artifact that asked for the audit, as a table. The shard has no audit type.
- Write or update the `(Test)` of each new or changed spec per [[dev-tmp-ot-test-v0.3]], and run [[dev-sk-ot-record_story]] for each story whose coverage changed.
- Hand off: the root causes and the removed low-value categories, the production simplifications, the retained false positives and why they stay, the proof that you ran, the production and test line counts, the commits, and the named follow-ups (the next batch or the next package).

# Output

- The ledger with evidence for each candidate, and the decision of the human for each batch
- The retained tests bound to cases and confirmed, the deleted tests and the dead seams gone, committed
- No criterion lost `proven`; fewer unaccounted test files; the Mesh up to date
