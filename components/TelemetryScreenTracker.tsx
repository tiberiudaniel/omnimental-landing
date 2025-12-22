"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/telemetry/track";
import { setTrackingContext } from "@/lib/telemetry/trackContext";

export function TelemetryScreenTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    setTrackingContext({
      routePath: pathname,
      origin: typeof window !== "undefined" ? window.location.origin : null,
    });
    track("screen_view", { routePath: pathname });
  }, [pathname]);

  return null;
}
