# DocuWraite Demo

Guided DSP documentation demo for Mary Bet. The app uses a **playbook** (fixed workflow template) plus an **i-playbook** (care-plan-aware adaptive workflow engine) on the server.

## Playbook vs i-playbook

### Playbook

The **playbook** is the base documentation workflow for an activity or time block. It defines:

- Step order
- Short questions
- Answer types (`yes-no`, `suggestions`, `why`, `draft`)
- Suggestion chips
- Short care-plan rationales

It is **not** the full care plan. It is the **template** built from the care plan.

**Source file:** `server/playbooks.js`

**Demo workflows:**

| Time block | Workflow id        | Activity focus              |
|------------|--------------------|-----------------------------|
| 7am–9am    | `morning-adl`      | Morning ADLs and hygiene    |
| 9am–11am   | `feeding-support`  | Feeding and meal support    |
| 11am–1pm   | `in-home-leisure`  | Rest and pre-outing prep    |
| 1pm–3pm    | `community-outing` | Community participation     |
| 3pm–5pm    | `return-home`      | Return home and afternoon   |

### i-playbook

The **i-playbook** is the smart layer on top of the base playbook.

The playbook is the fixed question list for a time block (morning ADLs, feeding, outing, and so on). The i-playbook reads Mary Bet’s care plan and your answers so far, then decides what to ask next and whether the note is ready.

It can add extra steps when the plan requires them (supervision, hydration, fall risk, aspiration, redirection), branch when answers point to fatigue or refusal, score confidence, show what’s missing before the final note, block draft generation when required items are missing, and keep an audit trail from answers to the generated note.

**Playbook = the script. i-playbook = the care-plan-aware director that adapts the script at runtime.**

The **i-playbook** is also the **extended playbook**: the same base template plus runtime intelligence from the care plan.

It adds:

- Care-plan trigger injection (risks, goals, interventions)
- Adaptive branching (fatigue, refusal, escalation patterns)
- Mandatory compliance checkpoints (supervision, hydration, response, mobility, aspiration)
- Confidence scoring (`LOW`, `MEDIUM`, `HIGH`)
- Contextual memory (previous shift issues, fatigue patterns, refusals)
- Workflow completion validation before draft
- Risk-triggered microflows (fall risk, aspiration, social boundaries)
- “Why this matters” on critical questions
- Environmental and shift-state awareness (weather, outing duration, transportation, shift phase)
- Note-quality scoring (`vague`, `incomplete`, `compliant`, `high-quality`)
- Adaptive follow-up questions after core playbook steps
- Readiness summary before the final note
- Structured answer storage and audit trail
- Care-goal tracking and escalation detection

**Source files:**

- `server/carePlanProfile.js` — structured Mary Bet care-plan data
- `server/playbookEngine.js` — adaptive workflow engine (the i-playbook runtime)
- `server/carePlanContext.js` — curated care-plan excerpts for AI draft notes
- `server/draftPrompt.js` — final-note prompt assembly

## Source of truth

Build in this order:

1. **Care plan** — clinical truth (risks, goals, diet, interventions, required supports)
2. **Playbook** — documentation template per activity or time block
3. **i-playbook** — engine rules that apply the care plan at runtime

If the care plan changes, update the profile first, then playbooks, then engine triggers.

**Care plan in this demo:**

- Full text: `carePlanText.js`
- Structured profile: `server/carePlanProfile.js`

## What to study first

Start with `server/playbooks.js`. That is the base playbook file and the best one to study first.

Then read these in order:

1. `server/carePlanProfile.js`
   This is the care-plan data that feeds the playbook logic.
2. `server/playbookEngine.js`
   This is the i-playbook runtime. It decides branching, injected questions, compliance checks, and draft blocking.
3. `server/index.js`
   This shows how the app calls the playbook and how the server returns steps.
4. `App.js`
   This shows how the UI opens the workflow and sends answers back to the server.

Short version:

- `server/playbooks.js` = the playbook template
- `server/playbookEngine.js` = the smart logic on top
- `App.js` = how the user interacts with it

## How the demo runs

1. The Expo app opens a guided workflow when a DSP focuses a shift timeline field.
2. The app builds **runtime shift intelligence** for the active client and session (risks, appointments, medications due, alerts, incomplete goals).
3. The app calls `POST /api/docuwraite/workflow-step` on the local API with field context plus that runtime intelligence.
4. The **i-playbook engine** resolves the next step from the base playbook plus care-plan rules and runtime shift intelligence.
5. Risks, alerts, appointments, medications due, and incomplete goals can inject additional guided steps, readiness warnings, and final-draft context.
6. Most steps return immediately from the server template.
7. The **final note** uses OpenAI with curated care-plan context, runtime shift intelligence, and captured answers.
8. The bubble shows confidence, readiness gaps, and blocks insert when required context is missing.

