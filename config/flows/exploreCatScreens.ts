import type { ScreenStep } from "./types";

export const exploreCatScreens: ScreenStep[] = [
  {
    id: "hero_explore",
    type: "screen",
    label: "Header Ziua 1 · Explorare",
    description: "Context „Ai redus zgomotul” + recomandare CAT",
    order: 1,
  },
  {
    id: "card_cat_lite",
    type: "screen",
    label: "Card Profil CAT",
    description: "Card cu badge „Recomandat azi” și CTA CAT Lite",
    order: 2,
    tags: ["cta:/intro/explore/cat-lite"],
  },
  {
    id: "card_axes",
    type: "screen",
    label: "Card lecție pe o axă",
    description: "Opțiunea „Alege o zonă” cu CTA axes hub",
    order: 3,
    tags: ["cta:/intro/explore/axes"],
  },
];
