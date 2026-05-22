/**
 * Decision Algo — draft context question trees ("Include when generating").
 * Library: draft-context-trees · export: DRAFT_CONTEXT_QUESTION_TREES
 * Edit nodes / branch / defaultNext here. Keys must match draft toggle keys in App.js.
 */

const COMPLETION_CHOICES = ["Yes, completed", "Partially completed", "Not yet", "Not applicable"];
const YES_NO = ["Yes", "No", "Not applicable"];

function shiftChoices(intel, intelKey, max = 4) {
  const items = Array.isArray(intel?.[intelKey]) ? intel[intelKey] : [];
  const trimmed = items
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, max);
  if (!trimmed.length) {
    return ["No items listed on shift card", "Not applicable"];
  }
  return [...trimmed, "Multiple items", "Not applicable"];
}

/** @type {Record<string, { label: string, start: string, nodes: Record<string, object> }>} */
export const DRAFT_CONTEXT_QUESTION_TREES = {
  shiftOverdue: {
    label: "Shift overdue",
    start: "overdue-which",
    nodes: {
      "overdue-which": {
        question: "Which overdue item are you addressing in this block?",
        dynamicSuggestions: { intelKey: "overdue" },
        branch: {
          "Not applicable": null,
          __default__: "overdue-status",
        },
      },
      "overdue-status": {
        question: "What is the status of that overdue item?",
        suggestions: COMPLETION_CHOICES,
        branch: {
          "Partially completed": "overdue-partial-detail",
          "Not yet": "overdue-plan",
          __default__: null,
        },
      },
      "overdue-partial-detail": {
        question: "What was completed, and what is still outstanding?",
        kind: "text",
        defaultNext: null,
      },
      "overdue-plan": {
        question: "When will the remaining overdue work be completed?",
        kind: "text",
        defaultNext: null,
      },
    },
  },
  medicationsDue: {
    label: "Meds due",
    start: "meds-which",
    nodes: {
      "meds-which": {
        question: "Which medication or task due are you documenting?",
        dynamicSuggestions: { intelKey: "medicationsDue" },
        branch: {
          "Not applicable": null,
          __default__: "meds-completed",
        },
      },
      "meds-completed": {
        question: "Was it completed as scheduled?",
        suggestions: ["Completed on time", "Completed late", "Refused", "Held per protocol", "Not yet done"],
        branch: {
          "Refused": "meds-refused-detail",
          "Held per protocol": "meds-held-detail",
          "Not yet done": "meds-not-done-detail",
          __default__: "meds-observation",
        },
      },
      "meds-refused-detail": {
        question: "Describe refusal and follow-up (notify nurse/supervisor, retry, etc.).",
        kind: "text",
        defaultNext: null,
      },
      "meds-held-detail": {
        question: "Why was it held, and who was notified?",
        kind: "text",
        defaultNext: null,
      },
      "meds-not-done-detail": {
        question: "Why not done yet, and what is the plan this shift?",
        kind: "text",
        defaultNext: null,
      },
      "meds-observation": {
        question: "Any observations (vitals, response, side effects)?",
        suggestions: ["No concerns noted", "Mild concern — documented below", "Other..."],
        branch: {
          "Other...": "meds-observation-text",
          "Mild concern — documented below": "meds-observation-text",
          __default__: null,
        },
      },
      "meds-observation-text": {
        question: "Brief observation for the note.",
        kind: "text",
        defaultNext: null,
      },
    },
  },
  alerts: {
    label: "Alerts",
    start: "alert-which",
    nodes: {
      "alert-which": {
        question: "Which alert or precaution applied during this block?",
        dynamicSuggestions: { intelKey: "alerts" },
        branch: {
          "Not applicable": null,
          __default__: "alert-followed",
        },
      },
      "alert-followed": {
        question: "Was the required precaution followed?",
        suggestions: ["Yes, throughout block", "Partially", "No — incident or gap", "Not applicable"],
        branch: {
          "Partially": "alert-partial-detail",
          "No — incident or gap": "alert-gap-detail",
          __default__: "alert-risks",
        },
      },
      "alert-partial-detail": {
        question: "What was followed, and what was missed?",
        kind: "text",
        defaultNext: "alert-risks",
      },
      "alert-gap-detail": {
        question: "Describe the gap and immediate actions taken.",
        kind: "text",
        defaultNext: "alert-risks",
      },
      "alert-risks": {
        question: "Any related high risks to state in the note (falls, aspiration, etc.)?",
        suggestions: [...YES_NO, "Already covered above"],
        branch: {
          "Yes": "alert-risks-detail",
          __default__: null,
        },
      },
      "alert-risks-detail": {
        question: "Which risks and what mitigation was in place?",
        kind: "text",
        defaultNext: null,
      },
    },
  },
  appointments: {
    label: "Appointments",
    start: "appt-which",
    nodes: {
      "appt-which": {
        question: "Which appointment or outing applies to this note?",
        dynamicSuggestions: { intelKey: "appointments" },
        branch: {
          "Not applicable": null,
          __default__: "appt-status",
        },
      },
      "appt-status": {
        question: "What was the status?",
        suggestions: [
          "Attended as scheduled",
          "Rescheduled",
          "Cancelled",
          "In progress during this block",
          "Not applicable",
        ],
        branch: {
          "Rescheduled": "appt-detail",
          "Cancelled": "appt-detail",
          __default__: "appt-support",
        },
      },
      "appt-detail": {
        question: "Reason and communication (who was notified).",
        kind: "text",
        defaultNext: "appt-support",
      },
      "appt-support": {
        question: "Level of staff support and any behavioral/medical concerns during the event?",
        suggestions: ["Routine support only", "Extra support required", "No concerns", "Other..."],
        branch: {
          "Other...": "appt-support-text",
          "Extra support required": "appt-support-text",
          __default__: null,
        },
      },
      "appt-support-text": {
        question: "Brief detail for the note.",
        kind: "text",
        defaultNext: null,
      },
    },
  },
  incompleteGoals: {
    label: "Incomplete goals",
    start: "goal-which",
    nodes: {
      "goal-which": {
        question: "Which open goal are you addressing?",
        dynamicSuggestions: { intelKey: "incompleteGoals" },
        branch: {
          "Not applicable": null,
          __default__: "goal-progress",
        },
      },
      "goal-progress": {
        question: "Progress toward the goal this block?",
        suggestions: [
          "Goal met",
          "Progress observed",
          "Minimal or no progress",
          "Not addressed this block",
        ],
        branch: {
          "Minimal or no progress": "goal-barrier",
          "Not addressed this block": "goal-why-not",
          __default__: "goal-prompt",
        },
      },
      "goal-barrier": {
        question: "What barrier affected progress?",
        kind: "text",
        defaultNext: "goal-prompt",
      },
      "goal-why-not": {
        question: "Why was the goal not addressed?",
        kind: "text",
        defaultNext: null,
      },
      "goal-prompt": {
        question: "Prompt level / assistance provided (if applicable)?",
        suggestions: ["Independent", "Verbal prompt", "Physical assist", "Not applicable"],
        defaultNext: null,
      },
    },
  },
  carePlan: {
    label: "Care plan",
    start: "plan-focus",
    nodes: {
      "plan-focus": {
        question: "Which care-plan area does this note need to reflect?",
        suggestions: [
          "ADLs / personal care",
          "Behavior support",
          "Medical / health",
          "Community / outings",
          "Communication",
          "Other",
        ],
        branch: {
          "Other": "plan-focus-text",
          __default__: "plan-aligned",
        },
      },
      "plan-focus-text": {
        question: "Specify the care-plan focus.",
        kind: "text",
        defaultNext: "plan-aligned",
      },
      "plan-aligned": {
        question: "Does the support you provided align with the written plan?",
        suggestions: [...YES_NO, "Partially — explain below"],
        branch: {
          "Partially — explain below": "plan-deviation",
          "No": "plan-deviation",
          __default__: null,
        },
      },
      "plan-deviation": {
        question: "Describe deviation and rationale (physician order, safety, individual choice).",
        kind: "text",
        defaultNext: null,
      },
    },
  },
  blockDescription: {
    label: "Block note",
    start: "block-confirm",
    nodes: {
      "block-confirm": {
        question: "Does the schedule block description match what you actually did?",
        suggestions: ["Yes", "Mostly — minor differences", "No — significant differences"],
        branch: {
          "No — significant differences": "block-actual",
          "Mostly — minor differences": "block-actual",
          __default__: null,
        },
      },
      "block-actual": {
        question: "What actually occurred during this block?",
        kind: "text",
        defaultNext: null,
      },
    },
  },
  existingComment: {
    label: "This field",
    start: "field-merge",
    nodes: {
      "field-merge": {
        question: "How should existing text in this field be treated?",
        suggestions: [
          "Keep and add to it",
          "Replace outdated parts",
          "Ignore — draft is complete replacement",
        ],
        branch: {
          "Replace outdated parts": "field-replace-detail",
          __default__: null,
        },
      },
      "field-replace-detail": {
        question: "What should be removed or corrected from the existing text?",
        kind: "text",
        defaultNext: null,
      },
    },
  },
};