**Key app files:**

- `App.js` — bubble, guided panel, workflow state
- `docuWraiteAi.js` — API client
- `docuWraiteConfig.js` — API URL and rule-based fallback flag

**API server:** `server/index.js`

## Current MVP model (as built)

This demo is a **hybrid**: fixed **playbook** templates on the server, a **rule-based i-playbook** that adapts those templates from Mary Bet’s profile, and **OpenAI only for the final draft** (not for every question).

**As built:** shared playbooks + Mary Bet profile + adaptive injection engine + AI final draft—not a separate i-playbook per client, and not AI on every step.

### Playbook in this MVP

The **playbook** is the **base workflow template** per shift block in `server/playbooks.js`.

- **Five workflow ids**, mapped from timeline labels in `App.js`: `morning-adl`, `feeding-support`, `in-home-leisure`, `community-outing`, `return-home`.
- Each workflow defines **step order**, **short questions**, **answer types** (`yes-no`, `suggestions`, `why`, `readiness`, `draft`), **chips**, and **rationales**.
- `community-outing` can **branch early** (for example attended vs not).
- `SHIFT_INTELLIGENCE` adds shift context (appointments, oxygen or medication reminders, alerts).
- The playbook is **not** the full care plan and **not** per-client workflow code in this MVP—**one shared template set** for the demo.

### i-playbook in this MVP

The **i-playbook** is the **server runtime** that takes a playbook plus Mary Bet’s profile and builds the **live step path**.

- `server/carePlanProfile.js` holds the structured profile (risks, goals, diet, interventions), triggers, compliance per workflow, goal tracking, contextual memory, and environment defaults.
- `server/playbookEngine.js` exposes `resolveWorkflowStep()`, which:
  - starts from the base playbook order;
  - **injects** care-plan triggers (fall, aspiration, social boundary);
  - adds **compliance checkpoints** when required themes are missing;
  - **branches** on fatigue or refusal signals;
  - adds **`ai-followup`** (profile- and answer-driven **suggestion chips**, not an LLM turn);
  - runs **readiness** (confidence, missing items, draft blocking);
  - then **why**, then **draft**.
- **Compliance, confidence, escalation, and audit trail** are **deterministic** in the engine—not delegated to the model.

### How the app runs it

- Focusing a **shift timeline** field opens the guided flow for that block’s workflow id.
- Default path: `POST /api/docuwraite/workflow-step` via `docuWraiteAi.js` with `EXPO_PUBLIC_DOCUWRAITE_RULE_FALLBACK=false`.
- The API returns the **next step and meta** from the engine; **OpenAI runs only at draft** (`server/index.js`, `server/draftPrompt.js`, curated context in `server/carePlanContext.js`) unless readiness blocks the draft.
- The bubble can still do **light local assist** (gaps, conflicts, suggestions); the **guided interview** is server-driven.
- **Optional dev fallback:** in-app rules mainly for `community-outing` when rule fallback is enabled—not the main MVP path.

### MVP scope

- **Single client:** Mary Bet (structured profile plus care-plan text in the repo).
- **Therap-style documentation UI** in Expo (`App.js`): measurable rows, shift timeline blocks, validation warnings, DocuWraite bubble and guided panel.
- **Five shift blocks** wired to five workflow ids (no separate medication or incident workflow in code yet—those names appear only in scaling docs as future templates).
- **Local Express API** on port `8787`; no production database or multi-tenant config UI.
- **Chosen architecture direction:** shared engine and templates with per-client context at scale; the demo still encodes Mary Bet in source files.

## Repository file map

### Playbook (base templates)

| File | Role |
| --- | --- |
| `server/playbooks.js` | Step order, questions, chips, rationales, `SHIFT_INTELLIGENCE` |
| `server/workflowPlaybook.js` | Re-exports `playbooks.js` |

### i-playbook (runtime + Mary Bet profile)

| File | Role |
| --- | --- |
| `server/playbookEngine.js` | Adaptive path, injection, branching, readiness, audit |
| `server/carePlanProfile.js` | Risks, goals, triggers, compliance, goal tracking |

### Care plan text (draft and context)

