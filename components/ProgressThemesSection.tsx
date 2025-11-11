"use client";

import ProgressSparkline from "./ProgressSparkline";

type Props = {
  lang: "ro" | "en";
  heading: { title: string; subtitle: string };
  details?: {
    recommendedLabel?: string | null;
    reasonText?: string | null;
    topDimensions: string[];
  } | null;
  selectionMessage?: string | null;
  sparkValues: number[];
  heroMeta: string[];
  resyncing: boolean;
  onResync: () => Promise<void> | void;
};

export default function ProgressThemesSection({ lang, heading, details, selectionMessage, sparkValues, heroMeta, resyncing, onResync }: Props) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-[#C07963]">OmniMental Progress</p>
      <h1 className="text-3xl font-semibold text-[#2C1F18]">{heading.title}</h1>
      <p className="text-sm text-[#4A3A30]">{heading.subtitle}</p>
      {details ? (
        <section className="mx-auto mt-4 max-w-3xl space-y-3 rounded-[18px] border border-[#E4D8CE] bg-white px-6 py-5 text-center shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#C07963]">
            {lang === "ro" ? "Rezumat recomandare" : "Recommendation summary"}
          </p>
          {details.recommendedLabel ? (
            <h2 className="text-lg font-semibold text-[#2C1F18]">{details.recommendedLabel}</h2>
          ) : null}
          {details.reasonText ? (
            <p className="text-sm leading-relaxed text-[#4A3A30]">{details.reasonText}</p>
          ) : null}
          {selectionMessage ? (
            <p className="text-xs text-[#7A6455]">{selectionMessage}</p>
          ) : null}
          {sparkValues.length > 1 ? (
            <div className="mx-auto mt-2 flex w-full max-w-xs items-center justify-center">
              <ProgressSparkline values={sparkValues} />
            </div>
          ) : null}
          {details.topDimensions.length ? (
            <div className="flex flex-wrap justify-center gap-2">
              {details.topDimensions.map((label, index) => (
                <span
                  key={`${label}-${index.toString()}`}
                  className="rounded-full border border-[#E4D8CE] bg-[#FFFBF7] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#5C4F45]"
                >
                  {label}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-2 flex justify-center">
            <button
              type="button"
              disabled={resyncing}
              onClick={() => void onResync()}
              className="rounded-[10px] border border-[#A08F82] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#4A3A30] hover:border-[#E60012] hover:text-[#E60012] disabled:opacity-60"
            >
              {resyncing
                ? lang === "ro"
                  ? "Sincronizare..."
                  : "Syncing..."
                : lang === "ro"
                ? "Resincronizează"
                : "Resync now"}
            </button>
          </div>
          {heroMeta.length ? (
            <div className="flex flex-wrap justify-center gap-2">
              {heroMeta.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[#F0E6DA] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A08F82]"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : null}
        </section>
      ) : heroMeta.length ? (
        <section className="mx-auto mt-4 max-w-3xl rounded-[16px] border border-[#E4D8CE] bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#5C4F45] shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
          {heroMeta.join(" • ")}
        </section>
      ) : null}
    </div>
  );
}

