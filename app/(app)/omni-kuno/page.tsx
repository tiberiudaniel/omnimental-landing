import { Suspense } from "react";
import OmniKunoPage from "@/components/omniKuno/OmniKunoPage";

export default function OmniKunoRoute() {
  return (
    <Suspense fallback={null}>
      <OmniKunoPage />
    </Suspense>
  );
}
