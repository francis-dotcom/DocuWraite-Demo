const adlWorkflow = require("./adl.json");
const activationRules = require("./activationRules.json");
const moduleExecutionRules = require("./moduleExecutionRules.json");
const adlOutcomeRegistry = require("./adlOutcomeRegistry.json");
const assistanceRegistry = require("./assistanceRegistry.json");

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function byPriorityDesc(a, b) {
  return Number(b.priority || 0) - Number(a.priority || 0);
}

function getCategoryDefinition(categoryId = "") {
  return toArray(adlWorkflow.categories).find((category) => category.categoryId === categoryId) || null;
}

function getAllowedOutcomeStates(categoryId = "") {
  const categoryStates = adlOutcomeRegistry.categoryOutcomes?.[categoryId];
  return Array.isArray(categoryStates) && categoryStates.length
    ? categoryStates
    : toArray(adlOutcomeRegistry.defaultStates);
}

function getAllowedAssistanceStates() {
  return toArray(assistanceRegistry.states).map((state) => state.id);
}

function matchesClause(actualValue, expectedValues) {
  if (!expectedValues) {
    return true;
  }
  return toArray(expectedValues).includes(actualValue);
}

function matchesConditionObject(condition = {}, context = {}) {
  return Object.entries(condition).every(([key, expectedValue]) => {
    const actualValue = context[key];
    if (actualValue === undefined || actualValue === null || actualValue === "") {
      return false;
    }
    return Array.isArray(expectedValue)
      ? expectedValue.includes(actualValue)
      : actualValue === expectedValue;
  });
}

function matchesRule(rule = {}, context = {}) {
  const when = rule.when || rule.if || {};
  return (
    matchesClause(context.workflowId, when.workflow) &&
    matchesClause(context.categoryId, when.category) &&
    matchesClause(context.outcome, when.outcome) &&
    matchesClause(context.assistance, when.assistance)
  );
}

function getMatchedActivationRules(context = {}) {
  return toArray(activationRules.rules)
    .filter((rule) => matchesRule(rule, context))
    .sort(byPriorityDesc);
}

function getMatchedExecutionRules(context = {}) {
  return toArray(moduleExecutionRules.rules).filter((rule) => matchesConditionObject(rule.if || {}, context));
}

function buildExecutionOrder(activeModules = [], executionRules = []) {
  const explicitOrder = executionRules.flatMap((rule) => toArray(rule.then?.executionOrder));
  return unique([...explicitOrder, ...activeModules]);
}

function composeDecisionRuntime({
  workflowId = "adl",
  categoryId = "",
  outcome = "",
  assistance = "",
  safety = "",
  riskOverlay = "",
} = {}) {
  const category = getCategoryDefinition(categoryId);
  const allowedOutcomes = getAllowedOutcomeStates(categoryId);
  const allowedAssistance = getAllowedAssistanceStates();
  const baseModules = unique([
    ...toArray(activationRules.defaults?.alwaysActivate),
    ...toArray(category?.modules),
  ]);

  const context = {
    workflowId,
    categoryId,
    outcome,
    assistance,
    safety,
    riskOverlay,
  };

  const matchedRules = getMatchedActivationRules(context);
  const matchedExecutionRules = getMatchedExecutionRules(context);
  const ruleActivatedModules = matchedRules.flatMap((rule) => toArray(rule.thenActivate));
  const executionActivatedModules = matchedExecutionRules.flatMap((rule) => toArray(rule.then?.activateModules));
  const activeModules = unique([...baseModules, ...ruleActivatedModules, ...executionActivatedModules]);
  const executionOrder = buildExecutionOrder(activeModules, matchedExecutionRules);

  return {
    workflowId,
    categoryId,
    categoryLabel: category?.label || "",
    allowedOutcomes,
    allowedAssistance,
    selectedOutcome: outcome,
    selectedAssistance: assistance,
    matchedRules: matchedRules.map((rule) => ({
      ruleId: rule.ruleId,
      reason: rule.reason || "",
      thenActivate: toArray(rule.thenActivate),
      priority: Number(rule.priority || 0),
    })),
    matchedExecutionRules: matchedExecutionRules.map((rule) => ({
      ruleId: rule.ruleId,
      activateModules: toArray(rule.then?.activateModules),
      executionOrder: toArray(rule.then?.executionOrder),
    })),
    activeModules,
    executionOrder,
    summary:
      category && outcome && assistance
        ? `${category.label}: ${outcome} + ${assistance} activates ${activeModules.join(", ")}.`
        : "Select category, outcome, and assistance to compute active modules.",
  };
}

module.exports = {
  composeDecisionRuntime,
  getAllowedOutcomeStates,
  getAllowedAssistanceStates,
  getMatchedActivationRules,
};
