import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen"
      data-app-shell
      style={{ backgroundColor: "var(--omni-bg-main)", color: "var(--omni-ink)" }}
    >
      {children}
    </div>
  );
}
