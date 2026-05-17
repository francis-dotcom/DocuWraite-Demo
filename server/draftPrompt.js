const { getCompactCarePlanContext } = require("./carePlanContext");
const { SHIFT_INTELLIGENCE } = require("./playbooks");
const { sortDraftSections } = require("./draftSectionPriority");
const { buildAssignedNodesUserPrompt } = require("./assignedNodesDraftPrompt");

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

function mergeShiftIntelligence(fieldContext = {}) {
  const client = fieldContext.shiftIntelligence || {};
  return {
    overdue: client.overdue || [],
    appointments: client.appointments || SHIFT_INTELLIGENCE.appointments || [],
    medicationsDue: client.medicationsDue || SHIFT_INTELLIGENCE.medicationsDue || [],
    alerts: client.alerts || SHIFT_INTELLIGENCE.alerts || [],
    activeRisks: client.activeRisks || [],
    incompleteGoals: client.incompleteGoals || [],
  };
}

function buildAssignedNodesDraftPrompt({
  answers = {},
  fieldContext = {},
  patientName = "Mary Bet",
  draftContextToggles = {},
  enabledDraftSections = null,
}) {
  const caregiverNarration = getCaregiverNarration(answers);
  const clarifyingAnswer = String(answers.clarifyingAnswer || "").trim();

  if (Array.isArray(enabledDraftSections) && enabledDraftSections.length) {
    const sortedSections = sortDraftSections(
      enabledDraftSections.map((entry) => {
        if (!entry.includeCarePlanExcerpt) {
          return entry;
        }
        return {
          ...entry,
          carePlanExcerpt: getCompactCarePlanContext(),
        };
      })
    );
    return buildAssignedNodesUserPrompt({
      patientName,
      fieldContext,
      enabledDraftSections: sortedSections,
      caregiverNarration,
      clarifyingAnswer,
    });
  }

  const legacyShiftBundle = Boolean(draftContextToggles.shiftIntelligence);
  const toggles = {
    assignedAnswers: draftContextToggles.assignedAnswers !== false,
    blockDescription: Boolean(draftContextToggles.blockDescription),
    shiftOverdue: Boolean(draftContextToggles.shiftOverdue) || legacyShiftBundle,
    appointments: Boolean(draftContextToggles.appointments) || legacyShiftBundle,
    medicationsDue: Boolean(draftContextToggles.medicationsDue) || legacyShiftBundle,
    alerts: Boolean(draftContextToggles.alerts) || legacyShiftBundle,
    incompleteGoals: Boolean(draftContextToggles.incompleteGoals) || legacyShiftBundle,
    carePlan: Boolean(draftContextToggles.carePlan),
    existingComment: Boolean(draftContextToggles.existingComment),
  };
  const runtimeShiftIntelligence = mergeShiftIntelligence(fieldContext);

  if (toggles.assignedAnswers) {
    sections.push(
      `Primary source — DSP assigned question answers: ${JSON.stringify(answers.assignedResponses || {})}`,
      `Caregiver narration: ${JSON.stringify(caregiverNarration)}`
    );
  }

  if (toggles.blockDescription && String(fieldContext.description || "").trim()) {
    sections.push(`Schedule block description: ${String(fieldContext.description).trim()}`);
  }

  if (toggles.existingComment && String(fieldContext.currentNote || "").trim()) {
    sections.push(`Existing documentation in this field: ${String(fieldContext.currentNote).trim()}`);
  }

  if (toggles.shiftOverdue) {
    sections.push(`Shift overdue items: ${JSON.stringify(runtimeShiftIntelligence.overdue)}`);
  }
  if (toggles.appointments) {
    sections.push(`Appointments: ${JSON.stringify(runtimeShiftIntelligence.appointments)}`);
  }
  if (toggles.medicationsDue) {
    sections.push(`Medications due: ${JSON.stringify(runtimeShiftIntelligence.medicationsDue)}`);
  }
  if (toggles.alerts) {
    sections.push(`Shift alerts: ${JSON.stringify(runtimeShiftIntelligence.alerts)}`);
  }
  if (toggles.incompleteGoals) {
    sections.push(`Incomplete goals: ${JSON.stringify(runtimeShiftIntelligence.incompleteGoals)}`);
  }
  if (toggles.alerts && runtimeShiftIntelligence.activeRisks?.length) {
    sections.push(`Active risks: ${JSON.stringify(runtimeShiftIntelligence.activeRisks)}`);
  }

  if (toggles.carePlan) {
    sections.push(`Care plan context:\n${getCompactCarePlanContext()}`);
  }

  return sections.filter(Boolean).join("\n\n");
}

function buildDraftNotePrompt({
  answers,
  fieldContext,
  patientName,
  workflowId,
  workflowMeta,
  draftContextToggles,
  enabledDraftSections,
}) {
  if (workflowId === "assigned-nodes") {
    return buildAssignedNodesDraftPrompt({
      answers,
      fieldContext,
      patientName,
      draftContextToggles: draftContextToggles || {},
      enabledDraftSections,
    });
  }

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
    workflowId === "assigned-nodes"
      ? "This draft is for a time block or row with Decision Engine assigned library questions. Use assignedResponses and the field context assigned nodes when present."
      : null,
    `Field context: ${JSON.stringify(fieldContext || {})}`,
    `Documented source entries: ${JSON.stringify(documentedSourceEntries)}`,
    `Answers: ${JSON.stringify(answers || {})}`,
    `Caregiver narration: ${JSON.stringify(caregiverNarration)}`,
    `Workflow meta: ${JSON.stringify(workflowMeta || {})}`,
    `Care plan context:\n${getCompactCarePlanContext()}`,
    `Shift intelligence: ${JSON.stringify(runtimeShiftIntelligence)}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

module.exports = {
  buildDraftNotePrompt,
  buildAssignedNodesDraftPrompt,
};
