"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import SimulatorTimer from "./SimulatorTimer";
import type { DailyPathNodeConfig } from "@/types/dailyPath";

export type DailyNodeStatus = "locked" | "active" | "completed";

interface DailyPathNodeProps {
  node: DailyPathNodeConfig;
  status: DailyNodeStatus;
  onSelect?: () => void;
  isAutonomy?: boolean;
  showSoftLabel?: boolean;
  onAutonomyChoice?: (choice: "soft" | "challenge") => void;
}

type QuizState = {
  choice: string | null;
  feedback: "correct" | "incorrect" | null;
};

type RealWorldState = {
  context: string;
  rule: string;
  setContext: (value: string) => void;
  setRule: (value: string) => void;
};

const CARD_WRAPPER = "w-full";
const CARD_BASE =
  "rounded-[28px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-5 py-6 shadow-[0_18px_46px_rgba(0,0,0,0.08)] sm:px-6";

const SHAPE_ICON: Record<DailyPathNodeConfig["shape"], string> = {
  circle: "●",
  star: "★",
  hollow: "○",
};

const BADGE_LABELS: Record<NonNullable<DailyPathNodeConfig["badge"]>, string> = {
  simulator: "Simulator",
  viata_reala: "Viața reală",
};

export default function DailyPathNode({
  node,
  status,
  onSelect,
  isAutonomy,
  showSoftLabel,
  onAutonomyChoice,
}: DailyPathNodeProps) {
  const router = useRouter();
  const [quizState, setQuizState] = useState<QuizState>({ choice: null, feedback: null });
  const [realContext, setRealContext] = useState("");
  const [realRule, setRealRule] = useState("");
  const simulatorAutoStart = node.softPathOnly === true;
  const realWorldInputRef = useRef<HTMLInputElement | null>(null);
  const icon = SHAPE_ICON[node.shape];
  const badgeLabel = node.badge ? BADGE_LABELS[node.badge] : null;
  const shouldAutofocusRealWorld = node.kind === "REAL_WORLD";

  useEffect(() => {
    if (!shouldAutofocusRealWorld) return;
    queueMicrotask(() => realWorldInputRef.current?.focus());
  }, [shouldAutofocusRealWorld]);

  if (status === "locked") {
    return (
      <div className={CARD_WRAPPER}>
        <div className="flex h-14 w-full items-center justify-center rounded-[32px] border border-dashed border-[var(--omni-border-soft)] text-2xl text-[var(--omni-muted)]">
          {icon}
        </div>
      </div>
    );
  }

  if (status === "completed") {
    return (
      <div className={CARD_WRAPPER}>
        <div className="flex w-full items-center gap-4 rounded-[28px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-main)] px-5 py-5 shadow-[0_6px_18px_rgba(0,0,0,0.06)] sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--omni-energy-soft)] text-lg font-semibold text-[var(--omni-energy-dark)] sm:h-12 sm:w-12">
            {icon}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--omni-ink)]">{node.title}</p>
            <p className="text-xs text-[var(--omni-muted)]">
              Finalizat · {node.xp > 0 ? `+${node.xp} XP` : "XP 0"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isAutonomy) {
    return <AutonomyCard onChoose={onAutonomyChoice} />;
  }

  if (node.kind === "SUMMARY") {
    return (
      <SummaryCard
        node={node}
        onComplete={() => {
          onSelect?.();
          router.push("/progress");
        }}
      />
    );
  }

  if (node.kind === "ANCHOR") {
    return (
      <AnchorCard
        node={node}
        onComplete={() => {
          onSelect?.();
          router.push("/progress");
        }}
      />
    );
  }

  if (node.kind === "INTRO") {
    return (
      <IntroCard
        node={node}
        onStart={() => {
          onSelect?.();
        }}
      />
    );
  }

  const handleQuizSelect = (optionId: string) => {
    if (quizState.feedback) return;
    const isCorrect = node.correctOptionIds?.includes(optionId) ?? false;
    setQuizState({
      choice: optionId,
      feedback: isCorrect ? "correct" : "incorrect",
    });
  };

  const requiresRealWorldFields =
    node.kind === "REAL_WORLD" && (node.fields?.length ?? 0) >= 2;
  const realWorldReady =
    !requiresRealWorldFields || Boolean(realContext.trim().length && realRule.trim().length);

  const handlePrimaryAction = () => {
    if (node.kind === "REAL_WORLD") {
      console.log("[REAL_WORLD commitment]", {
        context: realContext.trim(),
        rule: realRule.trim(),
      });
    }
    onSelect?.();
  };

  return (
    <StandardCard
      node={node}
      icon={icon}
      badgeLabel={badgeLabel}
      showSoftLabel={showSoftLabel}
      quizState={quizState}
      onQuizSelect={handleQuizSelect}
      onPrimaryAction={handlePrimaryAction}
      primaryDisabled={!realWorldReady}
      realWorld={{
        context: realContext,
        rule: realRule,
        setContext: setRealContext,
        setRule: setRealRule,
      }}
      simulatorAutoStart={simulatorAutoStart}
      realWorldInputRef={realWorldInputRef}
    />
  );
}

