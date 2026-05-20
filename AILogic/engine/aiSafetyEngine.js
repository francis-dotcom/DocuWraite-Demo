function includesSelection(answerValue, value) {
  if (Array.isArray(answerValue)) {
    return answerValue.includes(value);
  }
  return answerValue === value;
}

function evaluateAiSafety(logic, answers = {}) {
  const triggers = logic?.rules?.safetyTriggers || [];
  const activeFlags = [];

  for (const trigger of triggers) {
    const answerValue = answers[trigger.sourceQuestionId];
    if (answerValue === undefined || answerValue === null) {
      continue;
    }

    const selectedValues = Array.isArray(trigger.whenAnySelected) ? trigger.whenAnySelected : [];
    const triggered = selectedValues.some((value) => includesSelection(answerValue, value));
    if (!triggered) {
      continue;
    }

    activeFlags.push({
      id: trigger.id,
      flag: trigger.flag,
      severity: trigger.severity || "medium",
      sourceQuestionId: trigger.sourceQuestionId,
      requiredEscalations: trigger.requiredEscalations || [],
      requiredNoteDirective: trigger.requiredNoteDirective || "",
    });
  }

  const highestSeverity = activeFlags.some((flag) => flag.severity === "high")
    ? "high"
    : activeFlags.some((flag) => flag.severity === "medium")
      ? "medium"
      : activeFlags.length
        ? "low"
        : null;

  return {
    hasSafetyFlags: activeFlags.length > 0,
    highestSeverity,
    activeFlags,
    requiredEscalations: [...new Set(activeFlags.flatMap((flag) => flag.requiredEscalations || []))],
    requiredNoteDirectives: activeFlags
      .map((flag) => flag.requiredNoteDirective)
      .filter(Boolean),
  };
}

module.exports = {
  evaluateAiSafety,
};
