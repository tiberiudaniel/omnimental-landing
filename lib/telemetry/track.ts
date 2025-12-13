export function track(event: string, payload?: Record<string, unknown>) {
  try {
    console.log("[telemetry]", event, payload ?? {});
  } catch {
    // Swallow errors silently to avoid breaking UX
  }
}
