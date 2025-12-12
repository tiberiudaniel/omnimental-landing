"use client";

import { useRouter } from "next/navigation";

interface Props {
  title: string;
  durationLabel: string;
  children: React.ReactNode;
}

export function ArenaRunLayout({ title, durationLabel, children }: Props) {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#05060a] text-white">
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-white/70 hover:text-white"
          >
            ← Înapoi
          </button>
          <div className="text-sm text-white/70">{durationLabel}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <div className="text-sm text-white/80">{children}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex justify-between text-sm text-white/70">
          <span>Timer: în curând</span>
          <span>Stats: coming soon</span>
        </div>
      </div>
    </div>
  );
}
