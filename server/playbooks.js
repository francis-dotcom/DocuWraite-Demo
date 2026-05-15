const SHIFT_INTELLIGENCE = {
  appointments: ["Hair appointment 1:00 PM", "Community outing 2:30 PM"],
  medicationsDue: ["Oxygen check 12:00 PM", "Oxygen check 4:00 PM", "Oxygen check 7:00 AM"],
  alerts: ["Fall supervision required", "Aspiration precautions during meals", "Hearing-aid check due"],
};

const WORKFLOW_META = {
  "morning-adl": { eyebrow: "Morning ADL support" },
  "feeding-support": { eyebrow: "Feeding support" },
  "in-home-leisure": { eyebrow: "In-home leisure and rest" },
  "community-outing": { eyebrow: "Community outing detected" },
  "return-home": { eyebrow: "Return-home transition" },
  "behavior-support": { eyebrow: "Behavior support" },
  "communication-support": { eyebrow: "Communication support" },
  "medication-support": { eyebrow: "Medication support" },
  "case-note-final": { eyebrow: "Final case note" },
};

function getFieldTimeHint(fieldContext = {}) {
  const label = String(fieldContext.label || fieldContext.timeBlock || "").trim();
  if (label) {
    return ` during ${label}`;
  }

  const description = String(fieldContext.description || "");
  const match = description.match(
    /\b\d{1,2}(?::\d{2})?\s?(?:am|pm)\s*[–-]\s*\d{1,2}(?::\d{2})?\s?(?:am|pm)\b/i
  );
  if (match) {
    return ` during ${match[0]}`;
  }

  return "";
}

function getWorkflowIdForTimeBlock(label = "") {
  switch (label) {
    case "7am–9am":
      return "morning-adl";
    case "9am–11am":
      return "feeding-support";
    case "11am–1pm":
      return "in-home-leisure";
    case "1pm–3pm":
      return "community-outing";
    case "3pm–5pm":
      return "return-home";
    default:
      return "community-outing";
  }
}

function getMorningAdlStepOrder() {
  return ["adlAreas", "hygiene", "promptLevel", "mobility", "hydration", "why", "draft"];
}

function getFeedingStepOrder() {
  return ["mealType", "aspiration", "fluids", "response", "why", "draft"];
}

function getInHomeLeisureStepOrder() {
  return ["activity", "response", "outingPrep", "why", "draft"];
}

function getCommunityOutingStepOrder(answers = {}) {
  const steps = ["attended"];
  if (!answers.attended) {
    return steps;
  }
  if (answers.attended === "no") {
    return [...steps, "decline"];
  }
  return [...steps, "location", "response", "mobility", "hydration", "why", "draft"];
}

function getReturnHomeStepOrder() {
  return ["transition", "hydration", "routine", "why", "draft"];
}

function getBehaviorSupportStepOrder() {
  return ["behaviorObserved", "interventionUsed", "response", "why", "draft"];
}

function getCommunicationSupportStepOrder() {
  return ["communicationSupport", "hearingAidCheck", "response", "why", "draft"];
}

function getMedicationSupportStepOrder() {
  return ["medicationType", "medicationTiming", "response", "why", "draft"];
}

function getCaseNoteFinalStepOrder() {
  return ["summaryFocus", "why", "draft"];
}

const STEP_ORDERS = {
  "morning-adl": getMorningAdlStepOrder,
  "feeding-support": getFeedingStepOrder,
  "in-home-leisure": getInHomeLeisureStepOrder,
  "community-outing": getCommunityOutingStepOrder,
  "return-home": getReturnHomeStepOrder,
  "behavior-support": getBehaviorSupportStepOrder,
  "communication-support": getCommunicationSupportStepOrder,
  "medication-support": getMedicationSupportStepOrder,
  "case-note-final": getCaseNoteFinalStepOrder,
};

function getStepOrder(workflowId, answers = {}) {
  const resolver = STEP_ORDERS[workflowId];
  return resolver ? resolver(answers) : [];
}