| File | Role |
| --- | --- |
| `carePlanText.js` | Full care plan text |
| `server/carePlanContext.js` | Curated excerpts for drafting |
| `patient-care-plan.json` | Structured care plan data (supporting) |

### API and AI draft

| File | Role |
| --- | --- |
| `server/index.js` | `POST /api/docuwraite/workflow-step`, OpenAI at draft |
| `server/draftPrompt.js` | Final-note prompt assembly |
| `server/prompt.js` | Additional prompt and guardrail copy for the server |

### App (bubble, mapping, optional fallback)

| File | Role |
| --- | --- |
| `App.js` | Timeline → workflow id, guided panel, local assist, rule fallback |
| `docuWraiteAi.js` | API client |
| `docuWraiteConfig.js` | API URL, rule-fallback flag |

### Config

| File | Role |
| --- | --- |
| `.env` / `.env.example` | `OPENAI_API_KEY`, API port, public API URL, rule fallback |

**Start here:** `server/playbooks.js` (playbook), `server/playbookEngine.js` and `server/carePlanProfile.js` (i-playbook), `App.js` and `docuWraiteAi.js` (how the UI calls the server).

## Environment

Copy `.env.example` to `.env` and set:

- `OPENAI_API_KEY`
- `DOCUWRAITE_API_PORT` (default `8787`)
- `EXPO_PUBLIC_DOCUWRAITE_API_URL` (default `http://localhost:8787`)
- `EXPO_PUBLIC_DOCUWRAITE_RULE_FALLBACK` (`false` keeps the UI on the server i-playbook path)

Run:

```bash
npm run server
npm start
```

Check health:

```bash
curl http://localhost:8787/api/health
```

## How to develop a playbook and i-playbook for a new client

Use the same engine for every client. Configure the care plan, base playbooks, and i-playbook rules per person.

**Build order:** care plan → playbook templates → i-playbook engine.

### 1. Start with the care plan

The care plan is the source of truth. Extract structured data for the new person:

- Name and program context
- Risks
- Goals
- Diet and medical constraints
- Interventions and supervision needs
- Required documentation themes

Add or replace the profile in `server/carePlanProfile.js` (or load from a database in production). Keep full plan text available for excerpts and AI draft notes (demo: `carePlanText.js`).

### 2. Map documentation moments

List when DSPs actually document, not only what the care plan diagnoses:

- Shift time blocks
- Activity types
- Required scores and comments

Assign a **workflow id** to each moment (for example `morning-adl`, `feeding-support`, `community-outing`). Wire time blocks in `App.js` (`getTimeBlockWorkflowId`, `getTimeBlockPrompt`, `getTimeBlockSource`).

### 3. Build the base playbook

For each workflow id in `server/playbooks.js`:

- Define step order
- Define `render...Step` for each step key
- Keep questions short
- Tie rationales to named care-plan themes
- Add suggestion chips that match real DSP language

Create one playbook per activity or time block, not one generic flow for the whole day.

### 4. Configure the i-playbook

In `server/carePlanProfile.js` and `server/playbookEngine.js`:

- Care-plan triggers (which risks or goals inject extra steps)
- Compliance requirements per workflow
- Microflows (fall, aspiration, behavior, refusal)
- Branch rules (fatigue, refusal, ineffective redirection)
- Goal tracking and escalation detection
- Readiness and draft-blocking rules

### 5. Connect runtime context

Each API request should include:

- Patient name
- Workflow id
- Field context (time block, activity label, source)
- Runtime shift intelligence (active risks, appointments, medications due, alerts, incomplete goals)
- Answers so far
- Current note text

The engine builds the live step path from that context.

### Runtime shift intelligence

The right-column cards are not just informational UI. They are now part of the runtime workflow context:

- **Active Risks** can inject microflows and compliance checks such as fall-risk and aspiration review.
- **Today's Appointments** can inject appointment-review prompts into outing, leisure, return-home, and summary flows.
- **Medications Due** can inject medication-review prompts and readiness warnings when relevant documentation is missing.
- **Alerts** act as deterministic compliance context, not just display text.
- **Incomplete Goals** can inject goal-progress prompts, especially for the final case note.

In the app, the sidebar cards and the workflow payload come from the same runtime object. In the server, `server/playbookEngine.js` and `server/draftPrompt.js` use that runtime object to shape guided questions, readiness blocking, and final-note generation.

### 6. Keep AI in the right layer

- **Playbook + i-playbook engine:** core questions, branching, compliance, readiness
- **OpenAI:** adaptive follow-up where needed and final draft note generation
- **Audit trail:** every generated note traceable to structured answers

