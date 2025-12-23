# Flow Studio – Steps Expansion Audit

## Entry points wired to `openStepsForNode`
- `handleRequestExpandSteps` → `/app/(app)/admin/flow-studio/page.tsx:414` calls `openStepsForNode(nodeId)`.
- `handleNodeDoubleClick` → `/app/(app)/admin/flow-studio/page.tsx:432` toggles step nodes and delegates to `handleRequestExpandSteps` (and for step nodes, directly to `openStepsForNode`).
- `FlowCanvas` node card button → `/components/admin/flowStudio/FlowCanvas.tsx:106` invokes `onRequestNodeSteps`, which the page wires to `handleRequestExpandSteps` at `/app/(app)/admin/flow-studio/page.tsx:1591`.
- Diagnostics issues → `/app/(app)/admin/flow-studio/page.tsx:1310` now immediately call `openStepsForNode` for node/step targets.

There are no remaining alternate handlers for expanding Steps; all consumers route through the helper.

## Runtime verification status
Attempting to run the Flow Studio dev server (via `npm`, `node`, or `cmd.exe`) fails in this environment because Node.js is unavailable under WSL1 (error: `WSL … UtilBindVsockAnyPort: socket failed 1`). Consequently, I could not execute the UI locally to capture live logs. Instead, a new opt-in debug flag (`NEXT_PUBLIC_FLOW_STUDIO_DEBUG_STEPS`) now guards every Flow Studio–specific `console.log`/`console.warn`. When the flag is `false` (default) the console stays silent; when it is `true` you can flip it on locally to capture the detailed traces.

## Observations from code inspection
1. Diagnostics links explicitly called `reactFlowInstance.fitView` after opening a node, while the other entry points relied solely on a deferred `pendingFitNodeRef` effect. That effect only runs when `expandedStepRenderData` changes, so if a node is already in the expanded map (common for internal nodes that had been auto-expanded earlier) the view never adjusts even though the subgraph exists. This matches the observed behavior: Diagnostics appears to be the only reliable path because it performs an immediate fit.
2. Expanding a node without moving the viewport makes the step subgraph render off to the side (by design it is offset), which looks like “nothing happened” unless the user pans manually. Nodes with both inbound and outbound edges tend to be located deeper in the canvas, so their step subgraphs are more likely to render outside the current viewport, reinforcing the perceived correlation with edges.
3. All data required to build the step manifest still flows (route paths remain valid); there is no additional gating based on edges or diagnostics once the manifest lookup succeeds.
4. The console flood stemmed from two sources: (a) per-node snapshot logging loops inside Flow Studio (now gated by the `DEBUG_STEPS` flag) and (b) React Flow warning repeatedly because `nodeTypes`/`edgeTypes` objects were recreated on every render. The node/edge types are now defined once at module scope (`components/admin/flowStudio/FlowCanvas.tsx`) and the node components consume dynamic data via a context provider, so the warning spam is gone.

## Root cause
Non-diagnostic entry points expanded the node but left the viewport unchanged whenever the expansion state was already `true`. Since the step subgraph renders adjacent to the host node, it often landed outside the current view, giving the impression that “Steps does not open”. The Diagnostics path added a manual `fitView` on every click, which is why it was the only interaction perceived as working consistently. In short: **viewport adjustments were inconsistent across entry points**, not the manifest lookup itself.

- Consolidated all Flow Studio logging behind `DEBUG_STEPS` (see the constant in each Flow Studio file). With the flag off, the console is quiet; with the flag on, you can still capture granular traces as needed.
- Added the optional debug pane inside the Inspector (gated by `DEBUG_STEPS`) so the most relevant values are visible directly in the UI without relying on console spam.
- Added detailed logging (flagged) inside `openStepsForNode`, `ensureNodeStepsExpanded`, `collapseNodeSteps`, and `FlowCanvas` to capture state before/after each interaction when debugging is enabled.
- Introduced `fitStepsView` (`/app/(app)/admin/flow-studio/page.tsx:360`) which explicitly fits the ReactFlow viewport around the host node and its step subgraph (after a `requestAnimationFrame` to let ReactFlow render the nodes). `openStepsForNode` now calls this helper for every entry point, so the user sees the expanded subgraph without relying on Diagnostics-specific logic.
- Diagnostics no longer performs its own viewport adjustment because `openStepsForNode` handles it uniformly.
- Made `nodeTypes`/`edgeTypes` stable by defining them once at module scope inside `components/admin/flowStudio/FlowCanvas.tsx` and feeding dynamic data through a React context provider, eliminating the React Flow warning flood.

## Next steps
1. Run Flow Studio locally and exercise `/today/run` under the three edge configurations. Capture the new logs to ensure `openStepsForNode` fires and `expandedStepsMap` flips as expected.
2. If any scenario still fails, the logs will now include the ReactFlow node snapshot counts for further triage.
