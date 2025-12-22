"use client";

import type { StepManifest } from "./types";

const upgradeManifest: StepManifest = {
  routePath: "/upgrade",
  startNodeId: "entry",
  terminalNodeIds: ["return_to_app"],
  nodes: [
    { id: "entry", label: "Upgrade Entry" },
    { id: "benefits", label: "Value Recap" },
    { id: "plan_compare", label: "Plan Comparison" },
    { id: "checkout", label: "Checkout" },
    { id: "confirmation", label: "Confirmation" },
    { id: "return_to_app", label: "Return to App" },
  ],
  edges: [
    { id: "entry-benefits", source: "entry", target: "benefits", variant: "start" },
    { id: "benefits-compare", source: "benefits", target: "plan_compare", variant: "next" },
    { id: "compare-checkout", source: "plan_compare", target: "checkout", variant: "next" },
    { id: "checkout-confirmation", source: "checkout", target: "confirmation", variant: "next" },
    { id: "confirmation-return", source: "confirmation", target: "return_to_app", variant: "finish" },
    { id: "benefits-checkout", source: "benefits", target: "checkout", variant: "skip" },
    { id: "plan-return", source: "plan_compare", target: "return_to_app", variant: "skip" },
  ],
};

export function getUpgradeManifest(): StepManifest {
  return upgradeManifest;
}
