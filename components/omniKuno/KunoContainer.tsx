"use client";

import type { PropsWithChildren } from "react";

type KunoContainerProps = PropsWithChildren<{
  className?: string;
  align?: "center" | "left" | "right";
}>;

export function KunoContainer({ children, className, align = "center" }: KunoContainerProps) {
  const alignmentClass =
    align === "left" ? "ml-0 mr-auto" : align === "right" ? "ml-auto mr-0" : "mx-auto";
  return (
    <div className={`${alignmentClass} w-full max-w-3xl px-4 sm:px-6 lg:px-4 ${className ?? ""}`}>
      {children}
    </div>
  );
}
