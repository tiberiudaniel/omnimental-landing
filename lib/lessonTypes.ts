export type LessonLevel = 'initiation' | 'intermediate' | 'advanced';

export type LessonTaxonomy = {
  domain: string; // e.g., 'autoreglare', 'claritate', 'relații'
  category: string; // e.g., 'stress_clarity'
  subcategory?: string | null;
};

export type MicroLesson = {
  id: string; // unique slug, e.g., 'initiation.stress_clarity'
  title: string;
  goal: string; // 1–2 lines
  bullets: string[]; // 3–4 short bullets
  example: string; // 2–4 lines
  exercise: string[]; // 1–3 simple steps
  linkToKuno?: string; // one short line linking concept to Omni‑Kuno
  level: LessonLevel;
  taxonomy: LessonTaxonomy;
  tags?: string[];
  locale?: 'ro' | 'en';
};

