import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import { carePlanText } from "./carePlanText";
import { fetchDocuWraiteWorkflowStep } from "./docuWraiteAi";
import { docuWraiteUseRuleBasedFallback, docuWraiteApiBaseUrl } from "./docuWraiteConfig";
import {
  buildCaseNoteDocumentationItems,
  buildMeasurableDocumentationItems,
  CLIENT_ROSTER,
  getClientById,
  getMarkBrentProfile,
  searchClients,
} from "./clientProfiles";

const decisionNodes = require("./decisionAlgo/nodes.json");

const userProfilePhoto = require("./demoImages/dsp-user.png");
const maryBetProfilePhoto = require("./demoImages/patient-mary-bet.png");
const markBrentProfilePhoto = require("./demoImages/patient-mark-brent-ai.png");

const loggedInUser = "Brian (DEMOTRAIN-NC)";
const patientDisplayName = "Mary Bet";

const colors = {
  bg: "#f5f2fb",
  panel: "#ffffff",
  border: "#d4c2f1",
  headerBlue: "#eadfff",
  topPurple: "#7c3aed",
  text: "#312447",
  muted: "#6b4fa1",
  link: "#7e57c2",
  green: "#5b3db6",
  red: "#d32f2f",
  lightBorder: "#ddd2f3",
  rowBorder: "#f0e9fb",
  headerText: "#5c3d99",
  tableHead: "#70579d",
  placeholder: "#9f92b8",
};

const handoverVitalFields = [
  { key: "temperature", label: "Temperature", placeholder: "98.6 F" },
  { key: "bloodPressure", label: "Blood Pressure", placeholder: "120/80" },
  { key: "pulse", label: "Pulse", placeholder: "72 bpm" },
  { key: "respiration", label: "Respiration", placeholder: "16/min" },
  { key: "oxygenSaturation", label: "O2 Saturation", placeholder: "98%" },
];

const modules = [
  "Assessment & Screening",
  "Attendance",
  "Behavior Data",
  "Behavior Plan",
  "Care Plan",
  "Decision Engine",
  "Case Note",
  "Document Storage",
  "Drug Count",
  "General Event Reports (GER)",
  "Health Tracking",
  "Individual Plan",
  "Individual Plan Agenda",
  "ISP Data",
  "ISP Program",
  "MAR Data",
  "Medication History",
  "Personal Finance Transaction",
  "Personal Focus Worksheet",
  "Priority List",
  "T-Log",
  "Time Tracking",
];

const pdfs = ["Emergency Data Form", "Face Sheet", "Medical Information"];

const ispColumns = [
  { key: "name", label: "Name", flex: 2.8 },
  { key: "startDate", label: "Start Date", flex: 1.1 },
  { key: "endDate", label: "End Date", flex: 1.1 },
  { key: "frequency", label: "Frequency", flex: 0.8 },
  { key: "schedule", label: "Schedule", flex: 1 },
  { key: "ispData", label: "ISP Data", flex: 1 },
];

const ispRows = [
  {
    name: "Cooking Skills (1st Street)",
    startDate: "06/01/2024",
    endDate: "",
    frequency: "3",
    schedule: "Weekly",
    ispData: "New",
  },
  {
    name: "Daily Documentation & Goals",
    startDate: "05/01/2024",
    endDate: "",
    frequency: "1",
    schedule: "Daily",
    ispData: "New",
  },
  {
    name: "Daily Documentation and Goals",
    startDate: "04/01/2021",
    endDate: "06/30/2026",
    frequency: "1",
    schedule: "Daily",
    ispData: "EVV Only",
  },
];

const professionalColumns = [
  { key: "name", label: "Name", flex: 2.4 },
  { key: "dateRange", label: "Date Range", flex: 1.8 },
  { key: "new", label: "New", flex: 0.8 },
];

const professionalRows = [
  {
    name: "H2016 - Residential",
    dateRange: "06/01/2022 - 05/31/2028",
    new: "",
  },
];

const carePlanHeader = {
  fullName: "MARY BET",
  medicaidId: "1D510568555",
  dob: "01/22/1947",
  oversightId: "0000010468 (DIDD-TN)",
  guardian: "Elena Vargas",
  planStart: "01/17/2026",
  planEnd: "01/16/2027",
  status: "Approved",
};

const carePlanTabs = [
  "Overview",
  "About Me",
  "Risks",
  "Supports",
  "Services",
  "Rights",
  "Activities",
  "Action Plans",
  "Documents",
  "Participants",
  "Source Pages",
];

const aboutMeCards = [
  {
    title: "What people admire about me",
    body:
      "Mary Bet is very loveable, friendly, affectionate, and social. She loves to give hugs, wear jewelry, carry a purse from her collection, laugh with people, and help others. She often remembers personal details about others and enjoys playful conversation.",
  },
  {
    title: "What is important to me",
    body:
      "At home, Mary Bet values looking pretty, receiving compliments, keeping her stuffed animals nearby, having personal space respected, and being able to rest. In the community, she values shopping, talking with others, going out to eat, getting sweet tea, and having the flexibility to come home and rest when tired.",
  },
  {
    title: "How best to support me",
    body:
      "Support Mary Bet with calm redirection, close fall supervision, hearing-aid reminders, oxygen monitoring, dietary guidance, and flexible rest breaks. Staff should stay attentive to her changing energy, mobility, and communication needs while preserving choice and dignity.",
  },
];

const riskCards = [
  {
    title: "Falls",
    severity: "High",
    notes:
      "Mary Bet has had several falls and continues to report or indicate falls, even while seated. Vision decline, balance problems, and gait instability increase risk.",
    guidance:
      "Maintain line-of-sight supervision, follow ambulation instructions, keep assistive equipment available, and document fall-prevention observations.",
  },
  {
    title: "Aspiration / Choking",
    severity: "High",
    notes:
      "Mary Bet is at increased risk of choking due to eating pace, talking during meals, loss of food or fluid from the mouth, dentures, and swallowing concerns.",
    guidance:
      "Use teaspoon-size bites, clear mouth before next bite, offer liquids every 2-3 bites, and avoid conversation during active swallowing.",
  },
  {
    title: "Inability to communicate basic needs",
    severity: "Medium",
    notes:
      "Mary Bet may have difficulty expressing pain, illness, hunger, or thirst clearly and may sometimes use pain complaints for attention seeking.",
    guidance:
      "Treat discomfort reports seriously, watch body language, check medication and diet compliance, and escalate for medical evaluation if confusion or unusual behavior appears.",
  },
  {
    title: "Medical procedure intolerance",
    severity: "Medium",
    notes:
      "Mary Bet may need IV sedation or hospital-level anesthesia for stressful medical or dental procedures because of anxiety and tolerance issues.",
    guidance:
      "Coordinate with PCP before procedures, verify sedation plans, and document PRN supports and anesthesia requirements clearly.",
  },
  {
    title: "Elopement / self-injury / aggression",
    severity: "Low",
    notes:
      "Risk history includes elopement awareness, past self-harm such as biting, and minor aggression or throwing items.",
    guidance:
      "Use trained redirection approaches, keep behavior supports available, and document triggers and de-escalation outcomes.",
  },
];

const supportCards = [
  {
    title: "Supports at Home",
    body:
      "Mary Bet lives in a single-family home in LaVergne, TN with a longtime male housemate. The home includes safety modifications such as bathroom holding bars and wheelchair-accessible ramps. Staff support includes hearing-aid reminders, oxygen checks at 12:00 A.M., 4:00 A.M., and 7:00 A.M., soiled-brief changes as needed, and total assistance with safety in dangerous situations.",
  },
  {
    title: "Supports in Community",
    body:
      "Mary Bet receives community participation and intermittent wraparound supports. Staff assist with ambulation, wheelchair access for longer distances, safe purchases, appropriate social boundaries, and return-home transitions when fatigue, weather, or hygiene needs make continuing unsafe or impractical.",
  },
  {
    title: "ADLs and Household Chores",
    body:
      "Mary Bet now requires total staff assistance with showering, toileting, dressing, oral hygiene, household chores, laundry, room cleaning, dusting, and vacuuming. She benefits from both verbal and physical prompts and needs balance support during transfers and hygiene routines.",
  },
  {
    title: "Communication Style",
    body:
      "Mary Bet verbally communicates wants and needs. When ill she may appear sad, have a blank stare, or slurred speech. When upset she becomes quieter and may be harder to understand. Staff should monitor body language, encourage calm conversation, and ensure hearing aids are available and functioning.",
  },
];

const serviceCards = [
  {
    title: "Independent Support Coordination",
    provider: "BGC INC - Middle",
    funding: "CAC - Comprehensive Aggregate Cap",
    status: "Approved",
    dateRange: "01/17/2026 - 01/16/2027",
    detail: "Monthly coordination contact cadence; care plan oversight and waiver coordination.",
  },
  {
    title: "Community Participation Supports",
    provider: "Kharis Care LLC - Middle",
    funding: "CAC - Comprehensive Aggregate Cap",
    status: "Approved",
    dateRange: "01/17/2026 - 01/16/2027",
    detail: "Level 4 community participation with flexible rest and return-home support.",
  },
  {
    title: "Intermittent Employment & Community Wraparound",
    provider: "Kharis Care LLC - Middle",
    funding: "CAC - Comprehensive Aggregate Cap",
    status: "Approved",
    dateRange: "01/17/2026 - 01/16/2027",
    detail: "Wraparound coverage for fatigue, weather, meals, clothing changes, and transition support.",
  },
  {
    title: "Supported Living Level 4",
    provider: "Kharis Care LLC - Middle",
    funding: "CAC - Comprehensive Aggregate Cap",
    status: "Approved",
    dateRange: "01/17/2026 - 01/16/2027",
    detail: "Two-person supported living structure with strong safety and ADL supervision.",
  },
  {
    title: "Nutrition Services",
    provider: "Mary Eva Gregory - Middle",
    funding: "CAC - Comprehensive Aggregate Cap",
    status: "Approved",
    dateRange: "02/01/2026 - 12/31/2026",
    detail: "PKU, GERD, constipation, and cholesterol nutrition management.",
  },
  {
    title: "Speech / Hearing Services",
    provider: "Speech Pathology Specialist, LLC - Middle",
    funding: "CAC - Comprehensive Aggregate Cap",
    status: "Approved",
    dateRange: "02/01/2026 - 01/16/2027",
    detail: "Safe eating strategies, auditory comprehension, and hearing-aid use support.",
  },
];

const rightsCards = [
  {
    title: "Decision Making & Rights",
    body:
      "Mary Bet likes to make day-to-day choices about what to wear and where to go. Michael Dunn Center is the court-appointed limited conservator for specified responsibilities, but Mary Bet still retains personal choice in daily routine and many ordinary preferences.",
  },
  {
    title: "Consumer Direction / ANE Education",
    body:
      "Mary Bet and the coordinator discussed consumer direction and abuse, neglect, and exploitation education on 11/18/2025. She is not using consumer direction and no current ANE concerns are documented.",
  },
  {
    title: "Advanced Directives / Burial Plans",
    body:
      "No advanced directive or declaration for mental health treatment is documented. Burial support planning references DIDD burial-program procedures if needed.",
  },
];

const activityCards = [
  {
    title: "Current community activities",
    body:
      "Mary Bet often prefers staying home, but enjoys shopping, getting her hair done, going out for food or sweet tea, and choosing community outings when given options.",
  },
  {
    title: "Supports needed for independence",
    body:
      "Staff assist with hearing devices, dentures, wheelchair access, stair safety, meal-plan compliance, money handling, community transitions, and reminders about appropriate social boundaries.",
  },
];

const actionPlanColumns = [
  { key: "step", label: "Description of Measurable Step", flex: 2.2 },
  { key: "responsible", label: "Responsible Person", flex: 1.2 },
  { key: "frequency", label: "Frequency / Due Date", flex: 0.9 },
  { key: "record", label: "Where to Record", flex: 0.9 },
  { key: "notes", label: "Notes", flex: 2.4 },
];

const actionPlans = [
  {
    title: "Action Plan 1",
    outcome:
      "Mary Bet follows prescribed meal plan daily for PKU to improve health, sleep, mood, GI stability, and reduce GERD complications.",
    issue:
      "Mary Bet has a history of PKU, GERD, chronic constipation, and high cholesterol.",
    steps: [
      {
        step:
          "Mary Bet follows the prescribed heart healthy meal plan with low sodium, low saturated fat, low cholesterol, and high fiber.",
        responsible: "Home: Mary Bet and RD\nOther: Mary Bet and RD",
        frequency: "Daily",
        record: "Monthly notes",
        notes:
          "Avoid high PHE foods, give supplements daily, track intake logs, monitor labs, promote fluids, fiber, GERD-safe habits, upright posture after meals, and tolerated activity.",
      },
      {
        step:
          "Mary Bet eats safely with total assistance, teaspoon-size bites, mouth clearing before next bite, liquids every 2-3 bites, and no talking during meals.",
        responsible: "Home: Mary Bet and SLP\nOther: Mary Bet and SLP",
        frequency: "Daily",
        record: "Monthly notes",
        notes:
          "Staff provide close mealtime oversight and follow the modified safe-eating plan exactly as ordered.",
      },
    ],
  },
  {
    title: "Action Plan 2",
    outcome: "Mary Bet wants to communicate effectively with others.",
    issue: "Mary Bet is hard of hearing and previously lost her hearing aids.",
    steps: [
      {
        step: "Mary Bet receives hearing aids and uses them during communication supports.",
        responsible: "Home: Mary Bet and SLP\nOther: Mary Bet and SLP",
        frequency: "Daily",
        record: "Monthly notes",
        notes:
          "Staff verify hearing aids are present, functioning, and safely stored when not in use.",
      },
      {
        step: "Mary Bet tells staff when hearing aids are not working.",
        responsible: "Home: Mary Bet and SLP\nOther: Mary Bet and SLP",
        frequency: "Daily",
        record: "Daily documentation",
        notes:
          "Prompt Mary Bet to report hearing problems early so devices can be checked or replaced.",
      },
      {
        step: "Mary Bet completes 1-2 step instructions and verbalizes needs and concerns.",
        responsible: "Home: Mary Bet and SLP\nOther: Mary Bet and SLP",
        frequency: "Daily",
        record: "Monthly documentation",
        notes:
          "Use repeat-back prompts, slower pacing, and teletherapy or home or community supports as needed.",
      },
    ],
  },
  {
    title: "Action Plan 3",
    outcome: "Mary Bet does much for herself to increase her independence.",
    issue:
      "Due to declining health, Mary Bet cannot perform previous activities such as household chores and some ADLs without support.",
    steps: [
      {
        step: "Mary Bet chooses to participate in community activities at least once per week.",
        responsible: "Home: Mary Bet, SL, and CP\nOther: Mary Bet, CP, and SL",
        frequency: "Daily tracking",
        record: "Monthly documentation",
        notes:
          "Offer choices, support decision making, monitor fatigue, and document successful engagement and barriers.",
      },
    ],
  },
];

const DOCUMENTATION_CHAR_LIMIT = 3000;

const supportLevelOptions = [
  "Independent",
  "Verbal Prompt",
  "Physical Prompt",
  "Partial Assist",
  "Full Assist",
  "Refused",
  "Completed",
  "Community Participation Hours",
  "Not Applicable",
];

const ispFormDescriptions = [
  `Measurable outcome: ${patientDisplayName} participates in community integration activities of her choice such as church, park, and mall outings.`,
  `Target behavior: ${patientDisplayName} will reduce inappropriate behaviors in the home and in the community with staff support rendered.`,
  `ADL goal: ${patientDisplayName} completes daily independent living skills with documented prompt level, reminders, and assistance when needed.`,
];

const shiftIntelligenceData = {
  overdue: ["Daily Documentation (05/13/2026)", "MAR review signature", "Behavior data entry"],
  activeRisks: riskCards.filter((risk) => risk.severity === "High").map((risk) => `${risk.title} (${risk.severity})`),
  appointments: ["Hair appointment 1:00 PM", "Community outing 2:30 PM"],
  medicationsDue: ["Oxygen check 12:00 PM", "Oxygen check 4:00 PM", "Oxygen check 7:00 AM"],
  alerts: ["Fall supervision required", "Aspiration precautions during meals", "Hearing-aid check due"],
  incompleteGoals: actionPlans.map((plan) => plan.outcome),
};

function getShiftIntelligenceRuntime(clientProfile = null, documentationSession = null) {
  const base = clientProfile?.shiftIntelligenceData ?? shiftIntelligenceData;
  const incompleteGoals = documentationSession
    ? base.incompleteGoals.filter((_, index) => !documentationSession.rows[index]?.score)
    : base.incompleteGoals;

  return {
    overdue: [...(base.overdue || [])],
    activeRisks: [...(base.activeRisks || [])],
    appointments: [...(base.appointments || [])],
    medicationsDue: [...(base.medicationsDue || [])],
    alerts: [...(base.alerts || [])],
    incompleteGoals,
  };
}

const quickPhraseSnippets = {
  behavior:
    "Target behavior observed during shift. Intervention implemented with staff support rendered. Observed response documented for supervisor review.",
  community:
    "Community integration activity completed with staff support rendered. Prompt level documented and observed response recorded.",
  meal:
    "Meal support provided with aspiration precautions. Meal pacing, fluid intake, and observed response documented.",
  handoff:
    "Shift handoff completed. Notable incidents, health concerns, and progress toward goals reviewed with oncoming staff.",
};

const SPELLING_CORRECTIONS = {
  recieved: "received",
  recieve: "receive",
  occured: "occurred",
  ocurred: "occurred",
  redirrection: "redirection",
  redirecton: "redirection",
  supervion: "supervision",
  supervission: "supervision",
  aspriation: "aspiration",
  aspitation: "aspiration",
  hydraton: "hydration",
  independance: "independence",
  ambulaton: "ambulation",
  lethergic: "lethargic",
  lethagic: "lethargic",
  cooperatve: "cooperative",
  documention: "documentation",
  interventon: "intervention",
  responsibile: "responsible",
  definetly: "definitely",
  seprate: "separate",
  seperated: "separated",
  teh: "the",
  wiht: "with",
  thier: "their",
};

const SPELLING_IGNORE_WORDS = new Set([
  "mary",
  "bet",
  "pku",
  "gerd",
  "adl",
  "adls",
  "dsp",
  "isp",
  "mar",
  "therap",
  "docuwraite",
]);

