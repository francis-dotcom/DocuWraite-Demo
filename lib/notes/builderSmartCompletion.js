import { WORKFLOW_SCHEDULE_OPTIONS } from "../../decisionAlgo/workflowCatalog";

const {
  getMealSupportSubworkflowLabel,
  resolveBuilderPromptVariants,
} = require("../../AILogic/engine/builderPromptResolver");

function uniqueValues(values = []) {
  return [...new Set((values || []).filter(Boolean))];
}

function appendScopeLabel(base = "", scopeLabel = "") {
  const trimmed = String(base || "").replace(/[.\s]+$/, "");
  if (!trimmed) {
    return "";
  }
  if (trimmed.toLowerCase().endsWith(scopeLabel.toLowerCase())) {
    return `${trimmed}.`;
  }
  return `${trimmed} ${scopeLabel}.`;
}

export { getMealSupportSubworkflowLabel };

export function buildBuilderSmartSuggestions({
  mode = "row",
  workflowId = "",
  workflowOptions = WORKFLOW_SCHEDULE_OPTIONS,
  mealSubworkflow = "",
  mealSupportOptions = [],
  currentText = "",
  carePlanContext = null,
} = {}) {
  const workflow = workflowOptions.find((option) => option.workflowId === workflowId) || null;
  const promptCategory = workflow?.promptCategory || "";
  const scopeLabel = mode === "block" ? "for this time block" : "for this case-note row";
  const variants = resolveBuilderPromptVariants({
    promptCategory,
    workflowId,
    mealSubworkflow,
    mealSupportOptions,
    currentText,
    carePlanContext,
  });

  return uniqueValues(variants.map((item) => appendScopeLabel(item, scopeLabel))).slice(0, 12);
}

export function buildBuilderSmartCompletion(options = {}) {
  return buildBuilderSmartSuggestions(options)[0] || "";
}
