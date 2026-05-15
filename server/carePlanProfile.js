const MARY_BET_PROFILE = {
  name: "Mary Bet",
  risks: ["fall risk", "aspiration", "elopement", "communication barriers"],
  goals: ["community participation", "ADL independence", "behavior management"],
  diet: ["PKU", "GERD precautions", "hydration monitoring"],
  interventions: ["verbal cueing", "mobility supervision", "redirection", "line-of-sight supervision"],
};

const MARK_BRENT_PROFILE = {
  name: "Mark Brent",
  risks: ["seizure", "elopement", "blood sugar instability", "sensory overload"],
  goals: ["vocational readiness", "community independence", "diabetes self-management"],
  diet: ["carbohydrate consistency", "low sugar", "meal timing"],
  interventions: ["visual schedules", "noise reduction", "glucose monitoring", "structured transitions"],
};

const MARK_BRENT_CONTEXTUAL_MEMORY = {
  previousShiftIssues: [
    "Sensory overload noted before community outing",
    "Needed extra coaching during vocational sorting task",
  ],
  recurringRefusals: ["Brief refusal when transition was not previewed"],
  fatiguePatterns: ["Fatigue more likely after community budgeting outings"],
  behaviorEscalationHistory: ["Pacing and humming when store noise increased"],
};

const MARK_BRENT_ENVIRONMENT_DEFAULTS = {
  weather: "Partly cloudy and warm",
  outingDuration: "About 60 minutes",
  transportation: "Agency sedan with staff supervision",
};

const MARK_BRENT_CARE_PLAN_TRIGGERS = [
  {
    id: "seizure-risk",
    when: { risks: ["seizure"], workflows: ["morning-adl", "return-home"] },
    stepKey: "micro-fall-risk",
  },
  {
    id: "diabetes-meal",
    when: { risks: ["blood sugar instability"], workflows: ["feeding-support"] },
    stepKey: "micro-aspiration",
  },
  {
    id: "vocational-community",
    when: { goals: ["vocational readiness"], workflows: ["community-outing", "in-home-leisure"] },
    stepKey: "micro-social-boundary",
  },
];

const MARK_BRENT_COMPLIANCE_REQUIREMENTS = {
  "morning-adl": ["supervision", "response"],
  "feeding-support": ["aspiration", "hydration", "response"],
  "in-home-leisure": ["supervision", "response"],
  "community-outing": ["supervision", "mobility", "response"],
  "return-home": ["hydration", "response", "mobility"],
  "behavior-support": ["response"],
  "communication-support": ["response"],
  "medication-support": ["response"],
  "case-note-final": [],
};

const MARK_BRENT_GOAL_TRACKING = {
  "morning-adl": ["diabetes self-management"],
  "feeding-support": ["diabetes self-management"],
  "in-home-leisure": ["vocational readiness"],
  "community-outing": ["community independence", "vocational readiness"],
  "return-home": ["community independence"],
  "behavior-support": ["community independence"],
  "communication-support": ["vocational readiness"],
  "medication-support": ["diabetes self-management"],
  "case-note-final": ["community independence", "vocational readiness"],
};

const CONTEXTUAL_MEMORY = {
  previousShiftIssues: [
    "Fatigue noted after morning ADL block",
    "Needed redirection during community contact",
  ],
  recurringRefusals: ["Occasional refusal during oral hygiene"],
  fatiguePatterns: ["Fatigue more likely after ADLs and before late-afternoon outings"],
  behaviorEscalationHistory: ["Minor agitation when rushed during transitions"],
};

const ENVIRONMENT_DEFAULTS = {
  weather: "Clear and mild",
  outingDuration: "About 90 minutes",
  transportation: "Agency van with staff supervision",
};

const CARE_PLAN_TRIGGERS = [
  {
    id: "fall-risk",
    when: { risks: ["fall risk"], workflows: ["morning-adl", "community-outing", "return-home"] },
    stepKey: "micro-fall-risk",
  },
  {
    id: "aspiration",
    when: { risks: ["aspiration"], workflows: ["feeding-support"] },
    stepKey: "micro-aspiration",
  },
  {
    id: "social-boundary",
    when: { goals: ["community participation"], workflows: ["community-outing", "in-home-leisure"] },
    stepKey: "micro-social-boundary",
  },
];

