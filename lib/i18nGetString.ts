export function getString(translate: (key: string) => unknown, key: string, fallback = "") {
  const value = translate(key);
  return typeof value === "string" ? value : fallback;
}

