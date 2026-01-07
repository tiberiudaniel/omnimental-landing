import type { ScreenStep } from "./types";

export const todayScreens: ScreenStep[] = [
  {
    id: "today_axis_hero",
    type: "screen",
    label: "Hero Claritate operațională",
    description: "Titlu + rezumat și CTA „Pornește sesiunea”",
    order: 1,
    tags: ["cta:/today/run?lane=guided_day1"],
  },
  {
    id: "today_session_cards",
    type: "screen",
    label: "Quick vs Deep",
    description: "Carduri 8 min vs 30–60 min + indicator Earn",
    order: 2,
    tags: ["cta:/today/run", "cta:/today/run?mode=deep"],
  },
  {
    id: "today_explore_choices",
    type: "screen",
    label: "Explore Ziua 1",
    description: "Profil CAT și „Alege o axă”",
    order: 3,
    tags: ["cta:/intro/explore?entry=cat-lite", "cta:/intro/explore?entry=axes"],
  },
  {
    id: "today_last_session",
    type: "screen",
    label: "Ultima sesiune",
    description: "Istoric + status Earn/Premium",
    order: 4,
  },
  {
    id: "today_more_sessions",
    type: "screen",
    label: "Vrei încă o sesiune azi?",
    description: "Card upgrade/drill după prima sesiune",
    order: 5,
    tags: ["cta:/today/earn?source=today_hub"],
  },
  {
    id: "today_completion_status",
    type: "summary",
    label: "Status profil Ziua 1",
    description: "Mesaj după CAT Lite sau completare Today",
    order: 6,
  },
];
