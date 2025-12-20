import Link from "next/link";
import type { LinkProps } from "next/link";
import clsx from "clsx";
import type { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, ReactNode } from "react";
import { designTokens } from "@/config/designTokens";

export type OmniCtaVariant = "primary" | "kuno" | "abil" | "neutral" | "secondary";
export type OmniCtaSize = "sm" | "md" | "lg";

export interface OmniCtaButtonProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "onClick"> {
  as?: "button" | "link";
  href?: LinkProps["href"];
  onClick?: () => void;
  variant?: OmniCtaVariant;
  size?: OmniCtaSize;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  target?: string;
  rel?: string;
  style?: CSSProperties;
}

const sizeClasses: Record<OmniCtaSize, string> = {
  sm: "min-h-[38px] px-4 text-[10px]",
  md: "min-h-[46px] px-6 text-[11px]",
  lg: "min-h-[54px] px-7 text-[12px]",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold uppercase tracking-[0.25em] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:-translate-y-[1.5px] hover:shadow-[0_6px_22px_rgba(0,0,0,0.07)] transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--omni-energy-tint)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--omni-bg-paper)] disabled:cursor-not-allowed disabled:opacity-60";

const variantTokens: Record<
  OmniCtaVariant,
  { background: string; textColor: string; border: string }
> = {
  primary: {
    background: designTokens.gradients.primarySoft,
    textColor: designTokens.components.cta.textColor,
    border: "1px solid transparent",
  },
  kuno: {
    background: designTokens.gradients.kuno,
    textColor: designTokens.module.kuno.textMain,
    border: "1px solid transparent",
  },
  abil: {
    background: designTokens.gradients.abil,
    textColor: designTokens.module.abil.textMain,
    border: "1px solid transparent",
  },
  neutral: {
    background: "transparent",
    textColor: designTokens.ui.text.primary,
    border: `1px solid ${designTokens.ui.borderStrong}`,
  },
  secondary: {
    background: "var(--omni-bg-paper)",
    textColor: designTokens.ui.text.primary,
    border: `1px solid ${designTokens.ui.border}`,
  },
};

export function OmniCtaButton({
  as = "button",
  href,
  onClick,
  variant = "primary",
  size = "md",
  icon,
  children,
  className,
  disabled,
  type,
  target,
  rel,
  style,
  ...rest
}: OmniCtaButtonProps) {
  const variantStyle = variantTokens[variant];
  const combinedClassName = clsx(
    baseClasses,
    sizeClasses[size],
    variant === "neutral"
      ? "text-[var(--omni-ink)] hover:bg-[rgba(0,0,0,0.04)] hover:-translate-y-[0.5px]"
      : variant === "secondary"
        ? "text-[var(--omni-ink)] hover:bg-[rgba(0,0,0,0.03)]"
        : "text-[var(--omni-ink)]",
    className,
  );
  const commonStyle: CSSProperties = {
    background: variantStyle.background,
    color: variantStyle.textColor,
    border: variantStyle.border,
    minHeight: designTokens.components.cta.height,
    ...style,
  };

  const content = (
    <>
      {icon ? <span className="text-base leading-none">{icon}</span> : null}
      <span className="leading-none">{children}</span>
    </>
  );

  if (as === "link") {
    const relValue = rel ?? (target === "_blank" ? "noopener noreferrer" : undefined);
    if (!href) {
      throw new Error("OmniCtaButton with as='link' requires href");
    }
    return disabled ? (
      <span
        className={combinedClassName}
        style={commonStyle}
        aria-disabled
        {...rest}
      >
        {content}
      </span>
    ) : (
      <Link
        href={href}
        onClick={onClick}
        className={combinedClassName}
        style={commonStyle}
        target={target}
        rel={relValue}
        {...rest}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      className={combinedClassName}
      style={commonStyle}
      {...rest}
    >
      {content}
    </button>
  );
}
