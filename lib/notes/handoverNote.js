function normalizeText(value = "") {
  return String(value || "").trim();
}

function toSentence(value = "") {
  const text = normalizeText(value);
  if (!text) {
    return "";
  }
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function normalizeList(items = [], options = {}) {
  const exclude = new Set((options.exclude || []).map((item) => String(item || "").trim().toLowerCase()));
  return []
    .concat(items || [])
    .map((item) => normalizeText(item))
    .filter((item) => item && !exclude.has(item.toLowerCase()));
}

export function generateHandoverNote(answers = {}, fieldContext = {}, helpers = {}) {
  const {
    getWorkflowAnswer = () => undefined,
    formatAssignedWorkflowAnswer = (value) => value,
  } = helpers;

  const sourceEntries = fieldContext.sourceEntries || [];
  const nonEmptyEntries = sourceEntries
    .map((entry) => ({
      entryType: entry.entryType,
      comment: normalizeText(entry.comment),
    }))
    .filter((entry) => entry.comment);
  const finalSummaryEntry =
    nonEmptyEntries.find((entry) => entry.entryType === "final-summary")?.comment || "";
  const supportingEntries = nonEmptyEntries
    .filter((entry) => entry.entryType !== "final-summary")
    .map((entry) => entry.comment);
  const focus = formatAssignedWorkflowAnswer(getWorkflowAnswer(answers, "handover_focus"));
  const priority = formatAssignedWorkflowAnswer(getWorkflowAnswer(answers, "handover_priority"));
  const normalizedFocus = normalizeText(focus).toLowerCase();
  const normalizedPriority = normalizeText(priority).toLowerCase();
  const resolvedSupports = normalizeList(getWorkflowAnswer(answers, "resolved_supports") || []);
  const carryForward = [
    ...normalizeList(getWorkflowAnswer(answers, "carry_forward_items") || [], {
      exclude: ["Other", "None"],
    }),
    normalizeText(getWorkflowAnswer(answers, "carry_forward_items_other")),
  ].filter(Boolean);
  const notifications = normalizeList(getWorkflowAnswer(answers, "notifications_completed") || []);
  const nextShiftActions = [
    ...normalizeList(getWorkflowAnswer(answers, "next_shift_actions") || [], {
      exclude: ["Other"],
    }),
    normalizeText(getWorkflowAnswer(answers, "next_shift_actions_other")),
  ].filter(Boolean);
  const answeredVitals = [
    ...normalizeList(getWorkflowAnswer(answers, "vitals_reviewed") || [], {
      exclude: ["Other reading", "No vitals reviewed"],
    }),
    normalizeText(getWorkflowAnswer(answers, "vitals_reviewed_other")),
  ].filter(Boolean);
  const contextVitals = normalizeList([
    ...(fieldContext.handoverVitals || []).map((item) => {
      const label = normalizeText(item?.label);
      const value = normalizeText(item?.value);
      return value ? `${label}: ${value}` : label;
    }),
    normalizeText(fieldContext.handoverOtherVitals),
  ]);
  const vitals = answeredVitals.length ? answeredVitals : contextVitals;
  const freeNote = normalizeText(getWorkflowAnswer(answers, "free_note")) || normalizeText(fieldContext.manualHandoverNotes);

  const focusLeadByType = {
    "routine shift transition":
      "This handover reflects a routine shift transition with emphasis on continuity of supports and routine monitoring.",
    "clinical monitoring":
      "This handover is clinically focused and should guide the next shift toward close observation of health, symptoms, and follow-up needs.",
    "behavioral follow-up":
      "This handover centers behavioral presentation, intervention continuity, and what the next shift should continue monitoring.",
    "medication follow-up":
      "This handover emphasizes medication-related awareness, follow-up, and any related carry-forward monitoring.",
    "safety concern carry-forward":
      "This handover is safety-focused and should be treated as a carry-forward alert for the next shift.",
    "mixed handoff":
      "This handover includes multiple domains and should be reviewed as a mixed shift handoff with both routine and concern-based carry-forward items.",
  };

  const prioritySentenceByType = {
    routine:
      "Priority is routine, but the next shift should still review the summarized supports and ongoing expectations.",
    "watch closely next shift":
      "The next shift should watch the identified items closely and document any change from the current presentation.",
    "supervisor review needed":
      "Supervisor visibility is needed on the carry-forward items from this shift.",
    "clinical follow-up needed":
      "Clinical follow-up should remain explicit in handoff, and the next shift should maintain awareness of related observations or symptom changes.",
    "immediate carry-forward priority":
      "This handoff includes immediate carry-forward priorities that should be reviewed at the start of the next shift without delay.",
  };

  const parts = [];
  if (focusLeadByType[normalizedFocus]) {
    parts.push(focusLeadByType[normalizedFocus]);
  } else if (focus) {
    parts.push(`Handover focus: ${focus}.`);
  }
  if (prioritySentenceByType[normalizedPriority]) {
    parts.push(prioritySentenceByType[normalizedPriority]);
  } else if (priority) {
    parts.push(`Priority level: ${priority}.`);
  }
  if (resolvedSupports.length) {
    parts.push(`Completed supports acknowledged in handoff: ${resolvedSupports.join(", ")}.`);
  }
  if (finalSummaryEntry) {
    parts.push(`Shift summary for handoff: ${toSentence(finalSummaryEntry)}`);
  }
  if (supportingEntries.length) {
    parts.push(`Supporting note details: ${supportingEntries.join(" ")}`);
  }
  if (carryForward.length) {
    parts.push(`Carry-forward items for the next shift: ${carryForward.join(", ")}.`);
  }
  if (notifications.length) {
    parts.push(`Notifications already completed this shift: ${notifications.join(", ")}.`);
  }
  if (nextShiftActions.length) {
    parts.push(`Next-shift actions should include: ${nextShiftActions.join(", ")}.`);
  }
  if (vitals.length) {
    parts.push(`Vitals or readings reviewed for handoff: ${vitals.join(", ")}.`);
  }
  if (freeNote) {
    parts.push(`Additional handover guidance: ${toSentence(freeNote)}`);
  }

  return parts.length
    ? parts.join(" ")
    : "No handover details were captured for this shift.";
}
