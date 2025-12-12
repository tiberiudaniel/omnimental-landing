const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const cache = new Map();
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const FIREBASE_ENV_VARS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];
FIREBASE_ENV_VARS.forEach((key) => {
  if (!process.env[key]) {
    process.env[key] = `test-${key.toLowerCase()}`;
  }
});

let aliasResolvers = [];
try {
  const tsconfigPath = path.join(PROJECT_ROOT, "tsconfig.json");
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf8"));
  const paths = tsconfig?.compilerOptions?.paths ?? {};
  aliasResolvers = Object.entries(paths).map(([alias, targets]) => {
    const hasWildcard = alias.endsWith("/*");
    const aliasPrefix = hasWildcard ? alias.slice(0, -1) : alias;
    const target = Array.isArray(targets) && targets.length > 0 ? targets[0] : "./";
    const normalizedTarget = hasWildcard ? target.replace(/\*$/, "") : target;
    const absoluteTarget = path.resolve(PROJECT_ROOT, normalizedTarget);
    return {
      prefix: aliasPrefix,
      target: absoluteTarget,
      hasWildcard,
    };
  });
} catch (error) {
  console.warn("load-ts-module: failed to parse tsconfig paths", error);
  aliasResolvers = [];
}

function resolveTsPath(basedir, request) {
  const candidate = path.resolve(basedir, request);
  if (fs.existsSync(candidate) && candidate.endsWith(".ts")) {
    return candidate;
  }
  if (fs.existsSync(`${candidate}.ts`)) {
    return `${candidate}.ts`;
  }
  if (candidate.endsWith(".js") && fs.existsSync(candidate.replace(/\.js$/, ".ts"))) {
    return candidate.replace(/\.js$/, ".ts");
  }
  if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
    const indexTs = path.join(candidate, "index.ts");
    if (fs.existsSync(indexTs)) {
      return indexTs;
    }
  }
  return null;
}

function loadTsModule(tsPath) {
  const absolutePath = path.resolve(tsPath);
  if (cache.has(absolutePath)) {
    return cache.get(absolutePath);
  }
  const source = fs.readFileSync(absolutePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
      esModuleInterop: true,
    },
    fileName: absolutePath,
  });
  const module = { exports: {} };
  cache.set(absolutePath, module.exports);
  const dirname = path.dirname(absolutePath);
  function tryAlias(request) {
    for (const alias of aliasResolvers) {
      if (request.startsWith(alias.prefix)) {
        const remainder = request.slice(alias.prefix.length);
        const mappedPath = alias.hasWildcard
          ? path.join(alias.target, remainder)
          : alias.target;
        const resolvedTs = resolveTsPath(PROJECT_ROOT, mappedPath);
        if (resolvedTs) {
          return loadTsModule(resolvedTs);
        }
        return require(mappedPath);
      }
    }
    return null;
  }

  function localRequire(request) {
    if (request.startsWith("./") || request.startsWith("../")) {
      const resolvedTs = resolveTsPath(dirname, request);
      if (resolvedTs) {
        return loadTsModule(resolvedTs);
      }
    } else {
      const aliasHit = tryAlias(request);
      if (aliasHit) {
        return aliasHit;
      }
    }
    return require(request);
  }
  const factory = new Function(
    "exports",
    "require",
    "module",
    "__filename",
    "__dirname",
    transpiled.outputText,
  );
  factory(module.exports, localRequire, module, absolutePath, dirname);
  return module.exports;
}

module.exports = { loadTsModule };
