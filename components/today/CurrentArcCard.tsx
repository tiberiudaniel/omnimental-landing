import type { ArcDefinition, ArcLevel, ArcDomain } from "@/types/arcs";

const ARC_LEVEL_LABEL_RO: Record<ArcLevel, string> = {
  foundation: "Fundație",
  operational: "Performanță activă",
  mastery: "Măiestrie",
};

const ARC_DOMAIN_LABEL_RO: Record<ArcDomain, string> = {
  energy: "Energie",
  clarity: "Claritate",
  flex: "Flexibilitate emoțională",
  executive: "Control executiv",
  adaptive: "Inteligență adaptativă",
  shielding: "Protecție mentală",
  identity: "Identitate & sens",
};

const ARC_DOMAIN_ICON: Record<ArcDomain, string> = {
  energy: "•",
  clarity: "◦",
  flex: "≈",
  executive: "⬣",
  adaptive: "⇄",
  shielding: "⌘",
  identity: "☉",
};

function getLevelLabel(level: ArcLevel): string {
  return ARC_LEVEL_LABEL_RO[level] ?? level;
}

function getDomainLabel(domain: ArcDomain): string {
  return ARC_DOMAIN_LABEL_RO[domain] ?? domain;
}

function getDomainIcon(domain: ArcDomain): string {
  return ARC_DOMAIN_ICON[domain] ?? "•";
}

interface CurrentArcCardProps {
  arc: ArcDefinition;
}

export function CurrentArcCard({ arc }: CurrentArcCardProps) {
  return (
    <section className="rounded-[24px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] p-6 shadow-[0_16px_40px_rgba(0,0,0,0.08)] sm:p-7">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none text-[var(--omni-energy)]">{getDomainIcon(arc.domain)}</span>
          <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--omni-energy)]">Arcul tău curent</span>
        </div>
        <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--omni-muted)]">
          {getDomainLabel(arc.domain)}
        </span>
      </div>
      <h2 className="mb-4 text-xl font-semibold text-[var(--omni-ink)] sm:text-2xl">{arc.name}</h2>
      <div className="mb-4 space-y-1 text-[14px] text-[var(--omni-ink)] sm:text-[15px]">
        <p>
          <span className="font-medium">Nivel:</span> {getLevelLabel(arc.level)}
        </p>
        <p>
          <span className="font-medium">Durată:</span> {arc.durationDays} zile de antrenament
        </p>
      </div>
      <p className="max-w-[520px] text-[14px] leading-relaxed text-[var(--omni-ink)] sm:text-[15px]">
        {arc.description}
      </p>
    </section>
  );
}