const TOGGLE_KEYS_WITH_TREES = Object.keys(DRAFT_CONTEXT_QUESTION_TREES);

export function draftContextResponseKey(toggleKey, nodeId) {
  return `draftCtx:${toggleKey}:${nodeId}`;
}

export function parseDraftContextResponseKey(key = "") {
  const match = String(key).match(/^draftCtx:([^:]+):(.+)$/);
  if (!match) {
    return null;
  }
  return { toggleKey: match[1], nodeId: match[2] };
}

function resolveNode(tree, nodeId, fieldContext = {}) {
  const node = tree?.nodes?.[nodeId];
  if (!node) {
    return null;
  }
  if (node.dynamicSuggestions?.intelKey) {
    const intel = fieldContext.shiftIntelligence || {};
    return {
      ...node,
      suggestions: shiftChoices(intel, node.dynamicSuggestions.intelKey),
    };
  }
  return node;
}

function resolveNextNodeId(tree, nodeId, answer) {
  const node = tree.nodes[nodeId];
  if (!node) {
    return null;
  }
  if (node.kind === "text") {
    return node.defaultNext ?? null;
  }
  const branch = node.branch || {};
  if (branch[answer] === null) {
    return null;
  }
  if (branch[answer]) {
    return branch[answer];
  }
  if (branch.__default__ !== undefined) {
    return branch.__default__;
  }
  return node.defaultNext ?? null;
}

