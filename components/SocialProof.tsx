"use client";

import Image from "next/image";

const metrics = [
  { label: "Ani de experiență", value: "27+" },
  { label: "Programe finalizate", value: "78+" },
  { label: "Ore coaching/an", value: "340+" },
  { label: "Indice satisfacție", value: "9.6/10" },
];

export default function SocialProof() {
  return (
    <section className="mt-12 space-y-10">
      <div className="grid gap-5 md:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-[10px] border border-[#D8C6B6] bg-white/94 px-6 py-6 text-center shadow-[0_6px_18px_rgba(0,0,0,0.05)] backdrop-blur-[1px]"
          >
            <div className="text-3xl font-semibold text-[#1F1F1F]">{metric.value}</div>
            <div className="mt-2 text-xs uppercase tracking-[0.3em] text-[#A08F82]">
              {metric.label}
            </div>
          </div>
        ))}
      </div>

      <div className="panel-canvas panel-canvas--brain-center mx-auto max-w-xl rounded-[12px] border border-[#D8C6B6] bg-white/92 p-6 text-center shadow-[0_12px_32px_rgba(0,0,0,0.06)] backdrop-blur-[1px]">
        <div className="relative mx-auto h-60 w-full overflow-hidden rounded-[12px] border border-[#E4D8CE]/80">
          <Image
            src="/assets/tech-mind-brain-left.jpg"
            alt="Hartă mentală OmniMental"
            fill
            sizes="(min-width: 768px) 400px, 80vw"
            className="object-cover filter brightness-[1.08] saturate-[0.75]"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#FDFCF9]/85 to-[#F4E8DA]/80" />
        </div>
        <p className="mt-4 text-sm leading-relaxed text-[#2C2C2C]/80">
          Hartă mentală OmniMental – un reminder vizual că intervențiile merg dinspre claritate spre
          ritm, prin sisteme conectate.
        </p>
      </div>
    </section>
  );
}
