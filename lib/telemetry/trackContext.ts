"use client";

export type TrackingContext = {
  userId?: string | null;
  isPremium?: boolean | null;
  accessTier?: string | null;
  locale?: string | null;
  origin?: string | null;
  routePath?: string | null;
};

let context: TrackingContext = {
  origin: null,
  routePath: null,
};

export function setTrackingContext(partial: TrackingContext) {
  context = {
    ...context,
    ...partial,
  };
}

export function getTrackingContext(): TrackingContext {
  return context;
}
