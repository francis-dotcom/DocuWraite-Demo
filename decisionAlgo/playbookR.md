# DocuWraite Playbook Architecture

## 0.0 Conventions

- `Base-P` = level 0
- `1` = level 1
- `A` = level 2
- `a` = level 3
- `I` = level 4
- `i` = level 5

## 0.0.1 Core Model

- `0.1 Base-P` is the correct foundational playbook layer.
- `0.2 Care Plan` does not replace `Base-P`; it adds client-specific truth that must shape documentation.
- `0.3 Runtime` does not replace `Base-P`; it adds live shift conditions, events, alerts, and carryover context.
- `0.4 Outputs` defines what the engine produces after combining `Base-P`, `Care Plan`, and `Runtime`.
- `0.5 Rules` defines the branching, injection, ordering, and blocking logic across the cores.
- `0.6 QA or Validation` defines when documentation is complete, compliant, and ready to use.
- `0.7 Examples` shows how the full layered system behaves in real DSP documentation scenarios.

## 0.0.2 System Interpretation

- The system is for DSP documentation support, not generic Q and A.
- `Base-P` should stay stable because it represents the default module workflow skeleton.
- Some documentation needs are directly handled by `Base-P`.
- Some documentation needs do not exist in the base skeleton and must be injected from `Care Plan` or `Runtime`.
- If a care-plan requirement or runtime condition cannot be satisfied by the base questions alone, the engine should open a requirement-based or module-based decision tree.
- The final workflow is therefore:
  - `Base-P` as the default path
  - `Care Plan` as the client-specific documentation layer
  - `Runtime` as the live shift-specific documentation layer
  - `Rules` as the decision-tree engine
  - `QA or Validation` as the readiness gate
  - `Outputs` as the documentation artifacts produced for the DSP

## 0.0.3 Design Rules

- Base playbooks define the fixed workflow skeleton.
- Care plan modules define stable client truth.
- Runtime modules define shift-specific or day-specific context.
- Outputs define what the engine produces.
- Rules define how the engine assembles, deduplicates, branches, and blocks.
- QA or Validation defines what makes documentation complete, compliant, and usable.
- Examples define reference scenarios for product, QA, and training.

## 0.0.4 Standard Section Template

Every production section should follow this structure:

- `A. level-2 core tree`
  Core decision points or question classes.
- `B. level-3 expanded detail`
  Structured sub-options and refined interpretation.
- `C. level-4 branch logic`
  Conditional follow-up logic or routing behavior.
- `D. level-5 deep documentation tree`
  High-fidelity documentation or engine interpretation detail.
- `E. output steps`
  Why the section exists and what it should produce or influence.

---

## 0.1 Base-P

- `Purpose:`
  `Base-P` is the correct foundational module playbook. It defines the default documentation skeleton for each workflow before any care-plan or runtime enrichment is applied.
- `Interpretation:`
  `Base-P` should not be rewritten to carry every possible client-specific requirement. It should remain the clean default path that later cores can enrich, branch, or block.

### 1. morning-adl

- `A. level-2 core tree`
  - `a. adl-areas`
    - `Q:` Which ADL supports were provided?
    - `Choices:`
      - Toileting
      - Dressing
      - Oral hygiene
      - Grooming
      - Other
  - `b. hygiene-support`
    - `Q:` Was hygiene support provided?
    - `Choices:`
      - Yes
      - No
  - `c. prompt-level`
    - `Q:` What prompt level was used?
    - `Choices:`
      - Verbal prompt
      - Partial assist
      - Total assist
      - Refused
  - `d. mobility-support`
    - `Q:` Was mobility or fall-prevention support provided?
    - `Choices:`
      - Yes
      - No
  - `e. hydration`
    - `Q:` Was hydration offered or monitored?
    - `Choices:`
      - Yes
      - No
      - Not needed

- `B. level-3 expanded detail`
  - `a. adl-areas detail`
    - `Q:` Which specific ADLs were supported?
  - `b. hygiene-support detail`
    - `Q:` Which hygiene supports were provided, or why were they not provided?
  - `c. prompt-level detail`
    - `Q:` Which tasks matched the selected prompt level?
  - `d. mobility-support detail`
    - `Q:` What type of mobility support was used?
  - `e. hydration detail`
    - `Q:` Was hydration offered, monitored, both, or deferred?

- `C. level-4 branch logic`
  - If `hygiene-support = No`, ask why and whether follow-up is needed.
  - If `prompt-level = Refused`, ask what was refused and how staff responded.
  - If `mobility-support = Yes`, ask whether transitions were completed safely.
  - If `hydration = No`, ask whether hydration should be revisited later.

- `D. level-5 deep documentation tree`
  - Describe exact support rendered for each ADL.
  - Record least restrictive effective prompt level.
  - Record whether support matched baseline care-plan expectations.
  - Record observed response, tolerance, safety, and dignity.

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - fall prevention
      - hygiene and dignity
      - prompt level documentation
      - hydration monitoring
  - `b. draft-step`
    - `Q:` Generated documentation

### 2. feeding-support

- `A. level-2 core tree`
  - `a. meal-type`
    - `Q:` What meal support was provided?
    - `Choices:`
      - Breakfast
      - Lunch
      - Snack
      - Fluid support only
      - Other
  - `b. aspiration`
    - `Q:` Were aspiration precautions followed?
    - `Choices:`
      - Yes
      - No
  - `c. fluids`
    - `Q:` Were fluids offered or monitored?
    - `Choices:`
      - Yes
      - No
      - Not needed
  - `d. response`
    - `Q:` How did the person respond during the meal?
    - `Choices:`
      - Ate with prompts
      - Needed pacing cues
      - Tolerated fluids well
      - Refused part of meal

- `B. level-3 expanded detail`
  - Clarify meal context, aspiration supports, fluid handling, and response type.

- `C. level-4 branch logic`
  - If aspiration precautions were not followed, ask about safety concern and follow-up.
  - If fluids were refused or not addressed, ask whether another hydration attempt is needed.
  - If meal was partially refused, ask whether re-offer or escalation occurred.

- `D. level-5 deep documentation tree`
  - Record diet alignment, pacing, positioning, intake, tolerance, refusal, and observed response.

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - aspiration precautions
      - diet compliance
      - hydration monitoring
      - observed response
  - `b. draft-step`
    - `Q:` Generated documentation

### 3. in-home-leisure

