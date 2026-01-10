export type LocaleCode = "ro" | "en";

type BrandedString<Brand extends string> = string & { readonly __brand: Brand };

export const WORLD_IDS = ["INITIATION", "PERFORMING", "MASTERING"] as const;
export type WorldId = (typeof WORLD_IDS)[number];

export const ZONE_IDS = [
  "PUBLIC",
  "INTRO",
  "SESSIONS",
  "CALIBRATION",
  "PROGRESS",
  "ARENAS",
  "LIBRARY",
  "ACCOUNT",
  "ADMIN",
] as const;
export type ZoneId = (typeof ZONE_IDS)[number];

export type SessionTemplateId = BrandedString<"SessionTemplateId">;
export type LessonId = BrandedString<"LessonId">;
export type ModuleId = BrandedString<"ModuleId">;
export type JourneyId = BrandedString<"JourneyId">;

export interface WorldAvailability {
  isActive: boolean;
  defaultWorld: boolean;
  requiresEligibility: boolean;
}

export interface WorldMeta {
  id: WorldId;
  title: string;
  description: string;
  order: number;
  availability: WorldAvailability;
}

export interface ZoneMeta {
  id: ZoneId;
  label: Record<LocaleCode, string>;
  routePrefixes: string[];
  isUserFacing: boolean;
}
