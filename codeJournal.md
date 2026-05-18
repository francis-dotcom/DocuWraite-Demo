# Code journal

Working notes for DocuWraite demo — playbooks, libraries, UI fixes, module design, and local dev tips.

---

## 2026-05-18

- Merged `notes.md`, `myNotes.md`, and `pp.md` into this file (`codeJournal.md`).
- Shift intelligence: built from care plan + SQLite (`shiftSchedule`, `client_care_plan_data`), not hardcoded strings.
- Therap sync: `npm run sync:therap`, `POST /api/sync/therap`, `?syncTherap=true` on workspace load; mock at `/therap-mock`.
- Row Builder clears after Add Row; library names capitalized; Schedule Builder shows block details under timeline.

---

## How to

**Polished UI (dev-only):** Open the **DocuWraite Dev Guide** canvas in Cursor (`canvases/docuwraite-dev-guide.canvas.tsx` under this workspace’s Cursor project folder). It is not imported by `App.js` and is not part of the Expo bundle.

Use the same pattern as the in-app **Documentation Guide**: **title → one-line summary → numbered steps**.

In Markdown, use `<details>` / `<summary>` so each guide collapses in Cursor or GitHub preview (click the row to expand).

**Template to copy:**

```markdown
<details>
<summary><strong>How to …</strong> — One sentence describing the goal.</summary>

1. First step.
2. Second step.
3. Third step.

</details>
```

---

<details>
<summary><strong>How to set up the project</strong> — Get env, dependencies, and care-plan seed data ready.</summary>

1. Copy `.env.example` to `.env` and set `OPENAI_API_KEY`.
2. Run `npm install`.
3. After editing `clientProfiles.js`, run `npm run bootstrap:care-plans`.

</details>

<details>
<summary><strong>How to run the app</strong> — Start the API and Expo front end together.</summary>

1. In terminal 1, run `npm run server` (API on port 8787).
2. In terminal 2, run `npm run web` (or `npm run ios` / `npm run android`).
3. Confirm `EXPO_PUBLIC_DOCUWRAITE_API_URL` in `.env` points at `http://localhost:8787`.

</details>

<details>
<summary><strong>How to refresh shift intelligence</strong> — Load today’s appointments, MAR, alerts, and overdue into the right column.</summary>

1. At shift start, run `npm run sync:morning-shift` (schedule only) or `npm run sync:therap` (schedule + care plan).
2. For one client: `npm run sync:therap -- --clients mary-bet --shift-only`.
3. Or switch individuals in the UI — workspace load uses `?syncTherap=true` automatically.

</details>

<details>
<summary><strong>How to sync from Therap (live)</strong> — Pull from middleware instead of demo seeds.</summary>

1. Set `THERAP_API_BASE_URL`, `THERAP_API_TOKEN`, and `THERAP_SYNC_MODE=auto` in `.env`.
2. Ensure middleware exposes `GET /shift-feed` and `GET /care-plan` (see `server/integrations/therapHttpClient.js`).
3. Run `npm run sync:therap` or `POST /api/sync/therap` with `{ "clientIds": ["mary-bet"] }`.

</details>

<details>
<summary><strong>How to test Therap locally (mock)</strong> — Exercise the live HTTP path without a real Therap server.</summary>

1. Set `THERAP_API_BASE_URL=http://localhost:8787/therap-mock` and `THERAP_SYNC_MODE=live`.
2. Run `npm run server`.
3. Run `npm run sync:therap` and confirm SQLite / right column update.

</details>

<details>
<summary><strong>How to use Decision Engine</strong> — Assign library questions to time blocks and rows.</summary>

1. Open **Decision Engine**, pick library, note type, target block or row.
2. Expand a library section header, select questions, then lock / stage / final assign.
3. Use **Add Row** / **Add Block** in the builders; timeline shows full descriptions under each block.

</details>

<details>
<summary><strong>How branch, depth, and sections work</strong> — Topic folders, question levels, and storyline lanes in the Decision Engine.</summary>

1. **Section** — topic folder in the list (e.g. morning ADL, Row Note Draft). Groups questions; not the same as Branch or Depth.
2. **Depth** — how many levels down: `a` = 1 (main), `b` = 2 (children), `c` = 3 (sub-children). The Depth dropdown caps how far down is shown.
3. **Branch (library paths)** — parallel lane in a section (usually branch 1 vs 2; baseplan up to 5). Example: trigger path vs content path.
4. **Branch (selective mode)** — one of five escalation classes: Refusal, Fatigue, Risk & safety, Protocol failure, Incident / emergency (full set in `decisionAlgo/branching.md`).
5. **Full branch** — all questions for the note type in that library. **Selective branch** — narrow by branch + depth + branching follow-ups for the chosen class.
6. Pick **Library** + **Note type** for what you document; use **Mode**, **Branch**, and **Depth** when you want a focused slice.