- `A. level-2 core tree`
  - `a. activity`
    - `Q:` What in-home activity occurred?
    - `Choices:`
      - Rest or nap
      - Leisure in home
      - Pre-outing preparation
      - Personal care
      - Other
  - `b. response`
    - `Q:` How did the person respond?
    - `Choices:`
      - Calm and engaged
      - Needed prompts
      - Became fatigued
      - Preferred to stay in room
  - `c. outing-prep`
    - `Q:` Was outing preparation completed?
    - `Choices:`
      - Yes
      - No
      - Not applicable

- `B. level-3 expanded detail`
  - Clarify activity type, engagement level, fatigue signs, and preparation details.

- `C. level-4 branch logic`
  - If fatigue is present, ask whether rest or reduced pace was provided.
  - If outing preparation was not completed, ask whether follow-up is needed later.

- `D. level-5 deep documentation tree`
  - Record support rendered, participation quality, rest needs, and transition readiness.

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - fatigue monitoring
      - engagement support
      - transition readiness
      - observed response
  - `b. draft-step`
    - `Q:` Generated documentation

### 4. community-outing

- `A. level-2 core tree`
  - `a. attended`
    - `Q:` Did the person attend the outing?
    - `Choices:`
      - Yes
      - No
  - `b. location`
    - `Q:` Where did the outing occur?
    - `Choices:`
      - Store
      - Salon
      - Restaurant
      - Walk or outdoor activity
      - Other
  - `c. response`
    - `Q:` How did the person respond in the community?
    - `Choices:`
      - Participated well
      - Needed redirection
      - Became fatigued
      - Preferred to return home
  - `d. mobility`
    - `Q:` Was mobility support provided?
    - `Choices:`
      - Yes
      - No
  - `e. hydration`
    - `Q:` Was hydration offered or monitored?
    - `Choices:`
      - Yes
      - No
      - Not needed

- `B. level-3 expanded detail`
  - Clarify outing completion, location-specific support, community behavior, mobility, and hydration.

- `C. level-4 branch logic`
  - If not attended, ask why and whether an alternative support or activity was provided.
  - If fatigue occurred, ask whether outing pace was reduced or outing was shortened.
  - If redirection was needed, ask whether it resolved the issue.

- `D. level-5 deep documentation tree`
  - Record participation, safety, redirection, mobility, endurance, hydration, and return-home rationale.

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - community participation
      - mobility and safety
      - hydration monitoring
      - observed response
  - `b. draft-step`
    - `Q:` Generated documentation

### 5. return-home

- `A. level-2 core tree`
  - `a. transition`
    - `Q:` How did the return-home transition go?
    - `Choices:`
      - Smooth
      - Needed prompts
      - Fatigue noted
      - Needed immediate rest
  - `b. hydration`
    - `Q:` Was hydration offered or monitored?
    - `Choices:`
      - Yes
      - No
      - Not needed
  - `c. routine`
    - `Q:` Was the home routine resumed?
    - `Choices:`
      - Yes
      - No
      - Partially

- `B. level-3 expanded detail`
  - Clarify transition support, hydration handling, and what routine was resumed or deferred.

- `C. level-4 branch logic`
  - If fatigue was noted, ask whether activity was reduced or rest support was needed.
  - If routine was only partial or not resumed, ask whether follow-up is planned.

- `D. level-5 deep documentation tree`
  - Record transition tolerance, fatigue, routine continuity, hydration, and next-phase readiness.

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - safe transitions
      - hydration monitoring
      - routine continuity
      - observed response
  - `b. draft-step`
    - `Q:` Generated documentation

### 6. behavior-support

- `A. level-2 core tree`
  - `a. behavior-observed`
    - `Q:` What behavior or concern was observed?
    - `Choices:`
      - Agitation
      - Verbal refusal
      - Social-boundary issue
      - Escalation
      - Other
  - `b. intervention-used`
    - `Q:` What intervention was used?
    - `Choices:`
      - Redirection
      - Verbal support
      - Reduced stimulation
      - Supervisor notified
      - Other
  - `c. response`
    - `Q:` How did the person respond?
    - `Choices:`
      - Calmed with support
      - Accepted redirection
      - Needed repeated prompts
      - Behavior continued
      - Other

- `B. level-3 expanded detail`
  - Clarify antecedent, intervention type, response type, and support outcome.

- `C. level-4 branch logic`
  - If behavior continued, ask about escalation, supervisor notification, or plan change.
  - If repeated prompting was needed, ask whether ongoing monitoring is required.

- `D. level-5 deep documentation tree`
  - Record antecedent, behavior, intervention sequence, least restrictive support, and outcome.

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - behavior management
      - staff intervention
      - observed response
      - escalation awareness
  - `b. draft-step`
    - `Q:` Generated documentation

### 7. communication-support

- `A. level-2 core tree`
  - `a. communication-support`
    - `Q:` What communication support was used?
    - `Choices:`
      - Hearing-aid support
      - Repeat-back prompts
      - One-step cueing
      - Slow pacing and clarification
      - Other
  - `b. hearing-aid-check`
    - `Q:` Was hearing-aid or hearing support checked?
    - `Choices:`
      - Yes
      - No
      - Not applicable
  - `c. response`
    - `Q:` How did the person respond to communication support?
    - `Choices:`
      - Understood with prompts
      - Repeated back instructions
      - Needed extra clarification
      - Reported hearing difficulty
      - Other

- `B. level-3 expanded detail`
  - Clarify support type, hearing-device status, comprehension, and communication barriers.

- `C. level-4 branch logic`
  - If hearing difficulty is reported, ask whether follow-up or escalation is needed.
  - If extra clarification was needed, ask whether another strategy was used.

- `D. level-5 deep documentation tree`
  - Record communication strategy, device status, comprehension level, and impact on care or safety.

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - communication access
      - hearing support
      - comprehension
      - observed response
  - `b. draft-step`
    - `Q:` Generated documentation

### 8. medication-support

- `A. level-2 core tree`
  - `a. medication-type`
    - `Q:` What medication or health support occurred?
    - `Choices:`
      - Scheduled medication
      - PRN medication
      - Oxygen support
      - Medication reminder only
      - Other
  - `b. medication-timing`
    - `Q:` Was the medication or support on time?
    - `Choices:`
      - Yes
      - Delayed
      - Deferred
      - Not applicable
  - `c. response`
    - `Q:` How did the person respond?
    - `Choices:`
      - Accepted support
      - Tolerated without issue
      - Needed prompting
      - Reported discomfort
      - Other

