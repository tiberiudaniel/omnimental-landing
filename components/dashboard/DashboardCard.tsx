import type { HTMLAttributes, ReactNode } from "react";

type DashboardCardProps = {
  title: string;
  subtitle?: string;
  ctaLabel?: ReactNode;
  onCtaClick?: () => void;
  footer?: ReactNode;
  headerExtra?: ReactNode;
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export default function DashboardCard({
  title,
  subtitle,
  ctaLabel,
  onCtaClick,
  footer,
  headerExtra,
  children,
  className = "",
  style,
  ...rest
}: DashboardCardProps) {
  return (
    <div
      className={`rounded-3xl border px-4 py-4 shadow-sm sm:px-5 sm:py-5 ${className}`}
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border-subtle)",
        boxShadow: "var(--shadow-card)",
        color: "var(--text-main)",
        ...style,
      }}
      {...rest}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.35em]"
            style={{ color: "var(--text-muted)" }}
          >
            {title}
          </p>
          {subtitle ? (
            <p className="mt-1 text-base font-semibold leading-tight sm:text-lg">
              {subtitle}
            </p>
          ) : null}
        </div>
        {headerExtra ? <div className="text-right text-[11px]">{headerExtra}</div> : null}
        {ctaLabel && onCtaClick ? (
          <button
            type="button"
            onClick={onCtaClick}
            className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] transition"
            style={{
              borderColor: "var(--border-subtle)",
              color: "var(--accent-main)",
              backgroundColor: "color-mix(in srgb, var(--accent-main) 10%, transparent)",
            }}
          >
            {ctaLabel}
          </button>
        ) : null}
      </div>
      <div className="mt-3 text-sm" style={{ color: "var(--text-main)" }}>
        {children}
      </div>
      {footer ? (
        <div
          className="mt-4 border-t pt-3 text-[11px] uppercase tracking-[0.18em]"
          style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
        >
          {footer}
        </div>
      ) : null}
    </div>
  );
}
