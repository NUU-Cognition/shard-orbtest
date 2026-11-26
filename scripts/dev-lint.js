#!/usr/bin/env node
// Check every `flint orbtest ...` invocation in the shard files against the CLI.
// Invocation: flint shard ot lint [--verbose]
// Outputs: nothing on success (exit 0); one line per unknown command or flag on failure (exit 1);
//          one line and exit 2 when the CLI command tree could not be read.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const shardDir = path.resolve(__dirname, '..');
const flintRoot = path.resolve(shardDir, '..', '..');
const verbose = process.argv.includes('--verbose');

// Where the command tree is read from, best first.
//
// The source of truth is the standalone launcher that `ndv build orbtest` writes
// from the flint working tree. The `flint` binary carries its own bundled copy of
// orbtest, and that copy lags the working tree until someone rebuilds the binary.
// A session must never rebuild the `flint` binary, so a shard that names a command
// the working tree already has would fail this lint forever if the binary were the
// only source. The launcher is therefore tried first, and `flint orbtest` is the
// fallback for a Flint that has no flint checkout beside it.
//
// ORBTEST_CLI overrides both. It is a whole command line, for example
// `node /path/to/orbtest.js`.
function candidates() {
  const out = [];
  if (process.env.ORBTEST_CLI) {
    const parts = process.env.ORBTEST_CLI.split(/\s+/).filter(Boolean);
    if (parts.length > 0) out.push({ label: process.env.ORBTEST_CLI, file: parts[0], prefix: parts.slice(1) });
  }
  const launcher = path.join(flintRoot, '..', 'Repos', 'flint', 'apps', 'orbtest-cli', 'bin', 'orbtest.js');
  if (fs.existsSync(launcher)) out.push({ label: `node ${launcher}`, file: process.execPath, prefix: [launcher] });
  out.push({ label: 'flint orbtest', file: 'flint', prefix: ['orbtest'] });
  return out;
}

function readCommandTree() {
  const tried = [];
  for (const c of candidates()) {
    const res = spawnSync(c.file, [...c.prefix, 'skills', '--section', 'commands', '--json'], { encoding: 'utf8' });
    if (res.status !== 0 || !res.stdout) {
      tried.push(`${c.label} (exit ${res.status})`);
      continue;
    }
    if (verbose) console.log(`command tree from ${c.label}`);
    const json = JSON.parse(res.stdout);
    const commands = new Map();
    for (const cmd of json.data.commands) {
      const flags = new Set(['-h', '--help']);
      for (const o of cmd.options || []) flags.add(o.flags.split(/[ ,]/)[0]);
      commands.set(cmd.name, flags);
    }
    return commands;
  }
  process.stderr.write(`lint: cannot read skills --section commands --json from ${tried.join(', ')}\n`);
  process.exit(2);
}

function markdownFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...markdownFiles(p));
    else if (entry.name.endsWith('.md')) out.push(p);
  }
  return out;
}

// One invocation: the text after `flint orbtest` up to the end of the backtick span, the
// table cell, or the line. Placeholders such as `<kind> <verb>` are not invocations.
function invocations(text) {
  const found = [];
  const re = /flint orbtest(?=[\s`|)]|$)([^`|\n]*)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const line = text.slice(0, m.index).split('\n').length;
    found.push({ line, rest: m[1].trim() });
  }
  return found;
}

function check(rest, commands) {
  const tokens = rest.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { ok: true, command: '' };
  if (tokens[0].startsWith('<') || tokens[0].startsWith('[') || tokens[0] === '...' || tokens[0] === '…') return { ok: true, command: '' };
  let command = '';
  let i = 0;
  while (i < tokens.length && /^[a-z][a-z-]*$/.test(tokens[i])) {
    const next = command ? `${command} ${tokens[i]}` : tokens[i];
    const isPrefix = [...commands.keys()].some((k) => k === next || k.startsWith(`${next} `));
    if (!isPrefix) break;
    command = next;
    i += 1;
  }
  if (!commands.has(command)) return { ok: false, reason: `unknown command "${tokens.slice(0, i + 1).join(' ')}"` };
  const flags = commands.get(command);
  for (const t of tokens.slice(i)) {
    if (!t.startsWith('--')) continue;
    const flag = t.split('=')[0].replace(/[\]\\,.;:)]+$/, '');
    if (flag === '--' || flag.includes('<') || flag.includes('|')) continue;
    if (!flags.has(flag)) return { ok: false, reason: `unknown flag ${flag} on "${command}"` };
  }
  return { ok: true, command };
}

function main() {
  const commands = readCommandTree();
  const problems = [];
  let count = 0;
  for (const file of markdownFiles(shardDir)) {
    const text = fs.readFileSync(file, 'utf8');
    for (const inv of invocations(text)) {
      count += 1;
      const result = check(inv.rest, commands);
      if (!result.ok) problems.push(`${path.relative(shardDir, file)}:${inv.line}: ${result.reason}`);
      else if (verbose) console.log(`${path.relative(shardDir, file)}:${inv.line}: ${result.command || '(placeholder)'}`);
    }
  }
  for (const p of problems) console.log(p);
  if (verbose) console.log(`${count} invocation(s), ${problems.length} problem(s)`);
  process.exit(problems.length === 0 ? 0 : 1);
}

main();
