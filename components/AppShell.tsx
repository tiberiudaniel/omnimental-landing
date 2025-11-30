import clsx from "clsx";
import type { ReactNode } from "react";

type AppShellProps = {
  header: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
  mainClassName?: string;
};

export function AppShell({ header, children, bodyClassName, mainClassName }: AppShellProps) {
  return (
    <div className={clsx("min-h-screen bg-[var(--omni-bg-main)] text-[var(--omni-ink)]", bodyClassName)}>
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          backgroundColor: "var(--omni-header-bg)",
          borderColor: "var(--omni-border-soft)",
          color: "var(--omni-ink)",
        }}
      >
        {header}
      </header>
      <main
        className={clsx(
          "min-h-[calc(100vh-4rem)] bg-gradient-to-b from-[var(--omni-bg-paper)] via-[var(--omni-bg-alt)] to-[var(--omni-bg-main)]",
          mainClassName,
        )}
      >
        {children}
      </main>
    </div>
  );
}
