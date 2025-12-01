export function formatListText(items: string[], locale: "ro" | "en" = "ro") {
  if (items.length === 0) return "";
  try {
    if (typeof Intl !== "undefined" && typeof Intl.ListFormat === "function") {
      return new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(items);
    }
  } catch {
    // degrade gracefully
  }
  if (items.length === 1) return items[0];
  const head = items.slice(0, -1).join(locale === "ro" ? ", " : ", ");
  const last = items[items.length - 1];
  const joinWord = locale === "ro" ? " și " : " and ";
  return `${head}${joinWord}${last}`;
}
