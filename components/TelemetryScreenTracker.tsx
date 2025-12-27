"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/telemetry/track";
import { setTrackingContext } from "@/lib/telemetry/trackContext";

export function TelemetryScreenTracker() {
  const pathname = usePathname();
  const lastTrackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    setTrackingContext({
      routePath: pathname,
      origin: typeof window !== "undefined" ? window.location.origin : null,
    });
    if (lastTrackedPathRef.current === pathname) {
      return;
    }
    lastTrackedPathRef.current = pathname;
    track("screen_view", { routePath: pathname });
  }, [pathname]);

  return null;
}
