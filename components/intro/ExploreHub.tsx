"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExploreMap } from "./ExploreMap";
import { AxisTestCard } from "./AxisTestCard";
import { ContractCard } from "./ContractCard";
import {
  getExploreStartedAt,
  getTestsCompleted,
  getUnlockedMediumTests,
  setExploreStartedAt,
  setTestsCompleted,
  setUnlockedMediumTests,
  getExploreOfferShown,
  setExploreOfferShown,
} from "@/lib/intro/exploreState";
import { track } from "@/lib/telemetry/track";
import { PaywallSoftModal } from "./PaywallSoftModal";
import { useI18n } from "@/components/I18nProvider";
import { UPGRADE_URL } from "@/lib/constants/routes";

export default function ExploreHub() {
  const router = useRouter();
  const { lang } = useI18n();
  const locale = lang === "en" ? "en" : "ro";
  const [timerLabel, setTimerLabel] = useState("00:00");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [testsCompleted, setTestsCompletedState] = useState(0);
  const [mediumUnlocked, setMediumUnlockedState] = useState(false);
  const [contractVisible, setContractVisible] = useState(false);
  const [actionsCount, setActionsCount] = useState(0);
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerShown, setOfferShown] = useState(() => getExploreOfferShown());
  const contractTrackedRef = useRef(false);
  const testsCardRef = useRef<HTMLDivElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    track("explore_opened");
    let startedAt = getExploreStartedAt();
    if (!startedAt) {
      startedAt = Date.now();
      setExploreStartedAt(startedAt);
    }
    startedAtRef.current = startedAt;
    const updateTimer = () => {
      const diff = Math.max(0, Date.now() - (startedAt ?? Date.now()));
      setElapsedMs(diff);
      const minutes = Math.floor(diff / 60000)
        .toString()
        .padStart(2, "0");
      const seconds = Math.floor((diff % 60000) / 1000)
        .toString()
        .padStart(2, "0");
      setTimerLabel(`${minutes}:${seconds}`);
    };
    updateTimer();
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    intervalRef.current = window.setInterval(updateTimer, 1000);
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const storedTests = getTestsCompleted();
    const storedMedium = getUnlockedMediumTests();
    setTestsCompletedState(storedTests);
    setMediumUnlockedState(storedMedium);
  }, []);

  useEffect(() => {
    setContractVisible(testsCompleted >= 2);
  }, [testsCompleted]);

  useEffect(() => {
    if (contractVisible && !contractTrackedRef.current) {
      contractTrackedRef.current = true;
      track("contract_shown");
    }
  }, [contractVisible]);

  useEffect(() => {
    if (offerShown || offerOpen) return;
    if (testsCompleted >= 2) {
      setOfferOpen(true);
      setOfferShown(true);
      setExploreOfferShown(true);
      track("offer_shown", { flow: "explore", reason: "tests" });
      return;
    }
    if (elapsedMs >= 12 * 60 * 1000 && actionsCount >= 3) {
      setOfferOpen(true);
      setOfferShown(true);
      setExploreOfferShown(true);
      track("offer_shown", { flow: "explore", reason: "time" });
    }
  }, [actionsCount, elapsedMs, offerOpen, offerShown, testsCompleted]);

  const handleScrollToTests = useCallback(() => {
    testsCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActionsCount((prev) => prev + 1);
  }, []);

  const handleTestComplete = useCallback(
    () => {
      setTestsCompletedState((prev) => {
        const next = prev + 1;
        setTestsCompleted(next);
        return next;
      });
    },
    [],
  );

  const handleTestStarted = useCallback(() => {
    setActionsCount((prev) => prev + 1);
  }, []);

  const handleUnlockMedium = useCallback(() => {
    setMediumUnlockedState((prev) => {
      if (prev) return prev;
      setUnlockedMediumTests(true);
      return true;
    });
  }, []);

  const handleOfferClose = useCallback(() => {
    setOfferOpen(false);
    track("offer_dismissed", { flow: "explore" });
  }, []);

  const handleOfferUpgrade = useCallback(() => {
    track("offer_clicked", { flow: "explore", action: "upgrade" });
    setOfferOpen(false);
    router.push(UPGRADE_URL);
  }, [router]);

  const heroCopy = useMemo(() => {
    if (locale === "en") {
      return {
        title: "Explore OmniMental",
        subtitle: "Quick test. Nothing is saved without your consent.",
        timerLabel: "Exploration time",
      };
    }
    return {
      title: "Explorează OmniMental",
      subtitle: "Test rapid. Nimic nu se salvează fără acordul tău.",
      timerLabel: "Timp explorare",
    };
  }, [locale]);

  const offerCopy =
    locale === "en"
      ? {
          title: "Want daily structure?",
          body: "Exploration helps. Real progress comes from 5–7 minutes every day.",
          primary: "Activate plan",
          secondary: "Keep exploring",
        }
      : {
          title: "Vrei structură zilnică?",
          body: "Explorarea e utilă. Progresul real vine din frecvență. 5–7 minute/zi.",
          primary: "Activează planul",
          secondary: "Mai explorez",
        };

  return (
    <div className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-12 text-[var(--omni-ink)] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Exploration Mode</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{heroCopy.title}</h1>
          <p className="text-base text-[var(--omni-ink)]/80 sm:text-lg">{heroCopy.subtitle}</p>
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">
            {heroCopy.timerLabel}: <span className="text-[var(--omni-ink)]">{timerLabel}</span>
          </p>
        </header>
        <ExploreMap onContinue={handleScrollToTests} />
        <div ref={testsCardRef}>
          <AxisTestCard
            mediumUnlocked={mediumUnlocked}
            onTestComplete={handleTestComplete}
            onUnlockMedium={handleUnlockMedium}
            onTestStarted={handleTestStarted}
          />
        </div>
        {contractVisible ? (
          <ContractCard
            onExploreMore={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        ) : null}
      </div>
      <PaywallSoftModal
        open={offerOpen}
        title={offerCopy.title}
        body={offerCopy.body}
        primaryLabel={offerCopy.primary}
        secondaryLabel={offerCopy.secondary}
        onClose={handleOfferClose}
        onUpgrade={handleOfferUpgrade}
      />
    </div>
  );
}
