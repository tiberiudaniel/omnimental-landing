import { ZONES } from "@/config/taxonomy/zones";
import type { ZoneId } from "@/lib/taxonomy/types";

const stripQueryAndHash = (path: string): string =>
  path.split("?")[0]?.split("#")[0] ?? path;

const normalizePathname = (value: string): string => {
  if (!value) return "/";
  const noQuery = stripQueryAndHash(value.trim());
  if (!noQuery) return "/";
  let normalized = noQuery.startsWith("/") ? noQuery : `/${noQuery}`;
  normalized = normalized.replace(/\/+/g, "/");
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }
  return normalized || "/";
};

const matchesPrefix = (path: string, prefix: string): boolean => {
  if (prefix === "/") {
    return path === "/";
  }

  return path === prefix || path.startsWith(`${prefix}/`);
};

export const resolveZoneFromPath = (path: string): ZoneId | null => {
  const normalizedPath = normalizePathname(path);
  let matchedZone: ZoneId | null = null;
  let matchedPrefixLength = -1;

  for (const zone of Object.values(ZONES)) {
    for (const prefix of zone.routePrefixes) {
      const normalizedPrefix = normalizePathname(prefix);
      if (!matchesPrefix(normalizedPath, normalizedPrefix)) continue;

      if (normalizedPrefix.length > matchedPrefixLength) {
        matchedPrefixLength = normalizedPrefix.length;
        matchedZone = zone.id;
      }
    }
  }

  return matchedZone;
};
