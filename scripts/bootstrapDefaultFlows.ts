import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../lib/firebaseAdmin";

type FlowTemplate = {
  id: string;
  name: string;
  description?: string;
  routes: string[];
};

const templates: FlowTemplate[] = [
  {
    id: "onboarding-template",
    name: "Onboarding canonical",
    description: "Landing → Auth → WOW session → Today",
    routes: ["/", "/auth", "/onboarding", "/today"],
  },
  {
    id: "daily-loop-template",
    name: "Daily loop",
    description: "Today → Run → Completion → Progress",
    routes: ["/today", "/today/run", "/today/completion", "/progress"],
  },
  {
    id: "upgrade-funnel-template",
    name: "Upgrade funnel",
    description: "Limit → Upgrade → Success → Return",
    routes: ["/limits", "/upgrade", "/upgrade/success", "/today"],
  },
];

async function main() {
  const db = getAdminDb();
  const routesSnapshot = await db.collection("adminRoutes").get();
  const routeByPath = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
  routesSnapshot.forEach((docSnap) => {
    const data = docSnap.data() as { routePath?: string };
    if (data?.routePath) {
      routeByPath.set(data.routePath, docSnap);
    }
  });

  for (const template of templates) {
    const nodes: Array<Record<string, unknown>> = [];
    template.routes.forEach((routePath, index) => {
      const docSnap = routeByPath.get(routePath);
      if (!docSnap) {
        console.warn(`[bootstrapDefaultFlows] Route ${routePath} missing for template ${template.name}; skipping step.`);
        return;
      }
      nodes.push({
        id: `node_${index + 1}`,
        routeId: docSnap.id,
        label: { ro: routePath, en: routePath },
        x: 80 + index * 280,
        y: 160,
        tags: [],
      });
    });
    if (!nodes.length) {
      console.warn(`[bootstrapDefaultFlows] Skipping ${template.name} — no nodes resolved.`);
      continue;
    }
    const edges = nodes.slice(0, -1).map((node, idx) => ({
      id: `edge_${idx + 1}`,
      from: node.id as string,
      to: nodes[idx + 1].id as string,
      label: { ro: "", en: "" },
      conditionTag: "",
      eventName: "",
    }));

    const payload = {
      name: template.name,
      description: template.description ?? "",
      nodes,
      edges,
      version: 1,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    };
    await db.collection("adminFlows").doc(template.id).set(payload, { merge: true });
    console.log(`[bootstrapDefaultFlows] Seeded template ${template.name} (${nodes.length} nodes).`);
  }
}

main().catch((error) => {
  console.error("[bootstrapDefaultFlows] failed", error);
  process.exit(1);
});