export function getDraftContextTogglesNeedingQuestions(toggles = {}) {
  return TOGGLE_KEYS_WITH_TREES.filter((key) => Boolean(toggles[key]));
}

export function getActiveDraftContextQuestion(toggleKey, responses = {}, fieldContext = {}) {
  const tree = DRAFT_CONTEXT_QUESTION_TREES[toggleKey];
  if (!tree) {
    return null;
  }

  let nodeId = tree.start;
  while (nodeId) {
    const node = resolveNode(tree, nodeId, fieldContext);
    if (!node) {
      return null;
    }
    const responseKey = draftContextResponseKey(toggleKey, nodeId);
    const answer = responses[responseKey];
    if (answer === undefined || answer === null || String(answer).trim() === "") {
      return {
        toggleKey,
        treeLabel: tree.label,
        nodeId,
        question: node.question,
        suggestions: node.suggestions || [],
        kind: node.kind || "choice",
        responseKey,
      };
    }
    nodeId = resolveNextNodeId(tree, nodeId, answer);
  }

  return null;
}

export function getFirstIncompleteDraftContextQuestion(toggles = {}, responses = {}, fieldContext = {}) {
  for (const toggleKey of getDraftContextTogglesNeedingQuestions(toggles)) {
    const active = getActiveDraftContextQuestion(toggleKey, responses, fieldContext);
    if (active) {
      return active;
    }
  }
  return null;
}

