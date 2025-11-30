"use client";

import { Suspense, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDb, ensureAuth } from "@/lib/firebase";
import { useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";

function UnsubscribeForm() {
  const db = getDb();
  const params = useSearchParams();
  const [email, setEmail] = useState(() => params?.get("email") ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setMessage("Te rugăm să introduci un email valid.");
      return;
    }
    setStatus("saving");
    setMessage(null);
    try {
      await ensureAuth();
      await addDoc(collection(db, "emailUnsubscribes"), {
        email: trimmed.toLowerCase(),
        timestamp: serverTimestamp(),
      });
      setStatus("done");
      setMessage("Te-am dezabonat. Îți mulțumim!");
    } catch (e) {
      console.error("unsubscribe failed", e);
      setStatus("error");
      setMessage("Nu am reușit să procesăm cererea. Încearcă din nou.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--omni-muted)]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 w-full rounded-[10px] border border-[var(--omni-border-soft)] px-4 py-3 text-sm text-[var(--omni-ink)] focus:border-[var(--omni-energy)] focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={status === "saving"}
                className="inline-flex items-center justify-center rounded-[10px] border border-[var(--omni-border-soft)] bg-[var(--omni-ink)] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-white transition hover:border-[var(--omni-energy)] hover:bg-[var(--omni-energy)] disabled:opacity-60"
              >
                {status === "saving" ? "Se procesează..." : "Dezabonează-mă"}
              </button>
              {message ? (
                <span className={`text-xs ${status === "error" ? "text-[var(--omni-danger)]" : "text-[var(--omni-ink)]"}`}>{message}</span>
              ) : null}
            </div>
    </form>
  );
}

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-[var(--omni-bg-main)]">
      <SiteHeader showMenu onMenuToggle={() => {}} />
      <main className="mx-auto max-w-xl px-4 py-10">
        <section className="rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-8 shadow-[0_12px_28px_rgba(0,0,0,0.06)]">
          <h1 className="text-2xl font-semibold text-[var(--omni-ink)]">Dezabonare email</h1>
          <p className="mt-2 text-sm text-[var(--omni-ink-soft)]">
            Introdu adresa ta de email pentru a nu mai primi comunicări.
          </p>
          <Suspense fallback={null}>
            <UnsubscribeForm />
          </Suspense>
        </section>
      </main>
    </div>
  );
}
