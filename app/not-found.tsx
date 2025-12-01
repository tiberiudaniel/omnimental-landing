import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--omni-bg-main)] px-6 py-12 text-center text-[var(--omni-ink)]">
      <div className="panel-canvas panel-canvas--hero panel-canvas--brain-right omni-card-strong max-w-lg px-8 py-10 backdrop-blur-[1.5px]">
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
            className="omni-btn-primary text-sm font-semibold uppercase tracking-[0.2em]"
          >
            Înapoi acasă
          </Link>
          <Link
            href="/group"
            className="omni-btn-secondary text-sm font-semibold uppercase tracking-[0.2em]"
          >
            Mental Coaching Group
          </Link>
        </div>
      </div>
    </main>
  );
}
