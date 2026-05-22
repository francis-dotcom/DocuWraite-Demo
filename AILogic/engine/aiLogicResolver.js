const bathingLogic = require("../ADL/Bathing/bathing.logic.json");
const dressingLogic = require("../ADL/Dressing/dressing.logic.json");
const finalCaseNoteLogic = require("../FinalCaseNote/final-case-note.logic.json");
const groomingLogic = require("../ADL/Grooming/grooming.logic.json");
const handoverNoteLogic = require("../HandoverNote/handover-note.logic.json");
const hygieneLogic = require("../ADL/Hygiene/hygiene.logic.json");
const aspirationPrecautionsLogic = require("../MealSupport/AspirationPrecautions/aspiration-precautions.logic.json");
const behaviorSupportLogic = require("../BehaviorSupport/behavior-support.logic.json");
const communicationSupportLogic = require("../Communication/communication-support.logic.json");
const communityOutingLogic = require("../CommunityOuting/community-outing.logic.json");
const feedingAssistanceLogic = require("../MealSupport/FeedingAssistance/feeding-assistance.logic.json");
const hydrationSupportLogic = require("../MealSupport/HydrationSupport/hydration-support.logic.json");
const intakeMonitoringLogic = require("../MealSupport/IntakeMonitoring/intake-monitoring.logic.json");
const mealSetupLogic = require("../MealSupport/MealSetup/meal-setup.logic.json");
const medicationSupportLogic = require("../Medication/medication-support.logic.json");
const mobilityLogic = require("../Mobility/mobility.logic.json");
const safetyMonitoringLogic = require("../SafetyMonitoring/safety-monitoring.logic.json");
const sleepSupportLogic = require("../SleepSupport/sleep-support.logic.json");
const snackSupportLogic = require("../MealSupport/SnackSupport/snack-support.logic.json");
const toiletingLogic = require("../ADL/Toileting/toileting.logic.json");
const transfersLogic = require("../ADL/Transfers/transfers.logic.json");
const { TASK_SCOPED_AI_LOGIC_CATALOG } = require("./taskScopedLogicCatalog");

const STATIC_WORKFLOW_TASK_FILE_MAP = {
  "adl:bathing": "adl:bathing",
  "adl:dressing": "adl:dressing",
  "final case note:summary": "final-case-note:summary",
  "handover note:shift handoff": "handover-note:shift-handoff",
  "adl:grooming": "adl:grooming",
  "adl:hygiene": "adl:hygiene",
  "adl:toileting": "adl:toileting",
  "adl:transfers": "adl:transfers",
  "behavior support:behavior support": "behavior-support:behavior-support",
  "communication:communication support": "communication:communication-support",
  "community outing:community outing": "community-outing:community-outing",
  "medication:medication support": "medication:medication-support",
  "meal support:aspiration precautions": "meal-support:aspiration-precautions",
  "meal support:feeding assistance": "meal-support:feeding-assistance",
  "meal support:hydration support": "meal-support:hydration-support",
  "meal support:intake monitoring": "meal-support:intake-monitoring",
  "meal support:meal setup": "meal-support:meal-setup",
  "meal support:snack support": "meal-support:snack-support",
  "mobility:mobility support": "mobility:mobility-support",
  "safety monitoring:safety monitoring": "safety-monitoring:safety-monitoring",
  "sleep support:sleep support": "sleep-support:sleep-support",
  "case note final:summary": "final-case-note:summary",
  "case-note-final:summary": "final-case-note:summary",
  "handover-note:shift handoff": "handover-note:shift-handoff",
};

const STATIC_AI_LOGIC_REGISTRY = {
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
  "behavior-support:behavior-support": {
    key: "behavior-support:behavior-support",
    source: "AILogic/BehaviorSupport/behavior-support.logic.json",
    raw: behaviorSupportLogic,
  },
  "communication:communication-support": {
    key: "communication:communication-support",
    source: "AILogic/Communication/communication-support.logic.json",
    raw: communicationSupportLogic,
  },
  "community-outing:community-outing": {
    key: "community-outing:community-outing",
    source: "AILogic/CommunityOuting/community-outing.logic.json",
    raw: communityOutingLogic,
  },
  "medication:medication-support": {
    key: "medication:medication-support",
    source: "AILogic/Medication/medication-support.logic.json",
    raw: medicationSupportLogic,
  },
  "mobility:mobility-support": {
    key: "mobility:mobility-support",
    source: "AILogic/Mobility/mobility.logic.json",
    raw: mobilityLogic,
  },
  "safety-monitoring:safety-monitoring": {
    key: "safety-monitoring:safety-monitoring",
    source: "AILogic/SafetyMonitoring/safety-monitoring.logic.json",
    raw: safetyMonitoringLogic,
  },
  "sleep-support:sleep-support": {
    key: "sleep-support:sleep-support",
    source: "AILogic/SleepSupport/sleep-support.logic.json",
    raw: sleepSupportLogic,
  },
};

