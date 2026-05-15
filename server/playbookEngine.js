const {
  getStepOrder,
  renderPlaybookStep,
  SHIFT_INTELLIGENCE,
} = require("./playbooks");
const {
  getPatientProfile,
  getContextualMemory,
  getEnvironmentDefaults,
  getCarePlanTriggers,
  getComplianceRequirements,
  getGoalTracking,
  STEP_THEME_MAP,
} = require("./carePlanProfile");

const CHECKPOINT_COPY = {
  supervision: {
    question: "Was line-of-sight supervision maintained?",
    rationale: "Care plan requires continuous supervision for fall prevention and safety.",
    kind: "yes-no",
  },
  hydration: {
    question: "Was hydration offered or monitored?",
    rationale: "Care plan expects fluid monitoring across the shift.",
    kind: "suggestions",
    suggestions: ["Yes", "No", "Not needed"],
    allowCustom: false,
    optionalNarration: true,
    narrationField: "hydrationNarration",
  },
  mobility: {
    question: "Was mobility support documented?",
    rationale: "Care plan requires supervised ambulation and fall prevention.",
    kind: "yes-no",
  },
  response: {
    question: "Was the individual's response to care documented?",
    rationale: "Care plan requires observed response and staff support rendered.",
    kind: "yes-no",
  },
  aspiration: {
    question: "Were aspiration precautions followed?",
    rationale: "Care plan requires pacing, positioning, and safe swallow strategies.",
    kind: "yes-no",
  },
};

function getShiftPhase(fieldContext = {}) {
  const label = String(fieldContext.label || "");
  if (label === "7am–9am") {
    return "beginning of shift";
  }
  if (label === "3pm–5pm") {
    return "end-of-shift handoff";
  }
  return "mid-shift";
}

function enrichFieldContext(fieldContext = {}, patientName = "Mary Bet") {
  const environmentDefaults = getEnvironmentDefaults(patientName);
  const runtimeShiftIntelligence = fieldContext.shiftIntelligence || SHIFT_INTELLIGENCE;
  return {
    ...fieldContext,
    shiftPhase: getShiftPhase(fieldContext),
    weather: fieldContext.weather || environmentDefaults.weather,
    outingDuration: fieldContext.outingDuration || environmentDefaults.outingDuration,
    transportation: fieldContext.transportation || environmentDefaults.transportation,
    contextualMemory: getContextualMemory(patientName),
    shiftIntelligence: runtimeShiftIntelligence,
  };
}

function getRuntimeShiftIntelligence(fieldContext = {}, patientName = "Mary Bet") {
  return enrichFieldContext(fieldContext, patientName).shiftIntelligence || SHIFT_INTELLIGENCE;
}

function runtimeHasRisk(fieldContext = {}, patientName = "Mary Bet", pattern) {
  return getRuntimeShiftIntelligence(fieldContext, patientName).activeRisks?.some((item) => pattern.test(item)) || false;
}

function runtimeHasAppointments(fieldContext = {}, patientName = "Mary Bet") {
  return (getRuntimeShiftIntelligence(fieldContext, patientName).appointments || []).length > 0;
}

function runtimeHasMedications(fieldContext = {}, patientName = "Mary Bet") {
  return (getRuntimeShiftIntelligence(fieldContext, patientName).medicationsDue || []).length > 0;
}

function runtimeHasAlerts(fieldContext = {}, patientName = "Mary Bet") {
  return (getRuntimeShiftIntelligence(fieldContext, patientName).alerts || []).length > 0;
}

function runtimeHasGoals(fieldContext = {}, patientName = "Mary Bet") {
  return (getRuntimeShiftIntelligence(fieldContext, patientName).incompleteGoals || []).length > 0;
}

function answerText(answers = {}) {
  return JSON.stringify(answers).toLowerCase();
}

