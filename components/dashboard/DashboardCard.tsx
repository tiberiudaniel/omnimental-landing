import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";
import { designTokens } from "@/config/designTokens";
import { withAlpha } from "@/lib/colorUtils";

type DashboardCardProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  ctaLabel?: ReactNode;
  onCtaClick?: () => void;
  footer?: ReactNode;
  headerExtra?: ReactNode;
  children: ReactNode;
  accentColor?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "title">;

export default function DashboardCard({
  title,
  subtitle,
  ctaLabel,
  onCtaClick,
  footer,
  headerExtra,
  children,
  accentColor = designTokens.brand.terracotta,
  className = "",
  style,
  ...rest
}: DashboardCardProps) {
  const bgColor = designTokens.ui.surface;
  const borderColor = designTokens.ui.border;
  const textPrimary = designTokens.ui.text.primary;
  const textMuted = designTokens.ui.text.muted;
  const shadow = designTokens.shadows.card;
  return (
    <div
      className={clsx("rounded-card border px-4 py-4 shadow-card sm:px-5 sm:py-5", className)}
      style={{
        backgroundColor: bgColor,
        borderColor,
        boxShadow: shadow,
        color: textPrimary,
        ...style,
      }}
      {...rest}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {typeof title === "string" || typeof title === "number" ? (
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.35em]"
              style={{ color: textMuted }}
            >
              {title}
            </p>
          ) : (
            <div>{title}</div>
          )}
          {subtitle
            ? typeof subtitle === "string" || typeof subtitle === "number"
              ? (
                <p className="mt-1 text-base font-semibold leading-tight sm:text-lg">
                  {subtitle}
                </p>
              )
              : (
                <div className="mt-1">
                  {subtitle}
                </div>
              )
            : null}
        </div>
        {headerExtra ? <div className="text-right text-[11px]" style={{ color: textMuted }}>{headerExtra}</div> : null}
        {ctaLabel && onCtaClick ? (
          <button
            type="button"
            onClick={onCtaClick}
            className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] transition"
            style={{
              borderColor: withAlpha(accentColor, 0.35),
              color: accentColor,
              backgroundColor: withAlpha(accentColor, 0.12),
            }}
          >
            {ctaLabel}
          </button>
        ) : null}
      </div>
      <div className="mt-3 text-sm" style={{ color: textPrimary }}>
        {children}
      </div>
      {footer ? (
        <div
          className="mt-4 border-t pt-3 text-[11px] uppercase tracking-[0.18em]"
          style={{ borderColor, color: textMuted }}
        >
          {footer}
        </div>
      ) : null}
    </div>
  );
}
