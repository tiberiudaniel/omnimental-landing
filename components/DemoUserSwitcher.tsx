"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function DemoUserSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const enabled = process.env.NEXT_PUBLIC_ENABLE_DEMOS === "1";
  if (!enabled) return null;
  const current = params?.get("demo") ?? "";
  const setDemo = (v: string) => {
    const url = new URL(window.location.origin + (pathname || "/"));
    params?.forEach((val, key) => url.searchParams.set(key, val));
    if (v) url.searchParams.set("demo", v);
    else url.searchParams.delete("demo");
    router.replace(url.pathname + url.search);
  };
  return (
    <div className="fixed bottom-3 right-3 z-50 rounded-[10px] border border-[#D8C6B6] bg-white/95 px-3 py-2 text-[11px] text-[#4A3A30] shadow">
      <span className="mr-2 opacity-70">Demo:</span>
      {["", "1", "2", "3"].map((v) => (
        <button
          key={v || "none"}
          className={`mr-1 rounded px-2 py-0.5 ${current === v ? "bg-[#2C2C2C] text-white" : "border border-[#D8C6B6]"}`}
          onClick={() => setDemo(v)}
          title={v ? `Demo ${v}` : "Off"}
        >
          {v ? `demo${v}` : "off"}
        </button>
      ))}
    </div>
  );
}