function kebabToCamel(value = "") {
  return String(value).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function getStepAnswer(answers = {}, stepKey = "") {
  if (!stepKey) {
    return undefined;
  }

  const keys = [stepKey, kebabToCamel(stepKey)];
  for (const key of keys) {
    const value = answers[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  for (const key of keys) {
    const customValue = answers[`${key}Custom`];
    if (customValue !== undefined && customValue !== null && String(customValue).trim()) {
      return String(customValue).trim();
    }
  }

  return undefined;
}

function hasStepAnswer(answers = {}, stepKey = "") {
  return getStepAnswer(answers, stepKey) !== undefined;
}

function getRuntimeContextField(stepKey = "") {
  return `${stepKey}Context`;
}

function hasRuntimeContextActionAnswer(answers = {}, stepKey = "", contextOptions = []) {
  const action = getStepAnswer(answers, stepKey);
  if (action === undefined) {
    return false;
  }

  if (/^not relevant$/i.test(String(action).trim())) {
    return true;
  }

  if (!contextOptions.length) {
    return true;
  }

  return getStepAnswer(answers, getRuntimeContextField(stepKey)) !== undefined;
}

const WORKFLOW_ANSWER_STEP_KEYS = [
  "runtime-alert-review",
  "runtime-medication-review",
  "runtime-goal-progress",
  "runtime-appointment-review",
  "ai-followup",
];

function normalizeWorkflowAnswers(answers = {}) {
  const normalized = { ...answers };

  WORKFLOW_ANSWER_STEP_KEYS.forEach((stepKey) => {
    const value = getStepAnswer(answers, stepKey);
    if (value === undefined) {
      return;
    }

    const camelKey = kebabToCamel(stepKey);
    normalized[stepKey] = value;
    normalized[camelKey] = value;

    const customValue = answers[`${stepKey}Custom`] ?? answers[`${camelKey}Custom`];
    if (customValue !== undefined && customValue !== null && String(customValue).trim()) {
      normalized[`${stepKey}Custom`] = customValue;
      normalized[`${camelKey}Custom`] = customValue;
    }

    const contextField = getRuntimeContextField(stepKey);
    const contextValue = getStepAnswer(answers, contextField);
    if (contextValue !== undefined) {
      normalized[contextField] = contextValue;
      normalized[`${camelKey}Context`] = contextValue;
    }
  });

  return normalized;
}

function isFatigueSignal(answers = {}) {
  const text = answerText(answers);
  return /fatigue|fatigued|tired|lethargic/.test(text);
}

function isRefusalSignal(answers = {}) {
  const text = answerText(answers);
  return /refused|refusal|declined/.test(text);
}

function coveredThemes(answers = {}, workflowId = "") {
  const themes = new Set();
  Object.keys(answers).forEach((key) => {
    const theme = STEP_THEME_MAP[key];
    if (theme) {
      themes.add(theme);
    }
  });
  if (answers.promptLevel) {
    themes.add("response");
  }
  if (answers.aspiration) {
    themes.add("aspiration");
  }
  if (answers.fluids || answers.hydration) {
    themes.add("hydration");
  }
  if (workflowId === "community-outing" && answers.attended === "no") {
    ["supervision", "hydration", "mobility", "response"].forEach((theme) => themes.add(theme));
  }
  return themes;
}

function insertBefore(steps, targetKey, keysToInsert = []) {
  const index = steps.indexOf(targetKey);
  if (index < 0) {
    return [...steps, ...keysToInsert];
  }
  return [...steps.slice(0, index), ...keysToInsert, ...steps.slice(index)];
}

function uniqueSteps(steps = []) {
  return steps.filter((step, index) => steps.indexOf(step) === index);
}

function getStepKeyForTheme(theme, workflowId, answers = {}) {
  const baseStep = getStepOrder(workflowId, answers).find((stepKey) => STEP_THEME_MAP[stepKey] === theme);
  if (baseStep) {
    return baseStep;
  }
  return `checkpoint-${theme}`;
}

function buildMissingItem(message, targetStepKey) {
  return {
    id: `${targetStepKey}:${message}`,
    message,
    targetStepKey,
  };
}

function buildEscalationItem(message, targetStepKey = null) {
  return {
    id: `${targetStepKey || "escalation"}:${message}`,
    message,
    targetStepKey,
  };
}

function buildCaseNoteUnderstandingConfigs(fieldContext = {}, patientName = "Mary Bet") {
  const entries = Array.isArray(fieldContext.sourceEntries) ? fieldContext.sourceEntries : [];
  const documented = entries.filter((entry) => String(entry.comment || "").trim());
  const rowLabels = documented
    .map((entry) => String(entry.description || "").replace(/^Document /i, "").trim())
    .filter(Boolean)
    .slice(0, 4);

  const firstQuestion =
    rowLabels.length > 0
      ? {
          stepKey: "dsp-understanding-1",
          question: "Which row best matches the main support you documented during the shift?",
          suggestions:
            rowLabels.length >= 3
              ? rowLabels
              : [
                  ...rowLabels,
                  "Overall shift recap",
                  "Health and safety supports",
                ].slice(0, 4),
        }
      : {
          stepKey: "dsp-understanding-1",
          question: `What is the main theme of today's case note for ${patientName}?`,
          suggestions: [
            "Behavior and interventions",
            "ADLs and health supports",
            "Community participation",
            "Overall shift recap",
          ],
        };

  return [
    firstQuestion,
    {
      stepKey: "dsp-understanding-2",
      question:
        "The generated paragraph should reflect what you observed, not what the system guessed. What best describes your confidence?",
      suggestions: [
        "It matches what I observed",
        "Mostly matches, I reviewed the rows",
        "I need to edit or revisit a row",
        "Not sure yet",
      ],
    },
    {
      stepKey: "dsp-understanding-3",
      question: "Which detail should a supervisor see if they read only the final paragraph?",
      suggestions: [
        "Observed response to support",
        "Staff support rendered",
        "Health or safety supports",
        "Goal progress or transitions",
      ],
    },
  ];
}

function hasDocumentedSourceEntries(fieldContext = {}) {
  const entries = Array.isArray(fieldContext.sourceEntries) ? fieldContext.sourceEntries : [];
  return entries.some((entry) => String(entry.comment || "").trim());
}

function buildAdaptiveStepOrder(workflowId, answers = {}, fieldContext = {}, patientName = "Mary Bet") {
  answers = normalizeWorkflowAnswers(answers);
  const base = getStepOrder(workflowId, answers).filter((step) => step !== "draft" && step !== "why");
  let steps = [...base];

  const profile = getPatientProfile(patientName);
  const carePlanTriggers = getCarePlanTriggers(patientName);
  const complianceRequirements = getComplianceRequirements(patientName);
  carePlanTriggers.forEach((trigger) => {
    if (!trigger.when.workflows.includes(workflowId)) {
      return;
    }
    const riskMatch = trigger.when.risks?.some((risk) => profile.risks.includes(risk));
    const goalMatch = trigger.when.goals?.some((goal) => profile.goals.includes(goal));
    if (riskMatch || goalMatch) {
      steps = insertBefore(steps, "why", [trigger.stepKey]);
    }
  });

  const required = complianceRequirements[workflowId] || [];
  const covered = coveredThemes(answers, workflowId);
  const baseThemes = new Set();
  getStepOrder(workflowId, answers).forEach((stepKey) => {
    const theme = STEP_THEME_MAP[stepKey];
    if (theme) {
      baseThemes.add(theme);
    }
  });
  required.forEach((theme) => {
    if (!baseThemes.has(theme) && !covered.has(theme)) {
      steps = insertBefore(steps, "why", [`checkpoint-${theme}`]);
    }
  });

  if (isFatigueSignal(answers) && !answers.fatigueRecovery) {
    steps = insertBefore(steps, "why", ["branch-fatigue-recovery"]);
  }
  if (isRefusalSignal(answers) && !answers.refusalFollowup) {
    steps = insertBefore(steps, "why", ["branch-refusal-followup"]);
  }

  if (
    runtimeHasRisk(fieldContext, patientName, /fall/i) &&
    ["morning-adl", "community-outing", "return-home"].includes(workflowId)
  ) {
    steps = insertBefore(steps, "why", ["micro-fall-risk"]);
  }

  if (
    runtimeHasRisk(fieldContext, patientName, /aspiration|choking/i) &&
    ["feeding-support", "medication-support"].includes(workflowId)
  ) {
    steps = insertBefore(steps, "why", ["micro-aspiration"]);
  }

  if (
    runtimeHasAppointments(fieldContext, patientName) &&
    ["community-outing", "in-home-leisure", "return-home"].includes(workflowId) &&
    !hasStepAnswer(answers, "runtime-appointment-review")
  ) {
    steps = insertBefore(steps, "why", ["runtime-appointment-review"]);
  }

  if (
    runtimeHasMedications(fieldContext, patientName) &&
    [
      "morning-adl",
      "feeding-support",
      "medication-support",
      "return-home",
      "case-note-final",
    ].includes(workflowId) &&
    !hasRuntimeContextActionAnswer(
      answers,
      "runtime-medication-review",
      getRuntimeShiftIntelligence(fieldContext, patientName).medicationsDue || []
    )
  ) {
    steps = insertBefore(steps, "why", ["runtime-medication-review"]);
  }

  if (
    runtimeHasAlerts(fieldContext, patientName) &&
    !hasRuntimeContextActionAnswer(
      answers,
      "runtime-alert-review",
      getRuntimeShiftIntelligence(fieldContext, patientName).alerts || []
    )
  ) {
    steps = insertBefore(steps, "why", ["runtime-alert-review"]);
  }

  if (runtimeHasGoals(fieldContext, patientName) && !hasStepAnswer(answers, "runtime-goal-progress")) {
    steps = insertBefore(steps, "why", ["runtime-goal-progress"]);
  }

  if (!hasStepAnswer(answers, "ai-followup")) {
    steps.push("ai-followup");
  }

  if (workflowId === "case-note-final" && hasDocumentedSourceEntries(fieldContext)) {
    if (!hasStepAnswer(answers, "final-note-mood-handoff")) {
      steps.push("final-note-mood-handoff");
    }
    if (!hasStepAnswer(answers, "final-note-health-safety")) {
      steps.push("final-note-health-safety");
    }
    if (!hasStepAnswer(answers, "final-note-followup")) {
      steps.push("final-note-followup");
    }
  }

  steps.push("readiness");
  steps.push("why");
  steps.push("draft");

  if (workflowId === "case-note-final") {
    steps.push("dsp-understanding-1", "dsp-understanding-2", "dsp-understanding-3", "case-note-affirm");
  }

  if (workflowId === "community-outing" && answers.attended === "no") {
    return uniqueSteps(["attended", "decline"]);
  }

  return uniqueSteps(steps);
}

function getAdaptiveExpectedStepKey(workflowId, answers = {}, fieldContext = {}, stepIndex = 0, patientName = "Mary Bet") {
  const steps = buildAdaptiveStepOrder(workflowId, answers, fieldContext, patientName);
  if (!steps.length) {
    return null;
  }
  return steps[Math.min(stepIndex, steps.length - 1)];
}

function renderAdaptiveStep(stepKey, workflowId, patientName, fieldContext, answers) {
  const profile = getPatientProfile(patientName);
  const context = enrichFieldContext(fieldContext, patientName);

  if (stepKey.startsWith("checkpoint-")) {
    const theme = stepKey.replace("checkpoint-", "");
    const copy = CHECKPOINT_COPY[theme];
    if (!copy) {
      return null;
    }
    return {
      stepKey,
      kind: copy.kind,
      question: copy.question,
      rationale: copy.rationale,
      suggestions: copy.suggestions,
      allowCustom: copy.allowCustom,
      optionalNarration: copy.optionalNarration,
      narrationField: copy.narrationField,
      critical: true,
      carePlanThemes: [theme],
    };
  }

  if (stepKey.startsWith("dsp-understanding-")) {
    const config = buildCaseNoteUnderstandingConfigs(fieldContext, patientName).find(
      (entry) => entry.stepKey === stepKey
    );
    if (!config) {
      return null;
    }
    return {
      stepKey,
      kind: "suggestions",
      question: config.question,
      suggestions: config.suggestions,
      allowCustom: false,
      rationale: "Quick check so the DSP can confirm the note reflects their understanding.",
      softCheck: true,
    };
  }

  if (stepKey === "case-note-affirm") {
    return {
      stepKey,
      kind: "affirm",
      question: "Ready to add this paragraph to the final case note?",
      rationale: "This confirms the DSP reviewed the generated summary before insert.",
      softCheck: true,
    };
  }

  if (stepKey === "branch-fatigue-recovery") {
    return {
      stepKey,
      kind: "suggestions",
      question: "What recovery support was provided after fatigue was observed?",
      suggestions: ["Rest break", "Wheelchair use", "Returned home early", "Reduced activity pace"],
      allowCustom: true,
      manualContinue: true,
      rationale: "Care plan allows rest and return home when community participation becomes fatiguing.",
      critical: true,
      carePlanThemes: ["fatigue pattern", "wraparound supports"],
    };
  }

  if (stepKey === "branch-refusal-followup") {
    return {
      stepKey,
      kind: "suggestions",
      question: "How was the refusal or resistance handled?",
      suggestions: ["Re-offered with encouragement", "Used alternative approach", "Notified supervisor", "Documented and moved on"],
      allowCustom: true,
      manualContinue: true,
      rationale: "Care plan expects staff to document refusals and the support offered.",
      critical: true,
      carePlanThemes: ["response to care", "staff support rendered"],
    };
  }

  if (stepKey === "micro-fall-risk") {
    return {
      stepKey,
      kind: "yes-no",
      question: "Was fall-prevention supervision maintained during transitions?",
      rationale: "Care plan flags fall risk, declining vision, and unsteady gait.",
      critical: true,
      carePlanThemes: ["fall risk", "mobility supervision"],
    };
  }

  if (stepKey === "micro-aspiration") {
    return {
      stepKey,
      kind: "yes-no",
      question: "Were aspiration precautions maintained through the meal?",
      rationale: "Care plan flags aspiration risk, dentures, and meal pacing needs.",
      critical: true,
      carePlanThemes: ["aspiration precautions", "PKU meal plan"],
    };
  }

  if (stepKey === "micro-social-boundary") {
    return {
      stepKey,
      kind: "yes-no",
      question: "Was redirection provided for inappropriate social contact?",
      rationale: "Care plan expects redirection when Mary Bet seeks hugs or kisses from strangers.",
      critical: true,
      carePlanThemes: ["behavior management", "community participation"],
    };
  }

  if (stepKey === "runtime-appointment-review") {
    const appointments = getRuntimeShiftIntelligence(fieldContext, patientName).appointments || [];
    return {
      stepKey,
      kind: "suggestions",
      question: "Which appointment or scheduled outing affected this documentation block?",
      suggestions: ["Occurred this block", "Planned later", "Not relevant"],
      allowCustom: false,
      optionalNarration: true,
      narrationField: "runtimeAppointmentNarration",
      rationale: "Today's appointments should shape the workflow path and final note timing details.",
      critical: true,
      carePlanThemes: ["scheduled appointments", "community participation"],
      contextualOptions: appointments,
    };
  }

  if (stepKey === "runtime-medication-review") {
    const medicationsDue = getRuntimeShiftIntelligence(fieldContext, patientName).medicationsDue || [];
    return {
      stepKey,
      kind: "context-action",
      question: "What medication or oxygen due item should be reflected in this note?",
      contextLabel: "Select the medication or oxygen due item",
      contextField: getRuntimeContextField(stepKey),
      contextOptions: medicationsDue,
      actionLabel: "What action or status applies?",
      suggestions: ["Completed", "Not due this block", "Deferred/escalated", "Not relevant", "Other..."],
      allowCustom: true,
      optionalNarration: true,
      narrationField: "runtimeMedicationNarration",
      rationale: "Medication due items should not remain disconnected from the note narrative.",
      critical: true,
      carePlanThemes: ["medications due", "health supports"],
    };
  }

  if (stepKey === "runtime-alert-review") {
    const alerts = getRuntimeShiftIntelligence(fieldContext, patientName).alerts || [];
    return {
      stepKey,
      kind: "context-action",
      question: "Which alert or caution was relevant to this documentation block?",
      contextLabel: "Select the relevant alert or caution",
      contextField: getRuntimeContextField(stepKey),
      contextOptions: alerts,
      actionLabel: "How was it handled this block?",
      suggestions: ["Addressed", "Not relevant", "Needs follow-up", "Other..."],
      allowCustom: true,
      optionalNarration: true,
      narrationField: "runtimeAlertNarration",
      rationale: "Active alerts should drive deterministic compliance checks, not remain passive UI cards.",
      critical: true,
      carePlanThemes: ["alerts", "compliance"],
    };
  }

  if (stepKey === "runtime-goal-progress") {
    const goals = getRuntimeShiftIntelligence(fieldContext, patientName).incompleteGoals || [];
    const uniqueGoals = [...new Set(goals.map((item) => String(item).trim()).filter(Boolean))].slice(0, 4);
    return {
      stepKey,
      kind: "suggestions",
      question: "Which incomplete goal or outcome did this block support?",
      suggestions: [...uniqueGoals, "None", "Other..."],
      allowCustom: true,
      optionalNarration: true,
      narrationField: "runtimeGoalNarration",
      rationale: "Incomplete goals should surface in playbook questions and final note summaries.",
      critical: false,
      carePlanThemes: ["goal progress", "outcome tracking"],
    };
  }

  if (stepKey === "ai-followup") {
    return {
      stepKey,
      kind: "suggestions",
      question: `Based on ${profile.name}'s care plan, what else should be documented from this block?`,
      suggestions: buildFollowUpSuggestions(workflowId, answers, profile),
      allowCustom: true,
      optionalNarration: true,
      narrationField: "aiFollowupNarration",
      rationale: "Adaptive follow-up after core workflow questions.",
      critical: false,
      adaptiveFollowUp: true,
    };
  }

  if (stepKey === "final-note-mood-handoff") {
    return {
      stepKey,
      kind: "suggestions",
      question: `What overall mood, behavior, or shift pattern should the final note mention for ${profile.name}?`,
      suggestions: [
        "Stable mood and routine participation",
        "Behavior support or redirection was needed",
        "Variable engagement across the shift",
        "No major mood or behavior changes",
        "Other...",
      ],
      allowCustom: true,
      optionalNarration: true,
      narrationField: "finalNoteMoodNarration",
      rationale: "The final note should carry the shift-wide pattern, not just isolated block details.",
      critical: false,
      carePlanThemes: ["shift summary", "behavior pattern", "handoff"],
    };
  }

  if (stepKey === "final-note-health-safety") {
    return {
      stepKey,
      kind: "suggestions",
      question: "What health, safety, or risk support needs to be called out in the final note?",
      suggestions: [
        "Fall-risk supervision and mobility support",
        "Meal or aspiration precautions",
        "Medication or oxygen support",
        "No new health or safety concerns",
        "Other...",
      ],
      allowCustom: true,
      optionalNarration: true,
      narrationField: "finalNoteHealthSafetyNarration",
      rationale: "Supervisors should be able to scan the final note and see the main health and safety supports.",
      critical: false,
      carePlanThemes: ["health supports", "safety supports", "risk handoff"],
    };
  }

  if (stepKey === "final-note-followup") {
    return {
      stepKey,
      kind: "suggestions",
      question: "What follow-up, transition, or handoff detail should be included before the final note is generated?",
      suggestions: [
        "Appointment or outing timing",
        "Goal progress or missed support",
        "Medication, PRN, or due-item follow-up",
        "No additional follow-up needed",
        "Other...",
      ],
      allowCustom: true,
      optionalNarration: true,
      narrationField: "finalNoteFollowupNarration",
      rationale: "This closes any remaining loop before all narrated blocks are rolled into one final paragraph.",
      critical: false,
      carePlanThemes: ["handoff", "follow-up", "transitions"],
    };
  }

  if (stepKey === "readiness") {
    const validation = validateWorkflow(workflowId, answers, fieldContext, patientName);
    return {
      stepKey,
      kind: "readiness",
      question: "Documentation readiness",
      missingItems: validation.missingItems,
      confidence: validation.confidence,
      draftBlocked: validation.draftBlocked,
      escalationAlerts: validation.escalationAlerts,
      noteQuality: validation.noteQuality,
      rationale: "DocuWraite checks required care-plan context before generating the final note.",
    };
  }

  const baseStep = renderPlaybookStep(workflowId, stepKey, patientName, context, answers);
  if (!baseStep) {
    return null;
  }

  return {
    ...baseStep,
    critical: ["mobility", "hydration", "aspiration", "response", "promptLevel", "attended"].includes(stepKey),
    carePlanThemes: baseStep.carePlanThemes || getGoalTracking(patientName)[workflowId] || [],
    rationale:
      baseStep.rationale ||
      (baseStep.kind === "why"
        ? null
        : `This question is tied to ${profile.name}'s active care-plan risks, goals, and required supports.`),
  };
}

function buildFollowUpSuggestions(workflowId, answers, profile) {
  const suggestions = [];
  if (profile.risks.includes("fall risk") && !answers.mobility) {
    suggestions.push("Document mobility supervision");
  }
  if (profile.diet.includes("hydration monitoring") && !answers.hydration && !answers.fluids) {
    suggestions.push("Document hydration monitoring");
  }
  if (workflowId === "community-outing") {
    suggestions.push("Document transportation and outing duration");
  }
  if (workflowId === "communication-support") {
    suggestions.push("Document hearing-aid status or communication cueing used");
  }
  if (workflowId === "medication-support") {
    suggestions.push("Document timing and observed response");
  }
  if (workflowId === "case-note-final") {
    suggestions.push("Tie together row notes into one concise narrative");
  }
  if (answers.runtimeAppointmentReview) {
    suggestions.push("Include appointment timing or outing context");
  }
  if (answers.runtimeMedicationReview) {
    suggestions.push("Include medication or oxygen due support");
  }
  if (answers.runtimeAlertReview) {
    suggestions.push("Reflect the relevant alert or precaution");
  }
  if (answers.runtimeGoalProgress) {
    suggestions.push("Explain progress toward the relevant incomplete goal");
  }
  if (isFatigueSignal(answers)) {
    suggestions.push("Document rest or early return home");
  }
  if (suggestions.length === 0) {
    suggestions.push("Staff support rendered", "Observed response", "No additional concerns");
  }
  return suggestions.slice(0, 4);
}

function validateWorkflow(workflowId, answers = {}, fieldContext = {}, patientName = "Mary Bet") {
  answers = normalizeWorkflowAnswers(answers);
  const complianceRequirements = getComplianceRequirements(patientName);
  const goalTracking = getGoalTracking(patientName);
  const required = complianceRequirements[workflowId] || [];
  const covered = coveredThemes(answers, workflowId);
  const missingItems = required
    .filter((theme) => !covered.has(theme))
    .map((theme) =>
      buildMissingItem(`Missing ${theme} documentation`, getStepKeyForTheme(theme, workflowId, answers))
    );

  const escalationAlerts = detectEscalations(answers).map((message) => {
    if (/fatigue/i.test(message)) {
      return buildEscalationItem(message, "branch-fatigue-recovery");
    }
    if (/refusal/i.test(message)) {
      return buildEscalationItem(message, "branch-refusal-followup");
    }
    if (/hydration/i.test(message)) {
      return buildEscalationItem(message, getStepKeyForTheme("hydration", workflowId, answers));
    }
    return buildEscalationItem(message);
  });
  if (
    runtimeHasAlerts(fieldContext, patientName) &&
    !hasRuntimeContextActionAnswer(
      answers,
      "runtime-alert-review",
      getRuntimeShiftIntelligence(fieldContext, patientName).alerts || []
    )
  ) {
    escalationAlerts.push(
      buildEscalationItem(
        "Active alert card was not reflected in the workflow answers",
        "runtime-alert-review"
      )
    );
  }
  if (
    runtimeHasMedications(fieldContext, patientName) &&
    !hasRuntimeContextActionAnswer(
      answers,
      "runtime-medication-review",
      getRuntimeShiftIntelligence(fieldContext, patientName).medicationsDue || []
    )
  ) {
    escalationAlerts.push(
      buildEscalationItem(
        "Medication due card was not acknowledged in the workflow answers",
        "runtime-medication-review"
      )
    );
  }
  if (
    runtimeHasGoals(fieldContext, patientName) &&
    workflowId === "case-note-final" &&
    !hasStepAnswer(answers, "runtime-goal-progress")
  ) {
    escalationAlerts.push(
      buildEscalationItem(
        "Final case note is missing incomplete-goal progress context",
        "runtime-goal-progress"
      )
    );
  }

  const totalIssues = missingItems.length + escalationAlerts.length;

  const confidence =
    totalIssues === 0
      ? "HIGH"
      : totalIssues > 2
        ? "LOW"
        : "MEDIUM";

  const noteQuality =
    totalIssues === 0 ? "high-quality" : totalIssues <= 2 ? "incomplete" : "vague";

  return {
    missingItems,
    confidence,
    draftBlocked: totalIssues > 0,
    escalationAlerts,
    noteQuality,
    goalsTracked: goalTracking[workflowId] || [],
  };
}

function detectEscalations(answers = {}) {
  const alerts = [];
  if (isFatigueSignal(answers) && !answers.fatigueRecovery) {
    alerts.push("Fatigue noted without recovery documentation");
  }
  if (isRefusalSignal(answers) && !answers.refusalFollowup) {
    alerts.push("Refusal noted without follow-up documentation");
  }
  if (answers.redirectionEffective === "no") {
    alerts.push("Redirection was not effective and may need escalation");
  }
  if (answers.hydration === "no" || answers.fluids === "no") {
    alerts.push("Hydration support was not documented as provided");
  }
  return alerts;
}

function buildAuditTrail(answers = {}) {
  const normalized = normalizeWorkflowAnswers(answers);
  const seen = new Set();

  return Object.entries(normalized)
    .filter(([key, value]) => {
      if (value === "" || value === undefined || key.endsWith("Custom")) {
        return false;
      }
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .map(([stepKey, value]) => ({
      stepKey,
      value,
    }));
}

function buildWorkflowMeta(workflowId, answers = {}, fieldContext = {}, stepKey = "", patientName = "Mary Bet") {
  const validation = validateWorkflow(workflowId, answers, fieldContext, patientName);
  const profile = getPatientProfile(patientName);
  const context = enrichFieldContext(fieldContext, patientName);

  return {
    confidence: validation.confidence,
    missingSummary: validation.missingItems,
    stepOrder: buildAdaptiveStepOrder(workflowId, answers, fieldContext, patientName),
    shiftPhase: context.shiftPhase,
    environmentalContext: {
      weather: context.weather,
      outingDuration: context.outingDuration,
      transportation: context.transportation,
    },
    contextualMemory: context.contextualMemory,
    shiftIntelligence: context.shiftIntelligence,
    escalationAlerts: validation.escalationAlerts,
    goalsTracked: validation.goalsTracked,
    noteQuality: validation.noteQuality,
    draftBlocked: stepKey === "draft" ? validation.draftBlocked : validation.missingItems.length > 0,
    auditTrail: buildAuditTrail(answers),
    carePlanProfile: profile,
    interventionTracking: {
      verbalCueingEffective: answers.verbalCueingEffective || null,
      redirectionEffective: answers.redirectionEffective || null,
      hydrationTolerated: answers.hydrationTolerated || answers.hydration || null,
    },
  };
}

function resolveWorkflowStep(
  workflowId,
  answers = {},
  fieldContext = {},
  stepIndex = 0,
  patientName = "Mary Bet",
  forcedStepKey = null
) {
  answers = normalizeWorkflowAnswers(answers);
  const stepKey =
    forcedStepKey || getAdaptiveExpectedStepKey(workflowId, answers, fieldContext, stepIndex, patientName);
  if (!stepKey) {
    return { step: null, meta: null };
  }

  if (!forcedStepKey && stepKey === "draft") {
    const validation = validateWorkflow(workflowId, answers, fieldContext, patientName);
    if (validation.draftBlocked) {
      const readinessStep = renderAdaptiveStep("readiness", workflowId, patientName, fieldContext, answers);
      return {
        step: readinessStep,
        meta: buildWorkflowMeta(workflowId, answers, fieldContext, "readiness", patientName),
      };
    }
  }

  const step = renderAdaptiveStep(stepKey, workflowId, patientName, fieldContext, answers);
  return {
    step,
    meta: buildWorkflowMeta(workflowId, answers, fieldContext, stepKey, patientName),
  };
}

module.exports = {
  buildAdaptiveStepOrder,
  getAdaptiveExpectedStepKey,
  resolveWorkflowStep,
  validateWorkflow,
  enrichFieldContext,
  normalizeWorkflowAnswers,
};
