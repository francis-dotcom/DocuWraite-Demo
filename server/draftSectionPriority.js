/** Stable ordering for assigned-nodes draft sections (lower priority number = earlier in note). */
const SECTION_META = {
  assignedAnswers: {
    priority: 1,
    tier: "must",
    instruction: "Lead with confirmed facts from library answers.",
  },
  shiftOverdue: {
    priority: 2,
    tier: "due-now",
    instruction: "Overdue items are highest urgency after assigned answers.",
  },
  medicationsDue: {
    priority: 3,
    tier: "due-now",
    instruction: "Meds/tasks due in this block — mention times; prefer items due now or overdue.",
  },
  alerts: {
    priority: 4,
    tier: "safety",
    instruction: "Safety alerts and precautions must appear when enabled.",
  },
  activeRisks: {
    priority: 4,
    tier: "safety",
    instruction: "State active risks alongside alerts.",
  },
  appointments: {
    priority: 5,
    tier: "scheduled",
    instruction: "Appointments in time order for this shift.",
  },
  incompleteGoals: {
    priority: 6,
    tier: "goal",
    instruction: "Open goals — one concise line unless critical to safety.",
  },
  blockDescription: {
    priority: 7,
    tier: "context",
    instruction: "Block/schedule context — brief framing only.",
  },
  carePlan: {
    priority: 8,
    tier: "reference",
    instruction: "Care plan — only support details not already covered.",
  },
  existingComment: {
    priority: 9,
    tier: "merge",
    instruction: "Merge existing field text without contradicting new facts.",
  },
};

const DEFAULT_META = {
  priority: 50,
  tier: "other",
  instruction: "Include when relevant.",
};

function enrichDraftSection(entry) {
  const meta = SECTION_META[entry.key] || DEFAULT_META;
  return {
    ...entry,
    priority: meta.priority,
    tier: meta.tier,
    instruction: meta.instruction,
  };
}

function sortDraftSections(sections = []) {
  return [...sections]
    .map(enrichDraftSection)
    .sort((left, right) => left.priority - right.priority || String(left.key).localeCompare(String(right.key)));
}

module.exports = {
  SECTION_META,
  enrichDraftSection,
  sortDraftSections,
};