</details>

<details>
<summary><strong>Which libraries and depths each note type has</strong> — Coverage is split by note type, not one matrix for everything.</summary>

| Note type | Main libraries / sections | Depth (typical) |
|-----------|----------------------------|-----------------|
| **Block time** | Baseplan A–J, Careplan, Runtime, Readiness, Playbook R, IntelliDraft block + E | Baseplan up to **5**; others **1–3** |
| **Row note** | Baseplan **L**, IntelliDraft row + **E**, branching | **1–4** in L; **1–3** elsewhere |
| **Final note** | Baseplan **K**, IntelliDraft final + **E**, branching | **1–5** in K; **1–3** elsewhere |
| **Handover note** | Baseplan **M**, Runtime handoff, IntelliDraft handoff + **E**, branching | **1–4** in M; **1–3** elsewhere |
| **Orders** | Runtime meds/tasks, IntelliDraft orders + **E**, branching — **not** Baseplan I | **1–3** |

- **Branching** (five escalation classes) applies to **all** note types in **Selective branch** mode.
- **Baseplan I (medication-support)** = **Block time** only; **Orders** = Runtime + IntelliDraft.
- You still **check** each question, **Final Assign**, then the **bubble** asks that same set on the block or row.
- Registry: `decisionAlgo/noteTypeRegistry.js`; content: `decisionAlgo/nodes.json` (regenerate with `npm run parse:decision-nodes` after parser edits).
- **Pick target first:** row target → **Row note**; time block → **Block time** (app auto-suggests). Final / handover / orders = shift-level, choose manually on a time block.

</details>

<details>
<summary><strong>How to use Smart select (supervisor quick pick)</strong> — Pre-check a subset when you cannot review every question.</summary>

1. Set **Library**, **Note type**, **Mode**, **Branch**, and **Depth** first (Smart select only affects **visible** questions).
2. Tap **Essential**, **Standard**, **Supervisor focus**, **Complete** (full pack in filter), or **All visible** in Decision Engine.
3. **Complete** = real annotation for what’s on screen; use **Full branch**, **Block time**, **Baseplan/Careplan**, **Depth 3–5** — not Selective branch + Refusal only (that stays a small slice).
4. A **summary** lists what was checked; tap **×** to undo that Smart select batch only (keeps manual checks). **Clear visible** clears everything in the filter.
5. Review checkboxes, tweak, **lock** → **Final Assign** → DSP **bubble** asks that same set.
6. Logic: `decisionAlgo/smartSelection.js` (rule-based; not a second AI interview).

</details>

<details>
<summary><strong>How to fix port 8787 in use</strong> — Free the API port when `npm run server` fails.</summary>

1. Run `lsof -nP -iTCP:8787 -sTCP:LISTEN`.
2. Note the PID and run `kill <PID>`.
3. Run `npm run server` again.

</details>

<details>
<summary><strong>Where to look in the codebase</strong> — Quick map of main files.</summary>

| Topic | File |
|--------|------|
| App UI | `App.js` |
| Client profiles | `clientProfiles.js` |
| Shift intelligence | `shiftIntelligence.js` |
| SQLite + API | `server/storage.js`, `server/index.js` |
| Therap sync | `server/therapSync.js` |
| Setup docs | `README.md` |

</details>

---

## Playbooks and workflows

### Playbook base workflows

- morning-adl
- feeding-support
- in-home-leisure
- community-outing
- return-home
- behavior-support
- communication-support
- medication-support
- case-note-final

### Detailed labels

- morning-adl = morning ADL support
- feeding-support = meal / feeding support
- in-home-leisure = rest, leisure, or pre-outing prep
- community-outing = community participation block
- return-home = return-home transition block
- behavior-support = behavior intervention documentation
- communication-support = hearing / communication support
- medication-support = medication or oxygen-related support
- case-note-final = final whole-shift note flow

There are 2 paths playbook.

---

## Care Plan library categories

Top-level categories to consider:

- Risks
- Goals and Outcomes
- Interventions and Staff Supports
- ADL and Personal Care
- Mobility and Transfer Support
- Nutrition, Diet, and Swallowing
- Medication and Health Supports
- Behavior and Emotional Regulation
- Communication and Sensory Support
- Supervision and Safety
- Community Participation and Social Boundaries
- Clinical Precautions and Medical Conditions
- Sleep, Rest, and Fatigue Patterns
- Elimination and Toileting Support
- Routine, Transition, and Structure Needs
- Equipment and Assistive Device Supports
- Escalation, Incident, and Emergency Guidance
- Documentation Priorities

