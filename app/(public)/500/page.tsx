import Link from "next/link";

export default function ErrorPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bgLight px-6 py-12 text-center text-[#2C2C2C]">
      <div className="max-w-lg space-y-6 rounded-md border border-[#D8C6B6] bg-white px-8 py-10 shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
        <p className="text-xs uppercase tracking-[0.35em] text-[#A08F82]">Eroare</p>
        <h1 className="text-3xl font-semibold text-[#1F1F1F]">Ceva nu a mers bine.</h1>
        <p className="text-base leading-relaxed text-[#2C2C2C]/80">
          Am întâmpinat o problemă neașteptată. Te rugăm să încerci din nou sau să revii la pagina principală.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="border border-[#E60012] bg-[#E60012] px-5 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#B8000E]"
          >
            Înapoi acasă
          </Link>
          <Link
            href="mailto:hello@omnimental.ro"
            className="border border-[#D8C6B6] px-5 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#2C2C2C] transition-colors hover:bg-[#F6F2EE]"
          >
            Contactează-ne
          </Link>
        </div>
      </div>
    </main>
  );
}