function getExpectedStepKey(workflowId, answers = {}, stepIndex = 0) {
  const steps = getStepOrder(workflowId, answers);
  if (!steps.length) {
    return null;
  }
  return steps[Math.min(stepIndex, steps.length - 1)];
}

function renderMorningAdlStep(stepKey, patientName, fieldContext, answers) {
  const timeHint = getFieldTimeHint(fieldContext);

  switch (stepKey) {
    case "adlAreas":
      return {
        stepKey,
        kind: "suggestions",
        question: `Which ADL supports were provided for ${patientName}${timeHint}?`,
        suggestions: ["Toileting", "Dressing", "Oral hygiene", "Grooming", "Other..."],
        multiSelect: true,
        allowCustom: true,
        rationale: "Care plan requires total assistance with hygiene, balance support, and fall prevention.",
      };
    case "hygiene":
      return {
        stepKey,
        kind: "yes-no",
        question: "Was hygiene support provided?",
        rationale: "Care plan requires staff within arm's reach for showering, toileting, and oral hygiene.",
      };
    case "promptLevel":
      return {
        stepKey,
        kind: "suggestions",
        question: "What prompt level was used?",
        suggestions: ["Verbal prompt", "Partial assist", "Total assist", "Refused"],
        allowCustom: false,
        rationale: "Prompt level should match the support actually rendered.",
      };
    case "mobility":
      return {
        stepKey,
        kind: "yes-no",
        question: "Was mobility or fall-prevention support provided?",
        rationale: "Care plan requires line-of-sight supervision and mobility support.",
      };
    case "hydration":
      return {
        stepKey,
        kind: "suggestions",
        question: "Was hydration offered or monitored?",
        suggestions: ["Yes", "No", "Not needed"],
        allowCustom: false,
        optionalNarration: true,
        narrationField: "hydrationNarration",
        rationale: "Care plan expects fluid monitoring across the shift.",
      };
    case "why":
      return {
        stepKey,
        kind: "why",
        question: "Why this matters",
        whyItems: [
          "fall prevention",
          "hygiene and dignity",
          "prompt level documentation",
          "hydration monitoring",
        ],
      };
    case "draft":
      return { stepKey, kind: "draft", question: "Generated documentation" };
    default:
      return null;
  }
}

function renderFeedingStep(stepKey, patientName, fieldContext, answers) {
  const timeHint = getFieldTimeHint(fieldContext);

  switch (stepKey) {
    case "mealType":
      return {
        stepKey,
        kind: "suggestions",
        question: `What meal support was provided${timeHint}?`,
        suggestions: ["Breakfast", "Lunch", "Snack", "Fluid support only", "Other..."],
        allowCustom: true,
        rationale: "Care plan includes PKU diet, GERD precautions, and aspiration risk.",
      };
    case "aspiration":
      return {
        stepKey,
        kind: "yes-no",
        question: "Were aspiration precautions followed?",
        rationale: "Care plan requires pacing, positioning, and safe swallow strategies.",
      };
    case "fluids":
      return {
        stepKey,
        kind: "suggestions",
        question: "Were fluids offered or monitored?",
        suggestions: ["Yes", "No", "Not needed"],
        allowCustom: false,
        optionalNarration: true,
        narrationField: "fluidsNarration",
        rationale: "Care plan expects hydration monitoring during meals.",
      };
    case "response":
      return {
        stepKey,
        kind: "suggestions",
        question: `How did ${patientName} respond during the meal?`,
        suggestions: ["Ate with prompts", "Needed pacing cues", "Tolerated fluids well", "Refused part of meal"],
        allowCustom: true,
        rationale: "Document observed response and staff support rendered.",
      };
    case "why":
      return {
        stepKey,
        kind: "why",
        question: "Why this matters",
        whyItems: ["aspiration precautions", "PKU meal plan", "hydration monitoring", "observed response"],
      };
    case "draft":
      return { stepKey, kind: "draft", question: "Generated documentation" };
    default:
      return null;
  }
}

