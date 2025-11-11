import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bgLight px-6 py-12 text-center text-[#2C2C2C]">
      <div className="panel-canvas panel-canvas--hero panel-canvas--brain-right max-w-lg rounded-[12px] border border-[#D8C6B6] bg-white/94 px-8 py-10 shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-[1.5px]">
        <p className="text-xs uppercase tracking-[0.35em] text-[#A08F82]">404</p>
        <h1 className="mt-4 text-3xl font-semibold text-[#1F1F1F]">
          Pagina căutată nu există.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[#2C2C2C]/80">
          Verifică adresa introdusă sau revino la prima pagină pentru a continua navigarea în siguranță.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="border border-[#E60012] bg-[#E60012] px-5 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#B8000E]"
          >
            Înapoi acasă
          </Link>
          <Link
            href="/group"
            className="border border-[#D8C6B6] px-5 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#2C2C2C] transition-colors hover:bg-[#F6F2EE]"
          >
            Mental Coaching Group
          </Link>
        </div>
      </div>
    </main>
  );
}
