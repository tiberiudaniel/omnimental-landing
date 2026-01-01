import { redirect } from "next/navigation";

type ArenaModuleRunParams = { arenaId?: string | string[]; moduleId?: string | string[] };
type ArenaRunSearch = Record<string, string | string[] | undefined>;

export default async function TrainingArenaModuleRunRedirect({
  params,
  searchParams,
}: {
  params: ArenaModuleRunParams;
  searchParams?: ArenaRunSearch;
}) {
  const arenaRaw = Array.isArray(params?.arenaId) ? params.arenaId[0] : params?.arenaId;
  const moduleRaw = Array.isArray(params?.moduleId) ? params.moduleId[0] : params?.moduleId;
  if (!arenaRaw || !moduleRaw) {
    redirect("/arenas");
    return;
  }
  const query = new URLSearchParams();
  const resolvedSearch = searchParams ?? {};
  Object.entries(resolvedSearch).forEach(([key, value]) => {
    if (typeof value === "string") {
      query.set(key, value);
    } else if (Array.isArray(value) && value.length) {
      query.set(key, value[0]);
    }
  });
  const suffix = query.toString();
  const target = suffix ? `/arenas/${arenaRaw}/${moduleRaw}/run?${suffix}` : `/arenas/${arenaRaw}/${moduleRaw}/run`;
  redirect(target);
}
