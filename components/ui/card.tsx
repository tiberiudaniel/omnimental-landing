"use client";

import React from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, children, ...rest }: CardProps) {
  return (
    <div className={className} {...rest}>
      {children}
    </div>
  );
}

