import { redirect } from "next/navigation";

type ArenaModuleParams = { arenaId?: string | string[]; moduleId?: string | string[] };

export default function TrainingArenaModuleRedirect({ params }: { params: ArenaModuleParams }) {
  const arenaRaw = Array.isArray(params?.arenaId) ? params?.arenaId[0] : params?.arenaId;
  const moduleRaw = Array.isArray(params?.moduleId) ? params?.moduleId[0] : params?.moduleId;
  if (!arenaRaw || !moduleRaw) {
    redirect("/arenas");
    return;
  }
  redirect(`/arenas/${arenaRaw}/${moduleRaw}`);
}
