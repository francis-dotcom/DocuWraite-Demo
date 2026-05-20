# Enterprise Intelligent Care Documentation Platform

Modular workflow orchestration for DSP/caregiver charting. **Not** a giant form builder or timeline-only app.

## Core philosophy

The system **is**:
- A workflow orchestration engine
- A contextual documentation intelligence platform
- An assignment-driven guided charting system
- A clinically structured runtime documentation engine

## Layer map (code: `decisionAlgo/platform/`)

| # | Layer | Module | Responsibility |
|---|--------|--------|----------------|
| 1 | Schedule | `scheduleLayer.js` | When/where blocks run — **no** question logic |
| 2 | Workflow | `workflowEngine.js` | ADL, Communication, Medication, … |
| 3 | Category | `categorySystem.js` | Topics inside workflows (not time-based) |
| 4 | Depth | `depthSystem.js` | Investigation detail — not schedule/workflow identity |
| 5 | Branching | `branchingEngine.js` | Conditional follow-ups (`branching.md`) |
| 6 | Assignment | `assignmentEngine.js` | Locked contracts per workflow block |
| 7 | DSP runtime | `dspRuntimePack.js` | Deterministic packs — **only** assigned nodes |
| 8–10 | Cross-system | `crossSystemEngine.js` | Risks/protocols as overlays — **not** workflows |
| 11 | Smart select | `smartSelectAssistant.js` | Assignment assistant — supervisor locks |
| 12 | Filtering | `filteringArchitecture.js` | Hard → medium → soft → cross |
| 13 | Escalation | `escalationEngine.js` | Universal escalation triggers |
| 14 | AI review | `aiReviewLayer.js` | QA separate from runtime |

## Rules

1. **Never** merge multiple workflows into one time-slot note.
2. **Never** duplicate workflows for risks (no “Fall Risk ADL” workflow).
3. Risks attach as **cross-system overlays** on clients/workflows/categories.
4. Time is **soft filter** only; **workflow** is hard filter.
5. DSP never browses full library during documentation — only `dspRuntimePack` from locked assignments.

## Filtering hierarchy

1. **Hard** — workflow context (block `workflowId`)
2. **Medium** — category relevance
3. **Soft** — time-of-day (hints only)
4. **Cross** — risks, protocols, assist levels (prioritize, not duplicate trees)

## Integration

- UI unchanged — `App.js` uses facades: `decisionAssignmentScope.js`, `smartSelection.js`
- Catalog source: markdown → `nodes.json` via `parse-md-to-nodes.js`
- Locked assignments store `assignmentContract` on stage
