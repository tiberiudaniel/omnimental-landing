import { notFound } from "next/navigation";
import { ArenaModuleDetail } from "@/components/arenas/ArenaModuleDetail";
import type { ArenaId, ArenaLang } from "@/config/arenaModules/v1/types";

interface Props {
  params:
    | { arenaId: ArenaId; moduleId: string }
    | Promise<{ arenaId: ArenaId; moduleId: string }>;
  searchParams?: { lang?: ArenaLang } | Promise<{ lang?: ArenaLang }>;
}

export default async function ArenaModulePage(props: Props) {
  const params = await Promise.resolve(props.params);
  const searchParams = await Promise.resolve(props.searchParams ?? {});
  const lang: ArenaLang = searchParams.lang === "en" ? "en" : "ro";
  if (!params.arenaId || !params.moduleId) {
    notFound();
  }
  return (
    <main className="min-h-screen bg-[#05060a] text-white p-6">
      <ArenaModuleDetail arenaId={params.arenaId} moduleId={params.moduleId} lang={lang} />
    </main>
  );
}
