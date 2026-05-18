const IGNORE_CHOICES = new Set([
  "skip",
  "deferred",
  "unknown",
  "not observed",
  "not applicable",
]);

const GUIDELINE_CHECKS = {
  "Staff support rendered": {
    label: "staff support rendered",
    test: (text) => /\b(support|assisted|provided|prompt|prompted|cue|cued|encouraged|helped)\b/i.test(text),
  },
  "Main support rendered": {
    label: "main support rendered",
    test: (text) => /\b(support|assisted|provided|prompt|prompted|cue|cued|encouraged|helped)\b/i.test(text),
  },
  "Whole-shift support summary": {
    label: "whole-shift support summary",
    test: (text) => /\b(throughout|across the shift|during the shift|overall|whole shift|shift)\b/i.test(text),
  },
  "Observed response": {
    label: "observed response",
    test: (text) => /\b(response|responded|tolerated|engaged|accepted|cooperated|declined|completed)\b/i.test(text),
  },
  "Main observed response": {
    label: "main observed response",
    test: (text) => /\b(response|responded|tolerated|engaged|accepted|cooperated|declined|completed)\b/i.test(text),
  },
  "Whole-shift response summary": {
    label: "whole-shift response summary",
    test: (text) => /\b(response|responded|tolerated|engaged|accepted|cooperated|declined|completed)\b/i.test(text),
  },
  "Safety or health detail": {
    label: "safety or health detail",
    test: (text) => /\b(safety|health|medication|oxygen|glucose|vital|symptom|fall|aspiration|seizure|pain|nurse|clinical|risk)\b/i.test(text),
  },
  "Alerts or health detail": {
    label: "alerts or health detail",
    test: (text) => /\b(alert|safety|health|medication|oxygen|glucose|vital|symptom|fall|aspiration|seizure|pain|nurse|clinical|risk)\b/i.test(text),
  },
  "Health and safety supports": {
    label: "health and safety supports",
    test: (text) => /\b(safety|health|medication|oxygen|glucose|vital|symptom|fall|aspiration|seizure|pain|monitor|risk)\b/i.test(text),
  },
  "Follow-up need": {
    label: "follow-up need",
    test: (text) => /\b(follow-up|follow up|monitor|pending|continue|later|next shift|handoff|revisit)\b/i.test(text),
  },
  "Follow-up or carryover": {
    label: "follow-up or carryover",
    test: (text) => /\b(follow-up|follow up|carryover|pending|continue|later|next shift|handoff|revisit)\b/i.test(text),
  },
  "Follow-up and handoff needs": {
    label: "follow-up and handoff needs",
    test: (text) => /\b(follow-up|follow up|handoff|next shift|pending|continue|monitor|revisit)\b/i.test(text),
  },
  "Unresolved items": {
    label: "unresolved items",
    test: (text) => /\b(unresolved|pending|carryover|not yet resolved)\b/i.test(text),
  },
  "Monitoring needs": {
    label: "monitoring needs",
    test: (text) => /\b(monitor|monitoring|observe|watch closely)\b/i.test(text),
  },
  "Pending health tasks": {
    label: "pending health tasks",
    test: (text) => /\b(pending|due|later|medication|oxygen|glucose|vital|health)\b/i.test(text),
  },
  "Pending behavior follow-up": {
    label: "pending behavior follow-up",
    test: (text) => /\b(behavior|follow-up|follow up|monitor|pending|revisit)\b/i.test(text),
  },
  "Priority reminders": {
    label: "priority reminders",
    test: (text) => /\b(priority|remember|reminder|important|monitor)\b/i.test(text),
  },
  "Behavior and intervention summary": {
    label: "behavior and intervention summary",
    test: (text) => /\b(behavior|intervention|redirect|redirection|de-escalat|boundary|prompt)\b/i.test(text),
  },
  "Runtime context": {
    label: "runtime context",
    test: (text) => /\b(during|while|before|after|at\s+\d|later|earlier)\b/i.test(text),
  },
  "Compliance detail": {
    label: "compliance detail",
    test: (text) => /\b(protocol|care plan|guideline|compliance|required|per plan)\b/i.test(text),
  },
  "Require escalation language": {
    label: "escalation language",
    test: (text) => /\b(escalat|notified|informed|reported)\b/i.test(text),
  },
  "Include escalation summary": {
    label: "escalation summary",
    test: (text) => /\b(escalat|notified|informed|reported)\b/i.test(text),
  },
  "Include escalation outcome": {
    label: "escalation outcome",
    test: (text) => /\b(escalat|notified|informed|reported)\b/i.test(text),
  },
  "Highlight escalation already taken": {
    label: "escalation already taken",
    test: (text) => /\b(escalat|notified|informed|reported)\b/i.test(text),
  },
  "Require supervisor-review language": {
    label: "supervisor-review language",
    test: (text) => /\bsupervisor\b/i.test(text),
  },
  "Require supervisor-review phrasing": {
    label: "supervisor-review phrasing",
    test: (text) => /\bsupervisor\b/i.test(text),
  },
  "Include supervisor-review detail": {
    label: "supervisor-review detail",
    test: (text) => /\bsupervisor\b/i.test(text),
  },
  "Flag supervisor-aware items": {
    label: "supervisor-aware items",
    test: (text) => /\bsupervisor\b/i.test(text),
  },
  "Include unresolved-item detail": {
    label: "unresolved-item detail",
    test: (text) => /\b(unresolved|pending|carryover)\b/i.test(text),
  },
  "Require unresolved-risk wording": {
    label: "unresolved-risk wording",
    test: (text) => /\b(unresolved|pending|risk)\b/i.test(text),
  },
  "Require handoff emphasis": {
    label: "handoff emphasis",
    test: (text) => /\b(handoff|next shift|carryover)\b/i.test(text),
  },
  "Require clinical follow-up wording": {
    label: "clinical follow-up wording",
    test: (text) => /\b(clinical|nurse|follow-up|follow up)\b/i.test(text),
  },
};

