---
description: "No Mesh file changes from 0.9.2 to 0.10.0; this step keeps the migration chain complete, so check that nothing changed and mark it finished"
type: agent
migration:
  from: "0.9.2"
  to: "0.10.0"
---

> [!important] THIS FILE IS A MIGRATION. WHEN RUN, EXECUTE THE STEPS AGAINST THE WORKSPACE, THEN MARK IT FINISHED.

# Migration: Orbtest 0.9.2 → 0.10.0 (no Mesh change)

Shard 0.10.0 changes the text of the shard only: the layout of format 0.0.1 with `ui/` and `environments/`, and the two halves of a profile. The installer replaces the shard files itself. No installed Mesh file of the shard names a changed path, so no Mesh file changes in this migration.

This migration exists because the installer needs a complete migration chain. When the `migrations/` folder holds a file, every version step needs one migration file. The 0.9.1 → 0.9.2 migration stays for a Flint that is still on 0.9.1.

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
2. **Check the Products table.** Read the Orbtest section of `Mesh/(System) Flint Init.md`. The product roots of the rows do not change: shard 0.10.0 changes the folders inside `orbtest/`, not the product root. Change nothing there.

## Verification

Run each check. When one fails, stop and report. Do not finish the migration.

1. The installed files of the table did not change in this migration. In a Flint under git, this command prints nothing:
   `git status --porcelain -- "Mesh/Metadata/Types" "Mesh/(Dashboard) Tests.md"`
   A change that was there before this migration started is not a failure. Name it in the report. Two examples: a change that another session made, and the five `(Type)` files that the 0.9.1 → 0.9.2 migration rewrote just before this one, in a Flint that went from 0.9.1 to 0.10.0 in one install.
2. No installed file of the table names a folder of the first layout of format 0.0.1. This command prints nothing and exits 1:
   `grep -nE "orbtest/(profiles|steps|tasks|briefs|fixtures|suites|baselines)\b" Mesh/Metadata/Types/*"(Orbtest Shard).md" "Mesh/(Dashboard) Tests.md"`

Then run `flint shard migrate finish ot`.
