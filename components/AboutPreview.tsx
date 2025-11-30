"use client";

import Image from "next/image";
import Link from "next/link";

export default function AboutPreview() {
  return (
    <section className="mt-12 grid gap-8 border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-8 py-10 shadow-[0_8px_24px_rgba(0,0,0,0.05)] md:grid-cols-[3fr_2fr]">
      <div>
        <div className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Despre mine</div>
        <h2 className="mt-3 text-2xl font-semibold text-[var(--omni-ink)]">
          Antrenez mintea din medii cu miză mare.
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-[var(--omni-ink)]">
          Sunt constructorul OmniMental. Din experiența în echipe cu ritm alert am învățat că
          performanța nu ține doar de strategie, ci de felul în care îți calibrezi sistemul nervos.
          Folosesc neuroștiință aplicată, coaching somatic și instrumente de biofeedback pentru a crea
          transformări care rezistă sub presiune.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-[var(--omni-ink)]">
          Lucrez cu profesioniști, fondatori și echipe care vor să-și păstreze luciditatea în situații
          limită. Împreună construim automatisme de calm, claritate și impact.
        </p>
        <Link
          href="/about"
          className="mt-6 inline-flex items-center gap-2 rounded-[6px] border border-[var(--omni-border-soft)] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)] transition hover:bg-[color-mix(in_oklab,var(--omni-energy)_15%,transparent)] focus:outline-none focus:ring-1 focus:ring-[var(--omni-energy)]"
        >
          Citește povestea
        </Link>
      </div>
      <div className="relative aspect-[4/5] w-full overflow-hidden border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)]">
        <Image
          src="https://static.wixstatic.com/media/139de8_ab63b1409ab845eba55ed224056ded17~mv2.jpg/v1/fill/w_1200,h_1200,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Vegus-Nerve-dreamstime_xxl_215358845.jpg"
          alt="Vizualizare vagus nerve"
          fill
          sizes="(min-width: 768px) 40vw, 80vw"
          className="object-cover"
        />
      </div>
    </section>
  );
}
