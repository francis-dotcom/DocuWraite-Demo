/**
 * Layer 8–10 — Cross-system intelligence: risks, protocols, overlays (NOT workflows).
 */

export const CROSS_SYSTEM_TYPES = [
  "risk",
  "prompting",
  "supervision",
  "assist-level",
  "protocol",
  "monitoring",
  "escalation",
  "behavioral-overlay",
  "emotional-overlay",
  "incident",
];

export const CROSS_SYSTEM_ROLE =
  "Reusable overlays that modify workflow/category context — never duplicate workflow trees.";

const RISK_KEYWORD_MAP = {
  fall: ["fall", "balance", "gait", "transfer", "mobility"],
  aspiration: ["aspiration", "chok", "swallow", "fluid", "meal"],
  seizure: ["seizure", "post-ictal"],
  elopement: ["elope", "wander", "exit"],
  skin: ["skin", "pressure", "wound"],
  diabetes: ["glucose", "blood sugar", "diabetes", "hypo", "hyper"],
  oxygen: ["oxygen", "o2", "saturation", "respiratory"],
};

export function extractCrossSystemsFromClientProfile(clientProfile = null) {
  if (!clientProfile) {
    return [];
  }

  const overlays = [];

  (clientProfile.riskCards || []).forEach((risk) => {
    overlays.push({
      type: "risk",
      id: `risk-${String(risk.title || "")
        .toLowerCase()
        .replace(/\s+/g, "-")}`,
      title: risk.title || "Risk",
      severity: risk.severity || "medium",
      guidance: risk.guidance || "",
      keywords: buildRiskKeywords(risk),
      appliesToWorkflows: inferWorkflowsForRisk(risk),
    });
  });

  return overlays;
}

function buildRiskKeywords(risk = {}) {
  const blob = `${risk.title || ""} ${risk.guidance || ""}`.toLowerCase();
  const keywords = new Set();
  Object.entries(RISK_KEYWORD_MAP).forEach(([riskType, terms]) => {
    if (terms.some((term) => blob.includes(term))) {
      keywords.add(riskType);
      terms.forEach((term) => keywords.add(term));
    }
  });
  blob.split(/\W+/).forEach((word) => {
    if (word.length > 3) {
      keywords.add(word);
    }
  });
  return Array.from(keywords);
}

function inferWorkflowsForRisk(risk = {}) {
  const blob = `${risk.title || ""} ${risk.guidance || ""}`.toLowerCase();
  const workflows = new Set();
  if (/fall|transfer|mobility|gait|adl|toilet/.test(blob)) {
    workflows.add("morning-adl");
    workflows.add("mobility");
    workflows.add("night-adl");
    workflows.add("community-outing");
  }
  if (/aspiration|meal|feed|swallow|fluid/.test(blob)) {
    workflows.add("feeding-support");
    workflows.add("medication-support");
  }
  if (/seizure|behavior|agitat/.test(blob)) {
    workflows.add("behavior-support");
  }
  if (/communication|hearing/.test(blob)) {
    workflows.add("communication-support");
  }
  if (!workflows.size) {
    return ["*"];
  }
  return Array.from(workflows);
}

export function crossSystemAppliesToWorkflow(overlay = {}, workflowId = "") {
  const targets = overlay.appliesToWorkflows || ["*"];
  return targets.includes("*") || targets.includes(workflowId);
}

export function scoreNodeForCrossSystems(node = {}, overlays = [], workflowId = "") {
  const text = `${node.question || ""} ${node.title || ""} ${node.section || ""}`.toLowerCase();
  let score = 0;
  const matched = [];

  overlays.forEach((overlay) => {
    if (!crossSystemAppliesToWorkflow(overlay, workflowId)) {
      return;
    }
    const hit = (overlay.keywords || []).some((keyword) => text.includes(String(keyword).toLowerCase()));
    if (hit) {
      score += overlay.severity === "high" ? 3 : overlay.severity === "low" ? 1 : 2;
      matched.push(overlay.id);
    }
  });

  return { score, matchedOverlays: matched };
}

export function prioritizeNodesByCrossSystems(nodes = [], overlays = [], workflowId = "") {
  if (!overlays.length) {
    return nodes;
  }
  return [...nodes].sort((left, right) => {
    const rightScore = scoreNodeForCrossSystems(right, overlays, workflowId).score;
    const leftScore = scoreNodeForCrossSystems(left, overlays, workflowId).score;
    return rightScore - leftScore;
  });
}

export function nodeMatchesCrossSystemKeywords(node = {}, overlays = [], workflowId = "") {
  return scoreNodeForCrossSystems(node, overlays, workflowId).score > 0;
}
