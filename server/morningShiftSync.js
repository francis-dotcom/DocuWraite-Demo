/**
 * Simulates a Therap / MAR morning feed: refreshes today's shift schedules in SQLite.
 * Run via POST /api/sync/morning-shift or: npm run sync:morning-shift
 */

const { getClientShiftSeed, listSeededClientIds } = require("./clientShiftSeeds");
const { getTodayShiftDate, saveClientShiftSchedule } = require("./storage");

function formatUsDateFromIso(isoDate = "") {
  const [year, month, day] = String(isoDate || "").split("-");
  if (!year || !month || !day) {
    return "";
  }
  return `${month}/${day}/${year}`;
}

function buildMorningShiftSchedule(clientId, shiftDate = getTodayShiftDate()) {
  const seed = getClientShiftSeed(clientId);
  if (!seed?.shiftSchedule) {
    return null;
  }

  const base = seed.shiftSchedule;
  const dueLabel = formatUsDateFromIso(shiftDate);

  return {
    todayAppointments: [...(base.todayAppointments || [])],
    medicationsDue: [...(base.medicationsDue || [])],
    standingAlerts: [...(base.standingAlerts || [])],
    overdueTasks: (base.overdueTasks || []).map((task, index) => {
      if (!task?.dueLabel || index !== 0) {
        return { ...task };
      }

      return {
        ...task,
        dueLabel,
      };
    }),
  };
}

function runMorningShiftSync({ shiftDate = getTodayShiftDate(), clientIds = listSeededClientIds() } = {}) {
  const syncedAt = new Date().toISOString();
  const results = [];

  clientIds.forEach((clientId) => {
    const schedule = buildMorningShiftSchedule(clientId, shiftDate);
    if (!schedule) {
      results.push({
        clientId,
        ok: false,
        error: "No shift seed configured for client",
      });
      return;
    }

    const seed = getClientShiftSeed(clientId);
    const saved = saveClientShiftSchedule({
      clientId,
      shiftDate,
      schedule,
      intelligenceOptions: seed?.shiftIntelligenceOptions || null,
    });

    results.push({
      clientId,
      ok: true,
      shiftDate,
      appointmentCount: saved.schedule.todayAppointments.length,
      medicationCount: saved.schedule.medicationsDue.length,
      alertCount: saved.schedule.standingAlerts.length,
      overdueCount: saved.schedule.overdueTasks.length,
    });
  });

  return {
    ok: results.every((entry) => entry.ok),
    shiftDate,
    syncedAt,
    clients: results,
  };
}

module.exports = {
  buildMorningShiftSchedule,
  runMorningShiftSync,
};
