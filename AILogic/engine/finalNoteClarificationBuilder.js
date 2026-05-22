function normalizeFinalNoteFlagText(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

function detectFinalNoteEntryFlag(entry = {}) {
  const text = normalizeFinalNoteFlagText(entry.comment || "");
  if (!text) {
    return "blue";
  }

  const redSignals = [
    "refused",
    "not completed",
    "safety prevented completion",
    "resistant",
    "declined further support",
    "demonstrated discomfort",
    "unsafe balance",
    "dizziness",
    "pain",
    "skin redness",
    "skin breakdown concern",
    "foul smelling urine",
    "cloudy urine",
    "blood observed",
    "increased frequency",
    "constipation concern",
    "incontinence episode",
    "near fall concern",
    "nurse notification needed",
    "supervisor notification needed",
    "incident follow up needed",
  ];

  if (redSignals.some((signal) => text.includes(signal))) {
    return "red";
  }

  const yellowSignals = [
    "partially completed",
    "interrupted",
    "hesitant",
    "distracted",
    "withdrawn",
    "refused initially",
    "required repeated prompting",
    "required repeated cueing",
    "accepted redirection",
    "needed step by step cueing",
    "tolerated with support",
    "poor tolerance",
    "needed extra cueing",
    "clothing refusal",
    "refused product or step",
    "weakness or fatigue",
    "equipment difficulty",
    "change in baseline",
  ];

  if (yellowSignals.some((signal) => text.includes(signal))) {
    return "yellow";
  }

  return "blue";
}

function buildFinalNoteClarificationSteps(fieldContext = {}) {
  const entries = Array.isArray(fieldContext.sourceEntries) ? fieldContext.sourceEntries : [];
  const hasKeyword = (text, keywords) => keywords.some((keyword) => text.includes(keyword));

  return entries.flatMap((entry, index) => {
    const comment = normalizeFinalNoteFlagText(entry.comment || "");
    if (!comment) {
      return [];
    }

    const flag = detectFinalNoteEntryFlag(entry);
    if (flag === "blue") {
      return [];
    }

    const entryLabel = String(entry.label || entry.description || `Entry ${index + 1}`)
      .replace(/^Document /i, "")
      .trim();
    const hasStaffAction = hasKeyword(comment, [
      "staff",
      "provided",
      "support",
      "prompt",
      "assist",
      "assistance",
      "redirect",
      "redirection",
      "cue",
      "supervision",
      "gait belt",
      "transferred",
      "monitor",
    ]);
    const hasClientResponse = hasKeyword(comment, [
      "respond",
      "response",
      "tolerated",
      "accepted",
      "refused",
      "cooperative",
      "engaged",
      "resistant",
      "re engaged",
      "hesitant",
      "withdrawn",
      "declined",
      "discomfort",
    ]);
    const hasSafetyDetail = hasKeyword(comment, [
      "fall",
      "unsafe",
      "pain",
      "dizziness",
      "blood",
      "skin",
      "urine",
      "balance",
      "near fall",
      "gait belt",
      "two person",
      "precaution",
      "risk",
      "weakness",
    ]);
    const hasFollowUp = hasKeyword(comment, [
      "notify",
      "notified",
      "reported",
      "follow up",
      "follow-up",
      "monitor next shift",
      "supervisor",
      "nurse",
      "care team",
      "family update",
      "carry forward",
    ]);

    const questions = [];

    if (!hasStaffAction) {
      questions.push({
        stepKey: `final-clarify-${index + 1}-staff-action`,
        question:
          flag === "red"
            ? `For "${entryLabel}", what did staff do immediately?`
            : `For "${entryLabel}", what support or redirection did staff provide?`,
      });
    }

    if (!hasClientResponse) {
      questions.push({
        stepKey: `final-clarify-${index + 1}-client-response`,
        question:
          flag === "red"
            ? `For "${entryLabel}", how did the client respond after staff action?`
            : `For "${entryLabel}", what was the client's observed response?`,
      });
    }

    if (flag === "red" && !hasSafetyDetail) {
      questions.push({
        stepKey: `final-clarify-${index + 1}-safety-detail`,
        question: `For "${entryLabel}", was safety or a clinical concern affected, and how?`,
      });
    }

    if (flag === "red" && !hasFollowUp) {
      questions.push({
        stepKey: `final-clarify-${index + 1}-follow-up`,
        question: `For "${entryLabel}", who was notified or what follow-up is required?`,
      });
    }

    return questions.slice(0, flag === "red" ? 5 : 3).map((question) => ({
      ...question,
      kind: "input",
      allowCustom: false,
      rationale:
        flag === "red"
          ? "This documented concern needs additional clarification before the final note is generated."
          : "This documented item needs brief clarification before the final note is generated.",
      finalClarificationFlag: flag,
      finalClarificationSourceIndex: index,
    }));
  });
}

module.exports = {
  buildFinalNoteClarificationSteps,
};
