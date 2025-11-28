import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const cliBase = process.argv[2];
const base = cliBase || process.env.E2E_BASE_URL || 'http://localhost:3001';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const runnerScript = path.join(__dirname, 'run-playwright.mjs');

const child = spawn(process.execPath, [runnerScript], {
  stdio: 'inherit',
  env: { ...process.env, E2E_BASE_URL: base, PW_SKIP_WEBSERVER: '1' },
});

child.on('exit', (code) => process.exit(code ?? 1));

