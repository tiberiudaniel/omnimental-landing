import { notFound } from "next/navigation";
import { ArenaModuleList } from "@/components/arenas/ArenaModuleList";
import type { ArenaId } from "@/config/arenaModules/v1/types";

const ARENA_LABELS: Record<ArenaId, { title: string; description: string }> = {
  executive_control: {
    title: "Arena Controlului Executiv",
    description: "Metacogniție și focus sub constrângeri dure.",
  },
  adaptive_intelligence: {
    title: "Arena Inteligenței Adaptive",
    description: "Decizii rapide în ambiguitate, pași reversibili.",
  },
  psychological_shielding: {
    title: "Arena Protecției Mentale",
    description: "Busolă internă și răspunsuri aliniate în contexte ostile.",
  },
};

interface Props {
  params:
    | { arenaId?: string | string[] }
    | Promise<{ arenaId?: string | string[] }>;
}

export default async function ArenaPage(props: Props) {
  const params = await Promise.resolve(props.params);
  const rawParam = params && "arenaId" in params ? params.arenaId : undefined;
  const resolvedParam = Array.isArray(rawParam) ? rawParam[0] : rawParam;
  const arenaId = resolvedParam as ArenaId;
  const meta = resolvedParam ? ARENA_LABELS[arenaId] : undefined;
  if (!meta) {
    notFound();
  }
  return (
    <main className="min-h-screen bg-[#05060a] text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/60">Arena</p>
          <h1 className="text-3xl font-semibold">{meta.title}</h1>
          <p className="text-sm text-white/70 mt-2">{meta.description}</p>
        </div>
        <ArenaModuleList arenaId={arenaId} />
      </div>
    </main>
  );
}
