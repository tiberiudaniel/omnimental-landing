import Image from "next/image";
import { NeutralCtaButton } from "@/components/ui/cta/NeutralCtaButton";
import { useI18n } from "@/components/I18nProvider";
import type { MentalMetric } from "@/lib/hooks/useMissionPerspective";
import { formatListText } from "./utils";
import { HoneyHex } from "./HoneyHex";

type MissionMentalProgressViewProps = {
  missionTitle: string;
  mental: MentalMetric[];
  onNextStep?: () => void;
};

export function MissionMentalProgressView({ missionTitle, mental = [], onNextStep }: MissionMentalProgressViewProps) {
  const { lang } = useI18n();
  const strongest = [...mental].sort((a, b) => b.score - a.score)[0];
  const growthAreas = [...mental].sort((a, b) => a.score - b.score).slice(0, 2);
  const focusText = growthAreas.length ? formatListText(growthAreas.map((m) => m.label), lang === "ro" ? "ro" : "en") : "";
  const byKey = Object.fromEntries(mental.map((m) => [m.key, m]));
  const scopScore = byKey["scop"]?.score ?? 0;
  const kunoScore = byKey["kuno"]?.score ?? 0;
  const abilScore = byKey["abil"]?.score ?? 0;
  const flexScore = byKey["flex"]?.score ?? 0;
  const intelScore = Math.round((scopScore + kunoScore + abilScore + flexScore) / 4);
  const missionSuccess = intelScore >= 80;
  if (!mental.length) {
    return (
      <section className="rounded-card border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] p-6 text-center text-[var(--omni-ink-soft)] shadow-[0_6px_26px_rgba(0,0,0,0.08)]">
        {lang === "ro"
          ? "Datele pentru această misiune se încarcă. Revino după ce finalizezi câteva lecții OmniKuno."
          : "We’re still loading the mental progress for this mission. Come back after a few OmniKuno lessons."}
      </section>
    );
  }

  return (
    <section className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="relative flex w-full items-center justify-center overflow-hidden rounded-card border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)]/90 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
        <Image
          src="/assets/mission-map/silhouette-path.png"
          alt={lang === "ro" ? "Siluetă pe un drum către orizont" : "Silhouette walking toward the horizon"}
          width={512}
          height={768}
          sizes="(min-width: 1024px) 420px, 70vw"
          className="h-auto w-full max-w-md rounded-[28px] border border-[var(--omni-border-soft)] object-cover"
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center pr-0 sm:justify-end sm:pr-6">
          <div className="relative h-72 w-48 origin-top scale-95 lg:scale-100">
            <div className="absolute top-[-94px] left-1/2 flex -translate-x-1/2 flex-col items-center gap-1">
              <HoneyHex label="INTEL" value={intelScore} id="mission-intel" />
              {missionSuccess ? (
                <span className="rounded-full bg-emerald-700/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-50">
                  Misiune reușită
                </span>
              ) : null}
            </div>
            <div className="absolute left-1/2 -translate-x-1/2" style={{ top: "38px" }}>
              <HoneyHex label="FLEX" value={flexScore} id="mission-flex" />
            </div>
            <div className="absolute bottom-[28%] left-0">
              <HoneyHex label="KUNO" value={kunoScore} id="mission-kuno" />
            </div>
            <div className="absolute bottom-[28%] right-0">
              <HoneyHex label="ABIL" value={abilScore} id="mission-abil" />
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
              <HoneyHex label="SCOP" value={scopScore} id="mission-scop" />
            </div>
            <svg
              aria-hidden="true"
              viewBox="0 0 10 36"
              className="absolute -bottom-5 left-[22%] h-9 w-2 text-[var(--omni-ink-soft)]"
            >
              <path d="M5 35L5 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M1 6L5 2L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <svg
              aria-hidden="true"
              viewBox="0 0 44 12"
              className="absolute bottom-[36%] left-[21%] h-3 w-10 text-[var(--omni-ink-soft)]"
            >
              <path d="M1 6H41" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M37 2L41 6L37 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <svg
              aria-hidden="true"
              viewBox="0 0 10 36"
              className="absolute -top-10 left-[65%] h-8 w-2 -translate-x-1/2 text-[var(--omni-ink-soft)]"
            >
              <path d="M5 34V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M1 6L5 2L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <div className="pointer-events-none absolute left-[calc(50%+95px)] bottom-[110px] -translate-x-1/2 w-[260px] rounded-card bg-white/92 px-5 py-2 text-[11px] font-semibold text-[var(--omni-ink)] shadow-[0_6px_18px_rgba(0,0,0,0.12)]">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--omni-muted)]">
            {lang === "ro" ? "Tema în focus" : "Focus theme"}
          </p>
          <p className="text-base font-semibold leading-tight tracking-[0.03em] text-[var(--omni-ink)] whitespace-nowrap overflow-hidden text-ellipsis">
            {missionTitle}
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
            {lang === "ro" ? "Progres mental" : "Mental progress"}
          </p>
          <h2 className="text-xl font-semibold text-[var(--omni-ink)]">
            {lang === "ro" ? "Cum ai lucrat până acum la această misiune" : "How you’ve worked on this mission"}
          </h2>
          <p className="text-sm text-[var(--omni-ink-soft)]">
            {lang === "ro"
              ? `Progresul pentru ${missionTitle} nu ține doar de timp, ci de cum îți folosești atenția. OmniINTEL îți arată cât ești de clar (SCOP), cât înțelegi mecanismele reale (KUNO), cât aplici (ABIL) și cât de flexibil rămâi (FLEX).`
              : `Progress on ${missionTitle} isn’t measured in hours but in focus. OmniINTEL shows how clear you are (SCOP), how well you understand the mechanics (KUNO), how much you apply them (ABIL), and how adaptable you stay (FLEX).`}
          </p>
        </div>

        <div className="space-y-2.5">
          {mental.map((metric) => (
            <div key={metric.key} className="rounded-card border border-[var(--omni-border-soft)]/70 bg-[var(--omni-surface-strong)] px-3 py-2.5 shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between text-[13px] font-semibold text-[var(--omni-ink)]">
                <span>{metric.label}</span>
                <span>{metric.score}%</span>
              </div>
              <p className="mt-1.5 text-[11px] leading-tight text-[var(--omni-ink-soft)]">{metric.description}</p>
            </div>
          ))}
        </div>

        <div className="rounded-card border border-[var(--omni-border-soft)]/80 bg-[var(--omni-bg-paper)] px-4 py-3 text-sm text-[var(--omni-ink-soft)] shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
          {strongest && focusText
            ? lang === "ro"
              ? `Ai claritate bună la ${strongest.label}, dar ${focusText} sunt încă fragile. Următorul pas este să aduni 1–2 insight-uri aplicabile și să le testezi calm, fără să te judeci că nu s-a schimbat totul peste noapte.`
              : `You’re steady on ${strongest.label}, while ${focusText} still need gentle practice. Gather one or two actionable insights and test them calmly—no self-blame if everything doesn’t shift overnight.`
            : lang === "ro"
              ? "Ești într-un punct stabil: continuă ritmul actual și revino aici după următoarea serie de lecții OmniKuno."
              : "You’re in a stable spot—keep your current rhythm and revisit after the next OmniKuno lessons."}
        </div>

        {onNextStep ? (
          <NeutralCtaButton onClick={onNextStep} size="sm">
            {lang === "ro" ? "Continuă cu următorul pas →" : "Continue to the next step →"}
          </NeutralCtaButton>
        ) : null}
      </div>
    </section>
  );
}