- `B. level-3 expanded detail`
  - Clarify support type, timing variance, prompting, tolerance, and symptoms.

- `C. level-4 branch logic`
  - If delayed or deferred, ask whether follow-up or escalation was needed.
  - If discomfort was reported, ask whether clinical follow-up was required.

- `D. level-5 deep documentation tree`
  - Record exact support rendered, timing, tolerance, symptoms, and downstream monitoring.

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - medication compliance
      - health supports
      - timing
      - observed response
  - `b. draft-step`
    - `Q:` Generated documentation

### 9. case-note-final

- `A. level-2 core tree`
  - `a. summary-focus`
    - `Q:` What should the final note focus on?
    - `Choices:`
      - Overall shift summary
      - Behavior and interventions
      - Health and safety supports
      - Goal progress and transitions

- `B. level-3 expanded detail`
  - Clarify what shift-wide content must be summarized.

- `C. level-4 branch logic`
  - Ask whether support rendered, observed response, safety, or follow-up should be emphasized.

- `D. level-5 deep documentation tree`
  - Consolidate multi-block support, response, unresolved issues, and handoff needs.

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - whole-shift summary
      - handoff clarity
      - support rendered
      - follow-up needs
  - `b. draft-step`
    - `Q:` Generated documentation

---

## 0.2 Care Plan

- `Purpose:`
  `Care Plan` adds the stable client-specific truth that must shape documentation requirements for the DSP.
- `Interpretation:`
  This layer defines risks, goals, supports, interventions, supervision, dietary rules, medications, behavior expectations, and documentation priorities that may inject additional questions beyond `Base-P`.
- `Decision-tree role:`
  If a required care-plan item is not fully represented in the base module questions, this layer should trigger requirement-based follow-up questions or microflows.

### 1. risks

- `A. level-2 core tree`
  - `a. fall-risk`
    - `Q:` Is fall risk active in the care plan?
    - `Choices:`
      - Yes
      - No
      - Not needed
  - `b. aspiration-risk`
    - `Q:` Is aspiration or choking risk active in the care plan?
    - `Choices:`
      - Yes
      - No
      - Not needed
  - `c. elopement-risk`
    - `Q:` Is elopement or exit-seeking risk active in the care plan?
    - `Choices:`
      - Yes
      - No
      - Not needed
  - `d. communication-barriers`
    - `Q:` Are communication barriers documented in the care plan?
    - `Choices:`
      - Yes
      - No
      - Not needed
  - `e. behavior-escalation-risk`
    - `Q:` Is escalation or refusal risk documented in the care plan?
    - `Choices:`
      - Yes
      - No
      - Not needed

- `B. level-3 expanded detail`
  - `Q:` What exact support is required for each active risk?
  - `Q:` In what setting is the risk most likely to appear?
  - `Q:` What staff precaution must be visible in documentation?
  - `Q:` What known trigger, pattern, or warning sign should the DSP watch for?

- `C. level-4 branch logic`
  - If `fall-risk = Yes`, inject mobility, transfer, supervision, and instability questions into affected workflows.
  - If `aspiration-risk = Yes`, inject meal supervision, pacing, swallowing, and tolerance questions into feeding workflows.
  - If `elopement-risk = Yes`, inject supervision, redirection, and return-to-safe-setting questions into community and transition workflows.
  - If `communication-barriers = Yes`, inject comprehension, cueing, and clarification questions into workflows where instructions matter.
  - If `behavior-escalation-risk = Yes`, inject refusal, agitation, antecedent, intervention, and response questions when behavior concerns appear.

- `D. level-5 deep documentation tree`
  - `Q:` Was the required risk support actually rendered?
  - `Q:` Did the person show any warning signs, instability, coughing, wandering, refusal, or confusion?
  - `Q:` Did staff need to escalate, notify, re-offer, reduce demand, or increase supervision?
  - `Q:` What exact wording must appear in the note so the risk response is defensible?

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - risk awareness
      - supervision needs
      - safety planning
      - escalation prevention

### 2. goals-and-outcomes

- `A. level-2 core tree`
  - `a. ADL-independence`
  - `b. community-participation`
  - `c. behavior-management`
  - `d. health-and-safety`
  - Each asks whether the goal is active with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - `Q:` What does progress look like for this goal during one documentation block?
  - `Q:` What would count as partial progress, no progress, or regression?
  - `Q:` What staff action usually supports this goal?

- `C. level-4 branch logic`
  - If `ADL-independence = Yes`, ask what part of the task the person completed versus needed help with.
  - If `community-participation = Yes`, ask whether the person engaged, tolerated the activity, and completed the outing or transition.
  - If `behavior-management = Yes`, ask what regulation or redirection support was used and whether it worked.
  - If `health-and-safety = Yes`, ask what health or safety support was addressed this block.

- `D. level-5 deep documentation tree`
  - `Q:` What exact evidence shows progress for this goal?
  - `Q:` What exact evidence shows the goal was not addressed or needs carryover?
  - `Q:` Should this goal appear in the row note, final note, or both?

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - measurable progress
      - goal alignment
      - outcome tracking
      - support planning

### 3. interventions-and-staff-supports

- `A. level-2 core tree`
  - `a. verbal-cueing`
  - `b. mobility-supervision`
  - `c. redirection`
  - `d. environmental-support`
  - `e. prompting-and-assistance`
  - Each asks whether the intervention is part of the care plan with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - `Q:` Which version of the intervention is expected?
  - `Q:` How much prompting or assistance is typical before escalation?
  - `Q:` When is the intervention supposed to be used?

- `C. level-4 branch logic`
  - If `verbal-cueing = Yes`, ask what instruction or cue was given and whether it worked.
  - If `mobility-supervision = Yes`, ask whether standby, physical assist, equipment, or transfer support was used.
  - If `redirection = Yes`, ask what behavior or refusal triggered it and how the person responded.
  - If `environmental-support = Yes`, ask what change was made to the setting and whether it improved participation.
  - If `prompting-and-assistance = Yes`, ask for least restrictive prompt level used.

- `D. level-5 deep documentation tree`
  - `Q:` What support was rendered first?
  - `Q:` Was the least restrictive effective intervention used?
  - `Q:` Did staff have to intensify support, notify, or change the plan?
  - `Q:` What exact intervention wording must appear in the note?

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - consistent staff response
      - least restrictive support
      - intervention clarity
      - reproducible care delivery

