"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useEnsureGuidedQueryParams(): boolean {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasSource =
    (searchParams?.get("source") ?? "").toLowerCase() === "guided_day1" &&
    (searchParams?.get("lane") ?? "").toLowerCase() === "guided_day1";

  useEffect(() => {
    if (!searchParams || !pathname) return;
    if (hasSource) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("source", "guided_day1");
    params.set("lane", "guided_day1");
    const query = params.toString();
    const target = query ? `${pathname}?${query}` : pathname;
    router.replace(target, { scroll: false });
  }, [hasSource, pathname, router, searchParams]);

  return hasSource;
}
