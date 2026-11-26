---
description: "Heal behaviour tests: read the non-green cases, run the healer, review each verdict and repair against the healer rules, confirm, record"
orbh-sessions:
  - "[[b196755f-5e21-43d7-94f0-4c43c6e0d2a6]]"
---

> [!important] THIS FILE IS AN INSTRUCTION. WHEN REFERENCED IT IS MEANT TO BE TAKEN AS AN ACTION.

Run `flint shard start ot` if you haven't already.

# Workflow: Heal

Bring behaviour cases that fail, error, or went stale back to `proven`, without hiding a real bug. The healer gives one verdict per case with a rationale that cites evidence. You review each verdict and each repair. The human decides each change of the words, the product, or a fixture recipe. Read [[dev-knw-ot-behaviour]], The Healer, before Stage 1. For UI tests, use [[dev-wkfl-ot-repair]].

> [!headless]
> In a headless or subagent Orbh session, the stages and the commands are the same. There is no checkpoint. The healer may act alone within its rules: rebuild a fixture once, quarantine a flaky case, and apply a `test_wrong` patch that no rule refused. An applied patch leaves the case `repaired`, and a human accepts the diff later. A change of the words, the product, or a fixture recipe is never made headless: it goes into the result as a proposal. Report per [[dev-init-ot#Headless]]. Follow the `> [!headless]` callout in each stage.

# Input

- Product root, as the Products table of the Flint Init spells it
- (Optional) Run id; default the newest behaviour run
- (Optional) Case ids to restrict to
- (Optional) Agent target `<runtime/profile>` for the healer

# Actions

## Stage 1: Report

| Step | Command | Exit |
|------|---------|------|
| Version handshake | `flint orbtest check --root <product-root>` | 0 required, and it runs before every other `flint orbtest` command. On 1, 2, or 3 follow [[dev-init-ot]], Version Handshake. |
| Definitions load | `flint orbtest validate --root <product-root>` | 0 required. Read each warning of the behaviour layer. |
| Coverage | `flint orbtest coverage --root <product-root> --layer behaviour --json` | 0. The cases that are not green, with their flags. |
| Drift | `flint orbtest behaviour drift --root <product-root> --json` | 0. The drift signal of each case. |

Class every case that is not green:

| Case state | Class | Next |
|------------|-------|------|
| `failing`, `error` | Heal | Stage 2 |
| `stale`, `suspect` | Re-run | Run `flint orbtest behaviour run --root <product-root> --case <id...>` once. A case that passes goes to Stage 4 for a confirm. A case that fails goes to Stage 2. |
| `unbound`, `ungated`, `invalid` | Words or binding | Not a healer case. The words or the binding need work: [[dev-wkfl-ot-behaviour]], Stage 3 to Stage 5. |
| `quarantined` | Flake | Read the heal record that quarantined it. Propose the fix of the cause (a race, a shared port, a shared folder). A quarantined case proves nothing until the fix and a confirmed run. |
| `repaired` | Review | Stage 3: the human reviews the diff of the earlier heal. |

- Give the human the class table. Once it is read, progress to the next stage.

> [!headless]
> - `flint orbh session set phase report`, `progress "stage 1/5"`. Run `flint orbtest check --root <product-root>` first, and act on its exit code per [[dev-init-ot#Headless]], Version Handshake, Headless. Then do the rest of this stage and class every case that is not green. Run the `stale` and `suspect` cases once. Write the class table into the result. Progress to the next stage.

## Stage 2: Heal

| Step | Command | Exit |
|------|---------|------|
| Diagnose | `flint orbtest behaviour heal --root <product-root> [--run <run-id>] [--case <id...>] [--target <runtime/profile>] --json` | 0 a verdict for each case. 2 refused: read the message. 3 no agent. |

- Run it once for the run, and never with `--apply` in this workflow. Without `--apply`, the healer changes no test. Alone, it may rebuild a fixture once in a fresh folder and run the case again once, and it may quarantine a flaky case.
- It writes one heal record per case at `<run dir>/heal/<encoded case id>.json`. Read each record: the verdict, the rationale, the citations, the confidence, the action, the patch, and the rules that refused a patch (`refused`).
- Never run `heal` again on the same run to apply an approved patch. Each `heal` call asks the agent for a new verdict. It can give another patch, and it replaces the record that the human reviewed. Stage 4 applies the stored patch that the human approved.
- Once every case has a record, progress to the next stage.

> [!headless]
> - `phase heal`, `progress "stage 2/5 · case <k>/<n>"`. A headless heal runs with `--apply`: run `flint orbtest behaviour heal --root <product-root> [--run <run-id>] [--case <id...>] [--target <runtime/profile>] --apply --json` for the cases of the Heal class. Exit 3 is a blocker: set `phase blocked`, `blockers "no heal agent: <message>"`, and return. Run it once for the run. In one call the core diagnoses each case and applies a `test_wrong` patch that no rule refused, so the record holds exactly the patch that it applied (`patch.applied: true`). Never run `heal` a second time on the same run: a second call asks the agent again, can apply another patch, and replaces the record. Read each heal record. `flint orbh update "<case>: <verdict>, <action>" --kind finding` per case. Progress to the next stage.

## Stage 3: Review

Review each record by its verdict. The words of the spec are the judge.

| Verdict | Review | Decision of the human |
|---------|--------|-----------------------|
| `environment_broken` | Read the fixture records and the hook output in the case folder. When the rebuild passed, the cause is the environment, not the product. | A recipe change or a hook change, through [[dev-wkfl-ot-behaviour]], Stage 2 |
| `test_wrong` | Read the stored patch (`patch.diff` of the record). It must argue from the `then` lines. It must not weaken an assertion, replace an expected value with the observed value, add a skip, or change the words or the product. It must still fail against the planted fault of the fail-first run. | Approve the stored patch with its digest, or reject it |
| `flaky` | Read the fail rate and the attempts. | Accept the quarantine, and name the fix of the cause |
| `spec_outdated` | Compare the words with the product change and its commit. | Change the words (the case is then `stale` until a new confirm), or call it a product bug |
| `product_bug` | Read the failing line and the words. Check that the case fails for the reason that the words give. | Report the bug. The case stays failing. Add a regression case when the present case does not name the bug. A Projects `(Task)` for the fix is the human's choice. |
| `unknown` | Read the evidence yourself. | Decide the class, or stop |

- A record with `refused` holds a patch that broke a rule. Never apply it, and never write the same change by hand. Show the rule and the patch to the human.
- A case that needs a second heal in a row goes to quarantine. Do not heal it a third time.
- **The digest of a patch.** For each `test_wrong` record with a patch and no `refused`, write `patch.diff` of the record, byte for byte and with one final newline, to a file outside the repository, for example `$TMPDIR/heal-<encoded case id>.patch`. The digest is the sha256 of that file: `shasum -a 256 <patch file>`, or `sha256sum <patch file>` on Linux. Show the human the diff and its digest together.
- Checkpoint: the human decides each case. For each approved patch, keep the record path, the patch file, and the approved digest for Stage 4. Once each case has a decision, progress to the next stage.

> [!headless]
> - `phase review`. Check each applied patch against the rules of this stage. A patch that breaks a rule the healer did not catch is reverted: write `patch.diff` of the record to a file outside the repository, run `git -C <repository> apply -R [--directory=<prefix>] <patch file>` (as in Stage 4), and name it in the result. The case stays `repaired` until a confirmed run clears the flag. Never apply a patch from a `refused` record. Commit each applied patch that passed the review in its own commit, with the heal record path in the message, so that a human can review and revert it. There is no checkpoint. Progress to the next stage.

## Stage 4: Apply and Confirm

Apply each approved patch yourself, exactly as the human approved it. The core applies a patch the same way: `git apply --check`, then `git apply`, with the paths of the patch relative to the product root. `<repository>` and the product root come from the Products table. `--directory=<prefix>` is needed only when the product root is a folder inside the repository: `<prefix>` is the product root relative to the repository.

| Check | How | Required |
|-------|-----|----------|
| The proposal did not change | Write `patch.diff` of the record to the patch file again, and compute its digest. | Equal to the approved digest. Else another heal replaced the record: stop, and review again (Stage 3). |
| The diff is complete | Search the patch file for `[redacted]`. | No match. The record keeps the diff after redaction: a patch with a redaction mark is not the patch of the agent. Do not apply it; report it to the human. |
| The test did not change | `shasum -a 256 <product-root>/<patch.file>` | Equal to `hashes.test` of the case in `<run dir>/run.json`. Else the test changed after the run: run the case again, and heal the new run. |
| The patch applies | `git -C <repository> apply --check [--directory=<prefix>] <patch file>` | Exit 0. Else the file changed under the patch: stop, and review again. |
| Apply | `git -C <repository> apply [--directory=<prefix>] <patch file>` | Exit 0 |

- Show the human the working-tree diff of the test file. It must be the approved diff and nothing more. Commit the test file alone, with the heal record path and the approved digest in the commit message.
- See the case fail first again against the planted fault, per [[dev-wkfl-ot-behaviour]], Stage 6.
- A case that is `repaired` already had its patch applied by a headless heal (this workflow in a headless session, Stage 2). Show the human the applied diff (the `patch.diff` of its record, and its commit). When the human accepts it, see it fail first, then confirm below. When the human rejects it, revert it with `git -C <repository> apply -R [--directory=<prefix>] <patch file>`, and commit the revert.
- Commit each approved change of the words and each approved recipe change, with the heal record path in the commit message.

| Step | Command | Exit |
|------|---------|------|
| Clean tree | `git -C <product-root> status --porcelain` | Empty required |
| Confirm | `flint orbtest behaviour run --root <product-root> --case <case-id...> --confirm` | 0: the cases are anchored and `proven` again, and the anchor clears a `repaired` flag. 1: give the human the `report <path>` line; the case stays failing. |
| Anchors | Commit the sidecars that the confirm changed. | |
| Drift | `flint orbtest behaviour drift --root <product-root> --check` | 0 required |

- A retry pass never proves. Only a clean first-attempt pass with `--confirm` restores proof. Once the confirm ran, progress to the next stage.

> [!headless]
> - `phase confirm`. Do not apply a patch in this stage: the healer applied each patch in Stage 2. Never confirm a `repaired` case headless. Confirm only the cases of the Re-run class that passed, and the cases whose fixture rebuild passed: `flint orbtest behaviour run --root <product-root> --case <case-id...> --confirm`. A dirty tree is a blocker: set `phase blocked`, `blockers "dirty tree under <product-root>"`, and return. Commit the changed sidecars. Run `flint orbtest behaviour drift --root <product-root> --check`. Progress to the next stage.

## Stage 5: Record

- For each healed case, update the `(Test)` of its spec per [[dev-tmp-ot-test-v0.3]]: the state in the case table, `status`, the confirmed fields, and one Task Log line `<date>: heal <run-id> <case-id>: <verdict>, <action>; record <run dir>/heal/<file>`.
- Run [[dev-sk-ot-record_story]] for each story whose criterion states changed.

> [!headless]
> - `phase record`. Update the `(Test)` artifacts and run [[dev-sk-ot-record_story]] as this stage says. Set `artifacts`.
> - `phase complete` when no case waits for a decision, else `phase blocked` with the list. End with `flint orbh session return --finish "<result>"`: each case with its verdict, action, heal record path, and state; each `repaired` case with its commit and diff for review; each proposal of a change of the words, the product, or a fixture recipe; each product bug with its evidence; the confirm run and the drift exit code; the commit SHAs; the artifacts.

# Output

- A heal record for each case, and a decision of the human for each verdict
- Each accepted repair committed and confirmed, each flaky case quarantined with its cause named, each product bug reported with its evidence
- `behaviour drift --check` at exit 0, and the `(Test)` and `(Story)` artifacts up to date

> [!headless]
> - The output above, in the returned result. The `repaired` cases and the proposals wait for a human.