function normalizeSelectedChoices(assignedNodes = []) {
  return assignedNodes
    .filter((node) => node?.library === "aidraft")
    .flatMap((node) => (Array.isArray(node.selectedChoices) ? node.selectedChoices : []))
    .map((choice) => String(choice || "").trim())
    .filter((choice) => choice && !IGNORE_CHOICES.has(choice.toLowerCase()));
}

function buildGuidelineWarning(missingLabels = []) {
  if (!missingLabels.length) {
    return "";
  }

  const summary =
    missingLabels.length === 1
      ? missingLabels[0]
      : `${missingLabels.slice(0, -1).join(", ")}, and ${missingLabels[missingLabels.length - 1]}`;

  return `This note does not meet the selected IntelliDraft guidelines yet. Missing or unclear guideline coverage: ${summary}. Skip this warning or apply the guideline and regenerate.`;
}

function evaluateAssignedDraftGuidelines({ draftNote = "", fieldContext = {} }) {
  const assignedNodes = Array.isArray(fieldContext.assignedNodes) ? fieldContext.assignedNodes : [];
  const selectedChoices = Array.from(new Set(normalizeSelectedChoices(assignedNodes)));

  if (!selectedChoices.length) {
    return {
      passed: true,
      warning: "",
      missing: [],
    };
  }

  const noteText = String(draftNote || "").trim();
  if (!noteText) {
    return {
      passed: false,
      warning: buildGuidelineWarning(["generated note content"]),
      missing: ["generated note content"],
    };
  }

  const missing = selectedChoices
    .map((choice) => {
      const check = GUIDELINE_CHECKS[choice];
      if (!check) {
        return null;
      }
      return check.test(noteText) ? null : check.label;
    })
    .filter(Boolean);

  return {
    passed: missing.length === 0,
    warning: buildGuidelineWarning(missing),
    missing,
  };
}

module.exports = {
  evaluateAssignedDraftGuidelines,
};
