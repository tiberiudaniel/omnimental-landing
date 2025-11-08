"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import SiteHeader from "../../components/SiteHeader";
import MenuOverlay from "../../components/MenuOverlay";
import { useNavigationLinks } from "../../components/useNavigationLinks";
import { I18nProvider, useI18n } from "../../components/I18nProvider";
import { useProfile } from "../../components/ProfileProvider";
import AccountModal from "../../components/AccountModal";
import ProgressSparkline from "../../components/ProgressSparkline";
import { getDb } from "../../lib/firebase";

const db = getDb();

type SnapshotRecord = {
  id: string;
  tags: string[];
  categories: Array<{ category: string; count: number }>;
  urgency: number;
  timestamp?: Timestamp;
};

function formatDate(timestamp: Timestamp | undefined, locale: string) {
  if (!timestamp) {
    return "-";
  }
  try {
    return timestamp
      .toDate()
      .toLocaleDateString(locale === "ro" ? "ro-RO" : "en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
  } catch {
    return "-";
  }
}

function ProgressContent() {
  const { t, lang } = useI18n();
  const { profile } = useProfile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const navLinks = useNavigationLinks();
  const [snapshots, setSnapshots] = useState<SnapshotRecord[]>([]);
  const [loadingSnapshots, setLoadingSnapshots] = useState(false);

  const title = t("progressTitle");
  const subtitle = t("progressSubtitle");
  const categoriesTitle = t("progressCategoriesTitle");
  const historyTitle = t("progressHistoryTitle");
  const emptyHistory = t("progressEmptyHistory");
  const urgencyLabel = t("progressUrgencyLabel");
  const tagsLabel = t("progressTagsLabel");
  const ctaLabel = t("progressCTA");
  const latestLabel = t("progressLatestSnapshot");
  const backToEval = t("progressViewEvaluation");
  const noProfileTitle = t("progressNoProfileTitle");
  const noProfileDesc = t("progressNoProfileDesc");
  const createAccountLabel = t("progressCreateAccount");
  const sparklineTitle = t("progressSparklineTitle");
  const sparklineEmpty = t("progressSparklineEmpty");
  const sparklineLabel = t("progressSparklineLabel");
  const resaveNotice = t("progressResaveNotice");
  const categoryLabelsValue = t("intentCategoryLabels");
  const categoryLabels =
    categoryLabelsValue && typeof categoryLabelsValue === "object"
      ? (categoryLabelsValue as Record<string, string>)
      : {};

  useEffect(() => {
    if (!profile?.id) {
      setSnapshots([]);
      return;
    }
    let active = true;
    const loadSnapshots = async () => {
      setLoadingSnapshots(true);
      try {
        const snapshotQuery = query(
          collection(db, "userIntentSnapshots"),
          where("profileId", "==", profile.id),
          orderBy("timestamp", "desc"),
          limit(20),
        );
        const docs = await getDocs(snapshotQuery);
        if (!active) return;
        const parsed: SnapshotRecord[] = docs.docs.map((docItem) => {
          const data = docItem.data();
          return {
            id: docItem.id,
            tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
            categories: Array.isArray(data.categories)
              ? (data.categories as Array<{ category: string; count: number }>)
              : [],
            urgency: typeof data.urgency === "number" ? data.urgency : 0,
            timestamp: data.timestamp as Timestamp | undefined,
          };
        });
        setSnapshots(parsed);
      } catch (error) {
        console.error("snapshot fetch failed", error);
        setSnapshots([]);
      } finally {
        if (active) {
          setLoadingSnapshots(false);
        }
      }
    };
    loadSnapshots().catch(() => setLoadingSnapshots(false));
    return () => {
      active = false;
    };
  }, [profile?.id]);

  const aggregatedCategories = useMemo(() => {
    const totals = new Map<string, number>();
    snapshots.forEach((snapshot) => {
      snapshot.categories?.forEach(({ category, count }) => {
        totals.set(category, (totals.get(category) ?? 0) + count);
      });
    });
    return Array.from(totals.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [snapshots]);
  const stageBadges = useMemo(() => {
    if (!aggregatedCategories.length) {
      return [];
    }
    const stageConfig = [
      {
        key: "stability",
        categories: ["calm", "boundaries"],
        label: t("progressStageStability"),
      },
      {
        key: "clarity",
        categories: ["clarity", "selfTrust"],
        label: t("progressStageClarity"),
      },
      {
        key: "momentum",
        categories: ["career", "relationships"],
        label: t("progressStageMomentum"),
      },
    ];
    return stageConfig
      .map((config) => ({
        key: config.key,
        label: typeof config.label === "string" ? config.label : config.key,
        count: aggregatedCategories
          .filter((entry) => config.categories.includes(entry.category))
          .reduce((sum, entry) => sum + entry.count, 0),
      }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [aggregatedCategories, t]);

  const urgencyValues = useMemo(
    () => snapshots.map((snapshot) => snapshot.urgency).reverse(),
    [snapshots],
  );

  return (
    <div className="bg-bgLight min-h-screen">
      <SiteHeader
        showMenu
        onMenuToggle={() => setMenuOpen(true)}
        onAuthRequest={() => setAccountModalOpen(true)}
      />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
      <AccountModal open={accountModalOpen} onClose={() => setAccountModalOpen(false)} />
      <main className="px-4 py-12 md:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[#C07963]">
            {typeof latestLabel === "string" ? latestLabel : "Latest evaluation"}
          </p>
          <h1 className="text-3xl font-semibold text-[#2C1F18]">
            {typeof title === "string" ? title : "Your mental progress"}
          </h1>
          <p className="text-sm text-[#4A3A30]">
            {typeof subtitle === "string"
              ? subtitle
              : "Each saved evaluation becomes a map of recurring themes."}
          </p>
        </div>

        {!profile ? (
          <div className="mx-auto mt-10 max-w-3xl rounded-[16px] border border-[#E4D8CE] bg-white/95 px-6 py-8 text-center shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
            <h2 className="text-xl font-semibold text-[#1F1F1F]">
              {typeof noProfileTitle === "string"
                ? noProfileTitle
                : "Create an account to track progress"}
            </h2>
            <p className="mt-3 text-sm text-[#2C2C2C]/80">
              {typeof noProfileDesc === "string"
                ? noProfileDesc
                : "Save your profile once and every evaluation will sync automatically."}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => setAccountModalOpen(true)}
                className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
              >
                {typeof createAccountLabel === "string" ? createAccountLabel : "Create account"}
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-[10px] border border-[#D8C6B6] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#2C2C2C]"
              >
                {typeof backToEval === "string" ? backToEval : "Back to clarity"}
              </Link>
            </div>
          </div>
        ) : (
          <div className="mx-auto mt-10 grid max-w-6xl gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-6 shadow-[0_12px_32px_rgba(0,0,0,0.06)]">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-[#A08F82]">
                  {typeof categoriesTitle === "string" ? categoriesTitle : "Dominant themes"}
                </h3>
                <div className="mt-4 space-y-3">
                  {aggregatedCategories.length === 0 ? (
                    <>
                      <p className="text-sm text-[#2C2C2C]/70">
                        {typeof emptyHistory === "string"
                          ? emptyHistory
                          : "No saved evaluations yet."}
                      </p>
                      {profile && typeof resaveNotice === "string" && (
                        <p className="text-xs text-[#2C2C2C]/60">{resaveNotice}</p>
                      )}
                    </>
                  ) : (
                    aggregatedCategories.map(({ category, count }) => {
                      const label = categoryLabels[category] ?? category;
                      return (
                        <div key={category}>
                          <div className="flex items-center justify-between text-sm font-medium text-[#1F1F1F]">
                            <span>{label}</span>
                            <span>{count}</span>
                          </div>
                          <div className="mt-1 h-2 w-full rounded-full bg-[#E8DDD3]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#2C2C2C] via-[#C24B17] to-[#E60012]"
                              style={{
                                width: `${Math.min(
                                  (count / (snapshots.length * 7 || 1)) * 100 * 2,
                                  100,
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                {stageBadges.length > 0 ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {stageBadges.map((badge) => (
                      <span
                        key={badge.key}
                        className="rounded-full border border-[#D8C6B6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C]"
                      >
                        {badge.label}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-6 shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-[#A08F82]">
                      {typeof sparklineLabel === "string" ? sparklineLabel : "Intensity trend"}
                    </h3>
                    <p className="text-xs text-[#2C2C2C]/70">
                      {typeof sparklineTitle === "string"
                        ? sparklineTitle
                        : "Intensity over time"}
                    </p>
                  </div>
                  {urgencyValues.length > 0 ? (
                    <span className="text-xs font-semibold text-[#E60012]">
                      {urgencyValues[urgencyValues.length - 1]}/10
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 flex items-center justify-center">
                  {urgencyValues.length > 0 ? (
                    <ProgressSparkline values={urgencyValues.slice(-10)} />
                  ) : (
                    <p className="text-sm text-[#2C2C2C]/60">
                      {typeof sparklineEmpty === "string"
                        ? sparklineEmpty
                        : "Complete another evaluation to see the trend."}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-6 shadow-[0_12px_32px_rgba(0,0,0,0.06)]">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-[#A08F82]">
                {typeof historyTitle === "string" ? historyTitle : "History"}
              </h3>
              <div className="mt-4 space-y-4">
                {loadingSnapshots ? (
                  <p className="text-sm text-[#2C2C2C]/70">Loading…</p>
                ) : snapshots.length === 0 ? (
                  <p className="text-sm text-[#2C2C2C]/70">
                    {typeof emptyHistory === "string"
                      ? emptyHistory
                      : "No saved evaluations yet."}
                  </p>
                ) : (
                  snapshots.map((snapshot) => (
                    <div
                      key={snapshot.id}
                      className="rounded-[12px] border border-[#F0E4DA] bg-[#FDF9F5] px-4 py-3"
                    >
                      <div className="flex items-center justify-between text-sm font-semibold text-[#1F1F1F]">
                        <span>{formatDate(snapshot.timestamp, lang)}</span>
                        <span className="text-xs uppercase tracking-[0.2em] text-[#E60012]">
                          {typeof urgencyLabel === "string" ? urgencyLabel : "Intensity"} {snapshot.urgency}/10
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#2C2C2C]">
                        {snapshot.categories?.slice(0, 2).map(({ category }) => (
                          <span
                            key={`${snapshot.id}-${category}`}
                            className="rounded-full border border-[#D8C6B6] px-3 py-1 text-[11px] uppercase tracking-[0.25em]"
                          >
                            {categoryLabels[category] ?? category}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-[#2C2C2C]/70">
                        <span className="font-semibold uppercase tracking-[0.2em]">
                          {typeof tagsLabel === "string" ? tagsLabel : "Keywords"}:
                        </span>{" "}
                        {snapshot.tags.slice(0, 4).join(", ")}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
                >
                  {typeof backToEval === "string" ? backToEval : "Back to clarity"}
                </Link>
                <Link
                  href="/evaluation"
                  className="inline-flex items-center justify-center rounded-[10px] border border-[#D8C6B6] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#2C2C2C]"
                >
                  {typeof ctaLabel === "string" ? ctaLabel : "Start again"}
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ProgressPage() {
  return (
    <I18nProvider>
      <ProgressContent />
    </I18nProvider>
  );
}
