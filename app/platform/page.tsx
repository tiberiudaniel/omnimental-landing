import { redirect } from "next/navigation";

export default function PlatformPage() {
  // Temporary mapping: send trial plan to training area until checkout is wired
  redirect("/antrenament?from=platform&plan=trial");
}