Small narration fields entered during runtime review steps are also passed into the final draft prompt as explicit caregiver narration, so the final note can incorporate short DSP context without requiring a separate long comment.

### 7. Wire the app

- Open the correct workflow when a DSP focuses the matching field
- Show confidence, readiness gaps, and blocked insert when required context is missing

### 8. Validate scenarios

Test normal shifts plus edge cases:

- Fatigue
- Refusal
- No community outing
- Missing mobility or hydration documentation
- End-of-shift handoff

Confirm confidence, readiness blocking, and note quality behave as expected.

## Scaling to many clients

You do **not** create 100 separate i-playbooks. That model collapses under maintenance, testing, and clinical drift.

Instead:

```text
1 core workflow engine
+
modular care-plan intelligence
```

Maintain **one set of base workflows** (playbook templates), not one custom flow per person. Examples:

- Morning ADL
- Feeding support
- Community outing
- Medication
- Incident
- Return home

Each client loads **their own context profile**—flags and structured plan data, not a new engine. Example:

```json
{
  "fallRisk": true,
  "aspirationRisk": true,
  "hearingAid": true,
  "behavioralSupport": false,
  "hydrationMonitoring": true
}
```

The **same playbook** runs for everyone. The **i-playbook** injects different intelligence from that profile:

| Client | Profile emphasis | Typical injection |
| --- | --- | --- |
| Client A | Fall risk only | Mobility supervision, transfer support |
| Client B | Aspiration + PKU | Swallow monitoring, pacing, meal precautions |
| Client C | Behavioral redirection | Social boundary monitoring, redirection effectiveness |

### Scalable composition

```text
Base workflow templates
+
Care plan intelligence (context profile)
+
Adaptive injection engine
+
AI enhancement layer
=
Client-specific documentation paths without per-client workflow code
```

**Not:** custom workflows, custom engines, or `client_99_playbook.js` for every person.

**What changes per client:** context (profile, triggers, compliance rows, optional wording overrides).

**What does not change per client:** the workflow engine, injection rules, branching model, readiness logic, and draft guardrails.

Enterprise clinical and operations platforms (Therap-style documentation, Epic, Cerner, Salesforce, and similar) scale the same way: **templates, rules, and contextual adaptation**—not unique application logic per end user.

### What to centralize

| Layer | Build once | Per client |
| --- | --- | --- |
| Engine | Branching, readiness, confidence, audit | — |
| Workflow templates | Step keys, question types, default chips | Optional wording overrides |
| Microflows | Fall, aspiration, refusal, fatigue | Which ones are on |
| Compliance matrix | Theme definitions | Required themes per workflow |
| Draft writer | Prompt, JSON output, guardrails | Answers + plan excerpts |

Most clients should be **config only**. Custom engine code is the exception.

### Production data model (not per-client source files)

Store configuration and session data in tables or documents, for example:

- `clients`
- `care_plan_context`
- `workflow_templates`
- `workflow_sessions`
- `workflow_answers`
- `risk_profiles`
- `goal_profiles`

**Not:** `client_1_playbook.js`, `client_2_playbook.js`, and so on.

This demo still bakes Mary Bet into `server/carePlanProfile.js` and `server/playbooks.js`. That is fine for a prototype. At scale, profiles and template bindings are **records** loaded by `getPatientProfile` and the engine—not new modules per name.

### Efficient rollout per client

1. **Ingest the care plan once.** Turn the plan into structured fields: risks, goals, diet, interventions, supervision, documentation themes. Keep full text for excerpts and draft context. At scale, use AI-assisted extraction into a fixed schema, then clinical review—not an open-ended model inventing the workflow.
2. **Classify the client (one or two archetypes).** Examples: community-day with outings; home-heavy ADL; feeding or aspiration-heavy; behavior or redirection-heavy. Start from the closest **template**, not a blank playbook.
3. **Map documentation moments.** Time block or activity → workflow id. Many agencies reuse the same shift grid; mapping is often copy-paste with small edits.
4. **Apply the template, then diff.** Start from the archetype playbook and i-playbook rules. Change only what the plan requires: extra triggers, compliance rows, chip lists, or a few override questions. If you are authoring dozens of steps from scratch, you picked the wrong template.
5. **Run a fixed scenario pack.** Normal block, fatigue, refusal, skipped outing, missing hydration or mobility, end-of-shift handoff. Pass or fail on readiness and draft blocking—not only whether the note sounds nice.
6. **Keep AI in the enhancement layer.** Rules and injection carry the interview; the model writes the paragraph from captured answers and curated plan context. That scales cost and keeps audits clean.

