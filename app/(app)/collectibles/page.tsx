import { Suspense } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import CollectiblesPage from "@/components/collectibles/CollectiblesPage";

export default function CollectiblesRoute() {
  return (
    <Suspense fallback={null}>
      <RequireAuth redirectTo="/collectibles">
        <CollectiblesPage />
      </RequireAuth>
    </Suspense>
  );
}
