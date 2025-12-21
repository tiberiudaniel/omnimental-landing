export function encodeRouteId(routePath: string): string {
  const normalized = routePath && routePath.length ? routePath : "/";
  if (typeof Buffer !== "undefined") {
    return Buffer.from(normalized, "utf-8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    try {
      const base64 = window.btoa(unescape(encodeURIComponent(normalized)));
      return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    } catch {
      // ignore and fallback below
    }
  }
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  return `h${Math.abs(hash)}`;
}

export function getScreenIdForRoute(routePath: string): string {
  return encodeRouteId(routePath);
}
