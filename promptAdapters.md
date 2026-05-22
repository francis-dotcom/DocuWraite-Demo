# Prompt Adapters

Temporary working note for answer-triggered AI drill-down behavior in ADL workflows.

## Model

- Blue flag = normal / stable answer, usually no drill-down needed
- Yellow flag = depth 1 follow-up
- Red flag = depth 2 follow-up

## Blue Flags

These answers are usually routine and may not need additional drill-down unless combined with another concern.

- `Completed`
- `Not needed`
- `Alternative completed`
- `Independent`
- `Supervision only`
- `Verbal prompt`
- `Visual prompt`
- `Standby assist`
- `Engaged`
- `Re-engaged`
- `Cooperative`
- `Tolerated well`
- `No unusual response observed`
- `None`
- `No unusual finding`

## Yellow Flags

These answers should usually trigger one additional clarifying question.

- `Partially completed`
- `Interrupted`
- `Hesitant`
- `Distracted`
- `Withdrawn`
- `Refused initially`
- `Required repeated prompting`
- `Required repeated cueing`
- `Accepted redirection`
- `Needed step-by-step cueing`
- `Tolerated with support`
- `Poor tolerance`
- `Needed extra cueing`
- `Clothing refusal`
- `Refused product or step`
- `Weakness or fatigue`
- `Equipment difficulty`
- `Change in baseline`

## Red Flags

These answers should usually trigger deeper follow-up and escalation-oriented questions.

- `Refused`
- `Not completed`
- `Safety prevented completion`
- `Resistant`
- `Declined further support`
- `Demonstrated discomfort`
- `Unsafe balance`
- `Dizziness or weakness`
- `Pain with bathing`
- `Pain with toileting`
- `Pain with transfer`
- `Skin redness`
- `Skin breakdown concern`
- `Foul-smelling urine`
- `Cloudy urine`
- `Blood observed`
- `Increased frequency`
- `Constipation concern`
- `Incontinence episode`
- `Near fall concern`
- `Minor bleeding concern`
- `Oral discomfort`
- `Refusal or guarding`
- `Nurse notification needed`
- `Supervisor notification needed`
- `Incident follow-up needed`

## Intent

- Yellow = needs more detail
- Red = needs escalation, safety detail, or clinical follow-up detail

## AI Response by Flag Level

### Blue

- no extra drill-down
- write normally
- keep note concise
- do not over-escalate

### Yellow

- ask 1 follow-up question
- clarify what happened
- clarify staff response
- clarify whether task still finished or partially finished
- then write the note with slightly more detail

Suggested yellow follow-up patterns:

- `What support or redirection helped the person continue?`
- `Was the task completed after prompting?`
- `What was the observed response after staff intervention?`

### Red

- ask deeper follow-up questions
- ask no more than 5 questions total based on DSP documentation
- clarify what happened
- clarify immediate staff action
- clarify client response
- clarify safety or clinical concern
- clarify who was notified or what follow-up is needed
- then write the note in a concern-forward way

Suggested red follow-up patterns:

- `What exactly happened?`
- `What did staff do immediately?`
- `Was safety affected?`
- `Was anyone notified?`
- `What follow-up is required?`

## Writing Behavior

- blue = routine tone
- yellow = clarified routine note
- red = supervisory / escalation-aware note

## Simple Rule

- Blue = write
- Yellow = ask once, then write
- Red = ask deeper, then write carefully

## Linking to Prompt Builder

Recommended pattern:

1. Read answers from the workflow answer state
2. Derive flags from answers
3. Convert flags into prompt behavior
4. Inject those directives into the prompt builder

Suggested architecture:

- `.logic.json`
  defines questions and choices
- `aiQuestionSession.js`
  manages question flow
- `answerFlagAdapter.js`
  maps answers to `blue / yellow / red`
- `aiPromptBuilder.js`
  consumes the flag result and adds prompt instructions

Suggested helper:

- `AILogic/engine/answerFlagAdapter.js`

Suggested return shape:

```js
{
  highestFlag: "yellow",
  matchedAnswers: ["Partially completed", "Required repeated prompting"],
  maxFollowUps: 3,
  promptDirectives: [
    "Ask up to 3 clarifying questions.",
    "Clarify what happened.",
    "Clarify staff response.",
    "Clarify whether the task was completed."
  ]
}
```

Suggested prompt-builder behavior:

- append `flagState.promptDirectives` into the system prompt or user prompt
- use the flag state to control follow-up intensity
- keep blue routine, yellow clarifying, red escalation-aware

## Final Note Style Choices

Final-note style choices should help the AI as writing guidance only.

- `summary`
  - write more compressed and high-level
- `technical`
  - write more formal, clinical, documentation-style wording
- `supervisory`
  - emphasize oversight, follow-up, and carry-forward needs

These style choices should:

- shape tone
- shape wording
- shape compression
- shape emphasis order

These style choices should not:

- become printed facts in the note
- replace documented facts
- invent events

## Final Note Style + Flag Behavior

- `blue` + any style
  - write directly from documented facts
  - no extra follow-up questions

- `yellow` + any style
  - ask `1 to 3` clarification questions max
  - use the selected style only for wording, not for inventing content

- `red` + any style
  - ask `2 to 5` clarification questions max
  - use the selected style only for wording, while keeping the note concern-forward and follow-up-aware
