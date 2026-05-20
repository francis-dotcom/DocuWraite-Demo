const fs = require("fs");
const path = require("path");

const AI_LOGIC_ROOT = path.resolve(__dirname, "..");

const WORKFLOW_TASK_FILE_MAP = {
  "adl:toileting": path.join(AI_LOGIC_ROOT, "ADLai", "Toileting", "toileting.logic.json"),
};

function normalizeKeyPart(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function buildLookupKey(category = "", task = "") {
  return `${normalizeKeyPart(category)}:${normalizeKeyPart(task)}`;
}

function resolveAiLogicPath({ category = "", task = "", workflowId = "", fieldContext = {} } = {}) {
  const lookupKey = buildLookupKey(category, task);
  if (WORKFLOW_TASK_FILE_MAP[lookupKey]) {
    return WORKFLOW_TASK_FILE_MAP[lookupKey];
  }

  const inferredCategory = category || workflowId || fieldContext.category || fieldContext.workflowId || "";
  const inferredTask = task || fieldContext.task || fieldContext.taskLabel || fieldContext.description || "";
  const fallbackKey = buildLookupKey(inferredCategory, inferredTask);
  if (WORKFLOW_TASK_FILE_MAP[fallbackKey]) {
    return WORKFLOW_TASK_FILE_MAP[fallbackKey];
  }

  return null;
}

function aiLogicExists(logicPath = "") {
  return Boolean(logicPath) && fs.existsSync(logicPath);
}

module.exports = {
  AI_LOGIC_ROOT,
  WORKFLOW_TASK_FILE_MAP,
  resolveAiLogicPath,
  aiLogicExists,
};
