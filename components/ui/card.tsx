"use client";

import clsx from "clsx";
import React from "react";
import { designTokens } from "@/config/designTokens";

type CardVariant = "default" | "plain";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
};

export function Card({ className, children, variant = "default", style, ...rest }: CardProps) {
  const baseClasses = variant === "default" ? "rounded-card shadow-card" : "";
  return (
    <div
      className={clsx(baseClasses, className)}
      style={{ borderRadius: designTokens.components.card.radius, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}