function renderInHomeLeisureStep(stepKey, patientName, fieldContext, answers) {
  const timeHint = getFieldTimeHint(fieldContext);

  switch (stepKey) {
    case "activity":
      return {
        stepKey,
        kind: "suggestions",
        question: `What in-home activity occurred${timeHint}?`,
        suggestions: ["Rest or nap", "Leisure in home", "Pre-outing preparation", "Personal care", "Other..."],
        allowCustom: true,
        rationale: "Care plan allows rest before community participation when fatigued.",
      };
    case "response":
      return {
        stepKey,
        kind: "suggestions",
        question: `How did ${patientName} respond?`,
        suggestions: ["Calm and engaged", "Needed prompts", "Became fatigued", "Preferred to stay in room"],
        allowCustom: true,
      };
    case "outingPrep":
      return {
        stepKey,
        kind: "yes-no",
        question: "Was pre-outing preparation completed?",
        rationale: "Care plan notes hearing aids, dentures, and mobility needs before community outings.",
      };
    case "why":
      return {
        stepKey,
        kind: "why",
        question: "Why this matters",
        whyItems: ["rest and fatigue", "pre-outing preparation", "community participation readiness"],
      };
    case "draft":
      return { stepKey, kind: "draft", question: "Generated documentation" };
    default:
      return null;
  }
}

function renderCommunityOutingStep(stepKey, patientName, fieldContext, answers) {
  const timeHint = getFieldTimeHint(fieldContext);

  switch (stepKey) {
    case "attended":
      return {
        stepKey,
        kind: "yes-no",
        question: `Did ${patientName} attend a community outing${timeHint}?`,
      };
    case "location":
      return {
        stepKey,
        kind: "suggestions",
        question: "Where did the outing occur?",
        suggestions: ["Park", "Grocery Store", "Café", "Church", "Hair appointment", "Other..."],
        allowCustom: true,
        rationale: "Care plan emphasizes supervised community participation.",
      };
    case "response": {
      const location = answers.locationCustom || answers.location;
      const locationHint = location && location !== "Other..." ? ` at ${location.toLowerCase()}` : "";
      return {
        stepKey,
        kind: "suggestions",
        question: `How did ${patientName} respond during the outing${locationHint}?`,
        suggestions: [
          "Calm and engaged",
          "Socially interactive",
          "Required verbal cueing",
          "Needed redirection",
          "Became fatigued",
        ],
        allowCustom: true,
        rationale: "Care plan expects social engagement, cueing, redirection, and fatigue to be documented.",
      };
    }
    case "mobility":
      return {
        stepKey,
        kind: "yes-no",
        question: "Was mobility support provided?",
        rationale: "Care plan requires fall prevention and supervised ambulation.",
      };
    case "hydration":
      return {
        stepKey,
        kind: "suggestions",
        question: "Was hydration offered or monitored?",
        suggestions: ["Yes", "No", "Not needed"],
        allowCustom: false,
        optionalNarration: true,
        narrationField: "hydrationNarration",
        rationale: "Care plan expects hydration monitoring during community participation.",
      };
    case "why":
      return {
        stepKey,
        kind: "why",
        question: "Why this matters",
        whyItems: [
          "community integration",
          "fall prevention",
          "hydration monitoring",
          "redirection for inappropriate social contact",
        ],
      };
    case "decline":
      return {
        stepKey,
        kind: "draft",
        question: "Generated documentation",
        draftNote: `${patientName} did not attend a community outing during this shift. Staff remained available for community participation supports as outlined in the care plan.`,
      };
    case "draft":
      return { stepKey, kind: "draft", question: "Generated documentation" };
    default:
      return null;
  }
}

