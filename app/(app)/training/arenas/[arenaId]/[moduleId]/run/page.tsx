import { notFound } from "next/navigation";
import { ARENA_MODULES_V1 } from "@/config/arenaModules/v1";
import type { ArenaId, ArenaLang } from "@/config/arenaModules/v1/types";
import { StroopRun } from "@/components/arenas/drills/StroopRun";
import { GenericTimedRun } from "@/components/arenas/drills/GenericTimedRun";

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

  return <GenericTimedRun module={arenaModule} lang={lang} duration={duration} />;
}
