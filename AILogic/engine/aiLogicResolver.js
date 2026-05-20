const bathingLogic = require("../ADLai/Bathing/bathing.logic.json");
const dressingLogic = require("../ADLai/Dressing/dressing.logic.json");
const finalCaseNoteLogic = require("../FinalCaseNote/final-case-note.logic.json");
const groomingLogic = require("../ADLai/Grooming/grooming.logic.json");
const hygieneLogic = require("../ADLai/Hygiene/hygiene.logic.json");
const toiletingLogic = require("../ADLai/Toileting/toileting.logic.json");
const transfersLogic = require("../ADLai/Transfers/transfers.logic.json");

const WORKFLOW_TASK_FILE_MAP = {
  "adl:bathing": "adl:bathing",
  "adl:dressing": "adl:dressing",
  "final case note:summary": "final-case-note:summary",
  "adl:grooming": "adl:grooming",
  "adl:hygiene": "adl:hygiene",
  "adl:toileting": "adl:toileting",
  "adl:transfers": "adl:transfers",
  "case note final:summary": "final-case-note:summary",
  "case-note-final:summary": "final-case-note:summary",
};

const AI_LOGIC_REGISTRY = {
  "adl:bathing": {
    key: "adl:bathing",
    source: "AILogic/ADLai/Bathing/bathing.logic.json",
    raw: bathingLogic,
  },
  "adl:dressing": {
    key: "adl:dressing",
    source: "AILogic/ADLai/Dressing/dressing.logic.json",
    raw: dressingLogic,
  },
  "final-case-note:summary": {
    key: "final-case-note:summary",
    source: "AILogic/FinalCaseNote/final-case-note.logic.json",
    raw: finalCaseNoteLogic,
  },
  "adl:grooming": {
    key: "adl:grooming",
    source: "AILogic/ADLai/Grooming/grooming.logic.json",
    raw: groomingLogic,
  },
  "adl:hygiene": {
    key: "adl:hygiene",
    source: "AILogic/ADLai/Hygiene/hygiene.logic.json",
    raw: hygieneLogic,
  },
  "adl:toileting": {
    key: "adl:toileting",
    source: "AILogic/ADLai/Toileting/toileting.logic.json",
    raw: toiletingLogic,
  },
  "adl:transfers": {
    key: "adl:transfers",
    source: "AILogic/ADLai/Transfers/transfers.logic.json",
    raw: transfersLogic,
  },
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
  if (normalizeKeyPart(workflowId) === "case note final") {
    return "final-case-note:summary";
  }

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
  return Boolean(logicPath) && Boolean(AI_LOGIC_REGISTRY[logicPath]);
}

module.exports = {
  AI_LOGIC_REGISTRY,
  WORKFLOW_TASK_FILE_MAP,
  resolveAiLogicPath,
  aiLogicExists,
};
