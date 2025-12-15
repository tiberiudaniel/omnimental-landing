export type CueMode = "thought" | "system" | "final";
export type CueAnim = "fade" | "fade_drift" | "fade_slide_up" | "typewriter" | "none";

export type CinematicCue = {
  id: string;
  text?: string;
  mode: CueMode;
  anim: CueAnim;
  startMs: number;
  endMs: number;
  align?: "center" | "offcenter" | "random";
  opacity?: number;
  driftPx?: number;
  blurPx?: number;
  typewriter?: {
    enabled: boolean;
    msPerChar?: number;
    showCursor?: boolean;
    hideCursorAtEnd?: boolean;
  };
};

export const RO_CUES_V1: CinematicCue[] = [
  { id: "pre", mode: "system", anim: "none", startMs: 0, endMs: 1200 },
  {
    id: "t1",
    text: "Nu e lipsă de voință.",
    mode: "thought",
    anim: "fade_drift",
    startMs: 1200,
    endMs: 2600,
    align: "offcenter",
    opacity: 0.72,
    driftPx: 3,
    blurPx: 0,
    typewriter: { enabled: false },
  },
  {
    id: "s1",
    text: "E zgomot cognitiv.",
    mode: "system",
    anim: "fade",
    startMs: 2600,
    endMs: 3600,
    align: "center",
    opacity: 1,
    typewriter: { enabled: false },
  },
  {
    id: "t2",
    text: "Mintea rulează prea multe procese.",
    mode: "thought",
    anim: "fade_drift",
    startMs: 3600,
    endMs: 5200,
    align: "random",
    opacity: 0.62,
    driftPx: 3,
    blurPx: 1,
    typewriter: { enabled: false },
  },
  {
    id: "t3",
    text: "Deciziile mici îți ard energia.",
    mode: "thought",
    anim: "fade_drift",
    startMs: 4800,
    endMs: 6600,
    align: "random",
    opacity: 0.62,
    driftPx: 3,
    blurPx: 1,
    typewriter: { enabled: false },
  },
  {
    id: "t4",
    text: "Claritatea nu e stabilă.",
    mode: "thought",
    anim: "fade_drift",
    startMs: 6000,
    endMs: 7200,
    align: "random",
    opacity: 0.62,
    driftPx: 3,
    blurPx: 1,
    typewriter: { enabled: false },
  },
  { id: "pause", mode: "system", anim: "none", startMs: 7200, endMs: 7500 },
  {
    id: "s2",
    text: "Problema nu e motivația.",
    mode: "system",
    anim: "fade",
    startMs: 7500,
    endMs: 9000,
    align: "center",
    opacity: 1,
    typewriter: { enabled: false },
  },
  {
    id: "s3_type",
    text: "Problema e capacitatea.",
    mode: "system",
    anim: "typewriter",
    startMs: 9000,
    endMs: 11000,
    align: "center",
    opacity: 1,
    typewriter: {
      enabled: true,
      msPerChar: 45,
      showCursor: true,
      hideCursorAtEnd: true,
    },
  },
  {
    id: "id1",
    text: "OmniMental antrenează capacitatea cognitivă.",
    mode: "system",
    anim: "fade_slide_up",
    startMs: 11000,
    endMs: 12500,
    align: "center",
    opacity: 1,
    typewriter: { enabled: false },
  },
  {
    id: "id2",
    text: "Nu obiective. Nu obiceiuri.",
    mode: "system",
    anim: "fade_slide_up",
    startMs: 12500,
    endMs: 14000,
    align: "center",
    opacity: 1,
    typewriter: { enabled: false },
  },
  {
    id: "id3",
    text: "Funcționare stabilă: claritate, focus, reziliență, adaptabilitate.",
    mode: "system",
    anim: "fade_slide_up",
    startMs: 14000,
    endMs: 15300,
    align: "center",
    opacity: 1,
    typewriter: { enabled: false },
  },
  {
    id: "final",
    text: "Alege cum intri",
    mode: "final",
    anim: "fade",
    startMs: 15300,
    endMs: 19500,
    align: "center",
    opacity: 1,
    typewriter: { enabled: false },
  },
];
