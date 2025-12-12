import { notFound } from "next/navigation";
import { ARENA_MODULES_V1 } from "@/config/arenaModules/v1";
import type { ArenaId, ArenaLang } from "@/config/arenaModules/v1/types";
import { ArenaRunLayout } from "@/components/arenas/ArenaRunLayout";
import { StroopRun } from "@/components/arenas/drills/StroopRun";

interface Props {
  params: { arenaId: ArenaId; moduleId: string } | Promise<{ arenaId: ArenaId; moduleId: string }>;
  searchParams?:
    | { duration?: "30s" | "90s" | "3m"; lang?: ArenaLang }
    | Promise<{ duration?: "30s" | "90s" | "3m"; lang?: ArenaLang }>;
}

export default async function ArenaRunPage(props: Props) {
  const params = await Promise.resolve(props.params);
  const searchParams = await Promise.resolve(props.searchParams ?? {});
  const arenaId = params.arenaId;
  const moduleId = params.moduleId;
  const arenaModule = ARENA_MODULES_V1.find(
    (mod) => mod.arena === arenaId && mod.id === moduleId,
  );
  if (!arenaModule) {
    notFound();
  }
  const lang: ArenaLang = searchParams.lang === "en" ? "en" : "ro";
  const duration = (searchParams.duration ?? "30s") as "30s" | "90s" | "3m";

  if (
    arenaModule.arena === "executive_control" &&
    arenaModule.id === "executive_metacognition_v1"
  ) {
    return (
      <StroopRun
        key={`${arenaModule.id}-${duration}`}
        module={arenaModule}
        lang={lang}
        duration={duration}
      />
    );
  }

  const drills = arenaModule.drills[lang] ?? [];
  const selectedDrill = drills.find((drill) => drill.duration === duration) ?? drills[0];

  return (
    <ArenaRunLayout
      title={`${arenaModule.title[lang]} — ${selectedDrill?.duration ?? duration}`}
      durationLabel={selectedDrill?.duration ?? duration}
    >
      {selectedDrill ? (
        <div className="space-y-3">
          <p className="text-sm text-white/80">Constraint: {selectedDrill.constraint}</p>
          <ol className="list-decimal list-inside space-y-1 text-sm text-white/70">
            {selectedDrill.steps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
          <p className="text-xs text-white/60">Metric: {selectedDrill.successMetric}</p>
        </div>
      ) : (
        <p className="text-sm text-white/70">Drill not found.</p>
      )}
    </ArenaRunLayout>
  );
}
