# Decision Algo Reminder

This folder contains the experimental decision-engine source files.

## What to remember

- Run the parser with:
  - `node decisionAlgo/parse-md-to-nodes.js`
- It reads only the library parser sources declared in `decisionAlgo/parse-md-to-nodes.js`
- `aidraft` is split into:
  - parser source: `decisionAlgo/aidraft/parser.md`
  - human guide: `decisionAlgo/aidraft/guide.md`
  - note-type template: `decisionAlgo/aidraft/noteTypeTemplate.js` (IntelliDraft sections)
  - all libraries: `decisionAlgo/noteTypeRegistry.js` (note-type filters + assign-once rules)
- It generates structured node JSON in `decisionAlgo/nodes.json`
- The Decision Engine UI is inside the app (`App.js`), not a standalone localhost route

## Purpose

- Phase 1: keep the markdown library as the source of truth
- Phase 2: convert the markdown into machine-readable nodes

## Output

- `decisionAlgo/nodes.json`

## Enterprise platform layers

Implementation lives in **`decisionAlgo/platform/`** (12 modules). Facades: `decisionAssignmentScope.js`, `smartSelection.js`.

See **`enterpriseArchitecture.md`** for the full model (schedule vs workflow vs assignment vs cross-system overlays).

Assignment follows **Workflow → Category → Depth → Branching**. Schedule (timeline blocks) is separate from the library.

See also `documentationArchitecture.md` and `workflowCatalog.js`.

## Why this matters

- Makes the decision flow parseable by a runtime engine
- Keeps schedule, catalog, and assignment as separate layers
