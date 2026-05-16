# READINESS

## A. Missing Support Rendered

### a1. support-check

- `Q:` Is staff support rendered clearly documented?

- `Choices:`
  - Complete
  - Incomplete
  - Missing
  - Unclear
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

### b1. IF `support-missing`

### b2. support-remediation

- `Q:` What should happen if staff support rendered is incomplete or missing?

- `Choices:`
  - Warn only
  - Route back to source question
  - Require clarification
  - Block draft generation
  - Require supervisor review
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

### c1. IF `high-risk-answer`

### c2. support-blocking

- `Q:` If missing support creates compliance or safety risk, what status should apply?

- `Choices:`
  - High-priority warning
  - Hard block
  - Escalation review
  - Incident linkage required
  - Final-note hold
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

## B. Missing Observed Response

### a1. response-check

- `Q:` Is the person's observed response clearly documented?

- `Choices:`
  - Complete
  - Incomplete
  - Missing
  - Unclear
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

### b1. IF `response-missing`

### b2. response-remediation

- `Q:` What should happen if observed response is incomplete or missing?

- `Choices:`
  - Warn only
  - Route back to source question
  - Require clarification
  - Block draft generation
  - Add to final-note review
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

### c1. IF `high-risk-answer`

### c2. response-blocking

- `Q:` If the missing response affects safety or behavior interpretation, what status should apply?

- `Choices:`
  - High-priority warning
  - Hard block
  - Supervisor review
  - Escalation review
  - Final-note hold
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

## C. Compliance and Protocol Coverage

### a1. compliance-check

- `Q:` Are required compliance, protocol, or precaution details documented?

- `Choices:`
  - Complete
  - Partially complete
  - Missing
  - Unclear
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

### b1. IF `compliance-missing`

### b2. compliance-remediation

- `Q:` What should happen if required compliance evidence is incomplete or missing?

- `Choices:`
  - Warn only
  - Route back to source question
  - Require compliance follow-up
  - Block draft generation
  - Require supervisor review
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

### c1. IF `high-risk-answer`

### c2. compliance-blocking

- `Q:` If compliance failure creates defensibility or safety risk, what status should apply?

- `Choices:`
  - Hard block
  - Escalation review
  - Incident linkage required
  - Supervisor review
  - Final-note hold
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

## D. Unresolved Alerts and Health Items

### a1. unresolved-check

- `Q:` Are there unresolved alerts, medications, symptoms, or health items still open?

- `Choices:`
  - None
  - Minor unresolved item
  - Significant unresolved item
  - Critical unresolved item
  - Unclear
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

### b1. IF `unresolved-present`

### b2. unresolved-remediation

- `Q:` What should happen if alerts or health items remain unresolved?

- `Choices:`
  - Warn only
  - Require handoff entry
  - Require final-note mention
  - Block draft generation
  - Require clinical or supervisor review
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

### c1. IF `high-risk-answer`

### c2. unresolved-blocking

- `Q:` If unresolved items create active risk, what status should apply?

- `Choices:`
  - Hard block
  - Escalation review
  - Incident linkage required
  - Clinical review required
  - Final-note hold
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

## E. Overall Documentation Status

### a1. readiness-classification

- `Q:` What is the current documentation readiness status?

- `Choices:`
  - Ready
  - Ready with warning
  - Incomplete
  - High-risk incomplete
  - Blocked
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

### b1. IF `not-ready`

### b2. remediation-routing

- `Q:` Where should the workflow route the DSP to fix readiness issues?

- `Choices:`
  - Base question
  - Care-plan question
  - Runtime question
  - Branching follow-up
  - Supervisor review
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

### c1. IF `high-risk-answer`

### c2. final-blocking-state

- `Q:` If the record is not safe to finalize, what final blocking state should apply?

- `Choices:`
  - Block row-note draft
  - Block block-summary draft
  - Block final case note
  - Require incident linkage first
  - Require supervisor sign-off
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable
