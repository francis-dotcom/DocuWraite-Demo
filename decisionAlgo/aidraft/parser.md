# IntelliDraft Parser Source

## A. Row Note Draft

### a1. row-note-trigger
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

### b2. row-note-content
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

### c2. row-note-guardrails
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

### b2. block-summary-content
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

### c2. block-summary-guardrails
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

### b2. final-note-content
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

### c2. final-note-guardrails
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

### b2. handoff-content
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

### c2. handoff-guardrails
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

## F. Orders and Medication Draft

### a1. orders-trigger
- `Q:` When should AI generate an orders or medication documentation draft?
- `Choices:`
  - After medication-support questions are complete
  - After MAR or order verification is complete
  - After readiness passes
  - Manual trigger only
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

### b1. IF `orders-generation-selected`

### b2. orders-content
- `Q:` What content must the orders or medication draft include?
- `Choices:`
  - Medication or order name
  - Dose, route, or schedule detail
  - Staff support rendered
  - Observed response or tolerance
  - Refusal, hold, or missed dose detail
  - Follow-up or notification need
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

### c1. IF `orders-content includes Refusal, hold, or missed dose detail`

### c2. orders-guardrails
- `Q:` If the orders note includes high-risk medication content, what AI guardrail should apply?
- `Choices:`
  - Require escalation language
  - Require supervisor-review language
  - Require nurse-notification language
  - Block draft until readiness passes
  - Use cautious neutral wording
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

## E. AI Language and Safety Controls

### a1. language-policy
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

### b2. contradiction-and-safety-check
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

### c2. ai-blocking-policy
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
