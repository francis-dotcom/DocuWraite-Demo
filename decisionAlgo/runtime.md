# RUNTIME

## A. Overdue and Outstanding Tasks

### a1. type-selection

- `Q:` Which overdue or outstanding task is affecting this documentation block?

- `Choices:`
  - Daily documentation still incomplete
  - MAR or medication signature still pending
  - Behavior data still pending
  - Health check still pending
  - Other outstanding task
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

### b1. IF `task-selected`

### b2. task-status-question

- `Q:` What is the current status of this outstanding task?

- `Choices:`
  - Due now
  - Overdue
  - Deferred to later this shift
  - Assigned to another staff member
  - No longer relevant
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

### c1. IF `high-risk-answer`

### c2. readiness-impact-question

- `Q:` If this task remains unresolved, how should it affect documentation readiness?

- `Choices:`
  - Warning only
  - Require handoff note
  - Require supervisor awareness
  - Block note generation
  - Trigger incident or compliance review
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

## B. Appointments and Schedule

### a1. type-selection

- `Q:` Which appointment or schedule item is relevant to this block?

- `Choices:`
  - Medical appointment
  - Therapy or clinical visit
  - Community outing
  - Family or guardian schedule item
  - Transportation or pickup timing
  - Other schedule item
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

### b1. IF `schedule-item-selected`

### b2. schedule-impact-question

- `Q:` How did this appointment or schedule item affect the current block?

- `Choices:`
  - Occurred this block
  - Later today and requires preparation
  - Delayed or changed
  - Canceled
  - Did not affect this block
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

### c1. IF `high-risk-answer`

### c2. schedule-followup-question

- `Q:` If the schedule change affected care, what follow-up must be documented?

- `Choices:`
  - Preparation support provided
  - Transition support provided
  - Tolerance or refusal documented
  - Handoff follow-up required
  - Supervisor review needed
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

## C. Medications and Due Health Tasks

### a1. type-selection

- `Q:` Which medication or health-related task is due or relevant during this block?

- `Choices:`
  - Scheduled medication due
  - PRN consideration
  - Oxygen check due
  - Glucose check due
  - Vital sign or symptom check due
  - Other health task
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

### b1. IF `health-task-selected`

### b2. health-task-status-question

- `Q:` What is the current status of this medication or health task?

- `Choices:`
  - Completed
  - Due later this block
  - Deferred
  - Refused
  - Not relevant this block
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

### c1. IF `high-risk-answer`

### c2. medication-escalation-question

- `Q:` If refusal, severe symptoms, or protocol failure occurred, what follow-up is required?

- `Choices:`
  - Notify nurse
  - Notify supervisor
  - Monitor more closely
  - Carry to handoff
  - Start incident documentation
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

## D. Active Alerts and Cautions

### a1. type-selection

- `Q:` Which active alert or caution is relevant in this block?

- `Choices:`
  - Fall supervision alert
  - Aspiration or swallowing alert
  - Seizure or medical precaution alert
  - Communication or hearing alert
  - Behavior or boundary alert
  - Other alert or caution
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

### b1. IF `alert-selected`

### b2. alert-action-question

- `Q:` How was this alert handled during the block?

- `Choices:`
  - Addressed directly
  - Not relevant this block
  - Required extra support
  - Needs follow-up later
  - Not yet addressed
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

### c1. IF `high-risk-answer`

### c2. alert-escalation-question

- `Q:` If the alert created an active safety or health concern, what follow-up is required?

- `Choices:`
  - Increase supervision
  - Notify supervisor
  - Notify nurse or clinical team
  - Start incident documentation
  - Maintain direct monitoring
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

## E. Incomplete Goals and Carryover Items

### a1. type-selection

- `Q:` Which incomplete goal or carryover item is relevant to this block?

- `Choices:`
  - ADL goal still incomplete
  - Community goal still incomplete
  - Behavior goal still incomplete
  - Health or safety follow-up still incomplete
  - Prior shift carryover item
  - Other incomplete item
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

### b1. IF `carryover-selected`

### b2. carryover-progress-question

- `Q:` What happened with this incomplete goal or carryover item during this block?

- `Choices:`
  - Progress made
  - Partial progress made
  - No progress made
  - Still not addressed
  - No longer relevant
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

### c1. IF `high-risk-answer`

### c2. carryover-followup-question

- `Q:` If the item remains unresolved, what follow-up is required?

- `Choices:`
  - Keep in final note
  - Add to shift handoff
  - Revisit in next block
  - Supervisor review needed
  - Compliance warning needed
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

