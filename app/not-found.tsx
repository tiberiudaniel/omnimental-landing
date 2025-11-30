import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bgLight px-6 py-12 text-center text-[var(--omni-ink)]">
      <div className="panel-canvas panel-canvas--hero panel-canvas--brain-right max-w-lg rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)]/94 px-8 py-10 shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-[1.5px]">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">404</p>
        <h1 className="mt-4 text-3xl font-semibold text-[var(--omni-ink)]">
          Pagina căutată nu există.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--omni-ink)]/80">
          Verifică adresa introdusă sau revino la prima pagină pentru a continua navigarea în siguranță.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="border border-[var(--omni-energy)] bg-[var(--omni-energy)] px-5 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[var(--omni-danger)]"
          >
            Înapoi acasă
          </Link>
          <Link
            href="/group"
            className="border border-[var(--omni-border-soft)] px-5 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--omni-ink)] transition-colors hover:bg-[var(--omni-bg-paper)]"
          >
            Mental Coaching Group
          </Link>
        </div>
      </div>
    </main>
  );
}
