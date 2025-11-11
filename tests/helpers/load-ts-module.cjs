const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const cache = new Map();

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
  function localRequire(request) {
    if (request.startsWith("./") || request.startsWith("../")) {
      const resolvedTs = resolveTsPath(dirname, request);
      if (resolvedTs) {
        return loadTsModule(resolvedTs);
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
