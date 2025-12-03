import type { CSSProperties } from "react";
import clsx from "clsx";
import { designTokens } from "@/config/designTokens";

export type OmniCtaVariant = "kuno" | "abil" | "neutral";

const CTA_BASE =
  "inline-flex w-full items-center justify-center rounded-full rounded-cta text-[11px] font-semibold uppercase tracking-[0.28em] transition-all duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus hover:-translate-y-[1.5px] shadow-soft hover:shadow-ctaHover";

const VARIANT_CLASSES: Record<OmniCtaVariant, string> = {
  kuno: "bg-gradient-kuno text-textMain",
  abil: "bg-gradient-abil text-textMain",
  neutral: "bg-gradient-primary-soft text-textMain",
};

const CTA_STYLE = { minHeight: designTokens.components.cta.height } as const;

export function getCtaClassName(variant: OmniCtaVariant, className?: string) {
  return clsx(CTA_BASE, VARIANT_CLASSES[variant], className);
}

export function getCtaStyle(overrides?: CSSProperties): CSSProperties {
  return {
    ...CTA_STYLE,
    ...overrides,
  };
}
