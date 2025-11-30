import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function PrimaryButton({ className, ...rest }: PrimaryButtonProps) {
  return (
    <button
      {...rest}
      className={clsx(
        "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold tracking-[0.08em]",
        "bg-[var(--omni-energy)] text-[var(--omni-bg-paper)] shadow-[0_12px_30px_rgba(132,42,59,0.25)]",
        "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--omni-energy-tint)] focus:ring-offset-2 focus:ring-offset-[var(--omni-bg-paper)]",
        "hover:-translate-y-0.5 hover:bg-[var(--omni-energy-soft)] hover:shadow-[0_16px_36px_rgba(132,42,59,0.35)] active:translate-y-0",
        className,
      )}
    />
  );
}

export function SecondaryButton({ className, ...rest }: PrimaryButtonProps) {
  return (
    <button
      {...rest}
      className={clsx(
        "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold tracking-[0.04em]",
        "bg-[var(--omni-bg-paper)] text-[var(--omni-ink)] border border-[var(--omni-border-soft)] shadow-[0_10px_20px_rgba(95,67,35,0.1)]",
        "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--omni-energy-tint)] focus:ring-offset-2 focus:ring-offset-[var(--omni-bg-paper)]",
        "hover:-translate-y-0.5 hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)]",
        className,
      )}
    />
  );
}