### 4. ADL-and-personal-care

- `A. level-2 core tree`
  - `a. hygiene-support`
  - `b. dressing-support`
  - `c. toileting-support`
  - `d. dignity-and-privacy`
  - Each asks whether the category is defined in the care plan with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - `Q:` What ADL task was supported?
  - `Q:` What level of help was required?
  - `Q:` What dignity, privacy, or refusal considerations applied?

- `C. level-4 branch logic`
  - If hygiene or toileting support is active, ask whether prompts, physical assist, or standby supervision were used.
  - If dignity-and-privacy is active, ask whether privacy was maintained and whether any barrier affected care.
  - If the task was refused, ask what was refused, what re-offer occurred, and whether follow-up is needed later.

- `D. level-5 deep documentation tree`
  - `Q:` What task was completed, partially completed, or refused?
  - `Q:` What participation level did the person show?
  - `Q:` Were there skin, hygiene, safety, or tolerance observations that must be documented?

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - hygiene and dignity
      - ADL support accuracy
      - participation level
      - personal care consistency

### 5. mobility-and-transfer-support

- `A. level-2 core tree`
  - `a. ambulation`
  - `b. transfers`
  - `c. positioning`
  - `d. adaptive-equipment`
  - Each asks whether it is defined in the care plan with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - `Q:` What mobility or transfer support is required?
  - `Q:` What equipment, positioning, or transfer precaution applies?
  - `Q:` What sign of instability should the DSP document if observed?

- `C. level-4 branch logic`
  - If `ambulation = Yes`, ask whether the person walked independently, with cueing, with standby assist, or with physical support.
  - If `transfers = Yes`, ask whether transfers were safe and whether assistance or equipment was used.
  - If `positioning = Yes`, ask whether repositioning or seating support was completed.
  - If `adaptive-equipment = Yes`, ask whether the walker, wheelchair, gait belt, or other device was used correctly.

- `D. level-5 deep documentation tree`
  - `Q:` Was there any unsteadiness, near fall, or fall?
  - `Q:` Did staff need to increase support or notify anyone?
  - `Q:` What exact mobility evidence must appear in the note?

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - fall prevention
      - transfer safety
      - mobility support
      - equipment use

### 6. nutrition-diet-and-swallowing

- `A. level-2 core tree`
  - `a. diet-requirements`
  - `b. aspiration-precautions`
  - `c. hydration`
  - `d. meal-support`
  - Each asks whether it is defined in the care plan with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - `Q:` What diet rule or texture requirement applies?
  - `Q:` What swallow or aspiration precaution must staff follow?
  - `Q:` What hydration expectation or fluid goal should be documented?

- `C. level-4 branch logic`
  - If `diet-requirements = Yes`, ask whether the prescribed diet was followed.
  - If `aspiration-precautions = Yes`, ask whether supervision, pacing, positioning, or cueing was provided.
  - If `hydration = Yes`, ask whether fluids were encouraged, accepted, partially accepted, or refused.
  - If `meal-support = Yes`, ask what support rendered the meal safe and successful.

- `D. level-5 deep documentation tree`
  - `Q:` Was the person able to tolerate the meal or texture?
  - `Q:` Was coughing, choking concern, refusal, or poor intake observed?
  - `Q:` What exact meal-safety details must appear in documentation?

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - diet compliance
      - aspiration precautions
      - hydration support
      - nutrition safety

### 7. medication-and-health-supports

- `A. level-2 core tree`
  - `a. scheduled-medication`
  - `b. PRN-support`
  - `c. oxygen-support`
  - `d. health-monitoring`
  - Each asks whether it is defined in the care plan with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - `Q:` What medication, oxygen, or health task is expected?
  - `Q:` What timing rule matters for documentation?
  - `Q:` What symptom or side-effect monitoring is required?

- `C. level-4 branch logic`
  - If `scheduled-medication = Yes`, ask whether it was due, administered, delayed, or refused.
  - If `PRN-support = Yes`, ask what symptom or event led to PRN consideration.
  - If `oxygen-support = Yes`, ask whether the oxygen check or equipment review occurred.
  - If `health-monitoring = Yes`, ask what result, symptom, or observation was documented.

- `D. level-5 deep documentation tree`
  - `Q:` Was the support completed as expected?
  - `Q:` Was there refusal, partial compliance, side effects, or significant symptoms?
  - `Q:` Does this require escalation or handoff follow-up?

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - medication compliance
      - health monitoring
      - symptom follow-up
      - clinical awareness

### 8. behavior-and-emotional-regulation

- `A. level-2 core tree`
  - `a. agitation-support`
  - `b. refusal-support`
  - `c. emotional-regulation`
  - `d. social-boundary-support`
  - Each asks whether it is defined in the care plan with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - `Q:` What early sign or trigger usually appears first?
  - `Q:` What response sequence is expected from staff?
  - `Q:` What behavior detail must be captured if support is needed?

- `C. level-4 branch logic`
  - If `agitation-support = Yes`, ask what signs of agitation appeared and what calming strategy was used.
  - If `refusal-support = Yes`, ask what was refused and how staff re-offered or adapted support.
  - If `emotional-regulation = Yes`, ask what coping, pacing, or break support was used.
  - If `social-boundary-support = Yes`, ask whether redirection for boundaries was needed and effective.

- `D. level-5 deep documentation tree`
  - `Q:` Did the person calm, partially calm, continue, or escalate?
  - `Q:` Did staff stay least restrictive?
  - `Q:` What outcome and follow-up must be documented?

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - behavior stability
      - de-escalation planning
      - emotional regulation
      - safe participation

### 9. communication-and-sensory-support

- `A. level-2 core tree`
  - `a. hearing-support`
  - `b. comprehension-support`
  - `c. pacing-and-processing`
  - `d. sensory-support`
  - Each asks whether it is defined in the care plan with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - `Q:` What communication device or strategy is required?
  - `Q:` What sensory or pacing support helps comprehension?
  - `Q:` What barrier should be documented if the person does not understand?

- `C. level-4 branch logic`
  - If `hearing-support = Yes`, ask whether the device was checked and whether hearing affected care.
  - If `comprehension-support = Yes`, ask whether one-step cueing, repeat-back, or clarification was used.
  - If `pacing-and-processing = Yes`, ask whether extra time or simplified language was needed.
  - If `sensory-support = Yes`, ask what environmental change or sensory strategy supported participation.