const TASK_SCOPED_BASE_LOGIC = {
  "communication-support": {
    category: "Communication",
    baseLogic: communicationSupportLogic,
    baseSource: "AILogic/Communication/communication-support.logic.json",
  },
  "medication-support": {
    category: "Medication",
    baseLogic: medicationSupportLogic,
    baseSource: "AILogic/Medication/medication-support.logic.json",
  },
  mobility: {
    category: "Mobility",
    baseLogic: mobilityLogic,
    baseSource: "AILogic/Mobility/mobility.logic.json",
  },
  "behavior-support": {
    category: "Behavior Support",
    baseLogic: behaviorSupportLogic,
    baseSource: "AILogic/BehaviorSupport/behavior-support.logic.json",
  },
  "community-outing": {
    category: "Community Outing",
    baseLogic: communityOutingLogic,
    baseSource: "AILogic/CommunityOuting/community-outing.logic.json",
  },
  "night-adl": {
    category: "Sleep Support",
    baseLogic: sleepSupportLogic,
    baseSource: "AILogic/SleepSupport/sleep-support.logic.json",
  },
  "in-home-leisure": {
    category: "Safety Monitoring",
    baseLogic: safetyMonitoringLogic,
    baseSource: "AILogic/SafetyMonitoring/safety-monitoring.logic.json",
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

function slugifyTaskKey(value = "") {
  return normalizeKeyPart(value).replace(/\s+/g, "-");
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function toLowerLabel(value = "") {
  return String(value || "").trim().toLowerCase();
}

function createTaskScopedLogic(baseLogic = {}, workflowConfig = {}, taskConfig = {}) {
  const scopedLogic = deepClone(baseLogic);
  scopedLogic.workflowId = `${slugifyTaskKey(workflowConfig.category)}-${taskConfig.pathKey}`;

  if (scopedLogic.layer1_categoryMetadata) {
    scopedLogic.layer1_categoryMetadata.task = taskConfig.task;
    scopedLogic.layer1_categoryMetadata.purpose = `Guide AI questioning and generate a supervisor-facing ${toLowerLabel(taskConfig.task)} note using structured answers and escalation rules.`;
    if (Array.isArray(scopedLogic.layer1_categoryMetadata.documentationGoals)) {
      const nextGoals = [...scopedLogic.layer1_categoryMetadata.documentationGoals];
      nextGoals[0] = `Capture the ${toLowerLabel(taskConfig.task)} support provided`;
      scopedLogic.layer1_categoryMetadata.documentationGoals = nextGoals;
    }
  }

  const questions = scopedLogic.layer2_questionRules?.questions || [];
  const primaryQuestion = questions.find((question) => question.id === workflowConfig.sourceQuestionId);
  if (primaryQuestion) {
    primaryQuestion.label = taskConfig.questionLabel || primaryQuestion.label;
    primaryQuestion.options = [...taskConfig.detailOptions];
  }

  const freeNoteQuestion = questions.find((question) => question.id === "free_note");
  if (freeNoteQuestion) {
    freeNoteQuestion.label = `Add any extra ${toLowerLabel(taskConfig.task)} note guidance.`;
  }

  const directives = scopedLogic.layer3_noteGenerationContext?.systemPromptDirectives || [];
  const directiveIndex = directives.findIndex(
    (directive) => typeof directive === "string" && directive.toLowerCase().startsWith("include ")
  );
  if (directiveIndex >= 0) {
    directives[directiveIndex] = taskConfig.noteDirective || directives[directiveIndex];
  }

  return scopedLogic;
}

const GENERATED_TASK_SCOPED_MAP = {};
const GENERATED_TASK_SCOPED_REGISTRY = {};

Object.entries(TASK_SCOPED_AI_LOGIC_CATALOG).forEach(([workflowId, workflowConfig]) => {
  const baseConfig = TASK_SCOPED_BASE_LOGIC[workflowId];
  if (!baseConfig) {
    return;
  }

  workflowConfig.tasks.forEach((taskConfig) => {
    const registryKey = `${slugifyTaskKey(baseConfig.category)}:${taskConfig.pathKey}`;
    GENERATED_TASK_SCOPED_MAP[buildLookupKey(baseConfig.category, taskConfig.task)] = registryKey;
    GENERATED_TASK_SCOPED_REGISTRY[registryKey] = {
      key: registryKey,
      source: `${baseConfig.baseSource}#${taskConfig.pathKey}`,
      raw: createTaskScopedLogic(baseConfig.baseLogic, workflowConfig, taskConfig),
    };
  });
});

const WORKFLOW_TASK_FILE_MAP = {
  ...STATIC_WORKFLOW_TASK_FILE_MAP,
  ...GENERATED_TASK_SCOPED_MAP,
};

const AI_LOGIC_REGISTRY = {
  ...STATIC_AI_LOGIC_REGISTRY,
  ...GENERATED_TASK_SCOPED_REGISTRY,
};

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
