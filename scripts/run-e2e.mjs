import { spawn } from 'node:child_process';

// Optional base URL from CLI
const cliBase = process.argv[2];
const base = cliBase || process.env.E2E_BASE_URL || 'http://localhost:3001';

const child = spawn(
  `npx playwright test`,
  {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, E2E_BASE_URL: base, PW_SKIP_WEBSERVER: '1' },
  }
);

child.on('exit', (code) => process.exit(code ?? 1));

