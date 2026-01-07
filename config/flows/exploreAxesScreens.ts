import type { ScreenStep } from "./types";

export const exploreAxesScreens = {
  hub: [
    {
      id: "axes_header",
      type: "screen",
      label: "Context alege o axă",
      description: "Explică faptul că alegi o singură zonă rapidă",
      order: 1,
    },
    {
      id: "axes_list",
      type: "screen",
      label: "Listă axe disponibile",
      description: "Carduri pentru recalibrare, flexibilitate, adaptive confidence",
      order: 2,
      tags: ["cta:/intro/explore/axes/[axisId]"],
    },
  ] as ScreenStep[],
  detail: [
    {
      id: "axis_header",
      type: "screen",
      label: "Header lecție axă",
      description: "Titlu + status tensiune pentru axa selectată",
      order: 1,
    },
    {
      id: "axis_vocab",
      type: "screen",
      label: "Vocab + exemplu practic",
      description: "Mini vocab și instrucțiuni scurte",
      order: 2,
    },
    {
      id: "axis_close",
      type: "summary",
      label: "CTA finalizează lecția",
      description: "Buton „Am înțeles” → Explore complete",
      order: 3,
      tags: ["cta:/intro/explore/complete?source=axes"],
    },
  ] as ScreenStep[],
};
