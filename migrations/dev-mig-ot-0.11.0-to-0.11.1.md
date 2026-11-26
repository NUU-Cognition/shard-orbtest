---
description: "No Mesh file changes from 0.11.0 to 0.11.1; this step keeps the migration chain complete, so check that nothing changed and mark it finished"
type: agent
migration:
  from: "0.11.0"
  to: "0.11.1"
orbh-sessions:
  - "[[b196755f-5e21-43d7-94f0-4c43c6e0d2a6]]"
---

> [!important] THIS FILE IS A MIGRATION. WHEN RUN, EXECUTE THE STEPS AGAINST THE WORKSPACE, THEN MARK IT FINISHED.

# Migration: Orbtest 0.11.0 → 0.11.1 (no Mesh change)

Shard 0.11.1 changes the text of the shard only: one workflow for each mode (NUU Orbh Task 748). The headless workflows and the headless init are merged into the `> [!headless]` callouts of each workflow and the section `# Headless` of the init. The installer replaces the shard files itself. No installed Mesh file of the shard names a headless file, so no Mesh file changes in this migration.

This migration exists because the installer needs a complete migration chain. When the `migrations/` folder holds a file, every version step needs one migration file.

The installed Mesh files of the shard, which this migration does not change:

| Installed file | Install mode |
|----------------|--------------|
| `Mesh/Metadata/Types/(Type) Test (Orbtest Shard).md` | type, `once` |
| `Mesh/Metadata/Types/(Type) Run (Orbtest Shard).md` | type, `once` |
| `Mesh/Metadata/Types/(Type) Story (Orbtest Shard).md` | type, `once` |
| `Mesh/Metadata/Types/(Type) Suite (Orbtest Shard).md` | type, `once` |
| `Mesh/Metadata/Types/(Type) Release (Orbtest Shard).md` | type, `once` |
| `Mesh/(Dashboard) Tests.md` | `once` |

# Steps

1. **Change nothing.** Do not write, move, or delete a file under `Mesh/` for this migration. The `(Test)`, `(Run)`, `(Story)`, `(Suite)`, and `(Release)` artifacts of the Flint do not change either.

## Verification

Run each check. When one fails, stop and report. Do not finish the migration.

1. The installed files of the table did not change in this migration. In a Flint under git, this command prints nothing:
   `git status --porcelain -- "Mesh/Metadata/Types" "Mesh/(Dashboard) Tests.md"`
   A change that was there before this migration started is not a failure. Name it in the report.

Then run `flint shard migrate finish ot`.
