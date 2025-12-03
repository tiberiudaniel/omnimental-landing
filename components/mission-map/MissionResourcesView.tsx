import Image from "next/image";
import { SecondaryButton } from "@/components/PrimaryButton";
import { useI18n } from "@/components/I18nProvider";
import type { ResourceMetric } from "@/lib/hooks/useMissionPerspective";
import { formatListText } from "./utils";

type MissionResourcesViewProps = {
  missionTitle: string;
  resources: ResourceMetric[];
  onSwitchView?: () => void;
};

export function MissionResourcesView({ missionTitle, resources = [], onSwitchView }: MissionResourcesViewProps) {
  const { lang } = useI18n();
  const sensitive = [...resources].sort((a, b) => a.score - b.score).slice(0, 2);
  const sensitiveText =
    sensitive.length > 0 ? formatListText(sensitive.map((metric) => metric.label.toLowerCase()), lang === "ro" ? "ro" : "en") : "";
  if (!resources.length) {
    return (
      <section className="rounded-card border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] p-6 text-center text-[var(--omni-ink-soft)] shadow-[0_6px_26px_rgba(0,0,0,0.08)]">
        {lang === "ro"
          ? "Încă încărcăm resursele pentru misiunea curentă."
          : "We’re still loading the resource metrics for this mission."}
      </section>
    );
  }

  return (
    <section className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.1fr)]">
      <div className="flex items-center justify-center rounded-card border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)]/80 p-6 shadow-[0_8px_26px_rgba(0,0,0,0.08)]">
        <div className="relative w-full max-w-sm">
          <Image
            src="/assets/mission-map/silhouette-resources.png"
            alt={lang === "ro" ? "Siluetă pentru harta resurselor interne" : "Silhouette for internal resources"}
            width={512}
            height={768}
            sizes="(min-width: 1024px) 360px, 60vw"
            className="h-auto w-full rounded-[28px] border border-[var(--omni-border-soft)] object-contain shadow-[0_18px_40px_rgba(34,18,8,0.18)]"
          />
          <div className="absolute inset-x-8 bottom-6 rounded-full bg-white/80 px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--omni-muted)] shadow-[0_8px_20px_rgba(0,0,0,0.12)]">
            {lang === "ro" ? "Resurse interne" : "Internal resources"}
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
            {lang === "ro" ? "Resursele misiunii" : "Mission resources"}
          </p>
          <h2 className="text-xl font-semibold text-[var(--omni-ink)]">
            {lang === "ro" ? "Resursele tale interne pentru această misiune" : "Your internal resources for this mission"}
          </h2>
          <p className="text-sm text-[var(--omni-ink-soft)]">
            {lang === "ro" ? (
              <>
                Ca să poți lucra cu adevărat la <strong>{missionTitle}</strong>, ai nevoie de o bază stabilă. Scorurile nu sunt
                perfecte, dar îți arată unde merită să investești atenție în perioada următoare.
              </>
            ) : (
              <>
                To stay consistent with <strong>{missionTitle}</strong> you need a grounded baseline. These scores aren’t perfect,
                but they highlight where your energy should go next.
              </>
            )}
          </p>
        </div>

        <div className="space-y-3">
          {resources.map((metric) => (
            <ResourceRow key={metric.key} metric={metric} />
          ))}
        </div>

        <div className="rounded-card border border-[var(--omni-border-soft)]/80 bg-[var(--omni-bg-paper)] px-4 py-3 text-sm text-[var(--omni-ink-soft)] shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
          {sensitiveText
            ? lang === "ro"
              ? `Observ că ${sensitiveText} sunt cele mai sensibile zone. Ar merita să începi cu 1–2 protocoale scurte aici, înainte să accelerezi restul procesului.`
              : `It looks like ${sensitiveText} are the most sensitive right now. Start with one or two short protocols there before you pick up the pace.`
            : lang === "ro"
              ? "Observăm o distribuție echilibrată. Poți susține ritmul actual și să verifici cum te simți peste 1–2 săptămâni."
              : "The distribution is balanced. Keep your rhythm and check in again in a week or two."}
        </div>

        {onSwitchView ? (
          <div className="flex flex-wrap gap-3">
            <SecondaryButton onClick={onSwitchView} className="text-xs font-semibold uppercase tracking-[0.2em]">
              {lang === "ro" ? "OK, vreau să văd progresul mental" : "Great, show me the mental progress"}
            </SecondaryButton>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ResourceRow({ metric }: { metric: ResourceMetric }) {
  return (
    <div className="rounded-card border border-[var(--omni-border-soft)]/60 bg-[var(--omni-surface-strong)] px-3 py-2 shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between text-[12px] font-semibold text-[var(--omni-ink)]">
        <span>{metric.label}</span>
        <span>{metric.score}%</span>
      </div>
      <div
        className="relative mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--omni-border-soft)85%,white)]"
        role="img"
        aria-label={`${metric.label} ${metric.score}%`}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to right, transparent 0, transparent calc(25% - 1px), rgba(0,0,0,0.05) calc(25% - 1px), rgba(0,0,0,0.05) 25%)",
          }}
        />
        <div
          className="relative h-full rounded-full bg-gradient-to-r from-[var(--omni-accent-soft)] to-[var(--omni-accent)]"
          style={{ width: `${Math.max(0, Math.min(100, metric.score))}%` }}
        />
      </div>
      <p className="mt-1 text-[10px] leading-tight text-[var(--omni-ink-soft)]">{metric.description}</p>
    </div>
  );
}
