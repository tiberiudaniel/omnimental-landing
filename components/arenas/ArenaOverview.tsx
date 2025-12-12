"use client";

import Link from "next/link";
import type { ArenaId } from "@/config/arenaModules/v1/types";

const ARENA_CARDS: Array<{
  id: ArenaId;
  title: string;
  oneLiner: string;
  bullets: string[];
  badges: string[];
  accent: string;
}> = [
  {
    id: "executive_control",
    title: "Control Executiv",
    oneLiner: "Controlul atenției când conflictul cognitiv lovește și timpul lucrează împotriva ta.",
    bullets: ["Metacogniție sub presiune", "Focus cu interferență", "Inhibiție automată"],
    badges: ["⏱️ timp limitat", "⚡ interferență cognitivă", "🎯 acuratețe & reacție"],
    accent: "from-cyan-400 to-blue-500",
  },
  {
    id: "adaptive_intelligence",
    title: "Inteligență Adaptivă",
    oneLiner: "Decizie funcțională când regulile se schimbă și trebuie să acționezi cu date incomplete.",
    bullets: ["Ambiguitate controlată", "Reframing rapid", "Decizii reversibile"],
    badges: ["⏱️ timp", "⚡ ambiguitate", "🎯 criterii minime"],
    accent: "from-amber-400 to-violet-500",
  },
  {
    id: "psychological_shielding",
    title: "Protecție Mentală",
    oneLiner: "Răspuns controlat în contexte ostile, când presiunea socială încearcă să-ți deturneze valorile.",
    bullets: ["Valori sub presiune", "Limite în interacțiuni", "Antifragilitate relațională"],
    badges: ["⚡ conflict intern", "🧠 impuls vs criteriu", "🎯 consistență"],
    accent: "from-slate-500 to-emerald-500",
  },
];

export function ArenaOverview() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-white/80">
          Arenele OmniMental sunt nivelul 2 de antrenament: lucrezi sub constrângeri clare,
          cu drilluri scurte și poduri cognitive către fundația Level 1.
        </p>
      </div>
      <div className="grid gap-4 md:gap-6 md:grid-cols-3">
        {ARENA_CARDS.map((arena) => (
          <div
            key={arena.id}
            className="rounded-2xl border border-white/20 bg-white/5 p-4 md:p-6 flex flex-col justify-between relative overflow-hidden"
          >
            <span
              className={`absolute inset-y-3 left-3 w-1 rounded-full bg-gradient-to-b ${arena.accent}`}
            />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/60 pl-4">ARENA</p>
              <h2 className="text-xl md:text-2xl font-semibold text-white pl-4">{arena.title}</h2>
              <p className="text-sm text-white/80 mt-1 pl-4">{arena.oneLiner}</p>
              <div className="mt-3 flex flex-wrap gap-1.5 pl-4">
                {arena.badges.map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/30 bg-white/10 px-2.5 py-1 text-xs text-white/80"
                  >
                    {badge}
                  </span>
                ))}
              </div>
              <ul className="mt-3 space-y-1 text-sm text-white/70 pl-4">
                {arena.bullets.map((bullet) => (
                  <li key={bullet}>• {bullet}</li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <Link
                href={`/training/arenas/${arena.id}`}
                className="inline-flex items-center justify-center rounded-xl bg-white/80 text-black text-sm font-semibold px-4 py-2 hover:bg-white/70 transition"
              >
                Intră în arenă
              </Link>
              <p className="text-[11px] text-white/60 mt-1 pl-1">↳ timp + conflict + metrici</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
