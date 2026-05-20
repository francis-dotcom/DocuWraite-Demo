const path = require("path");

const carePlanContextRegistry = require("../carePlanContextRegistry.json");
const workflowContextRequirements = require("../workflowContextRequirements.json");

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeWorkflowTag(workflowTag = "") {
  const raw = String(workflowTag || "").trim().toLowerCase();
  if (!raw) {
    return "";
  }
  return raw.startsWith("#") ? raw : `#${raw}`;
}

function loadCarePlanContextRegistry() {
  ensure(
    Array.isArray(carePlanContextRegistry.entries),
    "Care Plan Context Registry is missing an entries array."
  );

  const entriesByKey = Object.fromEntries(
    carePlanContextRegistry.entries.map((entry) => [entry.context_key, entry])
  );

  return {
    path: path.resolve(__dirname, "..", "carePlanContextRegistry.json"),
    raw: carePlanContextRegistry,
    entries: carePlanContextRegistry.entries,
    entriesByKey,
  };
}

function loadWorkflowContextRequirements() {
  ensure(
    workflowContextRequirements.workflows && typeof workflowContextRequirements.workflows === "object",
    "Workflow Context Requirements is missing a workflows object."
  );

  return {
    path: path.resolve(__dirname, "..", "workflowContextRequirements.json"),
    raw: workflowContextRequirements,
    workflows: workflowContextRequirements.workflows,
  };
}

function getWorkflowContextRequirement(workflowTag = "") {
  const normalizedTag = normalizeWorkflowTag(workflowTag);
  const requirements = loadWorkflowContextRequirements();
  const workflow = requirements.workflows[normalizedTag];
  ensure(workflow, `No workflow context requirement found for ${normalizedTag || "blank workflow tag"}.`);

  return {
    workflowTag: normalizedTag,
    label: workflow.label || normalizedTag.replace(/^#/, ""),
    requiredKeys: Array.isArray(workflow.required_keys) ? workflow.required_keys : [],
    optionalKeys: Array.isArray(workflow.optional_keys) ? workflow.optional_keys : [],
    raw: workflow,
  };
}

function getWorkflowContextEntries(workflowTag = "") {
  const registry = loadCarePlanContextRegistry();
  const workflow = getWorkflowContextRequirement(workflowTag);
  const requiredEntries = workflow.requiredKeys.map((key) => registry.entriesByKey[key]).filter(Boolean);
  const optionalEntries = workflow.optionalKeys.map((key) => registry.entriesByKey[key]).filter(Boolean);

  return {
    workflowTag: workflow.workflowTag,
    label: workflow.label,
    requiredEntries,
    optionalEntries,
    registry,
  };
}

module.exports = {
  normalizeWorkflowTag,
  loadCarePlanContextRegistry,
  loadWorkflowContextRequirements,
  getWorkflowContextRequirement,
  getWorkflowContextEntries,
};
