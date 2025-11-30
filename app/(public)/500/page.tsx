import Link from "next/link";

export default function ErrorPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bgLight px-6 py-12 text-center text-[var(--omni-ink)]">
      <div className="max-w-lg space-y-6 rounded-md border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-8 py-10 shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Eroare</p>
        <h1 className="text-3xl font-semibold text-[var(--omni-ink)]">Ceva nu a mers bine.</h1>
        <p className="text-base leading-relaxed text-[var(--omni-ink)]/80">
          Am întâmpinat o problemă neașteptată. Te rugăm să încerci din nou sau să revii la pagina principală.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="border border-[var(--omni-energy)] bg-[var(--omni-energy)] px-5 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[var(--omni-danger)]"
          >
            Înapoi acasă
          </Link>
          <Link
            href="mailto:hello@omnimental.ro"
            className="border border-[var(--omni-border-soft)] px-5 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--omni-ink)] transition-colors hover:bg-[var(--omni-bg-paper)]"
          >
            Contactează-ne
          </Link>
        </div>
      </div>
    </main>
  );
}