- `D. level-5 deep documentation tree`
  - `Q:` Did the person understand with support?
  - `Q:` Was there a meaningful communication barrier that affected safety, participation, or compliance?
  - `Q:` What exact communication support wording must appear in the note?

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - communication access
      - comprehension support
      - sensory regulation
      - safer care delivery

### 10. supervision-and-safety

- `A. level-2 core tree`
  - `a. line-of-sight-supervision`
  - `b. within-arms-reach-support`
  - `c. safety-checkpoints`
  - `d. emergency-guidance`
  - Each asks whether it is defined in the care plan with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - `Q:` In what setting must supervision be maintained?
  - `Q:` During what task does supervision become non-negotiable?
  - `Q:` What safety check or emergency instruction must the DSP remember?

- `C. level-4 branch logic`
  - If `line-of-sight-supervision = Yes`, ask whether supervision was maintained continuously.
  - If `within-arms-reach-support = Yes`, ask whether close physical proximity was maintained when required.
  - If `safety-checkpoints = Yes`, ask whether the required check actually occurred.
  - If `emergency-guidance = Yes`, ask whether any event triggered that guidance.

- `D. level-5 deep documentation tree`
  - `Q:` Was there any lapse in supervision?
  - `Q:` Did that lapse create a safety concern, near miss, or escalation need?
  - `Q:` What compliance evidence must be visible before the note is ready?

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - continuous safety
      - supervision clarity
      - emergency readiness
      - compliance protection

### 11. community-participation-and-social-support

- `A. level-2 core tree`
  - `a. outing-readiness`
  - `b. community-navigation`
  - `c. social-boundaries`
  - `d. participation-quality`
  - Each asks whether it is defined in the care plan with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - `Q:` What preparation or cueing is needed before community participation?
  - `Q:` What location-specific support is expected?
  - `Q:` What participation or boundary issue is most likely to appear?

- `C. level-4 branch logic`
  - If `outing-readiness = Yes`, ask whether the person was prepared and able to go.
  - If `community-navigation = Yes`, ask what supervision, transportation, or mobility support was used.
  - If `social-boundaries = Yes`, ask whether boundary redirection was needed.
  - If `participation-quality = Yes`, ask whether the person engaged fully, partially, or needed to leave early.

- `D. level-5 deep documentation tree`
  - `Q:` Was the outing completed safely?
  - `Q:` Did fatigue, overstimulation, refusal, or behavior affect participation?
  - `Q:` What exact community outcome should be visible in the note?

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - community inclusion
      - social boundaries
      - readiness and tolerance
      - participation quality

### 12. routines-transitions-and-fatigue-patterns

- `A. level-2 core tree`
  - `a. morning-routine`
  - `b. community-transition`
  - `c. fatigue-patterns`
  - `d. rest-and-recovery`
  - Each asks whether it is defined in the care plan with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - `Q:` What part of the routine or transition tends to be difficult?
  - `Q:` What fatigue sign appears first?
  - `Q:` What recovery support usually helps?

- `C. level-4 branch logic`
  - If `morning-routine = Yes`, ask whether the normal sequence was followed or disrupted.
  - If `community-transition = Yes`, ask whether transition cueing, previewing, or pacing was needed.
  - If `fatigue-patterns = Yes`, ask whether fatigue was observed this block.
  - If `rest-and-recovery = Yes`, ask whether a break, reduced pace, or early return was needed.

- `D. level-5 deep documentation tree`
  - `Q:` What specific sign showed fatigue or transition difficulty?
  - `Q:` What support helped the person recover or continue?
  - `Q:` Should the issue carry into later documentation or final handoff?

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - smoother transitions
      - fatigue prevention
      - routine continuity
      - proactive support planning

### 13. documentation-priorities

- `A. level-2 core tree`
  - `a. staff-support-rendered`
  - `b. prompt-level-documentation`
  - `c. observed-response`
  - `d. compliance-themes`
  - Each asks whether it is required by the care plan with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - `Q:` Does the note clearly show staff support rendered?
  - `Q:` Does the note show prompt level or assistance level?
  - `Q:` Does the note show observed response and outcome?
  - `Q:` Does the note show any required compliance theme?

- `C. level-4 branch logic`
  - If staff support rendered is missing, trigger a required follow-up before note generation.
  - If prompt level is required but absent, trigger a warning or hard block depending on module.
  - If observed response is missing, route back to the relevant workflow question.
  - If compliance themes are missing, hold the note in readiness until resolved.

- `D. level-5 deep documentation tree`
  - `Q:` Is the note specific enough to defend what staff did?
  - `Q:` Is the note specific enough to defend how the person responded?
  - `Q:` What exact missing item keeps the note from being compliant?

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - documentation quality
      - compliance coverage
      - defensible notes
      - supervisor readability

---

## 0.3 Runtime

- `Purpose:`
  `Runtime` adds what is true for this shift, this block, this event, or this note at the moment documentation is being created.
- `Interpretation:`
  This includes live alerts, medications due, appointments, handoff items, incomplete goals, current incidents, and readiness status.
- `Decision-tree role:`
  If a live shift condition changes what the DSP must document, `Runtime` should inject or reorder questions even when `Base-P` is unchanged.

### 1. overdue-and-outstanding-tasks

- `A. level-2 core tree`
  - `a. daily-documentation`
  - `b. MAR-review-signature`
  - `c. behavior-data-entry`
  - `d. other-task`
  - Each asks whether the item is overdue or outstanding with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - `Q:` What task is still outstanding?
  - `Q:` Is it due now, overdue, or deferred?
  - `Q:` Who is responsible for completing it?
  - `Q:` Does it need to be mentioned in the current note?

- `C. level-4 branch logic`
  - If the outstanding item affects current documentation, inject a follow-up question before draft generation.
  - If the task is compliance-critical, block note readiness until acknowledged.
  - If the task belongs to another shift, ask whether it should appear in handoff.

- `D. level-5 deep documentation tree`
  - `Q:` Was the task completed, deferred, or handed off?
  - `Q:` If not completed, what follow-up or escalation is required?
  - `Q:` What exact task wording should appear in documentation?

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - operational follow-through
      - compliance visibility
      - readiness blocking
      - unresolved task awareness

### 2. appointments-and-schedule

