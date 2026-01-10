import type { ZoneId, ZoneMeta } from "@/lib/taxonomy/types";

type ZoneTaxonomy = Record<ZoneId, ZoneMeta>;

export const ZONES: ZoneTaxonomy = {
  PUBLIC: {
    id: "PUBLIC",
    label: {
      en: "Public",
      ro: "Public",
    },
    routePrefixes: ["/"],
    isUserFacing: true,
  },
  INTRO: {
    id: "INTRO",
    label: {
      en: "Intro",
      ro: "Intro",
    },
    routePrefixes: ["/intro"],
    // Guided Day-1 surfaces (guided, mindpacing, explore) remain inside Intro via this prefix.
    isUserFacing: true,
  },
  SESSIONS: {
    id: "SESSIONS",
    label: {
      en: "Sessions",
      ro: "Sesiuni",
    },
    routePrefixes: ["/today", "/session"],
    isUserFacing: true,
  },
  CALIBRATION: {
    id: "CALIBRATION",
    label: {
      en: "Calibration",
      ro: "Calibrare",
    },
    routePrefixes: ["/onboarding"],
    isUserFacing: true,
  },
  PROGRESS: {
    id: "PROGRESS",
    label: {
      en: "Progress",
      ro: "Progres",
    },
    routePrefixes: ["/progress"],
    isUserFacing: true,
  },
  ARENAS: {
    id: "ARENAS",
    label: {
      en: "Arenas",
      ro: "Arene",
    },
    routePrefixes: ["/arenas"],
    isUserFacing: true,
  },
  LIBRARY: {
    id: "LIBRARY",
    label: {
      en: "Library",
      ro: "Bibliotecă",
    },
    routePrefixes: ["/library"],
    isUserFacing: true,
  },
  ACCOUNT: {
    id: "ACCOUNT",
    label: {
      en: "Account & Settings",
      ro: "Cont & Setări",
    },
    routePrefixes: ["/account"],
    isUserFacing: true,
  },
  ADMIN: {
    id: "ADMIN",
    label: {
      en: "Admin / Studio",
      ro: "Admin / Studio",
    },
    routePrefixes: ["/admin"],
    isUserFacing: false,
  },
};
