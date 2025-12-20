"use client";

import { OmniCtaButton } from "@/components/ui/OmniCtaButton";

type IntroCTAVariant = "primary" | "secondary";

interface IntroCTAProps {
  label: string;
  subLabel?: string;
  href: string;
  variant?: IntroCTAVariant;
  onClick?: () => void;
  id?: string;
  selected?: boolean;
  autoFocus?: boolean;
}

const CTA_VARIANT_MAP: Record<IntroCTAVariant, "primary" | "neutral" | "secondary"> = {
  primary: "primary",
  secondary: "secondary",
};

export function IntroCTA({
  label,
  subLabel,
  href,
  variant = "primary",
  onClick,
  id,
  selected = false,
  autoFocus,
}: IntroCTAProps) {
  const selectedClasses = selected ? "ring-2 ring-[var(--omni-ink)]" : "";
  return (
    <div className="space-y-2 text-center">
      <OmniCtaButton
        as="link"
        href={href}
        variant={CTA_VARIANT_MAP[variant]}
        className={`w-full justify-center ${selectedClasses}`}
        onClick={onClick}
        id={id}
        autoFocus={autoFocus}
      >
        {label}
      </OmniCtaButton>
      {subLabel ? (
        <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--omni-muted)]">{subLabel}</p>
      ) : null}
    </div>
  );
}
