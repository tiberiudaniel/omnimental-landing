# Flow Studio — Step Screen Nodes (v2)

Step Screen nodes let us pin individual StepRunner screens (ex: `intro_mindpacing`) as first-class nodes inside Flow Studio journeys/overlays without inventing fake routes. They act as wrappers over a host route + step key, so linking from Flow Studio opens `/intro?step=intro_mindpacing` and carries any required query presets (source, returnTo, etc.).

## Data model

```
FlowNode {
  id: "screen_<uuid>",        // stable ReactFlow node id
  kind: "stepScreen",
  routePath: "/intro",        // mirrors hostRoutePath for chunk & diagnostics plumbing
  tags: [..., "type:stepScreen"],
  stepScreen: {
    hostRoutePath: "/intro",
    stepKey: "intro_vocab",
    label?: "Vocab",
    queryPreset?: { source: "guided_day1", returnTo: "/today" }
  }
}
```

- IDs are random UUIDs; changing the referenced step never rewires edges.
- `stepScreen.label` overrides the Flow node label (and is kept in sync with the RO label override).
- `queryPreset` is serialized as part of the flow spec; empty presets are omitted.

## Pinning & open behavior

- Any route node with a manifest exposes the **Pin to journey** action for each step in the Steps drawer.
- Pinning creates (or focuses) the corresponding `stepScreen` node and optionally auto-links from the currently selected node.
- Double-clicking a step screen (or using the inline link/copy controls) opens the runtime URL built by `buildStepScreenHref(stepScreen)`.

## Inspector editing

- Label overrides keep the RO label + `stepScreen.label` in sync.
- New “Step screen” section displays host route, current step id, preview link, and the query preset editor.
- Step id selector is populated from the shared step registry; changing the selection updates both `stepKey` and the display label.
- Query presets are edited as key/value rows; empty keys are ignored and clearing every row removes `queryPreset` from the node.

## Diagnostics & repairs

- Step screen nodes are excluded from the “Expand Steps” tooling (`nodeCanExpandSteps=false`) but still inherit general flow diagnostics.
- Additional diagnostics mark nodes with missing host routes, missing step ids, or stale `stepKey` values that no longer exist in the manifest.
- The inspector exposes a dropdown of valid steps so “Fix mapping” is just picking the right option; no edges are recreated.

## Usage guidelines

1. **Host route must stay canonical.** Step screens borrow chunks/tags from the host route node, so keep `hostRoutePath` aligned.
2. **Leverage presets for deterministic replays.** Set `source=guided_day1`, `returnTo=/today`, etc., so designers can jump back into the correct runtime context.
3. **Don’t fake routes for steps anymore.** Use `stepScreen` nodes when you need MindPacing/Vocab granularity in overlays or diagnostics, and reserve route nodes for actual app routes.
4. **Pin once, reuse everywhere.** Because IDs are UUIDs, the same pinned step can participate in multiple overlays/journeys without running through the expand/pin flow again (duplicate pins focus the existing node).