function IntroCard({ node, onStart }: { node: DailyPathNodeConfig; onStart?: () => void }) {
  return (
    <div className={CARD_WRAPPER}>
      <div className={`${CARD_BASE} pt-10`}>
        <h2 className="mt-3 text-3xl font-semibold text-[var(--omni-ink)]">{node.title}</h2>
        <p className="mt-4 text-base text-[var(--omni-ink)]/80">{node.description}</p>
        <div className="mt-6">
          <OmniCtaButton size="md" onClick={onStart}>
            {node.ctaLabel ?? "Încep"}
          </OmniCtaButton>
        </div>
      </div>
    </div>
  );
}

function StandardCard({
  node,
  icon,
  badgeLabel,
  showSoftLabel,
  quizState,
  onQuizSelect,
  onPrimaryAction,
  primaryDisabled,
  realWorld,
  simulatorAutoStart,
  realWorldInputRef,
}: {
  node: DailyPathNodeConfig;
  icon: string;
  badgeLabel: string | null;
  showSoftLabel?: boolean;
  quizState: QuizState;
  onQuizSelect: (optionId: string) => void;
  onPrimaryAction?: () => void;
  primaryDisabled?: boolean;
  realWorld?: RealWorldState;
  simulatorAutoStart?: boolean;
  realWorldInputRef?: React.RefObject<HTMLInputElement>;
}) {
  const isQuiz = node.kind === "QUIZ_SINGLE";
  const showButton = true;
  const disableQuizButton = isQuiz && !quizState.choice;
  const buttonLabel = node.ctaLabel ?? getButtonLabel(node.kind);
  const showXp = node.xp > 0;

  return (
    <div className={CARD_WRAPPER}>
      <div className={CARD_BASE}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--omni-energy)] text-lg font-semibold text-[var(--omni-bg-paper)] sm:h-12 sm:w-12">
              {icon}
            </div>
            <div>
              <p className="text-lg font-semibold text-[var(--omni-ink)]">{node.title}</p>
              {node.isBonus ? (
                <span className="text-xs uppercase tracking-[0.4em] text-[var(--omni-energy-dark)]">Bonus</span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {showSoftLabel ? (
              <span className="rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-[10px] uppercase tracking-[0.4em] text-[var(--omni-muted)]">
                Soft path
              </span>
            ) : null}
            {badgeLabel ? (
              <span className="rounded-full border border-[var(--omni-energy)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.4em] text-[var(--omni-energy)]">
                {badgeLabel}
              </span>
            ) : null}
          </div>
        </div>
        <div className="mt-5">
          <NodeBody
            node={node}
            quizState={quizState}
            onQuizSelect={onQuizSelect}
            realWorld={realWorld}
            simulatorAutoStart={simulatorAutoStart}
            realWorldInputRef={realWorldInputRef}
          />
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {showXp ? (
            <span className="rounded-full bg-[var(--omni-bg-main)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-ink)]">
              +{node.xp} XP
            </span>
          ) : null}
          {showButton ? (
            <div className="ml-auto w-full sm:w-auto">
              <OmniCtaButton
                size="sm"
                onClick={onPrimaryAction}
                disabled={primaryDisabled || disableQuizButton}
                className="w-full sm:w-auto"
              >
                {buttonLabel}
              </OmniCtaButton>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function NodeBody({
  node,
  quizState,
  onQuizSelect,
  realWorld,
  simulatorAutoStart,
  realWorldInputRef,
}: {
  node: DailyPathNodeConfig;
  quizState: QuizState;
  onQuizSelect: (optionId: string) => void;
  realWorld?: RealWorldState;
  simulatorAutoStart?: boolean;
  realWorldInputRef?: React.RefObject<HTMLInputElement>;
}) {
  switch (node.kind) {
    case "SIMULATOR":
      if (node.simulatorConfig) {
        return (
          <div className="space-y-4 text-center">
            <SimulatorTimer
              autoStart={simulatorAutoStart}
              inhaleSeconds={node.simulatorConfig.inhaleSeconds}
              exhaleSeconds={node.simulatorConfig.exhaleSeconds}
            />
            <p className="text-sm text-[var(--omni-ink)]/80">{node.description}</p>
          </div>
        );
      }
      return <p className="text-sm text-[var(--omni-ink)]/80">{node.description}</p>;
    case "REAL_WORLD":
      if (node.fields && node.fields.length >= 2) {
        const [contextField, ruleField] = node.fields;
        return (
          <div className="space-y-4 rounded-[20px] border border-[var(--omni-border-soft)] bg-white/60 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--omni-muted)]">{node.title}</p>
            {node.description ? (
              <p className="text-sm text-[var(--omni-ink)]/80">{node.description}</p>
            ) : null}
            {contextField ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--omni-ink)]">{contextField.label}</p>
                <input
                  type="text"
                  value={realWorld?.context ?? ""}
                  onChange={(event) => realWorld?.setContext(event.target.value)}
                  placeholder={contextField.placeholder ?? ""}
                  className="w-full rounded-[14px] border border-[var(--omni-border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--omni-ink)] outline-none focus:border-[var(--omni-ink)]"
                  ref={realWorldInputRef}
                />
              </div>
            ) : null}
            {ruleField ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--omni-ink)]">{ruleField.label}</p>
                <div className="flex flex-wrap items-center gap-2 rounded-[18px] border border-[var(--omni-border-soft)] px-3 py-2">
                  {ruleField.prefix ? (
                    <span className="text-sm text-[var(--omni-muted)]">{ruleField.prefix}</span>
                  ) : null}
                  <textarea
                    rows={2}
                    value={realWorld?.rule ?? ""}
                    onChange={(event) => realWorld?.setRule(event.target.value)}
                    placeholder={ruleField.placeholder ?? ""}
                    className="min-h-[48px] flex-1 resize-none rounded-md bg-transparent text-sm text-[var(--omni-ink)] outline-none placeholder:text-[var(--omni-muted)]"
                  />
                  {ruleField.suffix ? (
                    <span className="text-sm font-semibold text-[var(--omni-ink)]">{ruleField.suffix}</span>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        );
      }
      return (
        <div className="space-y-4 rounded-[20px] border border-[var(--omni-border-soft)] bg-white/60 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--omni-muted)]">{node.title}</p>
          <p className="text-sm text-[var(--omni-ink)]/80">{node.description}</p>
        </div>
      );
    case "QUIZ_SINGLE": {
      const options = node.quizOptions ?? [];
      const answered = quizState.feedback !== null;
      const feedbackLabel = quizState.feedback === "correct" ? "Corect" : "Recalibrare";
      const feedbackCopy =
        quizState.feedback === "correct"
          ? node.quizFeedback?.correct ?? "Răspuns bun."
          : node.quizFeedback?.incorrect ?? "Mai există o variantă mai utilă.";
      return (
        <div className="space-y-3">
          <p className="text-sm text-[var(--omni-ink)]/80">{node.description}</p>
          <div className="space-y-2">
            {options.map((option) => {
              const selected = quizState.choice === option.id;
              const isCorrect = selected && quizState.feedback === "correct";
              const isIncorrect = selected && quizState.feedback === "incorrect";
              let optionClasses =
                "w-full rounded-[16px] border px-4 py-3 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--omni-energy)]";
              if (answered) {
                if (isCorrect) {
                  optionClasses += " border-transparent bg-[#315d23] text-white";
                } else if (isIncorrect) {
                  optionClasses += " border-transparent bg-[#b25137] text-white";
                } else {
                  optionClasses += " border-[var(--omni-border-soft)] text-[var(--omni-muted)] opacity-60";
                }
              } else if (selected) {
                optionClasses += " border-[var(--omni-ink)] text-[var(--omni-ink)]";
              } else {
                optionClasses +=
                  " border-[var(--omni-border-soft)] text-[var(--omni-ink)] hover:border-[var(--omni-ink)]/50";
              }
              return (
                <button
                  type="button"
                  key={option.id}
                  onClick={() => onQuizSelect(option.id)}
                  className={optionClasses}
                  disabled={answered}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {answered ? (
            <div className="rounded-[18px] bg-white/80 px-4 py-3">
              <p
                className={`text-xs font-semibold uppercase tracking-[0.35em] ${
                  quizState.feedback === "correct" ? "text-[#315d23]" : "text-[#b25137]"
                }`}
              >
                {feedbackLabel}
              </p>
              <p className="mt-2 text-sm text-[var(--omni-ink)]/80">{feedbackCopy}</p>
            </div>
          ) : null}
        </div>
      );
    }
    default:
      return <p className="text-base text-[var(--omni-ink)]/80">{node.description}</p>;
  }
}

function AutonomyCard({ onChoose }: { onChoose?: (choice: "soft" | "challenge") => void }) {
  return (
    <div className={CARD_WRAPPER}>
      <div className={`${CARD_BASE} bg-[var(--omni-bg-main)]`}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[var(--omni-muted)]">Autonomie</p>
        <h3 className="mt-2 text-2xl font-semibold text-[var(--omni-ink)]">Cum simți?</h3>
        <p className="mt-2 text-sm text-[var(--omni-ink)]/80">
          Mai ai nevoie de încă un exercițiu sau ești pregătit pentru provocare?
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <OmniCtaButton
            size="sm"
            variant="neutral"
            onClick={() => onChoose?.("soft")}
            className="flex-1"
          >
            Încă mai exersez
          </OmniCtaButton>
          <OmniCtaButton
            size="sm"
            onClick={() => onChoose?.("challenge")}
            className="flex-1"
          >
            Sunt pregătit
          </OmniCtaButton>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ node, onComplete }: { node: DailyPathNodeConfig; onComplete?: () => void }) {
  const bullets =
    node.bullets && node.bullets.length > 0
      ? node.bullets
      : node.description
          .split("\n")
          .map((line) => line.replace(/^\d+\)\s*/, "").trim())
          .filter(Boolean);
  const fallbackTitle =
    node.title && node.title.trim().length > 0 ? node.title : "Ai terminat antrenamentul de azi";

  return (
    <div className={CARD_WRAPPER}>
      <div className="rounded-[32px] border border-[#e6dccd] bg-[#f7f2eb] px-6 py-7 text-center shadow-[0_22px_48px_rgba(0,0,0,0.12)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/70 text-2xl">
          🏁
        </div>
        <h3 className="mt-4 text-2xl font-semibold text-[var(--omni-ink)]">{fallbackTitle}</h3>
        <div className="mt-4 space-y-2">
          <ul className="space-y-1 text-sm text-[var(--omni-ink)]/80">
            {bullets.map((item) => (
              <li key={item} className="flex items-start gap-2 text-left">
                <span className="pt-[2px] text-[var(--omni-ink)]/50">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        {node.anchorDescription ? (
          <div className="mt-6 space-y-2">
            <div className="rounded-[22px] bg-white/80 px-4 py-4 text-base font-semibold text-[var(--omni-ink)]">
              {node.anchorDescription}
            </div>
          </div>
        ) : null}
        <div className="mt-6">
          <OmniCtaButton size="md" onClick={onComplete}>
            {node.ctaLabel ?? "Vezi progresul"}
          </OmniCtaButton>
        </div>
      </div>
    </div>
  );
}

function AnchorCard({ node, onComplete }: { node: DailyPathNodeConfig; onComplete?: () => void }) {
  return (
    <div className={CARD_WRAPPER}>
      <div className={`${CARD_BASE} text-center`}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[var(--omni-muted)]">Mottoul zilei</p>
        <p className="mt-4 text-xl font-semibold text-[var(--omni-ink)]">{node.description}</p>
        <div className="mt-6">
          <OmniCtaButton size="sm" onClick={onComplete}>
            {node.ctaLabel ?? "Gata pe azi"}
          </OmniCtaButton>
        </div>
      </div>
    </div>
  );
}

function getButtonLabel(kind: DailyPathNodeConfig["kind"]) {
  switch (kind) {
    case "SIMULATOR":
      return "Am făcut exercițiul";
    case "REAL_WORLD":
      return "Îmi iau angajamentul";
    default:
      return "Continuă";
  }
}
