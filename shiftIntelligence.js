/**
 * Builds display-ready shift intelligence from structured care-plan + shift schedule data.
 * Shared by the UI panel, documentation workflow, and server draft prompts.
 */

const EMPTY_SHIFT_INTELLIGENCE = {
  overdue: [],
  activeRisks: [],
  appointments: [],
  medicationsDue: [],
  alerts: [],
  incompleteGoals: [],
};

function formatShiftScheduleLine(item = "") {
  if (typeof item === "string") {
    return item.trim();
  }

  const title = String(item?.title || "").trim();
  if (!title) {
    return "";
  }

  const timeLabel = String(item?.timeLabel || "").trim();
  if (timeLabel) {
    return `${title} ${timeLabel}`;
  }

  const dueLabel = String(item?.dueLabel || "").trim();
  if (dueLabel) {
    return `${title} (${dueLabel})`;
  }

  return title;
}

function formatShiftScheduleList(items = []) {
  return items.map(formatShiftScheduleLine).filter(Boolean);
}

function buildActiveRisks(riskCards = [], options = {}) {
  const filter = options.activeRiskFilter || "high-only";
  const visibleRisks =
    filter === "all" ? riskCards : riskCards.filter((risk) => String(risk.severity || "").toLowerCase() === "high");

  return visibleRisks.map((risk) => `${risk.title} (${risk.severity})`);
}

function buildIncompleteGoals(actionPlans = [], documentationSession = null) {
  const goals = actionPlans.map((plan) => plan.outcome).filter(Boolean);

  if (!documentationSession?.rows?.length) {
    return goals;
  }

  return goals.filter((_, index) => !documentationSession.rows[index]?.score);
}

/**
 * @param {object|null} clientProfile
 * @param {{ documentationSession?: object }} [options]
 * @returns {typeof EMPTY_SHIFT_INTELLIGENCE}
 */
function buildShiftIntelligence(clientProfile = null, options = {}) {
  if (!clientProfile) {
    return { ...EMPTY_SHIFT_INTELLIGENCE };
  }

  const documentationSession = options.documentationSession || null;
  const schedule = clientProfile.shiftSchedule || {};
  const intelligenceOptions = clientProfile.shiftIntelligenceOptions || {};

  return {
    overdue: formatShiftScheduleList(schedule.overdueTasks || []),
    activeRisks: buildActiveRisks(clientProfile.riskCards || [], intelligenceOptions),
    appointments: formatShiftScheduleList(schedule.todayAppointments || []),
    medicationsDue: formatShiftScheduleList(schedule.medicationsDue || []),
    alerts: formatShiftScheduleList(schedule.standingAlerts || []),
    incompleteGoals: buildIncompleteGoals(clientProfile.actionPlans || [], documentationSession),
  };
}

function getShiftIntelligenceRuntime(clientProfile = null, documentationSession = null) {
  return buildShiftIntelligence(clientProfile, { documentationSession });
}

function mergeClientProfileWithShiftSchedule(baseProfile = null, clientShift = null) {
  const base = baseProfile || null;
  if (!base) {
    return null;
  }

  if (!clientShift?.schedule) {
    return base;
  }

  return {
    ...base,
    shiftSchedule: normalizeShiftScheduleForProfile(clientShift.schedule),
    shiftIntelligenceOptions:
      clientShift.intelligenceOptions || base.shiftIntelligenceOptions || {},
  };
}

function mergeClientProfileWithCarePlanData(baseProfile = null, clientCarePlan = null) {
  const base = baseProfile || null;
  if (!base) {
    return null;
  }

  if (!clientCarePlan) {
    return base;
  }

  const editorContent =
    clientCarePlan?.intelligenceOptions?.editorContent &&
    typeof clientCarePlan.intelligenceOptions.editorContent === "object"
      ? clientCarePlan.intelligenceOptions.editorContent
      : null;

  const merged = {
    ...base,
    riskCards: clientCarePlan.riskCards?.length ? clientCarePlan.riskCards : base.riskCards,
    actionPlans: clientCarePlan.actionPlans?.length ? clientCarePlan.actionPlans : base.actionPlans,
    shiftIntelligenceOptions:
      clientCarePlan.intelligenceOptions || base.shiftIntelligenceOptions || {},
  };

  if (!editorContent) {
    return merged;
  }

  return {
    ...merged,
    carePlanHeader: editorContent.carePlanHeader || merged.carePlanHeader,
    aboutMeCards: editorContent.aboutMeCards || merged.aboutMeCards,
    supportCards: editorContent.supportCards || merged.supportCards,
    serviceCards: editorContent.serviceCards || merged.serviceCards,
    rightsCards: editorContent.rightsCards || merged.rightsCards,
    activityCards: editorContent.activityCards || merged.activityCards,
    documentChecklist: editorContent.documentChecklist || merged.documentChecklist,
    documentFiles: editorContent.documentFiles || merged.documentFiles,
    participants: editorContent.participants || merged.participants,
    signatureLogs: editorContent.signatureLogs || merged.signatureLogs,
    carePlanTextPages: editorContent.carePlanTextPages || merged.carePlanTextPages,
  };
}

function mergeResolvedClientProfile(
  baseProfile = null,
  { clientShift = null, clientCarePlan = null } = {}
) {
  const withCarePlan = mergeClientProfileWithCarePlanData(baseProfile, clientCarePlan);
  return mergeClientProfileWithShiftSchedule(withCarePlan, clientShift);
}

function normalizeShiftScheduleForProfile(schedule = {}) {
  return {
    todayAppointments: Array.isArray(schedule.todayAppointments) ? schedule.todayAppointments : [],
    medicationsDue: Array.isArray(schedule.medicationsDue) ? schedule.medicationsDue : [],
    standingAlerts: Array.isArray(schedule.standingAlerts) ? schedule.standingAlerts : [],
    overdueTasks: Array.isArray(schedule.overdueTasks) ? schedule.overdueTasks : [],
  };
}

module.exports = {
  EMPTY_SHIFT_INTELLIGENCE,
  buildShiftIntelligence,
  getShiftIntelligenceRuntime,
  mergeClientProfileWithShiftSchedule,
  mergeClientProfileWithCarePlanData,
  mergeResolvedClientProfile,
  formatShiftScheduleLine,
};
