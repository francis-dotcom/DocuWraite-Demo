/**
 * Layer 13 — Universal escalation triggers (any workflow).
 */

export const ESCALATION_TRIGGERS = [
  "near-fall",
  "refusal-escalation",
  "aggressive-behavior",
  "choking",
  "seizure-event",
  "medication-refusal",
  "injury",
  "elopement",
];

export const ESCALATION_KEYWORD_RE =
  /\b(escalat|incident|emergency|supervisor|protocol|near[\s-]?fall|refusal|chok|seizure|injury|elope)\b/i;

export const ESCALATION_ENGINE_ROLE =
  "Triggers incident workflows, supervisor review, and mandatory follow-up — separate from workflow trees.";

export function nodeTriggersEscalation(node = {}) {
  const text = `${node.question || ""} ${node.title || ""}`.trim();
  return ESCALATION_KEYWORD_RE.test(text);
}

export function buildEscalationFlags(nodes = []) {
  return nodes.filter((node) => nodeTriggersEscalation(node)).map((node) => ({
    nodeId: node.id,
    library: node.library,
    section: node.section,
    reason: "escalation-keyword-match",
  }));
}
