import { Suspense } from "react";
import OmniAbilPage from "@/components/omniAbil/OmniAbilPage";

export default function OmniAbilRoute() {
  return (
    <Suspense fallback={null}>
      <OmniAbilPage />
    </Suspense>
  );
}

