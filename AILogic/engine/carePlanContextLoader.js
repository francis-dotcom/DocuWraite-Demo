const path = require("path");

const adlCarePlanContextRegistry = require("../contexts/carePlanContexts/adl.json");
const mealSupportCarePlanContextRegistry = require("../contexts/carePlanContexts/mealSupport.json");
const adlWorkflowContextRequirements = require("../contexts/workFlowContexts/adlworkflow.json");
const mealWorkflowContextRequirements = require("../contexts/workFlowContexts/mealworkflow.json");

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
  const registryFiles = [adlCarePlanContextRegistry, mealSupportCarePlanContextRegistry];
  const entries = registryFiles.flatMap((file) =>
    Array.isArray(file?.entries) ? file.entries : []
  );

  ensure(
    Array.isArray(entries) && entries.length > 0,
    "Care Plan Context Registry is missing an entries array."
  );

  const entriesByKey = Object.fromEntries(entries.map((entry) => [entry.context_key, entry]));

  return {
    path: path.resolve(__dirname, "..", "contexts", "carePlanContexts"),
    raw: registryFiles,
    entries,
    entriesByKey,
  };
}

function loadWorkflowContextRequirements() {
  const workflowFiles = [adlWorkflowContextRequirements, mealWorkflowContextRequirements];
  const workflows = Object.assign(
    {},
    ...workflowFiles.map((file) =>
      file && file.workflows && typeof file.workflows === "object" ? file.workflows : {}
    )
  );

  ensure(
    workflows && typeof workflows === "object" && Object.keys(workflows).length > 0,
    "Workflow Context Requirements is missing a workflows object."
  );

  return {
    path: path.resolve(__dirname, "..", "contexts", "workFlowContexts"),
    raw: workflowFiles,
    workflows,
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
