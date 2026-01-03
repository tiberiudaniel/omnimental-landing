import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";

const UNIT_TEST_ROOT = resolve("tests/unit");
const TEST_FILE_SUFFIX = ".test.cjs";

function collectTestFiles(dir) {
  let files = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    let stat;
    try {
      stat = statSync(fullPath);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      files = files.concat(collectTestFiles(fullPath));
    } else if (entry.endsWith(TEST_FILE_SUFFIX)) {
      files.push(fullPath);
    }
  }
  return files;
}

const testFiles = collectTestFiles(UNIT_TEST_ROOT);

if (testFiles.length === 0) {
  console.log("[test:unit] Skipped — no matching *.test.cjs files in tests/unit.");
  process.exit(0);
}

const child = spawn(process.execPath, ["--test", ...testFiles], {
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
