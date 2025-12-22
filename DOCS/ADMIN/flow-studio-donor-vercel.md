# Flow Studio Donor Study — Vercel Workflow Builder Template

_Date: 2025-12-21_

Scope: capture reusable UX patterns from Vercel's workflow-builder template (https://github.com/vercel-labs/workflow-builder-template) and map them to our Flow Studio structure (RoutesPanel → FlowCanvas → InspectorPanel). This is a conceptual extraction; we reuse ideas, not code.

## Files / features inspected in donor template

| Area | Donor file(s) | Notes |
| --- | --- | --- |
| Toolbar + project shell | `app/page.tsx`, `components/editor/Header.tsx`, `components/editor/CanvasToolbar.tsx` | Sticky header with Save/Undo/Redo/Deploy, branch picker, status pill. Toolbar exposes global keyboard hints. |
| Keyboard shortcuts & command palette | `hooks/useHotkeys.ts`, `components/CommandMenu.tsx` | `Cmd+K` palette, `Cmd+S` save, `Delete` remove, `Space` drag pan. Uses tiny hotkeys hook and respects focused inputs. |
| Node palette + quick-add | `components/sidebar/NodeLibrary.tsx` | Searchable palette; pressing Enter or clicking “+” drops the node at viewport center. Drag preview optional. |
| Inspector UX | `components/inspector/InspectorPanel.tsx`, `hooks/useFormDraft.ts` | Inspector keeps draft state per node, has Apply/Reset buttons, preserves focus and validation. |
| Canvas utilities | `components/editor/Canvas.tsx` | Zoom-to-fit, center selection, minimap, box select, selection rectangle, multi-select. |
| Grouping/subflow | `components/editor/SubflowCard.tsx` | Collapsible grouped nodes (subflow) render miniature graphs inside parent card. |
| Import/Export spec | `lib/export.ts`, `lib/import.ts` | Spec includes metadata, diagnostics, versioning, change summary. |

## Patterns to port + mapping to our components

| Donor pattern | Description | Target implementation |
| --- | --- | --- |
| Toolbar global actions | Sticky header with Save/Undo/Redo/Export/Import + status | Extend Flow Studio header card with grouped buttons + hotkey hints. Map to `handleSaveFlow`, `handleDuplicateFlow`, upcoming import/export. |
| Keyboard shortcuts | `useHotkeys` intercepts combos globally | Create `useBuilderHotkeys` inside FlowCanvas; handle Delete, Cmd/Ctrl+S, Cmd/Ctrl+D, Cmd/Ctrl+F, Space+drag, multi-select. |
| Quick add palette | Search + `Enter` to add node at viewport center | Extend RoutesPanel to support Enter + inline “Quick add” button using ReactFlow `project` current center. |
| Inspector draft/apply | Donor inspector uses explicit Apply/Reset | Build similar draft for copy overrides + edge edits. Keep apply/cancel buttons. |
| Canvas utilities | Zoom fit, center, selection rectangle, multi-select, minimap toggles | Enable ReactFlow selection rectangle + add Zoom/Centre buttons in FlowCanvas header. |
| Subflow steps | Collapsible subgraph for internal steps | Hook to Step Manifest (Phase 3) to render step graph for `/today/run`. |
| Spec import/export | Normalized spec + diagnostics summary | Extend export format + add import modal w/ validation + reuse diagnostics panel. |

## Implementation checklist

**Phase 2 – Builder UX**
- [ ] Keyboard shortcuts (Delete, Cmd/Ctrl+S, Cmd/Ctrl+D, Cmd/Ctrl+F, Space pan, multi-select)
- [ ] Box select + minimap/zoom buttons
- [ ] Quick add (`+` button + Enter key)
- [ ] Spec import dialog & export contract (metadata, diagnostics)
- [ ] Issues panel summary counts + “center on issue”

**Phase 3 – Step Flow MVP**
- [ ] Step manifest types + registry
- [ ] `/today/run` manifest generator
- [ ] Node expand/collapse to show step subgraph
- [ ] Step diagnostics (start/unreachable/dead end)

**Phase 4 – Observed overlays**
- [ ] Node overlay: views + completions
- [ ] Edge overlay: consistent counts + highlight heavy traffic
- [ ] “Top drop candidates” card (via heuristics)
- [ ] Testing checklist covering quick add, import/export, steps, observed filters

