const adlBuilderLogic = require("../ADL/adl.builder.logic.json");
const mealSupportBuilderLogic = require("../MealSupport/meal-support.builder.logic.json");
const communicationBuilderLogic = require("../Communication/communication.builder.logic.json");
const medicationBuilderLogic = require("../Medication/medication.builder.logic.json");
const mobilityBuilderLogic = require("../Mobility/mobility.builder.logic.json");
const behaviorSupportBuilderLogic = require("../BehaviorSupport/behavior-support.builder.logic.json");
const communityOutingBuilderLogic = require("../CommunityOuting/community-outing.builder.logic.json");
const sleepSupportBuilderLogic = require("../SleepSupport/sleep-support.builder.logic.json");
const safetyMonitoringBuilderLogic = require("../SafetyMonitoring/safety-monitoring.builder.logic.json");

const BUILDER_LOGIC_BY_CATEGORY = {
  adl: adlBuilderLogic,
  communication: communicationBuilderLogic,
  medication: medicationBuilderLogic,
  meal: mealSupportBuilderLogic,
  mobility: mobilityBuilderLogic,
  behavior: behaviorSupportBuilderLogic,
  community: communityOutingBuilderLogic,
  sleep: sleepSupportBuilderLogic,
  "safety-monitoring": safetyMonitoringBuilderLogic,
};

function normalizeText(value = "") {
  return String(value || "").trim().toLowerCase();
}

function uniqueValues(values = []) {
  return [...new Set((values || []).filter(Boolean))];
}

function getCarePlanContextEntries(carePlanContext = null) {
  if (!carePlanContext || typeof carePlanContext !== "object") {
    return [];
  }

  return ["required_context", "optional_context"]
    .flatMap((groupKey) => Object.entries(carePlanContext[groupKey] || {}))
    .filter(([, entry]) => String(entry?.value || "").trim());
}

function summarizeCarePlanSignals(carePlanContext = null) {
  const entries = getCarePlanContextEntries(carePlanContext);
  if (!entries.length) {
    return [];
  }

  const keys = entries.map(([key]) => key);
  const signals = [];

  if (keys.some((key) => key.includes("baseline"))) {
    signals.push("the care-plan baseline");
  }
  if (keys.some((key) => key.includes("assistance_level"))) {
    signals.push("the required assistance level");
  }
  if (keys.some((key) => key.includes("prompt"))) {
    signals.push("the documented prompt level");
  }
  if (keys.some((key) => key.includes("supervision"))) {
    signals.push("the supervision requirement");
  }
  if (keys.some((key) => key.includes("risk") || key.includes("precaution") || key.includes("protocol"))) {
    signals.push("active safety precautions");
  }
  if (keys.some((key) => key.includes("diet") || key.includes("swallow") || key.includes("aspiration"))) {
    signals.push("meal-plan or aspiration precautions");
  }
  if (keys.some((key) => key.includes("mobility") || key.includes("transfer"))) {
    signals.push("mobility or transfer supports");
  }
  if (keys.some((key) => key.includes("behavior") || key.includes("refusal"))) {
    signals.push("behavior-support guidance");
  }
  if (keys.some((key) => key.includes("notification") || key.includes("reporting"))) {
    signals.push("follow-up or notification thresholds");
  }

  return uniqueValues(signals).slice(0, 3);
}

function buildCarePlanAwareVariant(basePrompt = "", carePlanContext = null) {
  const trimmedBase = String(basePrompt || "").replace(/[.\s]+$/, "");
  const signals = summarizeCarePlanSignals(carePlanContext);
  if (!trimmedBase || !signals.length) {
    return "";
  }

  if (signals.length === 1) {
    return `${trimmedBase}, while following ${signals[0]}.`;
  }

  if (signals.length === 2) {
    return `${trimmedBase}, while following ${signals[0]} and ${signals[1]}.`;
  }

  return `${trimmedBase}, while following ${signals[0]}, ${signals[1]}, and ${signals[2]}.`;
}

function getBuilderLogicByCategory(promptCategory = "") {
  return BUILDER_LOGIC_BY_CATEGORY[String(promptCategory || "").trim()] || null;
}

function resolveProfile(logic = null, mealSubworkflow = "") {
  if (!logic?.builderPromptProfiles) {
    return null;
  }
  const profiles = logic.builderPromptProfiles;
  if (profiles.subworkflowProfiles && mealSubworkflow && profiles.subworkflowProfiles[mealSubworkflow]) {
    return profiles.subworkflowProfiles[mealSubworkflow];
  }
  return profiles;
}

function getMatchedKeywordVariants(logic = null, currentText = "") {
  const normalized = normalizeText(currentText);
  if (!logic?.builderPromptProfiles?.keywordBranches?.length || !normalized) {
    return [];
  }

  return logic.builderPromptProfiles.keywordBranches
    .filter((branch) => (branch.keywords || []).some((keyword) => normalized.includes(normalizeText(keyword))))
    .flatMap((branch) => branch.variants || []);
}

function getMealSupportSubworkflowLabel(options = [], value = "") {
  return options.find((option) => option.value === value)?.label || "Meal Support";
}

function buildFallbackPrompt({ workflowId = "", mealSubworkflow = "", mealSupportOptions = [] } = {}) {
  if (workflowId === "feeding-support") {
    return `Document ${getMealSupportSubworkflowLabel(mealSupportOptions, mealSubworkflow).toLowerCase()} support provided, intake observed, and the person's response.`;
  }
  return "Document support provided, staff response, and the person's outcome.";
}

function resolveBuilderPromptVariants({
  promptCategory = "",
  workflowId = "",
  mealSubworkflow = "",
  mealSupportOptions = [],
  currentText = "",
  carePlanContext = null,
} = {}) {
  const logic = getBuilderLogicByCategory(promptCategory);
  const profile = resolveProfile(logic, mealSubworkflow);
  if (!logic || !profile) {
    return [buildFallbackPrompt({ workflowId, mealSubworkflow, mealSupportOptions })];
  }

  const carePlanAwareVariant = buildCarePlanAwareVariant(profile.primary, carePlanContext);

  return uniqueValues([
    carePlanAwareVariant,
    ...getMatchedKeywordVariants(logic, currentText),
    profile.primary,
    ...(profile.variants || []),
  ]);
}

module.exports = {
  getMealSupportSubworkflowLabel,
  resolveBuilderPromptVariants,
};
