# IntelliDraft Guide

This file is the human-readable branch/depth map for IntelliDraft.
Use `parser.md` in this folder as the machine-facing source of truth.

Depth guide: `a` = depth 1, `b` = depth 2, `c` = depth 3
Branch guide: the number groups related nodes into the same branch, e.g. `a1 -> b1 -> c1`

In each table below:
- columns = depth
- rows = branch

## Master Branch/Depth Map

| Section | Branch | Depth 1 | Depth 2 | Depth 3 |
|---|---|---|---|---|
| A. Row Note Draft | 1 | `a1 row-note-trigger`<br/>Q: When should AI generate a row note draft? | `b1 IF row-note-generation-selected`<br/>Condition: row note generation selected | `c1 IF row-note-content includes Safety or health detail`<br/>Condition: row note content includes Safety or health detail |
| A. Row Note Draft | 2 |  | `b2 row-note-content`<br/>Q: What content must the row note draft include? | `c2 row-note-guardrails`<br/>Q: If the row note includes high-risk content, what AI guardrail should apply? |
| B. Block Summary Draft | 1 | `a1 block-summary-trigger`<br/>Q: When should AI generate a block summary draft? | `b1 IF block-summary-generation-selected`<br/>Condition: block summary generation selected | `c1 IF block-summary-content includes Alerts or health detail`<br/>Condition: block summary content includes Alerts or health detail |
| B. Block Summary Draft | 2 |  | `b2 block-summary-content`<br/>Q: What content must the block summary include? | `c2 block-summary-guardrails`<br/>Q: If the block summary includes high-risk content, what AI rule should apply? |
| C. Final Case Note Draft | 1 | `a1 final-note-trigger`<br/>Q: When should AI generate the final case note draft? | `b1 IF final-note-generation-selected`<br/>Condition: final note generation selected | `c1 IF final-note-content includes Health and safety supports`<br/>Condition: final note content includes Health and safety supports |
| C. Final Case Note Draft | 2 |  | `b2 final-note-content`<br/>Q: What content must the final case note include? | `c2 final-note-guardrails`<br/>Q: If the final note includes high-risk content, what AI rule should apply? |
| D. Handoff Summary Draft | 1 | `a1 handoff-trigger`<br/>Q: When should AI generate a handoff summary? | `b1 IF handoff-generation-selected`<br/>Condition: handoff generation selected | `c1 IF handoff-content includes Unresolved items or Pending health tasks`<br/>Condition: handoff content includes Unresolved items or Pending health tasks |
| D. Handoff Summary Draft | 2 |  | `b2 handoff-content`<br/>Q: What content must the handoff summary include? | `c2 handoff-guardrails`<br/>Q: If the handoff includes active risk, what AI rule should apply? |
| F. Orders and Medication Draft | 1 | `a1 orders-trigger`<br/>Q: When should AI generate an orders or medication documentation draft? | `b1 IF orders-generation-selected`<br/>Condition: orders generation selected | `c1 IF orders-content includes Refusal, hold, or missed dose detail`<br/>Condition: orders content includes refusal, hold, or missed dose |
| F. Orders and Medication Draft | 2 |  | `b2 orders-content`<br/>Q: What content must the orders or medication draft include? | `c2 orders-guardrails`<br/>Q: If the orders note includes high-risk medication content, what AI guardrail should apply? |
| E. AI Language and Safety Controls | 1 | `a1 language-policy`<br/>Q: What AI language rule should apply to generated drafts? | `b1 IF language-policy-selected`<br/>Condition: language policy selected | `c1 IF contradiction-and-safety-check includes Check unresolved high-risk items or Check escalation mismatch`<br/>Condition: contradiction-and-safety-check includes Check unresolved high-risk items or Check escalation mismatch |
| E. AI Language and Safety Controls | 2 |  | `b2 contradiction-and-safety-check`<br/>Q: What safety or contradiction check should AI run before finalizing the draft? | `c2 ai-blocking-policy`<br/>Q: If AI detects unsafe or contradictory content, what should happen? |

## A. Row Note Draft

### a1. row-note-trigger
Depth 1 | Branch 1

- `Q:` When should AI generate a row note draft?

- `Choices:`
  - After base questions are complete
  - After care-plan questions are complete
  - After runtime questions are complete
  - After readiness passes
  - Manual trigger only
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

### b1. IF `row-note-generation-selected`
Depth 2 | Branch 1

### b2. row-note-content
Depth 2 | Branch 2

- `Q:` What content must the row note draft include?

- `Choices:`
  - Staff support rendered
  - Observed response
  - Safety or health detail
  - Follow-up need
  - Compliance detail
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

