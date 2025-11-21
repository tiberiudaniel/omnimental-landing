"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../AuthProvider";

type RequireAuthProps = {
  children: ReactNode;
  redirectTo?: string;
  loadingLabel?: { ro: string; en: string };
};

export default function RequireAuth({ children, redirectTo, loadingLabel }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const effectiveUser = user && !user.isAnonymous ? user : null;

  const target = useMemo(() => {
    if (redirectTo) return redirectTo;
    const qs = search?.toString();
    if (qs && pathname) {
      return `${pathname}?${qs}`;
    }
    return pathname || "/progress";
  }, [redirectTo, pathname, search]);

  useEffect(() => {
    if (!loading && !effectiveUser) {
      const encoded = encodeURIComponent(target || "/progress");
      router.replace(`/auth?returnTo=${encoded}`);
    }
  }, [effectiveUser, loading, router, target]);

  if (loading || !effectiveUser) {
    const ro = loadingLabel?.ro ?? "Verificăm autentificarea...";
    const en = loadingLabel?.en ?? "Checking authentication...";
    const message =
      typeof navigator !== "undefined" && navigator.language?.startsWith("ro") ? ro : en;
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center px-4 text-sm text-[#4A3A30]">
        {message}
      </div>
    );
  }

  return <>{children}</>;
}