## F. Shift Handoff and Follow-Up

### a1. type-selection

- `Q:` Which handoff or follow-up item needs to persist beyond this block?

- `Choices:`
  - Health follow-up
  - Behavior follow-up
  - Safety follow-up
  - Medication follow-up
  - Routine or scheduling follow-up
  - Other handoff item
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

### b1. IF `handoff-item-selected`

### b2. handoff-destination-question

- `Q:` Where should this follow-up item be carried?

- `Choices:`
  - Later this shift
  - Final note only
  - Shift handoff only
  - Final note and handoff
  - Supervisor communication only
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

### c1. IF `high-risk-answer`

### c2. handoff-urgency-question

- `Q:` If this follow-up is urgent or unresolved, what immediate action is required?

- `Choices:`
  - Notify supervisor now
  - Notify nurse now
  - Add urgent handoff flag
  - Keep under active monitoring
  - Start incident documentation
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

## G. Current Environment and Context

### a1. type-selection

- `Q:` What current environment or contextual factor is affecting documentation this block?

- `Choices:`
  - Crowded or noisy setting
  - Community setting
  - Transportation setting
  - Home or residential setting
  - Weather or environmental stressor
  - Other contextual factor
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

### b1. IF `context-selected`

### b2. context-impact-question

- `Q:` How did the current environment affect care, participation, or safety?

- `Choices:`
  - Increased prompts needed
  - Increased supervision needed
  - Increased behavior or sensory concern
  - Reduced participation or tolerance
  - No meaningful effect
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

### c1. IF `high-risk-answer`

### c2. context-safety-question

- `Q:` If the environment increased risk or instability, what follow-up is required?

- `Choices:`
  - Move to safer setting
  - Reduce stimulation
  - End activity early
  - Notify supervisor
  - Add to final note and handoff
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

## H. Current Symptoms, Incidents, or Status Changes

### a1. type-selection

- `Q:` Which symptom, incident, or status change is relevant in this block?

- `Choices:`
  - New symptom observed
  - Behavior incident observed
  - Injury or near miss observed
  - Refusal or escalation observed
  - Mood or status change observed
  - Other status change
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

### b1. IF `status-change-selected`

### b2. status-severity-question

- `Q:` What best describes the severity or impact of this symptom, incident, or status change?

- `Choices:`
  - Mild
  - Moderate
  - Significant
  - Critical
  - Resolved quickly
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

### c1. IF `high-risk-answer`

### c2. incident-threshold-question

- `Q:` If this event meets a high-risk threshold, what workflow should open next?

- `Choices:`
  - Incident documentation workflow
  - Supervisor review workflow
  - Clinical escalation workflow
  - Emergency response workflow
  - High-risk note validation workflow
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

## I. Staff Actions Needed This Block

### a1. type-selection

- `Q:` What staff action still needs to happen during this documentation block?

- `Choices:`
  - Prompt or cue required
  - Supervision increase required
  - Health task required
  - Follow-up support required
  - Documentation clarification required
  - Other staff action needed
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

### b1. IF `staff-action-selected`

### b2. action-status-question

- `Q:` What is the status of this required staff action?

- `Choices:`
  - Already completed
  - Needs completion now
  - Deferred to later this shift
  - Assigned to another staff member
  - No longer needed
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

### c1. IF `high-risk-answer`

### c2. action-readiness-question

- `Q:` If the required staff action is not completed, what should happen to documentation readiness?

- `Choices:`
  - Warning only
  - Require follow-up question
  - Require handoff entry
  - Block note generation
  - Require supervisor review
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

## J. Documentation Status and Readiness

### a1. type-selection

- `Q:` What documentation status issue is currently relevant?

- `Choices:`
  - Missing support rendered
  - Missing observed response
  - Missing compliance detail
  - Missing alert or health context
  - Note quality concern
  - Other readiness issue
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

### b1. IF `readiness-issue-selected`

### b2. readiness-classification-question

- `Q:` How should this documentation issue be classified?

- `Choices:`
  - Incomplete but fixable
  - Quality warning only
  - Compliance concern
  - High-risk omission
  - Draft-blocking issue
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable

---

### c1. IF `high-risk-answer`

### c2. remediation-routing-question

- `Q:` If the readiness issue is critical, where should the workflow route the user?

- `Choices:`
  - Back to base workflow question
  - Back to alert or health follow-up
  - Back to staff action question
  - Require supervisor review
  - Block final note until corrected
  - Skip
  - Deferred
  - Unknown
  - Not observed
  - Not applicable
