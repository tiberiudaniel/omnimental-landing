import type { MicroLesson } from '@/lib/lessonTypes';

export const microLesson: MicroLesson = {
  id: 'initiation.calm_breath',
  title: 'Respirația care calmează (2 minute)',
  goal: 'Înveți un protocol respirator scurt care activează “frâna” sistemului nervos.',
  bullets: [
    'Expirația mai lungă decât inspirația stimulează sistemul parasimpatic (calm).',
    'Ritmul lent (~6 respirații/min) sincronizează corpul și mintea.',
    '2 minute sunt suficiente ca să simți diferența în corp.',
  ],
  example:
    'Într-o pauză, închizi ochii 10–20s și observi aerul. Apoi inspiri 4s și expiri 6s. După 2 minute, tensiunea scade vizibil.',
  exercise: [
    'Setează un cronometru la 2 minute.',
    'Respiră 4s inspiri / 6s expiri (pe nas), fără efort.',
    'Notează în jurnal: “nivel tensiune înainte/după (1–10)”.',
  ],
  linkToKuno: 'Folosește respirația scurtă înainte de întrebările Omni‑Kuno despre stres.',
  level: 'initiation',
  taxonomy: { domain: 'autoreglare', category: 'calm', subcategory: 'breath' },
  tags: ['breathing', 'calm', 'parasympathetic'],
  locale: 'ro',
};

