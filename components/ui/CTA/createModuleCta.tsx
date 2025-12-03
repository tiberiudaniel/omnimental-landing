import clsx from "clsx";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, CSSProperties } from "react";
import { designTokens, type ModuleTokenId } from "@/config/designTokens";

const BASE_CLASSES =
  "inline-flex w-full items-center justify-center rounded-full rounded-cta px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] transition-all duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus hover:-translate-y-[2px] shadow-soft hover:shadow-ctaHover";

const CTA_STYLE = { minHeight: designTokens.components.cta.height } as const;

type CommonProps = {
  className?: string;
  style?: CSSProperties;
  as?: "button" | "a";
};

export type ModuleCtaProps = CommonProps &
  (ButtonHTMLAttributes<HTMLButtonElement> | AnchorHTMLAttributes<HTMLAnchorElement>);

export function createModuleCta(moduleId: ModuleTokenId) {
  const moduleTone = designTokens.module[moduleId];
  const gradient = moduleTone.gradient;
  const textColor = moduleTone.textMain ?? designTokens.ui.text.primary;

  function ModuleCta({ as = "button", className, style, ...props }: ModuleCtaProps) {
    if (as === "a") {
      const anchorProps = props as AnchorHTMLAttributes<HTMLAnchorElement>;
      return (
        <a
          {...anchorProps}
          className={clsx(BASE_CLASSES, className)}
          style={{ ...CTA_STYLE, backgroundImage: gradient, color: textColor, ...style }}
        />
      );
    }
    const { type, ...rest } = props as ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <button
        type={type ?? "button"}
        {...rest}
        className={clsx(BASE_CLASSES, className)}
        style={{ ...CTA_STYLE, backgroundImage: gradient, color: textColor, ...style }}
      />
    );
  }

  ModuleCta.displayName = `${moduleId}-cta`;
  return ModuleCta;
}
