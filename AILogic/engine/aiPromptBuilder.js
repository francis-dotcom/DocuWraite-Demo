function formatAnswerValue(answerValue) {
  if (Array.isArray(answerValue)) {
    return answerValue.join(", ");
  }
  return String(answerValue || "").trim();
}

function buildAnswerLines(logic, answers = {}) {
  const questions = logic?.rules?.questions || [];
  return questions
    .map((question) => {
      const answerValue = formatAnswerValue(answers[question.id]);
      if (!answerValue) {
        return null;
      }
      return `${question.label}: ${answerValue}`;
    })
    .filter(Boolean);
}

function buildAiSystemPrompt(logic, safety = {}) {
  const meta = logic?.meta || {};
  const noteContext = logic?.noteContext || {};
  const directives = noteContext.systemPromptDirectives || [];
  const outputSchema = noteContext.outputSchema || {};
  const toneProfiles = noteContext.toneProfiles || {};
  const defaultTone = toneProfiles.default || {};

  const safetyDirectives = (safety.requiredNoteDirectives || []).length
    ? `Safety directives:\n- ${safety.requiredNoteDirectives.join("\n- ")}`
    : "No special safety directives are active.";

  return [
    `You are DocuWraite's care-note generation assistant.`,
    `Workflow category: ${meta.category || ""}.`,
    `Workflow task: ${meta.task || ""}.`,
    `Audience: ${(meta.audience || []).join(", ")}.`,
    `Primary note style: ${defaultTone.style || "professional, neutral, observational"}.`,
    `Default note verbosity: ${defaultTone.verbosity || "detailed"}.`,
    `Composition order: ${(noteContext.compositionOrder || []).join(" -> ")}.`,
    `Required output type: ${outputSchema.summaryType || "single supervisor paragraph"}.`,
    `Required sections: ${(outputSchema.mustIncludeSections || []).join(", ")}.`,
    safetyDirectives,
    `Follow these rules:`,
    ...(directives.length ? directives.map((directive) => `- ${directive}`) : ["- Use only provided facts."]),
    `Return only the note text.`,
  ].join("\n");
}

function buildAiUserPrompt(logic, answers = {}, carePlan = {}, shiftContext = {}, safety = {}) {
  const meta = logic?.meta || {};
  const answerLines = buildAnswerLines(logic, answers);

  return [
    `Generate a supervisor-facing care note for ${meta.task || "this workflow"}.`,
    ``,
    `Shift context:`,
    `- Client: ${shiftContext.clientName || "Not provided"}`,
    `- Date: ${shiftContext.date || "Not provided"}`,
    `- Shift: ${shiftContext.shiftType || "Not provided"}`,
    `- Staff: ${shiftContext.staffName || "Not provided"}`,
    ``,
    `Relevant care-plan context:`,
    `${JSON.stringify(carePlan, null, 2)}`,
    ``,
    `Structured answers:`,
    `${answerLines.length ? answerLines.map((line) => `- ${line}`).join("\n") : "- No answers provided"}`,
    ``,
    `Safety state:`,
    `- Active: ${safety.hasSafetyFlags ? "yes" : "no"}`,
    `- Highest severity: ${safety.highestSeverity || "none"}`,
    `- Required escalations: ${(safety.requiredEscalations || []).join(", ") || "none"}`,
  ].join("\n");
}

module.exports = {
  buildAiSystemPrompt,
  buildAiUserPrompt,
};
