const bathingLogic = require("../ADL/Bathing/bathing.logic.json");
const dressingLogic = require("../ADL/Dressing/dressing.logic.json");
const finalCaseNoteLogic = require("../FinalCaseNote/final-case-note.logic.json");
const groomingLogic = require("../ADL/Grooming/grooming.logic.json");
const handoverNoteLogic = require("../HandoverNote/handover-note.logic.json");
const hygieneLogic = require("../ADL/Hygiene/hygiene.logic.json");
const aspirationPrecautionsLogic = require("../MealSupport/AspirationPrecautions/aspiration-precautions.logic.json");
const feedingAssistanceLogic = require("../MealSupport/FeedingAssistance/feeding-assistance.logic.json");
const hydrationSupportLogic = require("../MealSupport/HydrationSupport/hydration-support.logic.json");
const intakeMonitoringLogic = require("../MealSupport/IntakeMonitoring/intake-monitoring.logic.json");
const mealSetupLogic = require("../MealSupport/MealSetup/meal-setup.logic.json");
const snackSupportLogic = require("../MealSupport/SnackSupport/snack-support.logic.json");
const toiletingLogic = require("../ADL/Toileting/toileting.logic.json");
const transfersLogic = require("../ADL/Transfers/transfers.logic.json");

const WORKFLOW_TASK_FILE_MAP = {
  "adl:bathing": "adl:bathing",
  "adl:dressing": "adl:dressing",
  "final case note:summary": "final-case-note:summary",
  "handover note:shift handoff": "handover-note:shift-handoff",
  "adl:grooming": "adl:grooming",
  "adl:hygiene": "adl:hygiene",
  "adl:toileting": "adl:toileting",
  "adl:transfers": "adl:transfers",
  "meal support:aspiration precautions": "meal-support:aspiration-precautions",
  "meal support:feeding assistance": "meal-support:feeding-assistance",
  "meal support:hydration support": "meal-support:hydration-support",
  "meal support:intake monitoring": "meal-support:intake-monitoring",
  "meal support:meal setup": "meal-support:meal-setup",
  "meal support:snack support": "meal-support:snack-support",
  "case note final:summary": "final-case-note:summary",
  "case-note-final:summary": "final-case-note:summary",
  "handover-note:shift handoff": "handover-note:shift-handoff",
};

const AI_LOGIC_REGISTRY = {
  "adl:bathing": {
    key: "adl:bathing",
    source: "AILogic/ADL/Bathing/bathing.logic.json",
    raw: bathingLogic,
  },
  "adl:dressing": {
    key: "adl:dressing",
    source: "AILogic/ADL/Dressing/dressing.logic.json",
    raw: dressingLogic,
  },
  "final-case-note:summary": {
    key: "final-case-note:summary",
    source: "AILogic/FinalCaseNote/final-case-note.logic.json",
    raw: finalCaseNoteLogic,
  },
  "handover-note:shift-handoff": {
    key: "handover-note:shift-handoff",
    source: "AILogic/HandoverNote/handover-note.logic.json",
    raw: handoverNoteLogic,
  },
  "meal-support:aspiration-precautions": {
    key: "meal-support:aspiration-precautions",
    source: "AILogic/MealSupport/AspirationPrecautions/aspiration-precautions.logic.json",
    raw: aspirationPrecautionsLogic,
  },
  "meal-support:feeding-assistance": {
    key: "meal-support:feeding-assistance",
    source: "AILogic/MealSupport/FeedingAssistance/feeding-assistance.logic.json",
    raw: feedingAssistanceLogic,
  },
  "meal-support:hydration-support": {
    key: "meal-support:hydration-support",
    source: "AILogic/MealSupport/HydrationSupport/hydration-support.logic.json",
    raw: hydrationSupportLogic,
  },
  "meal-support:intake-monitoring": {
    key: "meal-support:intake-monitoring",
    source: "AILogic/MealSupport/IntakeMonitoring/intake-monitoring.logic.json",
    raw: intakeMonitoringLogic,
  },
  "meal-support:meal-setup": {
    key: "meal-support:meal-setup",
    source: "AILogic/MealSupport/MealSetup/meal-setup.logic.json",
    raw: mealSetupLogic,
  },
  "meal-support:snack-support": {
    key: "meal-support:snack-support",
    source: "AILogic/MealSupport/SnackSupport/snack-support.logic.json",
    raw: snackSupportLogic,
  },
  "adl:grooming": {
    key: "adl:grooming",
    source: "AILogic/ADL/Grooming/grooming.logic.json",
    raw: groomingLogic,
  },
  "adl:hygiene": {
    key: "adl:hygiene",
    source: "AILogic/ADL/Hygiene/hygiene.logic.json",
    raw: hygieneLogic,
  },
  "adl:toileting": {
    key: "adl:toileting",
    source: "AILogic/ADL/Toileting/toileting.logic.json",
    raw: toiletingLogic,
  },
  "adl:transfers": {
    key: "adl:transfers",
    source: "AILogic/ADL/Transfers/transfers.logic.json",
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
  if (normalizeKeyPart(workflowId) === "handover note") {
    return "handover-note:shift-handoff";
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