### Tighter set (fewer categories)

- Risks
- Goals
- Interventions
- ADL Support
- Mobility and Safety
- Nutrition and Health
- Behavior Support
- Communication Support
- Supervision
- Community and Social Support
- Medical and Clinical Precautions
- Transitions and Routines
- Equipment Supports
- Emergency and Escalation Guidance

### Most important for current demo

- Risks
- Goals
- Interventions
- ADL Support
- Mobility and Safety
- Nutrition and Health
- Communication Support
- Supervision
- Community and Social Support

---

## Runtime library categories

### Full set

- Overdue and Outstanding Tasks
- Appointments and Schedule
- Medications and Due Health Tasks
- Active Alerts and Cautions
- Incomplete Goals and Carryover Items
- Shift Handoff and Follow-Up
- Current Environment and Context
- Current Symptoms, Incidents, or Status Changes
- Staff Actions Needed This Block
- Documentation Status and Readiness

### Tighter set

- Overdue
- Schedule
- Medications Due
- Alerts
- Incomplete Goals
- Handoff and Follow-Up
- Environment
- Current Status Changes
- Documentation Readiness

### Most relevant for current demo

- Overdue
- Appointments and Schedule
- Medications Due
- Alerts
- Incomplete Goals
- Shift Handoff and Follow-Up
- Documentation Readiness

---

## UI and implementation

To raise the dropdown above overlapping content: use **z-index**, plus **`overflow: visible`** on parent containers.

---

## Playbook module fields

You assign a category module to a client’s playbook; the engine runs that module’s questions from assignment rules.

### `id`

Unique name for the module (e.g. `risk-fall`). How the system identifies that reusable package.

### `category`

Top-level bucket (e.g. `risk`). Other examples: `compliance`, `hydration`, `behavior`, `medication`, `communication`. Mostly for organizing the library.

### `subcategory`

Specific package inside the category (e.g. `fall-risk`). Example: category = `risk`, subcategory = `fall-risk`. Library paths like `risk / fall-risk`, `risk / aspiration`, `communication / hearing-support`.

### `maxDepthAvailable`

How deep this module can go (e.g. `C` = depths A, B, C). If the client is assigned only depth `A`, the engine stops at A even if B and C exist.

### `entryQuestions`

First questions when the module activates — the “start here” questions.

Example for `fall-risk`:

- Was fall-prevention supervision maintained?
- Was mobility support needed this block?

### `branchQuestions`

Follow-ups only when an answer triggers them.

Example: if DSP says “No” to fall-prevention supervision:

- Was the lapse brief or ongoing?
- Was supervisor notified?
- Was the client redirected to a safer position?

`entryQuestions` start the module; `branchQuestions` deepen it.

### `triggerConditions`

When the module should run. Examples:

- client has `fall risk`
- block is `morning-adl`
- active alert contains `fall`
- previous answer contains `refused`
- hydration answer was `No`

### `required` or `conditional`

- **required** — if assigned, always runs (e.g. hydration monitoring).
- **conditional** — only when conditions match (e.g. refusal follow-up after a refusal).

### `priority`

Ordering when many modules are assigned (`1` first, then `2`, etc.). Typical order: safety/risk → compliance → behavior/context → AI follow-up → readiness.

### `dedupeThemes`

Avoid duplicate questions across base playbook and modules. Example: `dedupeThemes: ["mobility", "supervision"]` — engine skips if theme already covered.

### Full module example

- `id`: `risk-fall`
- `category`: `risk`
- `subcategory`: `fall-risk`
- `maxDepthAvailable`: `C`
- `entryQuestions`: supervision maintained? mobility support needed?
- `branchQuestions`: escalation if no supervision; transfer details if mobility issue
- `triggerConditions`: client has fall risk; workflow `morning-adl` or `community-outing`
- `requiredOrConditional`: `required`
- `priority`: `1`
- `dedupeThemes`: `["mobility", "supervision"]`

For Mary Bet’s `morning-adl` playbook, assign `risk-fall` at depth `B`. Engine: load base playbook → check triggers → activate module → entry questions → branches up to depth B → dedupe themes.

### Design rules

- A playbook should store **module assignments**, not every question inline.
- **Playbook** = fixed workflow skeleton
- **Module library** = reusable category packages
- **Assignment** = which modules this client/block uses
- **Engine** = what actually gets asked

---

## Local dev

If `npm run server` fails with `EADDRINUSE` on port 8787, another process is listening.

```bash
lsof -nP -iTCP:8787 -sTCP:LISTEN
kill <PID>
npm run server
```