const COMPLIANCE_REQUIREMENTS = {
  "morning-adl": ["supervision", "hydration", "mobility", "response"],
  "feeding-support": ["aspiration", "hydration", "response"],
  "in-home-leisure": ["supervision", "response"],
  "community-outing": ["supervision", "hydration", "mobility", "response"],
  "return-home": ["hydration", "response", "mobility"],
  "behavior-support": ["response"],
  "communication-support": ["response"],
  "medication-support": ["response"],
  "case-note-final": [],
};

const GOAL_TRACKING = {
  "morning-adl": ["ADL independence"],
  "feeding-support": ["ADL independence"],
  "in-home-leisure": ["community participation"],
  "community-outing": ["community participation", "behavior management"],
  "return-home": ["community participation", "ADL independence"],
  "behavior-support": ["behavior management"],
  "communication-support": ["ADL independence"],
  "medication-support": ["ADL independence"],
  "case-note-final": ["community participation", "ADL independence", "behavior management"],
};

const STEP_THEME_MAP = {
  mobility: "mobility",
  hydration: "hydration",
  response: "response",
  behaviorObserved: "response",
  interventionUsed: "response",
  communicationSupport: "response",
  hearingAidCheck: "response",
  medicationType: "response",
  medicationTiming: "response",
  runtimeAppointmentReview: "response",
  runtimeMedicationReview: "response",
  runtimeAlertReview: "response",
  runtimeGoalProgress: "response",
  "runtime-appointment-review": "response",
  "runtime-medication-review": "response",
  "runtime-alert-review": "response",
  "runtime-goal-progress": "response",
  promptLevel: "response",
  aspiration: "aspiration",
  fluids: "hydration",
  "checkpoint-supervision": "supervision",
  "checkpoint-hydration": "hydration",
  "checkpoint-mobility": "mobility",
  "checkpoint-response": "response",
  "checkpoint-aspiration": "aspiration",
  "micro-fall-risk": "mobility",
  "micro-aspiration": "aspiration",
};

function getPatientProfile(patientName = "Mary Bet") {
  if (/mark\s*brent/i.test(patientName)) {
    return { ...MARK_BRENT_PROFILE, name: "Mark Brent" };
  }
  return { ...MARY_BET_PROFILE, name: patientName };
}

function getContextualMemory(patientName = "Mary Bet") {
  if (/mark\s*brent/i.test(patientName)) {
    return MARK_BRENT_CONTEXTUAL_MEMORY;
  }
  return CONTEXTUAL_MEMORY;
}

function getEnvironmentDefaults(patientName = "Mary Bet") {
  if (/mark\s*brent/i.test(patientName)) {
    return MARK_BRENT_ENVIRONMENT_DEFAULTS;
  }
  return ENVIRONMENT_DEFAULTS;
}

function getCarePlanTriggers(patientName = "Mary Bet") {
  if (/mark\s*brent/i.test(patientName)) {
    return MARK_BRENT_CARE_PLAN_TRIGGERS;
  }
  return CARE_PLAN_TRIGGERS;
}

function getComplianceRequirements(patientName = "Mary Bet") {
  if (/mark\s*brent/i.test(patientName)) {
    return MARK_BRENT_COMPLIANCE_REQUIREMENTS;
  }
  return COMPLIANCE_REQUIREMENTS;
}

function getGoalTracking(patientName = "Mary Bet") {
  if (/mark\s*brent/i.test(patientName)) {
    return MARK_BRENT_GOAL_TRACKING;
  }
  return GOAL_TRACKING;
}

module.exports = {
  MARY_BET_PROFILE,
  MARK_BRENT_PROFILE,
  CONTEXTUAL_MEMORY,
  ENVIRONMENT_DEFAULTS,
  CARE_PLAN_TRIGGERS,
  COMPLIANCE_REQUIREMENTS,
  GOAL_TRACKING,
  STEP_THEME_MAP,
  getPatientProfile,
  getContextualMemory,
  getEnvironmentDefaults,
  getCarePlanTriggers,
  getComplianceRequirements,
  getGoalTracking,
};
