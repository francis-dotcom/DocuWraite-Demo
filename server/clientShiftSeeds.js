/**
 * Default shift schedules seeded into SQLite on first load per client + shift date.
 * Care-plan risks/goals stay in clientProfiles.js; operational shift items live here.
 */

const CLIENT_SHIFT_SEEDS = {
  "mary-bet": {
    shiftSchedule: {
      todayAppointments: [
        { id: "hair", title: "Hair appointment", timeLabel: "1:00 PM" },
        { id: "community-outing", title: "Community outing", timeLabel: "2:30 PM" },
      ],
      medicationsDue: [
        { id: "oxygen-noon", title: "Oxygen check", timeLabel: "12:00 PM" },
        { id: "oxygen-afternoon", title: "Oxygen check", timeLabel: "4:00 PM" },
        { id: "oxygen-morning", title: "Oxygen check", timeLabel: "7:00 AM" },
      ],
      standingAlerts: [
        { id: "fall-supervision", title: "Fall supervision required" },
        { id: "aspiration", title: "Aspiration precautions during meals" },
        { id: "hearing-aid", title: "Hearing-aid check due" },
      ],
      overdueTasks: [
        { id: "daily-doc", title: "Daily Documentation", dueLabel: "05/13/2026" },
        { id: "mar-review", title: "MAR review signature" },
        { id: "behavior-data", title: "Behavior data entry" },
      ],
    },
    shiftIntelligenceOptions: {
      activeRiskFilter: "high-only",
    },
  },
  "mark-brent": {
    shiftSchedule: {
      todayAppointments: [
        { id: "vocational-checkin", title: "Vocational coach check-in", timeLabel: "2:15 PM" },
        { id: "community-budgeting", title: "Community budgeting outing", timeLabel: "4:15 PM" },
      ],
      medicationsDue: [
        { id: "anticonvulsant", title: "Afternoon anticonvulsant", timeLabel: "1:30 PM" },
        { id: "bedtime-meds", title: "Bedtime medication review", timeLabel: "6:45 PM" },
      ],
      standingAlerts: [
        { id: "seizure-precautions", title: "Seizure precautions active" },
        { id: "glucose-check", title: "Glucose check before outing" },
        { id: "noise-reduction", title: "Noise-reduction supports available" },
      ],
      overdueTasks: [
        { id: "vocational-sheet", title: "Vocational data sheet", dueLabel: "05/13/2026" },
        { id: "behavior-plan", title: "Behavior plan signature" },
        { id: "glucose-log", title: "Glucose log review" },
      ],
    },
    shiftIntelligenceOptions: {
      activeRiskFilter: "high-only",
    },
  },
  "elias-brian": {
    shiftSchedule: {
      todayAppointments: [{ id: "birthday-lunch", title: "Birthday lunch outing", timeLabel: "10:15 AM" }],
      medicationsDue: [{ id: "midday-meds", title: "Midday medication reminder", timeLabel: "11:15 AM" }],
      standingAlerts: [
        { id: "fatigue-monitor", title: "Monitor for fatigue during outing" },
        { id: "wheelchair", title: "Wheelchair available if rest support needed" },
      ],
      overdueTasks: [{ id: "case-note-review", title: "Case note review signature" }],
    },
    shiftIntelligenceOptions: {
      activeRiskFilter: "all",
    },
  },
};

function getClientShiftSeed(clientId) {
  return CLIENT_SHIFT_SEEDS[clientId] || null;
}

function listSeededClientIds() {
  return Object.keys(CLIENT_SHIFT_SEEDS);
}

module.exports = {
  CLIENT_SHIFT_SEEDS,
  getClientShiftSeed,
  listSeededClientIds,
};
