import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const MIN_NODE_MAJOR = 18;
const nodeVersion = process.versions.node;
const currentMajor = Number.parseInt(nodeVersion.split('.')[0] ?? '0', 10);
const require = createRequire(import.meta.url);
const playwrightPackagePath = require.resolve('playwright/package.json');
const playwrightCli = path.join(path.dirname(playwrightPackagePath), 'cli.js');

function resolveNodeBinary() {
  if (Number.isFinite(currentMajor) && currentMajor >= MIN_NODE_MAJOR) {
    return process.execPath;
  }
  const candidates = [
    process.env.NODE18_BIN,
    process.env.PLAYWRIGHT_NODE_BIN,
    process.env.NODE18_PATH,
    process.env.NODE18_HOME ? path.join(process.env.NODE18_HOME, 'bin', 'node') : null,
    process.env.NVM_DIR ? path.join(process.env.NVM_DIR, 'versions', 'node', 'v18.20.2', 'bin', 'node') : null,
    process.platform === 'win32' ? 'C:\\Program Files\\nodejs\\node.exe' : null,
    process.platform === 'darwin' ? '/opt/homebrew/bin/node' : null,
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      if (candidate && existsSync(candidate)) {
        return candidate;
      }
    } catch {
      // ignore fs read errors and continue
    }
  }
  console.error(
    `[playwright] Node.js ${MIN_NODE_MAJOR}+ is required. Current runtime is ${process.version}. ` +
      'Set NODE18_BIN (or PLAYWRIGHT_NODE_BIN) to a Node 18+ binary or switch your active version.',
  );
  process.exit(1);
}

const nodeBinary = resolveNodeBinary();
const runnerArgs = process.argv.slice(2);

const child = spawn(nodeBinary, [playwrightCli, 'test', ...runnerArgs], {
  stdio: 'inherit',
  env: { ...process.env },
  windowsHide: false,
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