function renderReturnHomeStep(stepKey, patientName, fieldContext, answers) {
  const timeHint = getFieldTimeHint(fieldContext);

  switch (stepKey) {
    case "transition":
      return {
        stepKey,
        kind: "yes-no",
        question: `Did ${patientName} transition home safely${timeHint}?`,
        rationale: "Care plan expects safe return-home transitions after community participation.",
      };
    case "hydration":
      return {
        stepKey,
        kind: "suggestions",
        question: "Was hydration offered after returning home?",
        suggestions: ["Yes", "No", "Not needed"],
        allowCustom: false,
        optionalNarration: true,
        narrationField: "hydrationNarration",
        rationale: "Care plan expects fluid monitoring across the shift.",
      };
    case "routine":
      return {
        stepKey,
        kind: "suggestions",
        question: "What afternoon routine support was provided?",
        suggestions: ["Rest", "Toileting", "Snack or fluids", "Leisure in home", "Other..."],
        allowCustom: true,
      };
    case "why":
      return {
        stepKey,
        kind: "why",
        question: "Why this matters",
        whyItems: ["safe transition home", "hydration monitoring", "afternoon routine support"],
      };
    case "draft":
      return { stepKey, kind: "draft", question: "Generated documentation" };
    default:
      return null;
  }
}

function renderBehaviorSupportStep(stepKey, patientName, fieldContext, answers) {
  const timeHint = getFieldTimeHint(fieldContext);

  switch (stepKey) {
    case "behaviorObserved":
      return {
        stepKey,
        kind: "suggestions",
        question: `What target behavior or support need was observed for ${patientName}${timeHint}?`,
        suggestions: ["Needed redirection", "Boundary-seeking behavior", "Agitation", "No target behavior observed", "Other..."],
        allowCustom: true,
        rationale: "Behavior notes should identify the target behavior or support concern clearly.",
      };
    case "interventionUsed":
      return {
        stepKey,
        kind: "suggestions",
        question: "What intervention or staff support was used?",
        suggestions: ["Verbal redirection", "Cueing and reassurance", "Environmental change", "Supervisor notification", "Other..."],
        allowCustom: true,
        rationale: "Document the intervention staff actually implemented.",
      };
    case "response":
      return {
        stepKey,
        kind: "suggestions",
        question: `How did ${patientName} respond to the intervention?`,
        suggestions: ["Calmed with support", "Accepted redirection", "Needed repeated prompts", "Behavior continued", "Other..."],
        allowCustom: true,
        rationale: "Observed response is required for defensible behavior documentation.",
      };
    case "why":
      return {
        stepKey,
        kind: "why",
        question: "Why this matters",
        whyItems: ["behavior support rendered", "observed response", "redirection effectiveness"],
      };
    case "draft":
      return { stepKey, kind: "draft", question: "Generated documentation" };
    default:
      return null;
  }
}

function renderCommunicationSupportStep(stepKey, patientName, fieldContext, answers) {
  const timeHint = getFieldTimeHint(fieldContext);

  switch (stepKey) {
    case "communicationSupport":
      return {
        stepKey,
        kind: "suggestions",
        question: `What communication support was provided for ${patientName}${timeHint}?`,
        suggestions: ["Hearing-aid support", "Repeat-back prompts", "One-step cueing", "Slow pacing and clarification", "Other..."],
        allowCustom: true,
        rationale: "Communication supports should match the care plan and what staff actually provided.",
      };
    case "hearingAidCheck":
      return {
        stepKey,
        kind: "yes-no",
        question: "Were hearing aids checked, used, or addressed as needed?",
        rationale: "Mary Bet's plan expects hearing-aid awareness during communication support.",
      };
    case "response":
      return {
        stepKey,
        kind: "suggestions",
        question: `How did ${patientName} respond to communication support?`,
        suggestions: ["Understood with prompts", "Repeated back instructions", "Needed extra clarification", "Reported hearing difficulty", "Other..."],
        allowCustom: true,
        rationale: "Observed response shows whether the communication support was effective.",
      };
    case "why":
      return {
        stepKey,
        kind: "why",
        question: "Why this matters",
        whyItems: ["hearing-aid use", "clear communication", "observed response"],
      };
    case "draft":
      return { stepKey, kind: "draft", question: "Generated documentation" };
    default:
      return null;
  }
}

