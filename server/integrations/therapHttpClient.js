/**
 * HTTP client for Therap middleware implementing the DocuWraite feed contract.
 *
 * Expected endpoints (when THERAP_API_BASE_URL is set):
 *   GET {base}/shift-feed?individualId=&shiftDate=YYYY-MM-DD
 *   GET {base}/care-plan?individualId=
 */

const { normalizeShiftFeedPayload, normalizeCarePlanPayload } = require("./therapMappers");

function getTherapConfig() {
  const baseUrl = String(process.env.THERAP_API_BASE_URL || "").trim().replace(/\/$/, "");
  const token = String(process.env.THERAP_API_TOKEN || "").trim();
  const mode = String(process.env.THERAP_SYNC_MODE || "auto").trim().toLowerCase();

  return {
    baseUrl,
    token,
    mode,
    isConfigured: Boolean(baseUrl),
    timeoutMs: Number(process.env.THERAP_API_TIMEOUT_MS || 15000),
  };
}

function buildTherapHeaders(token = "") {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const apiKey = String(process.env.THERAP_API_KEY || "").trim();
  if (apiKey) {
    headers["X-API-Key"] = apiKey;
  }

  return headers;
}

async function therapFetchJson(path, query = {}) {
  const config = getTherapConfig();
  if (!config.isConfigured) {
    return null;
  }

  const url = new URL(`${config.baseUrl}${path}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: buildTherapHeaders(config.token),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Therap API ${response.status}: ${body.slice(0, 200)}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchTherapShiftFeed(therapIndividualId, shiftDate) {
  const raw = await therapFetchJson("/shift-feed", {
    individualId: therapIndividualId,
    shiftDate,
  });

  if (!raw) {
    return null;
  }

  return normalizeShiftFeedPayload(raw);
}

async function fetchTherapCarePlan(therapIndividualId) {
  const raw = await therapFetchJson("/care-plan", {
    individualId: therapIndividualId,
  });

  if (!raw) {
    return null;
  }

  return normalizeCarePlanPayload(raw);
}

module.exports = {
  getTherapConfig,
  fetchTherapShiftFeed,
  fetchTherapCarePlan,
};
