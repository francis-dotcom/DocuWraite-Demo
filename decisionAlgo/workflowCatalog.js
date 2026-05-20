/**
 * Workflow → Category catalog (documentation domains, not schedule/time).
 * Schedule picks workflowId per block; assignment filters catalog by workflow + category.
 */

/** Timeline / Row Builder workflow chips (all Baseplan block workflows). */
export const WORKFLOW_SCHEDULE_OPTIONS = [
  { workflowId: "morning-adl", label: "ADL", theme: "hygiene", promptCategory: "adl" },
  { workflowId: "communication-support", label: "Communication", theme: "communication", promptCategory: "communication" },
  { workflowId: "medication-support", label: "Medication", theme: "medication", promptCategory: "medication" },
  { workflowId: "feeding-support", label: "Meal Support", theme: "meal", promptCategory: "meal" },
  { workflowId: "mobility", label: "Mobility", theme: "mobility", promptCategory: "mobility" },
  { workflowId: "behavior-support", label: "Behavior Support", theme: "behavior", promptCategory: "behavior" },
  { workflowId: "community-outing", label: "Community Outing", theme: "outing", promptCategory: "community" },
  { workflowId: "night-adl", label: "Sleep Support", theme: "sleep", promptCategory: "sleep" },
  { workflowId: "in-home-leisure", label: "Safety Monitoring", theme: "monitoring", promptCategory: "safety-monitoring" },
];

export const DOCUMENTATION_CATEGORY_LABELS = {
  core: "Core overview",
  toileting: "Toileting",
  grooming: "Grooming",
  dressing: "Dressing",
  bathing: "Bathing",
  transfers: "Transfers / mobility",
  hygiene: "Hygiene",
  hydration: "Hydration",
  prompting: "Prompting needed",
  meal: "Meal / intake",
  aspiration: "Aspiration safety",
  leisure: "Leisure activity",
  outing: "Community outing",
  transition: "Transition / return",
  behavior: "Behavior observed",
  interventions: "Interventions",
  antecedents: "Antecedents",
  monitoring: "Monitoring",
  verbal: "Verbal expression",
  receptive: "Receptive communication",
  social: "Social interaction",
  devices: "Device usage",
  barriers: "Barriers",
  effectiveness: "Support effectiveness",
  medication: "Medication",
  general: "General",
};

/** Categories offered per workflow in the Assign UI. */
export const WORKFLOW_DOCUMENTATION_CATEGORIES = {
  "morning-adl": ["toileting", "dressing", "bathing", "grooming", "transfers", "hygiene"],
  mobility: ["core", "transfers", "hydration", "prompting", "monitoring"],
  "night-adl": ["core", "toileting", "grooming", "dressing", "bathing", "transfers", "hygiene", "hydration", "prompting"],
  "feeding-support": ["core", "meal", "aspiration", "hydration", "prompting"],
  "in-home-leisure": ["core", "monitoring", "interventions", "prompting", "hydration"],
  "community-outing": ["core", "outing", "transfers", "hydration", "social"],
  "return-home": ["core", "transition", "hydration", "prompting"],
  "behavior-support": ["core", "behavior", "interventions", "antecedents", "monitoring", "prompting"],
  "communication-support": ["core", "verbal", "receptive", "social", "devices", "barriers", "effectiveness", "prompting"],
  "medication-support": ["core", "medication", "prompting"],
};

const NODE_TITLE_SLUG_TO_CATEGORY = {
  "level-2-core-tree": "core",
  "adl-areas-detail": "toileting",
  "hygiene-support": "hygiene",
  "hygiene-support-detail": "hygiene",
  "prompt-level": "prompting",
  "prompt-level-detail": "prompting",
  "mobility-support": "transfers",
  "mobility-support-detail": "transfers",
  "mobility": "transfers",
  "mobility-detail": "transfers",
  hydration: "hydration",
  "hydration-detail": "hydration",
  aspiration: "aspiration",
  "aspiration-detail": "aspiration",
  fluids: "hydration",
  "fluids-detail": "hydration",
  "meal-type-detail": "meal",
  "diet-alignment": "meal",
  "diet-detail": "meal",
  "activity-detail": "leisure",
  "outing-prep": "outing",
  "outing-prep-detail": "outing",
  "structure-support": "leisure",
  "structure-support-detail": "leisure",
  supervision: "monitoring",
  "supervision-detail": "monitoring",
  location: "outing",
  "location-detail": "outing",
  "attendance-detail": "outing",
  routine: "transition",
  "routine-detail": "transition",
  "settling-support": "transition",
  "settling-support-detail": "transition",
  "transition-detail": "transition",
  "follow-up-status": "monitoring",
  "follow-up-detail": "monitoring",
  "intervention-used": "interventions",
  "intervention-detail": "interventions",
  "behavior-detail": "behavior",
  antecedent: "antecedents",
  "antecedent-detail": "antecedents",
  "monitoring-need": "monitoring",
  "monitoring-detail": "monitoring",
  "hearing-aid-check": "devices",
  "hearing-check-detail": "devices",
  "support-type-detail": "verbal",
  "barrier-status": "barriers",
  "barrier-detail": "barriers",
  "support-effectiveness": "effectiveness",
  "effectiveness-detail": "effectiveness",
  response: "social",
  "response-detail": "social",
};