function renderMedicationSupportStep(stepKey, patientName, fieldContext, answers) {
  const timeHint = getFieldTimeHint(fieldContext);

  switch (stepKey) {
    case "medicationType":
      return {
        stepKey,
        kind: "suggestions",
        question: `What medication or oxygen support was provided for ${patientName}${timeHint}?`,
        suggestions: ["Scheduled medication reminder", "Medication administration support", "Oxygen support", "Observation only", "Other..."],
        allowCustom: true,
        rationale: "Medication notes should state the type of support rendered.",
      };
    case "medicationTiming":
      return {
        stepKey,
        kind: "suggestions",
        question: "What timing detail should be captured?",
        suggestions: ["Scheduled time completed", "Late administration explained", "PRN timing documented", "Oxygen check documented", "Other..."],
        allowCustom: true,
        rationale: "Timing is part of defensible medication documentation.",
      };
    case "response":
      return {
        stepKey,
        kind: "suggestions",
        question: `What was ${patientName}'s observed response?`,
        suggestions: ["Accepted support", "Tolerated without issue", "Needed prompting", "Reported discomfort", "Other..."],
        allowCustom: true,
        rationale: "Observed response completes the medication or oxygen note.",
      };
    case "why":
      return {
        stepKey,
        kind: "why",
        question: "Why this matters",
        whyItems: ["timing documentation", "support rendered", "observed response"],
      };
    case "draft":
      return { stepKey, kind: "draft", question: "Generated documentation" };
    default:
      return null;
  }
}

function renderCaseNoteFinalStep(stepKey, patientName, fieldContext, answers) {
  switch (stepKey) {
    case "summaryFocus":
      return {
        stepKey,
        kind: "suggestions",
        question: `What should the final case note emphasize for ${patientName}?`,
        suggestions: ["Overall shift summary", "Behavior and interventions", "Health and safety supports", "Goal progress and transitions"],
        allowCustom: true,
        rationale: "The final case note should unify the row-level documentation into one concise paragraph.",
      };
    case "why":
      return {
        stepKey,
        kind: "why",
        question: "Why this matters",
        whyItems: ["single narrative summary", "care-plan alignment", "traceable row-to-note audit trail"],
      };
    case "draft":
      return { stepKey, kind: "draft", question: "Generated documentation" };
    default:
      return null;
  }
}

const STEP_RENDERERS = {
  "morning-adl": renderMorningAdlStep,
  "feeding-support": renderFeedingStep,
  "in-home-leisure": renderInHomeLeisureStep,
  "community-outing": renderCommunityOutingStep,
  "return-home": renderReturnHomeStep,
  "behavior-support": renderBehaviorSupportStep,
  "communication-support": renderCommunicationSupportStep,
  "medication-support": renderMedicationSupportStep,
  "case-note-final": renderCaseNoteFinalStep,
};

function renderPlaybookStep(workflowId, stepKey, patientName = "Mary Bet", fieldContext = {}, answers = {}) {
  const renderer = STEP_RENDERERS[workflowId];
  return renderer ? renderer(stepKey, patientName, fieldContext, answers) : null;
}

function isSupportedWorkflow(workflowId) {
  return Boolean(STEP_RENDERERS[workflowId]);
}

function getWorkflowEyebrow(workflowId) {
  return WORKFLOW_META[workflowId]?.eyebrow || "Guided workflow";
}

module.exports = {
  SHIFT_INTELLIGENCE,
  getWorkflowIdForTimeBlock,
  getStepOrder,
  getExpectedStepKey,
  renderPlaybookStep,
  isSupportedWorkflow,
  getWorkflowEyebrow,
  getCommunityOutingStepOrder,
};
