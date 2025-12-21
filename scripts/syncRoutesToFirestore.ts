import fs from "fs";
import path from "path";
import crypto from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../lib/firebaseAdmin";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

type RouteRecord = {
  routePath: string;
  group: string;
  filePath: string;
  routeId?: string;
};

type GeneratedRoutesPayload = {
  routes: RouteRecord[];
};

function encodeRouteId(routePath: string): string {
  if (!routePath || routePath.length === 0) {
    return "root";
  }
  const base = Buffer.from(routePath, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  if (base.length) return base;
  return crypto.createHash("sha1").update(routePath).digest("hex");
}

async function main() {
  const generatedPath = path.join(process.cwd(), "generated", "routes.generated.json");
  if (!fs.existsSync(generatedPath)) {
    console.error(`[syncRoutes] Missing ${generatedPath}. Run npm run gen:routes first.`);
    process.exit(1);
  }
  const payload = JSON.parse(fs.readFileSync(generatedPath, "utf-8")) as GeneratedRoutesPayload;
  const routes = payload.routes ?? [];
  if (!routes.length) {
    console.warn("[syncRoutes] No routes found in generated file.");
    return;
  }
  const db = getAdminDb();
  let batch = db.batch();
  let writes = 0;
  for (const route of routes) {
    const routeId = route.routeId ?? encodeRouteId(route.routePath);
    const docRef = db.collection("adminRoutes").doc(routeId);
    batch.set(
      docRef,
      {
        routePath: route.routePath,
        group: route.group,
        filePath: route.filePath,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    writes += 1;
    if (writes % 400 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }
  await batch.commit();
  console.log(`[syncRoutes] Upserted ${writes} routes.`);
}

main().catch((error) => {
  console.error("[syncRoutes] failed", error);
  process.exit(1);
});
