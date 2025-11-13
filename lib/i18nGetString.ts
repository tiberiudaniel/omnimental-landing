export function getString(
  translate: (key: string) => unknown,
  key: string,
  fallback = "",
) {
  const value = translate(key);
  if (typeof value === "string") {
    // If translation library returns the key when missing, prefer the fallback
    return value !== key ? value : fallback;
  }
  return fallback;
}

