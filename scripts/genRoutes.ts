import fs from "fs";
import path from "path";

type RouteRecord = {
  routePath: string;
  group: string;
  filePath: string;
  routeId: string;
};

const ROOT_DIR = process.cwd();
const APP_DIR = path.join(ROOT_DIR, "app");
const OUTPUT_DIR = path.join(ROOT_DIR, "generated");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "routes.generated.json");
const PAGE_FILE = "page.tsx";

function normalizeSlashes(value: string): string {
  return value.split(path.sep).join("/");
}

function isRouteGroup(segment: string): boolean {
  return segment.startsWith("(") && segment.endsWith(")");
}

function shouldSkipDirectory(name: string): boolean {
  return name === "api" || name.startsWith(".") || name === "node_modules";
}

function walkDirectory(
  currentDir: string,
  segments: string[],
  group: string | null,
  routes: RouteRecord[],
): void {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (shouldSkipDirectory(entry.name) || entry.name.startsWith("@")) {
        continue;
      }
      const fullPath = path.join(currentDir, entry.name);
      if (isRouteGroup(entry.name)) {
        const nextGroup = group ?? entry.name.slice(1, -1);
        walkDirectory(fullPath, segments, nextGroup, routes);
      } else if (!entry.name.startsWith("_")) {
        walkDirectory(fullPath, [...segments, entry.name], group, routes);
      }
      continue;
    }
    if (!entry.isFile() || entry.name !== PAGE_FILE) {
      continue;
    }
    const routePath = buildRoutePath(segments);
    const routeId = encodeRouteIdValue(routePath);
    const relativePath = normalizeSlashes(path.relative(ROOT_DIR, path.join(currentDir, entry.name)));
    const resolvedGroup = relativePath.includes("/(app)/") ? "app" : "public";
    routes.push({ routePath, group: resolvedGroup, filePath: relativePath, routeId });
  }
}

function buildRoutePath(segments: string[]): string {
  if (segments.length === 0) return "/";
  const cleaned = segments.filter(Boolean);
  const joined = cleaned.join("/");
  return `/${joined}`;
}

function main() {
  if (!fs.existsSync(APP_DIR)) {
    console.error("[genRoutes] app directory not found");
    process.exit(1);
  }
  const routes: RouteRecord[] = [];
  walkDirectory(APP_DIR, [], null, routes);
  routes.sort((a, b) => a.routePath.localeCompare(b.routePath));
  const payload = {
    generatedAt: new Date().toISOString(),
    routes,
  };
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, { encoding: "utf-8" });
  console.log(`[genRoutes] wrote ${routes.length} routes to ${normalizeSlashes(path.relative(ROOT_DIR, OUTPUT_FILE))}`);
}

function encodeRouteIdValue(routePath: string): string {
  const normalized = routePath && routePath.length ? routePath : "/";
  return Buffer.from(normalized, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

main();
