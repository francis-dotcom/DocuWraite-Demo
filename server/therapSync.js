/**
 * Therap → DocuWraite sync orchestration.
 * Persists shift schedules and care-plan snapshots to SQLite.
 */

const { listSeededClientIds } = require("./clientShiftSeeds");
const { listCarePlanSeededClientIds } = require("./clientCarePlanSeeds");
const { fetchDemoShiftFeed, fetchDemoCarePlan } = require("./integrations/therapDemoProvider");
const { fetchTherapShiftFeed, fetchTherapCarePlan, getTherapConfig } = require("./integrations/therapHttpClient");
const { resolveTherapIndividualId, listRegisteredClientIds } = require("./integrations/therapClientRegistry");
const { getTodayShiftDate, saveClientShiftSchedule, saveClientCarePlanData } = require("./storage");

function resolveSyncClientIds(clientIds) {
  if (Array.isArray(clientIds) && clientIds.length) {
    return clientIds.map((id) => String(id).trim()).filter(Boolean);
  }

  const registered = listRegisteredClientIds();
  const union = new Set([...registered, ...listSeededClientIds(), ...listCarePlanSeededClientIds()]);
  return Array.from(union);
}

async function loadShiftFeed(clientId, shiftDate, mode) {
  const therapIndividualId = resolveTherapIndividualId(clientId);
  const config = getTherapConfig();
  const effectiveMode = mode || config.mode || "auto";

  const tryLive = effectiveMode === "live" || effectiveMode === "auto";
  const tryDemo = effectiveMode === "demo" || effectiveMode === "auto";

  if (tryLive && config.isConfigured) {
    try {
      const live = await fetchTherapShiftFeed(therapIndividualId, shiftDate);
      if (live?.schedule) {
        return { ...live, source: "therap", therapIndividualId };
      }
    } catch (error) {
      if (effectiveMode === "live") {
        throw error;
      }
    }
  }

  if (tryDemo) {
    const demo = fetchDemoShiftFeed(clientId, shiftDate);
    if (demo?.schedule) {
      return { ...demo, therapIndividualId };
    }
  }

  return null;
}

async function loadCarePlanFeed(clientId, mode) {
  const therapIndividualId = resolveTherapIndividualId(clientId);
  const config = getTherapConfig();
  const effectiveMode = mode || config.mode || "auto";

  const tryLive = effectiveMode === "live" || effectiveMode === "auto";
  const tryDemo = effectiveMode === "demo" || effectiveMode === "auto";

  if (tryLive && config.isConfigured) {
    try {
      const live = await fetchTherapCarePlan(therapIndividualId);
      if (live?.riskCards?.length || live?.actionPlans?.length) {
        return { ...live, source: "therap", therapIndividualId };
      }
    } catch (error) {
      if (effectiveMode === "live") {
        throw error;
      }
    }
  }

  if (tryDemo) {
    const demo = fetchDemoCarePlan(clientId);
    if (demo) {
      return { ...demo, therapIndividualId };
    }
  }

  return null;
}

async function syncClientFromTherap(
  clientId,
  {
    shiftDate = getTodayShiftDate(),
    syncShiftSchedule = true,
    syncCarePlan = false,
    mode = null,
  } = {}
) {
  const result = {
    clientId,
    therapIndividualId: resolveTherapIndividualId(clientId),
    shiftDate,
    ok: false,
    shift: null,
    carePlan: null,
    errors: [],
  };

  try {
    if (syncShiftSchedule) {
      const feed = await loadShiftFeed(clientId, shiftDate, mode);
      if (!feed?.schedule) {
        result.errors.push("No shift feed available");
      } else {
        const saved = saveClientShiftSchedule({
          clientId,
          shiftDate,
          schedule: feed.schedule,
          intelligenceOptions: feed.intelligenceOptions || null,
        });
        result.shift = {
          source: feed.source,
          saved,
        };
      }
    }

    if (syncCarePlan) {
      const carePlanFeed = await loadCarePlanFeed(clientId, mode);
      if (!carePlanFeed) {
        result.errors.push("No care plan feed available");
      } else {
        const saved = saveClientCarePlanData({
          clientId,
          riskCards: carePlanFeed.riskCards,
          actionPlans: carePlanFeed.actionPlans,
          intelligenceOptions: carePlanFeed.intelligenceOptions || null,
        });
        result.carePlan = {
          source: carePlanFeed.source,
          saved,
        };
      }
    }

    result.ok =
      result.errors.length === 0 &&
      ((syncShiftSchedule && result.shift) || !syncShiftSchedule) &&
      ((syncCarePlan && result.carePlan) || !syncCarePlan);
  } catch (error) {
    result.errors.push(error.message);
    result.ok = false;
  }

  return result;
}

async function runTherapSync({
  shiftDate = getTodayShiftDate(),
  clientIds = null,
  syncShiftSchedule = true,
  syncCarePlan = true,
  mode = null,
} = {}) {
  const ids = resolveSyncClientIds(clientIds);
  const syncedAt = new Date().toISOString();
  const config = getTherapConfig();

  const clients = [];
  for (const clientId of ids) {
    clients.push(
      await syncClientFromTherap(clientId, {
        shiftDate,
        syncShiftSchedule,
        syncCarePlan,
        mode,
      })
    );
  }

  return {
    ok: clients.every((entry) => entry.ok),
    shiftDate,
    syncedAt,
    therapMode: mode || config.mode,
    therapApiConfigured: config.isConfigured,
    clients,
  };
}

module.exports = {
  loadShiftFeed,
  loadCarePlanFeed,
  syncClientFromTherap,
  runTherapSync,
};
