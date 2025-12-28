import { redirect } from "next/navigation";

type ArenaParams = { arenaId?: string | string[] };

export default function TrainingArenaRedirect({ params }: { params: ArenaParams }) {
  const raw = params?.arenaId;
  const value = Array.isArray(raw) ? raw[0] : raw;
  redirect(value ? `/arenas/${value}` : "/arenas");
}
