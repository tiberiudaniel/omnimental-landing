"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useThemeMode } from "./ThemeProvider";

const STORAGE_KEY = "omnimental_theme_preference";
const DEFAULT_ADMIN_EMAIL = "dan@omnimental.ro";

export function AdminThemeToggle() {
  const { user } = useAuth();
  const { theme, setTheme, toggleTheme } = useThemeMode();
  const adminEmail =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_THEME_ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL
      : DEFAULT_ADMIN_EMAIL;
  const normalizedAdmin = adminEmail?.toLowerCase().trim();
  const isAdmin = Boolean(user?.email && user.email.toLowerCase().trim() === normalizedAdmin);
  const hasSynced = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isAdmin) {
      if (theme !== "light") {
        setTheme("light");
      }
      try {
        window.localStorage.setItem(STORAGE_KEY, "light");
      } catch {}
      hasSynced.current = false;
      return;
    }
    if (hasSynced.current) return;
    hasSynced.current = true;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "dark") {
        setTheme("dark");
      }
    } catch {}
  }, [isAdmin, setTheme, theme]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999]" style={{ pointerEvents: "auto" }}>
      <button
        type="button"
        onClick={toggleTheme}
        className="rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] shadow"
        style={{
          backgroundColor: "var(--bg-card)",
          color: "var(--text-main)",
          borderColor: "var(--border-subtle)",
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
        }}
      >
        Night Coffee: {theme === "dark" ? "ON" : "OFF"}
      </button>
    </div>
  );
}
