function normalizeSentence(text = "") {
  const trimmed = String(text || "").replace(/\s+/g, " ").trim();
  if (!trimmed) {
    return "";
  }
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function normalizeSourceEntries(fieldContext = {}) {
  return (fieldContext.sourceEntries || [])
    .map((entry, index) => ({
      sourceIndex: index + 1,
      entryType: String(entry.entryType || "").trim(),
      label: String(entry.label || "").trim(),
      description: String(entry.description || "").replace(/^Document /i, "").trim(),
      score: String(entry.score || "").trim(),
      comment: normalizeSentence(entry.comment || ""),
    }))
    .filter((entry) => entry.comment);
}

function extractFinalClarifications(answers = {}) {
  const clarificationsByIndex = {};

  Object.entries(answers || {}).forEach(([key, value]) => {
    const match = String(key || "").match(/^final-clarify-(\d+)-(.+)$/);
    const normalizedValue = normalizeSentence(value || "");
    if (!match || !normalizedValue) {
      return;
    }

    const sourceIndex = Number(match[1]);
    const detailKey = String(match[2] || "").trim();
    if (!Number.isFinite(sourceIndex) || !detailKey) {
      return;
    }

    clarificationsByIndex[sourceIndex] = clarificationsByIndex[sourceIndex] || [];
    clarificationsByIndex[sourceIndex].push(normalizedValue);
  });

  return clarificationsByIndex;
}

function buildLeadSentence(outcome = "", entryCount = 0) {
  const normalizedOutcome = String(outcome || "").trim().toLowerCase();
  const leadByOutcome = {
    "stable shift":
      "Throughout the shift, staff provided planned supports and documentation reflected a generally stable presentation.",
    "supported with minor issues":
      "Throughout the shift, staff provided planned supports and addressed minor barriers as they arose.",
    "supported with notable concerns":
      "Throughout the shift, staff provided required supports and documented notable concerns that affected routine flow, participation, or tolerance.",
    "partial completion of planned supports":
      "Throughout the shift, staff provided planned supports, although some activities were only partially completed based on the documented barriers and outcomes.",
    "follow-up needed":
      "Throughout the shift, staff provided required supports and documented carry-forward items that need follow-up review.",
  };

  if (leadByOutcome[normalizedOutcome]) {
    return leadByOutcome[normalizedOutcome];
  }

  if (entryCount > 0) {
    return "Throughout the shift, staff documented support provided, the client's response, and notable care needs across the completed entries.";
  }

  return "";
}

function buildFollowUpSentence(followUp = "") {
  const normalizedFollowUp = String(followUp || "").trim().toLowerCase();
  const followUpSentenceByType = {
    "supervisor review":
      "Supervisor review should remain part of the carry-forward summary.",
    "nurse follow-up":
      "Nursing follow-up should remain part of the carry-forward summary.",
    "care team update":
      "A care-team update should be carried forward from this shift summary.",
    "family update":
      "A family update should be carried forward if appropriate and authorized.",
    "monitor next shift":
      "The next shift should continue monitoring the items summarized here.",
  };

  if (!normalizedFollowUp || normalizedFollowUp === "none") {
    return "";
  }

  return followUpSentenceByType[normalizedFollowUp] || "";
}

export function generateFinalCaseNote(answers = {}, fieldContext = {}, helpers = {}) {
  const {
    getWorkflowAnswer = () => undefined,
    formatAssignedWorkflowAnswer = (value) => value,
  } = helpers;

  const getFinalAnswer = (primaryKey, legacyKey = "") =>
    getWorkflowAnswer(answers, primaryKey) ?? (legacyKey ? getWorkflowAnswer(answers, legacyKey) : undefined);
  const sourceEntries = normalizeSourceEntries(fieldContext);
  const clarificationsByIndex = extractFinalClarifications(answers);
  const outcome = String(
    formatAssignedWorkflowAnswer(getFinalAnswer("final_shift_outcome", "final-shift-outcome")) || ""
  ).trim();
  const followUp = String(
    formatAssignedWorkflowAnswer(getFinalAnswer("final_follow_up", "final-follow-up")) || ""
  ).trim();

  if (!sourceEntries.length) {
    return "No row-level documentation was available to summarize into a final case note.";
  }

  const factualNarrative = sourceEntries
    .map((entry) =>
      [entry.comment, ...(clarificationsByIndex[entry.sourceIndex] || [])]
        .filter(Boolean)
        .join(" ")
    )
    .join(" ");
  const leadSentence = buildLeadSentence(outcome, sourceEntries.length);
  const followUpSentence = buildFollowUpSentence(followUp);

  return [leadSentence, factualNarrative, followUpSentence]
    .filter(Boolean)
    .join(" ")
    .trim();
}