- `A. level-2 core tree`
  - `a. scheduled-appointment`
  - `b. scheduled-outing`
  - `c. timing-impact`
  - Each asks whether the item is relevant with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - `Q:` What appointment or outing was scheduled?
  - `Q:` Did it occur this block, later, or not at all?
  - `Q:` How did the schedule affect documentation or support needs?

- `C. level-4 branch logic`
  - If an appointment occurs this block, inject prep, attendance, transportation, and tolerance questions.
  - If an appointment is later, ask whether current support was preparation for it.
  - If timing changed the routine, ask whether follow-up or handoff is needed.

- `D. level-5 deep documentation tree`
  - `Q:` Did the schedule change the care delivered this block?
  - `Q:` Did staff need to prep, remind, transport, or monitor after the event?
  - `Q:` What schedule detail should appear in the note?

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - schedule awareness
      - preparation context
      - timing-sensitive support
      - note accuracy

### 3. medications-due-and-health-tasks

- `A. level-2 core tree`
  - `a. medication-due`
  - `b. oxygen-check-due`
  - `c. other-health-task`
  - Each asks whether the item is relevant with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - `Q:` What medication, oxygen item, or health task was due?
  - `Q:` Was it completed, not due this block, deferred, or escalated?
  - `Q:` Was there any symptom, refusal, or tolerance issue?

- `C. level-4 branch logic`
  - If a medication or health task was due, inject the task into the active workflow before draft generation.
  - If the item was deferred or refused, trigger escalation or handoff follow-up questions.
  - If the item was not relevant this block, record that explicitly.

- `D. level-5 deep documentation tree`
  - `Q:` What exactly was completed?
  - `Q:` What exactly remains unresolved?
  - `Q:` What must appear in the note versus later handoff?

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - health-task visibility
      - medication follow-through
      - timing awareness
      - clinical continuity

### 4. active-alerts-and-cautions

- `A. level-2 core tree`
  - `a. fall-supervision-alert`
  - `b. aspiration-alert`
  - `c. hearing-support-alert`
  - `d. other-alert`
  - Each asks whether the alert is active with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - `Q:` Which alert or caution is active right now?
  - `Q:` What staff action was taken because of that alert?
  - `Q:` Did the alert change supervision, pacing, meal support, or communication support?

- `C. level-4 branch logic`
  - If `fall-supervision-alert = Yes`, inject mobility support and instability questions.
  - If `aspiration-alert = Yes`, inject meal supervision, coughing, choking concern, and tolerance questions.
  - If `hearing-support-alert = Yes`, inject hearing check, comprehension, and clarification questions.
  - If `other-alert = Yes`, ask what the alert was and what documentation it requires.

- `D. level-5 deep documentation tree`
  - `Q:` Was the alert addressed, not relevant, or needing follow-up?
  - `Q:` Did the alert create an escalation condition?
  - `Q:` What alert-handling evidence must appear before the note is ready?

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - active-risk visibility
      - deterministic compliance
      - alert handling
      - workflow safety

### 5. incomplete-goals-and-carryover-items

- `A. level-2 core tree`
  - `a. incomplete-goal`
  - `b. carryover-item`
  - `c. unresolved-priority`
  - Each asks whether the item is relevant with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - `Q:` What incomplete goal or carryover item is still open?
  - `Q:` Why is it still open?
  - `Q:` Does this block make progress on it?

- `C. level-4 branch logic`
  - If an incomplete goal is relevant, inject a goal-progress question into the workflow.
  - If a carryover item is unresolved, ask what action was taken this block.
  - If no progress was made, ask whether the issue must remain in handoff.

- `D. level-5 deep documentation tree`
  - `Q:` Was progress observed, not observed, or blocked?
  - `Q:` What next action is required?
  - `Q:` Should this appear in the final case note, handoff, or both?

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - continuity of care
      - carryover awareness
      - goal follow-through
      - unresolved priority visibility

### 6. shift-handoff-and-follow-up

- `A. level-2 core tree`
  - `a. handoff-item`
  - `b. follow-up-needed`
  - `c. later-shift-impact`
  - Each asks whether the item is relevant with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - `Q:` What must the next shift or next workflow know?
  - `Q:` Who needs the handoff?
  - `Q:` What follow-up still needs to happen?

- `C. level-4 branch logic`
  - If follow-up is required later this shift, persist it into later workflow context.
  - If follow-up is required for the next shift, inject it into handoff output.
  - If the item affects the overall story of the shift, require it in the final note.

- `D. level-5 deep documentation tree`
  - `Q:` Is this informational, urgent, or unresolved?
  - `Q:` What exact wording must survive into handoff?
  - `Q:` When can the item be considered closed?

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - handoff clarity
      - follow-up accountability
      - downstream context
      - shift continuity

### 7. documentation-readiness

- `A. level-2 core tree`
  - `a. confidence-status`
  - `b. note-quality-status`
  - `c. missing-items-status`
  - `d. draft-block-status`
  - Each asks whether the status should be active for the block with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - `Q:` Is readiness low because of missing support, missing response, missing compliance, or unresolved alert content?
  - `Q:` Is the note incomplete, vague, or blocked?
  - `Q:` What exact category of issue applies?

- `C. level-4 branch logic`
  - If a missing item maps to a workflow step, route the user back to that step.
  - If the issue is only quality-related, show a warning and allow revision.
  - If the issue is compliance-critical, block draft generation until resolved.

- `D. level-5 deep documentation tree`
  - `Q:` What exact missing item is preventing readiness?
  - `Q:` What exact question must the DSP answer to fix it?
  - `Q:` Should the fix update the row note, generated note, or final case note?

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - documentation quality
      - readiness visibility
      - safe draft generation
      - actionable remediation

---

## 0.4 Outputs

- `Purpose:`
  `Outputs` defines what the engine produces after resolving the layered documentation logic.
- `Interpretation:`
  Outputs are not raw prompts. They are documentation artifacts for the DSP, such as guided questions, structured answers, readiness states, generated note text, and audit trail records.

### 1. structured-answers

- `A. level-2 core tree`
  - `a. captured-response`
  - `b. normalized-values`
  - `c. mapped-themes`
  - Each asks whether the output is required with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - Clarify response formats, normalization, and theme mapping.

- `C. level-4 branch logic`
  - Determine whether normalized answers should satisfy downstream coverage and readiness checks.

