import type { Page } from "@playwright/test";
import { go } from "./env";

type ProgressOptions = {
  query?: Record<string, string | number | undefined> | string;
};

function buildSearch(params?: ProgressOptions["query"]): string {
  if (!params) {
    return "";
  }
  if (typeof params === "string") {
    return params.replace(/^\?/, "");
  }
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value == null) return;
    search.set(key, String(value));
  });
  return search.toString();
}

export async function gotoProgress(page: Page, options?: ProgressOptions) {
  const searchPart = buildSearch(options?.query);
  const searchParams = new URLSearchParams(searchPart);
  if (!searchParams.has("e2e")) {
    searchParams.set("e2e", "1");
  }
  if (!searchParams.has("lang")) {
    searchParams.set("lang", "ro");
  }
  const query = searchParams.toString();
  const path = query ? `/progress?${query}` : "/progress";
  await go(page, path);
}