### c1. IF `row-note-content includes Safety or health detail`
Depth 3 | Branch 1

### c2. row-note-guardrails
Depth 3 | Branch 2

- `Q:` If the row note includes high-risk content, what AI guardrail should apply?

- `Choices:`
  - Require escalation language
  - Require supervisor-review language
  - Require incident-linkage language
  - Block draft until readiness passes
  - Use cautious neutral wording
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

## B. Block Summary Draft

### a1. block-summary-trigger
Depth 1 | Branch 1

- `Q:` When should AI generate a block summary draft?

- `Choices:`
  - After all block questions are complete
  - After readiness passes
  - After manual user trigger
  - After runtime reconciliation
  - Finalize automatically
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

### b1. IF `block-summary-generation-selected`
Depth 2 | Branch 1

### b2. block-summary-content
Depth 2 | Branch 2

- `Q:` What content must the block summary include?

- `Choices:`
  - Main support rendered
  - Main observed response
  - Runtime context
  - Alerts or health detail
  - Follow-up or carryover
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

### c1. IF `block-summary-content includes Alerts or health detail`
Depth 3 | Branch 1

### c2. block-summary-guardrails
Depth 3 | Branch 2

- `Q:` If the block summary includes high-risk content, what AI rule should apply?

- `Choices:`
  - Highlight safety response
  - Include escalation outcome
  - Require readiness pass first
  - Require supervisor-review phrasing
  - Block generation until issue resolved
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

## C. Final Case Note Draft

### a1. final-note-trigger
Depth 1 | Branch 1

- `Q:` When should AI generate the final case note draft?

- `Choices:`
  - After all row notes are complete
  - After readiness passes
  - After manual user trigger
  - After handoff items are resolved
  - Final step only
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

### b1. IF `final-note-generation-selected`
Depth 2 | Branch 1

### b2. final-note-content
Depth 2 | Branch 2

- `Q:` What content must the final case note include?

- `Choices:`
  - Whole-shift support summary
  - Whole-shift response summary
  - Health and safety supports
  - Behavior and intervention summary
  - Follow-up and handoff needs
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

### c1. IF `final-note-content includes Health and safety supports`
Depth 3 | Branch 1

### c2. final-note-guardrails
Depth 3 | Branch 2

- `Q:` If the final note includes high-risk content, what AI rule should apply?

- `Choices:`
  - Include escalation summary
  - Include supervisor-review detail
  - Include unresolved-item detail
  - Block generation until readiness passes
  - Require handoff emphasis
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

## D. Handoff Summary Draft

### a1. handoff-trigger
Depth 1 | Branch 1

- `Q:` When should AI generate a handoff summary?

- `Choices:`
  - When carryover items exist
  - When unresolved health items exist
  - When unresolved behavior items exist
  - When user requests handoff summary
  - Never automatically
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

### b1. IF `handoff-generation-selected`
Depth 2 | Branch 1

### b2. handoff-content
Depth 2 | Branch 2

- `Q:` What content must the handoff summary include?

- `Choices:`
  - Unresolved items
  - Monitoring needs
  - Pending health tasks
  - Pending behavior follow-up
  - Priority reminders
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

### c1. IF `handoff-content includes Unresolved items or Pending health tasks`
Depth 3 | Branch 1

### c2. handoff-guardrails
Depth 3 | Branch 2

- `Q:` If the handoff includes active risk, what AI rule should apply?

- `Choices:`
  - Prioritize urgent items first
  - Highlight escalation already taken
  - Flag supervisor-aware items
  - Require unresolved-risk wording
  - Require clinical follow-up wording
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

## E. AI Language and Safety Controls

### a1. language-policy
Depth 1 | Branch 1

- `Q:` What AI language rule should apply to generated drafts?

- `Choices:`
  - Neutral and factual
  - Compliance-focused
  - Safety-focused
  - Supervisor-ready
  - Handoff-ready
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

### b1. IF `language-policy-selected`
Depth 2 | Branch 1

### b2. contradiction-and-safety-check
Depth 2 | Branch 2

- `Q:` What safety or contradiction check should AI run before finalizing the draft?

- `Choices:`
  - Check missing support rendered
  - Check missing observed response
  - Check unresolved high-risk items
  - Check protocol contradictions
  - Check escalation mismatch
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

### c1. IF `contradiction-and-safety-check includes Check unresolved high-risk items or Check escalation mismatch`
Depth 3 | Branch 1

### c2. ai-blocking-policy
Depth 3 | Branch 2

- `Q:` If AI detects unsafe or contradictory content, what should happen?

- `Choices:`
  - Warn only
  - Route back to readiness
  - Route back to source question
  - Block generation
  - Require supervisor review
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable
