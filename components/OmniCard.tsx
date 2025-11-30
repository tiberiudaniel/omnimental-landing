import clsx from "clsx";
import type { ReactNode } from "react";

type OmniCardProps = {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function OmniCard({ children, className, style }: OmniCardProps) {
  return (
    <div
      className={clsx("rounded-2xl border shadow-sm", className)}
      style={{
        backgroundColor: "var(--omni-surface-card)",
        borderColor: "var(--omni-border-soft)",
        color: "var(--omni-ink)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
