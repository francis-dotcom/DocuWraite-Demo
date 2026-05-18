/**
 * Maps DocuWraite client IDs to Therap individual / oversight identifiers.
 * Override via environment variables in production.
 */

const DEFAULT_THERAP_IDS = {
  "mary-bet": "0000010468",
  "mark-brent": "0000021184",
  "elias-brian": "0000045219",
};

const ENV_KEY_BY_CLIENT = {
  "mary-bet": "THERAP_ID_MARY_BET",
  "mark-brent": "THERAP_ID_MARK_BRENT",
  "elias-brian": "THERAP_ID_ELIAS_BRIAN",
};

function resolveTherapIndividualId(clientId) {
  const normalized = String(clientId || "").trim();
  const envKey = ENV_KEY_BY_CLIENT[normalized];
  if (envKey && process.env[envKey]) {
    return String(process.env[envKey]).trim();
  }
  return DEFAULT_THERAP_IDS[normalized] || normalized;
}

function listRegisteredClientIds() {
  return Object.keys(DEFAULT_THERAP_IDS);
}

module.exports = {
  DEFAULT_THERAP_IDS,
  resolveTherapIndividualId,
  listRegisteredClientIds,
};
