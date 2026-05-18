const fs = require("fs");
const path = require("path");

const bootstrapPath = path.join(__dirname, "carePlanBootstrap.json");

let cachedBootstrap = null;

function loadCarePlanBootstrap() {
  if (cachedBootstrap) {
    return cachedBootstrap;
  }

  cachedBootstrap = JSON.parse(fs.readFileSync(bootstrapPath, "utf8"));
  return cachedBootstrap;
}

function getClientCarePlanSeed(clientId) {
  const bootstrap = loadCarePlanBootstrap();
  const entry = bootstrap[clientId];
  if (!entry) {
    return null;
  }

  return {
    riskCards: Array.isArray(entry.riskCards) ? entry.riskCards : [],
    actionPlans: Array.isArray(entry.actionPlans) ? entry.actionPlans : [],
    intelligenceOptions: entry.shiftIntelligenceOptions || entry.intelligenceOptions || {},
  };
}

function listCarePlanSeededClientIds() {
  return Object.keys(loadCarePlanBootstrap());
}

module.exports = {
  getClientCarePlanSeed,
  listCarePlanSeededClientIds,
};
