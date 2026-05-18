# Decision Algo Reminder

This folder contains the experimental decision-engine source files.

## What to remember

- Run the parser with:
  - `node decisionAlgo/parse-md-to-nodes.js`
- It reads only the library parser sources declared in `decisionAlgo/parse-md-to-nodes.js`
- `aidraft` is split into:
  - parser source: `decisionAlgo/aidraft/parser.md`
  - human guide: `decisionAlgo/aidraft/guide.md`
  - note-type template: `decisionAlgo/aidraft/noteTypeTemplate.js` (maps Note type → parser section)
- It generates structured node JSON in `decisionAlgo/nodes.json`
- The Decision Engine UI is inside the app (`App.js`), not a standalone localhost route

## Purpose

- Phase 1: keep the markdown library as the source of truth
- Phase 2: convert the markdown into machine-readable nodes

## Output

- `decisionAlgo/nodes.json`

## Why this matters

- Makes the decision flow parseable by a runtime engine
- Keeps the current app logic untouched while building the experimental layer
