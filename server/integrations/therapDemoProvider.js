/**
 * Demo Therap feed — uses local seeds when live Therap API is unavailable.
 */

const { getClientShiftSeed } = require("../clientShiftSeeds");
const { getClientCarePlanSeed } = require("../clientCarePlanSeeds");
const { buildMorningShiftSchedule } = require("../morningShiftSync");
const { getTodayShiftDate } = require("../storage");

function fetchDemoShiftFeed(clientId, shiftDate = getTodayShiftDate()) {
  const schedule = buildMorningShiftSchedule(clientId, shiftDate);
  if (!schedule) {
    return null;
  }

  const seed = getClientShiftSeed(clientId);

  return {
    shiftDate,
    schedule,
    intelligenceOptions: seed?.shiftIntelligenceOptions || {},
    source: "demo",
  };
}

function fetchDemoCarePlan(clientId) {
  const seed = getClientCarePlanSeed(clientId);
  if (!seed) {
    return null;
  }

  return {
    riskCards: seed.riskCards,
    actionPlans: seed.actionPlans,
    intelligenceOptions: seed.intelligenceOptions || {},
    source: "demo",
  };
}

module.exports = {
  fetchDemoShiftFeed,
  fetchDemoCarePlan,
};
