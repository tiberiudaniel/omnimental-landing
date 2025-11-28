import { spawn } from 'node:child_process';

const tests = [
  'tests/e2e/onboarding.spec.ts',
  'tests/e2e/progress.spec.ts',
  'tests/e2e/progress-journal.spec.ts',
];

// Base URL priority: CLI arg > env > default 3001
const cliBase = process.argv[2];
const base = cliBase || process.env.E2E_BASE_URL || 'http://localhost:3001';
const child = spawn(
  `npx playwright test ${tests.join(' ')}`,
  {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, E2E_BASE_URL: base, PW_SKIP_WEBSERVER: '1' },
  }
);

child.on('exit', (code) => process.exit(code ?? 1));
