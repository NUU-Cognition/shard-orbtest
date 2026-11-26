---
id: {{uuid}}
tags:
  - "#dashboard"
  - "#ot/dashboard"
  - "#managed/shard/ot"
  - "#read-only"
  - "#readonly"
---

```dataviewjs
function formatName(p, type) {
  return p.file.name.replace(new RegExp('^\\(' + type + '\\)\\s*'), '');
}

function artifactNumber(p, type) {
  const match = p.file.name.match(new RegExp('^\\(' + type + '\\)\\s*(\\d+)'));
  return match ? parseInt(match[1]) : 9999;
}

// The product root of an artifact, as the Products table of the Flint Init spells it.
function productOf(p) {
  return p["product-root"] ? String(p["product-root"]) : "—";
}

function shortCommit(c) {
  return c ? String(c).slice(0, 7) : "—";
}

function statusIcon(status) {
  const icons = {
    'confirmed': '✅',
    'registered': '⚪',
    'stale': '🟠',
    'retired': '🚫'
  };
  return icons[status] || '⚪';
}

function listLength(v) {
  if (!v) return 0;
  return Array.isArray(v) ? v.length : (v.length ?? 1);
}

// Dataview wraps frontmatter lists in DataArray proxies, which fail Array.isArray.
// Normalise to a plain array so list fields work as lists.
function toArray(v) {
  if (v === null || v === undefined) return [];
  if (Array.isArray(v)) return v;
  if (typeof v.array === 'function') return v.array();
  return [v];
}

function coversOf(p) {
  const v = p.covers;
  if (!v) return [];
  return toArray(v).map(Number).filter(n => Number.isInteger(n));
}

// Resolve the story link to a page and compare file paths; link strings differ in form.
function storyOf(t) {
  if (!t.story) return null;
  const target = dv.page(t.story.path ?? String(t.story));
  return target ? target.file.path : null;
}

const tests = dv.pages('#ot/test').where(p => p.file.path.startsWith('Mesh/Types/Tests/'))
  .array().sort((a, b) => artifactNumber(a, 'Test') - artifactNumber(b, 'Test'));

const stories = dv.pages('#ot/story').where(p => p.file.path.startsWith('Mesh/Types/Stories/'))
  .array().sort((a, b) => artifactNumber(a, 'Story') - artifactNumber(b, 'Story'));

// A criterion n is covered when a test of the story is confirmed and lists n in covers.
function uncoveredOf(story, storyTests) {
  const acceptance = toArray(story.acceptance ?? []);
  const rows = [];
  acceptance.forEach((text, i) => {
    const n = i + 1;
    const covered = storyTests.some(t => t.status === 'confirmed' && coversOf(t).includes(n));
    if (!covered) rows.push({ n, text: String(text) });
  });
  return { total: acceptance.length, uncovered: rows };
}

// Stories: one section per (Story), its product root, its tests, and its uncovered criteria.
// Every table below has a product column, so rows of different products stay apart.
dv.header(1, "Stories");
const gaps = [];
if (stories.length === 0) {
  dv.paragraph("*None*");
} else {
  for (const story of stories) {
    const storyTests = tests.filter(t => storyOf(t) === story.file.path);
    const { total, uncovered } = uncoveredOf(story, storyTests);
    const parts = [
      formatName(story, 'Story'),
      productOf(story),
      story["story-id"] ?? "—",
      (total - uncovered.length) + "/" + total + " criteria",
      story.tier ?? "—"
    ];
    if (story.stale === true) parts.push("stale");
    dv.header(2, parts.join(" · "));
    if (storyTests.length === 0) {
      dv.paragraph("*None*");
    } else {
      dv.table(["#", "Test", "test-id", "status", "covers"],
        storyTests.map(t => [
          artifactNumber(t, 'Test'),
          dv.fileLink(t.file.path, false, formatName(t, 'Test')),
          t["test-id"] ?? "—",
          statusIcon(t.status) + ' ' + t.status,
          coversOf(t).length > 0 ? coversOf(t).join(", ") : "—"
        ])
      );
    }
    dv.paragraph("Uncovered criteria:");
    if (uncovered.length === 0) {
      dv.paragraph("*None*");
    } else {
      dv.list(uncovered.map(u => u.n + ". " + u.text));
    }
    for (const u of uncovered) {
      gaps.push([productOf(story), dv.fileLink(story.file.path, false, formatName(story, 'Story')), u.n, u.text]);
    }
  }
}

// Tests without a story: nothing disappears when a test has no story link.
dv.header(1, "Tests without a story");
const unbound = tests.filter(t => storyOf(t) === null);
if (unbound.length === 0) {
  dv.paragraph("*None*");
} else {
  dv.table(["#", "Test", "product", "test-id", "profile", "status"],
    unbound.map(t => [
      artifactNumber(t, 'Test'),
      dv.fileLink(t.file.path, false, formatName(t, 'Test')),
      productOf(t),
      t["test-id"] ?? "—",
      t.profile ?? "—",
      statusIcon(t.status) + ' ' + t.status
    ])
  );
}

// Gaps: every uncovered criterion across every story.
dv.header(1, "Gaps");
if (gaps.length === 0) {
  dv.paragraph("*None*");
} else {
  dv.table(["product", "Story", "#", "Criterion"], gaps);
}

// Recent Runs: the 10 newest by run-id. A run-id sorts chronologically as a string.
dv.header(1, "Recent Runs");
const runs = dv.pages('#ot/run').where(p => p.file.path.startsWith('Mesh/Types/Runs/'))
  .array().sort((a, b) => String(b["run-id"] ?? "").localeCompare(String(a["run-id"] ?? "")))
  .slice(0, 10);
if (runs.length === 0) {
  dv.paragraph("*None*");
} else {
  dv.table(["Run", "product", "outcome", "met", "commit", "confirm"],
    runs.map(p => [
      dv.fileLink(p.file.path, false, formatName(p, 'Run')),
      productOf(p),
      p.outcome ?? "—",
      (p["tasks-met"] ?? 0) + "/" + (p["tasks-total"] ?? 0),
      shortCommit(p.commit),
      p.confirm === true ? "true" : "false"
    ])
  );
}

// Suites: every (Suite) with its status, cells, and last run.
dv.header(1, "Suites");
const suites = dv.pages('#ot/suite').where(p => p.file.path.startsWith('Mesh/Types/Suites/'))
  .array().sort((a, b) => artifactNumber(a, 'Suite') - artifactNumber(b, 'Suite'));
if (suites.length === 0) {
  dv.paragraph("*None*");
} else {
  dv.table(["Suite", "product", "suite-id", "status", "entries", "profiles", "proven-run"],
    suites.map(p => [
      dv.fileLink(p.file.path, false, formatName(p, 'Suite')),
      productOf(p),
      p["suite-id"] ?? "—",
      p.status ?? "—",
      listLength(p.entries),
      toArray(p.profiles).join(", ") || "—",
      p["proven-run"] ?? "—"
    ])
  );
}

// Releases: every (Release), newest first by recorded-at.
dv.header(1, "Releases");
const releases = dv.pages('#ot/release').where(p => p.file.path.startsWith('Mesh/Types/Releases/'))
  .array().sort((a, b) => String(b["recorded-at"] ?? "").localeCompare(String(a["recorded-at"] ?? "")));
if (releases.length === 0) {
  dv.paragraph("*None*");
} else {
  dv.table(["Release", "product", "status", "commit", "tasks met", "cells pass", "recorded-at"],
    releases.map(p => [
      dv.fileLink(p.file.path, false, formatName(p, 'Release')),
      productOf(p),
      p.status ?? "—",
      shortCommit(p.commit),
      (p["tasks-met"] ?? 0) + "/" + (p["tasks-total"] ?? 0),
      (p["cells-pass"] ?? 0) + "/" + (p["cells-total"] ?? 0),
      p["recorded-at"] ?? "—"
    ])
  );
}
```
