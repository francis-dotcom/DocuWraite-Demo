/**
 * Normalizes Therap (or middleware) JSON into DocuWraite shift + care-plan shapes.
 */

function normalizeScheduleItem(item = {}, fallbackPrefix = "item") {
  if (typeof item === "string") {
    return { id: `${fallbackPrefix}-${item}`, title: item.trim() };
  }

  const title = String(item.title || item.name || item.label || "").trim();
  if (!title) {
    return null;
  }

  return {
    id: String(item.id || item.key || `${fallbackPrefix}-${title}`).trim(),
    title,
    timeLabel: String(item.timeLabel || item.time || item.scheduledAt || "").trim() || undefined,
    dueLabel: String(item.dueLabel || item.dueDate || item.due || "").trim() || undefined,
  };
}

function normalizeScheduleList(items = [], fallbackPrefix = "item") {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item, index) => normalizeScheduleItem(item, `${fallbackPrefix}-${index}`)).filter(Boolean);
}

function normalizeShiftSchedule(schedule = {}) {
  const source = schedule.schedule || schedule;

  return {
    todayAppointments: normalizeScheduleList(
      source.todayAppointments || source.appointments || [],
      "appointment"
    ),
    medicationsDue: normalizeScheduleList(
      source.medicationsDue || source.medications || source.marDue || [],
      "medication"
    ),
    standingAlerts: normalizeScheduleList(source.standingAlerts || source.alerts || [], "alert"),
    overdueTasks: normalizeScheduleList(source.overdueTasks || source.overdue || [], "overdue"),
  };
}

function normalizeRiskCard(risk = {}, index = 0) {
  const title = String(risk.title || risk.riskType || risk.name || "").trim();
  if (!title) {
    return null;
  }

  return {
    title,
    severity: String(risk.severity || risk.level || "Medium").trim(),
    notes: String(risk.notes || risk.comments || risk.description || "").trim(),
    guidance: String(risk.guidance || risk.support || risk.intervention || "").trim(),
  };
}

function normalizeActionPlan(plan = {}, index = 0) {
  const outcome = String(plan.outcome || plan.goal || plan.desiredOutcome || "").trim();
  if (!outcome && !plan.title) {
    return null;
  }

  return {
    title: String(plan.title || `Action Plan ${index + 1}`).trim(),
    outcome: outcome || String(plan.title || "").trim(),
    issue: String(plan.issue || plan.problem || "").trim(),
    steps: Array.isArray(plan.steps)
      ? plan.steps.map((step) => ({
          step: String(step.step || step.description || "").trim(),
          responsible: String(step.responsible || "").trim(),
          frequency: String(step.frequency || "").trim(),
          record: String(step.record || "").trim(),
          notes: String(step.notes || "").trim(),
        }))
      : [],
  };
}

function normalizeCarePlanPayload(payload = {}) {
  const source = payload.carePlan || payload;

  const riskCards = (source.riskCards || source.risks || [])
    .map((risk, index) => normalizeRiskCard(risk, index))
    .filter(Boolean);

  const actionPlans = (source.actionPlans || source.goals || source.plans || [])
    .map((plan, index) => normalizeActionPlan(plan, index))
    .filter(Boolean);

  return {
    riskCards,
    actionPlans,
    intelligenceOptions:
      source.intelligenceOptions || source.shiftIntelligenceOptions || payload.intelligenceOptions || {},
  };
}

function normalizeShiftFeedPayload(payload = {}) {
  return {
    shiftDate: payload.shiftDate || payload.date || null,
    schedule: normalizeShiftSchedule(payload),
    intelligenceOptions: payload.intelligenceOptions || payload.shiftIntelligenceOptions || {},
  };
}

module.exports = {
  normalizeShiftSchedule,
  normalizeShiftFeedPayload,
  normalizeCarePlanPayload,
  normalizeScheduleItem,
};