export function countIncompleteDraftContextQuestions(toggles = {}, responses = {}, fieldContext = {}) {
  let count = 0;
  for (const toggleKey of getDraftContextTogglesNeedingQuestions(toggles)) {
    if (getActiveDraftContextQuestion(toggleKey, responses, fieldContext)) {
      count += 1;
    }
  }
  return count;
}

export function getDraftContextQuestionTrail(toggles = {}, responses = {}, fieldContext = {}) {
  const trail = [];

  for (const toggleKey of getDraftContextTogglesNeedingQuestions(toggles)) {
    const tree = DRAFT_CONTEXT_QUESTION_TREES[toggleKey];
    if (!tree) {
      continue;
    }

    let nodeId = tree.start;
    while (nodeId) {
      const node = resolveNode(tree, nodeId, fieldContext);
      if (!node) {
        break;
      }

      const responseKey = draftContextResponseKey(toggleKey, nodeId);
      const answer = responses[responseKey];
      const answered = !(answer === undefined || answer === null || String(answer).trim() === "");

      trail.push({
        toggleKey,
        treeLabel: tree.label,
        nodeId,
        question: node.question,
        suggestions: node.suggestions || [],
        kind: node.kind || "choice",
        responseKey,
        answered,
      });

      if (!answered) {
        return trail;
      }

      nodeId = resolveNextNodeId(tree, nodeId, answer);
    }
  }

  return trail;
}

export function rewindDraftContextResponses(toggles = {}, responses = {}, fieldContext = {}) {
  const trail = getDraftContextQuestionTrail(toggles, responses, fieldContext);
  const activeIndex = trail.findIndex((entry) => !entry.answered);
  if (activeIndex <= 0) {
    return responses;
  }

  const targetIndex = activeIndex - 1;
  const nextResponses = { ...(responses || {}) };
  trail.slice(targetIndex).forEach((entry) => {
    delete nextResponses[entry.responseKey];
  });
  return nextResponses;
}

export function clearDraftContextResponsesForToggle(responses = {}, toggleKey) {
  const prefix = `draftCtx:${toggleKey}:`;
  const next = { ...responses };
  Object.keys(next).forEach((key) => {
    if (key.startsWith(prefix)) {
      delete next[key];
    }
  });
  return next;
}

export function collectDraftContextResponsesByToggle(responses = {}) {
  const grouped = {};
  Object.entries(responses || {}).forEach(([key, value]) => {
    const parsed = parseDraftContextResponseKey(key);
    if (!parsed || !String(value || "").trim()) {
      return;
    }
    if (!grouped[parsed.toggleKey]) {
      grouped[parsed.toggleKey] = [];
    }
    grouped[parsed.toggleKey].push({
      nodeId: parsed.nodeId,
      answer: String(value).trim(),
    });
  });
  return grouped;
}

export function formatDraftContextClarificationsForPrompt(toggleKey, responses = {}, fieldContext = {}) {
  const tree = DRAFT_CONTEXT_QUESTION_TREES[toggleKey];
  if (!tree) {
    return [];
  }
  const prefix = `draftCtx:${toggleKey}:`;
  return Object.entries(responses || {})
    .filter(([key, value]) => key.startsWith(prefix) && String(value || "").trim())
    .map(([key, value]) => {
      const nodeId = key.slice(prefix.length);
      const node = tree.nodes[nodeId];
      return {
        question: node?.question || nodeId,
        answer: String(value).trim(),
      };
    });
}