- `D. level-5 deep documentation tree`
  - Define storage shape, canonical keys, custom-value handling, and theme coverage computation.

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - structured data integrity
      - downstream reliability
      - theme coverage
      - reusable workflow state

### 2. readiness-status

- `A. level-2 core tree`
  - `a. confidence`
  - `b. note-quality`
  - `c. missing-items`
  - `d. escalation-alerts`
  - Each asks whether the output is required with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - Clarify status classes and output severity.

- `C. level-4 branch logic`
  - Determine which statuses should trigger more questions, warnings, or hard blocks.

- `D. level-5 deep documentation tree`
  - Define confidence, quality, escalation, and remediation scoring logic.

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - readiness transparency
      - note quality control
      - escalation visibility
      - actionable guidance

### 3. generated-note

- `A. level-2 core tree`
  - `a. draft-note`
  - `b. final-note`
  - `c. note-insert-ready`
  - Each asks whether the output is required with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - Clarify output scope, emphasis, and minimum prerequisites.

- `C. level-4 branch logic`
  - Determine when generation is allowed, blocked, or gated behind review.

- `D. level-5 deep documentation tree`
  - Define prompt inputs, block reasons, merge behavior, and insert-safety requirements.

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - safe note generation
      - insert readiness
      - narrative usefulness
      - review accountability

### 4. audit-trail

- `A. level-2 core tree`
  - `a. answer-history`
  - `b. prompt-trace`
  - `c. decision-trace`
  - Each asks whether the output is required with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - Clarify retention depth and visibility for answers, traces, and decisions.

- `C. level-4 branch logic`
  - Determine what should remain user-visible versus internal-only.

- `D. level-5 deep documentation tree`
  - Define retention, debugging, supervisor visibility, and explainability requirements.

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - defensibility
      - workflow explainability
      - debugging support
      - supervisor review

---

## 0.5 Rules

- `Purpose:`
  `Rules` is the decision-tree engine across the cores.
- `Interpretation:`
  Rules determine when the system stays on the default base path and when it must inject, branch, dedupe, reorder, block, or deepen questioning because of care-plan or runtime requirements.

### 1. injection-rules

- `A. level-2 core tree`
  - `a. care-plan-injection`
  - `b. runtime-injection`
  - `c. followup-injection`
  - Each asks whether the rule is enabled with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - `Q:` Did the question come from Base-P, Care Plan, Runtime, or a prior answer?
  - `Q:` What exact condition caused the injection?
  - `Q:` Is the injected question optional, required, or blocking?

- `C. level-4 branch logic`
  - If a care-plan risk is active, inject its question before `why` and `draft`.
  - If a runtime alert is active, inject its microflow as soon as the affected module appears.
  - If a prior answer shows refusal, fatigue, or escalation, inject follow-up immediately.

- `D. level-5 deep documentation tree`
  - `Q:` What injected question was asked?
  - `Q:` Why was it inserted at that point in the workflow?
  - `Q:` Did another question already satisfy that requirement?

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - dynamic workflow assembly
      - deterministic prompting
      - context-aware questions
      - controlled complexity

### 2. branching-rules

- `A. level-2 core tree`
  - `a. fatigue-branch`
  - `b. refusal-branch`
  - `c. risk-branch`
  - Each asks whether the branch type is enabled with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - `Q:` What answer triggered the branch?
  - `Q:` Is the branch about refusal, fatigue, risk, escalation, or carryover?
  - `Q:` What follow-up class should open next?

- `C. level-4 branch logic`
  - If fatigue is reported, open recovery, reduced pace, and follow-up questions.
  - If refusal is reported, open re-offer, alternative support, and supervisor-notification questions.
  - If a risk event is reported, open the relevant safety microflow and escalation checks.
  - If the branch is safety-critical, require completion before draft generation.

- `D. level-5 deep documentation tree`
  - `Q:` Did the branch fully capture staff action and response?
  - `Q:` Does the branch need escalation output?
  - `Q:` Did the branch satisfy the missing compliance requirement?

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - adaptive questioning
      - targeted follow-up
      - risk-aware branching
      - reduced missed context

### 3. dedupe-and-ordering-rules

- `A. level-2 core tree`
  - `a. dedupe-themes`
  - `b. priority-order`
  - `c. step-collision-handling`
  - Each asks whether the rule is enabled with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - `Q:` Did two different questions cover the same documentation theme?
  - `Q:` Which version should appear first?
  - `Q:` Which question can be suppressed without losing compliance?

- `C. level-4 branch logic`
  - If a base question and injected question both cover hydration, keep the one with richer compliance detail.
  - If a runtime question is more urgent than a base question, move it earlier.
  - If suppressing a duplicate would remove required evidence, do not dedupe it.

- `D. level-5 deep documentation tree`
  - `Q:` Which step satisfied the requirement?
  - `Q:` Which duplicate step was suppressed?
  - `Q:` Can the engine explain why the order changed?

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - cleaner workflows
      - reduced duplication
      - stable ordering
      - better user experience

### 4. depth-and-stop-rules

- `A. level-2 core tree`
  - `a. depth-limit`
  - `b. stop-at-level`
  - `c. branch-depth-control`
  - Each asks whether the rule is enabled with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - Clarify supported depth levels, truncation behavior, and branch behavior at the limit.

- `C. level-4 branch logic`
  - Determine whether mandatory compliance or safety-critical branches can pierce depth limits.

- `D. level-5 deep documentation tree`
  - Define assignment model, exceptions, UI explanation, and prevention of branch explosion.

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - configurable complexity
      - controlled depth
      - scalable playbook design
      - predictable workflows

### 5. draft-and-readiness-rules

- `A. level-2 core tree`
  - `a. draft-blocking`
  - `b. readiness-check`
  - `c. final-review`
  - Each asks whether the rule is enabled with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - Clarify block conditions, readiness signals, and review requirements.

- `C. level-4 branch logic`
  - Determine hard blocks versus soft warnings and when extra review is required.

- `D. level-5 deep documentation tree`
  - Define missing-condition severity, workflow-specific readiness policy, and proof of review.

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - safe draft control
      - readiness discipline
      - review accountability
      - defensible note insertion

---

## 0.6 QA or Validation

- `Purpose:`
  `QA or Validation` determines whether the documentation is actually ready.
- `Interpretation:`
  This layer checks that required care-plan items, runtime conditions, staff actions, responses, risks, alerts, and follow-up needs were documented before output is accepted as complete.

