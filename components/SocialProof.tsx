"use client";

import Image from "next/image";

const metrics = [
  { label: "Programe finalizate", value: "15+" },
  { label: "Ore coaching/an", value: "150+" },
  { label: "Indice satisfacție", value: "9.6/10" },
];

const testimonials = [
  {
    quote:
      "„Am intrat în program pentru că nu mai reușeam să mențin ritmul echipei. După 6 săptămâni aveam din nou claritate și control emoțional.”",
    author: "Andrei, Product Lead",
  },
  {
    quote:
      "„Tehnicile sunt practice și intră în rutină rapid. Mi-am redus complet reacțiile de panică din prezentări.”",
    author: "Ioana, Consultant",
  },
];

const gallery = [
  {
    src: "https://files.oaiusercontent.com/file-ZdDJTVH0LTxvikCoDXljYkkr?se=2123-09-28T14%3A01%3A53Z&sp=r&sv=2021-12-02&sr=b&rscd=inline&rsct=image/png",
    alt: "Biohacking schematic",
  },
  {
    src: "https://files.oaiusercontent.com/file-Clwp40f8q2ITtQPZTfVQiFiM?se=2123-09-28T14%3A02%3A16Z&sp=r&sv=2021-12-02&sr=b&rscd=inline&rsct=image/png",
    alt: "Vagus nerve illustration",
  },
  {
    src: "https://files.oaiusercontent.com/file-Og9OLpUwkQlFHa0vgq7zhLhf?se=2123-09-28T14%3A02%3A45Z&sp=r&sv=2021-12-02&sr=b&rscd=inline&rsct=image/png",
    alt: "Grup în discuție",
  },
];

export default function SocialProof() {
  return (
    <section className="mt-12 space-y-10">
      <div className="grid gap-6 md:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-[8px] border border-[#D8C6B6] bg-[#F6F2EE] px-6 py-6 text-center shadow-[0_6px_18px_rgba(0,0,0,0.05)]"
          >
            <div className="text-3xl font-semibold text-[#1F1F1F]">{metric.value}</div>
            <div className="mt-2 text-xs uppercase tracking-[0.3em] text-[#A08F82]">
              {metric.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {testimonials.map((item) => (
          <div
            key={item.quote}
            className="rounded-[8px] border border-[#D8C6B6] bg-white px-6 py-6 shadow-[0_6px_18px_rgba(0,0,0,0.05)]"
          >
            <p className="text-sm italic text-[#2C2C2C] leading-relaxed">{item.quote}</p>
            <div className="mt-4 text-xs uppercase tracking-[0.25em] text-[#A08F82]">
              {item.author}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {gallery.map((item) => (
          <div
            key={item.src}
            className="relative aspect-[4/3] overflow-hidden rounded-[8px] border border-[#D8C6B6] bg-[#F6F2EE]"
          >
            <Image
              src={item.src}
              alt={item.alt}
              fill
              sizes="(min-width: 768px) 30vw, 90vw"
              className="object-cover"
              unoptimized
            />
          </div>
        ))}
      </div>
    </section>
  );
}
