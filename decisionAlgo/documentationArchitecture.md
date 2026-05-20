# Recommended Documentation Architecture

## Core Principle

The system is organized by:

```text
Workflow
   ↓
Category
   ↓
Depth
   ↓
Branching Questions
```

**Not** by time, shift, or morning/evening. Time belongs to the **schedule layer**, not the documentation library structure.

---

## 1. Workflow Branches (Top Level)

Primary documentation contexts: ADL, Communication, Medication, Behavior, Meal Support, Mobility, Community Outing, Sleep Support, Safety Monitoring.

Each workflow = what the DSP is actively supporting during that **timeline block**.

---

## 2. Categories Inside Each Workflow

Topics within a workflow (e.g. ADL → Toileting, Grooming, Transfers; Communication → Verbal Expression, Device Usage).

Categories define **what topic** is being documented.

---

## 3. Depth System

Depth controls investigation level and branching intensity. It does **not** control scheduling, workflow, or assignment targeting.

Node depth in Baseplan is encoded in node ids (`a` = depth 1, `b` = depth 2, …).

---

## 4. Branching Questions

Escalation follow-ups (refusal, fatigue, risk) live in `branching.md` and attach via **Selective branch** mode — not as a parallel “morning” library tree.

---

## 5. Schedule Layer (Separate)

Schedule controls **when** documentation happens and which **workflow** each block uses.

Same hour can have **multiple blocks** (e.g. 7–8am ADL + 7–8am Communication). Each block is a separate assignment target.

---

## 6. Assignment Process

Supervisor: pick **target block** → filter **workflow** (hard) → optional **categories** (medium) → **depth** → check questions / smart select → **lock** → **final assign**.

DSP sees only the pack for that block’s workflow.

---

## 7. Filtering

| Filter | Role |
|--------|------|
| **Hard** | Workflow (`workflowId` on block → Baseplan section A–J) |
| **Medium** | Category chips in Assign (topic within workflow) |
| **Soft** | Time-of-day hints only — never primary library structure |

---

## 8. Implementation Map

| Layer | Code |
|-------|------|
| Workflows A–J | `noteTypeRegistry.js` → `BASEPLAN_SECTION_WORKFLOW_IDS` |
| Schedule chips | `workflowCatalog.js` → `WORKFLOW_SCHEDULE_OPTIONS` |
| Category inference | `workflowCatalog.js` → `inferNodeDocumentationCategory` |
| Target scope | `decisionAssignmentScope.js` |
| Assign UI | `App.js` → Decision Engine (Target → Category → Depth → Lock) |

---

## 9. Mental Model

```text
Workflow = department/context
Category = documentation topic
Depth = detail level
Branching = investigative path
Assignment = final DSP documentation pack
```
