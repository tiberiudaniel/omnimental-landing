"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { getDb, ensureAuth, areWritesDisabled } from "@/lib/firebase";
import { addDoc, collection } from "firebase/firestore";

export default function SeedRecommendationsPage() {
  const router = useRouter();
  const nav = useNavigationLinks();
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string | null>(null);

  const seed = async () => {
    setBusy(true);
    setLog(null);
    try {
      if (areWritesDisabled()) {
        setLog("Writes disabled (NEXT_PUBLIC_DISABLE_PROGRESS_WRITES). Skipping.");
        setBusy(false);
        return;
      }
      const user = await ensureAuth();
      const uid = user?.uid;
      if (!uid) {
        setLog("No auth user available.");
        setBusy(false);
        return;
      }
      const db = getDb();
      const col = collection(db, "userRecommendations", uid, "items");
      const now = new Date();
      const samples = [
        {
          title: "Începe cu un reset de somn (3 seri)",
          shortLabel: "Somn – 3 zile",
          type: "next-step",
          status: "new",
          priority: 1,
          createdAt: now.toISOString(),
          estimatedMinutes: 10,
          tags: ["somn", "energie"],
          body: "Trei seri la rând: culcare cu 30 min mai devreme, fără ecrane cu 45 min înainte. Notează cum te simți dimineața.",
          ctaLabel: "Deschide ghidul de seară",
          ctaHref: "/antrenament?tab=ose",
          source: "system",
        },
        {
          title: "Mini‑lecție: reglarea emoțională în 5 minute",
          shortLabel: "Mindset – calm",
          type: "mindset",
          status: "active",
          priority: 2,
          createdAt: new Date(now.getTime() - 86400000).toISOString(),
          tags: ["calm", "claritate"],
          body: "Parcurge o idee cheie despre cum reduci tensiunea în 5 minute și aplică exercițiul la o situație reală.",
          ctaLabel: "Deschide lecția",
          ctaHref: "/kuno/learn",
          source: "system",
        },
        {
          title: "Notează 2 idei din evaluare",
          shortLabel: "Jurnal – evaluare",
          type: "next-step",
          status: "new",
          priority: 2,
          createdAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
          body: "Deschide jurnalul și scrie pe scurt două idei care ți-au rămas după evaluarea inițială.",
          ctaLabel: "Deschide jurnalul",
          ctaHref: "/progress?open=journal",
          source: "system",
        },
        {
          title: "Amână notificările 60 de minute dimineața",
          shortLabel: "Obicei – focus",
          type: "quest",
          status: "snoozed",
          priority: 3,
          createdAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
          tags: ["focus"],
          body: "Încearcă o oră fără notificări după trezire. Observă cum îți schimbă claritatea și energia.",
          source: "system",
        },
      ];
      for (const s of samples) {
        await addDoc(col, { userId: uid, ...s });
      }
      setLog("Seeded 4 sample recommendations.");
    } catch (e) {
      setLog(`Error: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9]">
      <SiteHeader showMenu onMenuToggle={() => setMenuOpen(true)} />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={nav} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-[#2C2C2C]">Seed Recommendations</h1>
        <p className="mt-1 text-sm text-[#7B6B60]">Dev utility: create 3–4 sample recommendations for the current user.</p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={seed}
            disabled={busy}
            className="rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] disabled:opacity-60 hover:border-[#E60012] hover:text-[#E60012]"
          >
            {busy ? "Se încarcă…" : "Seed now"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/recommendation")}
            className="rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"
          >
            Open Recommendations
          </button>
        </div>
        {log ? <p className="mt-3 text-sm text-[#4A3A30]">{log}</p> : null}
      </main>
    </div>
  );
}

