"use client";

import { ReactNode } from "react";
import Image, { type StaticImageData } from "next/image";
import GuideCard from "./GuideCard";

type Orientation = "imageLeft" | "imageRight";

type IllustratedStepProps = {
  image: StaticImageData;
  imageAlt: string;
  label?: string;
  title?: string;
  body?: ReactNode;
  orientation?: Orientation;
  children?: ReactNode;
  imageWrapperClassName?: string;
  imagePriority?: boolean;
  imageClassName?: string;
  imageTintClassName?: string;
};

export default function IllustratedStep({
  image,
  imageAlt,
  label,
  title,
  body,
  orientation = "imageLeft",
  children,
  imageWrapperClassName,
  imagePriority = false,
  imageClassName,
  imageTintClassName,
}: IllustratedStepProps) {
  const imageFirst = orientation === "imageLeft";

  const wrapperClass =
    imageWrapperClassName ??
    "relative mx-auto aspect-[3/4] w-full max-w-[360px] overflow-hidden rounded-[30px] border border-[var(--omni-border-soft)] shadow-[0_20px_45px_rgba(0,0,0,0.12)]";

  const ImageBlock = (
    <div className={wrapperClass}>
      <Image
        src={image}
        alt={imageAlt}
        fill
        className={["object-cover", imageClassName].filter(Boolean).join(" ")}
        sizes="(max-width: 768px) 100vw, 40vw"
        priority={imagePriority}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.45),_rgba(0,0,0,0.05))]" aria-hidden="true" />
      {imageTintClassName ? (
        <div className={`pointer-events-none absolute inset-0 ${imageTintClassName}`} aria-hidden="true" />
      ) : null}
    </div>
  );

  return (
    <section className="px-0 py-0">
      <GuideCard className="rounded-[28px] border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-4 py-4 md:px-7 md:py-7">
        <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1.2fr)]">
          {imageFirst ? ImageBlock : null}
          <div className="space-y-4 text-[#3D1C10]">
            {label ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">
                {label}
              </p>
            ) : null}
            {title ? (
              <h2 className="text-xl font-bold leading-snug text-[var(--omni-ink)] md:text-2xl">
                {title}
              </h2>
            ) : null}
            {body ? (
              <div className="text-sm leading-relaxed text-[var(--omni-ink-soft)] md:text-base">{body}</div>
            ) : null}
            {children ? <div className="space-y-4">{children}</div> : null}
          </div>
          {!imageFirst ? ImageBlock : null}
        </div>
      </GuideCard>
    </section>
  );
}
