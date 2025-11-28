#!/usr/bin/env node
import { spawn } from 'node:child_process';

function ensureJsonReporter(args) {
  // Always force JSON reporter so we can parse output (append as last arg)
  const hasReporter = args.findIndex((a) => a === '--reporter' || a === '-r');
  if (hasReporter !== -1) {
    // keep existing but force json after to override
    return args.concat(['--reporter=json']);
  }
  return args.concat(['--reporter=json']);
}

function firstLine(s) {
  if (!s) return '';
  const i = s.indexOf('\n');
  return i === -1 ? s : s.slice(0, i);
}

function walkSuites(suite, stack, out) {
  const title = suite.title || '';
  const nextStack = title ? stack.concat(title) : stack;
  if (Array.isArray(suite.tests)) {
    for (const t of suite.tests) {
      // Determine failure
      const outcome = t.outcome || t.status;
      let failed = outcome === 'unexpected' || outcome === 'failed';
      let err = null;
      if (!failed && Array.isArray(t.results)) {
        for (const r of t.results) {
          if (r.status === 'failed') {
            failed = true;
            err = r.error || r.errors?.[0] || null;
            break;
          }
        }
      }
      if (!err && Array.isArray(t.errors) && t.errors.length) err = t.errors[0];
      if (!failed) continue;
      const name = err?.name || 'Error';
      const msg = firstLine(err?.message || '');
      out.push({ path: nextStack.join(' > '), title: t.title || '', name, msg });
    }
  }
  if (Array.isArray(suite.suites)) {
    for (const s of suite.suites) walkSuites(s, nextStack, out);
  }
}

async function main() {
  const passThrough = process.argv.slice(2);
  const args = ensureJsonReporter(passThrough);

  const child = spawn('npx', ['playwright', 'test', ...args], {
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });

  let out = '';
  let err = '';
  child.stdout.on('data', (d) => (out += d.toString()));
  child.stderr.on('data', (d) => (err += d.toString()));

  child.on('close', (code) => {
    try {
      const json = JSON.parse(out || '{}');
      const failures = [];
      const rootSuites = Array.isArray(json.suites) ? json.suites : [];
      for (const s of rootSuites) walkSuites(s, [], failures);
      if (failures.length === 0) {
        console.log('All tests passed');
      } else {
        for (const f of failures) {
          const left = f.path ? `${f.path} > ${f.title}` : f.title;
          console.log(`${left}`);
          console.log(`- ${f.name}: ${f.msg}`);
        }
      }
    } catch {
      // Fallback: print stderr or raw stdout if JSON parse failed
      if (out) {
        console.log(firstLine(String(out)));
      }
      if (err) {
        console.error(firstLine(String(err)));
      }
    } finally {
      process.exit(code ?? 1);
    }
  });
}

main().catch((e) => {
  console.error('e2e-failures error:', e?.message || e);
  process.exit(1);
});