function preserveSpellingCase(original, replacement) {
  if (original === original.toUpperCase()) {
    return replacement.toUpperCase();
  }
  if (original[0] === original[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function findSpellingIssues(text = "") {
  const issues = [];
  const pattern = /\b[a-z']+\b/gi;
  let match = pattern.exec(text);

  while (match) {
    const word = match[0];
    const lower = word.toLowerCase();
    if (lower.length >= 3 && !SPELLING_IGNORE_WORDS.has(lower)) {
      const suggestion = SPELLING_CORRECTIONS[lower];
      if (suggestion) {
        issues.push({
          id: `${match.index}-${lower}`,
          word,
          suggestion,
          start: match.index,
          end: match.index + word.length,
        });
      }
    }
    match = pattern.exec(text);
  }

  return issues;
}

function replaceTextRange(text, start, end, replacement) {
  return `${text.slice(0, start)}${replacement}${text.slice(end)}`;
}

function buildWordingSuggestion({ description, source, value }) {
  const theme =
    detectDocuWraiteWorkflowTheme(description || value || source || "") ||
    detectDocuWraiteWorkflowTheme(value);
  const base = getDocuWraiteSuggestion(theme, value, source);
  const text = (value || "").trim();

  if (!text) {
    return {
      title: "Suggested opening",
      message: "Use care-plan aligned language for this field.",
      suggestion: base,
      action: "replace",
    };
  }

  const gap = getDocuWraiteCarePlanGap(theme, text);
  if (gap) {
    return {
      title: "Care-plan wording",
      message: gap,
      suggestion: `${text.replace(/\s+$/, "")} ${base}`,
      action: "append",
    };
  }

  const { confidence } = scoreDocuWraiteConfidence(text);
  if (confidence < 70) {
    return {
      title: "Stronger wording",
      message: "This note is thin or vague. Add staff support, prompt level, and observed response.",
      suggestion: `${text.replace(/\s+$/, "")} Staff support rendered, prompt level documented, and observed response recorded.`,
      action: "append",
    };
  }

  return {
    title: "Polish wording",
    message: "Suggested polished wording for supervisor review.",
    suggestion: text,
    action: "replace",
  };
}

const previousShiftSnapshot = {
  timeBlocks: [
    { label: "7am–9am", score: "Verbal Prompt", comment: "Morning hygiene completed with verbal prompts and partial assist." },
    { label: "9am–11am", score: "Completed", comment: "Community outing completed with staff support rendered and observed response documented." },
  ],
  rows: [
    { score: "Verbal Prompt", comment: "Prompt level documented during ADL routine. Observed response was cooperative." },
  ],
  shiftSummary:
    "Overall mood was stable. No notable incidents. Progress toward goals observed during community participation.",
};

const documentationTimeBlocks = [
  { id: "7-9", label: "7am–9am" },
  { id: "9-11", label: "9am–11am" },
  { id: "11-1", label: "11am–1pm" },
  { id: "1-3", label: "1pm–3pm" },
  { id: "3-5", label: "3pm–5pm" },
];

const supplementalDocumentationItems = [
  `${patientDisplayName} followed meal plan guidelines.`,
  `${patientDisplayName} safely ambulated with staff assistance.`,
  `${patientDisplayName} reduced inappropriate behaviors during community participation.`,
];

function getRiskDrivenDocumentationItems() {
  return riskCards.map((risk) => ({
    id: `risk-${risk.title}`,
    description: `Risk-informed prompt (${risk.title}): ${risk.guidance}`,
    source: `Care Plan Risk / ${risk.severity}`,
    linkedFromCarePlan: true,
  }));
}

function getMeasurableDocumentationItems() {
  const items = ispFormDescriptions.map((description, index) => ({
    id: `isp-form-${index}`,
    description,
    source: "ISP Data / Measurable Outcome",
    linkedFromCarePlan: true,
  }));

  getRiskDrivenDocumentationItems().forEach((item) => items.push(item));

  actionPlans.forEach((plan) => {
    items.push({
      id: `${plan.title}-outcome`,
      description: `Desired outcome: ${plan.outcome}`,
      source: plan.title,
      linkedFromCarePlan: true,
    });
    plan.steps.forEach((step, index) => {
      items.push({
        id: `${plan.title}-step-${index}`,
        description: `Measurable step: ${step.step}`,
        source: plan.title,
        linkedFromCarePlan: true,
      });
    });
  });

  supplementalDocumentationItems.forEach((description, index) => {
    items.push({
      id: `supplement-${index}`,
      description: `Staff support rendered: ${description}`,
      source: "Shift Support",
      linkedFromCarePlan: true,
    });
  });

  return items;
}

function getCaseNoteDocumentationItems() {
  const entries = [
    {
      description: `Document target behavior, observed response, and intervention implemented during the shift for ${patientDisplayName}.`,
      workflowId: "behavior-support",
      theme: "behavior",
    },
    {
      description: `Document ADL assistance, hygiene support, and prompt level provided for ${patientDisplayName}.`,
      workflowId: "morning-adl",
      theme: "hygiene",
    },
    {
      description: `Document meal support, meal pacing, fluid intake, and aspiration precautions for ${patientDisplayName}.`,
      workflowId: "feeding-support",
      theme: "meal",
    },
    {
      description: `Document communication supports, hearing-aid use, and observed response for ${patientDisplayName}.`,
      workflowId: "communication-support",
      theme: "communication",
    },
    {
      description: `Document community integration activity, transportation, and return-home transition for ${patientDisplayName}.`,
      workflowId: "community-outing",
      theme: "outing",
    },
    {
      description: `Document behavioral support, redirection, and staff support rendered for ${patientDisplayName}.`,
      workflowId: "behavior-support",
      theme: "behavior",
    },
  ];

  return entries.map((entry, index) => ({
    id: `case-note-${index}`,
    description: entry.description,
    source: "Case Note",
    linkedFromCarePlan: true,
    workflowId: entry.workflowId,
    theme: entry.theme,
  }));
}

function createTimeBlockEntry(block, index) {
  return {
    ...block,
    score: "",
    comment: "",
    order: index,
  };
}

const SCHEDULE_HOUR_OPTIONS = Array.from({ length: 18 }, (_, index) => 6 + index);
const SCHEDULE_START_HOUR_OPTIONS = SCHEDULE_HOUR_OPTIONS.slice(0, -1);

function formatScheduleHourLabel(hour = 7) {
  const suffix = hour >= 12 ? "pm" : "am";
  const normalized = hour % 12 === 0 ? 12 : hour % 12;
  return `${normalized}${suffix}`;
}

function buildScheduleBlockLabel(startHour = 7, endHour = 8) {
  return `${formatScheduleHourLabel(startHour)}–${formatScheduleHourLabel(endHour)}`;
}

function buildScheduleBlockId(startHour = 7, endHour = 8, index = 0) {
  return `${startHour}-${endHour}-${index}`;
}

function getTimeBlockPrompt(blockLabel, clientProfile = null) {
  if (clientProfile?.timeBlockMappings?.[blockLabel]?.prompt) {
    return clientProfile.timeBlockMappings[blockLabel].prompt;
  }

  switch (blockLabel) {
    case "7am–9am":
      return `Document morning ADL support, hygiene assistance, and prompt level provided for ${patientDisplayName} during ${blockLabel}.`;
    case "9am–11am":
      return `Document feeding support for breakfast or lunch, staff support rendered, and observed response for ${patientDisplayName} during ${blockLabel}.`;
    case "11am–1pm":
      return `Document in-home leisure, rest, and pre-outing preparation for ${patientDisplayName} during ${blockLabel}.`;
    case "1pm–3pm":
      return `Document community participation outing, mobility support, and observed response for ${patientDisplayName} during ${blockLabel}.`;
    case "3pm–5pm":
      return `Document return-home transition, hydration, and afternoon routine for ${patientDisplayName} during ${blockLabel}.`;
    default:
      return `Document staff support rendered and observed response for ${patientDisplayName} during ${blockLabel}.`;
  }
}

function getTimeBlockSource(blockLabel, clientProfile = null) {
  if (clientProfile?.timeBlockMappings?.[blockLabel]?.source) {
    return clientProfile.timeBlockMappings[blockLabel].source;
  }

  switch (blockLabel) {
    case "7am–9am":
      return "Shift Timeline / Morning ADLs";
    case "9am–11am":
      return "Shift Timeline / Feeding Support";
    case "11am–1pm":
      return "Shift Timeline / In-Home Leisure";
    case "1pm–3pm":
      return "Shift Timeline / Community Outing";
    case "3pm–5pm":
      return "Shift Timeline / Return Home";
    default:
      return "Shift Timeline";
  }
}

function getTimeBlockWorkflowId(blockLabel, clientProfile = null) {
  if (clientProfile?.timeBlockMappings?.[blockLabel]?.workflowId) {
    return clientProfile.timeBlockMappings[blockLabel].workflowId;
  }

  switch (blockLabel) {
    case "7am–9am":
      return "morning-adl";
    case "9am–11am":
      return "feeding-support";
    case "11am–1pm":
      return "in-home-leisure";
    case "1pm–3pm":
      return "community-outing";
    case "3pm–5pm":
      return "return-home";
    default:
      return "community-outing";
  }
}

function getWorkflowEyebrow(workflowId) {
  switch (workflowId) {
    case "assigned-nodes":
      return "Assigned decision workflow";
    case "morning-adl":
      return "Morning ADL support";
    case "feeding-support":
      return "Feeding support";
    case "in-home-leisure":
      return "In-home leisure and rest";
    case "community-outing":
      return "Community outing detected";
    case "return-home":
      return "Return-home transition";
    case "behavior-support":
      return "Behavior support";
    case "communication-support":
      return "Communication support";
    case "medication-support":
      return "Medication support";
    case "case-note-final":
      return "Final case note";
    default:
      return "Guided workflow";
  }
}

function getDecisionNodeDepth(nodeId = "") {
  const match = String(nodeId).match(/^([a-z]+)/i);
  if (!match) {
    return 1;
  }

  return match[1].toLowerCase().charCodeAt(0) - 96;
}

function getDecisionNodeBranchKey(nodeId = "") {
  const match = String(nodeId).match(/(\d+)/);
  return match ? match[1] : "";
}

function buildDecisionNodeStepKey(node = {}) {
  const sectionSlug = String(node.section || "section")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `decision-${node.library || "library"}-${sectionSlug}-${node.id || "node"}`;
}

function buildDecisionNodeSelectionKey(node = {}) {
  return `${node.library || "library"}::${node.section || "section"}::${node.id || "node"}`;
}

function inferDecisionNodeKind(choices = []) {
  const normalized = choices.map((choice) => String(choice).trim().toLowerCase());
  if (
    normalized.length === 2 &&
    normalized.includes("yes") &&
    normalized.includes("no")
  ) {
    return "yes-no";
  }

  return "suggestions";
}

function inferDecisionNodeMultiSelect(question = "", choices = []) {
  const normalizedQuestion = String(question || "").trim().toLowerCase();
  const normalizedChoices = choices.map((choice) => String(choice).trim().toLowerCase());
  if (!normalizedChoices.length) {
    return false;
  }

  if (normalizedChoices.includes("yes") && normalizedChoices.includes("no")) {
    return false;
  }

  return /^which\b/.test(normalizedQuestion);
}

function normalizeDecisionNodeChoices(choices = []) {
  return choices.map((choice) => (String(choice).trim() === "Other" ? "Other..." : choice));
}

function createAssignedWorkflowSteps(assignedNodes = []) {
  const steps = assignedNodes
    .filter((node) => node?.question)
    .map((node) => {
      const suggestions = normalizeDecisionNodeChoices(node.choices || []);
      return {
        stepKey: node.stepKey || buildDecisionNodeStepKey(node),
        kind: inferDecisionNodeKind(suggestions),
        question: node.question,
        suggestions,
        allowCustom: suggestions.includes("Other..."),
        multiSelect: inferDecisionNodeMultiSelect(node.question, suggestions),
        rationale: node.section ? `Assigned from ${node.library} / ${node.section}.` : `Assigned from ${node.library}.`,
        sourceNodeId: node.id,
        sourceLibrary: node.library,
        sourceSection: node.section,
      };
    });

  if (!steps.length) {
    return [];
  }

  return [
    ...steps,
    {
      stepKey: "assigned-nodes-draft",
      kind: "draft",
      question: "Generated documentation",
    },
  ];
}

function formatAssignedWorkflowAnswer(value) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  return String(value || "").trim();
}

function generateAssignedWorkflowNote(answers = {}, workflowState = {}, fieldContext = {}) {
  const answeredSteps = (workflowState.localSteps || [])
    .filter((step) => step.kind !== "draft")
    .map((step) => {
      const value = formatAssignedWorkflowAnswer(getWorkflowAnswer(answers, step.stepKey));
      const narration = String(
        answers[step.narrationField || `${step.stepKey}Narration`] ||
        answers[`${kebabToCamel(step.stepKey)}Narration`] ||
        ""
      ).trim();

      if (!value && !narration) {
        return null;
      }

      const prompt = String(step.question || "")
        .replace(/\?+$/g, "")
        .trim();
      const detail = [value, narration].filter(Boolean).join(" - ");
      return prompt && detail ? `${prompt}: ${detail}` : detail || prompt;
    })
    .filter(Boolean);

  if (!answeredSteps.length) {
    return `No assigned decision-tree responses were captured for ${fieldContext.label || "this block"}.`;
  }

  return `During ${fieldContext.label || "this block"}, ${answeredSteps.join("; ")}.`;
}

function expandAssignedDecisionNodes(selectedNodesPayload = [], options = {}) {
  const {
    selectedDepth = 1,
    includeMode = "selective-branch",
  } = options;

  const allNodes = decisionNodes.libraries.flatMap((lib) => lib.nodes || []);
  const indexedNodes = new Map(
    allNodes.map((node, index) => [
      buildDecisionNodeSelectionKey(node),
      {
        ...node,
        _order: index,
      },
    ])
  );

  const expandedNodes = [];
  const seen = new Set();

  selectedNodesPayload.forEach((payload) => {
    const rootNode = indexedNodes.get(payload.key);
    if (!rootNode) {
      return;
    }

    const rootDepth = getDecisionNodeDepth(rootNode.id);
    const branchKey = getDecisionNodeBranchKey(rootNode.id);
    const branchNodes =
      includeMode === "full-branch" && branchKey
        ? allNodes.filter((candidate) => {
            if (candidate.library !== rootNode.library || candidate.section !== rootNode.section) {
              return false;
            }

            const candidateBranchKey = getDecisionNodeBranchKey(candidate.id);
            const candidateDepth = getDecisionNodeDepth(candidate.id);
            return (
              candidateBranchKey === branchKey &&
              candidateDepth >= rootDepth &&
              candidateDepth <= selectedDepth
            );
          })
        : [rootNode];

    branchNodes
      .filter((node) => node.question)
      .forEach((node) => {
        const dedupeKey = `${node.library}:${node.section}:${node.id}`;
        if (seen.has(dedupeKey)) {
          return;
        }

        seen.add(dedupeKey);
        expandedNodes.push({
          ...node,
          stepKey: buildDecisionNodeStepKey(node),
          includeInFinal: Boolean(payload.includeInFinal),
          rootNodeId: rootNode.id,
          assignmentDepth: selectedDepth,
          includeMode,
        });
      });
  });

  return expandedNodes.sort((left, right) => (left._order || 0) - (right._order || 0));
}

function kebabToCamel(value = "") {
  return String(value).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function syncRemediationAnswerKeys(answerChanges = {}, stepKey = "") {
  if (!stepKey || !stepKey.includes("-")) {
    return answerChanges;
  }

  const camelKey = kebabToCamel(stepKey);
  const next = { ...answerChanges };
  if (next[stepKey] !== undefined) {
    next[camelKey] = next[stepKey];
  }
  if (next[`${stepKey}Custom`] !== undefined) {
    next[`${camelKey}Custom`] = next[`${stepKey}Custom`];
  }
  const contextField = `${stepKey}Context`;
  if (next[contextField] !== undefined) {
    next[`${camelKey}Context`] = next[contextField];
  }
  const selectionsField = `${stepKey}Selections`;
  if (next[selectionsField] !== undefined) {
    next[`${camelKey}Selections`] = next[selectionsField];
  }
  return next;
}

const READINESS_REMEDIATION_BY_MESSAGE = {
  "Hydration support was not documented as provided": "hydration",
  "Active alert card was not reflected in the workflow answers": "runtime-alert-review",
  "Medication due card was not acknowledged in the workflow answers": "runtime-medication-review",
  "Final case note is missing incomplete-goal progress context": "runtime-goal-progress",
};

const RUNTIME_REMEDIATION_STEPS = {
  hydration: {
    stepKey: "hydration",
    kind: "suggestions",
    question: "Was hydration offered or monitored?",
    suggestions: ["Yes", "No", "Not needed", "Other..."],
    allowCustom: true,
    optionalNarration: true,
    narrationField: "hydrationNarration",
    rationale: "Care plan expects fluid monitoring across the shift.",
  },
  "runtime-alert-review": {
    stepKey: "runtime-alert-review",
    kind: "context-action",
    question: "Which alert or caution was relevant to this documentation block?",
    contextLabel: "Select the relevant alert or caution",
    contextField: "runtime-alert-reviewContext",
    actionLabel: "How was it handled this block?",
    suggestions: ["Addressed", "Not relevant", "Needs follow-up", "None", "Other..."],
    allowCustom: true,
    optionalNarration: true,
    narrationField: "runtimeAlertNarration",
    rationale: "Active alerts should drive deterministic compliance checks, not remain passive UI cards.",
  },
  "runtime-medication-review": {
    stepKey: "runtime-medication-review",
    kind: "context-action",
    question: "What medication or oxygen due item should be reflected in this note?",
    contextLabel: "Select the medication or oxygen due item",
    contextField: "runtime-medication-reviewContext",
    actionLabel: "What action or status applies?",
    suggestions: ["Completed", "Not due this block", "Deferred/escalated", "Not relevant", "Other..."],
    allowCustom: true,
    optionalNarration: true,
    narrationField: "runtimeMedicationNarration",
    rationale: "Medication due items should not remain disconnected from the note narrative.",
  },
  "runtime-goal-progress": {
    stepKey: "runtime-goal-progress",
    kind: "suggestions",
    question: "Which incomplete goal or outcome did this block support?",
    suggestions: ["None", "Other..."],
    allowCustom: true,
    optionalNarration: true,
    narrationField: "runtimeGoalNarration",
    rationale: "Incomplete goals should surface in playbook questions and final note summaries.",
  },
  "runtime-appointment-review": {
    stepKey: "runtime-appointment-review",
    kind: "suggestions",
    question: "Which appointment or scheduled outing affected this documentation block?",
    suggestions: ["Occurred this block", "Planned later", "Not relevant", "Other..."],
    allowCustom: true,
    optionalNarration: true,
    narrationField: "runtimeAppointmentNarration",
    rationale: "Today's appointments should shape the workflow path and final note timing details.",
  },
};

function buildLocalRemediationStep(targetStepKey, fieldContext = {}, workflowMeta = null) {
  const normalizedStepKey = targetStepKey === "checkpoint-hydration" ? "hydration" : targetStepKey;
  const template = RUNTIME_REMEDIATION_STEPS[normalizedStepKey];
  if (!template) {
    return null;
  }

  const intel = fieldContext.shiftIntelligence || workflowMeta?.shiftIntelligence || {};
  const contextualOptions =
    normalizedStepKey === "runtime-alert-review"
      ? [...(intel.alerts || []), "None of these"]
      : normalizedStepKey === "runtime-medication-review"
        ? intel.medicationsDue || []
        : normalizedStepKey === "runtime-goal-progress"
          ? intel.incompleteGoals || []
          : normalizedStepKey === "runtime-appointment-review"
            ? intel.appointments || []
            : [];

  return {
    ...template,
    contextualOptions,
    ...(normalizedStepKey === "runtime-alert-review"
      ? {
          contextOptions: intel.alerts || [],
        }
      : {}),
    ...(normalizedStepKey === "runtime-medication-review"
      ? {
          contextOptions: intel.medicationsDue || [],
        }
      : {}),
    ...(normalizedStepKey === "runtime-goal-progress"
      ? {
          suggestions: getGoalProgressSuggestionOptions(
            { suggestions: template.suggestions, contextualOptions },
            fieldContext,
            workflowMeta
          ),
          contextualOptions: [],
        }
      : {}),
  };
}

const GOAL_PROGRESS_SHORTCUTS = new Set([
  "None",
  "Other...",
  "Progress observed",
  "No progress this block",
  "Not addressed this block",
]);

function getGoalProgressSuggestionOptions(stepMeta = {}, fieldContext = {}, workflowMeta = null) {
  const intel = fieldContext.shiftIntelligence || workflowMeta?.shiftIntelligence || {};
  const goals = intel.incompleteGoals || [];
  const fromStep = Array.isArray(stepMeta.suggestions) ? stepMeta.suggestions : [];
  const fromContext = Array.isArray(stepMeta.contextualOptions) ? stepMeta.contextualOptions : [];
  const goalCandidates = goals.length
    ? goals
  : [...fromStep, ...fromContext].filter((item) => !GOAL_PROGRESS_SHORTCUTS.has(item));

  const uniqueGoals = [...new Set(goalCandidates.map((item) => String(item).trim()).filter(Boolean))].slice(0, 4);

  return [...uniqueGoals, "None", "Other..."];
}

function getRuntimeContextFieldName(stepKey = "") {
  return `${stepKey}Context`;
}

function getRuntimeContextOptions(stepMeta = {}) {
  return stepMeta.contextOptions || stepMeta.contextualOptions || [];
}

function getContextActionSelections(answers = {}, stepKey = "") {
  if (!stepKey) {
    return {};
  }

  const keys = [`${stepKey}Selections`, `${kebabToCamel(stepKey)}Selections`];
  for (const key of keys) {
    const value = answers[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value;
    }
  }

  return {};
}

function getSuggestionSelections(answers = {}, stepKey = "") {
  const value = answers[stepKey];
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string" && value) {
    return [value];
  }
  return [];
}

function isNoneLikeNarration(value = "") {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[.!]+$/g, "");

  if (!normalized) {
    return false;
  }

  return [
    "none",
    "n/a",
    "na",
    "not applicable",
    "not appicable",
    "no alert",
    "no alerts",
    "none of these",
  ].includes(normalized);
}

function canContinueRuntimeContextAction(answers = {}, stepMeta = {}, explicitStepKey = "") {
  const stepKey = explicitStepKey || stepMeta.stepKey || "";
  if (stepKey === "runtime-alert-review") {
    const selections = getContextActionSelections(answers, stepKey);
    const narrationField = stepMeta.narrationField || `${stepKey}Narration`;
    return (
      Object.keys(selections).length > 0 ||
      getWorkflowAnswer(answers, getRuntimeContextFieldName(stepKey)) === "None of these" ||
      isNoneLikeNarration(answers[narrationField])
    );
  }
  const contextOptions = getRuntimeContextOptions(stepMeta);
  const action = getWorkflowAnswer(answers, stepKey);
  if (!action) {
    return false;
  }
  if (/^not relevant$/i.test(String(action).trim())) {
    return true;
  }
  if (action === "Other..." && !String(answers[`${stepKey}Custom`] || "").trim()) {
    return false;
  }
  if (!contextOptions.length) {
    return true;
  }
  return Boolean(getWorkflowAnswer(answers, getRuntimeContextFieldName(stepKey)));
}

function renderWorkflowContextActionStep({
  stepMeta,
  stepKey,
  answers,
  onAnswer,
  styles,
  continueLabel = "Continue",
  hideContinueButton = false,
}) {
  const contextOptions = getRuntimeContextOptions(stepMeta);
  const contextField = getRuntimeContextFieldName(stepKey);
  const selectedContext = getWorkflowAnswer(answers, contextField);
  const selectedAction = getWorkflowAnswer(answers, stepKey);
  const contextSelections = getContextActionSelections(answers, stepKey);
  const contextRequired = contextOptions.length > 0 && !selectedContext;
  const narrationField = stepMeta.narrationField || `${stepKey}Narration`;
  const noneLikeNarration = isNoneLikeNarration(answers[narrationField]);

  if (stepKey === "runtime-alert-review") {
    return (
      <View style={styles.docuWraiteWorkflowSuggestionList}>
        {contextOptions.length ? (
          <>
            <Text style={styles.docuWraiteWorkflowContextActionLead}>
              {stepMeta.contextLabel || "Select the relevant item"}
            </Text>
            {contextOptions.map((item) => {
              const itemStatus = contextSelections[item];
              const isSelected = selectedContext === item;
              return (
                <Pressable
                  key={item}
                  style={[
                    styles.docuWraiteWorkflowSuggestion,
                    isSelected && styles.docuWraiteWorkflowSuggestionActive,
                  ]}
            onPress={() =>
              onAnswer(
                syncRemediationAnswerKeys(
                  {
                    [contextField]: item,
                    ...(item === "None of these"
                      ? {
                          [`${stepKey}Selections`]: {},
                          [stepKey]: "none",
                          [`${stepKey}Custom`]: "",
                        }
                      : {}),
                  },
                  stepKey
                ),
                { stepKey }
              )
                  }
                >
                  <Text
                    style={[
                      styles.docuWraiteWorkflowSuggestionText,
                      isSelected && styles.docuWraiteWorkflowSuggestionTextActive,
                    ]}
                  >
                    {itemStatus
                      ? `${isSelected ? "✓ " : ""}${item} — ${itemStatus}`
                      : `${isSelected ? "✓ " : ""}${item}`}
                  </Text>
                </Pressable>
              );
            })}
          </>
        ) : null}
        <Text style={styles.docuWraiteWorkflowContextActionLead}>
          {stepMeta.actionLabel || "How was it handled this block?"}
        </Text>
        {!selectedContext ? (
          <Text style={styles.docuWraiteWorkflowContextActionHint}>
            Choose an alert above, then assign its status.
          </Text>
        ) : null}
        {selectedContext === "None of these" ? (
          <Text style={styles.docuWraiteWorkflowContextActionHint}>
            No listed alert matched this block. You can continue or add optional narration below.
          </Text>
        ) : null}
        {!selectedContext && noneLikeNarration ? (
          <Text style={styles.docuWraiteWorkflowContextActionHint}>
            Your narration will be treated as no listed alert applying to this block.
          </Text>
        ) : null}
        {(stepMeta.suggestions || []).map((suggestion) => (
          (() => {
            const isSelected = selectedContext && contextSelections[selectedContext] === suggestion;
            return (
          <Pressable
            key={suggestion}
            style={[
              styles.docuWraiteWorkflowSuggestion,
              isSelected && styles.docuWraiteWorkflowSuggestionActive,
              !selectedContext || selectedContext === "None of these" ? styles.docuWraiteWorkflowSuggestionDisabled : null,
            ]}
            onPress={() => {
              if (!selectedContext || selectedContext === "None of these") {
                return;
              }

              const nextSelections = {
                ...contextSelections,
                [selectedContext]: suggestion,
              };

              onAnswer(
                syncRemediationAnswerKeys(
                  {
                    [stepKey]: "reviewed",
                    [`${stepKey}Selections`]: nextSelections,
                  },
                  stepKey
                ),
                { stepKey }
              );
            }}
          >
            <Text
              style={[
                styles.docuWraiteWorkflowSuggestionText,
                isSelected && styles.docuWraiteWorkflowSuggestionTextActive,
              ]}
            >
              {`${isSelected ? "✓ " : ""}${suggestion}`}
            </Text>
          </Pressable>
            );
          })()
        ))}
        {stepMeta.optionalNarration ? (
          <TextInput
            value={answers[narrationField] || ""}
            onChangeText={(entry) => onAnswer({ [narrationField]: entry })}
            placeholder="Add narration (optional)"
            placeholderTextColor="#888888"
            multiline
            style={[styles.docuWraiteWorkflowInput, styles.docuWraiteWorkflowNarrationInput]}
          />
        ) : null}
        {!hideContinueButton &&
        (Object.keys(contextSelections).length > 0 || selectedContext === "None of these" || noneLikeNarration) ? (
          <Pressable
            style={styles.docuWraiteWorkflowNext}
            onPress={() =>
              onAnswer(
                stepKey === "runtime-alert-review" &&
                  !selectedContext &&
                  Object.keys(contextSelections).length === 0 &&
                  noneLikeNarration
                  ? syncRemediationAnswerKeys(
                      {
                        [contextField]: "None of these",
                        [stepKey]: "none",
                        [`${stepKey}Selections`]: {},
                      },
                      stepKey
                    )
                  : {},
                { advance: true }
              )
            }
          >
            <Text style={styles.docuWraiteWorkflowNextText}>{continueLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.docuWraiteWorkflowSuggestionList}>
      {contextOptions.length ? (
        <>
          <Text style={styles.docuWraiteWorkflowContextActionLead}>
            {stepMeta.contextLabel || "Select the relevant item"}
          </Text>
          {contextOptions.map((item) => {
            const isSelected = selectedContext === item;
            return (
              <Pressable
                key={item}
                style={[
                  styles.docuWraiteWorkflowSuggestion,
                  isSelected && styles.docuWraiteWorkflowSuggestionActive,
                ]}
                onPress={() =>
                  onAnswer(
                    syncRemediationAnswerKeys(
                      {
                        [contextField]: item,
                      },
                      stepKey
                    ),
                    { stepKey }
                  )
                }
              >
                <Text
                  style={[
                    styles.docuWraiteWorkflowSuggestionText,
                    isSelected && styles.docuWraiteWorkflowSuggestionTextActive,
                  ]}
                >
                  {`${isSelected ? "✓ " : ""}${item}`}
                </Text>
              </Pressable>
            );
          })}
        </>
      ) : null}
      <Text style={styles.docuWraiteWorkflowContextActionLead}>
        {stepMeta.actionLabel || "How was it handled this block?"}
      </Text>
      {contextRequired ? (
        <Text style={styles.docuWraiteWorkflowContextActionHint}>
          Choose an alert or caution above first. Not relevant can be selected without one.
        </Text>
      ) : null}
      {(stepMeta.suggestions || []).map((suggestion) => {
        const isSelected = selectedAction === suggestion;
        return (
          <Pressable
            key={suggestion}
            style={[
              styles.docuWraiteWorkflowSuggestion,
              isSelected && styles.docuWraiteWorkflowSuggestionActive,
              contextRequired && suggestion !== "Not relevant" ? styles.docuWraiteWorkflowSuggestionDisabled : null,
            ]}
            onPress={() => {
              if (contextRequired && suggestion !== "Not relevant") {
                return;
              }

              const changes = {
                [stepKey]: suggestion,
                [`${stepKey}Custom`]: "",
              };
              if (suggestion === "Not relevant") {
                changes[contextField] = "";
              }

              onAnswer(syncRemediationAnswerKeys(changes, stepKey), { stepKey });
            }}
          >
            <Text
              style={[
                styles.docuWraiteWorkflowSuggestionText,
                isSelected && styles.docuWraiteWorkflowSuggestionTextActive,
              ]}
            >
              {`${isSelected ? "✓ " : ""}${suggestion}`}
            </Text>
          </Pressable>
        );
      })}
      {selectedAction === "Other..." || answers[`${stepKey}Custom`] ? (
        <TextInput
          value={answers[`${stepKey}Custom`] || ""}
          onChangeText={(entry) =>
            onAnswer(
              syncRemediationAnswerKeys(
                {
                  [`${stepKey}Custom`]: entry,
                  [stepKey]: "Other...",
                },
                stepKey
              ),
              { stepKey }
            )
          }
          placeholder="Type answer"
          placeholderTextColor="#888888"
          style={styles.docuWraiteWorkflowInput}
        />
      ) : null}
      {stepMeta.optionalNarration ? (
        <TextInput
          value={answers[stepMeta.narrationField || `${stepKey}Narration`] || ""}
          onChangeText={(entry) =>
            onAnswer(
              syncRemediationAnswerKeys({ [stepMeta.narrationField || `${stepKey}Narration`]: entry }, stepKey),
              { stepKey }
            )
          }
          placeholder="Add narration (optional)"
          placeholderTextColor="#888888"
          multiline
          style={[styles.docuWraiteWorkflowInput, styles.docuWraiteWorkflowNarrationInput]}
        />
      ) : null}
      {canContinueRuntimeContextAction(answers, stepMeta, stepKey) && !hideContinueButton ? (
        <Pressable style={styles.docuWraiteWorkflowNext} onPress={() => onAnswer({}, { advance: true })}>
          <Text style={styles.docuWraiteWorkflowNextText}>{continueLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function getWorkflowAnswer(answers = {}, stepKey = "") {
  if (!stepKey) {
    return undefined;
  }

  const keys = [stepKey, kebabToCamel(stepKey)];
  for (const key of keys) {
    const value = answers[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  for (const key of keys) {
    const customValue = answers[`${key}Custom`];
    if (customValue !== undefined && customValue !== null && String(customValue).trim()) {
      return String(customValue).trim();
    }
  }

  return undefined;
}

function appendStructuredWorkflowAnswers(existing = [], entry) {
  if (!entry?.stepKey) {
    return existing;
  }

  const next = existing.filter((item) => item.stepKey !== entry.stepKey);
  next.push(entry);
  return next;
}

function getReadinessIssueTarget(item) {
  const message = typeof item === "string" ? item : item?.message;
  if (!message) {
    return null;
  }

  if (typeof item === "object" && item?.targetStepKey) {
    return item.targetStepKey;
  }

  return READINESS_REMEDIATION_BY_MESSAGE[message] || null;
}

function collectReadinessIssues(stepMeta, workflowMeta) {
  const seen = new Set();
  const items = [];

  const pushItem = (item, variant) => {
    const message = typeof item === "string" ? item : item.message;
    const id = typeof item === "string" ? message : item.id;
    const targetStepKey = getReadinessIssueTarget(item);
    if (!message || seen.has(id)) {
      return;
    }

    seen.add(id);
    items.push({
      id,
      message,
      targetStepKey,
      variant,
    });
  };

  (stepMeta?.missingItems || workflowMeta?.missingSummary || []).forEach((item) => pushItem(item, "missing"));
  (stepMeta?.escalationAlerts || workflowMeta?.escalationAlerts || []).forEach((item) =>
    pushItem(item, "escalation")
  );

  return items;
}

function createDocumentationSession({
  title,
  program,
  sessionType = "isp",
  clientProfile = null,
  timeBlocksOverride = null,
  rowsOverride = null,
}) {
  const isCaseNote = sessionType === "case-note";
  const timeBlocks = timeBlocksOverride || clientProfile?.documentationTimeBlocks || documentationTimeBlocks;
  const rows = rowsOverride || (clientProfile
    ? (isCaseNote ? buildCaseNoteDocumentationItems(clientProfile) : buildMeasurableDocumentationItems(clientProfile))
    : isCaseNote
      ? getCaseNoteDocumentationItems()
      : getMeasurableDocumentationItems());

  return {
    title,
    program,
    sessionType,
    serviceDate: "05/14/2026",
    statusMessage: "",
    validationWarnings: [],
    lastDraftSavedAt: "",
    shiftSummary: "",
    caseNoteAttestationComplete: false,
    caseNoteAttestation: null,
    review: {
      reviewedBy: "",
      signStatus: "Awaiting DSP Signature",
      qaStatus: "Pending QA Review",
      validationTimestamp: "",
    },
    handover: {
      required: false,
      submitted: false,
      additionalNotes: "",
      vitalSigns: handoverVitalFields.reduce(
        (accumulator, field) => ({
          ...accumulator,
          [field.key]: false,
        }),
        {}
      ),
      vitalValues: handoverVitalFields.reduce(
        (accumulator, field) => ({
          ...accumulator,
          [field.key]: "",
        }),
        {}
      ),
      otherVitals: "",
      generatedAt: "",
    },
    rows: rows.map((item) => ({
      ...item,
      score: "",
      comment: "",
    })),
    timeBlocks: timeBlocks.map(createTimeBlockEntry),
  };
}

function buildValidationWarnings(session) {
  const warnings = [];

  session.rows.forEach((row) => {
    if (row.score && row.comment.trim().length < 25) {
      warnings.push(`Comment too short for ${row.source}.`);
    }
    if (row.score && !row.comment.trim()) {
      warnings.push("Missing intervention comment for a scored entry.");
    }
    if (/behavior/i.test(row.comment) && !/outcome|response/i.test(row.comment)) {
      warnings.push("Behavior documented without outcome or observed response in one entry.");
    }
  });

  session.timeBlocks.forEach((block) => {
    if (block.score && block.comment.trim().length < 25) {
      warnings.push(`Comment too short for ${block.label}.`);
    }
    if (block.comment.trim() && !block.score) {
      warnings.push(`Missing prompt level for ${block.label}.`);
    }
  });

  if (!session.shiftSummary.trim()) {
    warnings.push(
      session.sessionType === "case-note"
        ? "Final case note is required before submission."
        : "End of shift summary is required before submission."
    );
  }

  return warnings;
}

function escapeHtml(value = "") {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function openHandoverNoteInBrowser({ session, patientName, loggedInStaff }) {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return false;
  }

  const finalNote = String(session.shiftSummary || "").trim() || "No final shift note entered.";
  const additionalNotes = String(session.handover?.additionalNotes || "").trim() || "No additional handover notes entered.";
  const selectedVitals = handoverVitalFields.filter((field) => session.handover?.vitalSigns?.[field.key]);
  const vitalValues = session.handover?.vitalValues || {};
  const vitalMarkup = handoverVitalFields
    .map(
      (field) =>
        `<li>${session.handover?.vitalSigns?.[field.key] ? "☑" : "☐"} ${escapeHtml(field.label)}${
          vitalValues[field.key] ? `: ${escapeHtml(vitalValues[field.key])}` : ""
        }</li>`
    )
    .join("");
  const otherVitals = String(session.handover?.otherVitals || "").trim();

  const printWindow = window.open("", "_blank", "width=900,height=1200");
  if (!printWindow) {
    return false;
  }

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>DocuWraite Handover Note</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 32px; color: #231942; }
      h1 { margin: 0 0 8px; color: #5b3db6; }
      h2 { margin: 24px 0 8px; color: #5c3d99; font-size: 18px; }
      p, li { font-size: 14px; line-height: 1.6; }
      .meta { margin-bottom: 20px; }
      .meta p { margin: 2px 0; }
      .panel { border: 1px solid #d4c2f1; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: #faf7ff; }
      ul { margin: 8px 0 0 18px; padding: 0; }
    </style>
  </head>
  <body>
    <h1>DocuWraite Handover Note</h1>
    <div class="meta">
      <p><strong>Individual:</strong> ${escapeHtml(patientName)}</p>
      <p><strong>Program:</strong> ${escapeHtml(session.program)}</p>
      <p><strong>Service Date:</strong> ${escapeHtml(session.serviceDate)}</p>
      <p><strong>Entered By:</strong> ${escapeHtml(loggedInStaff)}</p>
      <p><strong>Generated:</strong> ${escapeHtml(session.handover?.generatedAt || session.review?.validationTimestamp || "")}</p>
    </div>
    <div class="panel">
      <h2>Shift Summary</h2>
      <p>${escapeHtml(finalNote).replace(/\n/g, "<br />")}</p>
    </div>
    <div class="panel">
      <h2>Additional Handover Notes</h2>
      <p>${escapeHtml(additionalNotes).replace(/\n/g, "<br />")}</p>
    </div>
    <div class="panel">
      <h2>Vital Signs Reviewed</h2>
      <ul>${vitalMarkup}</ul>
      <p><strong>Selected:</strong> ${escapeHtml(selectedVitals.map((field) => field.label).join(", ") || "None selected")}</p>
      ${otherVitals ? `<p><strong>Other vitals:</strong> ${escapeHtml(otherVitals).replace(/\n/g, "<br />")}</p>` : ""}
    </div>
  </body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  return true;
}

const DOCUWRAITE_PAUSE_MS = 2500;

const docuWraiteWorkflowKeywords = {
  outing: ["community", "outing", "church", "park", "mall", "transportation", "wheelchair", "shopping"],
  meal: ["meal", "lunch", "dinner", "breakfast", "fluid", "eating", "swallow", "aspiration", "snack"],
  hygiene: ["shower", "hygiene", "toileting", "adl", "dressing", "oral hygiene", "brief", "bath"],
  medication: ["medication", "mar", "oxygen", "prn", "pill", "dose", "med"],
  behavior: ["behavior", "redirection", "elopement", "aggression", "self-injury", "incident", "meltdown"],
  communication: ["hearing", "hearing aid", "communication", "repeat-back", "cueing", "verbalized"],
};

function normalizeDocuWraiteText(value) {
  return value.trim().toLowerCase();
}

function detectDocuWraiteWorkflowTheme(value) {
  const text = normalizeDocuWraiteText(value);
  return (
    Object.entries(docuWraiteWorkflowKeywords).find(([, keywords]) =>
      keywords.some((keyword) => text.includes(keyword))
    )?.[0] ?? null
  );
}

function scoreDocuWraiteConfidence(value) {
  const text = normalizeDocuWraiteText(value);
  if (!text) {
    return { confidence: 0, reasons: ["empty"] };
  }

  let confidence = 100;
  const reasons = [];

  if (text.length < 25) {
    confidence -= 35;
    reasons.push("short");
  }
  if (text.split(/\s+/).length < 8) {
    confidence -= 20;
    reasons.push("thin-detail");
  }
  if (/\b(fine|ok|good|normal|did well|no issues)\b/i.test(text) && !/observed response|staff support|prompt level/i.test(text)) {
    confidence -= 25;
    reasons.push("vague");
  }
  if (/behavior/i.test(text) && !/response|outcome|intervention/i.test(text)) {
    confidence -= 30;
    reasons.push("behavior-incomplete");
  }

  return { confidence: Math.max(0, confidence), reasons };
}

function getDocuWraiteCarePlanGap(theme, value) {
  const text = normalizeDocuWraiteText(value);
  if (!text || !theme) {
    return null;
  }

  if (theme === "meal" && !/aspiration|pacing|swallow|fluid|gerd|bite|meal plan/i.test(text)) {
    return "Add aspiration precautions, meal pacing, and fluid intake from Mary Bet's care plan.";
  }
  if (theme === "outing" && !/staff support|wheelchair|fatigue|return home|supervision|hearing/i.test(text)) {
    return "Add community supervision, transition support, and return-home planning from the care plan.";
  }
  if (theme === "hygiene" && !/prompt level|assist|supervision|safety|transfer/i.test(text)) {
    return "Document prompt level, assistance rendered, and safety supports for ADL routines.";
  }
  if (theme === "medication" && !/oxygen|administer|reminder|observed response|time/i.test(text)) {
    return "Document medication or oxygen support, timing, and observed response.";
  }
  if (theme === "behavior" && !/intervention|response|outcome|redirection|de-escalation/i.test(text)) {
    return "Document the intervention used and the observed behavioral response.";
  }

  return null;
}

function getDocuWraiteCarePlanConflict(theme, value) {
  const text = normalizeDocuWraiteText(value);
  if (!text || !theme) {
    return null;
  }

  if (theme === "meal" && /independent|no support needed|ate quickly/i.test(text)) {
    return "This meal note may conflict with aspiration and meal-pacing supports in the care plan.";
  }
  if (theme === "outing" && /independent in community|no staff support/i.test(text)) {
    return "Community participation still requires documented staff support and supervision.";
  }
  if (theme === "hygiene" && /independent shower|no assist/i.test(text)) {
    return "Hygiene documentation should reflect the total-assist and safety supports in the care plan.";
  }

  return null;
}

function getDocuWraiteSuggestion(theme, value, source) {
  if (/risk/i.test(source || "")) {
    return "Staff support rendered with risk-informed supervision. Observed response documented and escalation plan noted if needed.";
  }

  if (theme === "meal") {
    return quickPhraseSnippets.meal;
  }
  if (theme === "outing") {
    return quickPhraseSnippets.community;
  }
  if (theme === "behavior") {
    return quickPhraseSnippets.behavior;
  }
  if (theme === "hygiene") {
    return "ADL support provided with verbal and physical prompts. Prompt level documented and observed response recorded.";
  }
  if (theme === "medication") {
    return "Medication or oxygen support provided per care plan. Time, support rendered, and observed response documented.";
  }

  return "Staff support rendered with prompt level documented. Observed response recorded for supervisor review.";
}

function resolveDocuWraiteAssist({
  fieldId,
  fieldKind,
  value,
  score,
  description,
  source,
  session,
  trigger,
  clientProfile = null,
}) {
  const text = value?.trim() || "";
  const candidates = [];
  const workflowId = detectDocuWraiteGuidedWorkflow({ description, source }, text, clientProfile);

  if (
    workflowId &&
    (trigger === "focus" || trigger === "workflow" || (trigger === "typing-pause" && text.length < 24))
  ) {
    candidates.push({
      priority: trigger === "focus" ? 100 : 91,
      id: `workflow-${workflowId}`,
      mode: "workflow",
      workflowId,
      title: getWorkflowEyebrow(workflowId),
      message: "DocuWraite will guide this note with care-plan questions.",
      trigger,
    });
  }

  if ((fieldKind === "row" || fieldKind === "time") && text && !score) {
    candidates.push({
      priority: 96,
      id: "compliance-score",
      title: "Support level missing",
      message: "This entry has narrative text but no score or prompt level selected.",
      suggestion: text,
      trigger,
    });
  }

  if ((fieldKind === "row" || fieldKind === "time") && score && !text) {
    candidates.push({
      priority: 95,
      id: "compliance-comment",
      title: "Intervention comment missing",
      message: "Add what staff did and how Mary Bet responded for this scored entry.",
      suggestion: getDocuWraiteSuggestion(detectDocuWraiteWorkflowTheme(description || ""), text, source),
      trigger,
    });
  }

  if (fieldKind === "summary" && !text && (trigger === "validate" || trigger === "submit")) {
    candidates.push({
      priority: 98,
      id: "compliance-summary",
      title: "End-of-shift summary required",
      message: "Document mood, incidents, health concerns, goal progress, and handoff before review.",
      suggestion: quickPhraseSnippets.handoff,
      trigger,
    });
  }

  if (trigger === "focus" && text.length < 8) {
    candidates.push({
      priority: 74,
      id: "focus-start",
      title: "Ready to start this note?",
      message: "DocuWraite can help you open with compliant care-plan wording for this entry.",
      suggestion: getDocuWraiteSuggestion(
        detectDocuWraiteWorkflowTheme(description || source || ""),
        text,
        source
      ),
      trigger,
    });
  }

  if (text) {
    const { confidence } = scoreDocuWraiteConfidence(text);
    if (confidence < 55) {
      candidates.push({
        priority: 84,
        id: "low-confidence",
        title: "Note confidence is low",
        message: "This note is thin or vague. DocuWraite can strengthen it with care-plan language.",
        suggestion: getDocuWraiteSuggestion(detectDocuWraiteWorkflowTheme(text), text, source),
        trigger,
      });
    }

    if (/behavior/i.test(text) && !/response|outcome|intervention/i.test(text)) {
      candidates.push({
        priority: 92,
        id: "behavior-incomplete",
        title: "Behavior note incomplete",
        message: "Add the intervention used and the observed behavioral response.",
        suggestion: quickPhraseSnippets.behavior,
        trigger,
      });
    }

    const theme = detectDocuWraiteWorkflowTheme(text);
    const carePlanGap = getDocuWraiteCarePlanGap(theme, text);
    if (carePlanGap) {
      candidates.push({
        priority: 88,
        id: `care-plan-gap-${theme}`,
        title: "Care-plan detail missing",
        message: carePlanGap,
        suggestion: getDocuWraiteSuggestion(theme, text, source),
        trigger,
        theme,
      });
    }

    const carePlanConflict = getDocuWraiteCarePlanConflict(theme, text);
    if (carePlanConflict) {
      candidates.push({
        priority: 93,
        id: `care-plan-conflict-${theme}`,
        title: "Possible care-plan conflict",
        message: carePlanConflict,
        suggestion: getDocuWraiteSuggestion(theme, text, source),
        trigger,
        theme,
      });
    }

    if (/\b(fall|incident|injury|elopement|aggression|choking|aspiration event)\b/i.test(text)) {
      candidates.push({
        priority: 97,
        id: "high-risk-event",
        title: "High-risk event language detected",
        message: "Capture immediate response, risk supports used, observed outcome, and whether escalation is required.",
        suggestion:
          "High-risk event observed. Staff support rendered immediately, risk plan followed, observed response documented, and supervisor notified as required.",
        trigger,
        theme: theme || "behavior",
      });
    }

    if (trigger === "typing-pause" && text.length >= 8) {
      candidates.push({
        priority: 72,
        id: "typing-pause",
        title: "Need help finishing this note?",
        message: "DocuWraite can add care-plan wording while you keep writing.",
        suggestion: getDocuWraiteSuggestion(detectDocuWraiteWorkflowTheme(text), text, source),
        trigger,
        theme: detectDocuWraiteWorkflowTheme(text),
      });
    }

    if (trigger === "sentence-end" && text.length >= 20) {
      candidates.push({
        priority: 78,
        id: "sentence-end",
        title: "Strengthen this paragraph",
        message: "This section can be tightened with prompt level, staff support, and observed response.",
        suggestion: getDocuWraiteSuggestion(detectDocuWraiteWorkflowTheme(text), text, source),
        trigger,
        theme: detectDocuWraiteWorkflowTheme(text),
      });
    }

    if (trigger === "workflow" && theme) {
      candidates.push({
        priority: 86,
        id: `workflow-${theme}`,
        title: `${theme[0].toUpperCase()}${theme.slice(1)} workflow detected`,
        message: "DocuWraite can align this note with the active care-plan workflow.",
        suggestion: getDocuWraiteSuggestion(theme, text, source),
        trigger,
        theme,
      });
    }
  }

  if (trigger === "validate" || trigger === "submit") {
    buildValidationWarnings(session).forEach((warning, index) => {
      candidates.push({
        priority: 99 - index,
        id: `validation-${index}`,
        title: trigger === "submit" ? "Before submission" : "Before review",
        message: warning,
        suggestion: quickPhraseSnippets.handoff,
        trigger,
      });
    });
  }

  candidates.sort((left, right) => right.priority - left.priority);
  const top = candidates[0];
  if (!top) {
    return null;
  }

  return { fieldId, ...top };
}

const communityOutingWhyItMatters = [
  "community integration",
  "social engagement",
  "hydration monitoring",
  "fall prevention",
];

const communityOutingLocationSuggestions = ["Park", "Grocery Store", "Café", "Church", "Other..."];

const communityOutingResponseSuggestions = [
  "Calm and engaged",
  "Socially interactive",
  "Required verbal cueing",
  "Needed redirection",
  "Became fatigued",
];

function detectDocuWraiteGuidedWorkflow(fieldContext, value, clientProfile = null) {
  if (fieldContext.assignedWorkflowSteps?.length) {
    return "assigned-nodes";
  }

  if (fieldContext.workflowId) {
    return fieldContext.workflowId;
  }

  if (fieldContext.fieldKind === "time" && fieldContext.label) {
    return getTimeBlockWorkflowId(fieldContext.label, clientProfile);
  }

  const haystack = `${fieldContext.description || ""} ${fieldContext.source || ""} ${value || ""}`.toLowerCase();
  const theme =
    detectDocuWraiteWorkflowTheme(value) ||
    detectDocuWraiteWorkflowTheme(fieldContext.description || "") ||
    fieldContext.theme;

  if (
    theme === "outing" ||
    /community integration|community outing|community participation|church|park|mall outing/.test(haystack)
  ) {
    return "community-outing";
  }
  if (theme === "meal" || /aspiration|meal pacing|fluid intake/.test(haystack)) {
    return "feeding-support";
  }
  if (theme === "hygiene") {
    return "morning-adl";
  }
  if (theme === "behavior") {
    return "behavior-support";
  }
  if (theme === "medication") {
    return "medication-support";
  }
  if (theme === "communication") {
    return "communication-support";
  }

  return null;
}

function getCommunityOutingSteps(answers) {
  const steps = ["attended"];
  if (!answers.attended) {
    return steps;
  }
  if (answers.attended === "no") {
    return [...steps, "decline"];
  }
  return [...steps, "location", "response", "mobility", "hydration", "why", "draft"];
}

function getCommunityOutingStepMeta(stepKey) {
  switch (stepKey) {
    case "attended":
      return {
        question: `Did ${patientDisplayName} attend a community outing?`,
        kind: "yes-no",
      };
    case "location":
      return {
        question: "Where did the outing occur?",
        kind: "suggestions",
        suggestions: communityOutingLocationSuggestions,
        allowCustom: true,
      };
    case "response":
      return {
        question: `How did ${patientDisplayName} respond during the outing?`,
        kind: "suggestions",
        suggestions: communityOutingResponseSuggestions,
        allowCustom: true,
      };
    case "mobility":
      return {
        question: "Was mobility support provided?",
        kind: "yes-no",
        rationale: "Care plan includes fall prevention and supervised ambulation.",
      };
    case "hydration":
      return {
        question: "Was hydration offered/monitored?",
        kind: "yes-no",
        rationale: "Care plan includes hydration monitoring during community participation.",
      };
    case "why":
      return {
        question: "Why this matters",
        kind: "why",
      };
    case "draft":
      return {
        question: "Generated documentation",
        kind: "draft",
      };
    case "decline":
      return {
        question: "Document no outing",
        kind: "draft",
      };
    default:
      return null;
  }
}

function generateCommunityOutingNote(answers) {
  let note = "";

  if (answers.attended === "no") {
    note = `${patientDisplayName} did not attend a community outing during this shift. Staff remained available for community participation supports as outlined in the care plan.`;
  } else {
    const location = answers.locationCustom || answers.location || "the community";
    const response = (answers.responseCustom || answers.response || "calm and engaged").toLowerCase();
    const mobility =
      answers.mobility === "yes"
        ? "Verbal cueing and mobility supervision were provided as needed during transitions and ambulation."
        : "Routine supervision was maintained without additional mobility support beyond the care plan.";
    const hydration =
      answers.hydration === "yes"
        ? "Hydration was offered and tolerated without issue."
        : "Hydration was monitored and no additional fluid support was required during the outing.";

    note = `${patientDisplayName} participated in a supervised community outing to ${location.toLowerCase()} during the shift. She appeared ${response} throughout the activity. ${mobility} ${hydration}`;
  }

  if (answers.extraNotes?.trim()) {
    note = `${note} Additional notes: ${answers.extraNotes.trim()}`;
  }

  return note;
}

function markDraftSaved(session) {
  return {
    ...session,
    lastDraftSavedAt: "05/14/2026 1:05 AM",
  };
}

const documentChecklist = [
  "Advance Directive",
  "Behavior Support Plan",
  "Communication Chart",
  "Comprehensive Needs Assessment",
  "Conservatorship Documentation",
  "Crisis Plan",
  "Dental Plan of Care",
  "Doctors Orders / Treatment Plans",
  "Medication List",
  "Safety Risk Determination",
  "Signature Sheet",
  "Therapy Treatment Plan / Plan of Care",
];

const documentFiles = [
  "Mary.Bet.Phagan.3621.conservatorshippapers.06.30.2021.pdf",
  "Mary.Bet.Phagan.3621.IDFAttachment.02.27.2024.pdf",
  "Mary.Bet.Phagan.3621.LON.10.30.2025.pdf",
  "Mary.Bet.Phagan.3621.SignatureSheet.11.18.2025.pdf",
  "Mary.Bet.Phagan.3621.PSD.10.30.2025.pdf",
  "Mary.Bet.Phagan.3621.RiskTool.10.30.2025.pdf",
  "Mary.Bet.Phagan.3621.InformedChoice.11.18.2025.pdf",
  "Mary.Bet.Phagan.3621.SpeechPOC.12.2025.pdf",
];

const participants = [
  { name: "Elena Vargas", relationship: "Guardian", copy: "Yes" },
  { name: "Priya Malhotra", relationship: "Speech Language Pathologist", copy: "Yes" },
  { name: "Daniel Brooks", relationship: "DSP / Kharis", copy: "Yes" },
  { name: "Chloe Nguyen", relationship: "QA / Kharis", copy: "Yes" },
  { name: "Marcus Holloway", relationship: "ISC / BGC, Inc.", copy: "Yes" },
  { name: "Callie Stevens", relationship: "Program Coordinator", copy: "Yes" },
  { name: "Reese Dalton", relationship: "Kharis", copy: "Yes" },
];

const signatureLogs = [
  "Acknowledgement Report available in source file",
  "Signature Sheet referenced in attachments",
  "Participants marked to receive plan copies",
];

function DocumentationDropdown({
  value,
  options,
  placeholder,
  onChange,
  dropdownId,
  activeDropdown,
  onToggleDropdown,
}) {
  const isOpen = activeDropdown === dropdownId;

  return (
    <View style={styles.docDropdownWrap}>
      <Pressable style={styles.docDropdown} onPress={() => onToggleDropdown(dropdownId)}>
        <Text style={value ? styles.docDropdownValue : styles.docDropdownPlaceholder}>
          {value || placeholder}
        </Text>
        <Feather name="chevron-down" size={14} color="#666666" />
      </Pressable>
      {isOpen ? (
        <View style={styles.docDropdownMenu}>
          {options.map((option) => (
            <Pressable
              key={option}
              style={styles.docDropdownOptionPressable}
              onPress={() => {
                onChange(option);
                onToggleDropdown(null);
              }}
            >
              <Text style={styles.docDropdownOption}>{option}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function DecisionDropdown({
  value,
  options,
  placeholder,
  dropdownId,
  activeDropdown,
  onToggleDropdown,
  onChange,
  fieldStyle,
}) {
  const anchorRef = useRef(null);
  const [anchorRect, setAnchorRect] = useState(null);
  const isOpen = activeDropdown === dropdownId;

  const closeDropdown = useCallback(() => {
    onToggleDropdown(null);
  }, [onToggleDropdown]);

  const openDropdown = useCallback(() => {
    onToggleDropdown(dropdownId);
  }, [dropdownId, onToggleDropdown]);

  useEffect(() => {
    if (!isOpen) {
      setAnchorRect(null);
      return undefined;
    }

    const measureAnchor = () => {
      anchorRef.current?.measureInWindow((x, y, width, height) => {
        setAnchorRect({ x, y, width, height });
      });
    };

    const frame = requestAnimationFrame(measureAnchor);
    return () => cancelAnimationFrame(frame);
  }, [isOpen, options.length]);

  const renderMenuOptions = () =>
    options.map((option, index) => (
      <Pressable
        key={option.value}
        style={[
          styles.decisionDropdownOptionPressable,
          index === options.length - 1 && styles.decisionDropdownOptionPressableLast,
        ]}
        onPress={() => {
          onChange(option.value);
          closeDropdown();
        }}
      >
        <Text style={styles.decisionDropdownOptionLabel}>{option.label}</Text>
        {option.meta ? <Text style={styles.decisionDropdownOptionMeta}>{option.meta}</Text> : null}
      </Pressable>
    ));

  return (
    <>
      <View
        ref={anchorRef}
        collapsable={false}
        style={[
          styles.decisionDropdownWrap,
          fieldStyle,
          isOpen && styles.decisionDropdownWrapOpen,
        ]}
      >
        <Pressable style={styles.decisionDropdown} onPress={() => (isOpen ? closeDropdown() : openDropdown())}>
          <Text
            style={value ? styles.decisionDropdownValue : styles.decisionDropdownPlaceholder}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {value || placeholder}
          </Text>
          <Feather name="chevron-down" size={14} color="#6f5a9f" />
        </Pressable>
      </View>

      {isOpen && anchorRect ? (
        <Modal transparent visible animationType="none" onRequestClose={closeDropdown}>
          <View style={styles.decisionDropdownModalRoot}>
            <Pressable style={styles.decisionDropdownBackdrop} onPress={closeDropdown} />
            <View
              style={[
                styles.decisionDropdownMenuPortal,
                {
                  top: anchorRect.y + anchorRect.height + 4,
                  left: anchorRect.x,
                  width: anchorRect.width,
                },
              ]}
            >
              <ScrollView nestedScrollEnabled style={styles.decisionDropdownMenuScroll}>
                {renderMenuOptions()}
              </ScrollView>
            </View>
          </View>
        </Modal>
      ) : null}
    </>
  );
}

function DocuWraiteBubbleGlyph() {
  return (
    <View style={styles.docuWraiteBubbleOuter}>
      <View style={styles.docuWraiteBubbleBody}>
        <View style={styles.docuWraiteBubbleSparkleRow}>
          <Text style={[styles.docuWraiteSparkle, styles.docuWraiteSparkleSmall]}>✦</Text>
          <Text style={styles.docuWraiteSparkle}>✦</Text>
          <Text style={[styles.docuWraiteSparkle, styles.docuWraiteSparkleTiny]}>✦</Text>
        </View>
        <View style={styles.docuWraiteBubbleDots}>
          <View style={styles.docuWraiteDot} />
          <View style={styles.docuWraiteDot} />
          <View style={styles.docuWraiteDot} />
        </View>
      </View>
      <View style={styles.docuWraiteBubbleTail} />
    </View>
  );
}

function DocuWraiteGuidedWorkflowPanel({
  workflowId,
  workflowState,
  onAnswer,
  onBack,
  onJumpToStep,
  onInsert,
  onDismiss,
}) {
  const [activeReadinessRemediationKey, setActiveReadinessRemediationKey] = useState(null);
  const workflowEyebrow = getWorkflowEyebrow(workflowId);
  const answers = workflowState?.answers || {};
  const useAiWorkflow = workflowState?.ai?.enabled && !docuWraiteUseRuleBasedFallback;
  const useAssignedNodeWorkflow =
    !useAiWorkflow && workflowId === "assigned-nodes" && (workflowState?.localSteps || []).length > 0;
  const assignedNodeSteps = workflowState?.localSteps || [];
  const ruleSteps = workflowId === "community-outing" ? getCommunityOutingSteps(answers) : [];
  const stepIndex = workflowState?.stepIndex ?? 0;
  const ruleStepKey = ruleSteps[stepIndex];
  const upcomingRuleStepKey = ruleSteps[Math.min(stepIndex, Math.max(ruleSteps.length - 1, 0))];
  const ruleStepMeta = ruleStepKey ? getCommunityOutingStepMeta(ruleStepKey) : null;
  const localStepMeta = useAssignedNodeWorkflow ? assignedNodeSteps[stepIndex] : null;
  const aiStep = useAiWorkflow ? workflowState.ai.step : null;
  const workflowMeta = useAiWorkflow ? workflowState?.ai?.meta : null;
  const aiLoading = useAiWorkflow ? workflowState?.ai?.loading : false;
  const aiError = useAiWorkflow ? workflowState?.ai?.error : "";
  const stepMeta = useAiWorkflow ? aiStep : useAssignedNodeWorkflow ? localStepMeta : ruleStepMeta;
  const stepKey = useAiWorkflow
    ? aiStep?.stepKey || `step-${stepIndex}`
    : useAssignedNodeWorkflow
      ? localStepMeta?.stepKey || `assigned-step-${stepIndex}`
      : ruleStepKey;
  const upcomingStepKey = aiStep?.stepKey || upcomingRuleStepKey;
  const draftBlocked = Boolean(stepMeta?.draftBlocked || workflowMeta?.draftBlocked);
  const generatedNote = useAiWorkflow
    ? aiStep?.draftNote || ""
    : useAssignedNodeWorkflow
      ? generateAssignedWorkflowNote(answers, workflowState, workflowState?.fieldContext || {})
    : workflowId === "community-outing"
      ? generateCommunityOutingNote(answers)
      : "";
  const whyItems =
    aiStep?.whyItems?.length > 0 ? aiStep.whyItems : communityOutingWhyItMatters;
  const readinessIssues = stepMeta?.kind === "readiness" ? collectReadinessIssues(stepMeta, workflowMeta) : [];
  const progressLabel =
    stepMeta?.kind === "draft" || stepMeta?.kind === "why" || stepMeta?.kind === "readiness" || stepMeta?.kind === "affirm"
      ? null
      : stepMeta?.softCheck && /^dsp-understanding-/.test(stepKey || "")
        ? `Quick check ${stepKey.replace("dsp-understanding-", "")} of 3`
      : useAiWorkflow
        ? `Question ${stepIndex + 1}`
        : useAssignedNodeWorkflow
          ? `Assigned question ${Math.min(stepIndex + 1, assignedNodeSteps.length)} of ${assignedNodeSteps.length}`
        : `Question ${Math.min(stepIndex + 1, Math.max(ruleSteps.length, stepIndex + 1))}`;
  const reviewDraftNote = answers.finalDraftNote || generatedNote;
  const narrationValue = answers[stepMeta?.narrationField || `${stepKey}Narration`] || "";
  const canGoBack =
    stepIndex > 0 || Boolean(workflowState?.remediationStepKey || workflowState?.forcedStepKey);

  useEffect(() => {
    if (stepMeta?.kind !== "readiness") {
      setActiveReadinessRemediationKey(null);
    }
  }, [stepMeta?.kind, stepMeta?.stepKey]);

  if (useAiWorkflow && aiLoading && !stepMeta) {
    return (
      <View style={styles.docuWraiteWorkflowCard}>
        <Text style={styles.docuWraiteWorkflowEyebrow}>{workflowEyebrow}</Text>
        <View style={styles.docuWraiteWorkflowLoadingRow}>
          <ActivityIndicator size="small" color="#7c3aed" />
          <Text style={styles.docuWraiteWorkflowLoading}>
            Generating note...
          </Text>
        </View>
      </View>
    );
  }

  if (useAiWorkflow && !stepMeta && !aiLoading) {
    return (
      <View style={styles.docuWraiteWorkflowCard}>
        <Text style={styles.docuWraiteWorkflowEyebrow}>{workflowEyebrow}</Text>
        <Text style={styles.docuWraiteWorkflowAiNotice}>
          {aiError || "DocuWraite could not load the next AI question. Check that the API server is running."}
        </Text>
        <View style={styles.docuWraiteWorkflowFooter}>
          <View />
          <Pressable onPress={onDismiss}>
            <Text style={styles.docuWraiteWorkflowDismiss}>Dismiss</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!stepMeta) {
    return null;
  }

  const suggestionOptions =
    stepKey === "runtime-goal-progress"
      ? getGoalProgressSuggestionOptions(stepMeta, workflowState?.fieldContext || {}, workflowMeta)
      : stepMeta.suggestions || [];
  const multiSelect = Boolean(stepMeta.multiSelect);
  const selectedSuggestions = getSuggestionSelections(answers, stepKey);
  const hasSelectedOther = selectedSuggestions.includes("Other...");
  const suggestionList = (
    <View style={styles.docuWraiteWorkflowSuggestionList}>
      {suggestionOptions.map((suggestion) => (
        (() => {
          const isSelected = multiSelect ? selectedSuggestions.includes(suggestion) : answers[stepKey] === suggestion;

          return (
            <Pressable
              key={suggestion}
              style={[
                styles.docuWraiteWorkflowSuggestion,
                isSelected && styles.docuWraiteWorkflowSuggestionActive,
              ]}
              onPress={() => {
                if (multiSelect) {
                  const nextSelections = isSelected
                    ? selectedSuggestions.filter((item) => item !== suggestion)
                    : [...selectedSuggestions, suggestion];
                  onAnswer({
                    [stepKey]: nextSelections,
                    [`${stepKey}Custom`]: nextSelections.includes("Other...") ? answers[`${stepKey}Custom`] || "" : "",
                  });
                  return;
                }

                if (suggestion === "Other...") {
                  onAnswer({ [stepKey]: "Other...", [`${stepKey}Custom`]: answers[`${stepKey}Custom`] || "" });
                } else {
                  onAnswer(
                    {
                      [stepKey]: suggestion,
                      [`${stepKey}Custom`]: "",
                    },
                    stepMeta.manualContinue
                      ? {}
                      : stepMeta.advanceOnSelect || !stepMeta.optionalNarration
                        ? { advance: true }
                        : {}
                  );
                }
              }}
            >
              <Text
                style={[
                  styles.docuWraiteWorkflowSuggestionText,
                  isSelected && styles.docuWraiteWorkflowSuggestionTextActive,
                ]}
              >
                {`${isSelected ? "✓ " : ""}${suggestion}`}
              </Text>
            </Pressable>
          );
        })()
      ))}
      {(hasSelectedOther || (!multiSelect && answers[stepKey] === "Other...") || answers[`${stepKey}Custom`]) ? (
        <TextInput
          value={answers[`${stepKey}Custom`] || ""}
          onChangeText={(entry) =>
            onAnswer({
              [`${stepKey}Custom`]: entry,
              [stepKey]: multiSelect ? selectedSuggestions : "Other...",
            })
          }
          placeholder="Type answer"
          placeholderTextColor="#888888"
          style={styles.docuWraiteWorkflowInput}
        />
      ) : null}
      {stepKey !== "runtime-goal-progress" && stepMeta.contextualOptions?.length ? (
        <View style={styles.docuWraiteWorkflowContextBox}>
          {stepMeta.contextualOptions.map((item) => (
            <Text key={item} style={styles.docuWraiteWorkflowContextItem}>{`• ${item}`}</Text>
          ))}
        </View>
      ) : null}
      {stepMeta.optionalNarration ? (
        <TextInput
          value={answers[stepMeta.narrationField || `${stepKey}Narration`] || ""}
          onChangeText={(entry) => onAnswer({ [stepMeta.narrationField || `${stepKey}Narration`]: entry })}
          placeholder="Add narration (optional)"
          placeholderTextColor="#888888"
          multiline
          style={[styles.docuWraiteWorkflowInput, styles.docuWraiteWorkflowNarrationInput]}
        />
      ) : null}
      {!multiSelect && answers[stepKey] === "Other..." && answers[`${stepKey}Custom`]?.trim() ? (
        <Pressable style={styles.docuWraiteWorkflowNext} onPress={() => onAnswer({}, { advance: true })}>
          <Text style={styles.docuWraiteWorkflowNextText}>Continue</Text>
        </Pressable>
      ) : null}
      {!multiSelect &&
      stepMeta.manualContinue &&
      answers[stepKey] &&
      answers[stepKey] !== "Other..." ? (
        <Pressable style={styles.docuWraiteWorkflowNext} onPress={() => onAnswer({}, { advance: true })}>
          <Text style={styles.docuWraiteWorkflowNextText}>Continue</Text>
        </Pressable>
      ) : null}
      {multiSelect &&
      selectedSuggestions.length > 0 &&
      (!hasSelectedOther || answers[`${stepKey}Custom`]?.trim()) ? (
        <Pressable style={styles.docuWraiteWorkflowNext} onPress={() => onAnswer({}, { advance: true })}>
          <Text style={styles.docuWraiteWorkflowNextText}>Continue</Text>
        </Pressable>
      ) : null}
      {stepMeta.optionalNarration &&
      ((answers[stepKey] && answers[stepKey] !== "Other...") || String(narrationValue).trim()) ? (
        <Pressable style={styles.docuWraiteWorkflowNext} onPress={() => onAnswer({}, { advance: true })}>
          <Text style={styles.docuWraiteWorkflowNextText}>Continue</Text>
        </Pressable>
      ) : null}
    </View>
  );

  const advance = (changes) => {
    onAnswer(changes, { advance: true });
  };

  return (
    <View style={styles.docuWraiteWorkflowCard}>
      <Text style={styles.docuWraiteWorkflowEyebrow}>{workflowEyebrow}</Text>
      {progressLabel ? <Text style={styles.docuWraiteWorkflowProgress}>{progressLabel}</Text> : null}
      {workflowMeta?.confidence ? (
        <Text style={styles.docuWraiteWorkflowMetaLine}>
          {`Confidence: ${workflowMeta.confidence}${workflowMeta.noteQuality ? ` • Note quality: ${workflowMeta.noteQuality}` : ""}`}
        </Text>
      ) : null}
      {workflowMeta?.shiftPhase ? (
        <Text style={styles.docuWraiteWorkflowMetaLine}>{`Shift phase: ${workflowMeta.shiftPhase}`}</Text>
      ) : null}
      {aiError ? <Text style={styles.docuWraiteWorkflowAiNotice}>{aiError}</Text> : null}
      {aiLoading ? (
        <View style={styles.docuWraiteWorkflowLoadingRow}>
          <ActivityIndicator size="small" color="#7c3aed" />
          <Text style={styles.docuWraiteWorkflowLoading}>
            Generating note...
          </Text>
        </View>
      ) : null}
      <Text style={styles.docuWraiteWorkflowQuestion}>{stepMeta.question}</Text>

      {stepMeta.rationale ? <Text style={styles.docuWraiteWorkflowRationale}>{stepMeta.rationale}</Text> : null}

      {stepMeta.kind === "yes-no" ? (
        <View style={styles.docuWraiteWorkflowChoiceRow}>
          {["YES", "NO"].map((label) => (
            <Pressable
              key={label}
              style={[
                styles.docuWraiteWorkflowChoice,
                answers[stepKey] === label.toLowerCase() && styles.docuWraiteWorkflowChoiceActive,
              ]}
              onPress={() => advance({ [stepKey]: label.toLowerCase() })}
            >
              <Text
                style={[
                  styles.docuWraiteWorkflowChoiceText,
                  answers[stepKey] === label.toLowerCase() && styles.docuWraiteWorkflowChoiceTextActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {stepMeta.kind === "context-action"
        ? renderWorkflowContextActionStep({
            stepMeta,
            stepKey,
            answers,
            onAnswer,
            styles,
          })
        : null}

      {stepMeta.kind === "suggestions" ? (
        stepKey === "runtime-goal-progress" ? (
          <ScrollView
            style={styles.docuWraiteWorkflowSuggestionScroll}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {suggestionList}
          </ScrollView>
        ) : (
          suggestionList
        )
      ) : null}

      {stepMeta.kind === "readiness" ? (
        <View style={styles.docuWraiteWorkflowWhyBox}>
          {!activeReadinessRemediationKey ? (
            readinessIssues.map((item) => {
              if (item.targetStepKey) {
                const handleOpenRemediation = () => {
                  setActiveReadinessRemediationKey(item.targetStepKey);
                  onJumpToStep?.(item.targetStepKey);
                };

                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="link"
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.docuWraiteWorkflowIssueLink,
                      pressed && styles.docuWraiteWorkflowIssueLinkPressed,
                    ]}
                    onPress={handleOpenRemediation}
                  >
                    <Text
                      selectable={false}
                      onPress={handleOpenRemediation}
                      style={[
                        styles.docuWraiteWorkflowIssueLinkText,
                        item.variant === "escalation" && styles.docuWraiteWorkflowIssueLinkTextEscalation,
                      ]}
                    >
                      {`• ${item.message}`}
                    </Text>
                  </Pressable>
                );
              }

              return (
                <Text
                  key={item.id}
                  style={[
                    styles.docuWraiteWorkflowWhyItem,
                    item.variant === "escalation" && styles.docuWraiteWorkflowAiNotice,
                  ]}
                >
                  {`• ${item.message}`}
                </Text>
              );
            })
          ) : null}
          {activeReadinessRemediationKey
            ? (() => {
                const remediationStep = buildLocalRemediationStep(
                  activeReadinessRemediationKey,
                  workflowState?.fieldContext || {},
                  workflowMeta
                );
                if (!remediationStep) {
                  return null;
                }

                const remediationStepKey = remediationStep.stepKey;
                const remediationAnswer = getWorkflowAnswer(answers, remediationStepKey);
                const remediationCustom = answers[`${remediationStepKey}Custom`];
                const narrationField = remediationStep.narrationField || `${remediationStepKey}Narration`;

                const remediationSuggestions =
                  remediationStepKey === "runtime-goal-progress"
                    ? getGoalProgressSuggestionOptions(
                        remediationStep,
                        workflowState?.fieldContext || {},
                        workflowMeta
                      )
                    : remediationStep.suggestions || [];

                if (remediationStep.kind === "context-action") {
                  return (
                    <View style={styles.docuWraiteWorkflowReadinessRemediationBox}>
                      <Text style={styles.docuWraiteWorkflowReadinessRemediationTitle}>
                        {remediationStep.question}
                      </Text>
                      {remediationStep.rationale ? (
                        <Text style={styles.docuWraiteWorkflowRationale}>{remediationStep.rationale}</Text>
                      ) : null}
                      {renderWorkflowContextActionStep({
                        stepMeta: remediationStep,
                        stepKey: remediationStepKey,
                        answers,
                        onAnswer: (changes, options = {}) =>
                          onAnswer(syncRemediationAnswerKeys(changes, remediationStepKey), {
                            ...options,
                            stepKey: remediationStepKey,
                          }),
                        styles,
                        hideContinueButton: true,
                      })}
                      <View style={styles.docuWraiteWorkflowReadinessRemediationActions}>
                        <Pressable onPress={() => setActiveReadinessRemediationKey(null)}>
                          <Text style={styles.docuWraiteWorkflowBack}>Back to readiness list</Text>
                        </Pressable>
                        <Pressable
                          style={styles.docuWraiteWorkflowNext}
                          onPress={() => {
                            if (!canContinueRuntimeContextAction(answers, remediationStep, remediationStepKey)) {
                              return;
                            }

                            const selectionsField = `${remediationStepKey}Selections`;
                            const remediationNarration = answers[narrationField] || "";
                            const remediationContext =
                              getWorkflowAnswer(answers, getRuntimeContextFieldName(remediationStepKey)) || "";
                            const remediationSelections = getContextActionSelections(answers, remediationStepKey);
                            const useNoneLikeNarrationFallback =
                              remediationStepKey === "runtime-alert-review" &&
                              !remediationContext &&
                              Object.keys(remediationSelections).length === 0 &&
                              isNoneLikeNarration(remediationNarration);

                            onAnswer(
                              syncRemediationAnswerKeys(
                                {
                                  [remediationStepKey]: useNoneLikeNarrationFallback
                                    ? "none"
                                    : getWorkflowAnswer(answers, remediationStepKey),
                                  [`${remediationStepKey}Custom`]: remediationCustom || "",
                                  [getRuntimeContextFieldName(remediationStepKey)]: useNoneLikeNarrationFallback
                                    ? "None of these"
                                    : remediationContext,
                                  [selectionsField]: remediationSelections,
                                  [narrationField]: remediationNarration,
                                },
                                remediationStepKey
                              ),
                              { refreshReadiness: true, stepKey: remediationStepKey }
                            );
                            setActiveReadinessRemediationKey(null);
                          }}
                        >
                          <Text style={styles.docuWraiteWorkflowNextText}>Save to workflow answers</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                }

                return (
                  <View style={styles.docuWraiteWorkflowReadinessRemediationBox}>
                    <Text style={styles.docuWraiteWorkflowReadinessRemediationTitle}>
                      {remediationStep.question}
                    </Text>
                    {remediationStep.rationale ? (
                      <Text style={styles.docuWraiteWorkflowRationale}>{remediationStep.rationale}</Text>
                    ) : null}
                    <View style={styles.docuWraiteWorkflowSuggestionList}>
                      {remediationSuggestions.map((suggestion) => (
                        <Pressable
                          key={suggestion}
                          style={[
                            styles.docuWraiteWorkflowSuggestion,
                            remediationAnswer === suggestion && styles.docuWraiteWorkflowSuggestionActive,
                          ]}
                          onPress={() =>
                            onAnswer(
                              syncRemediationAnswerKeys(
                                {
                                  [remediationStepKey]: suggestion,
                                  [`${remediationStepKey}Custom`]: "",
                                },
                                remediationStepKey
                              ),
                              { stepKey: remediationStepKey }
                            )
                          }
                        >
                          <Text
                            style={[
                              styles.docuWraiteWorkflowSuggestionText,
                              remediationAnswer === suggestion && styles.docuWraiteWorkflowSuggestionTextActive,
                            ]}
                          >
                            {`✓ ${suggestion}`}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    {remediationStep.contextualOptions?.length ? (
                      <View style={styles.docuWraiteWorkflowContextBox}>
                        {remediationStep.contextualOptions.map((item) => (
                          <Text key={item} style={styles.docuWraiteWorkflowContextItem}>{`• ${item}`}</Text>
                        ))}
                      </View>
                    ) : null}
                    {remediationAnswer === "Other..." || remediationCustom ? (
                      <TextInput
                        value={remediationCustom || ""}
                        onChangeText={(entry) =>
                          onAnswer(
                            syncRemediationAnswerKeys(
                              {
                                [`${remediationStepKey}Custom`]: entry,
                                [remediationStepKey]: "Other...",
                              },
                              remediationStepKey
                            ),
                            { stepKey: remediationStepKey }
                          )
                        }
                        placeholder="Type answer"
                        placeholderTextColor="#888888"
                        style={styles.docuWraiteWorkflowInput}
                      />
                    ) : null}
                    {remediationStep.optionalNarration ? (
                      <TextInput
                        value={answers[narrationField] || ""}
                        onChangeText={(entry) =>
                          onAnswer(
                            syncRemediationAnswerKeys({ [narrationField]: entry }, remediationStepKey),
                            { stepKey: remediationStepKey }
                          )
                        }
                        placeholder="Add narration (optional)"
                        placeholderTextColor="#888888"
                        multiline
                        style={[styles.docuWraiteWorkflowInput, styles.docuWraiteWorkflowNarrationInput]}
                      />
                    ) : null}
                    <View style={styles.docuWraiteWorkflowReadinessRemediationActions}>
                      <Pressable onPress={() => setActiveReadinessRemediationKey(null)}>
                        <Text style={styles.docuWraiteWorkflowBack}>Back to readiness list</Text>
                      </Pressable>
                      <Pressable
                        style={styles.docuWraiteWorkflowNext}
                        onPress={() => {
                          if (
                            remediationAnswer === "Other..." &&
                            !String(remediationCustom || "").trim()
                          ) {
                            return;
                          }
                          if (!remediationAnswer) {
                            return;
                          }

                          onAnswer(
                            syncRemediationAnswerKeys(
                              {
                                [remediationStepKey]: remediationAnswer,
                                [`${remediationStepKey}Custom`]: remediationCustom || "",
                                [narrationField]: answers[narrationField] || "",
                              },
                              remediationStepKey
                            ),
                            { refreshReadiness: true, stepKey: remediationStepKey }
                          );
                          setActiveReadinessRemediationKey(null);
                        }}
                      >
                        <Text style={styles.docuWraiteWorkflowNextText}>Save to workflow answers</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })()
            : null}
          {!activeReadinessRemediationKey && draftBlocked ? (
            <Text style={styles.docuWraiteWorkflowAiNotice}>
              Complete the missing care-plan items before DocuWraite generates the final note.
            </Text>
          ) : null}
          {!activeReadinessRemediationKey && !draftBlocked ? (
            <Pressable style={styles.docuWraiteWorkflowNext} onPress={() => onAnswer({}, { advance: true })}>
              <Text style={styles.docuWraiteWorkflowNextText}>Continue</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {stepMeta.kind === "why" ? (
        <View style={styles.docuWraiteWorkflowWhyBox}>
          <Text style={styles.docuWraiteWorkflowWhyLead}>
            {`${patientDisplayName}'s care plan emphasizes:`}
          </Text>
          {whyItems.map((item) => (
            <Text key={item} style={styles.docuWraiteWorkflowWhyItem}>{`• ${item}`}</Text>
          ))}
          <Pressable style={styles.docuWraiteWorkflowNext} onPress={() => onAnswer({}, { advance: true })}>
            <Text style={styles.docuWraiteWorkflowNextText}>Generate note</Text>
          </Pressable>
        </View>
      ) : null}

      {stepMeta.kind === "draft" ? (
        <View style={styles.docuWraiteWorkflowDraftBox}>
          <Text style={styles.docuWraiteWorkflowDraftText}>{generatedNote}</Text>
          <Text style={styles.docuWraiteWorkflowExtraLabel}>Additional notes (optional)</Text>
          <TextInput
            value={answers.extraNotes || ""}
            onChangeText={(extraNotes) => onAnswer({ extraNotes })}
            placeholder="Add any extra details the DSP wants in the note"
            placeholderTextColor="#888888"
            multiline
            style={styles.docuWraiteWorkflowExtraInput}
          />
          <View style={styles.docuWraiteCardActions}>
            <Pressable
              style={styles.docuWraiteCardPrimary}
              onPress={() => {
                if (!draftBlocked) {
                  if (workflowId === "case-note-final") {
                    onAnswer({ finalDraftNote: generatedNote }, { advance: true });
                  } else {
                    onInsert(generatedNote);
                  }
                }
              }}
            >
              <Text style={styles.docuWraiteCardPrimaryText}>
                {draftBlocked
                  ? "Complete required items first"
                  : workflowId === "case-note-final"
                    ? "Continue to quick check"
                    : "Insert into note"}
              </Text>
            </Pressable>
            <Pressable style={styles.docuWraiteCardSecondary} onPress={onDismiss}>
              <Text style={styles.docuWraiteCardSecondaryText}>Close</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {stepMeta.kind === "affirm" ? (
        <View style={styles.docuWraiteWorkflowDraftBox}>
          <Text style={styles.docuWraiteWorkflowDraftText}>{reviewDraftNote}</Text>
          <View style={styles.docuWraiteCardActions}>
            <Pressable
              style={styles.docuWraiteCardPrimary}
              onPress={() => {
                if (reviewDraftNote) {
                  onInsert(reviewDraftNote);
                }
              }}
            >
              <Text style={styles.docuWraiteCardPrimaryText}>Insert into final case note</Text>
            </Pressable>
            <Pressable style={styles.docuWraiteCardSecondary} onPress={onDismiss}>
              <Text style={styles.docuWraiteCardSecondaryText}>Close</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.docuWraiteWorkflowFooter}>
        {canGoBack ? (
          <Pressable onPress={onBack}>
            <Text style={styles.docuWraiteWorkflowBack}>Back</Text>
          </Pressable>
        ) : (
          <View />
        )}
        <Pressable onPress={onDismiss}>
          <Text style={styles.docuWraiteWorkflowDismiss}>Dismiss</Text>
        </Pressable>
      </View>
    </View>
  );
}

function DocuWraiteBubble({ assist, onToggle }) {
  if (!assist) {
    return null;
  }

  return (
    <View style={styles.docuWraiteWrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open DocuWraite guided documentation"
        onPress={onToggle}
        style={styles.docuWraiteBubblePressable}
      >
        <DocuWraiteBubbleGlyph />
      </Pressable>
    </View>
  );
}

function DocumentationCommentField({
  fieldId,
  fieldContext,
  value,
  onChange,
  expanded,
  onToggleExpanded,
  assist,
  assistExpanded,
  workflow,
  onAssistToggle,
  onAssistDismiss,
  onAssistApply,
  onWorkflowAnswer,
  onWorkflowBack,
  onWorkflowJump,
  onWorkflowInsert,
  onAssistActivity,
  onAssignQuestions,
}) {
  const [focused, setFocused] = useState(false);
  const [activeTool, setActiveTool] = useState(null);
  const [spellingIssues, setSpellingIssues] = useState([]);
  const [wordingAssist, setWordingAssist] = useState(null);
  const remaining = DOCUMENTATION_CHAR_LIMIT - value.length;
  const previousThemeRef = useRef(null);

  const handleChange = (nextValue) => {
    onChange(nextValue);
    const theme = detectDocuWraiteWorkflowTheme(nextValue);
    if (theme && theme !== previousThemeRef.current) {
      previousThemeRef.current = theme;
      onAssistActivity?.(fieldId, { ...fieldContext, theme }, nextValue, "workflow");
    }
    onAssistActivity?.(fieldId, fieldContext, nextValue, "change");
    if (/[.!?]\s*$/.test(nextValue.trim()) || /\n\s*$/.test(nextValue)) {
      onAssistActivity?.(fieldId, fieldContext, nextValue, "sentence-end");
    }
    if (activeTool === "spell") {
      setSpellingIssues(findSpellingIssues(nextValue));
    }
  };

  const runSpellCheck = () => {
    const issues = findSpellingIssues(value);
    setSpellingIssues(issues);
    setWordingAssist(null);
    setActiveTool("spell");
  };

  const runSuggestWording = () => {
    setWordingAssist(
      buildWordingSuggestion({
        description: fieldContext.description,
        source: fieldContext.source,
        value,
      })
    );
    setSpellingIssues([]);
    setActiveTool("wording");
  };

  const applySpellingFix = (issue) => {
    const replacement = preserveSpellingCase(issue.word, issue.suggestion);
    const nextValue = replaceTextRange(value, issue.start, issue.end, replacement);
    handleChange(nextValue);
  };

  const applyWordingSuggestion = () => {
    if (!wordingAssist?.suggestion) {
      return;
    }
    handleChange(wordingAssist.suggestion);
    setActiveTool(null);
    setWordingAssist(null);
  };

  const showAssistChrome = !!assist;

  return (
    <View style={styles.docCommentField}>
      <View style={styles.docCommentInputWrap}>
        <TextInput
          value={value}
          onChangeText={handleChange}
          multiline
          spellCheck={Platform.OS === "web"}
          autoCorrect
          autoCapitalize="sentences"
          onFocus={() => {
            setFocused(true);
            onAssistActivity?.(fieldId, fieldContext, value, "focus");
          }}
          onBlur={() => {
            setFocused(false);
            onAssistActivity?.(fieldId, fieldContext, value, "blur");
          }}
          style={[
            styles.docCommentInput,
            showAssistChrome && styles.docCommentInputWithAssist,
            expanded && styles.docCommentInputExpanded,
            expanded && styles.docCommentInputFullscreen,
            focused && styles.docCommentInputFocused,
          ]}
          maxLength={DOCUMENTATION_CHAR_LIMIT}
        />
        {showAssistChrome ? <DocuWraiteBubble assist={assist} onToggle={onAssistToggle} /> : null}
      </View>
      {workflow || (assist?.mode !== "workflow" && assistExpanded) ? (
        <View style={styles.docuWraiteAssistDock}>
          {workflow ? (
            <DocuWraiteGuidedWorkflowPanel
              workflowId={workflow.workflowId}
              workflowState={workflow}
              onAnswer={onWorkflowAnswer}
              onBack={onWorkflowBack}
              onJumpToStep={onWorkflowJump}
              onInsert={onWorkflowInsert}
              onDismiss={onAssistDismiss}
            />
          ) : (
            <View style={styles.docuWraiteInlineCard}>
              <Text style={styles.docuWraiteCardTitle}>{assist.title}</Text>
              <Text style={styles.docuWraiteCardMessage}>{assist.message}</Text>
              <View style={styles.docuWraiteCardActions}>
                {assist.suggestion ? (
                  <Pressable style={styles.docuWraiteCardPrimary} onPress={onAssistApply}>
                    <Text style={styles.docuWraiteCardPrimaryText}>Apply suggestion</Text>
                  </Pressable>
                ) : null}
                <Pressable style={styles.docuWraiteCardSecondary} onPress={onAssistDismiss}>
                  <Text style={styles.docuWraiteCardSecondaryText}>Dismiss</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      ) : null}
      {fieldContext.assignedNodeSummary && !workflow ? (
        <View style={styles.docCommentToolPanel}>
          <Text style={styles.docCommentToolPanelTitle}>Assigned Decision-Tree Questions</Text>
          <Text style={styles.docCommentToolPanelMessage}>
            Open DocuWraite to answer the assigned questions for this block.
          </Text>
          <Text style={styles.docCommentToolSuggestion}>{fieldContext.assignedNodeSummary}</Text>
        </View>
      ) : null}
      {activeTool === "spell" ? (
        <View style={styles.docCommentToolPanel}>
          <Text style={styles.docCommentToolPanelTitle}>Spell check</Text>
          {spellingIssues.length ? (
            spellingIssues.map((issue) => (
              <View key={issue.id} style={styles.docCommentToolIssueRow}>
                <Text style={styles.docCommentToolIssueText}>
                  {`${issue.word} -> ${preserveSpellingCase(issue.word, issue.suggestion)}`}
                </Text>
                <Pressable style={styles.docCommentToolFixButton} onPress={() => applySpellingFix(issue)}>
                  <Text style={styles.docCommentToolFixButtonText}>Fix</Text>
                </Pressable>
              </View>
            ))
          ) : (
            <Text style={styles.docCommentToolPanelMessage}>No spelling issues found.</Text>
          )}
        </View>
      ) : null}
      {activeTool === "wording" && wordingAssist ? (
        <View style={styles.docCommentToolPanel}>
          <Text style={styles.docCommentToolPanelTitle}>{wordingAssist.title}</Text>
          <Text style={styles.docCommentToolPanelMessage}>{wordingAssist.message}</Text>
          <Text style={styles.docCommentToolSuggestion}>{wordingAssist.suggestion}</Text>
          <View style={styles.docCommentToolActions}>
            <Pressable style={styles.docCommentToolPrimary} onPress={applyWordingSuggestion}>
              <Text style={styles.docCommentToolPrimaryText}>Apply suggestion</Text>
            </Pressable>
            <Pressable
              style={styles.docCommentToolSecondary}
              onPress={() => {
                setActiveTool(null);
                setWordingAssist(null);
              }}
            >
              <Text style={styles.docCommentToolSecondaryText}>Dismiss</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      <View style={styles.docCommentMetaRow}>
        <View style={styles.docCommentTools}>
          <Pressable onPress={onToggleExpanded}>
            <Text style={styles.docCommentTool}>
              {expanded ? "Exit Fullscreen Note" : "Expand Textarea"}
            </Text>
          </Pressable>
          <Pressable onPress={runSpellCheck}>
            <Text style={[styles.docCommentTool, activeTool === "spell" && styles.docCommentToolActive]}>
              Spell Check
            </Text>
          </Pressable>
          <Pressable onPress={runSuggestWording}>
            <Text style={[styles.docCommentTool, activeTool === "wording" && styles.docCommentToolActive]}>
              Suggest Wording
            </Text>
          </Pressable>
          {onAssignQuestions ? (
            <Pressable onPress={onAssignQuestions}>
              <Text style={styles.docCommentTool}>Assign Questions</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.docCommentCounter}>{`About ${remaining} characters left`}</Text>
      </View>
    </View>
  );
}

function DocumentationStatusRow({ label, value }) {
  return (
    <View style={styles.docStatusRow}>
      <Text style={styles.docStatusLabel}>{label}</Text>
      <Text style={styles.docStatusValue}>{value}</Text>
    </View>
  );
}

function DocumentationFormTable({
  rows,
  isPhone,
  activeDropdown,
  onToggleDropdown,
  onScoreChange,
  onCommentChange,
  expandedAreas,
  onToggleExpanded,
  scorePlaceholder = "Select Score",
  getCommentAssistProps,
  onCommentAssistActivity,
  runtimeShiftIntelligence,
  onAssignQuestions,
}) {
  return (
    <View style={styles.docFormCard}>
      <View style={styles.docTableHeader}>
        <Text style={[styles.docTableHeaderCell, styles.docDescriptionColumn]}>Description</Text>
        <Text style={[styles.docTableHeaderCell, styles.docScoresColumn]}>Scores/Comments</Text>
      </View>
      {rows.map((row) => (
        <View key={row.id} style={[styles.docTableRow, isPhone && styles.docTableRowStacked]}>
          <View style={[styles.docDescriptionColumn, styles.docDescriptionCell]}>
            {row.source ? <Text style={styles.docRowSource}>{row.source}</Text> : null}
            <Text style={styles.docRowDescription}>{row.description}</Text>
          </View>
          <View style={[styles.docScoresColumn, styles.docScoresCell]}>
            <DocumentationDropdown
              value={row.score}
              options={supportLevelOptions}
              placeholder={scorePlaceholder}
              onChange={(score) => onScoreChange(row.id, score)}
              dropdownId={`row-${row.id}-score`}
              activeDropdown={activeDropdown}
              onToggleDropdown={onToggleDropdown}
            />
            <DocumentationCommentField
              fieldId={`row-${row.id}`}
              fieldContext={{
                fieldKind: "row",
                score: row.score,
                description: row.description,
                source: row.source,
                workflowId: row.workflowId,
                theme: row.theme,
                shiftIntelligence: runtimeShiftIntelligence,
                assignedNodes: row.assignedNodes || [],
                assignedNodeSummary: row.assignedNodeSummary || "",
                assignedWorkflowSteps: createAssignedWorkflowSteps(row.assignedNodes || []),
              }}
              value={row.comment}
              onChange={(comment) => onCommentChange(row.id, comment)}
              expanded={!!expandedAreas[`row-${row.id}`]}
              onToggleExpanded={() => onToggleExpanded(`row-${row.id}`)}
              {...getCommentAssistProps(`row-${row.id}`)}
              onAssistActivity={onCommentAssistActivity}
              onAssignQuestions={onAssignQuestions ? () => onAssignQuestions(row) : null}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

function DocumentationEntryScreen({
  session,
  onUpdate,
  onCancel,
  isPhone,
  clientProfile = null,
  onOpenDecisionAssignment,
}) {
  const activePatientName = clientProfile?.displayName ?? patientDisplayName;
  const previousShiftData = clientProfile?.previousShiftSnapshot ?? previousShiftSnapshot;
  const isCaseNoteSession = session.sessionType === "case-note";
  const runtimeShiftIntelligence = getShiftIntelligenceRuntime(clientProfile, session);
  const [expandedAreas, setExpandedAreas] = useState({});
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [docuWraiteAssist, setDocuWraiteAssist] = useState(null);
  const [docuWraiteExpanded, setDocuWraiteExpanded] = useState(false);
  const [docuWraiteWorkflow, setDocuWraiteWorkflow] = useState(null);
  const docuWraitePauseTimers = useRef({});
  const docuWraiteDismissed = useRef(new Set());
  const docuWraiteWorkflowRequestId = useRef(0);

  useEffect(() => {
    setExpandedAreas({});
    setActiveDropdown(null);
    setDocuWraiteAssist(null);
    setDocuWraiteWorkflow(null);
    setDocuWraiteExpanded(false);
    docuWraiteDismissed.current = new Set();
    Object.values(docuWraitePauseTimers.current).forEach((timerId) => clearTimeout(timerId));
    docuWraitePauseTimers.current = {};
  }, [session.sessionType, session.title, session.serviceDate]);

  const getWorkflowFieldNote = (fieldId) => {
    if (fieldId === "summary") {
      return session.shiftSummary || "";
    }
    if (fieldId.startsWith("time-")) {
      const blockId = fieldId.replace("time-", "");
      return session.timeBlocks.find((entry) => entry.id === blockId)?.comment || "";
    }
    if (fieldId.startsWith("row-")) {
      const rowId = fieldId.replace("row-", "");
      return session.rows.find((entry) => entry.id === rowId)?.comment || "";
    }
    return "";
  };

  const buildCaseNoteFinalFieldContext = () => ({
    fieldKind: "summary",
    workflowId: "case-note-final",
    description: "Final Case Note",
    source: "Case Note Final",
    shiftIntelligence: runtimeShiftIntelligence,
    sourceEntries: [
      ...session.timeBlocks.map((block) => ({
        entryType: "time-block",
        label: block.label,
        description: getTimeBlockPrompt(block.label, clientProfile),
        source: getTimeBlockSource(block.label, clientProfile),
        score: block.score,
        comment: block.comment,
        workflowId: getTimeBlockWorkflowId(block.label, clientProfile),
      })),
      ...session.rows.map((row) => ({
        entryType: "case-note-row",
        description: row.description,
        source: row.source,
        score: row.score,
        comment: row.comment,
        workflowId: row.workflowId || null,
      })),
    ],
  });

  const withWorkflowSnapshot = (workflowSnapshot) => ({
    ...workflowSnapshot,
    currentNote: getWorkflowFieldNote(workflowSnapshot.fieldId),
  });

  const refreshDocuWraiteWorkflowStep = async (workflowSnapshot) => {
    workflowSnapshot = withWorkflowSnapshot(workflowSnapshot);
    if (!workflowSnapshot?.ai?.enabled || !workflowSnapshot.workflowId) {
      return;
    }

    const requestId = docuWraiteWorkflowRequestId.current + 1;
    docuWraiteWorkflowRequestId.current = requestId;

    setDocuWraiteWorkflow((current) => {
      if (!current || current.fieldId !== workflowSnapshot.fieldId) {
        return current;
      }

      return {
        ...current,
        ai: {
          ...current.ai,
          enabled: true,
          loading: true,
          error: "",
        },
      };
    });

    try {
      const { step, meta } = await fetchDocuWraiteWorkflowStep({
        workflowId: workflowSnapshot.workflowId,
        answers: workflowSnapshot.answers || {},
        fieldContext: workflowSnapshot.fieldContext || {},
        stepIndex: workflowSnapshot.stepIndex ?? 0,
        patientName: activePatientName,
        currentNote: workflowSnapshot.currentNote || "",
        forcedStepKey: workflowSnapshot.forcedStepKey || null,
      });

      if (docuWraiteWorkflowRequestId.current !== requestId) {
        return;
      }

      setDocuWraiteWorkflow((current) => {
        if (!current || current.fieldId !== workflowSnapshot.fieldId) {
          return current;
        }

        let stepIndex = workflowSnapshot.stepIndex ?? current.stepIndex;
        if (workflowSnapshot.pendingReturnToReadiness) {
          const readinessIndex = meta.stepOrder.indexOf("readiness");
          if (readinessIndex >= 0) {
            stepIndex = readinessIndex;
          }
        }

        return {
          ...current,
          stepIndex,
          remediationStepKey: workflowSnapshot.remediationStepKey || null,
          forcedStepKey: workflowSnapshot.pendingReturnToReadiness ? null : workflowSnapshot.forcedStepKey || null,
          pendingReturnToReadiness: false,
          ai: {
            enabled: true,
            loading: false,
            error: "",
            step,
            meta,
          },
        };
      });
    } catch (error) {
      if (docuWraiteWorkflowRequestId.current !== requestId) {
        return;
      }

      setDocuWraiteWorkflow((current) => {
        if (!current || current.fieldId !== workflowSnapshot.fieldId) {
          return current;
        }

        return {
        ...current,
        ai: {
          enabled: true,
          loading: false,
          error:
            error?.message ||
            "DocuWraite could not reach the AI service. Confirm the API server is running.",
          step: null,
        },
      };
      });
    }
  };

  useEffect(() => {
    return () => {
      Object.values(docuWraitePauseTimers.current).forEach((timerId) => clearTimeout(timerId));
    };
  }, []);

  const patchSession = (changes) => {
    onUpdate(markDraftSaved({ ...session, statusMessage: "", validationWarnings: [], ...changes }));
  };

  const clearDocuWraitePause = (fieldId) => {
    if (docuWraitePauseTimers.current[fieldId]) {
      clearTimeout(docuWraitePauseTimers.current[fieldId]);
      delete docuWraitePauseTimers.current[fieldId];
    }
  };

  const showDocuWraiteAssist = (assist) => {
    if (!assist) {
      return;
    }
    if (assist.mode !== "workflow") {
      const dismissKey = `${assist.fieldId}:${assist.id}`;
      if (docuWraiteDismissed.current.has(dismissKey)) {
        return;
      }
    }
    setDocuWraiteAssist(assist);
    if (assist.mode === "workflow") {
      setDocuWraiteWorkflow((current) => {
        if (current?.fieldId === assist.fieldId && current.workflowId === assist.workflowId) {
          return current;
        }

        const localSteps = assist.localWorkflowSteps || assist.fieldContext?.assignedWorkflowSteps || [];
        const useLocalWorkflow = assist.workflowId === "assigned-nodes" && localSteps.length > 0;

        const startingWorkflow = {
          fieldId: assist.fieldId,
          workflowId: assist.workflowId,
          stepIndex: 0,
          answers: {},
          structuredAnswers: [],
          fieldContext: assist.fieldContext || {},
          localSteps,
          ai: {
            enabled: !useLocalWorkflow,
            loading: !useLocalWorkflow,
            error: "",
            step: null,
            meta: null,
          },
        };

        if (!useLocalWorkflow) {
          queueMicrotask(() => refreshDocuWraiteWorkflowStep(withWorkflowSnapshot(startingWorkflow)));
        }
        return startingWorkflow;
      });
      setDocuWraiteExpanded(true);
      return;
    }
    setDocuWraiteExpanded(false);
  };

  const openDocuWraiteWorkflow = (fieldId, fieldContext, value) => {
    const workflowId = detectDocuWraiteGuidedWorkflow(fieldContext, value, clientProfile);

    if (!workflowId) {
      return false;
    }

    showDocuWraiteAssist({
      fieldId,
      id: `workflow-${workflowId}`,
      mode: "workflow",
      workflowId,
      fieldContext,
      localWorkflowSteps: workflowId === "assigned-nodes" ? fieldContext.assignedWorkflowSteps || [] : [],
      title: getWorkflowEyebrow(workflowId),
      message:
        workflowId === "assigned-nodes"
          ? "DocuWraite will ask the assigned decision-tree questions for this block."
          : "DocuWraite will guide this note with care-plan questions.",
      trigger: "focus",
    });
    return true;
  };

  const openCaseNoteFinalWorkflow = () => {
    showDocuWraiteAssist({
      fieldId: "summary",
      id: "workflow-case-note-final",
      mode: "workflow",
      workflowId: "case-note-final",
      fieldContext: buildCaseNoteFinalFieldContext(),
      title: getWorkflowEyebrow("case-note-final"),
      message: "DocuWraite will roll the row notes into a final case note.",
      trigger: "manual",
    });
  };

  const [showFinalDraftChoice, setShowFinalDraftChoice] = useState(false);
  const [pendingFinalDraft, setPendingFinalDraft] = useState(null);
  const [pendingFinalDraftSource, setPendingFinalDraftSource] = useState(null);
  const [finalDraftError, setFinalDraftError] = useState("");
  const [isGeneratingFinalDraft, setIsGeneratingFinalDraft] = useState(false);

  const generateSimpleFinalNote = () => {
    setFinalDraftError("");
    setPendingFinalDraft(null);
    setPendingFinalDraftSource(null);
    // Prefer row comments (actual DSP input). Fallback to assignedNodes or timeBlock comments.
    const parts = [];

    // use rows with comments
    (session.rows || []).forEach((r) => {
      if (r.comment && String(r.comment).trim()) {
        parts.push(r.comment.trim());
      }
    });

    // fall back to timeBlocks assignedNodes or comments
    (session.timeBlocks || []).forEach((b) => {
      if (b.comment && String(b.comment).trim()) {
        parts.push(b.comment.trim());
      } else if (b.assignedNodes && b.assignedNodes.length) {
        const prompts = b.assignedNodes.map((n) => (n.question ? n.question : n.title || n.id));
        parts.push(prompts.map((p) => `${p}?`).join(" "));
      }
    });

    const draft = parts.length ? parts.join("\n\n") : "No documentation available to draft a final note.";
    setPendingFinalDraft(draft);
    setPendingFinalDraftSource("simple");
    setShowFinalDraftChoice(false);
  };

  const generateAIFinalNote = async () => {
    setFinalDraftError("");
    setPendingFinalDraft(null);
    setPendingFinalDraftSource(null);
    setIsGeneratingFinalDraft(true);

    try {
      const fieldContext = buildCaseNoteFinalFieldContext();
      const { step, meta } = await fetchDocuWraiteWorkflowStep({
        workflowId: "case-note-final",
        answers: {},
        fieldContext,
        stepIndex: 0,
        patientName: activePatientName,
        currentNote: session.shiftSummary || "",
        forcedStepKey: "draft",
      });

      if (step?.kind === "draft" && step.draftNote) {
        setPendingFinalDraft(step.draftNote);
        setPendingFinalDraftSource("ai");
        setShowFinalDraftChoice(false);
      } else if (step?.draftNote) {
        setPendingFinalDraft(step.draftNote);
        setPendingFinalDraftSource("ai");
        setShowFinalDraftChoice(false);
      } else if (step?.kind === "draft" && meta?.draftBlocked) {
        const readinessIssues = collectReadinessIssues(step, meta)
          .map((item) => item.message)
          .filter(Boolean);
        const detail = readinessIssues.length
          ? ` ${readinessIssues.slice(0, 3).join("; ")}`
          : "";
        setFinalDraftError(`AI draft generation is blocked until readiness issues are resolved.${detail}`);
      } else if (step?.kind === "readiness" || meta?.draftBlocked) {
        const readinessIssues = collectReadinessIssues(step, meta)
          .map((item) => item.message)
          .filter(Boolean);
        const detail = readinessIssues.length
          ? ` ${readinessIssues.slice(0, 3).join("; ")}`
          : "";
        setFinalDraftError(`AI draft generation is blocked until readiness issues are resolved.${detail}`);
      } else if (step?.question) {
        setFinalDraftError("AI service returned an interactive workflow step instead of a draft.");
      } else {
        setFinalDraftError("AI could not generate a final note draft.");
      }
    } catch (error) {
      setFinalDraftError(error?.message || "AI final note generation failed.");
    } finally {
      setIsGeneratingFinalDraft(false);
    }
  };

  const evaluateDocuWraiteAssist = (fieldId, fieldContext, value, trigger) => {
    const assist = resolveDocuWraiteAssist({
      fieldId,
      fieldKind: fieldContext.fieldKind,
      value,
      score: fieldContext.score,
      description: fieldContext.description,
      source: fieldContext.source,
      session,
      trigger,
      clientProfile,
    });
    showDocuWraiteAssist(
      assist
        ? {
            ...assist,
            fieldContext,
          }
        : null
    );
  };

  const handleCommentAssistActivity = (fieldId, fieldContext, value, activity) => {
    if (docuWraiteWorkflow?.fieldId === fieldId) {
      if (activity === "blur" || activity === "change") {
        return;
      }
    }

    if (activity === "focus") {
      if (openDocuWraiteWorkflow(fieldId, fieldContext, value)) {
        return;
      }
      evaluateDocuWraiteAssist(fieldId, fieldContext, value, "focus");
      return;
    }

    if (activity === "change") {
      clearDocuWraitePause(fieldId);
      docuWraitePauseTimers.current[fieldId] = setTimeout(() => {
        evaluateDocuWraiteAssist(fieldId, fieldContext, value, "typing-pause");
      }, DOCUWRAITE_PAUSE_MS);
      return;
    }

    if (activity === "blur") {
      clearDocuWraitePause(fieldId);
      evaluateDocuWraiteAssist(fieldId, fieldContext, value, "blur");
      return;
    }

    if (activity === "sentence-end" || activity === "workflow") {
      evaluateDocuWraiteAssist(fieldId, fieldContext, value, activity);
    }
  };

  const updateRow = (id, changes) => {
    patchSession({
      rows: session.rows.map((row) => (row.id === id ? { ...row, ...changes } : row)),
    });
  };

  const updateTimeBlock = (id, changes) => {
    patchSession({
      timeBlocks: session.timeBlocks.map((block) => (block.id === id ? { ...block, ...changes } : block)),
    });
  };

  const applyDocuWraiteNote = (fieldId, note) => {
    if (!note) {
      return;
    }

    if (fieldId === "summary") {
      patchSession({
        shiftSummary: session.shiftSummary.trim() ? `${session.shiftSummary.trim()}\n${note}` : note,
      });
      return;
    }

    if (fieldId.startsWith("time-")) {
      const blockId = fieldId.replace("time-", "");
      const block = session.timeBlocks.find((entry) => entry.id === blockId);
      if (block) {
        updateTimeBlock(blockId, {
          comment: block.comment.trim() ? `${block.comment.trim()}\n${note}` : note,
        });
      }
      return;
    }

    if (fieldId.startsWith("row-")) {
      const rowId = fieldId.replace("row-", "");
      const row = session.rows.find((entry) => entry.id === rowId);
      if (row) {
        updateRow(rowId, {
          comment: row.comment.trim() ? `${row.comment.trim()}\n${note}` : note,
        });
      }
    }
  };

  const getCommentAssistProps = (fieldId) => ({
    assist:
      docuWraiteAssist?.fieldId === fieldId
        ? docuWraiteAssist
        : docuWraiteWorkflow?.fieldId === fieldId
          ? {
              fieldId,
              id: `workflow-${docuWraiteWorkflow.workflowId}`,
              mode: "workflow",
              workflowId: docuWraiteWorkflow.workflowId,
              title: getWorkflowEyebrow(docuWraiteWorkflow.workflowId),
            }
          : null,
    workflow: docuWraiteWorkflow?.fieldId === fieldId ? docuWraiteWorkflow : null,
    assistExpanded:
      docuWraiteWorkflow?.fieldId === fieldId ||
      (docuWraiteAssist?.fieldId === fieldId && docuWraiteExpanded),
    onAssistToggle: () => {
      if (docuWraiteAssist?.fieldId === fieldId) {
        setDocuWraiteExpanded((current) => !current);
      }
    },
    onAssistDismiss: () => {
      if (docuWraiteAssist?.fieldId === fieldId) {
        docuWraiteDismissed.current.add(`${docuWraiteAssist.fieldId}:${docuWraiteAssist.id}`);
      }
      setDocuWraiteAssist(null);
      setDocuWraiteWorkflow(null);
      setDocuWraiteExpanded(false);
    },
    onAssistApply: () => {
      if (!docuWraiteAssist?.suggestion || docuWraiteAssist.fieldId !== fieldId) {
        return;
      }

      applyDocuWraiteNote(fieldId, docuWraiteAssist.suggestion);
      setDocuWraiteAssist(null);
      setDocuWraiteWorkflow(null);
      setDocuWraiteExpanded(false);
    },
    onWorkflowAnswer: (answerChanges, options = {}) => {
      setDocuWraiteWorkflow((current) => {
        if (!current || current.fieldId !== fieldId) {
          return current;
        }

        const answeredStepKey = options.stepKey || current.ai?.step?.stepKey || "";
        const normalizedChanges = syncRemediationAnswerKeys(answerChanges, answeredStepKey);
        const answers = { ...current.answers, ...normalizedChanges };
        let stepIndex = current.stepIndex;
        let remediationStepKey = current.remediationStepKey || null;
        let pendingReturnToReadiness = current.pendingReturnToReadiness || false;
        let structuredAnswers = current.structuredAnswers || [];

        const remediationTarget = current.remediationStepKey || current.forcedStepKey;
        const remediationStep = answeredStepKey ? buildLocalRemediationStep(answeredStepKey) : null;
        const assignedWorkflowStep = answeredStepKey
          ? (current.localSteps || []).find((step) => step.stepKey === answeredStepKey)
          : null;
        const remediationValue = answeredStepKey ? getWorkflowAnswer(answers, answeredStepKey) : undefined;

        if (answeredStepKey && remediationValue !== undefined) {
          structuredAnswers = appendStructuredWorkflowAnswers(structuredAnswers, {
            stepKey: answeredStepKey,
            question: assignedWorkflowStep?.question || remediationStep?.question || answeredStepKey,
            value: remediationValue,
            narration:
              answers[assignedWorkflowStep?.narrationField || remediationStep?.narrationField || `${answeredStepKey}Narration`] ||
              answers[`${kebabToCamel(answeredStepKey)}Narration`] ||
              "",
          });
        }

        if (options.refreshReadiness) {
          pendingReturnToReadiness = true;
          remediationStepKey = null;
          const readinessIndex = (current.ai?.meta?.stepOrder || []).indexOf("readiness");
          if (readinessIndex >= 0) {
            stepIndex = readinessIndex;
          }
        } else if (options.advance) {
          if (remediationTarget && remediationTarget === answeredStepKey) {
            pendingReturnToReadiness = true;
            remediationStepKey = null;
            const readinessIndex = (current.ai?.meta?.stepOrder || []).indexOf("readiness");
            if (readinessIndex >= 0) {
              stepIndex = readinessIndex;
            }
          } else {
            stepIndex = current.stepIndex + 1;
          }
        }

        const next = {
          ...current,
          answers,
          structuredAnswers,
          stepIndex,
          remediationStepKey,
          pendingReturnToReadiness,
          forcedStepKey: pendingReturnToReadiness || options.refreshReadiness ? null : current.forcedStepKey || null,
        };
        const shouldRefreshNow =
          options.advance ||
          options.refreshReadiness ||
          (Object.keys(normalizedChanges).length > 0 && !remediationTarget && !options.stepKey);

        if (next.ai?.enabled && shouldRefreshNow) {
          queueMicrotask(() => refreshDocuWraiteWorkflowStep(withWorkflowSnapshot(next)));
        }
        return next;
      });
      setDocuWraiteExpanded(true);
    },
    onWorkflowBack: () => {
      setDocuWraiteWorkflow((current) => {
        if (!current || current.fieldId !== fieldId) {
          return current;
        }

        if (current.remediationStepKey || current.forcedStepKey) {
          const readinessIndex = (current.ai?.meta?.stepOrder || []).indexOf("readiness");
          const next = {
            ...current,
            stepIndex: readinessIndex >= 0 ? readinessIndex : current.stepIndex,
            remediationStepKey: null,
            forcedStepKey: null,
            pendingReturnToReadiness: false,
          };
          if (next.ai?.enabled) {
            queueMicrotask(() => refreshDocuWraiteWorkflowStep(withWorkflowSnapshot(next)));
          }
          return next;
        }

        const next = { ...current, stepIndex: Math.max(0, current.stepIndex - 1) };
        if (next.ai?.enabled) {
          queueMicrotask(() => refreshDocuWraiteWorkflowStep(withWorkflowSnapshot(next)));
        }
        return next;
      });
    },
    onWorkflowJump: (targetStepKey) => {
      setDocuWraiteWorkflow((current) => {
        if (!current || current.fieldId !== fieldId || !targetStepKey) {
          return current;
        }

        const stepOrder = current.ai?.meta?.stepOrder || [];
        const targetIndex = stepOrder.indexOf(targetStepKey);
        const localStep = buildLocalRemediationStep(
          targetStepKey,
          current.fieldContext || {},
          current.ai?.meta || null
        );
        const next = {
          ...current,
          stepIndex: targetIndex >= 0 ? targetIndex : current.stepIndex,
          remediationStepKey: targetStepKey,
          forcedStepKey: targetStepKey,
          ai: {
            ...current.ai,
            enabled: true,
            loading: !localStep,
            error: "",
            step: localStep || current.ai?.step || null,
          },
        };
        if (next.ai?.enabled) {
          queueMicrotask(() => refreshDocuWraiteWorkflowStep(withWorkflowSnapshot(next)));
        }
        return next;
      });
      setDocuWraiteExpanded(true);
    },
    onWorkflowInsert: (note) => {
      if (fieldId === "summary") {
        const attestationAnswers =
          docuWraiteWorkflow?.workflowId === "case-note-final" &&
          docuWraiteWorkflow.answers?.["dsp-understanding-1"] &&
          docuWraiteWorkflow.answers?.["dsp-understanding-2"] &&
          docuWraiteWorkflow.answers?.["dsp-understanding-3"]
            ? {
                "dsp-understanding-1": docuWraiteWorkflow.answers["dsp-understanding-1"],
                "dsp-understanding-2": docuWraiteWorkflow.answers["dsp-understanding-2"],
                "dsp-understanding-3": docuWraiteWorkflow.answers["dsp-understanding-3"],
              }
            : null;

        patchSession({
          shiftSummary: session.shiftSummary.trim() ? `${session.shiftSummary.trim()}\n${note}` : note,
          caseNoteAttestationComplete: Boolean(attestationAnswers),
          caseNoteAttestation: attestationAnswers,
        });
      } else {
        applyDocuWraiteNote(fieldId, note);
      }
      setDocuWraiteAssist(null);
      setDocuWraiteWorkflow(null);
      setDocuWraiteExpanded(false);
    },
  });

  const runDocuWraiteReview = (trigger) => {
    const fieldChecks = [
      ...session.timeBlocks.map((block) => ({
        fieldId: `time-${block.id}`,
        fieldContext: {
          fieldKind: "time",
          score: block.score,
          description: block.label,
          source: "Shift Timeline",
          workflowId: getTimeBlockWorkflowId(block.label, clientProfile),
          shiftIntelligence: runtimeShiftIntelligence,
        },
        value: block.comment,
      })),
      ...session.rows.map((row) => ({
        fieldId: `row-${row.id}`,
        fieldContext: {
          fieldKind: "row",
          score: row.score,
          description: row.description,
          source: row.source,
          workflowId: row.workflowId,
          theme: row.theme,
          shiftIntelligence: runtimeShiftIntelligence,
        },
        value: row.comment,
      })),
      {
        fieldId: "summary",
        fieldContext: {
          fieldKind: "summary",
          score: "",
          description: isCaseNoteSession ? "Final Case Note" : "End of Shift Summary",
          source: isCaseNoteSession ? "Case Note Final" : "Shift Summary",
          workflowId: isCaseNoteSession ? "case-note-final" : null,
          shiftIntelligence: runtimeShiftIntelligence,
          sourceEntries: isCaseNoteSession ? buildCaseNoteFinalFieldContext().sourceEntries : undefined,
        },
        value: session.shiftSummary,
      },
    ];

    const assists = fieldChecks
      .map((entry) =>
        resolveDocuWraiteAssist({
          fieldId: entry.fieldId,
          fieldKind: entry.fieldContext.fieldKind,
          value: entry.value,
          score: entry.fieldContext.score,
          description: entry.fieldContext.description,
          source: entry.fieldContext.source,
          session,
          trigger,
          clientProfile,
        })
      )
      .filter(Boolean)
      .sort((left, right) => right.priority - left.priority);

    showDocuWraiteAssist(assists[0] ?? null);
  };

  const validateDocumentation = () => {
    const warnings = buildValidationWarnings(session);
    patchSession({
      validationWarnings: warnings,
      statusMessage:
        warnings.length === 0
          ? "Validation complete. Review entries before submitting documentation."
          : "Validation found compliance warnings. Review before submission.",
      review: {
        ...session.review,
        validationTimestamp: "05/14/2026 1:06 AM",
      },
    });
    runDocuWraiteReview("validate");
  };

  const saveDraft = () => {
    patchSession({
      statusMessage: "Draft saved. Documentation remains editable until submission.",
    });
  };

  const patchHandover = (changes) => {
    patchSession({
      handover: {
        ...(session.handover || {}),
        ...changes,
      },
    });
  };

  const toggleHandoverVital = (key) => {
    patchHandover({
      vitalSigns: {
        ...(session.handover?.vitalSigns || {}),
        [key]: !session.handover?.vitalSigns?.[key],
      },
    });
  };

  const updateHandoverVitalValue = (key, value) => {
    patchHandover({
      vitalSigns: {
        ...(session.handover?.vitalSigns || {}),
        [key]: true,
      },
      vitalValues: {
        ...(session.handover?.vitalValues || {}),
        [key]: value,
      },
    });
  };

  const openHandoverNote = () => {
    const generatedAt = "05/14/2026 1:06 AM";
    const nextSession = {
      ...session,
      handover: {
        ...(session.handover || {}),
        required: true,
        submitted: true,
        generatedAt,
      },
    };
    const opened = openHandoverNoteInBrowser({
      session: nextSession,
      patientName: activePatientName,
      loggedInStaff: loggedInUser,
    });

    patchSession({
      handover: nextSession.handover,
      statusMessage: opened
        ? "Handover note opened in a new browser tab."
        : "Handover note saved. Browser tab opening is available on web.",
    });
  };

  const submitDocumentation = () => {
    const warnings = buildValidationWarnings(session);
    if (isCaseNoteSession && warnings.length === 0 && !session.caseNoteAttestationComplete) {
      openCaseNoteFinalWorkflow();
      patchSession({
        validationWarnings: warnings,
        statusMessage:
          "Complete the final case note quick check before submitting documentation.",
      });
      runDocuWraiteReview("submit");
      return;
    }

    patchSession({
      validationWarnings: warnings,
      statusMessage:
        warnings.length === 0
          ? "Documentation submitted for compliance review. Complete the handover note next."
          : "Submission blocked until validation warnings are resolved.",
      review: {
        ...session.review,
        signStatus: warnings.length === 0 ? "Submitted for QA Review" : session.review.signStatus,
        validationTimestamp: "05/14/2026 1:06 AM",
      },
      handover:
        warnings.length === 0
          ? {
              ...(session.handover || {}),
              required: true,
              submitted: false,
            }
          : session.handover,
    });
    runDocuWraiteReview("submit");
  };

  const copyPreviousShift = () => {
    patchSession({
      timeBlocks: session.timeBlocks.map((block, index) => {
        const previous = previousShiftData.timeBlocks[index];
        if (!previous) {
          return block;
        }
        return {
          ...block,
          score: previous.score,
          comment: previous.comment,
        };
      }),
      rows: session.rows.map((row, index) => {
        const previous = previousShiftData.rows[index];
        if (!previous) {
          return row;
        }
        return { ...row, score: previous.score, comment: previous.comment };
      }),
      shiftSummary: previousShiftData.shiftSummary,
      statusMessage: "Previous shift documentation copied. Review and edit before submission.",
    });
  };

  const addAnotherTimeBlock = () => {
    const nextIndex = session.timeBlocks.length + 1;
    patchSession({
      timeBlocks: [
        ...session.timeBlocks,
        createTimeBlockEntry({ id: `custom-${nextIndex}`, label: `Additional Block ${nextIndex}` }, nextIndex),
      ],
      statusMessage: "Additional time block added to shift timeline.",
    });
  };

  const applyQuickPhrase = (snippet) => {
    const targetRow = session.rows.find((row) => !row.comment.trim()) ?? session.rows[0];
    if (!targetRow) {
      return;
    }
    updateRow(targetRow.id, {
      comment: targetRow.comment ? `${targetRow.comment}\n${snippet}` : snippet,
    });
  };

  const insertGoal = () => {
    const plan = actionPlans[0];
    if (!plan) {
      return;
    }
    patchSession({
      rows: [
        ...session.rows,
        {
          id: `inserted-${Date.now()}`,
          description: `Desired outcome: ${plan.outcome}`,
          source: plan.title,
          linkedFromCarePlan: true,
          score: "",
          comment: "",
        },
      ],
      statusMessage: "Care plan goal inserted into documentation table.",
    });
  };

  const toggleExpanded = (fieldId) => {
    setExpandedAreas((current) => ({ ...current, [fieldId]: !current[fieldId] }));
  };

  const workflowActions = [
    { label: "Copy Previous Shift", action: copyPreviousShift },
    { label: "Add Another Time Block", action: addAnotherTimeBlock },
    { label: "Quick Phrase", action: () => applyQuickPhrase(quickPhraseSnippets.community) },
    { label: "Behavior Template", action: () => applyQuickPhrase(quickPhraseSnippets.behavior) },
    { label: "Insert Goal", action: insertGoal },
  ];

  if (isCaseNoteSession) {
    workflowActions.splice(3, 0, {
      label: "Generate Final Case Note",
      action: () => setShowFinalDraftChoice(true),
    });
  }

  return (
    <View style={styles.docEntryShell}>
      <View style={styles.docEntryHeaderCard}>
        <Text style={styles.docEntryTitle}>{session.title}</Text>
        <Text style={styles.docEntryMeta}>{`Individual: ${activePatientName}`}</Text>
        <Text style={styles.docEntryMeta}>{`Program: ${session.program}`}</Text>
        <Text style={styles.docEntryMeta}>{`Service Date: ${session.serviceDate}`}</Text>
        <Text style={styles.docEntryMeta}>{`Entered By: ${loggedInUser}`}</Text>
        {session.lastDraftSavedAt ? (
          <Text style={styles.docEntryMeta}>{`Draft Autosaved: ${session.lastDraftSavedAt}`}</Text>
        ) : null}
      </View>

      <View style={styles.docWorkflowRow}>
        {workflowActions.map((item) => (
          <Pressable key={item.label} style={styles.docWorkflowButton} onPress={item.action}>
            <Text style={styles.docWorkflowButtonText}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      {showFinalDraftChoice ? (
        <View style={styles.finalDraftChoiceRow}>
          <Text style={styles.finalDraftChoiceLabel}>Generate draft using:</Text>
          <View style={styles.finalDraftChoiceButtons}>
            <Pressable style={[styles.docWorkflowButton, styles.finalDraftButton]} onPress={generateSimpleFinalNote} disabled={isGeneratingFinalDraft}>
              <Text style={styles.docWorkflowButtonText}>Simple</Text>
            </Pressable>
            <Pressable style={[styles.docWorkflowButton, styles.finalDraftButton]} onPress={generateAIFinalNote} disabled={isGeneratingFinalDraft}>
              <Text style={styles.docWorkflowButtonText}>AI (Server)</Text>
            </Pressable>
            <Pressable style={[styles.docWorkflowButton, styles.finalDraftCancel]} onPress={() => setShowFinalDraftChoice(false)} disabled={isGeneratingFinalDraft}>
              <Text style={styles.docWorkflowButtonText}>Cancel</Text>
            </Pressable>
          </View>
          {isGeneratingFinalDraft ? (
            <Text style={styles.finalDraftStatusText}>Generating AI draft…</Text>
          ) : null}
          {finalDraftError ? (
            <Text style={styles.finalDraftErrorText}>{finalDraftError}</Text>
          ) : null}
        </View>
      ) : null}

      {pendingFinalDraft ? (
        <View style={styles.finalDraftPreviewCard}>
          <Text style={styles.finalDraftPreviewTitle}>Draft Final Note Preview</Text>
          <ScrollView style={styles.finalDraftPreviewBody}>
            <Text style={styles.finalDraftPreviewText}>{pendingFinalDraft}</Text>
          </ScrollView>
          <View style={styles.finalDraftPreviewActions}>
            <Pressable
              style={[styles.docWorkflowButton, styles.finalDraftButton]}
              onPress={() => {
                patchSession({ shiftSummary: pendingFinalDraft, statusMessage: "Applied generated final note." });
                setPendingFinalDraft(null);
                setPendingFinalDraftSource(null);
              }}
            >
              <Text style={styles.docWorkflowButtonText}>Apply Draft</Text>
            </Pressable>
            {pendingFinalDraftSource === "ai" ? (
              <Pressable
                style={[styles.docWorkflowButton, styles.finalDraftButton]}
                onPress={generateAIFinalNote}
                disabled={isGeneratingFinalDraft}
              >
                <Text style={styles.docWorkflowButtonText}>{isGeneratingFinalDraft ? "Regenerating..." : "Regenerate AI"}</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={[styles.docWorkflowButton, styles.finalDraftCancel]}
              onPress={() => {
                setPendingFinalDraft(null);
                setPendingFinalDraftSource(null);
              }}
            >
              <Text style={styles.docWorkflowButtonText}>Discard Draft</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <ScrollView
        style={styles.docEntryScroll}
        contentContainerStyle={styles.docEntryScrollInner}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.docFormCard}>
          <Text style={styles.docSectionHeading}>Shift Timeline Documentation</Text>
          <View style={styles.docTableHeader}>
            <Text style={[styles.docTableHeaderCell, styles.docDescriptionColumn]}>Description</Text>
            <Text style={[styles.docTableHeaderCell, styles.docScoresColumn]}>Scores/Comments</Text>
          </View>
          {session.timeBlocks.map((block) => (
            <View key={block.id} style={[styles.docTableRow, isPhone && styles.docTableRowStacked]}>
              <View style={[styles.docDescriptionColumn, styles.docDescriptionCell]}>
                <Text style={styles.docTimeLabel}>{block.label}</Text>
                <Text style={styles.docRowDescription}>
                  {getTimeBlockPrompt(block.label, clientProfile)}
                </Text>
              </View>
              <View style={[styles.docScoresColumn, styles.docScoresCell]}>
                <DocumentationDropdown
                  value={block.score}
                  options={supportLevelOptions}
                  placeholder="Select Score"
                  onChange={(score) => updateTimeBlock(block.id, { score })}
                  dropdownId={`time-${block.id}-score`}
                  activeDropdown={activeDropdown}
                  onToggleDropdown={setActiveDropdown}
                />
                <DocumentationCommentField
                  fieldId={`time-${block.id}`}
                  fieldContext={{
                    fieldKind: "time",
                    score: block.score,
                    label: block.label,
                    description: getTimeBlockPrompt(block.label, clientProfile),
                    source: getTimeBlockSource(block.label, clientProfile),
                    workflowId: getTimeBlockWorkflowId(block.label, clientProfile),
                    shiftIntelligence: runtimeShiftIntelligence,
                    assignedNodes: block.assignedNodes || [],
                    assignedNodeSummary: block.assignedNodeSummary || "",
                    assignedWorkflowSteps: createAssignedWorkflowSteps(block.assignedNodes || []),
                  }}
                  value={block.comment}
                onChange={(comment) => updateTimeBlock(block.id, { comment })}
                expanded={!!expandedAreas[`time-${block.id}`]}
                onToggleExpanded={() => toggleExpanded(`time-${block.id}`)}
                {...getCommentAssistProps(`time-${block.id}`)}
                onAssistActivity={handleCommentAssistActivity}
              />
            </View>
          </View>
        ))}
        </View>

        <DocumentationFormTable
          rows={session.rows}
          isPhone={isPhone}
          activeDropdown={activeDropdown}
          onToggleDropdown={setActiveDropdown}
          onScoreChange={(id, score) => updateRow(id, { score })}
          onCommentChange={(id, comment) => updateRow(id, { comment })}
          expandedAreas={expandedAreas}
          onToggleExpanded={toggleExpanded}
          getCommentAssistProps={getCommentAssistProps}
          onCommentAssistActivity={handleCommentAssistActivity}
          runtimeShiftIntelligence={runtimeShiftIntelligence}
          onAssignQuestions={(row) => onOpenDecisionAssignment?.({
            key: `row:${row.id}`,
            label: row.description,
            type: "case-note-row",
            targetId: row.id,
          })}
        />

        <View style={styles.docFormCard}>
          <Text style={styles.docSectionHeading}>
            {isCaseNoteSession ? "Final Case Note" : "End of Shift Summary"}
          </Text>
          <View style={styles.docSectionBody}>
            <Text style={styles.docSectionSubtitle}>
              {isCaseNoteSession
                ? "Roll the row-level documentation into one final case note paragraph, then add any extra details needed before submission."
                : "Document overall mood, notable incidents, health concerns, progress toward goals, and handoff information."}
            </Text>
            <DocumentationCommentField
              fieldId="summary"
              fieldContext={{
                fieldKind: "summary",
                score: "",
                description: isCaseNoteSession ? "Final Case Note" : "End of Shift Summary",
                source: isCaseNoteSession ? "Case Note Final" : "Shift Summary",
                workflowId: isCaseNoteSession ? "case-note-final" : null,
                shiftIntelligence: runtimeShiftIntelligence,
                sourceEntries: isCaseNoteSession ? buildCaseNoteFinalFieldContext().sourceEntries : undefined,
              }}
              value={session.shiftSummary}
              onChange={(shiftSummary) => patchSession({ shiftSummary })}
              expanded={!!expandedAreas.summary}
              onToggleExpanded={() => toggleExpanded("summary")}
              {...getCommentAssistProps("summary")}
              onAssistActivity={handleCommentAssistActivity}
            />
          </View>
        </View>

        <View style={styles.docFormCard}>
          <Text style={styles.docSectionHeading}>Supervisor Review / Signature</Text>
          <View style={styles.docSectionBody}>
            <View style={styles.docReviewGrid}>
              <DocumentationStatusRow
                label="Reviewed By"
                value={session.review.reviewedBy || "Not reviewed"}
              />
              <DocumentationStatusRow label="Signed Status" value={session.review.signStatus} />
              <DocumentationStatusRow label="QA Review" value={session.review.qaStatus} />
              <DocumentationStatusRow
                label="Validation Timestamp"
                value={session.review.validationTimestamp || "Not validated"}
              />
            </View>
            <Text style={styles.docReviewInputLabel}>Supervisor / QA reviewer name</Text>
            <TextInput
              value={session.review.reviewedBy}
              onChangeText={(reviewedBy) =>
                patchSession({ review: { ...session.review, reviewedBy, qaStatus: "QA Review In Progress" } })
              }
              placeholder="Enter reviewer name"
              placeholderTextColor="#888888"
              style={styles.docReviewInput}
            />
          </View>
        </View>

        {session.handover?.required ? (
          <View style={styles.docFormCard}>
            <Text style={styles.docSectionHeading}>Handover Note</Text>
            <View style={styles.docSectionBody}>
              <Text style={styles.docSectionSubtitle}>
                Submit a short handover note after documentation. Add any final transition details and mark which
                vital signs were addressed before opening the handover note.
              </Text>
              <Text style={styles.docReviewInputLabel}>Additional handover notes</Text>
              <TextInput
                value={session.handover?.additionalNotes || ""}
                onChangeText={(additionalNotes) => patchHandover({ additionalNotes })}
                placeholder="Add shift handoff details for the next staff member"
                placeholderTextColor="#888888"
                multiline
                style={styles.docHandoverInput}
              />
              <Text style={styles.docReviewInputLabel}>Vital signs</Text>
              <View style={styles.docHandoverVitalsGrid}>
                {handoverVitalFields.map((field) => (
                  <Pressable
                    key={field.key}
                    style={[
                      styles.docHandoverVitalChip,
                      session.handover?.vitalSigns?.[field.key] && styles.docHandoverVitalChipActive,
                    ]}
                    onPress={() => toggleHandoverVital(field.key)}
                  >
                    <Text
                      style={[
                        styles.docHandoverVitalChipText,
                        session.handover?.vitalSigns?.[field.key] && styles.docHandoverVitalChipTextActive,
                      ]}
                    >
                      {`${session.handover?.vitalSigns?.[field.key] ? "☑" : "☐"} ${field.label}`}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {handoverVitalFields.some((field) => session.handover?.vitalSigns?.[field.key]) ? (
                <View style={styles.docHandoverVitalValues}>
                  {handoverVitalFields
                    .filter((field) => session.handover?.vitalSigns?.[field.key])
                    .map((field) => (
                      <View key={`${field.key}-value`} style={styles.docHandoverVitalValueRow}>
                        <Text style={styles.docHandoverVitalValueLabel}>{field.label}</Text>
                        <TextInput
                          value={session.handover?.vitalValues?.[field.key] || ""}
                          onChangeText={(value) => updateHandoverVitalValue(field.key, value)}
                          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                          placeholderTextColor="#888888"
                          style={styles.docHandoverVitalValueInput}
                        />
                      </View>
                    ))}
                </View>
              ) : null}
              <Text style={styles.docReviewInputLabel}>Other vitals or readings</Text>
              <TextInput
                value={session.handover?.otherVitals || ""}
                onChangeText={(otherVitals) => patchHandover({ otherVitals })}
                placeholder="Add glucose, weight, pain score, or any other reading"
                placeholderTextColor="#888888"
                multiline
                style={styles.docHandoverOtherVitalsInput}
              />
              <View style={styles.docHandoverActions}>
                <Pressable style={[styles.docActionButton, styles.docActionPrimary]} onPress={openHandoverNote}>
                  <Text style={styles.docActionPrimaryText}>Open Handover Note</Text>
                </Pressable>
                {session.handover?.submitted ? (
                  <Text style={styles.docHandoverStatus}>Handover note generated and marked submitted.</Text>
                ) : (
                  <Text style={styles.docHandoverStatus}>Complete this after shift submission.</Text>
                )}
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.docFooterPanel}>
        {session.validationWarnings.length ? (
          <View style={styles.docWarningList}>
            {session.validationWarnings.map((warning) => (
              <Text key={warning} style={styles.docWarningItem}>
                {warning}
              </Text>
            ))}
          </View>
        ) : null}

        {session.statusMessage ? <Text style={styles.docStatusMessage}>{session.statusMessage}</Text> : null}

        <View style={[styles.docEntryActions, isPhone && styles.docEntryActionsStacked]}>
          <Pressable style={[styles.docActionButton, styles.docActionSecondary]} onPress={saveDraft}>
            <Text style={styles.docActionSecondaryText}>Save Draft</Text>
          </Pressable>
          <Pressable style={[styles.docActionButton, styles.docActionOutline]} onPress={validateDocumentation}>
            <Text style={styles.docActionOutlineText}>Validate</Text>
          </Pressable>
          <Pressable style={[styles.docActionButton, styles.docActionPrimary]} onPress={submitDocumentation}>
            <Text style={styles.docActionPrimaryText}>Submit Documentation</Text>
          </Pressable>
          <Pressable style={[styles.docActionButton, styles.docActionOutline]} onPress={onCancel}>
            <Text style={styles.docActionOutlineText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function ShiftIntelligencePanel({ documentationSession, clientProfile = null }) {
  const runtimeShiftIntelligence = getShiftIntelligenceRuntime(clientProfile, documentationSession);

  const renderList = (items) =>
    items.length ? (
      items.map((item) => (
        <Text key={item} style={styles.intelItem}>
          {item}
        </Text>
      ))
    ) : (
      <Text style={styles.intelEmpty}>Nothing found to display</Text>
    );

  return (
    <>
      <Card title="Overdue">{renderList(runtimeShiftIntelligence.overdue)}</Card>
      <Card title="Active Risks">{renderList(runtimeShiftIntelligence.activeRisks)}</Card>
      <Card title="Today's Appointments">{renderList(runtimeShiftIntelligence.appointments)}</Card>
      <Card title="Medications Due">{renderList(runtimeShiftIntelligence.medicationsDue)}</Card>
      <Card title="Alerts">{renderList(runtimeShiftIntelligence.alerts)}</Card>
      <Card title="Incomplete Goals">{renderList(runtimeShiftIntelligence.incompleteGoals.slice(0, 3))}</Card>
    </>
  );
}

const DECISION_MODE_OPTIONS = [
  { label: "Full branch", value: "full-branch" },
  { label: "Selective branch", value: "selective-branch" },
];

const DECISION_DEPTH_OPTIONS = [
  { label: "1", value: "1" },
  { label: "2", value: "2" },
];

const DECISION_TARGET_TYPE_OPTIONS = [
  { label: "Time block", value: "time-block" },
  { label: "Case-note row", value: "case-note-row" },
];

function getDecisionOptionLabel(options = [], value = "") {
  return options.find((option) => String(option.value) === String(value))?.label || "";
}

function DecisionEngineScreen({
  isPhone,
  onAssignToCaseNote,
  timeBlocks = [],
  rowTargets = [],
  initialTargetKey = "",
  onScheduleChange,
  onRowsChange,
}) {
  const [selectedLibrary, setSelectedLibrary] = useState(decisionNodes.libraries[0]?.library || "");
  const [selectedDepth, setSelectedDepth] = useState(2);
  const [includeMode, setIncludeMode] = useState("full-branch");
  const [activeDecisionDropdown, setActiveDecisionDropdown] = useState(null);
  const [targetType, setTargetType] = useState(initialTargetKey.startsWith("row:") ? "case-note-row" : "time-block");
  const [checkedNodes, setCheckedNodes] = useState({});
  const [includeInFinalMap, setIncludeInFinalMap] = useState({});
  const [newBlockStartHour, setNewBlockStartHour] = useState(7);
  const [newBlockEndHour, setNewBlockEndHour] = useState(8);
  const [newRowDescription, setNewRowDescription] = useState("");
  const [newRowWorkflowId, setNewRowWorkflowId] = useState("behavior-support");
  const workflowOptions = [
    { workflowId: "behavior-support", label: "Behavior", theme: "behavior" },
    { workflowId: "morning-adl", label: "ADL", theme: "hygiene" },
    { workflowId: "feeding-support", label: "Meal", theme: "meal" },
    { workflowId: "communication-support", label: "Communication", theme: "communication" },
    { workflowId: "community-outing", label: "Community", theme: "outing" },
    { workflowId: "medication-support", label: "Medication", theme: "medication" },
  ];
  const assignmentTargets = [
    ...timeBlocks.map((block) => ({
      key: `time:${block.id}`,
      label: block.label,
      type: "time-block",
      targetId: block.id,
    })),
    ...rowTargets.map((row) => ({
      key: `row:${row.id}`,
      label: row.description,
      type: "case-note-row",
      targetId: row.id,
    })),
  ];
  const [selectedTargetKey, setSelectedTargetKey] = useState(initialTargetKey || assignmentTargets[0]?.key || "");

  useEffect(() => {
    if (initialTargetKey && assignmentTargets.some((target) => target.key === initialTargetKey)) {
      setSelectedTargetKey(initialTargetKey);
      setTargetType(initialTargetKey.startsWith("row:") ? "case-note-row" : "time-block");
    }
  }, [initialTargetKey, assignmentTargets]);

  useEffect(() => {
    if (newBlockEndHour <= newBlockStartHour) {
      setNewBlockEndHour(newBlockStartHour + 1);
    }
  }, [newBlockStartHour, newBlockEndHour]);

  const selectedLibraryData =
    decisionNodes.libraries.find((lib) => lib.library === selectedLibrary) ??
    decisionNodes.libraries[0];
  const timeBlockTargets = assignmentTargets.filter((target) => target.type === "time-block");
  const rowAssignmentTargets = assignmentTargets.filter((target) => target.type === "case-note-row");
  const scopedTargets = targetType === "case-note-row" ? rowAssignmentTargets : timeBlockTargets;
  const selectedTarget = assignmentTargets.find((target) => target.key === selectedTargetKey);
  const libraryDropdownOptions = decisionNodes.libraries.map((lib) => ({
    value: lib.library,
    label: lib.library,
    meta: `${lib.nodes.length} nodes`,
  }));
  const targetDropdownOptions = scopedTargets.map((target) => ({
    value: target.key,
    label: target.type === "time-block" ? target.label : `Row: ${target.label}`,
    meta: target.type === "time-block" ? "Timeline block" : "Case-note row",
  }));

  useEffect(() => {
    if (!scopedTargets.length) {
      setSelectedTargetKey("");
      return;
    }
    if (!scopedTargets.some((target) => target.key === selectedTargetKey)) {
      setSelectedTargetKey(scopedTargets[0].key);
    }
  }, [scopedTargets, selectedTargetKey]);

  const sections = selectedLibraryData.nodes.reduce((acc, node) => {
    const sectionKey = node.section || "Uncategorized";
    if (!acc[sectionKey]) {
      acc[sectionKey] = [];
    }
    acc[sectionKey].push(node);
    return acc;
  }, {});

  const allNodes = selectedLibraryData.nodes;
  const selectedCount = allNodes.filter((node) => checkedNodes[buildDecisionNodeSelectionKey(node)]).length;

  const toggleNode = (nodeKey) => {
    setCheckedNodes((prev) => ({
      ...prev,
      [nodeKey]: !prev[nodeKey],
    }));
  };

  const toggleSection = (sectionKey) => {
    const sectionNodes = sections[sectionKey] || [];
    const sectionSelected = sectionNodes.every((node) => checkedNodes[buildDecisionNodeSelectionKey(node)]);
    setCheckedNodes((prev) => {
      const next = { ...prev };
      sectionNodes.forEach((node) => {
        next[buildDecisionNodeSelectionKey(node)] = !sectionSelected;
      });
      return next;
    });
  };

  const addScheduleBlock = () => {
    if (newBlockEndHour <= newBlockStartHour) {
      return;
    }

    const nextBlock = {
      id: buildScheduleBlockId(newBlockStartHour, newBlockEndHour, timeBlocks.length),
      label: buildScheduleBlockLabel(newBlockStartHour, newBlockEndHour),
    };
    onScheduleChange?.([...timeBlocks, nextBlock]);
    setSelectedTargetKey(`time:${nextBlock.id}`);
  };

  const removeScheduleBlock = (blockId) => {
    const nextBlocks = timeBlocks.filter((block) => block.id !== blockId);
    onScheduleChange?.(nextBlocks);
    if (selectedTargetKey === `time:${blockId}`) {
      setSelectedTargetKey(nextBlocks[0] ? `time:${nextBlocks[0].id}` : "");
    }
  };

  const addRowTarget = () => {
    if (!String(newRowDescription).trim()) {
      return;
    }

    const selectedWorkflow = workflowOptions.find((option) => option.workflowId === newRowWorkflowId);
    const nextRow = {
      id: `case-note-custom-${rowTargets.length}`,
      description: String(newRowDescription).trim(),
      source: "Case Note",
      linkedFromCarePlan: true,
      workflowId: newRowWorkflowId,
      theme: selectedWorkflow?.theme || "behavior",
      score: "",
      comment: "",
    };
    onRowsChange?.([...rowTargets, nextRow]);
    setSelectedTargetKey(`row:${nextRow.id}`);
    setNewRowDescription("");
  };

  const removeRowTarget = (rowId) => {
    const nextRows = rowTargets.filter((row) => row.id !== rowId);
    onRowsChange?.(nextRows);
    if (selectedTargetKey === `row:${rowId}`) {
      setSelectedTargetKey(nextRows[0] ? `row:${nextRows[0].id}` : "");
    }
  };

  return (
    <Card title="Decision Engine Library" containerStyle={styles.decisionCard} bodyStyle={styles.decisionCardBody}>
      <View style={styles.decisionScheduleEditor}>
        <Text style={styles.decisionScheduleTitle}>Schedule Builder</Text>
        <Text style={styles.decisionScheduleLead}>
          Define the case-note timeline here, then assign questions to each block.
        </Text>
        <View style={[styles.decisionScheduleBuilderRow, isPhone && styles.decisionToolbarPhone]}>
          <View style={styles.decisionToolbarGroup}>
            <Text style={styles.decisionToolbarLabel}>Start</Text>
            <View style={styles.decisionOptionRow}>
              {SCHEDULE_START_HOUR_OPTIONS.map((hour) => (
                <Pressable
                  key={`start-${hour}`}
                  onPress={() => setNewBlockStartHour(hour)}
                  style={[
                    styles.decisionOptionButton,
                    newBlockStartHour === hour && styles.decisionOptionButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.decisionOptionText,
                      newBlockStartHour === hour && styles.decisionOptionTextActive,
                    ]}
                  >
                    {formatScheduleHourLabel(hour)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.decisionToolbarGroup}>
            <Text style={styles.decisionToolbarLabel}>End</Text>
            <View style={styles.decisionOptionRow}>
              {SCHEDULE_HOUR_OPTIONS.filter((hour) => hour > newBlockStartHour).map((hour) => (
                <Pressable
                  key={`end-${hour}`}
                  onPress={() => setNewBlockEndHour(hour)}
                  style={[
                    styles.decisionOptionButton,
                    newBlockEndHour === hour && styles.decisionOptionButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.decisionOptionText,
                      newBlockEndHour === hour && styles.decisionOptionTextActive,
                    ]}
                  >
                    {formatScheduleHourLabel(hour)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Pressable style={styles.decisionAssignButton} onPress={addScheduleBlock}>
            <Text style={styles.decisionAssignButtonText}>Add Block</Text>
          </Pressable>
        </View>
        <Text style={styles.decisionBuilderListLabel}>Timeline blocks</Text>
        <View style={styles.decisionScheduleChipRow}>
          {timeBlocks.map((block) => (
            <View key={block.id} style={styles.decisionScheduleChip}>
              <Text style={styles.decisionScheduleChipText}>{block.label}</Text>
              <Pressable style={styles.decisionScheduleChipAction} onPress={() => removeScheduleBlock(block.id)}>
                <Text style={styles.decisionScheduleChipRemove}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.decisionScheduleEditor}>
        <Text style={styles.decisionScheduleTitle}>Row Builder</Text>
        <Text style={styles.decisionScheduleLead}>
          Create the case-note rows themselves here, then assign markdown questions to them.
        </Text>
        <TextInput
          value={newRowDescription}
          onChangeText={setNewRowDescription}
          placeholder="Describe the row, e.g. Document toileting support and observed response for Mary Bet."
          placeholderTextColor="#888888"
          style={styles.decisionRowInput}
        />
        <View style={styles.decisionWorkflowChipRow}>
          {workflowOptions.map((option) => (
            <Pressable
              key={option.workflowId}
              onPress={() => setNewRowWorkflowId(option.workflowId)}
              style={[
                styles.decisionOptionButton,
                newRowWorkflowId === option.workflowId && styles.decisionOptionButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.decisionOptionText,
                  newRowWorkflowId === option.workflowId && styles.decisionOptionTextActive,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.decisionBuilderActionRow}>
          <Pressable style={styles.decisionAssignButton} onPress={addRowTarget}>
            <Text style={styles.decisionAssignButtonText}>Add Row</Text>
          </Pressable>
        </View>
        <Text style={styles.decisionBuilderListLabel}>Case-note rows</Text>
        <View style={styles.decisionScheduleChipRow}>
          {rowTargets.map((row) => (
            <View key={row.id} style={styles.decisionScheduleChip}>
              <Text style={styles.decisionScheduleChipText}>{row.description}</Text>
              <Pressable style={styles.decisionScheduleChipAction} onPress={() => removeRowTarget(row.id)}>
                <Text style={styles.decisionScheduleChipRemove}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </View>
      <View
        style={[
          styles.decisionAssignForm,
          activeDecisionDropdown ? styles.decisionAssignFormActive : null,
        ]}
      >
        <View style={[styles.decisionFormField, styles.decisionFormFieldLibrary]}>
          <Text style={styles.decisionToolbarLabel}>Library</Text>
          <DecisionDropdown
            value={selectedLibraryData.library}
            options={libraryDropdownOptions}
            placeholder="Select library"
            dropdownId="decision-library"
            activeDropdown={activeDecisionDropdown}
            onToggleDropdown={setActiveDecisionDropdown}
            onChange={setSelectedLibrary}
            fieldStyle={styles.decisionDropdownLibrary}
          />
        </View>

        <View style={[styles.decisionFormSplitRow, isPhone && styles.decisionFormSplitRowPhone]}>
          <View style={[styles.decisionFormFieldGrow, styles.decisionFormFieldMode]}>
            <Text style={styles.decisionToolbarLabel}>Mode</Text>
            <DecisionDropdown
              value={getDecisionOptionLabel(DECISION_MODE_OPTIONS, includeMode)}
              options={DECISION_MODE_OPTIONS}
              placeholder="Select mode"
              dropdownId="decision-mode"
              activeDropdown={activeDecisionDropdown}
              onToggleDropdown={setActiveDecisionDropdown}
              onChange={setIncludeMode}
              fieldStyle={styles.decisionDropdownMode}
            />
          </View>

          <View style={styles.decisionFormFieldDepth}>
            <Text style={styles.decisionToolbarLabel}>Depth</Text>
            <DecisionDropdown
              value={getDecisionOptionLabel(DECISION_DEPTH_OPTIONS, selectedDepth)}
              options={DECISION_DEPTH_OPTIONS}
              placeholder="Select depth"
              dropdownId="decision-depth"
              activeDropdown={activeDecisionDropdown}
              onToggleDropdown={setActiveDecisionDropdown}
              onChange={(value) => setSelectedDepth(Number(value))}
              fieldStyle={styles.decisionDropdownDepth}
            />
          </View>
        </View>

        <View style={[styles.decisionFormField, styles.decisionFormFieldTarget]}>
          <Text style={styles.decisionToolbarLabel}>Target</Text>
          <View style={styles.decisionTargetRow}>
            <DecisionDropdown
              value={getDecisionOptionLabel(DECISION_TARGET_TYPE_OPTIONS, targetType)}
              options={DECISION_TARGET_TYPE_OPTIONS}
              placeholder="Select target type"
              dropdownId="decision-target-type"
              activeDropdown={activeDecisionDropdown}
              onToggleDropdown={setActiveDecisionDropdown}
              onChange={setTargetType}
              fieldStyle={styles.decisionDropdownTargetType}
            />
            <DecisionDropdown
              value={
                selectedTarget && selectedTarget.type === targetType
                  ? selectedTarget.type === "time-block"
                    ? selectedTarget.label
                    : `Row: ${selectedTarget.label}`
                  : ""
              }
              options={targetDropdownOptions}
              placeholder={targetType === "time-block" ? "Select schedule block" : "Select case-note row"}
              dropdownId="decision-target"
              activeDropdown={activeDecisionDropdown}
              onToggleDropdown={setActiveDecisionDropdown}
              onChange={setSelectedTargetKey}
              fieldStyle={styles.decisionDropdownTargetValue}
            />
          </View>
        </View>
      </View>

      <View style={styles.decisionQuestionList}>
        <View style={styles.decisionSummaryRow}>
          <Text style={styles.decisionSummaryText}>{`${selectedLibraryData.library} • ${allNodes.length} nodes`}</Text>
          <Text style={styles.decisionSummaryText}>{`${selectedCount} selected`}</Text>
        </View>

        {Object.entries(sections).map(([sectionKey, sectionNodes]) => (
          <View key={sectionKey} style={styles.decisionSectionCard}>
          <Pressable onPress={() => toggleSection(sectionKey)} style={styles.decisionSectionHeader}>
            <Text style={styles.decisionSectionTitle}>{sectionKey}</Text>
            <Text style={styles.decisionSectionMeta}>{`${sectionNodes.length} questions`}</Text>
          </Pressable>
          {selectedDepth >= 2 ? (
            sectionNodes.map((node) => (
              <Pressable
                key={buildDecisionNodeSelectionKey(node)}
                onPress={() => toggleNode(buildDecisionNodeSelectionKey(node))}
                style={styles.decisionNodeRow}
              >
                <View
                  style={[
                    styles.decisionNodeCheckbox,
                    checkedNodes[buildDecisionNodeSelectionKey(node)] && styles.decisionNodeCheckboxActive,
                  ]}
                >
                  <Text style={styles.decisionNodeCheckboxLabel}>
                    {checkedNodes[buildDecisionNodeSelectionKey(node)] ? "✓" : ""}
                  </Text>
                </View>
                <View style={styles.decisionNodeContent}>
                  <Text style={styles.decisionNodeTitle}>{node.title || node.id}</Text>
                  {node.question ? <Text style={styles.decisionNodeQuestion}>{node.question}</Text> : null}
                  {node.conditions?.length ? (
                    <View style={styles.decisionConditionList}>
                      {node.conditions.map((condition) => (
                        <Text key={condition} style={styles.decisionConditionBadge}>
                          {condition}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                  <View style={styles.decisionNodeFinalRow}>
                    <Pressable
                      onPress={() =>
                        setIncludeInFinalMap((p) => ({
                          ...p,
                          [buildDecisionNodeSelectionKey(node)]: !p[buildDecisionNodeSelectionKey(node)],
                        }))
                      }
                      style={[
                        styles.includeFinalToggle,
                        includeInFinalMap[buildDecisionNodeSelectionKey(node)] && styles.includeFinalToggleActive,
                      ]}
                    >
                      <Text style={styles.includeFinalToggleText}>
                        {includeInFinalMap[buildDecisionNodeSelectionKey(node)] ? "Included in final" : "Exclude from final"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            ))
          ) : null}
        </View>
        ))}
      </View>
      <View style={styles.decisionAssignRow}>
        <Pressable
            onPress={() => {
            const selectedKeys = Object.keys(checkedNodes).filter((key) => checkedNodes[key]);
            const payload = selectedKeys.map((key) => ({ key, includeInFinal: Boolean(includeInFinalMap[key]) }));
            const selectedTarget = assignmentTargets.find((target) => target.key === selectedTargetKey);
            if (!selectedTarget) return;
            if (onAssignToCaseNote) {
              onAssignToCaseNote(payload, selectedTarget, {
                selectedDepth,
                includeMode,
                selectedLibrary,
              });
            }
          }}
          style={styles.decisionAssignButton}
        >
          <Text style={styles.decisionAssignButtonText}>Assign Selected Questions</Text>
        </Pressable>
      </View>
    </Card>
  );
}

function Card({ title, rightAccessory, children, bodyStyle, containerStyle }) {
  return (
    <View style={[styles.card, containerStyle]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardHeaderText}>{title}</Text>
        {rightAccessory ?? null}
      </View>
      {children ? <View style={[styles.cardBody, bodyStyle]}>{children}</View> : null}
    </View>
  );
}

function DataTable({ columns, rows }) {
  return (
    <View>
      <View style={styles.tableHeaderRow}>
        {columns.map((column) => (
          <Text key={column.key} style={[styles.tableHeaderCell, { flex: column.flex || 1 }]}>
            {column.label}
          </Text>
        ))}
      </View>
      {rows.map((row, index) => (
        <View key={`${row[columns[0].key]}-${index}`} style={styles.tableBodyRow}>
          {columns.map((column) => (
            <Text key={column.key} style={[styles.tableBodyCell, { flex: column.flex || 1 }]}>
              {row[column.key]}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function CarePlanPill({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.carePlanPill, active && styles.carePlanPillActive]}>
      <Text style={[styles.carePlanPillText, active && styles.carePlanPillTextActive]}>{label}</Text>
    </Pressable>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <View style={styles.carePlanSectionCard}>
      <View style={styles.carePlanSectionHead}>
        <Text style={styles.carePlanSectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.carePlanSectionSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.carePlanSectionBody}>{children}</View>
    </View>
  );
}

function RiskCard({ item, expanded, onToggle }) {
  const severityStyle =
    item.severity === "High"
      ? styles.riskHigh
      : item.severity === "Medium"
        ? styles.riskMedium
        : styles.riskLow;

  return (
    <Pressable onPress={onToggle} style={styles.riskCard}>
      <View style={styles.riskCardHeader}>
        <View style={styles.riskTitleWrap}>
          <View style={[styles.riskSeverityDot, severityStyle]} />
          <Text style={styles.riskCardTitle}>{item.title}</Text>
        </View>
        <Text style={styles.riskSeverityText}>{item.severity}</Text>
      </View>
      <Text style={styles.riskSummary}>{item.notes}</Text>
      {expanded ? <Text style={styles.riskGuidance}>{item.guidance}</Text> : null}
    </Pressable>
  );
}

function ServiceCard({ item }) {
  return (
    <View style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <Text style={styles.serviceTitle}>{item.title}</Text>
        <View style={styles.serviceBadge}>
          <Text style={styles.serviceBadgeText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.serviceMeta}>{item.provider}</Text>
      <Text style={styles.serviceMeta}>{item.funding}</Text>
      <Text style={styles.serviceMeta}>{item.dateRange}</Text>
      <Text style={styles.serviceDetail}>{item.detail}</Text>
    </View>
  );
}

function WorkflowChip({ label, onPress }) {
  const content = (
    <View style={styles.workflowChip}>
      <Text style={styles.workflowChipText}>{label}</Text>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return <Pressable onPress={onPress}>{content}</Pressable>;
}

function ActionPlanCard({ plan, expandedRowKey, onToggleRow, isPhone, onOpenDocumentation }) {
  return (
    <View style={styles.actionPlanCard}>
      <Text style={styles.actionPlanLabel}>{plan.title}</Text>
      <View style={styles.outcomeBanner}>
        <Text style={styles.outcomeBannerLabel}>Desired Outcome</Text>
        <Text style={styles.outcomeBannerText}>{plan.outcome}</Text>
        <Pressable
          onPress={() =>
            onOpenDocumentation?.({
              title: "Action Plan Documentation",
              program: plan.title,
            })
          }
          style={styles.outcomeDocumentLink}
        >
          <Text style={styles.outcomeDocumentLinkText}>Document measurable outcome</Text>
        </Pressable>
      </View>
      <View style={styles.issueCard}>
        <Text style={styles.issueLabel}>Need / Issue</Text>
        <Text style={styles.issueText}>{plan.issue}</Text>
      </View>
      {isPhone ? (
        <View style={styles.actionPlanMobileStack}>
          {plan.steps.map((step, index) => (
            <View key={`${plan.title}-mobile-${index}`} style={styles.actionPlanMobileCard}>
              <Text style={styles.mobileStepTitle}>{step.step}</Text>
              <Text style={styles.mobileStepMeta}>{step.responsible}</Text>
              <Text style={styles.mobileStepMeta}>{step.frequency}</Text>
              <Text style={styles.mobileStepMeta}>{step.record}</Text>
              <Text style={styles.mobileStepNotes}>{step.notes}</Text>
              <View style={styles.workflowRow}>
                {["Shift Note", "Quick Doc"].map((chip) => (
                  <WorkflowChip
                    key={`${plan.title}-${index}-${chip}`}
                    label={chip}
                    onPress={() =>
                      onOpenDocumentation?.({
                        title: chip === "Shift Note" ? "Add Shift Note" : "Daily Documentation",
                        program: plan.title,
                      })
                    }
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.actionPlanTable}>
          <View style={styles.actionPlanTableHeader}>
            {actionPlanColumns.map((column) => (
              <Text key={column.key} style={[styles.actionPlanTableHeaderCell, { flex: column.flex }]}>
                {column.label}
              </Text>
            ))}
          </View>
          {plan.steps.map((step, index) => {
            const rowKey = `${plan.title}-${index}`;
            const expanded = expandedRowKey === rowKey;
            return (
              <View key={rowKey} style={[styles.actionPlanTableRow, expanded && styles.actionPlanTableRowActive]}>
                <View style={[styles.actionPlanTableCell, { flex: actionPlanColumns[0].flex }]}>
                  <Text style={styles.actionPlanCellText}>{step.step}</Text>
                  <View style={styles.workflowRow}>
                    {["Shift Note", "Quick Doc"].map((chip) => (
                      <WorkflowChip
                        key={`${rowKey}-${chip}`}
                        label={chip}
                        onPress={() =>
                          onOpenDocumentation?.({
                            title: chip === "Shift Note" ? "Add Shift Note" : "Daily Documentation",
                            program: plan.title,
                          })
                        }
                      />
                    ))}
                  </View>
                </View>
                <Text style={[styles.actionPlanTableCell, styles.actionPlanCellText, { flex: actionPlanColumns[1].flex }]}>
                  {step.responsible}
                </Text>
                <Text style={[styles.actionPlanTableCell, styles.actionPlanCellText, { flex: actionPlanColumns[2].flex }]}>
                  {step.frequency}
                </Text>
                <Text style={[styles.actionPlanTableCell, styles.actionPlanCellText, { flex: actionPlanColumns[3].flex }]}>
                  {step.record}
                </Text>
                <Pressable
                  onPress={() => onToggleRow(expanded ? null : rowKey)}
                  style={[styles.actionPlanTableCell, styles.notesCell, { flex: actionPlanColumns[4].flex }]}
                >
                  <Text numberOfLines={expanded ? undefined : 3} style={styles.actionPlanCellText}>
                    {step.notes}
                  </Text>
                  <Text style={styles.notesExpandText}>{expanded ? "Show less" : "Expand notes"}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function CarePlanDocument({
  isPhone,
  onOpenDocumentation,
  documentationSession,
  onDocumentationUpdate,
  onDocumentationCancel,
  clientProfile = null,
  clientPhoto,
}) {
  const header = clientProfile?.carePlanHeader ?? carePlanHeader;
  const aboutCards = clientProfile?.aboutMeCards ?? aboutMeCards;
  const risks = clientProfile?.riskCards ?? riskCards;
  const supports = clientProfile?.supportCards ?? supportCards;
  const services = clientProfile?.serviceCards ?? serviceCards;
  const rights = clientProfile?.rightsCards ?? rightsCards;
  const activities = clientProfile?.activityCards ?? activityCards;
  const plans = clientProfile?.actionPlans ?? actionPlans;
  const checklist = clientProfile?.documentChecklist ?? documentChecklist;
  const files = clientProfile?.documentFiles ?? documentFiles;
  const roster = clientProfile?.participants ?? participants;
  const signatures = clientProfile?.signatureLogs ?? signatureLogs;
  const sourcePages = clientProfile?.carePlanTextPages ?? carePlanText;
  const [activeTab, setActiveTab] = useState("Overview");
  const [expandedRisk, setExpandedRisk] = useState(risks[0]?.title ?? "Falls");
  const [expandedSourcePage, setExpandedSourcePage] = useState(1);
  const [expandedActionRow, setExpandedActionRow] = useState(null);
  const scrollRef = useRef(null);
  const sectionPositions = useRef({});

  const registerSection = (key, y) => {
    sectionPositions.current[key] = y;
  };

  const jumpToSection = (key) => {
    setActiveTab(key);
    const y = sectionPositions.current[key];
    if (scrollRef.current && typeof y === "number") {
      scrollRef.current.scrollTo({ y: Math.max(y - 16, 0), animated: true });
    }
  };

  const handleScroll = (event) => {
    const y = event.nativeEvent.contentOffset.y + 40;
    const orderedSections = carePlanTabs
      .map((tab) => ({ tab, y: sectionPositions.current[tab] }))
      .filter((item) => typeof item.y === "number")
      .sort((a, b) => a.y - b.y);

    let currentTab = orderedSections[0]?.tab ?? "Overview";
    for (const section of orderedSections) {
      if (y >= section.y) {
        currentTab = section.tab;
      } else {
        break;
      }
    }

    if (currentTab !== activeTab) {
      setActiveTab(currentTab);
    }
  };

  return (
    <View style={styles.carePlanShell}>
      <View style={styles.carePlanHero}>
        <View style={styles.carePlanHeroLeft}>
          <Image source={clientPhoto} style={styles.carePlanHeroPhoto} resizeMode="cover" />
          <View style={styles.carePlanHeroIdentity}>
            <Text style={styles.carePlanHeroName}>{header.fullName}</Text>
            <Text style={styles.carePlanHeroMeta}>{`Medicaid ID: ${header.medicaidId}`}</Text>
            <Text style={styles.carePlanHeroMeta}>{`DOB: ${header.dob}`}</Text>
            <Text style={styles.carePlanHeroMeta}>{`Oversight ID: ${header.oversightId}`}</Text>
          </View>
        </View>
        <View style={styles.carePlanHeroRight}>
          <Text style={styles.carePlanStatus}>{header.status}</Text>
          <Text style={styles.carePlanHeroMeta}>{`Guardian: ${header.guardian}`}</Text>
          <Text style={styles.carePlanHeroMeta}>{`Plan: ${header.planStart} to ${header.planEnd}`}</Text>
          <View style={styles.quickActions}>
            {["Print Summary", "Add Shift Note", "View Docs"].map((label) => (
              <Pressable
                key={label}
                style={styles.quickActionButton}
                onPress={() => {
                  if (label === "Add Shift Note") {
                    onOpenDocumentation?.({
                      title: "Add Shift Note",
                      program: "Daily Documentation & Goals",
                    });
                  }
                }}
              >
                <Text style={styles.quickActionText}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carePlanPillRow}>
        {carePlanTabs.map((tab) => (
          <CarePlanPill key={tab} label={tab} active={activeTab === tab} onPress={() => jumpToSection(tab)} />
        ))}
      </ScrollView>
      {documentationSession ? (
        <DocumentationEntryScreen
          key={`${clientProfile?.id || "client"}-${documentationSession.sessionType}-${documentationSession.title}`}
          session={documentationSession}
          onUpdate={onDocumentationUpdate}
          onCancel={onDocumentationCancel}
          isPhone={isPhone}
          clientProfile={clientProfile}
          onOpenDecisionAssignment={openDecisionAssignmentTarget}
        />
      ) : (
      <ScrollView
        ref={scrollRef}
        style={styles.carePlanContentScroller}
        contentContainerStyle={styles.carePlanContentScrollerInner}
        nestedScrollEnabled
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View onLayout={(event) => registerSection("Overview", event.nativeEvent.layout.y)}>
          <SectionCard title="Overview" subtitle="Modern AI-enhanced Therap-style care plan viewer">
            <View style={styles.overviewGrid}>
              {[
                { label: "Narrative sections", value: "4 person-centered summaries" },
                { label: "Risk profiles", value: `${risks.length} active risk cards` },
                { label: "Service supports", value: `${services.length} approved services` },
                { label: "Action plans", value: `${plans.length} measurable plan sets` },
              ].map((item) => (
                <View key={item.label} style={styles.overviewStat}>
                  <Text style={styles.overviewStatLabel}>{item.label}</Text>
                  <Text style={styles.overviewStatValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </SectionCard>
        </View>

        <View onLayout={(event) => registerSection("About Me", event.nativeEvent.layout.y)}>
          <SectionCard title="About Me" subtitle="Narrative support information from the care plan">
            <View style={styles.narrativeGrid}>
              {aboutCards.map((card) => (
                <View key={card.title} style={styles.narrativeCard}>
                  <Text style={styles.narrativeCardTitle}>{card.title}</Text>
                  <Text style={styles.narrativeCardBody}>{card.body}</Text>
                </View>
              ))}
            </View>
          </SectionCard>
        </View>

        <View onLayout={(event) => registerSection("Risks", event.nativeEvent.layout.y)}>
          <SectionCard title="Risks" subtitle="Collapsible clinical risk cards with staff guidance">
            <View style={styles.riskGrid}>
              {risks.map((item) => (
                <RiskCard
                  key={item.title}
                  item={item}
                  expanded={expandedRisk === item.title}
                  onToggle={() => setExpandedRisk(expandedRisk === item.title ? null : item.title)}
                />
              ))}
            </View>
          </SectionCard>
        </View>

        <View onLayout={(event) => registerSection("Supports", event.nativeEvent.layout.y)}>
          <SectionCard title="Supports" subtitle="Home, community, ADLs, and communication supports">
            <View style={styles.narrativeGrid}>
              {supports.map((card) => (
                <View key={card.title} style={styles.narrativeCard}>
                  <Text style={styles.narrativeCardTitle}>{card.title}</Text>
                  <Text style={styles.narrativeCardBody}>{card.body}</Text>
                </View>
              ))}
            </View>
          </SectionCard>
        </View>

        <View onLayout={(event) => registerSection("Services", event.nativeEvent.layout.y)}>
          <SectionCard title="Services" subtitle="Service supports transformed from authorization tables">
            <View style={styles.serviceToolbar}>
              <View style={styles.serviceSearchBox}>
                <Text style={styles.serviceSearchText}>Filter/search services</Text>
              </View>
              <View style={styles.serviceLegend}>
                <Text style={styles.serviceLegendText}>Active</Text>
                <Text style={styles.serviceLegendDivider}>|</Text>
                <Text style={styles.serviceLegendText}>Approved</Text>
              </View>
            </View>
            <View style={styles.serviceGrid}>
              {services.map((item) => (
                <ServiceCard key={`${item.title}-${item.dateRange}`} item={item} />
              ))}
            </View>
          </SectionCard>
        </View>

        <View onLayout={(event) => registerSection("Rights", event.nativeEvent.layout.y)}>
          <SectionCard title="Rights & Decision Making" subtitle="Decision authority, ANE education, and directives">
            <View style={styles.narrativeGrid}>
              {rights.map((card) => (
                <View key={card.title} style={styles.narrativeCard}>
                  <Text style={styles.narrativeCardTitle}>{card.title}</Text>
                  <Text style={styles.narrativeCardBody}>{card.body}</Text>
                </View>
              ))}
            </View>
          </SectionCard>
        </View>

        <View onLayout={(event) => registerSection("Activities", event.nativeEvent.layout.y)}>
          <SectionCard title="Community Activities" subtitle="Current activities and support needs in the community">
            <View style={styles.narrativeGrid}>
              {activities.map((card) => (
                <View key={card.title} style={styles.narrativeCard}>
                  <Text style={styles.narrativeCardTitle}>{card.title}</Text>
                  <Text style={styles.narrativeCardBody}>{card.body}</Text>
                </View>
              ))}
            </View>
          </SectionCard>
        </View>

        <View onLayout={(event) => registerSection("Action Plans", event.nativeEvent.layout.y)}>
          <SectionCard title="Action Plans" subtitle="Measurable outcomes, exact compliance structure, improved usability">
            <View style={styles.actionPlanStack}>
              {plans.map((plan) => (
                <ActionPlanCard
                  key={plan.title}
                  plan={plan}
                  expandedRowKey={expandedActionRow}
                  onToggleRow={setExpandedActionRow}
                  isPhone={isPhone}
                  onOpenDocumentation={onOpenDocumentation}
                />
              ))}
            </View>
          </SectionCard>
        </View>

        <View onLayout={(event) => registerSection("Documents", event.nativeEvent.layout.y)}>
          <SectionCard title="Documents" subtitle="Documentation checklists and referenced files">
            <View style={styles.documentGrid}>
              <View style={styles.documentChecklistCard}>
                <Text style={styles.documentSubhead}>Documentation Checklists</Text>
                {checklist.map((item) => (
                  <View key={item} style={styles.documentChecklistRow}>
                    <View style={styles.documentCheckbox} />
                    <Text style={styles.documentChecklistText}>{item}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.documentChecklistCard}>
                <Text style={styles.documentSubhead}>Referenced Attachments</Text>
                {files.map((item) => (
                  <Text key={item} style={styles.documentFileText}>
                    {item}
                  </Text>
                ))}
              </View>
            </View>
          </SectionCard>
        </View>

        <View onLayout={(event) => registerSection("Participants", event.nativeEvent.layout.y)}>
          <SectionCard title="Participants & Signature Logs" subtitle="Plan participants and acknowledgement trail">
            <View style={styles.participantTable}>
              <View style={styles.participantHeader}>
                <Text style={[styles.participantHeaderCell, { flex: 1.3 }]}>Participant</Text>
                <Text style={[styles.participantHeaderCell, { flex: 1.4 }]}>Relationship</Text>
                <Text style={[styles.participantHeaderCell, { flex: 0.7 }]}>Copy</Text>
              </View>
              {roster.map((item) => (
                <View key={item.name} style={styles.participantRow}>
                  <Text style={[styles.participantCell, { flex: 1.3 }]}>{item.name}</Text>
                  <Text style={[styles.participantCell, { flex: 1.4 }]}>{item.relationship}</Text>
                  <Text style={[styles.participantCell, { flex: 0.7 }]}>{item.copy}</Text>
                </View>
              ))}
            </View>
            <View style={styles.signatureList}>
              {signatures.map((item) => (
                <Text key={item} style={styles.signatureItem}>
                  {`• ${item}`}
                </Text>
              ))}
            </View>
          </SectionCard>
        </View>

        <View onLayout={(event) => registerSection("Source Pages", event.nativeEvent.layout.y)}>
          <SectionCard title="Full Source Pages" subtitle="Complete OCR extract retained so all PDF content remains available">
            <View style={styles.sourcePageStack}>
              {sourcePages.map((page) => {
                const isExpanded = expandedSourcePage === page.page;
                return (
                  <View key={`source-page-${page.page}`} style={styles.sourcePageCard}>
                    <Pressable
                      onPress={() => setExpandedSourcePage(isExpanded ? null : page.page)}
                      style={styles.sourcePageHeader}
                    >
                      <Text style={styles.sourcePageTitle}>{`Source Page ${page.page}`}</Text>
                      <Text style={styles.sourcePageToggle}>{isExpanded ? "Hide" : "Show"}</Text>
                    </Pressable>
                    {isExpanded ? <Text style={styles.sourcePageText}>{page.text}</Text> : null}
                  </View>
                );
              })}
            </View>
          </SectionCard>
        </View>
      </ScrollView>
      )}
    </View>
  );
}

export default function App() {
  const { width } = useWindowDimensions();
  const isTablet = width < 1200;
  const isPhone = width < 820;
  const horizontalPadding = isPhone ? 12 : isTablet ? 18 : 30;
  const leftWidth = isPhone ? "100%" : isTablet ? 300 : 380;
  const rightWidth = isPhone ? "100%" : isTablet ? 220 : 250;
  const nameSize = isPhone ? 24 : isTablet ? 28 : 34;
  const topRightSize = isPhone ? 14 : isTablet ? 16 : 20;
  const topTitleSize = isPhone ? 22 : isTablet ? 28 : 34;
  const homeLabelSize = isPhone ? 16 : isTablet ? 20 : 22;
  const [selectedModule, setSelectedModule] = useState(null);
  const [documentationSession, setDocumentationSession] = useState(null);
  const [activeClientId, setActiveClientId] = useState("mary-bet");
  const [individualQuery, setIndividualQuery] = useState("Mary Bet");
  const [showIndividualSuggestions, setShowIndividualSuggestions] = useState(false);
  const [hoveredClientSuggestionId, setHoveredClientSuggestionId] = useState(null);
  const [pendingDecisionAssignmentTarget, setPendingDecisionAssignmentTarget] = useState(null);
  const activeClientProfile =
    activeClientId === "mary-bet" ? null : getClientById(activeClientId) || getMarkBrentProfile();
  const activeClientPhoto = activeClientId === "mark-brent" ? markBrentProfilePhoto : maryBetProfilePhoto;
  const activeDisplayName = activeClientProfile?.displayName ?? patientDisplayName;
  const activeIspRows = activeClientProfile?.ispRows ?? ispRows;
  const clientSuggestions = searchClients(individualQuery);
  const showCarePlan = selectedModule === "Care Plan";
  const showDecisionEngine = selectedModule === "Decision Engine";
  const defaultCaseNoteTemplate = createDocumentationSession({
    title: "Case Note (Decision Engine)",
    program: "Case Note",
    sessionType: "case-note",
    clientProfile: activeClientProfile,
  });
  const [decisionEngineTimeBlocks, setDecisionEngineTimeBlocks] = useState(defaultCaseNoteTemplate.timeBlocks);
  const [decisionEngineRows, setDecisionEngineRows] = useState(defaultCaseNoteTemplate.rows);
  const workspaceStatus = documentationSession
    ? documentationSession.title
    : showCarePlan
      ? activeClientProfile?.carePlanHeader?.status ?? "Plan Approved"
      : activeClientProfile?.workspaceStatus ?? "Admitted";
  const workspaceTab = documentationSession ? "Documentation" : showCarePlan ? "Care Plan" : showDecisionEngine ? "Decision Engine" : "Home";

  useEffect(() => {
    if (!showIndividualSuggestions) {
      setHoveredClientSuggestionId(null);
    }
  }, [showIndividualSuggestions]);

  useEffect(() => {
    setDecisionEngineTimeBlocks(defaultCaseNoteTemplate.timeBlocks);
    setDecisionEngineRows(defaultCaseNoteTemplate.rows);
  }, [activeClientId]);

  const handleSelectClient = (clientId) => {
    setActiveClientId(clientId);
    const selectedClient = CLIENT_ROSTER.find((client) => client.id === clientId);
    setIndividualQuery(selectedClient?.displayName ?? "");
    setShowIndividualSuggestions(false);
    setDocumentationSession(null);
    setSelectedModule(null);
  };

  const handleGoToClient = () => {
    const normalized = individualQuery.trim().toLowerCase();
    if (!normalized) {
      return;
    }

    const exactMatch = CLIENT_ROSTER.find((client) => client.displayName.toLowerCase() === normalized);
    if (exactMatch) {
      handleSelectClient(exactMatch.id);
      return;
    }

    const firstMatch = clientSuggestions[0];
    if (firstMatch) {
      handleSelectClient(firstMatch.id);
    }
  };

  const handleChooseClientSuggestion = (client) => {
    setIndividualQuery(client.displayName);
    handleSelectClient(client.id);
  };

  const openDocumentation = (config) => {
    const timeBlocksOverride =
      config.sessionType === "case-note" ? decisionEngineTimeBlocks : null;
    const rowsOverride =
      config.sessionType === "case-note" ? decisionEngineRows : null;
    setDocumentationSession(
      createDocumentationSession({
        ...config,
        clientProfile: activeClientProfile,
        timeBlocksOverride,
        rowsOverride,
      })
    );
  };

  const handleModuleSelect = (item) => {
    setSelectedModule(item);

    if (item === "Care Plan") {
      setDocumentationSession(null);
      return;
    }

    if (item === "Decision Engine") {
      setDocumentationSession(null);
      setPendingDecisionAssignmentTarget(null);
      return;
    }

    if (item === "Case Note") {
      openDocumentation({ title: "Case Note Entry", program: "Case Note", sessionType: "case-note" });
      return;
    }

    if (item === "ISP Data") {
      openDocumentation({ title: "ISP Data Entry", program: "ISP Data" });
      return;
    }

    if (item === "Individual Plan" || item === "Individual Plan Agenda") {
      openDocumentation({ title: "Daily Documentation", program: "Daily Documentation & Goals" });
    }
  };

  const handleIspProgramPress = (row) => {
    if (!row.name.toLowerCase().includes("daily documentation")) {
      return;
    }

    setSelectedModule("ISP Data");
    openDocumentation({
      title: "Daily Documentation",
      program: row.name,
    });
  };

  const handleAssignToCaseNote = (selectedNodesPayload = [], target = null, options = {}) => {
    const selectedNodes = expandAssignedDecisionNodes(selectedNodesPayload, options);
    if (!target) {
      return;
    }

    const baseSession = createDocumentationSession({
      title: "Case Note (Decision Engine)",
      program: "Case Note",
      sessionType: "case-note",
      clientProfile: activeClientProfile,
      timeBlocksOverride: decisionEngineTimeBlocks,
      rowsOverride: decisionEngineRows,
    });

    // create readable bullet list of assigned questions and includeInFinal flags
    const assignedText = selectedNodes
      .map((n, i) => {
        const flag = Boolean(n.includeInFinal);
        return `${flag ? "[FINAL] " : ""}- ${n.question || n.title || n.id}`;
      })
      .join("\n");
    const assignedNodeConfig = {
      selectedDepth: options.selectedDepth || 1,
      includeMode: options.includeMode || "selective-branch",
      selectedLibrary: options.selectedLibrary || "",
      targetType: target.type,
      targetId: target.targetId,
    };
    const mappedAssignedNodes = selectedNodes.map((n) => ({
      id: n.id,
      title: n.title,
      question: n.question,
      choices: n.choices || [],
      section: n.section,
      library: n.library,
      stepKey: n.stepKey,
      includeInFinal: Boolean(n.includeInFinal),
      assignmentDepth: n.assignmentDepth,
      includeMode: n.includeMode,
    }));

    const session = {
      ...baseSession,
      title: baseSession.title,
      // attach assigned nodes to the selected target and include metadata
      timeBlocks: baseSession.timeBlocks.map((block) =>
        target.type === "time-block" && block.id === target.targetId
          ? {
              ...block,
              comment: "",
              assignedNodes: mappedAssignedNodes,
              assignedNodeSummary: assignedText,
              assignedNodeConfig,
            }
          : block
      ),
      rows: baseSession.rows.map((row) =>
        target.type === "case-note-row" && row.id === target.targetId
          ? {
              ...row,
              comment: "",
              assignedNodes: mappedAssignedNodes,
              assignedNodeSummary: assignedText,
              assignedNodeConfig,
            }
          : row
      ),
    };

    setDocumentationSession(session);
    setSelectedModule("Case Note");
    setPendingDecisionAssignmentTarget(null);
    setDecisionEngineTimeBlocks(session.timeBlocks.map(({ id, label }) => ({ id, label })));
    setDecisionEngineRows(session.rows);

    // persist assignment to server for reuse
    try {
      fetch(`${docuWraiteApiBaseUrl}/api/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: activeClientId,
          target,
          assigned:
            target.type === "time-block"
              ? session.timeBlocks.find((entry) => entry.id === target.targetId)?.assignedNodes || []
              : session.rows.find((entry) => entry.id === target.targetId)?.assignedNodes || [],
          assignedNodeConfig,
          updatedAt: new Date().toISOString(),
        }),
      }).catch(() => {});
    } catch (e) {}
  };

  const openDecisionAssignmentTarget = (target) => {
    if (!target) {
      return;
    }

    setPendingDecisionAssignmentTarget(target);
    setSelectedModule("Decision Engine");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
        <View style={[styles.page, { paddingHorizontal: horizontalPadding }]}>
          <View style={[styles.topbar, isPhone && styles.topbarPhone]}>
            <View style={styles.topLeft}>
              <Text style={[styles.logo, { fontSize: topTitleSize }]}>DocuProblem</Text>
            </View>
            <View style={[styles.topRight, isPhone && styles.topRightPhone]}>
              <View style={styles.topUser}>
                <Image source={userProfilePhoto} style={styles.topUserPhoto} resizeMode="cover" />
                <Text style={[styles.topRightText, { fontSize: topRightSize }]}>{loggedInUser}</Text>
              </View>
              <Text style={[styles.topRightText, { fontSize: topRightSize }]}>Logout</Text>
            </View>
          </View>

          <View style={[styles.layout, isTablet && styles.layoutTablet, isPhone && styles.layoutPhone]}>
            <View style={[styles.leftColumn, { width: leftWidth }]}>
              <View style={styles.avatar}>
                <Image source={activeClientPhoto} style={styles.avatarImage} resizeMode="cover" />
              </View>

              <Card title="Modules">
                <View style={styles.moduleList}>
                  {modules.map((item) => {
                    const isCarePlan = item === "Care Plan";
                    const isSelected = selectedModule === item;
                    const moduleColor = isSelected
                      ? colors.headerText
                      : isCarePlan
                        ? colors.link
                        : colors.muted;

                    return (
                      <Pressable
                        key={item}
                        onPress={() => handleModuleSelect(item)}
                        style={styles.modulePressable}
                      >
                        <View style={styles.moduleRow}>
                          <Feather name="chevron-right" size={14} color={moduleColor} style={styles.moduleIcon} />
                          <Text
                            style={[
                              styles.moduleItem,
                              isCarePlan && styles.moduleItemAction,
                              isSelected && styles.moduleItemActive,
                            ]}
                          >
                            {item}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </Card>

              <Card
                title="Go To"
                rightAccessory={<Feather name="chevron-down" size={18} color={colors.headerText} />}
              />

              <Card
                title="View PDFs"
                rightAccessory={<Feather name="maximize-2" size={16} color={colors.headerText} />}
              >
                <View style={styles.pdfList}>
                  {pdfs.map((item) => (
                    <View key={item} style={styles.pdfRow}>
                      <Text style={styles.pdfItem}>{item}</Text>
                      <Feather name="external-link" size={15} color={colors.link} style={styles.pdfLinkIcon} />
                    </View>
                  ))}
                </View>
              </Card>
            </View>

            <View style={styles.mainColumn}>
              <View style={styles.profileHead}>
                <View style={[styles.nameRow, isPhone && styles.nameRowPhone]}>
                  <Text style={[styles.name, { fontSize: nameSize }]}>{activeDisplayName}</Text>
                  <View style={[styles.switchBox, isPhone && styles.switchBoxPhone]}>
                    <View style={styles.switchInputRow}>
                      <TextInput
                        style={styles.switchInput}
                        value={individualQuery}
                        onChangeText={(text) => {
                          setIndividualQuery(text);
                          setShowIndividualSuggestions(true);
                        }}
                        onFocus={() => setShowIndividualSuggestions(true)}
                        onBlur={() => {
                          setTimeout(() => setShowIndividualSuggestions(false), 150);
                        }}
                        onSubmitEditing={handleGoToClient}
                        placeholder="Switch Individual"
                        placeholderTextColor={colors.placeholder}
                      />
                      <Pressable style={styles.switchGoButton} onPress={handleGoToClient}>
                        <Feather name="arrow-right-circle" size={18} color="#ffffff" />
                      </Pressable>
                    </View>
                    {showIndividualSuggestions && clientSuggestions.length > 0 ? (
                      <View style={styles.switchSuggestions}>
                        {clientSuggestions.map((client) => (
                          <Pressable
                            key={client.id}
                            style={[
                              styles.switchSuggestionRow,
                              hoveredClientSuggestionId === client.id && styles.switchSuggestionRowHover,
                            ]}
                            onHoverIn={() => setHoveredClientSuggestionId(client.id)}
                            onHoverOut={() => setHoveredClientSuggestionId(null)}
                            onPressIn={() => handleChooseClientSuggestion(client)}
                            onPress={() => handleChooseClientSuggestion(client)}
                          >
                            <View style={styles.switchSuggestionHitArea}>
                              <Text style={styles.switchSuggestionText}>{client.displayName}</Text>
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    ) : null}
                  </View>
                </View>
                <Text style={styles.admitted}>{workspaceStatus}</Text>
                <View style={[styles.tabs, isPhone && styles.tabsPhone]}>
                  <View style={styles.activeTab}>
                    <Text style={styles.activeTabText}>{workspaceTab}</Text>
                  </View>
                  {["Profile", "Plans", "Case Status", "About Me"].map((tab) => (
                    <Text key={tab} style={styles.tabText}>
                      {tab}
                    </Text>
                  ))}
                </View>
              </View>

              {showDecisionEngine ? (
                <DecisionEngineScreen
                  key="decision-engine"
                  isPhone={isPhone}
                  onAssignToCaseNote={handleAssignToCaseNote}
                  timeBlocks={
                    documentationSession?.sessionType === "case-note"
                      ? documentationSession.timeBlocks.map(({ id, label }) => ({ id, label }))
                      : decisionEngineTimeBlocks
                  }
                  rowTargets={
                    documentationSession?.sessionType === "case-note"
                      ? documentationSession.rows
                      : decisionEngineRows
                  }
                  initialTargetKey={pendingDecisionAssignmentTarget?.key || ""}
                  onScheduleChange={setDecisionEngineTimeBlocks}
                  onRowsChange={setDecisionEngineRows}
                />
              ) : showCarePlan ? (
                <CarePlanDocument
                  key={activeClientId}
                  isPhone={isPhone}
                  onOpenDocumentation={openDocumentation}
                  documentationSession={documentationSession}
                  onDocumentationUpdate={setDocumentationSession}
                  onDocumentationCancel={() => setDocumentationSession(null)}
                  clientProfile={activeClientProfile}
                  clientPhoto={activeClientPhoto}
                />
              ) : documentationSession ? (
                <DocumentationEntryScreen
                  key={`${activeClientId}-${documentationSession.sessionType}-${documentationSession.title}`}
                  session={documentationSession}
                  onUpdate={setDocumentationSession}
                  onCancel={() => setDocumentationSession(null)}
                  isPhone={isPhone}
                  clientProfile={activeClientProfile}
                />
              ) : (
                <>
                  <Card title="ISP Programs">
                    <View style={styles.filter}>
                      <Text style={styles.filterText}>Filter</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.tableWrap}>
                        <View>
                          <View style={styles.tableHeaderRow}>
                            {ispColumns.map((column) => (
                              <Text
                                key={column.key}
                                style={[styles.tableHeaderCell, { flex: column.flex || 1 }]}
                              >
                                {column.label}
                              </Text>
                            ))}
                          </View>
                          {activeIspRows.map((row, index) => (
                            <Pressable
                              key={`${row[ispColumns[0].key]}-${index}`}
                              onPress={() => handleIspProgramPress(row)}
                              style={styles.tableBodyRow}
                            >
                              {ispColumns.map((column) => (
                                <Text
                                  key={column.key}
                                  style={[styles.tableBodyCell, { flex: column.flex || 1 }]}
                                >
                                  {row[column.key]}
                                </Text>
                              ))}
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    </ScrollView>
                    <Text style={styles.countNote}>Showing 1 to 3 of 3 entries</Text>
                  </Card>

                  <Card title="Service Authorizations (Professional Claim)">
                    <View style={styles.filter}>
                      <Text style={styles.filterText}>Filter</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.tableWrap}>
                        <DataTable columns={professionalColumns} rows={professionalRows} />
                      </View>
                    </ScrollView>
                    <Text style={styles.countNote}>Showing 1 to 1 of 1 entry</Text>
                  </Card>

                  <Card title="Service Authorizations (Institutional Claim)">
                    <Text style={styles.emptyText}>No service authorizations found to display</Text>
                  </Card>
                </>
              )}
            </View>

            <View style={[styles.rightColumn, { width: rightWidth }]}>
              <ShiftIntelligencePanel documentationSession={documentationSession} clientProfile={activeClientProfile} />
            </View>
          </View>

          <Text style={styles.footer}>ogigrid</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  screenContent: {
    paddingVertical: 16,
    overflow: "visible",
  },
  page: {
    width: "100%",
    maxWidth: 1760,
    alignSelf: "center",
    paddingTop: 8,
    paddingBottom: 24,
  },
  topbar: {
    minHeight: 60,
    backgroundColor: colors.topPurple,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topbarPhone: {
    alignItems: "flex-start",
    rowGap: 8,
  },
  topLeft: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    flexWrap: "wrap",
  },
  topRight: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 24,
    flexShrink: 1,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  topRightPhone: {
    width: "100%",
    justifyContent: "space-between",
  },
  topUser: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
  },
  topUserPhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#ffffff",
    backgroundColor: "#ffffff",
  },
  logo: {
    fontWeight: "700",
    fontStyle: "italic",
    color: "#f3e8ff",
    marginRight: 22,
  },
  homeLabel: {
    color: colors.text,
  },
  topRightText: {
    color: colors.text,
  },
  layout: {
    flexDirection: "row",
    alignItems: "flex-start",
    columnGap: 26,
    rowGap: 16,
  },
  layoutTablet: {
    flexWrap: "wrap",
  },
  layoutPhone: {
    flexDirection: "column",
  },
  leftColumn: {
    rowGap: 16,
    flexShrink: 0,
  },
  mainColumn: {
    flex: 1,
    rowGap: 16,
    minWidth: 0,
    overflow: "visible",
  },
  rightColumn: {
    rowGap: 16,
    flexShrink: 0,
  },
  card: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  cardHeader: {
    height: 44,
    backgroundColor: colors.headerBlue,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardHeaderText: {
    color: colors.headerText,
    fontSize: 18,
    fontWeight: "700",
  },
  cardBody: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  avatar: {
    width: 96,
    height: 96,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 48,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  moduleList: {
    rowGap: 8,
  },
  modulePressable: {
    alignSelf: "flex-start",
  },
  moduleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    columnGap: 6,
  },
  moduleIcon: {
    marginTop: 2,
  },
  moduleItem: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.muted,
  },
  moduleItemAction: {
    color: colors.link,
  },
  moduleItemActive: {
    color: colors.headerText,
    fontWeight: "700",
  },
  decisionCard: {
    overflow: "visible",
  },
  decisionCardBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    overflow: "visible",
  },
  decisionAssignForm: {
    marginBottom: 18,
    gap: 16,
    overflow: "visible",
    position: "relative",
  },
  decisionAssignFormActive: {
    zIndex: 20,
    elevation: 20,
  },
  decisionQuestionList: {
    position: "relative",
    zIndex: 1,
  },
  decisionFormField: {
    alignItems: "flex-start",
    gap: 8,
    overflow: "visible",
  },
  decisionTargetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: 10,
    overflow: "visible",
  },
  decisionFormFieldLibrary: {
    zIndex: 6,
  },
  decisionFormFieldMode: {
    zIndex: 5,
  },
  decisionFormFieldTarget: {
    zIndex: 4,
  },
  decisionFormSplitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  decisionFormSplitRowPhone: {
    flexDirection: "column",
  },
  decisionFormFieldGrow: {
    flexShrink: 1,
    gap: 8,
    overflow: "visible",
  },
  decisionFormFieldDepth: {
    flexShrink: 0,
    gap: 8,
    zIndex: 5,
    overflow: "visible",
  },
  decisionFormFieldFullWidth: {
    width: "100%",
  },
  decisionToolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    rowGap: 12,
    marginBottom: 18,
    alignItems: "flex-start",
  },
  decisionScheduleEditor: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    backgroundColor: "#fcfbff",
    marginBottom: 18,
  },
  decisionScheduleTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.headerText,
    marginBottom: 6,
  },
  decisionScheduleLead: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 19,
    marginBottom: 12,
  },
  decisionRowInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
  },
  decisionScheduleBuilderRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "flex-end",
    marginBottom: 12,
  },
  decisionWorkflowChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  decisionBuilderActionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  decisionBuilderListLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: colors.muted,
    marginBottom: 10,
  },
  decisionScheduleChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  decisionScheduleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
    maxWidth: "100%",
  },
  decisionScheduleChipText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "600",
  },
  decisionScheduleChipAction: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff3f1",
  },
  decisionScheduleChipRemove: {
    fontSize: 16,
    color: colors.red,
    fontWeight: "700",
    lineHeight: 18,
  },
  decisionToolbarPhone: {
    flexDirection: "column",
  },
  decisionToolbarGroup: {
    minWidth: 140,
    flex: 1,
    gap: 8,
  },
  decisionToolbarGroupWide: {
    minWidth: 240,
    flex: 1.35,
  },
  decisionToolbarLabel: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  decisionOptionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  decisionDropdownWrap: {
    position: "relative",
    zIndex: 3,
    alignSelf: "flex-start",
    overflow: "visible",
  },
  decisionDropdownWrapOpen: {
    zIndex: 40,
  },
  decisionDropdownLibrary: {
    width: 196,
    maxWidth: "100%",
  },
  decisionDropdownMode: {
    width: 168,
    maxWidth: "100%",
  },
  decisionDropdownDepth: {
    width: 64,
  },
  decisionDropdownTargetType: {
    width: 140,
    maxWidth: "100%",
  },
  decisionDropdownTargetValue: {
    width: 200,
    maxWidth: "100%",
  },
  decisionDropdown: {
    minHeight: 36,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  decisionDropdownValue: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: "600",
    color: colors.headerText,
  },
  decisionDropdownPlaceholder: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontSize: 13,
    color: colors.muted,
  },
  decisionDropdownModalRoot: {
    flex: 1,
  },
  decisionDropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  decisionDropdownMenuPortal: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "#e3d8fb",
    borderRadius: 6,
    backgroundColor: "#ffffff",
    shadowColor: "#2f184f",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 24,
    overflow: "hidden",
    zIndex: 2,
  },
  decisionDropdownMenu: {
    position: "absolute",
    top: 38,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderColor: "#e3d8fb",
    borderRadius: 6,
    backgroundColor: "#ffffff",
    shadowColor: "#2f184f",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 14,
    overflow: "hidden",
    zIndex: 50,
  },
  decisionDropdownMenuScroll: {
    maxHeight: 260,
  },
  decisionDropdownOptionPressable: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#f1ebfc",
    gap: 2,
  },
  decisionDropdownOptionPressableLast: {
    borderBottomWidth: 0,
  },
  decisionDropdownOptionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.headerText,
  },
  decisionDropdownOptionMeta: {
    fontSize: 12,
    color: colors.muted,
  },
  decisionOptionButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    minHeight: 40,
    justifyContent: "center",
  },
  decisionTargetTypeButton: {
    minWidth: 108,
  },
  decisionOptionButtonActive: {
    backgroundColor: colors.topPurple,
    borderColor: colors.topPurple,
  },
  decisionOptionText: {
    fontSize: 13,
    color: colors.headerText,
    fontWeight: "700",
  },
  decisionOptionTextActive: {
    color: "#ffffff",
  },
  decisionSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  decisionSummaryText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "600",
  },
  decisionSectionCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    marginBottom: 14,
    overflow: "hidden",
  },
  decisionSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: "#f6f0ff",
  },
  decisionSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.headerText,
  },
  decisionSectionMeta: {
    fontSize: 13,
    color: colors.muted,
  },
  decisionNodeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  decisionNodeCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 4,
  },
  decisionNodeCheckboxActive: {
    borderColor: colors.topPurple,
    backgroundColor: colors.topPurple,
  },
  decisionNodeCheckboxLabel: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  decisionNodeContent: {
    flex: 1,
  },
  decisionNodeTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 3,
  },
  decisionNodeQuestion: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 8,
    lineHeight: 18,
  },
  decisionConditionList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  decisionConditionBadge: {
    fontSize: 11,
    color: colors.link,
    backgroundColor: "#efe6ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  decisionAssignRow: {
    paddingHorizontal: 0,
    paddingTop: 4,
    paddingBottom: 2,
    alignItems: "flex-end",
  },
  decisionAssignButton: {
    backgroundColor: colors.topPurple,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  decisionAssignButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  finalDraftChoiceRow: {
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 14,
  },
  finalDraftChoiceLabel: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 8,
    fontWeight: "700",
  },
  finalDraftChoiceButtons: {
    flexDirection: "row",
    columnGap: 8,
  },
  finalDraftButton: {
    backgroundColor: colors.topPurple,
  },
  finalDraftCancel: {
    backgroundColor: colors.border,
  },
  finalDraftPreviewCard: {
    backgroundColor: "#fffefc",
    borderWidth: 1,
    borderColor: "#e8d9c8",
    borderRadius: 8,
    padding: 14,
    marginHorizontal: 14,
    marginBottom: 14,
  },
  finalDraftPreviewTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.headerText,
    marginBottom: 10,
  },
  finalDraftPreviewBody: {
    maxHeight: 180,
    marginBottom: 12,
  },
  finalDraftPreviewText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },
  finalDraftPreviewActions: {
    flexDirection: "row",
    columnGap: 8,
  },
  finalDraftStatusText: {
    marginTop: 10,
    color: colors.link,
    fontSize: 12,
  },
  finalDraftErrorText: {
    marginTop: 10,
    color: colors.red,
    fontSize: 12,
  },
  carePlanShell: {
    rowGap: 10,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: 12,
  },
  nameRowPhone: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  name: {
    fontWeight: "700",
    color: colors.text,
    flexShrink: 1,
  },
  admitted: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.green,
  },
  switchBox: {
    width: 360,
    minHeight: 38,
    borderWidth: 1,
    borderColor: colors.lightBorder,
    borderRadius: 4,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    paddingHorizontal: 12,
    position: "relative",
    zIndex: 20,
  },
  switchBoxPhone: {
    width: "100%",
  },
  switchInputRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
  },
  switchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    paddingVertical: 8,
  },
  switchGoButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.link,
    alignItems: "center",
    justifyContent: "center",
  },
  switchSuggestions: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderColor: colors.lightBorder,
    borderRadius: 4,
    backgroundColor: "#ffffff",
    overflow: "hidden",
    zIndex: 30,
    elevation: 4,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
  },
  switchSuggestionRow: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.rowBorder,
    minHeight: 52,
    justifyContent: "center",
    ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
  },
  switchSuggestionRowHover: {
    backgroundColor: "#f3edff",
  },
  switchSuggestionHitArea: {
    alignSelf: "flex-start",
    paddingRight: 6,
    ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
  },
  switchSuggestionText: {
    fontSize: 13,
    color: colors.text,
    ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
  },
  switchText: {
    fontSize: 13,
    color: "#a1a9b2",
  },
  tabs: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 24,
    paddingVertical: 8,
    flexWrap: "wrap",
    rowGap: 10,
  },
  tabsPhone: {
    columnGap: 12,
  },
  activeTab: {
    borderWidth: 1,
    borderColor: colors.lightBorder,
    borderRadius: 4,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  activeTabText: {
    fontSize: 15,
    color: "#4b5563",
  },
  tabText: {
    fontSize: 15,
    color: colors.link,
  },
  filter: {
    width: 240,
    height: 28,
    borderWidth: 1,
    borderColor: "#d9e0e7",
    borderRadius: 3,
    paddingHorizontal: 10,
    justifyContent: "center",
    backgroundColor: "#ffffff",
    marginBottom: 10,
  },
  filterText: {
    fontSize: 12,
    color: colors.placeholder,
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5edf4",
    paddingVertical: 6,
  },
  tableWrap: {
    minWidth: 620,
    flex: 1,
  },
  tableHeaderCell: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.tableHead,
    paddingHorizontal: 6,
  },
  tableBodyRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.rowBorder,
    paddingVertical: 8,
  },
  tableBodyCell: {
    fontSize: 13,
    color: "#4b5563",
    paddingHorizontal: 6,
  },
  countNote: {
    marginTop: 10,
    fontSize: 13,
    color: "#4b5563",
  },
  emptyText: {
    fontSize: 13,
    color: "#4b5563",
  },
  tinyBody: {
    minHeight: 52,
  },
  carePlanShell: {
    rowGap: 18,
  },
  carePlanContentScroller: {
    maxHeight: 1400,
  },
  carePlanContentScrollerInner: {
    paddingBottom: 8,
  },
  carePlanHero: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    columnGap: 20,
    shadowColor: "#2f1157",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  carePlanHeroLeft: {
    flexDirection: "row",
    flex: 1,
    columnGap: 16,
  },
  carePlanHeroPhoto: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "#ffffff",
  },
  carePlanHeroIdentity: {
    flex: 1,
  },
  carePlanHeroName: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  carePlanHeroMeta: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 4,
  },
  carePlanHeroRight: {
    width: 300,
    alignItems: "flex-start",
  },
  carePlanStatus: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
    backgroundColor: "#6d4bc2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 8,
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  quickActionButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#f8f4ff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.headerText,
  },
  carePlanPillRow: {
    paddingVertical: 2,
  },
  carePlanPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#f5efff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    marginRight: 10,
  },
  carePlanPillActive: {
    backgroundColor: colors.topPurple,
    borderColor: colors.topPurple,
  },
  carePlanPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.muted,
  },
  carePlanPillTextActive: {
    color: "#ffffff",
  },
  carePlanSectionCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    overflow: "hidden",
  },
  carePlanSectionHead: {
    backgroundColor: "#f4eeff",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  carePlanSectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.headerText,
  },
  carePlanSectionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.muted,
  },
  carePlanSectionBody: {
    padding: 18,
  },
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  overviewStat: {
    minWidth: 180,
    backgroundColor: "#fbf9ff",
    borderWidth: 1,
    borderColor: "#ebe2fb",
    borderRadius: 12,
    padding: 16,
    marginRight: 14,
    marginBottom: 14,
  },
  overviewStatLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    color: colors.muted,
    marginBottom: 8,
  },
  overviewStatValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  narrativeGrid: {
    rowGap: 14,
  },
  narrativeCard: {
    backgroundColor: "#fbf9ff",
    borderWidth: 1,
    borderColor: "#ebe2fb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  narrativeCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  narrativeCardBody: {
    fontSize: 15,
    lineHeight: 25,
    color: "#3e3158",
  },
  riskGrid: {
    rowGap: 12,
  },
  riskCard: {
    backgroundColor: "#fffdfd",
    borderWidth: 1,
    borderColor: "#eadff8",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  riskCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  riskTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  riskSeverityDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: 10,
  },
  riskHigh: {
    backgroundColor: "#e15d67",
  },
  riskMedium: {
    backgroundColor: "#f2a947",
  },
  riskLow: {
    backgroundColor: "#6eaf71",
  },
  riskCardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  riskSeverityText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
  },
  riskSummary: {
    fontSize: 14,
    lineHeight: 23,
    color: "#43335b",
  },
  riskGuidance: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee6fb",
    fontSize: 14,
    lineHeight: 23,
    color: colors.headerText,
  },
  serviceToolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 14,
  },
  serviceSearchBox: {
    minWidth: 220,
    borderWidth: 1,
    borderColor: "#e5ddf5",
    backgroundColor: "#fcfbff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  serviceSearchText: {
    fontSize: 13,
    color: colors.placeholder,
  },
  serviceLegend: {
    flexDirection: "row",
    alignItems: "center",
  },
  serviceLegendText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
  },
  serviceLegendDivider: {
    color: colors.placeholder,
    marginHorizontal: 8,
  },
  serviceGrid: {
    rowGap: 12,
  },
  serviceCard: {
    backgroundColor: "#fbf9ff",
    borderWidth: 1,
    borderColor: "#ebe2fb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  serviceTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  serviceBadge: {
    backgroundColor: "#e7f7ea",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  serviceBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2c7a4b",
  },
  serviceMeta: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 4,
  },
  serviceDetail: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 23,
    color: "#43335b",
  },
  actionPlanStack: {
    rowGap: 16,
  },
  actionPlanCard: {
    borderWidth: 1,
    borderColor: "#ebe2fb",
    borderRadius: 14,
    backgroundColor: "#fcfbff",
    padding: 16,
    marginBottom: 16,
  },
  actionPlanLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.headerText,
    marginBottom: 12,
  },
  outcomeBanner: {
    backgroundColor: "#efe7ff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  outcomeBannerLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    color: colors.muted,
    marginBottom: 6,
  },
  outcomeBannerText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    color: colors.text,
  },
  issueCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ebe2fb",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  issueLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    color: colors.muted,
    marginBottom: 6,
  },
  issueText: {
    fontSize: 14,
    lineHeight: 23,
    color: "#43335b",
  },
  actionPlanTable: {
    borderWidth: 1,
    borderColor: "#e6ddf7",
    borderRadius: 12,
    overflow: "hidden",
  },
  actionPlanTableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1ebff",
  },
  actionPlanTableHeaderCell: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 13,
    fontWeight: "700",
    color: colors.headerText,
    borderRightWidth: 1,
    borderRightColor: "#e1d6f7",
  },
  actionPlanTableRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#eee6fb",
    backgroundColor: "#ffffff",
  },
  actionPlanTableRowActive: {
    backgroundColor: "#fcfaff",
  },
  actionPlanTableCell: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: "#f0ebfb",
  },
  actionPlanCellText: {
    fontSize: 13,
    lineHeight: 22,
    color: "#3d3157",
  },
  notesCell: {
    minHeight: 110,
  },
  notesExpandText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: colors.link,
  },
  workflowRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  workflowChip: {
    backgroundColor: "#f5efff",
    borderWidth: 1,
    borderColor: "#ded2f6",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  workflowChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.headerText,
  },
  actionPlanMobileStack: {
    rowGap: 12,
  },
  actionPlanMobileCard: {
    borderWidth: 1,
    borderColor: "#e6ddf7",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    padding: 14,
    marginBottom: 12,
  },
  mobileStepTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  mobileStepMeta: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 4,
  },
  mobileStepNotes: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 22,
    color: "#43335b",
  },
  documentGrid: {
    rowGap: 14,
  },
  documentChecklistCard: {
    backgroundColor: "#fbf9ff",
    borderWidth: 1,
    borderColor: "#ebe2fb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  documentSubhead: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
  },
  documentChecklistRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  documentCheckbox: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    backgroundColor: "#ffffff",
    marginRight: 10,
  },
  documentChecklistText: {
    fontSize: 14,
    color: "#43335b",
  },
  documentFileText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.link,
    marginBottom: 8,
  },
  participantTable: {
    borderWidth: 1,
    borderColor: "#e6ddf7",
    borderRadius: 12,
    overflow: "hidden",
  },
  participantHeader: {
    flexDirection: "row",
    backgroundColor: "#f1ebff",
  },
  participantHeaderCell: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 13,
    fontWeight: "700",
    color: colors.headerText,
  },
  participantRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#efe7fb",
    backgroundColor: "#ffffff",
  },
  participantCell: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 13,
    color: "#43335b",
  },
  signatureList: {
    marginTop: 12,
  },
  signatureItem: {
    fontSize: 14,
    color: "#43335b",
    marginBottom: 8,
  },
  sourcePageStack: {
    rowGap: 12,
  },
  sourcePageCard: {
    backgroundColor: "#fbf9ff",
    borderWidth: 1,
    borderColor: "#ebe2fb",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  sourcePageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#f7f2ff",
  },
  sourcePageTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  sourcePageToggle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.link,
  },
  sourcePageText: {
    padding: 16,
    fontSize: 14,
    lineHeight: 23,
    color: "#3d3157",
  },
  pdfList: {
    rowGap: 14,
  },
  pdfRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  pdfItem: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.muted,
  },
  pdfLinkIcon: {
    marginLeft: 5,
  },
  outcomeDocumentLink: {
    marginTop: 10,
    alignSelf: "flex-start",
  },
  outcomeDocumentLinkText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.link,
    textDecorationLine: "underline",
  },
  docEntryShell: {
    rowGap: 12,
  },
  docEntryHeaderCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  docEntryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 6,
  },
  docEntryMeta: {
    fontSize: 12,
    color: "#555555",
    marginBottom: 2,
  },
  docWorkflowRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  docWorkflowButton: {
    borderWidth: 1,
    borderColor: "#cccccc",
    backgroundColor: "#f4f4f4",
    borderRadius: 3,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  docWorkflowButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#333333",
  },
  docEntryScroll: {
    maxHeight: 980,
  },
  docEntryScrollInner: {
    rowGap: 12,
    paddingBottom: 8,
  },
  docFormCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 4,
    overflow: "visible",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  docSectionCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 4,
    overflow: "hidden",
  },
  docSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  docSectionSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: "#666666",
    marginBottom: 12,
  },
  docSectionHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: "#f2f2f2",
    borderBottomWidth: 1,
    borderBottomColor: "#d8d8d8",
  },
  docSectionBody: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  docTimeLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 6,
  },
  docTableHeader: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
  },
  docTableHeaderCell: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
  },
  docTableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#dddddd",
    backgroundColor: "#ffffff",
  },
  docTableRowStacked: {
    flexDirection: "column",
  },
  docDescriptionColumn: {
    flex: 1.05,
  },
  docScoresColumn: {
    flex: 1.35,
  },
  docDescriptionCell: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: "#dddddd",
    backgroundColor: "#ffffff",
    justifyContent: "center",
  },
  docScoresCell: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    rowGap: 10,
    overflow: "visible",
  },
  docRowSource: {
    fontSize: 11,
    fontWeight: "700",
    color: "#666666",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  docRowDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: "#111111",
  },
  docDropdownWrap: {
    position: "relative",
    zIndex: 1,
  },
  docDropdown: {
    minHeight: 30,
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 2,
    backgroundColor: "#ffffff",
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  docDropdownValue: {
    fontSize: 14,
    color: "#111111",
    flex: 1,
    paddingRight: 8,
  },
  docDropdownPlaceholder: {
    fontSize: 14,
    color: "#666666",
    flex: 1,
    paddingRight: 8,
  },
  docDropdownMenu: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 2,
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  docDropdownOptionPressable: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },
  docDropdownOption: {
    fontSize: 14,
    color: "#111111",
  },
  docCommentField: {
    rowGap: 8,
    overflow: "visible",
  },
  docCommentInputWrap: {
    position: "relative",
    overflow: "visible",
  },
  docuWraiteWrap: {
    position: "absolute",
    top: 6,
    right: 6,
    alignItems: "flex-end",
    zIndex: 3,
  },
  docuWraiteBubblePressable: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  docuWraiteBubbleOuter: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  docuWraiteBubbleBody: {
    width: 34,
    minHeight: 30,
    borderRadius: 14,
    backgroundColor: "#e8dcff",
    borderWidth: 1,
    borderColor: "#c7b4ff",
    paddingTop: 4,
    paddingBottom: 6,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  docuWraiteBubbleSparkleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    columnGap: 2,
    marginBottom: 1,
  },
  docuWraiteSparkle: {
    fontSize: 9,
    lineHeight: 10,
    color: "#4b2f91",
    fontWeight: "700",
  },
  docuWraiteSparkleSmall: {
    fontSize: 7,
    lineHeight: 8,
    marginBottom: 1,
  },
  docuWraiteSparkleTiny: {
    fontSize: 6,
    lineHeight: 7,
  },
  docuWraiteBubbleDots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 3,
  },
  docuWraiteDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ffffff",
  },
  docuWraiteBubbleTail: {
    position: "absolute",
    left: 7,
    bottom: 1,
    width: 8,
    height: 8,
    backgroundColor: "#e8dcff",
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#c7b4ff",
    transform: [{ rotate: "45deg" }],
  },
  docuWraiteCard: {
    width: 248,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#d4c2f1",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 4,
  },
  docuWraiteInlineCard: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#d4c2f1",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 4,
  },
  docuWraiteAssistDock: {
    width: "100%",
    maxWidth: 420,
    marginTop: 2,
    alignSelf: "flex-end",
  },
  docuWraiteWorkflowCard: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#d4c2f1",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 5,
  },
  docuWraiteWorkflowEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7c3aed",
    marginBottom: 6,
  },
  docuWraiteWorkflowProgress: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6b4fa1",
    marginBottom: 4,
  },
  docuWraiteWorkflowMetaLine: {
    fontSize: 11,
    color: "#6b4fa1",
    lineHeight: 16,
    marginBottom: 4,
  },
  docuWraiteWorkflowLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
    marginBottom: 8,
  },
  docuWraiteWorkflowLoading: {
    fontSize: 12,
    color: "#7c3aed",
    fontWeight: "700",
    lineHeight: 18,
  },
  docuWraiteWorkflowAiNotice: {
    fontSize: 11,
    color: "#8a5a00",
    lineHeight: 16,
    marginBottom: 6,
  },
  docuWraiteWorkflowQuestion: {
    fontSize: 14,
    fontWeight: "700",
    color: "#312447",
    lineHeight: 20,
    marginBottom: 10,
  },
  docuWraiteWorkflowChoiceRow: {
    flexDirection: "row",
    columnGap: 8,
    marginBottom: 8,
  },
  docuWraiteWorkflowChoice: {
    minWidth: 72,
    borderWidth: 1,
    borderColor: "#d4c2f1",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#faf7ff",
    alignItems: "center",
  },
  docuWraiteWorkflowChoiceActive: {
    backgroundColor: "#7c3aed",
    borderColor: "#7c3aed",
  },
  docuWraiteWorkflowChoiceText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5c3d99",
  },
  docuWraiteWorkflowChoiceTextActive: {
    color: "#ffffff",
  },
  docuWraiteWorkflowSuggestionList: {
    rowGap: 6,
    marginBottom: 8,
  },
  docuWraiteWorkflowSuggestionScroll: {
    maxHeight: 320,
    marginBottom: 8,
  },
  docuWraiteWorkflowContextActionLead: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4b3d66",
    marginTop: 4,
  },
  docuWraiteWorkflowContextActionHint: {
    fontSize: 12,
    color: "#6b5b7a",
    marginBottom: 6,
  },
  docuWraiteWorkflowSuggestionDisabled: {
    opacity: 0.45,
  },
  docuWraiteWorkflowSuggestion: {
    borderWidth: 1,
    borderColor: "#ddd2f3",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fcfbff",
  },
  docuWraiteWorkflowSuggestionActive: {
    borderColor: "#7c3aed",
    backgroundColor: "#f3ebff",
  },
  docuWraiteWorkflowSuggestionText: {
    fontSize: 13,
    color: "#4b3d66",
  },
  docuWraiteWorkflowSuggestionTextActive: {
    color: "#5c3d99",
    fontWeight: "700",
  },
  docuWraiteWorkflowInput: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 4,
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: "#111111",
  },
  docuWraiteWorkflowNarrationInput: {
    minHeight: 72,
    textAlignVertical: "top",
  },
  docuWraiteWorkflowContextBox: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#e7dcf8",
    borderRadius: 6,
    backgroundColor: "#faf7ff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    rowGap: 4,
  },
  docuWraiteWorkflowContextItem: {
    fontSize: 12,
    lineHeight: 18,
    color: "#6b4fa1",
  },
  docuWraiteWorkflowNext: {
    alignSelf: "flex-start",
    marginTop: 6,
    backgroundColor: "#7c3aed",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  docuWraiteWorkflowNextText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  docuWraiteWorkflowRationale: {
    fontSize: 12,
    lineHeight: 18,
    color: "#6b4fa1",
    marginBottom: 8,
  },
  docuWraiteWorkflowWhyBox: {
    borderWidth: 1,
    borderColor: "#e7dcf8",
    borderRadius: 8,
    backgroundColor: "#faf7ff",
    paddingHorizontal: 10,
    paddingVertical: 10,
    rowGap: 4,
    marginBottom: 8,
  },
  docuWraiteWorkflowReadinessRemediationBox: {
    rowGap: 8,
  },
  docuWraiteWorkflowReadinessRemediationTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#312447",
    lineHeight: 18,
  },
  docuWraiteWorkflowReadinessRemediationActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: 12,
    marginTop: 4,
  },
  docuWraiteWorkflowWhyLead: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4b3d66",
    marginBottom: 2,
  },
  docuWraiteWorkflowWhyItem: {
    fontSize: 12,
    lineHeight: 18,
    color: "#4b3d66",
  },
  docuWraiteWorkflowIssueLink: {
    alignSelf: "stretch",
    marginBottom: 4,
    ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
  },
  docuWraiteWorkflowIssueLinkPressed: {
    opacity: 0.75,
  },
  docuWraiteWorkflowIssueLinkText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#5c3d99",
    textDecorationLine: "underline",
    fontWeight: "700",
    ...(Platform.OS === "web"
      ? {
          cursor: "pointer",
          userSelect: "none",
          WebkitUserSelect: "none",
        }
      : {}),
  },
  docuWraiteWorkflowIssueLinkTextEscalation: {
    color: "#8a5a00",
  },
  docuWraiteWorkflowDraftBox: {
    rowGap: 10,
    marginBottom: 8,
  },
  docuWraiteWorkflowDraftText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#312447",
    backgroundColor: "#f7f7f7",
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  docuWraiteWorkflowExtraLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4b3d66",
    marginTop: 4,
  },
  docuWraiteWorkflowExtraInput: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 6,
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    lineHeight: 20,
    color: "#111111",
    textAlignVertical: "top",
  },
  docuWraiteWorkflowFooter: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  docuWraiteWorkflowBack: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5c3d99",
    textDecorationLine: "underline",
  },
  docuWraiteWorkflowDismiss: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b4fa1",
    textDecorationLine: "underline",
  },
  docuWraiteCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#312447",
    marginBottom: 4,
  },
  docuWraiteCardMessage: {
    fontSize: 12,
    lineHeight: 18,
    color: "#4b3d66",
    marginBottom: 10,
  },
  docuWraiteCardActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  docuWraiteCardPrimary: {
    backgroundColor: "#7c3aed",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  docuWraiteCardPrimaryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  docuWraiteCardSecondary: {
    borderWidth: 1,
    borderColor: "#d4c2f1",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#faf7ff",
  },
  docuWraiteCardSecondaryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5c3d99",
  },
  docCommentMetaRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    columnGap: 12,
    marginTop: 2,
  },
  docCommentTools: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 14,
    rowGap: 4,
    flex: 1,
  },
  docCommentTool: {
    fontSize: 12,
    color: "#2f5f9e",
    textDecorationLine: "underline",
  },
  docCommentToolActive: {
    color: "#1f4f86",
    fontWeight: "700",
  },
  docCommentToolPanel: {
    borderWidth: 1,
    borderColor: "#d8e6f5",
    borderRadius: 6,
    backgroundColor: "#f7fbff",
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginTop: 8,
    rowGap: 8,
  },
  docCommentToolPanelTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2f5f9e",
  },
  docCommentToolPanelMessage: {
    fontSize: 12,
    lineHeight: 18,
    color: "#4b5563",
  },
  docCommentToolIssueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: 10,
  },
  docCommentToolIssueText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: "#111111",
  },
  docCommentToolFixButton: {
    borderWidth: 1,
    borderColor: "#2f5f9e",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#ffffff",
  },
  docCommentToolFixButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2f5f9e",
  },
  docCommentToolSuggestion: {
    fontSize: 12,
    lineHeight: 18,
    color: "#111111",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d8e6f5",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  docCommentToolActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 8,
    rowGap: 8,
  },
  docCommentToolPrimary: {
    backgroundColor: "#2f5f9e",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  docCommentToolPrimaryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  docCommentToolSecondary: {
    borderWidth: 1,
    borderColor: "#2f5f9e",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#ffffff",
  },
  docCommentToolSecondaryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2f5f9e",
  },
  docCommentInput: {
    minHeight: 132,
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 2,
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 22,
    color: "#111111",
    textAlignVertical: "top",
  },
  docCommentInputWithAssist: {
    paddingTop: 42,
    paddingRight: 46,
  },
  docCommentInputExpanded: {
    minHeight: 180,
  },
  docCommentInputFullscreen: {
    minHeight: 260,
  },
  docCommentInputFocused: {
    borderColor: "#7aa7d9",
  },
  docCommentCounter: {
    fontSize: 12,
    color: "#666666",
    textAlign: "right",
    flexShrink: 0,
  },
  docReviewGrid: {
    rowGap: 10,
    marginBottom: 14,
  },
  docStatusRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    columnGap: 12,
  },
  docStatusLabel: {
    width: 148,
    fontSize: 13,
    fontWeight: "700",
    color: "#333333",
  },
  docStatusValue: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: "#111111",
  },
  docReviewInputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#444444",
    marginBottom: 6,
  },
  docReviewInput: {
    minHeight: 36,
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 2,
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: "#111111",
  },
  docHandoverInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 4,
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
    color: "#111111",
    textAlignVertical: "top",
    marginBottom: 12,
  },
  docHandoverVitalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  docHandoverVitalValues: {
    rowGap: 10,
    marginBottom: 12,
  },
  docHandoverVitalValueRow: {
    rowGap: 6,
  },
  docHandoverVitalValueLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#444444",
  },
  docHandoverVitalValueInput: {
    minHeight: 38,
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 4,
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: "#111111",
  },
  docHandoverOtherVitalsInput: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 4,
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
    color: "#111111",
    textAlignVertical: "top",
    marginBottom: 12,
  },
  docHandoverVitalChip: {
    borderWidth: 1,
    borderColor: "#d4c2f1",
    backgroundColor: "#faf7ff",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  docHandoverVitalChipActive: {
    backgroundColor: "#eadfff",
    borderColor: "#7c3aed",
  },
  docHandoverVitalChipText: {
    fontSize: 13,
    color: "#5c3d99",
    fontWeight: "600",
  },
  docHandoverVitalChipTextActive: {
    color: "#312447",
  },
  docHandoverActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
  },
  docHandoverStatus: {
    fontSize: 12,
    color: "#5c3d99",
  },
  docFooterPanel: {
    marginTop: 6,
    paddingTop: 16,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: "#d8d8d8",
    rowGap: 12,
  },
  docWarningList: {
    borderWidth: 1,
    borderColor: "#d9b36c",
    backgroundColor: "#fff8e8",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    rowGap: 4,
  },
  docWarningItem: {
    fontSize: 12,
    color: "#6a4d12",
  },
  docStatusMessage: {
    fontSize: 13,
    color: "#333333",
    backgroundColor: "#f7f7f7",
    borderWidth: 1,
    borderColor: "#d8d8d8",
    borderRadius: 3,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  docEntryActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 8,
    rowGap: 8,
    justifyContent: "flex-start",
  },
  docEntryActionsStacked: {
    flexDirection: "column",
  },
  docActionButton: {
    minWidth: 132,
    minHeight: 36,
    borderRadius: 3,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  docActionPrimary: {
    backgroundColor: "#d9d9d9",
    borderWidth: 1,
    borderColor: "#b5b5b5",
  },
  docActionPrimaryText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111111",
  },
  docActionSecondary: {
    backgroundColor: "#ececec",
    borderWidth: 1,
    borderColor: "#c8c8c8",
  },
  docActionSecondaryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111111",
  },
  docActionOutline: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bdbdbd",
  },
  docActionOutlineText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333333",
  },
  intelItem: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 8,
    lineHeight: 19,
  },
  intelEmpty: {
    fontSize: 13,
    color: colors.placeholder,
  },
  footer: {
    marginTop: 18,
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
});
