import { Suspense } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import MentalUniversePage from "@/components/mentalUniverse/MentalUniversePage";

export default function MentalUniverseRoute() {
  return (
    <Suspense fallback={null}>
      <RequireAuth redirectTo="/mental-universe">
        <MentalUniversePage />
      </RequireAuth>
    </Suspense>
  );
}
