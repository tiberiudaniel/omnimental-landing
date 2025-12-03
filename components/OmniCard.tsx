import clsx from "clsx";
import type { ReactNode } from "react";
import { designTokens } from "@/config/designTokens";

type OmniCardProps = {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function OmniCard({ children, className, style }: OmniCardProps) {
  return (
    <div
      className={clsx("rounded-card border shadow-card", className)}
      style={{
        backgroundColor: designTokens.ui.surface,
        borderColor: designTokens.ui.border,
        color: designTokens.ui.text.primary,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
