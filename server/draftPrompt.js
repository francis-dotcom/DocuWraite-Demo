const { getCompactCarePlanContext } = require("./carePlanContext");
const { SHIFT_INTELLIGENCE } = require("./playbooks");

function getCaregiverNarration(answers = {}) {
  return Object.entries(answers)
    .filter(([key, value]) => /narration/i.test(key) && String(value || "").trim())
    .map(([key, value]) => ({
      field: key,
      text: String(value).trim(),
    }));
}

function getDocumentedSourceEntries(fieldContext = {}) {
  const entries = Array.isArray(fieldContext.sourceEntries) ? fieldContext.sourceEntries : [];
  return entries
    .filter((entry) => String(entry.comment || "").trim())
    .map((entry) => ({
      entryType: entry.entryType || "documentation",
      label: entry.label || "",
      source: entry.source || "",
      description: entry.description || "",
      score: entry.score || "",
      workflowId: entry.workflowId || null,
      comment: String(entry.comment || "").trim(),
    }));
}

function buildDraftNotePrompt({ answers, fieldContext, patientName, workflowId, workflowMeta }) {
  const runtimeShiftIntelligence = fieldContext?.shiftIntelligence || SHIFT_INTELLIGENCE;
  const caregiverNarration = getCaregiverNarration(answers);
  const documentedSourceEntries = getDocumentedSourceEntries(fieldContext);
  return [
    "Write one DSP shift-note paragraph as JSON with keys stepKey, question, kind, and draftNote.",
    'Use stepKey "draft", kind "draft", and question "Generated documentation".',
    "Use only the answers and care-plan context below. Do not invent incidents or diagnoses.",
    "Treat any caregiver narration fields as direct DSP note content and incorporate them naturally when relevant.",
    "When source entries are provided, roll all documented entries into one coherent final paragraph instead of focusing on only one block.",
    "Preserve important time-block sequencing, support level details, observed responses, and required handoff context when those details are present.",
    `Patient: ${patientName}.`,
    `Workflow: ${workflowId || "guided-documentation"}.`,
    `Field context: ${JSON.stringify(fieldContext || {})}`,
    `Documented source entries: ${JSON.stringify(documentedSourceEntries)}`,
    `Answers: ${JSON.stringify(answers || {})}`,
    `Caregiver narration: ${JSON.stringify(caregiverNarration)}`,
    `Workflow meta: ${JSON.stringify(workflowMeta || {})}`,
    `Care plan context:\n${getCompactCarePlanContext()}`,
    `Shift intelligence: ${JSON.stringify(runtimeShiftIntelligence)}`,
  ].join("\n\n");
}

module.exports = {
  buildDraftNotePrompt,
};