### Client tiers

- **Tier A (~70–80%):** Archetype + profile + compliance and trigger toggles. No new step keys.
- **Tier B (~15–25%):** Archetype + wording overrides + extra chips or one custom microflow.
- **Tier C (~5%):** New template or engine branch for true outliers only.

Reuse by **activity**, not by person. Workflow ids such as `morning-adl` and `community-outing` live once in a template library; clients differ in which triggers fire.

### Roles and versioning

- **Clinical staff** own plan truth and sign-off on questions.
- **Engineering** owns templates, engine behavior, and the config surface.
- **Operations** onboard clients through config (UI or JSON/YAML), not new `playbooks.js` files per name.

Store `clientId`, `templateId`, `profile`, `workflowMap`, `overrides`, and `approvedAt`. When a plan changes, diff the profile and re-run the scenario pack instead of rewriting the whole flow.

### Where AI helps vs hurts at scale

**Helps:** care plan → structured profile; draft note from fixed answers; optional chip suggestions from plan text for human approval.

**Hurts as the default:** per-step open-ended questioning for every client—slow, expensive, inconsistent, and hard to regression-test across many people.

**Rule of thumb:** AI proposes **content inside your schema**; rules own **path and compliance**.

### Rough effort (with mature templates)

- **Tier A:** hours to a day (ingest, classify, map fields, toggle rules, scenario pass)
- **Tier B:** a short diff on top of Tier A
- **Tier C:** a small project

Without templates and a config layer, each new client becomes another Mary Bet–style code path—and that does not scale.

## Architecture direction (demo vs scalable platform)

**Chosen direction:** shared engine, reusable templates, and per-client configuration, not a separate adaptive i-playbook per client.

| Area | Your Original Direction | Refined/Scalable Direction |
| --- | --- | --- |
| Core Idea | One adaptive i-playbook per client/workflow | One shared engine + reusable templates + client configs |
| Playbook Meaning | Smart workflow logic attached to a client | Reusable workflow archetype |
| i-Playbook Meaning | Intelligent adaptive layer | Runtime orchestration engine using profiles/rules |
| Scalability | Risk of many custom flows | Highly scalable to 100+ clients |
| Client Customization | Potentially code-heavy | Mostly configuration-driven |
| Workflow Ownership | Engineers maintain logic | Clinical + Ops can configure profiles |
| AI Usage | Deeply embedded everywhere | AI mainly for ingest + final drafting |
| Compliance | Mixed into workflow logic | Centralized deterministic compliance layer |
| Adaptation Method | Dynamic branching | Dynamic branching + profile injection + archetypes |
| Care Plan Usage | Read directly each time | Structured profile extracted once |
| Risk Handling | Embedded per workflow | Shared reusable microflows |
| Microflows | Ad hoc | Modular reusable packs |
| Maintenance | Could become difficult | Centralized and maintainable |
| Auditability | Possible | Strongly structured and traceable |
| Testing | Workflow-by-workflow | Scenario packs + template validation |
| Runtime Intelligence | Context-aware | Context-aware + template-driven orchestration |
| Efficiency at Scale | Harder beyond demo stage | Enterprise-scalable |
| Data Model | Client-specific logic | Template + profile + overrides |
| Engineering Load | High over time | Lower after engine matures |
| Best Strength | Strong adaptive concept | Strong adaptive + operational scalability |
| Biggest Risk | Workflow sprawl | Complexity of orchestration engine |
| Enterprise Readiness | Advanced demo architecture | Actual platform architecture |
| Long-Term Outcome | Intelligent note assistant | Intelligent care operations system |
| Best Phrase | "Adaptive care workflows" | "Workflow operating system" |
| Ideal Use | Demo / MVP evolution | Real production multi-client scaling |

## New client checklist

- [ ] Structured care-plan profile
- [ ] Activity and time-block map
- [ ] Base playbook per workflow id
- [ ] i-playbook triggers, compliance, and microflows
- [ ] Engine validation and draft policy
- [ ] Scenario testing
- [ ] API and app wiring for that client’s fields

## Terms

| Term        | Meaning |
|------------|---------|
| Care plan  | Clinical source of truth |
| Playbook   | Base documentation workflow template |
| i-playbook | Care-plan-aware adaptive workflow (template + engine) |
| Workflow id | Server key for one guided flow (for example `community-outing`) |

## One-line summary

**One engine, one template library, per-client context.** Base workflows plus care-plan intelligence and adaptive injection—not a separate i-playbook per client.
