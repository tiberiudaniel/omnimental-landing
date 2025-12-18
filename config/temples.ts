import type { CanonDomainId } from "@/lib/profileEngine";

export type TempleConfig = {
  canonDomain: CanonDomainId;
  label: string;
  arcIds: string[];
};

export const TEMPLES: TempleConfig[] = [
  {
    canonDomain: "executiveControl",
    label: "Templul Controlului Executiv",
    arcIds: [],
  },
  {
    canonDomain: "decisionalClarity",
    label: "Templul Clarității Decizionale",
    arcIds: ["clarity_01"],
  },
  {
    canonDomain: "emotionalRegulation",
    label: "Templul Reglării Emoționale",
    arcIds: ["emotional_01"],
  },
  {
    canonDomain: "functionalEnergy",
    label: "Templul Energiei Funcționale",
    arcIds: ["energy_01"],
  },
];

export function getTempleByDomain(domain: CanonDomainId): TempleConfig | undefined {
  return TEMPLES.find((temple) => temple.canonDomain === domain);
}
