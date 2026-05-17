# Stages Suggestion

Keep the current app logic as-is and build the new decision engine as a parallel experimental layer. That preserves rollback safety while you test the new model.

## Phase 1. Spec Foundation

- Keep current `App.js`, `server/playbooks.js`, and `server/playbookEngine.js` untouched.
- Use `decisionAlgo/` as the experimental source-of-truth library.
- Finalize:
  - `baseplan.md`
  - `careplan.md`
  - `runtime.md`
  - `branching.md`
  - `readiness.md`
  - `aidraft/parser.md`
  - `aidraft/guide.md`

Goal:
- stable content model
- no production behavior change yet

## Phase 2. Markdown-to-Node Parser

- Build a parser that converts the `.md` files into structured node JSON.
- Each question becomes a node.
- Each branch becomes a child path.
- Each node gets:
  - `id`
  - `library`
  - `section`
  - `depth`
  - `question`
  - `choices`
  - `children`
  - `conditions`

Goal:
- markdown becomes machine-readable
- still no impact on current app flow

## Phase 3. Assign Engine UI

- Build a visual node library from the parsed markdown.
- Show all nodes in a tree.
- Add a checkbox beside each node.
- Add dropdowns for:
  - include mode
  - depth
  - full branch vs selective branch
- Allow:
  - add parent without all children
  - add only chosen subnodes
  - limit depth

Goal:
- visual workflow composer

## Phase 4. Workflow Configuration Storage

- Save assignments per:
  - block
  - behavior check
  - client type
  - program or module
- Config should support:
  - include
  - exclude
  - selected children
  - max depth
  - readiness rules
  - AI draft rules

Goal:
- reusable workflow definitions

## Phase 5. Experimental Runtime Engine

- Build an experimental engine that reads:
  - assigned base nodes
  - assigned care-plan nodes
  - assigned runtime nodes
  - assigned branching nodes
  - assigned readiness nodes
  - assigned AI draft nodes
- Engine asks questions in sequence.
- Engine opens only selected branch paths.

Goal:
- first real alternative to the current hardcoded flow

## Phase 6. Output and Validation Layer

- Build:
  - row note generation
  - block summary generation
  - final case note generation
  - readiness checks
  - warnings and hard blocks
  - supervisor and incident routing

Goal:
- full end-to-end experimental documentation engine

## Phase 7. Side-by-Side Testing

- Keep the current engine as default.
- Run the experimental engine in hidden or dev mode.
- Compare:
  - question quality
  - branch accuracy
  - documentation quality
  - speed
  - failure cases

Goal:
- prove the new system before replacing anything

## Phase 8. Gradual Adoption

- Start with one area only:
  - behavior checks
  - or ADL blocks
  - or runtime alerts
- Expand module by module after validation.

Goal:
- controlled migration
- easy rollback

## Recommended Build Order

1. Lock the markdown library structure.
2. Build the parser to JSON.
3. Build the assign engine UI.
4. Build the experimental runner.
5. Compare against the current app.
