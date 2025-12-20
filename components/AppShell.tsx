import clsx from "clsx";
import type { ReactNode } from "react";

type AppShellProps = {
  header?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
  mainClassName?: string;
};

export function AppShell({ header, children, bodyClassName, mainClassName }: AppShellProps) {
  return (
    <div
      className={clsx("min-h-screen text-[var(--omni-ink)]", bodyClassName)}
      style={{ backgroundImage: "var(--omni-gradient-shell)", backgroundRepeat: "no-repeat" }}
    >
      {header ? (
        <header
          className="sticky top-0 z-40 border-b"
          style={{
            backgroundColor: "var(--omni-header-bg)",
            borderColor: "var(--omni-border-soft)",
            color: "var(--omni-ink)",
            boxShadow: "0 8px 22px rgba(60, 40, 20, 0.06)",
          }}
        >
          <div className="relative z-10">{header}</div>
        </header>
      ) : null}
      <main
        className={clsx("min-h-[calc(100vh-4rem)] px-4 pb-10 pt-6 md:px-8", mainClassName)}
      >
        {children}
      </main>
    </div>
  );
}