### 1. completeness-validation

- `A. level-2 core tree`
  - `a. required-questions-answered`
  - `b. required-themes-covered`
  - `c. required-context-handled`
  - Each asks whether the validation is required with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - Clarify what counts as required questions, themes, and context.

- `C. level-4 branch logic`
  - Determine auto-routing, irrelevant context handling, and theme coverage acceptance.

- `D. level-5 deep documentation tree`
  - Define what counts as answered, covered, and handled.

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - completeness assurance
      - required coverage
      - context accountability
      - reliable drafts

### 2. quality-validation

- `A. level-2 core tree`
  - `a. vague-note-detection`
  - `b. missing-response-detection`
  - `c. weak-support-detail-detection`
  - Each asks whether the validation is required with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - Clarify weak-language patterns, support gaps, and response gaps.

- `C. level-4 branch logic`
  - Determine which issues are warnings, remediation targets, or blockers.

- `D. level-5 deep documentation tree`
  - Define signal quality, false-positive control, and corrective suggestion behavior.

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - stronger documentation
      - reduced vagueness
      - better support detail
      - clearer observed response

### 3. compliance-validation

- `A. level-2 core tree`
  - `a. supervision-check`
  - `b. safety-check`
  - `c. runtime-check`
  - Each asks whether the validation is required with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - Clarify which supervision, safety, and runtime obligations are enforceable.

- `C. level-4 branch logic`
  - Determine whether failures create warnings, escalations, or hard blocks.

- `D. level-5 deep documentation tree`
  - Define acceptable evidence, unresolved safety issues, and stale-runtime handling.

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - compliance protection
      - safety assurance
      - runtime accountability
      - defensible records

### 4. remediation-and-feedback

- `A. level-2 core tree`
  - `a. remediation-target`
  - `b. corrective-suggestion`
  - `c. severity-level`
  - Each asks whether the validation is required with:
    - Yes
    - No
    - Not needed

- `B. level-3 expanded detail`
  - Clarify targeting, suggestion style, and severity model.

- `C. level-4 branch logic`
  - Determine whether remediation is auto-routed, auto-suggested, or blocking.

- `D. level-5 deep documentation tree`
  - Define precision, useful phrasing, and consistent severity assignment.

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - actionable remediation
      - precise feedback
      - severity clarity
      - faster correction

---

## 0.7 Examples

- `Purpose:`
  `Examples` demonstrates how the full layered model behaves in practice for DSP documentation.
- `Interpretation:`
  Each example should show the relationship between `Base-P`, `Care Plan`, `Runtime`, `Rules`, `QA or Validation`, and the final `Outputs`.

### 1. morning-adl-example

- `A. level-2 core tree`
  - `a. scenario-type`
    - `Choices:`
      - Verbal prompt only
      - Partial assist
      - Total assist
      - Refusal follow-up
  - `b. support-focus`
    - `Choices:`
      - Hygiene
      - Mobility
      - Prompt level
      - Hydration

- `B. level-3 expanded detail`
  - Clarify what makes the example compliant, specific, and realistic.

- `C. level-4 branch logic`
  - If refusal appears, ensure the example shows re-offer, redirection, or escalation.

- `D. level-5 deep documentation tree`
  - Show what makes the example strong versus vague.

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - model note quality
      - ADL documentation clarity
      - support specificity
      - response visibility

### 2. feeding-support-example

- `A. level-2 core tree`
  - `a. scenario-type`
    - `Choices:`
      - Meal completed with prompts
      - Pacing cues needed
      - Fluid support only
      - Partial refusal
  - `b. safety-focus`
    - `Choices:`
      - Aspiration precautions
      - Hydration
      - Diet compliance
      - Observed response

- `B. level-3 expanded detail`
  - Clarify what a strong meal-support note should contain.

- `C. level-4 branch logic`
  - If refusal appears, ensure the example shows follow-up handling.

- `D. level-5 deep documentation tree`
  - Show clinical safety, support specificity, and defensibility.

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - nutrition note quality
      - aspiration visibility
      - hydration clarity
      - observed response

### 3. community-outing-example

- `A. level-2 core tree`
  - `a. scenario-type`
    - `Choices:`
      - Successful outing
      - Needed redirection
      - Fatigue during outing
      - Returned home early
  - `b. support-focus`
    - `Choices:`
      - Community participation
      - Mobility
      - Hydration
      - Social boundaries

- `B. level-3 expanded detail`
  - Clarify what realistic community-support documentation should look like.

- `C. level-4 branch logic`
  - If social-boundary support or fatigue occurs, ensure the example shows the adaptation clearly.

- `D. level-5 deep documentation tree`
  - Show participation, safety, tolerance, and realistic support detail.

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - community note quality
      - participation clarity
      - safety context
      - realistic redirection language

### 4. runtime-context-example

- `A. level-2 core tree`
  - `a. scenario-type`
    - `Choices:`
      - Active alert handled
      - Medication due item addressed
      - Appointment affected workflow
      - Incomplete goal surfaced
  - `b. engine-behavior`
    - `Choices:`
      - Injected runtime question
      - Readiness impact
      - Draft block
      - Follow-up requirement

- `B. level-3 expanded detail`
  - Clarify why runtime context appeared and how the engine responded.

- `C. level-4 branch logic`
  - If draft block is shown, include the remediation path.

- `D. level-5 deep documentation tree`
  - Show what makes runtime context operationally useful instead of passive UI noise.

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - runtime explainability
      - context-driven questioning
      - readiness understanding
      - operational clarity

### 5. validation-example

- `A. level-2 core tree`
  - `a. scenario-type`
    - `Choices:`
      - Prompt level missing
      - Response missing
      - Runtime alert unhandled
      - Draft blocked for compliance
  - `b. feedback-focus`
    - `Choices:`
      - Warning only
      - Remediation target
      - Severity escalation
      - Rewrite suggestion

- `B. level-3 expanded detail`
  - Clarify what failure occurred and how the system responded.

- `C. level-4 branch logic`
  - If draft block is shown, include the blocking rule and correction path.

- `D. level-5 deep documentation tree`
  - Show what makes the validation feedback understandable, actionable, and proportionate.

- `E. output steps`
  - `a. why-step`
    - `Q:` Why this matters
    - `Themes:`
      - validation clarity
      - actionable correction
      - better training examples
      - safer draft behavior