function normalizeTitleSlug(title = "") {
  return String(title || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export function getDepthLevelFromNodeId(nodeId = "") {
  const letter = String(nodeId || "").trim().charAt(0).toLowerCase();
  if (letter >= "a" && letter <= "z") {
    return letter.charCodeAt(0) - "a".charCodeAt(0) + 1;
  }
  return 1;
}

export function inferNodeDocumentationCategory(node = {}, workflowId = "") {
  if (node.category) {
    return node.category;
  }

  const slug = normalizeTitleSlug(node.title);
  if (NODE_TITLE_SLUG_TO_CATEGORY[slug]) {
    return NODE_TITLE_SLUG_TO_CATEGORY[slug];
  }

  const blob = `${node.title || ""} ${node.question || ""}`.toLowerCase();
  if (/toilet|bowel|bladder/.test(blob)) {
    return "toileting";
  }
  if (/groom|oral hygiene/.test(blob)) {
    return "grooming";
  }
  if (/dress/.test(blob)) {
    return "dressing";
  }
  if (/bath|shower/.test(blob)) {
    return "bathing";
  }
  if (/transfer|gait|mobility|ambulat/.test(blob)) {
    return "transfers";
  }
  if (/medication|meds|dose/.test(blob)) {
    return "medication";
  }
  if (/hearing|device|aid/.test(blob)) {
    return "devices";
  }
  if (/barrier|communication barrier/.test(blob)) {
    return "barriers";
  }
  if (/behavior|antecedent|intervention/.test(blob)) {
    return workflowId === "behavior-support" ? "behavior" : "general";
  }

  return "general";
}

export function getWorkflowLabel(workflowId = "", workflowOptions = WORKFLOW_SCHEDULE_OPTIONS) {
  return (
    workflowOptions.find((option) => option.workflowId === workflowId)?.label ||
    String(workflowId || "").replace(/-/g, " ")
  );
}

export function getCategoriesForWorkflow(workflowId = "") {
  const ids = WORKFLOW_DOCUMENTATION_CATEGORIES[workflowId] || ["core", "general"];
  return ids.map((id) => ({
    id,
    label: DOCUMENTATION_CATEGORY_LABELS[id] || id,
  }));
}

/**
 * Medium filter: topic categories within the active workflow (Baseplan nodes only).
 */
export function filterNodesByDocumentationCategories(
  nodes = [],
  workflowId = "",
  selectedCategoryIds = []
) {
  if (!workflowId || !selectedCategoryIds?.length) {
    return nodes;
  }

  const allowed = new Set(selectedCategoryIds);

  return nodes.filter((node) => {
    if (node.library !== "baseplan") {
      return true;
    }
    const category = inferNodeDocumentationCategory(node, workflowId);
    return allowed.has(category);
  });
}

export function groupNodesByDocumentationCategory(nodes = [], workflowId = "") {
  const groups = new Map();
  nodes.forEach((node) => {
    const categoryId = inferNodeDocumentationCategory(node, workflowId);
    const label = DOCUMENTATION_CATEGORY_LABELS[categoryId] || categoryId;
    if (!groups.has(categoryId)) {
      groups.set(categoryId, { categoryId, label, nodes: [] });
    }
    groups.get(categoryId).nodes.push(node);
  });
  return Array.from(groups.values()).sort((left, right) => left.label.localeCompare(right.label));
}

export function getDocumentationCategoryHint(workflowId = "", selectedCategoryIds = []) {
  if (!workflowId) {
    return "";
  }
  const workflowLabel = getWorkflowLabel(workflowId);
  if (!selectedCategoryIds?.length) {
    return `Workflow: ${workflowLabel} — all categories. Pick topics below to narrow (depth and branching follow).`;
  }
  const labels = selectedCategoryIds
    .map((id) => DOCUMENTATION_CATEGORY_LABELS[id] || id)
    .join(", ");
  return `Workflow: ${workflowLabel} — categories: ${labels}.`;
}
