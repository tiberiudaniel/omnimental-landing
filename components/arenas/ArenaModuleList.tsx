"use client";

import Link from "next/link";
import { ARENA_MODULES_V1 } from "@/config/arenaModules/v1";
import type { ArenaId, L1Bridge } from "@/config/arenaModules/v1/types";

const BRIDGE_LABELS: Record<L1Bridge, string> = {
  clarity: "Clarity",
  energy: "Energy",
  emotional_flex: "Emotional Flex",
};

interface Props {
  arenaId: ArenaId;
}

export function ArenaModuleList({ arenaId }: Props) {
  const modules = ARENA_MODULES_V1.filter((module) => module.arena === arenaId);
  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {modules.map((module) => (
        <div
          key={module.id}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6 flex flex-col gap-3"
        >
          <div>
            <p className="text-xs uppercase tracking-wide text-white/60">Module</p>
            <h3 className="text-xl font-semibold text-white">{module.title.ro}</h3>
            <p className="text-sm text-white/70">{module.title.en}</p>
          </div>
          {module.tags?.length ? (
            <div className="flex flex-wrap gap-2">
              {module.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/10 text-xs tracking-wide uppercase text-white/70 px-3 py-1"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {module.bridges.map((bridge) => (
              <span
                key={`${module.id}-${bridge.toL1}`}
                className="rounded-full border border-white/20 text-xs text-white/80 px-3 py-1"
              >
                {BRIDGE_LABELS[bridge.toL1]}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/70 max-w-md">
              {module.explain.ro.slice(0, 160)}...
            </p>
            <Link
              href={`/arenas/${module.arena}/${module.id}`}
              className="rounded-full bg-white/90 text-black text-sm font-semibold px-4 py-2 hover:bg-white"
            >
              Deschide
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
