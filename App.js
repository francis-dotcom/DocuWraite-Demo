import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  LayoutAnimation,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
  useWindowDimensions,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Icon from "./components/Icon";
import { carePlanText } from "./carePlanText";
import { fetchAssignedNodesDraft, fetchDocuWraiteWorkflowStep } from "./docuWraiteAi";
import {
  docuWraiteUseRuleBasedFallback,
  docuWraiteApiBaseUrl,
  docuWraiteWebInitialScale,
} from "./docuWraiteConfig";
import {
  clearDraftContextResponsesForToggle,
  countIncompleteDraftContextQuestions,
  formatDraftContextClarificationsForPrompt,
  getDraftContextTogglesNeedingQuestions,
  getFirstIncompleteDraftContextQuestion,
} from "./decisionAlgo/draftContextQuestionTrees";
import {
  buildCaseNoteDocumentationItems,
  buildMeasurableDocumentationItems,
  CLIENT_ROSTER,
  getClientById,
  getMaryBetProfile,
  getMarkBrentProfile,
  searchClients,
} from "./clientProfiles";
import { getShiftIntelligenceRuntime, mergeResolvedClientProfile } from "./shiftIntelligence";

const decisionNodes = require("./decisionAlgo/nodes.json");

const DECISION_LIBRARY_HELP = {
  aidraft: "AI draft rules for when notes are generated, what they must include, and which safety guardrails apply.",
  baseplan: "Core documentation questions that shape the base note structure.",
  branching: "Branch logic that controls which follow-up questions appear next.",
  careplan: "Care-plan-based questions and support rules pulled into documentation.",
  playbookR: "Playbook and response guidance for support actions and workflows.",
  readiness: "Checks that decide whether enough information is present to continue.",
  runtime: "Live shift and situational questions used during actual documentation.",
};

const DECISION_LIBRARY_DISPLAY_NAMES = {
  aidraft: "IntelliDraft",
};

const DECISION_NOTE_TYPE_OPTIONS = [
  { value: "final-note", label: "Final note" },
  { value: "handover-note", label: "Handover note" },
  { value: "row-note", label: "Row note" },
  { value: "block-time", label: "Block time" },
  { value: "orders", label: "Orders" },
];

const DECISION_EXCLUSIVE_STATUS_CHOICES = new Set([
  "skip",
  "deferred",
  "unknown",
  "not observed",
  "not applicable",
]);

const userProfilePhoto = require("./demoImages/dsp-user.png");
const maryBetProfilePhoto = require("./demoImages/patient-mary-bet.png");
const markBrentProfilePhoto = require("./demoImages/patient-mark-brent-ai.png");

const loggedInUser = "Brian (DEMOTRAIN-NC)";
const patientDisplayName = "Mary Bet";

const docuWraiteColors = {
  primary: "#5B4DDB",
  primaryMuted: "#6e63ba",
  secondary: "#5a4faa",
  surface: "#F4F1FF",
  surfaceAccent: "#ECE8FF",
  border: "#D9D0FF",
  borderSoft: "#ddd6ff",
  borderRow: "#ede8ff",
  textStrong: "#40367f",
};

const colors = {
  bg: "#f5f2fb",
  panel: "#ffffff",
  border: docuWraiteColors.border,
  headerBlue: docuWraiteColors.surfaceAccent,
  topPurple: docuWraiteColors.primary,
  text: "#312447",
  muted: docuWraiteColors.primaryMuted,
  link: "#7e57c2",
  green: "#5b3db6",
  red: "#d32f2f",
  lightBorder: docuWraiteColors.borderSoft,
  rowBorder: docuWraiteColors.borderRow,
  headerText: docuWraiteColors.textStrong,
  tableHead: docuWraiteColors.secondary,
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

const documentationHowToGuides = [
  {
    title: "How to start a note",
    summary: "Open the correct documentation block before writing.",
    steps: [
      "Confirm the correct individual, module, and time block.",
      "Open the documentation row that matches the service you are charting.",
      "Review active alerts, appointments, and health tasks before entering details.",
    ],
  },
  {
    title: "How to document support provided",
    summary: "Describe what staff actually did and why it mattered.",
    steps: [
      "Document the exact prompt, cue, supervision, or hands-on support provided.",
      "Record the individual's response, participation, and tolerance.",
      "Add any safety, aspiration, fall, or behavior follow-up tied to the care plan.",
    ],
  },
  {
    title: "How to finalize documentation",
    summary: "Close the note without leaving readiness gaps behind.",
    steps: [
      "Check that refusals, delays, and incomplete items are documented clearly.",
      "Route unresolved follow-up to handoff or supervisor review when needed.",
      "Use the reference PDFs to verify demographic or medical details before saving.",
    ],
  },
  {
    title: "How to use Decision Engine",
    summary: "Build and assign guided question sets for the DSP case note.",
    steps: [
      "Open the Decision Engine module and choose the library, note type, and target block or row.",
      "Select the questions and branches you want included, then lock the library assignment.",
      "Use Final Assign to send staged assignments into the DSP Case Note before documentation starts.",
    ],
  },
];

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

function getMeasurableDocumentationItems(clientProfile = getMaryBetProfile()) {
  return buildMeasurableDocumentationItems(clientProfile);
}

function getCaseNoteDocumentationItems(clientProfile = getMaryBetProfile()) {
  return buildCaseNoteDocumentationItems(clientProfile);
}

function isLegacyDecisionEngineSeedRow(row = {}) {
  return /^case-note-\d+$/.test(String(row.id || "")) && String(row.source || "") === "Case Note";
}

function stripLegacyDecisionEngineSeedRows(rows = []) {
  return rows.filter((row) => !isLegacyDecisionEngineSeedRow(row));
}

function getDecisionEngineDefaultRows(clientProfile = null, workflowId = "behavior-support") {
  const rows = clientProfile
    ? buildCaseNoteDocumentationItems(clientProfile)
    : getCaseNoteDocumentationItems();
  const matchingRows = rows.filter((row) => row.workflowId === workflowId);
  return matchingRows.length ? [matchingRows[0]] : rows.slice(0, 1);
}

function createTimeBlockEntry(block, index) {
  return {
    ...block,
    score: "",
    comment: "",
    order: index,
  };
}

function getTimeBlockLabelValue(blockOrLabel = "") {
  if (typeof blockOrLabel === "object" && blockOrLabel !== null) {
    return String(blockOrLabel.label || "");
  }
  return String(blockOrLabel || "");
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
  return `block-${startHour}-${endHour}-${index}`;
}

function parseScheduleBlockHours(block = {}) {
  const idMatch = String(block.id || "").match(/^block-(\d+)-(\d+)-/);
  if (idMatch) {
    return {
      startHour: Number(idMatch[1]),
      endHour: Number(idMatch[2]),
    };
  }

  return { startHour: 7, endHour: 8 };
}

function buildBuilderDraftSeedFromTarget(
  targetKey = "",
  timeBlocks = [],
  rowTargets = [],
  fallbackLabel = "",
  fallbackDescription = ""
) {
  if (!targetKey) {
    return null;
  }

  if (targetKey.startsWith("time:")) {
    const blockId = targetKey.slice("time:".length);
    const block = timeBlocks.find((entry) => entry.id === blockId);
    const blockDescription = String(block?.description || fallbackDescription || "").trim();
    if (!block && !blockDescription) {
      return null;
    }

    const { startHour, endHour } = parseScheduleBlockHours(block || { id: blockId });
    return {
      blockDescription,
      blockWorkflowId: block?.workflowId || "behavior-support",
      blockStartHour: startHour,
      blockEndHour: endHour,
    };
  }

  if (targetKey.startsWith("row:")) {
    const rowId = targetKey.slice("row:".length);
    const row = rowTargets.find((entry) => entry.id === rowId);
    const rowDescription = String(row?.description || fallbackDescription || fallbackLabel || "").trim();
    if (!rowDescription) {
      return null;
    }

    return {
      rowDescription,
      rowWorkflowId: row?.workflowId || "behavior-support",
    };
  }

  return null;
}

function buildInitialBlockDraftState(seed = null, defaultWorkflowId = "behavior-support") {
  if (!seed?.blockDescription) {
    return {
      drafts: {},
      workflowId: seed?.blockWorkflowId || defaultWorkflowId,
    };
  }

  const workflowId = seed.blockWorkflowId || defaultWorkflowId;
  return {
    drafts: { [workflowId]: seed.blockDescription },
    workflowId,
  };
}

function buildInitialRowDraftState(seed = null, defaultWorkflowId = "behavior-support") {
  if (!seed?.rowDescription) {
    return {
      drafts: {},
      workflowId: seed?.rowWorkflowId || defaultWorkflowId,
    };
  }

  const workflowId = seed.rowWorkflowId || defaultWorkflowId;
  return {
    drafts: { [workflowId]: seed.rowDescription },
    workflowId,
  };
}

function getTimeBlockPrompt(blockOrLabel, clientProfile = null) {
  if (typeof blockOrLabel === "object" && String(blockOrLabel?.description || "").trim()) {
    return String(blockOrLabel.description).trim();
  }

  const profile = clientProfile || getMaryBetProfile();
  const displayName = profile.displayName || patientDisplayName;
  const blockLabel = getTimeBlockLabelValue(blockOrLabel);
  if (profile.timeBlockMappings?.[blockLabel]?.prompt) {
    return profile.timeBlockMappings[blockLabel].prompt;
  }

  return `Document staff support rendered and observed response for ${displayName} during ${blockLabel}.`;
}

function getTimeBlockSource(blockOrLabel, clientProfile = null) {
  if (typeof blockOrLabel === "object" && String(blockOrLabel?.source || "").trim()) {
    return String(blockOrLabel.source).trim();
  }

  const blockLabel = getTimeBlockLabelValue(blockOrLabel);
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

function getAssignedWorkflowStepsForField(fieldContext = {}) {
  if (fieldContext.assignedWorkflowSteps?.length) {
    return fieldContext.assignedWorkflowSteps;
  }
  return createAssignedWorkflowSteps(fieldContext.assignedNodes || []);
}

function fieldHasAssignedDecisionWorkflow(fieldContext = {}) {
  if ((fieldContext.assignedNodes || []).length) {
    return true;
  }

  const steps = getAssignedWorkflowStepsForField(fieldContext);
  return steps.some((step) => step.kind !== "draft");
}

function getTimeBlockWorkflowId(blockOrLabel, clientProfile = null) {
  if (typeof blockOrLabel === "object" && (blockOrLabel?.assignedNodes || []).length) {
    return "assigned-nodes";
  }

  if (typeof blockOrLabel === "object" && String(blockOrLabel?.workflowId || "").trim()) {
    return String(blockOrLabel.workflowId).trim();
  }

  const blockLabel = getTimeBlockLabelValue(blockOrLabel);
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
  const normalizedChoices = choices.map((choice) => String(choice).trim().toLowerCase());
  if (!normalizedChoices.length) {
    return false;
  }

  if (normalizedChoices.includes("yes") && normalizedChoices.includes("no")) {
    return false;
  }

  return true;
}

function isDecisionExclusiveStatusChoice(choice = "") {
  return DECISION_EXCLUSIVE_STATUS_CHOICES.has(String(choice).trim().toLowerCase());
}

function normalizeDecisionNodeChoices(choices = []) {
  return choices.map((choice) => (String(choice).trim() === "Other" ? "Other..." : choice));
}

function titleCaseDecisionLabel(value = "") {
  return String(value || "")
    .replace(/[`]/g, "")
    .replace(/[-_]+/g, " ")
    .replace(/\bai\b/gi, "AI")
    .replace(/\bif\b/gi, "If")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function getDecisionConditionDisplayText(condition = "") {
  const raw = String(condition || "").replace(/[`]/g, "").trim();
  if (!raw) {
    return "";
  }

  const includesMatch = raw.match(/^(.+?)\s+includes\s+(.+)$/i);
  if (includesMatch) {
    const field = titleCaseDecisionLabel(includesMatch[1]);
    const values = includesMatch[2]
      .split(/\s+or\s+/i)
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => `"${part}"`)
      .join(" or ");
    return `${field} includes ${values}`;
  }

  const selectedMatch = raw.match(/^(.+?)-selected$/i);
  if (selectedMatch) {
    return `${titleCaseDecisionLabel(selectedMatch[1])} was selected`;
  }

  return titleCaseDecisionLabel(raw);
}

function getDecisionNodeDisplayTitle(node = {}) {
  if (node.conditions?.length && !node.question) {
    return "Conditional Rule";
  }

  return titleCaseDecisionLabel(node.title || node.id || "Decision Node");
}

function getDecisionNodeDisplayQuestion(node = {}) {
  if (node.question) {
    return node.question;
  }

  if (node.conditions?.length) {
    return `Runs when ${getDecisionConditionDisplayText(node.conditions[0])}.`;
  }

  return "";
}

function getDecisionConditionalNote(node = {}) {
  if (!node.conditions?.length || node.question) {
    return "";
  }

  return "This is a trigger rule. You do not answer it directly. It activates the next rule when the condition above is true.";
}

function isDecisionConditionalNode(node = {}) {
  return Boolean(node.conditions?.length && !node.question);
}

function getDecisionNodeDisplayChoices(node = {}) {
  return (node.choices || []).filter(Boolean);
}

function getDecisionSectionFilterLabel(sectionKey = "") {
  const normalized = String(sectionKey || "").trim();
  if (!normalized) {
    return "Uncategorized";
  }

  return normalized.replace(/^[A-Z]\.\s+/, "");
}

function getDecisionNoteTypeKey(nodeOrSection = "", librarySlug = "") {
  const section =
    typeof nodeOrSection === "string"
      ? nodeOrSection
      : nodeOrSection?.section || nodeOrSection?.title || "";
  const library =
    librarySlug ||
    (typeof nodeOrSection === "object" ? nodeOrSection?.library || nodeOrSection?.sourceLibrary : "");
  const normalized = String(section || "").trim().toLowerCase();

  if (normalized.includes("row note") || normalized.includes("case note row")) {
    return "row-note";
  }

  if (
    normalized.includes("final case note") ||
    normalized.includes("final note") ||
    normalized.includes("final case")
  ) {
    return "final-note";
  }

  if (normalized.includes("handoff") || normalized.includes("handover")) {
    return "handover-note";
  }

  if (
    normalized.includes("medication-support") ||
    /\borders?\b/.test(normalized) ||
    normalized.includes("mar ") ||
    normalized.includes("medication order") ||
    normalized.includes("prescription")
  ) {
    return "orders";
  }

  if (
    normalized.includes("block summary") ||
    normalized.includes("block time") ||
    normalized.includes("runtime") ||
    normalized.includes("schedule") ||
    normalized.includes("appointments") ||
    normalized.includes("adl") ||
    normalized.includes("behavior") ||
    normalized.includes("meal") ||
    normalized.includes("feeding") ||
    normalized.includes("communication") ||
    normalized.includes("community") ||
    normalized.includes("outing") ||
    normalized.includes("hygiene") ||
    normalized.includes("leisure") ||
    normalized.includes("return-home") ||
    normalized.includes("return home") ||
    normalized.includes("in-home") ||
    normalized.includes("medication") ||
    normalized.includes("playbook") ||
    normalized.includes("readiness") ||
    normalized.includes("branch")
  ) {
    return "block-time";
  }

  if (library === "aidraft") {
    if (normalized.includes("language") || normalized.includes("safety control")) {
      return "block-time";
    }
    return "block-time";
  }

  if (["baseplan", "careplan", "branching", "readiness", "playbookR", "runtime"].includes(library)) {
    return "block-time";
  }

  return "block-time";
}

function nodeMatchesDecisionNoteType(node, noteType, librarySlug = "") {
  const activeNoteType = normalizeDecisionNoteType(noteType);
  const nodeNoteType = getDecisionNoteTypeKey(node, librarySlug || node?.library);
  return nodeNoteType === activeNoteType;
}

function normalizeDecisionNoteType(noteTypeKey = "") {
  const key = String(noteTypeKey || "").trim();
  if (!key || key === "all") {
    return "block-time";
  }
  if (key === "case-note-row") {
    return "row-note";
  }
  return DECISION_NOTE_TYPE_OPTIONS.some((option) => option.value === key) ? key : "block-time";
}

function getDecisionNoteTypeLabel(noteTypeKey = "") {
  const normalized = normalizeDecisionNoteType(noteTypeKey);
  const match = DECISION_NOTE_TYPE_OPTIONS.find((option) => option.value === normalized);
  return match?.label || "Block time";
}

function getDecisionNodeSelectedChoices(node = {}, choiceSelections = {}) {
  return choiceSelections[buildDecisionNodeSelectionKey(node)] || [];
}

function nodeRequiresDecisionChoice(node = {}) {
  return !isDecisionConditionalNode(node) && getDecisionNodeDisplayChoices(node).length > 0;
}

function getMissingDecisionChoiceNodeKeys(selectedKeys = [], selections = {}) {
  const allNodesByKey = new Map(
    decisionNodes.libraries
      .flatMap((library) => library.nodes || [])
      .map((node) => [buildDecisionNodeSelectionKey(node), node])
  );

  return selectedKeys.filter((key) => {
    const node = allNodesByKey.get(key);
    if (!node || !nodeRequiresDecisionChoice(node)) {
      return false;
    }
    return !(selections[key] || []).length;
  });
}

function createAssignedWorkflowSteps(assignedNodes = []) {
  const steps = assignedNodes
    .filter((node) => node?.question || getDecisionNodeDisplayQuestion(node))
    .map((node) => {
      const displayQuestion = getDecisionNodeDisplayQuestion(node) || node.question;
      const suggestions = normalizeDecisionNodeChoices(
        node.selectedChoices?.length ? node.selectedChoices : node.choices || []
      );
      return {
        stepKey: node.stepKey || buildDecisionNodeStepKey(node),
        kind: inferDecisionNodeKind(suggestions),
        question: displayQuestion,
        suggestions,
        allowCustom: suggestions.includes("Other..."),
        multiSelect: inferDecisionNodeMultiSelect(displayQuestion, suggestions),
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

function mapAssignedWorkflowAnswersForDraft(workflowSnapshot = {}) {
  const answers = workflowSnapshot.answers || {};
  const steps = (workflowSnapshot.localSteps || []).filter((step) => step.kind !== "draft");
  const assignedResponses = {};

  steps.forEach((step) => {
    const value = getWorkflowAnswer(answers, step.stepKey);
    const narration = String(
      answers[step.narrationField || `${step.stepKey}Narration`] ||
        answers[`${kebabToCamel(step.stepKey)}Narration`] ||
        ""
    ).trim();
    const label = step.question || step.stepKey;

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      assignedResponses[label] = value;
    }
    if (narration) {
      assignedResponses[`${label} (narration)`] = narration;
    }
  });

  return {
    ...answers,
    assignedResponses,
    draftContextResponses: answers.draftContextResponses || {},
    assignedWorkflowId: "assigned-nodes",
  };
}

const DEFAULT_DRAFT_CONTEXT_TOGGLES = {
  assignedAnswers: true,
  blockDescription: true,
  shiftOverdue: false,
  appointments: false,
  medicationsDue: false,
  alerts: false,
  incompleteGoals: false,
  carePlan: false,
  existingComment: false,
};

const DRAFT_CONTEXT_PRIMARY_TOGGLE = {
  key: "assignedAnswers",
  label: "Assigned answers",
  locked: true,
};

const DRAFT_CONTEXT_GRID_TOGGLES = [
  { key: "shiftOverdue", label: "Shift overdue", intelKey: "overdue" },
  { key: "appointments", label: "Appointments", intelKey: "appointments" },
  { key: "medicationsDue", label: "Meds due", intelKey: "medicationsDue" },
  { key: "carePlan", label: "Care plan", intelKey: null },
  { key: "alerts", label: "Alerts", intelKey: "alerts" },
  { key: "incompleteGoals", label: "Incomplete goals", intelKey: "incompleteGoals" },
  { key: "blockDescription", label: "Block note", fieldKey: "description" },
  { key: "existingComment", label: "This field", fieldKey: "currentNote" },
];

function getDefaultDraftContextToggles() {
  return { ...DEFAULT_DRAFT_CONTEXT_TOGGLES };
}

function normalizeDraftContextToggles(toggles = {}) {
  const resolved = { ...DEFAULT_DRAFT_CONTEXT_TOGGLES, ...toggles };
  if (toggles.shiftIntelligence) {
    resolved.shiftOverdue = true;
    resolved.appointments = true;
    resolved.medicationsDue = true;
    resolved.alerts = true;
    resolved.incompleteGoals = true;
  }
  return resolved;
}

function truncateDraftTogglePreview(text, maxLength = 52) {
  const trimmed = String(text || "").replace(/\s+/g, " ").trim();
  if (!trimmed) {
    return "—";
  }
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function getDraftContextTogglePreview(option, fieldContext = {}, currentNote = "") {
  const intel = fieldContext.shiftIntelligence || {};

  if (option.intelKey) {
    const items = intel[option.intelKey];
    if (!Array.isArray(items) || !items.length) {
      return "None on shift card";
    }
    return truncateDraftTogglePreview(items.join(" · "));
  }

  if (option.key === "carePlan") {
    return "Support plan excerpts";
  }

  if (option.fieldKey === "description") {
    return truncateDraftTogglePreview(fieldContext.description || fieldContext.label || "");
  }

  if (option.fieldKey === "currentNote") {
    return truncateDraftTogglePreview(currentNote);
  }

  return "—";
}

function chunkDraftTogglePairs(items = []) {
  const rows = [];
  for (let index = 0; index < items.length; index += 2) {
    rows.push(items.slice(index, index + 2));
  }
  return rows;
}

function attachDraftContextClarifications(sectionEntry, toggleKey, draftContextResponses = {}) {
  const clarifications = formatDraftContextClarificationsForPrompt(toggleKey, draftContextResponses);
  if (!clarifications.length) {
    return sectionEntry;
  }
  const { content } = sectionEntry;
  if (Array.isArray(content)) {
    return {
      ...sectionEntry,
      content: [...content, { dspClarifications: clarifications }],
    };
  }
  if (content && typeof content === "object") {
    return {
      ...sectionEntry,
      content: { ...content, dspClarifications: clarifications },
    };
  }
  return {
    ...sectionEntry,
    content: { source: content, dspClarifications: clarifications },
  };
}

function buildEnabledDraftSections(
  toggles,
  fieldContext = {},
  currentNote = "",
  mappedAnswers = {},
  draftContextResponses = {}
) {
  const resolved = normalizeDraftContextToggles(toggles);
  const intel =
    fieldContext.shiftIntelligence ||
    getShiftIntelligenceRuntime(getMaryBetProfile(), fieldContext.documentationSession);
  const sections = [];
  const finalize = (entry, toggleKey) =>
    attachDraftContextClarifications(entry, toggleKey, draftContextResponses);

  const pushListSection = (key, label, items) => {
    if (!resolved[key]) {
      return;
    }
    sections.push(
      finalize(
        {
          key,
          label,
          content: Array.isArray(items) && items.length ? items : ["No items on shift card for this category."],
        },
        key
      )
    );
  };

  if (resolved.assignedAnswers) {
    sections.push(
      finalize(
        {
          key: "assignedAnswers",
          label: "Assigned question answers",
          content: mappedAnswers.assignedResponses || {},
        },
        "assignedAnswers"
      )
    );
  }

  if (resolved.blockDescription) {
    sections.push(
      finalize(
        {
          key: "blockDescription",
          label: "Schedule block description",
          content: String(fieldContext.description || fieldContext.label || "No block description.").trim(),
        },
        "blockDescription"
      )
    );
  }

  pushListSection("shiftOverdue", "Shift overdue", intel.overdue);
  pushListSection("appointments", "Appointments", intel.appointments);
  pushListSection("medicationsDue", "Meds due", intel.medicationsDue);
  pushListSection("alerts", "Shift alerts", intel.alerts);
  pushListSection("incompleteGoals", "Incomplete goals", intel.incompleteGoals);

  if (resolved.alerts && Array.isArray(intel.activeRisks) && intel.activeRisks.length) {
    sections.push(
      finalize(
        {
          key: "activeRisks",
          label: "Active risks",
          content: intel.activeRisks,
        },
        "alerts"
      )
    );
  }

  if (resolved.carePlan) {
    sections.push(
      finalize({
        key: "carePlan",
        label: "Care plan excerpts",
        includeCarePlanExcerpt: true,
      }, "carePlan")
    );
  }

  if (resolved.existingComment) {
    sections.push(
      finalize(
        {
          key: "existingComment",
          label: "Text already in this field",
          content: String(currentNote || "No text in this field yet.").trim(),
        },
        "existingComment"
      )
    );
  }

  return sections;
}

function isDraftToggleEnabledButEmpty(option, toggles, fieldContext, currentNote) {
  if (!normalizeDraftContextToggles(toggles)[option.key]) {
    return false;
  }
  if (option.key === "assignedAnswers" || option.key === "carePlan") {
    return false;
  }
  const preview = getDraftContextTogglePreview(option, fieldContext, currentNote);
  return preview === "None on shift card" || preview === "—";
}

function DocuWraiteDraftContextToggles({ toggles = {}, onToggle, fieldContext = {}, currentNote = "" }) {
  const resolvedToggles = normalizeDraftContextToggles(toggles);
  const gridRows = chunkDraftTogglePairs(DRAFT_CONTEXT_GRID_TOGGLES);

  const renderChip = (option) => {
    const isOn = Boolean(resolvedToggles[option.key]);
    const isLocked = Boolean(option.locked);
    const preview = getDraftContextTogglePreview(option, fieldContext, currentNote);

    return (
      <Pressable
        key={option.key}
        style={[
          styles.docuWraiteDraftToggleChip,
          isOn && styles.docuWraiteDraftToggleChipActive,
          isLocked && styles.docuWraiteDraftToggleChipLocked,
        ]}
        onPress={() => {
          if (!isLocked) {
            onToggle?.(option.key, !isOn);
          }
        }}
        disabled={isLocked}
      >
        <View style={styles.docuWraiteDraftToggleChipTop}>
          <Text
            style={[styles.docuWraiteDraftToggleChipLabel, isOn && styles.docuWraiteDraftToggleChipLabelActive]}
          >
            {option.label}
          </Text>
          {isOn ? <Text style={styles.docuWraiteDraftToggleChipOn}>ON</Text> : null}
        </View>
        <Text style={styles.docuWraiteDraftToggleChipPreview} numberOfLines={2}>
          {option.key === "assignedAnswers" ? "Your library answers" : preview}
        </Text>
        {isDraftToggleEnabledButEmpty(option, resolvedToggles, fieldContext, currentNote) ? (
          <Text style={styles.docuWraiteDraftToggleChipWarn}>ON — no shift data to send</Text>
        ) : null}
      </Pressable>
    );
  };

  return (
    <View style={styles.docuWraiteDraftToggleBox}>
      <Text style={styles.docuWraiteDraftToggleHeading}>Include when generating</Text>
      <View style={styles.docuWraiteDraftTogglePrimaryRow}>
        {renderChip(DRAFT_CONTEXT_PRIMARY_TOGGLE)}
      </View>
      {gridRows.map((row, rowIndex) => (
        <View key={`draft-toggle-row-${rowIndex}`} style={styles.docuWraiteDraftToggleGridRow}>
          {row.map((option) => (
            <View key={option.key} style={styles.docuWraiteDraftToggleGridCell}>
              {renderChip(option)}
            </View>
          ))}
          {row.length === 1 ? <View style={styles.docuWraiteDraftToggleGridCell} /> : null}
        </View>
      ))}
    </View>
  );
}

const DRAFT_CONTEXT_QUESTION_TRANSITION_MS = 220;

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function runDraftContextQuestionLayoutAnimation() {
  LayoutAnimation.configureNext({
    duration: DRAFT_CONTEXT_QUESTION_TRANSITION_MS,
    update: { type: LayoutAnimation.Types.easeInEaseOut },
    create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
  });
}

function useDraftContextQuestionState(toggles, fieldContext, responses) {
  const resolvedToggles = normalizeDraftContextToggles(toggles);
  const togglesWithTrees = getDraftContextTogglesNeedingQuestions(resolvedToggles);
  const active = getFirstIncompleteDraftContextQuestion(resolvedToggles, responses, fieldContext);
  const pendingTrees = countIncompleteDraftContextQuestions(resolvedToggles, responses, fieldContext);
  const [textDraft, setTextDraft] = useState("");

  useEffect(() => {
    if (!active?.responseKey) {
      setTextDraft("");
      return;
    }
    setTextDraft(String(responses[active.responseKey] || ""));
  }, [active?.responseKey, responses]);

  return {
    resolvedToggles,
    togglesWithTrees,
    active,
    pendingTrees,
    textDraft,
    setTextDraft,
  };
}

function DocuWraiteDraftContextQuestionBody({
  active,
  pendingTrees,
  responses,
  textDraft,
  onTextDraftChange,
  onSaveResponse,
  compact = false,
}) {
  if (!active) {
    return null;
  }

  const suggestionCount = (active.suggestions || []).length;
  const scrollChoices = !compact && suggestionCount > 4;

  const choices =
    active.kind === "text" ? (
      <>
        <TextInput
          value={textDraft}
          onChangeText={onTextDraftChange}
          placeholder="Type your answer"
          placeholderTextColor="#888888"
          multiline
          style={styles.docuWraiteDraftContextQuestionTextInput}
        />
        <Pressable style={styles.docuWraiteWorkflowNext} onPress={() => onSaveResponse(textDraft)}>
          <Text style={styles.docuWraiteWorkflowNextText}>Continue</Text>
        </Pressable>
      </>
    ) : (
      <View style={styles.docuWraiteWorkflowSuggestionList}>
        {(active.suggestions || []).map((suggestion) => {
          const isSelected = responses[active.responseKey] === suggestion;
          return (
            <Pressable
              key={`${active.responseKey}-${suggestion}`}
              style={[
                styles.docuWraiteWorkflowSuggestion,
                isSelected && styles.docuWraiteWorkflowSuggestionActive,
              ]}
              onPress={() => onSaveResponse(suggestion)}
            >
              <Text
                style={[
                  styles.docuWraiteWorkflowSuggestionText,
                  isSelected && styles.docuWraiteWorkflowSuggestionTextActive,
                ]}
              >
                {suggestion}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );

  return (
    <View key={active.responseKey} style={styles.docuWraiteDraftContextQuestionBody}>
      <Text style={styles.docuWraiteDraftContextQuestionsSource}>
        {`Because “${active.treeLabel}” is ON`}
      </Text>
      <Text style={styles.docuWraiteDraftContextQuestionsPrompt}>{active.question}</Text>
      {scrollChoices ? (
        <ScrollView
          style={styles.docuWraiteDraftContextQuestionOptionsScroll}
          contentContainerStyle={styles.docuWraiteDraftContextQuestionOptionsContent}
          nestedScrollEnabled
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
        >
          {choices}
        </ScrollView>
      ) : (
        choices
      )}
      {compact ? (
        <Text style={styles.docuWraiteDraftContextQuestionsInlineMeta}>
          {`${pendingTrees} item${pendingTrees === 1 ? "" : "s"} left before Generate note`}
        </Text>
      ) : null}
    </View>
  );
}

/** Centered modal — first question or when reopened from inline. */
function DocuWraiteDraftContextQuestionModal({
  visible,
  toggles,
  fieldContext,
  responses,
  onSaveResponse,
  onMoveInline,
}) {
  const { togglesWithTrees, active, pendingTrees, textDraft, setTextDraft } = useDraftContextQuestionState(
    toggles,
    fieldContext,
    responses
  );
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: DRAFT_CONTEXT_QUESTION_TRANSITION_MS,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  if (!togglesWithTrees.length || !active) {
    return null;
  }

  const saveResponse = (value) => {
    if (!active?.responseKey || !String(value || "").trim()) {
      return;
    }
    runDraftContextQuestionLayoutAnimation();
    onSaveResponse(active.responseKey, String(value).trim());
    setTextDraft("");
    onMoveInline?.();
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onMoveInline}>
      <View style={styles.docuWraiteDraftContextToastRoot} pointerEvents="box-none">
        <Pressable style={styles.docuWraiteDraftContextToastBackdrop} onPress={onMoveInline} />
        <View style={styles.docuWraiteDraftContextToastCenter} pointerEvents="box-none">
          <Animated.View style={[styles.docuWraiteDraftContextToastCard, { opacity }]} pointerEvents="auto">
            <View style={styles.docuWraiteDraftContextModalHeader}>
              <View style={styles.docuWraiteDraftContextToastTitleWrap}>
                <Text style={styles.docuWraiteDraftContextQuestionsHeading}>
                  Questions for ticked items
                </Text>
                <Text style={styles.docuWraiteDraftContextQuestionsHint}>
                  {`${pendingTrees} item${pendingTrees === 1 ? "" : "s"} to answer before Generate note`}
                </Text>
              </View>
              <Pressable hitSlop={8} onPress={onMoveInline} style={styles.docuWraiteDraftContextModalClose}>
                <Text style={styles.docuWraiteDraftContextModalCloseText}>✕</Text>
              </Pressable>
            </View>
            <DocuWraiteDraftContextQuestionBody
              active={active}
              pendingTrees={pendingTrees}
              responses={responses}
              textDraft={textDraft}
              onTextDraftChange={setTextDraft}
              onSaveResponse={saveResponse}
            />
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

/** Inline card in workflow panel — continues after modal handoff. */
function DocuWraiteDraftContextQuestionInline({
  visible,
  toggles,
  fieldContext,
  responses,
  onSaveResponse,
  onExpandModal,
}) {
  const { togglesWithTrees, active, pendingTrees, textDraft, setTextDraft } = useDraftContextQuestionState(
    toggles,
    fieldContext,
    responses
  );
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: DRAFT_CONTEXT_QUESTION_TRANSITION_MS,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  if (!visible || !togglesWithTrees.length || !active) {
    return null;
  }

  const saveResponse = (value) => {
    if (!active?.responseKey || !String(value || "").trim()) {
      return;
    }
    runDraftContextQuestionLayoutAnimation();
    onSaveResponse(active.responseKey, String(value).trim());
    setTextDraft("");
  };

  return (
    <Animated.View style={[styles.docuWraiteDraftContextQuestionInlineCard, { opacity }]}>
      <View style={styles.docuWraiteDraftContextModalHeader}>
        <View style={styles.docuWraiteDraftContextToastTitleWrap}>
          <Text style={styles.docuWraiteDraftContextQuestionsHeading}>Ticked item question</Text>
        </View>
        <Pressable hitSlop={8} onPress={onExpandModal} style={styles.docuWraiteDraftContextInlineExpand}>
          <Text style={styles.docuWraiteDraftContextInlineExpandText}>Expand</Text>
        </Pressable>
      </View>
      <DocuWraiteDraftContextQuestionBody
        active={active}
        pendingTrees={pendingTrees}
        responses={responses}
        textDraft={textDraft}
        onTextDraftChange={setTextDraft}
        onSaveResponse={saveResponse}
        compact
      />
    </Animated.View>
  );
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

    [rootNode]
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
          selectedChoices: payload.selectedChoices || [],
          rootNodeId: rootNode.id,
          assignmentDepth: selectedDepth,
          includeMode,
        });
      });
  });

  return expandedNodes.sort((left, right) => (left._order || 0) - (right._order || 0));
}

function buildDecisionTargetDisplayLabel(target = {}) {
  if (!target) {
    return "Unassigned target";
  }

  const label = target.label || target.targetId || "Untitled target";
  return target.type === "case-note-row" ? `Row: ${label}` : label;
}

function buildStagedAssignmentSummary(stagedAssignment = {}) {
  const count = Number(stagedAssignment.selectedCount || stagedAssignment.selectedNodesPayload?.length || 0);
  return `${getDecisionLibraryDisplayName(stagedAssignment.selectedLibrary || "library")} -> ${buildDecisionTargetDisplayLabel(stagedAssignment.target)} (${count} selected)`;
}

function truncateAssignmentPreviewText(text, maxLength = 42) {
  const trimmed = String(text || "").replace(/\s+/g, " ").trim();
  if (!trimmed || trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function buildDecisionAssignmentCardPreview(assignment = {}) {
  const allNodes = decisionNodes.libraries.flatMap((lib) => lib.nodes || []);
  const nodesByKey = new Map(allNodes.map((node) => [buildDecisionNodeSelectionKey(node), node]));
  const payload = assignment.selectedNodesPayload || [];
  const questionItems = payload.map((item) => {
    const node = nodesByKey.get(item.key);
    const question = node
      ? getDecisionNodeDisplayQuestion(node) || getDecisionNodeDisplayTitle(node)
      : item.key;
    const choices = (item.selectedChoices || []).filter(Boolean);

    return {
      question,
      choiceLabel: choices.length ? `DSP choices: ${choices.join(", ")}` : "DSP sees all choices",
      includeInFinal: Boolean(item.includeInFinal),
    };
  });
  const includedCount = payload.filter((item) => item.includeInFinal).length;
  const excludedCount = payload.length - includedCount;
  const targetDescription = String(assignment.target?.description || "").trim();
  const scheduleWorkflowId = String(assignment.target?.workflowId || "").trim();
  const libraryLabel = getDecisionLibraryDisplayName(assignment.selectedLibrary);
  const targetLabel = buildDecisionTargetDisplayLabel(assignment.target);
  const finalQuestionCount = questionItems.filter((item) => item.includeInFinal).length;
  const excludedQuestionCount = questionItems.length - finalQuestionCount;

  let compactQuestions = "";
  if (questionItems.length === 1) {
    const item = questionItems[0];
    compactQuestions = `${truncateAssignmentPreviewText(item.question, 44)} (${item.includeInFinal ? "final" : "excl"})`;
  } else if (questionItems.length > 1) {
    compactQuestions = `${truncateAssignmentPreviewText(questionItems[0].question, 30)} +${questionItems.length - 1} more (${finalQuestionCount}F/${excludedQuestionCount}X)`;
  }

  return {
    title: assignment.summary || buildStagedAssignmentSummary(assignment),
    compactTitle: `${libraryLabel} · ${targetLabel}`,
    compactStats: `${payload.length}q · ${includedCount}F · ${excludedCount}X`,
    compactNote: targetDescription ? truncateAssignmentPreviewText(targetDescription, 32) : null,
    compactQuestions,
    settingsLine: [
      getDecisionLibraryDisplayName(assignment.selectedLibrary),
      getDecisionNoteTypeLabel(assignment.selectedNoteType || "block-time"),
      assignment.selectedBranchKey ? `Branch ${assignment.selectedBranchKey}` : null,
      `${assignment.selectedDepth ?? "?"} deep`,
      assignment.includeMode === "full-branch" ? "Full branch" : "Selective branch",
    ]
      .filter(Boolean)
      .join(" • "),
    statsLine: payload.length
      ? `${payload.length} locked · ${includedCount} in final · ${excludedCount} excluded`
      : "No questions locked",
    targetDescription,
    scheduleTagLine: scheduleWorkflowId
      ? `Schedule builder tag: ${getWorkflowEyebrow(scheduleWorkflowId)}`
      : null,
    lockedAtLine: assignment.createdAt
      ? `Locked ${new Date(assignment.createdAt).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })}`
      : null,
    questionItems,
  };
}

function DecisionAssignmentCard({
  assignment,
  onEdit,
  onDelete,
  deleteLabel = "Delete",
  expandAll = false,
}) {
  const preview = buildDecisionAssignmentCardPreview(assignment);
  const [expanded, setExpanded] = useState(false);
  const showDetails = expandAll || expanded;

  useEffect(() => {
    if (!expandAll) {
      setExpanded(false);
    }
  }, [expandAll]);

  const compactLineParts = [preview.compactTitle, preview.compactStats];
  if (preview.compactNote) {
    compactLineParts.push(preview.compactNote);
  }

  return (
    <View style={[styles.decisionStagedCard, !showDetails && styles.decisionStagedCardCompact]}>
      <Pressable
        onPress={() => {
          if (!expandAll) {
            setExpanded((current) => !current);
          }
        }}
        style={[styles.decisionStagedCardTop, !showDetails && styles.decisionStagedCardTopCompact]}
        accessibilityRole="button"
        accessibilityLabel={showDetails ? "Hide assignment details" : "Show assignment details"}
      >
        {showDetails ? (
          <>
            <Text style={styles.decisionStagedTitle}>{preview.title}</Text>
            <Text style={styles.decisionStagedMeta}>{preview.settingsLine}</Text>
            <Text style={styles.decisionStagedStats}>{preview.statsLine}</Text>
            {preview.targetDescription ? (
              <Text style={styles.decisionStagedDescription}>Block/row note: {preview.targetDescription}</Text>
            ) : null}
            {preview.scheduleTagLine ? (
              <Text style={styles.decisionStagedScheduleTag}>{preview.scheduleTagLine}</Text>
            ) : null}
            {preview.lockedAtLine ? (
              <Text style={styles.decisionStagedLockedAt}>{preview.lockedAtLine}</Text>
            ) : null}
            {preview.questionItems.length ? (
              <ScrollView
                style={styles.decisionStagedQuestionScroll}
                nestedScrollEnabled
                showsVerticalScrollIndicator
              >
                <View style={styles.decisionStagedQuestionList}>
                  <Text style={styles.decisionStagedQuestionHeading}>Assigned questions</Text>
                  {preview.questionItems.map((item, index) => (
                    <View key={`${assignment.id}-question-${index}`} style={styles.decisionStagedQuestionItem}>
                      <Text style={styles.decisionStagedQuestionText}>
                        {item.includeInFinal ? "[Final] " : "[Excluded] "}
                        {item.question}
                      </Text>
                      <Text style={styles.decisionStagedQuestionDetail}>{item.choiceLabel}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            ) : null}
          </>
        ) : (
          <>
            <Text style={styles.decisionStagedCompactLine} numberOfLines={2}>
              {compactLineParts.join(" · ")}
            </Text>
            {preview.compactQuestions ? (
              <Text style={styles.decisionStagedCompactQuestions} numberOfLines={2}>
                {preview.compactQuestions}
              </Text>
            ) : null}
          </>
        )}
        {!expandAll ? (
          <Text style={styles.decisionStagedDetailsToggle}>{showDetails ? "Hide details" : "Details"}</Text>
        ) : null}
      </Pressable>
      <View style={styles.decisionStagedActionRow}>
        <Pressable style={styles.decisionStagedAction} onPress={() => onEdit?.(assignment)}>
          <Text style={styles.decisionStagedActionText}>Edit</Text>
        </Pressable>
        <Pressable
          style={[styles.decisionStagedAction, styles.decisionStagedDelete]}
          onPress={() => onDelete?.(assignment.id)}
        >
          <Text style={styles.decisionStagedDeleteText}>{deleteLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function DecisionAssignmentPanelHeader({ title, countLabel, assignments, expandAll, onToggleExpandAll }) {
  return (
    <View style={styles.decisionSummaryRow}>
      <View style={styles.decisionSummaryTitleGroup}>
        <Text style={styles.decisionSummaryText}>{title}</Text>
        <Text style={styles.decisionSummaryText}>{countLabel}</Text>
      </View>
      {assignments.length ? (
        <Pressable onPress={onToggleExpandAll} style={styles.decisionExpandAllButton}>
          <Text style={styles.decisionExpandAllText}>{expandAll ? "Collapse all" : "Expand all"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function buildDecisionAssignmentUniquenessKey(assignment = {}) {
  const library = assignment.selectedLibrary || "";
  const noteType = normalizeDecisionNoteType(assignment.selectedNoteType);
  const targetType = assignment.target?.type || "";
  const targetId = assignment.target?.targetId || "";
  return [library, noteType, targetType, targetId].join("::");
}

function buildDecisionEngineCaseNoteRecord(stagedAssignments = []) {
  const summary = stagedAssignments
    .map((assignment) => {
      const targetLabel = buildDecisionTargetDisplayLabel(assignment.target);
      const expandedNodes = expandAssignedDecisionNodes(assignment.selectedNodesPayload || [], {
        selectedDepth: assignment.selectedDepth || 1,
        includeMode: assignment.includeMode || "selective-branch",
      });
      const questionList = expandedNodes
        .map((node) => {
          const selectedChoiceText = node.selectedChoices?.length ? ` [${node.selectedChoices.join(", ")}]` : "";
          return `- ${getDecisionNodeDisplayQuestion(node) || getDecisionNodeDisplayTitle(node)}${selectedChoiceText}`;
        })
        .join("\n");

      return `${getDecisionLibraryDisplayName(assignment.selectedLibrary)} -> ${targetLabel}\n${questionList}`;
    })
    .join("\n\n");

  return {
    title: "Decision Engine Note",
    summary,
    stagedAssignments,
    config: {
      stagedAssignments: stagedAssignments.map((assignment) => ({
        id: assignment.id,
        selectedLibrary: assignment.selectedLibrary,
        selectedDepth: assignment.selectedDepth,
        includeMode: assignment.includeMode,
        selectedBranchKey: assignment.selectedBranchKey,
        target: assignment.target,
        selectedCount: assignment.selectedCount,
      })),
    },
  };
}

function clearDocumentationTargetAssignmentFields(target = {}) {
  return {
    ...target,
    assignedNodes: [],
    assignedNodeSummary: "",
    assignedNodeConfig: undefined,
  };
}

function buildTargetAssignmentDataFromGroup(assignmentGroup = []) {
  const mappedAssignedNodes = assignmentGroup.flatMap((assignment) => {
    const expandedNodes = expandAssignedDecisionNodes(assignment.selectedNodesPayload || [], {
      selectedDepth: assignment.selectedDepth || 1,
      includeMode: assignment.includeMode || "selective-branch",
    });

    return expandedNodes.map((node) => ({
      id: node.id,
      title: getDecisionNodeDisplayTitle(node),
      question: getDecisionNodeDisplayQuestion(node),
      choices: node.choices || [],
      selectedChoices: node.selectedChoices || [],
      section: node.section,
      library: node.library,
      stepKey: node.stepKey,
      includeInFinal: Boolean(node.includeInFinal),
      assignmentDepth: node.assignmentDepth,
      includeMode: node.includeMode,
    }));
  });

  const assignedNodeSummary = assignmentGroup
    .map((assignment) => {
      const expandedNodes = expandAssignedDecisionNodes(assignment.selectedNodesPayload || [], {
        selectedDepth: assignment.selectedDepth || 1,
        includeMode: assignment.includeMode || "selective-branch",
      });
      const questionList = expandedNodes
        .map((node) => {
          const selectedChoiceText = node.selectedChoices?.length ? ` [${node.selectedChoices.join(", ")}]` : "";
          return `${node.includeInFinal ? "[FINAL] " : ""}- ${getDecisionNodeDisplayQuestion(node) || getDecisionNodeDisplayTitle(node)}${selectedChoiceText}`;
        })
        .join("\n");
      return `${getDecisionLibraryDisplayName(assignment.selectedLibrary)}\n${questionList}`;
    })
    .join("\n\n");

  return {
    assignedNodes: mappedAssignedNodes,
    assignedNodeSummary,
    assignedNodeConfig: {
      stagedAssignments: assignmentGroup.map((assignment) => ({
        id: assignment.id,
        selectedLibrary: assignment.selectedLibrary,
        selectedDepth: assignment.selectedDepth,
        includeMode: assignment.includeMode,
        selectedBranchKey: assignment.selectedBranchKey,
        target: assignment.target,
        selectedCount: assignment.selectedCount,
      })),
    },
  };
}

function groupFinalizedAssignmentsByTarget(finalizedAssignments = []) {
  return finalizedAssignments.reduce((acc, assignment) => {
    if (!assignment?.target?.targetId) {
      return acc;
    }

    const targetKey = `${assignment.target.type}:${assignment.target.targetId}`;
    if (!acc[targetKey]) {
      acc[targetKey] = [];
    }
    acc[targetKey].push(assignment);
    return acc;
  }, {});
}

function applyFinalizedAssignmentsToDocumentationSession(session, finalizedAssignments = []) {
  if (!session || session.sessionType !== "case-note") {
    return session;
  }

  const assignmentsByTarget = groupFinalizedAssignmentsByTarget(finalizedAssignments);

  return {
    ...session,
    decisionEngineNote: buildDecisionEngineCaseNoteRecord(finalizedAssignments),
    timeBlocks: (session.timeBlocks || []).map((block) => {
      const assignmentGroup = assignmentsByTarget[`time-block:${block.id}`];
      if (!assignmentGroup?.length) {
        return clearDocumentationTargetAssignmentFields(block);
      }

      return {
        ...block,
        comment: "",
        workflowId: "assigned-nodes",
        assignedLibraries: assignmentGroup.map((assignment) => assignment.selectedLibrary).filter(Boolean),
        ...buildTargetAssignmentDataFromGroup(assignmentGroup),
      };
    }),
    rows: (session.rows || []).map((row) => {
      const assignmentGroup = assignmentsByTarget[`case-note-row:${row.id}`];
      if (!assignmentGroup?.length) {
        return clearDocumentationTargetAssignmentFields(row);
      }

      return {
        ...row,
        comment: "",
        workflowId: "assigned-nodes",
        assignedLibraries: assignmentGroup.map((assignment) => assignment.selectedLibrary).filter(Boolean),
        ...buildTargetAssignmentDataFromGroup(assignmentGroup),
      };
    }),
  };
}

function runDecisionEngineConfirmAction({
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
}) {
  if (!onConfirm) {
    return;
  }

  if (Platform.OS === "web" && typeof window !== "undefined" && typeof window.confirm === "function") {
    const accepted = window.confirm([title, message].filter(Boolean).join("\n\n"));
    if (accepted) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: cancelLabel, style: "cancel" },
    { text: confirmLabel, style: "destructive", onPress: onConfirm },
  ]);
}

function getDecisionLibraryDisplayName(librarySlug = "") {
  const slug = String(librarySlug || "").trim();
  if (!slug) {
    return "Library";
  }
  if (DECISION_LIBRARY_DISPLAY_NAMES[slug]) {
    return DECISION_LIBRARY_DISPLAY_NAMES[slug];
  }
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

function getDecisionBranchOptions(nodes = []) {
  return Array.from({ length: 10 }, (_, index) => {
    const branchKey = String(index + 1);
    return {
      value: branchKey,
      label: branchKey,
    };
  });
}

function getAvailableDecisionLibraries() {
  return decisionNodes.libraries.filter((lib) => String(lib.library || "").toLowerCase() !== "readme");
}

function getDefaultDecisionLibrarySlug() {
  return getAvailableDecisionLibraries()[0]?.library || "";
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
  const timeBlocks =
    timeBlocksOverride ??
    (isCaseNote ? [] : clientProfile?.documentationTimeBlocks || getMaryBetProfile().documentationTimeBlocks);
  const rows =
    rowsOverride ??
    (clientProfile
      ? (isCaseNote ? [] : buildMeasurableDocumentationItems(clientProfile))
      : isCaseNote
        ? []
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
    decisionEngineNote: null,
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
      h2 { margin: 24px 0 8px; color: #40367f; font-size: 18px; }
      p, li { font-size: 14px; line-height: 1.6; }
      .meta { margin-bottom: 20px; }
      .meta p { margin: 2px 0; }
      .panel { border: 1px solid ${docuWraiteColors.border}; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: ${docuWraiteColors.surface}; }
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
  if ((fieldContext.assignedNodes || []).length) {
    return "assigned-nodes";
  }

  if (fieldHasAssignedDecisionWorkflow(fieldContext)) {
    return "assigned-nodes";
  }

  if (fieldContext.workflowId && fieldContext.workflowId !== "assigned-nodes") {
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
        <Icon name="chevronDown" size={14} color="#666666" />
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
  disabled = false,
}) {
  const isOpen = activeDropdown === dropdownId;
  const containerRef = useRef(null);
  const [menuFrame, setMenuFrame] = useState(null);

  useEffect(() => {
    if (!isOpen || !containerRef.current?.measureInWindow) {
      return;
    }

    containerRef.current.measureInWindow((x, y, width, height) => {
      setMenuFrame({
        x,
        y,
        width,
        height,
      });
    });
  }, [isOpen]);

  return (
    <View
      ref={containerRef}
      collapsable={false}
      style={[
        styles.decisionDropdownWrap,
        fieldStyle,
        isOpen && styles.decisionDropdownWrapOpen,
        disabled && styles.decisionDropdownWrapDisabled,
      ]}
    >
      <Pressable
        style={[styles.decisionDropdown, disabled && styles.decisionDropdownDisabled]}
        disabled={disabled}
        onPress={() => onToggleDropdown(isOpen ? null : dropdownId)}
      >
        <Text
          style={[
            value ? styles.decisionDropdownValue : styles.decisionDropdownPlaceholder,
            disabled && styles.decisionDropdownValueDisabled,
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {value || placeholder}
        </Text>
        <Icon name="chevronDown" size={14} color={disabled ? "#b7add7" : "#6f5a9f"} />
      </Pressable>
      {isOpen ? (
        <Modal transparent visible animationType="none" onRequestClose={() => onToggleDropdown(null)}>
          <View style={styles.decisionDropdownModalRoot}>
            <Pressable style={styles.decisionDropdownModalBackdrop} onPress={() => onToggleDropdown(null)} />
            {menuFrame ? (
              <View
                style={[
                  styles.decisionDropdownMenu,
                  {
                    position: "absolute",
                    top: menuFrame.y + menuFrame.height + 6,
                    left: menuFrame.x,
                    width: menuFrame.width,
                  },
                ]}
              >
                <ScrollView nestedScrollEnabled style={styles.decisionDropdownMenuScroll}>
                  {options.map((option, index) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.decisionDropdownOptionPressable,
                        index === options.length - 1 && styles.decisionDropdownOptionPressableLast,
                      ]}
                      onPress={() => {
                        onChange(option.value);
                        onToggleDropdown(null);
                      }}
                    >
                      <Text style={styles.decisionDropdownOptionLabel}>{option.label}</Text>
                      {option.meta ? <Text style={styles.decisionDropdownOptionMeta}>{option.meta}</Text> : null}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>
        </Modal>
      ) : null}
    </View>
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
  fieldNote = "",
  onAnswer,
  onBack,
  onJumpToStep,
  onInsert,
  onGenerateDraft,
  onClearGuidelineWarning,
  onDraftContextToggle,
  onDraftContextQuestionModeChange,
  onDraftContextSaveResponse,
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
  const assignedDraftLoading = Boolean(workflowState?.assignedDraftLoading);
  const assignedDraftError = workflowState?.assignedDraftError || "";
  const assignedDraftFollowUp = String(workflowState?.assignedDraftFollowUp || "").trim();
  const assignedDraftGuidelineWarning = String(workflowState?.assignedDraftGuidelineWarning || "").trim();
  const assignedAiDraftNote = String(answers.aiDraftNote || "").trim();
  const generatedNote = useAiWorkflow
    ? aiStep?.draftNote || ""
    : useAssignedNodeWorkflow
      ? assignedAiDraftNote
    : workflowId === "community-outing"
      ? generateCommunityOutingNote(answers)
      : "";
  const assignedDraftReady = useAssignedNodeWorkflow && Boolean(assignedAiDraftNote);
  const showAssignedGenerateStep =
    useAssignedNodeWorkflow && stepMeta?.kind === "draft" && !assignedDraftReady && !assignedDraftLoading;
  const draftContextToggles = normalizeDraftContextToggles(workflowState?.draftContextToggles);
  const draftContextResponses = answers.draftContextResponses || {};
  const fieldContextForDraft = workflowState?.fieldContext || {};
  const pendingDraftContextQuestion = getFirstIncompleteDraftContextQuestion(
    draftContextToggles,
    draftContextResponses,
    fieldContextForDraft
  );
  const draftContextQuestionMode = workflowState?.draftContextQuestionMode === "inline" ? "inline" : "modal";
  const showInlineDraftContextQuestion =
    useAssignedNodeWorkflow &&
    stepMeta?.kind === "draft" &&
    draftContextQuestionMode === "inline" &&
    Boolean(pendingDraftContextQuestion);
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
          <ActivityIndicator size="small" color={docuWraiteColors.primary} />
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

  const draftContextQuestionInline = showInlineDraftContextQuestion ? (
    <DocuWraiteDraftContextQuestionInline
      visible
      toggles={draftContextToggles}
      fieldContext={fieldContextForDraft}
      responses={draftContextResponses}
      onSaveResponse={onDraftContextSaveResponse}
      onExpandModal={() => onDraftContextQuestionModeChange?.("modal")}
    />
  ) : null;

  return (
    <View style={styles.docuWraiteWorkflowCard}>
      <ScrollView
        style={[
          styles.docuWraiteWorkflowCardScroll,
          showInlineDraftContextQuestion && styles.docuWraiteWorkflowCardScrollCompact,
        ]}
        contentContainerStyle={styles.docuWraiteWorkflowCardScrollContent}
        nestedScrollEnabled={!showInlineDraftContextQuestion}
        showsVerticalScrollIndicator={!showInlineDraftContextQuestion}
        keyboardShouldPersistTaps="handled"
      >
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
          <ActivityIndicator size="small" color={docuWraiteColors.primary} />
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
          {showAssignedGenerateStep ? (
            <>
              <Text style={styles.docuWraiteWorkflowDraftLead}>
                You finished the assigned library questions. Choose what OpenAI may use, generate the note, then insert
                it into this field.
              </Text>
              <DocuWraiteDraftContextToggles
                toggles={draftContextToggles}
                onToggle={onDraftContextToggle}
                fieldContext={fieldContextForDraft}
                currentNote={fieldNote}
              />
              {draftContextQuestionInline}
              {assignedDraftError ? (
                <Text style={styles.docuWraiteWorkflowAiNotice}>{assignedDraftError}</Text>
              ) : null}
              {pendingDraftContextQuestion && draftContextQuestionMode === "modal" ? (
                <Text style={styles.docuWraiteWorkflowAiNotice}>
                  Answer the centered question, or close it to continue inline here.
                </Text>
              ) : null}
              <Pressable
                style={[
                  styles.docuWraiteWorkflowNext,
                  pendingDraftContextQuestion && styles.docuWraiteWorkflowNextDisabled,
                ]}
                onPress={() => {
                  if (!pendingDraftContextQuestion) {
                    onGenerateDraft?.();
                  }
                }}
              >
                <Text style={styles.docuWraiteWorkflowNextText}>Generate note</Text>
              </Pressable>
            </>
          ) : null}
          {useAssignedNodeWorkflow && assignedDraftLoading ? (
            <View style={styles.docuWraiteWorkflowLoadingRow}>
              <ActivityIndicator size="small" color={docuWraiteColors.primary} />
              <Text style={styles.docuWraiteWorkflowLoading}>Generating note with OpenAI...</Text>
            </View>
          ) : null}
          {!showAssignedGenerateStep && !assignedDraftLoading && generatedNote ? (
            <>
              {useAssignedNodeWorkflow ? (
                <>
                  <DocuWraiteDraftContextToggles
                    toggles={draftContextToggles}
                    onToggle={onDraftContextToggle}
                    fieldContext={fieldContextForDraft}
                    currentNote={fieldNote}
                  />
                  {draftContextQuestionInline}
                </>
              ) : null}
              <Text style={styles.docuWraiteWorkflowDraftText}>{generatedNote}</Text>
              {useAssignedNodeWorkflow && assignedDraftGuidelineWarning ? (
                <View style={styles.docuWraiteWorkflowGuidelineWarningBox}>
                  <Text style={styles.docuWraiteWorkflowGuidelineWarningText}>
                    {assignedDraftGuidelineWarning}
                  </Text>
                  <View style={styles.docuWraiteWorkflowGuidelineWarningActions}>
                    <Pressable
                      style={styles.docuWraiteCardSecondary}
                      onPress={() => onClearGuidelineWarning?.()}
                    >
                      <Text style={styles.docuWraiteCardSecondaryText}>Skip for now</Text>
                    </Pressable>
                    <Pressable
                      style={styles.docuWraiteCardPrimary}
                      onPress={() => {
                        if (!pendingDraftContextQuestion) {
                          onGenerateDraft?.();
                        }
                      }}
                    >
                      <Text style={styles.docuWraiteCardPrimaryText}>Apply guideline and regenerate</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
              {useAssignedNodeWorkflow && assignedDraftFollowUp ? (
                <View style={styles.docuWraiteWorkflowFollowUpBox}>
                  <Text style={styles.docuWraiteWorkflowFollowUpLabel}>Quick check (optional)</Text>
                  <Text style={styles.docuWraiteWorkflowFollowUpQuestion}>{assignedDraftFollowUp}</Text>
                  <TextInput
                    value={answers.clarifyingAnswer || ""}
                    onChangeText={(clarifyingAnswer) => onAnswer({ clarifyingAnswer })}
                    placeholder="Your answer — then tap Regenerate note"
                    placeholderTextColor="#888888"
                    multiline
                    style={styles.docuWraiteWorkflowFollowUpInput}
                  />
                </View>
              ) : null}
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
                {useAssignedNodeWorkflow && !assignedDraftGuidelineWarning ? (
                  <Pressable
                    style={styles.docuWraiteCardSecondary}
                    onPress={() => {
                      if (!pendingDraftContextQuestion) {
                        onGenerateDraft?.();
                      }
                    }}
                  >
                    <Text style={styles.docuWraiteCardSecondaryText}>Regenerate note</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  style={styles.docuWraiteCardPrimary}
                  onPress={() => {
                    if (!draftBlocked) {
                      const noteToInsert = [generatedNote, answers.extraNotes?.trim()]
                        .filter(Boolean)
                        .join(" ");
                      if (workflowId === "case-note-final") {
                        onAnswer({ finalDraftNote: noteToInsert }, { advance: true });
                      } else {
                        onInsert(noteToInsert);
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
            </>
          ) : null}
          {!showAssignedGenerateStep &&
          !assignedDraftLoading &&
          useAssignedNodeWorkflow &&
          !generatedNote &&
          assignedDraftError ? (
            <Pressable
              style={styles.docuWraiteCardSecondary}
              onPress={() => {
                const fallbackNote = generateAssignedWorkflowNote(
                  answers,
                  workflowState,
                  workflowState?.fieldContext || {}
                );
                onAnswer({ aiDraftNote: fallbackNote });
              }}
            >
              <Text style={styles.docuWraiteCardSecondaryText}>Use basic summary instead</Text>
            </Pressable>
          ) : null}
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
      </ScrollView>

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
  showHelpBubble = false,
  onHelpBubblePress,
  onAssistToggle,
  onAssistDismiss,
  onAssistApply,
  onWorkflowAnswer,
  onWorkflowBack,
  onWorkflowJump,
  onWorkflowInsert,
  onWorkflowGenerateDraft,
  onWorkflowDraftContextToggle,
  onWorkflowDraftContextQuestionModeChange,
  onWorkflowDraftContextSaveResponse,
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

  const showAssistChrome = showHelpBubble || !!assist;
  const handleHelpBubblePress = () => {
    if (onHelpBubblePress) {
      onHelpBubblePress();
      return;
    }
    onAssistToggle?.();
  };

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
        {showAssistChrome ? (
          <DocuWraiteBubble assist={assist || { fieldId }} onToggle={handleHelpBubblePress} />
        ) : null}
      </View>
      {assistExpanded ? (
        <Modal transparent visible animationType="fade" onRequestClose={onAssistDismiss}>
          <View style={styles.docuWraiteAssistModalRoot}>
            <Pressable style={styles.docuWraiteAssistModalBackdrop} onPress={onAssistDismiss} />
            <View style={styles.docuWraiteAssistModalSheet}>
              {workflow ? (
                <DocuWraiteGuidedWorkflowPanel
                  workflowId={workflow.workflowId}
                  workflowState={workflow}
                  fieldNote={value}
                  onAnswer={onWorkflowAnswer}
                  onBack={onWorkflowBack}
                  onJumpToStep={onWorkflowJump}
                  onInsert={onWorkflowInsert}
                  onGenerateDraft={onWorkflowGenerateDraft}
                  onClearGuidelineWarning={onWorkflowClearGuidelineWarning}
                  onDraftContextToggle={onWorkflowDraftContextToggle}
                  onDraftContextQuestionModeChange={onWorkflowDraftContextQuestionModeChange}
                  onDraftContextSaveResponse={onWorkflowDraftContextSaveResponse}
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
          </View>
        </Modal>
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
      {rows.map((row) => {
        const rowFieldContext = {
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
        };

        return (
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
                fieldContext={rowFieldContext}
                value={row.comment}
                onChange={(comment) => onCommentChange(row.id, comment)}
                expanded={!!expandedAreas[`row-${row.id}`]}
                onToggleExpanded={() => onToggleExpanded(`row-${row.id}`)}
                {...getCommentAssistProps(`row-${row.id}`, rowFieldContext, row.comment)}
                onAssistActivity={onCommentAssistActivity}
                onAssignQuestions={onAssignQuestions ? () => onAssignQuestions(row) : null}
              />
            </View>
          </View>
        );
      })}
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
  const previousShiftData = clientProfile?.previousShiftSnapshot ?? getMaryBetProfile().previousShiftSnapshot;
  const isCaseNoteSession = session.sessionType === "case-note";
  const runtimeShiftIntelligence = getShiftIntelligenceRuntime(clientProfile || getMaryBetProfile(), session);
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
        description: getTimeBlockPrompt(block, clientProfile),
        source: getTimeBlockSource(block, clientProfile),
        score: block.score,
        comment: block.comment,
        workflowId: getTimeBlockWorkflowId(block, clientProfile),
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

  const generateAssignedNodesDraft = async (workflowSnapshot) => {
    workflowSnapshot = withWorkflowSnapshot(workflowSnapshot);
    if (!workflowSnapshot?.workflowId || workflowSnapshot.workflowId !== "assigned-nodes") {
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
        assignedDraftLoading: true,
        assignedDraftError: "",
      };
    });

    try {
      const mappedAnswers = mapAssignedWorkflowAnswersForDraft(workflowSnapshot);
      const draftContextToggles = normalizeDraftContextToggles(workflowSnapshot.draftContextToggles);
      const fieldContextForDraft = {
        ...(workflowSnapshot.fieldContext || {}),
        shiftIntelligence:
          workflowSnapshot.fieldContext?.shiftIntelligence ||
          getShiftIntelligenceRuntime(clientProfile || getMaryBetProfile(), session),
        assignedWorkflowSteps: workflowSnapshot.localSteps || [],
      };
      const currentNote = workflowSnapshot.currentNote || "";
      const enabledDraftSections = buildEnabledDraftSections(
        draftContextToggles,
        fieldContextForDraft,
        currentNote,
        mappedAnswers,
        workflowSnapshot.answers?.draftContextResponses || {}
      );

      const { step, meta } = await fetchAssignedNodesDraft({
        answers: mappedAnswers,
        fieldContext: fieldContextForDraft,
        patientName: activePatientName,
        currentNote,
        draftContextToggles,
        enabledDraftSections,
      });

      if (docuWraiteWorkflowRequestId.current !== requestId) {
        return;
      }

      const draftNote = String(step?.draftNote || "").trim();
      if (!draftNote) {
        throw new Error("OpenAI did not return a draft note.");
      }

      setDocuWraiteWorkflow((current) => {
        if (!current || current.fieldId !== workflowSnapshot.fieldId) {
          return current;
        }

        return {
          ...current,
          assignedDraftLoading: false,
          assignedDraftError: "",
          assignedDraftFollowUp: String(step?.followUpQuestion || meta?.followUpQuestion || "").trim(),
          assignedDraftGuidelineWarning: String(meta?.guidelineWarning || "").trim(),
          answers: {
            ...current.answers,
            aiDraftNote: draftNote,
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
          assignedDraftLoading: false,
          assignedDraftError:
            error?.message ||
            "DocuWraite could not generate a note with OpenAI. Confirm the API server and OPENAI_API_KEY are set.",
          assignedDraftGuidelineWarning: "",
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

    const assignedNodes = assist.fieldContext?.assignedNodes || [];
    if (assignedNodes.length) {
      const localWorkflowSteps = getAssignedWorkflowStepsForField(assist.fieldContext || {});
      assist = {
        ...assist,
        workflowId: "assigned-nodes",
        title: getWorkflowEyebrow("assigned-nodes"),
        localWorkflowSteps,
        message:
          "DocuWraite will ask only the questions you locked from the Decision Engine library for this block.",
      };
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

        const localSteps = assist.localWorkflowSteps?.length
          ? assist.localWorkflowSteps
          : getAssignedWorkflowStepsForField(assist.fieldContext || {});
        const hasAssignedNodes = (assist.fieldContext?.assignedNodes || []).length > 0;
        const useLocalWorkflow =
          assist.workflowId === "assigned-nodes" &&
          (localSteps.some((step) => step.kind !== "draft") || hasAssignedNodes);

        const startingWorkflow = {
          fieldId: assist.fieldId,
          workflowId: assist.workflowId,
          stepIndex: 0,
          answers: {},
          structuredAnswers: [],
          fieldContext: assist.fieldContext || {},
          localSteps,
          draftContextToggles: getDefaultDraftContextToggles(),
          draftContextQuestionMode: "modal",
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
    const hasAssignedNodes = (fieldContext.assignedNodes || []).length > 0;
    const localWorkflowSteps = getAssignedWorkflowStepsForField(fieldContext);
    const workflowId = hasAssignedNodes
      ? "assigned-nodes"
      : detectDocuWraiteGuidedWorkflow(fieldContext, value, clientProfile);

    if (!workflowId) {
      return false;
    }

    const useAssignedWorkflow =
      workflowId === "assigned-nodes" &&
      (localWorkflowSteps.some((step) => step.kind !== "draft") || hasAssignedNodes);

    if (hasAssignedNodes && !localWorkflowSteps.some((step) => step.kind !== "draft")) {
      const alertMessage =
        "Assigned questions did not load for this block. Go to Decision Engine, lock your library to this time block, then tap Final Assign to Case Note.";
      if (Platform.OS === "web" && typeof window !== "undefined" && typeof window.alert === "function") {
        window.alert(alertMessage);
      } else {
        Alert.alert("Assigned questions not loaded", alertMessage, [{ text: "OK" }]);
      }
      return false;
    }

    showDocuWraiteAssist({
      fieldId,
      id: `workflow-${workflowId}`,
      mode: "workflow",
      workflowId,
      fieldContext,
      localWorkflowSteps: useAssignedWorkflow ? localWorkflowSteps : [],
      title: getWorkflowEyebrow(workflowId),
      message: useAssignedWorkflow
        ? "DocuWraite will ask only the questions you locked from the Decision Engine library for this block."
        : "DocuWraite will guide this note with care-plan questions.",
      trigger: "manual",
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

    if ((fieldContext.assignedNodes || []).length) {
      return;
    }

    if (activity === "focus") {
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

    if (activity === "sentence-end") {
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

  const getCommentAssistProps = (fieldId, fieldContext, value = "") => ({
    showHelpBubble: true,
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
      (docuWraiteWorkflow?.fieldId === fieldId || docuWraiteAssist?.fieldId === fieldId) &&
      docuWraiteExpanded,
    onHelpBubblePress: () => {
      const hasAssignedNodes = (fieldContext.assignedNodes || []).length > 0;
      const isCurrentFieldActive =
        docuWraiteWorkflow?.fieldId === fieldId || docuWraiteAssist?.fieldId === fieldId;

      if (isCurrentFieldActive) {
        setDocuWraiteExpanded((current) => !current);
        return;
      }

      if (hasAssignedNodes) {
        setDocuWraiteAssist(null);
        setDocuWraiteWorkflow(null);
        setDocuWraiteExpanded(false);
        openDocuWraiteWorkflow(fieldId, fieldContext, value);
        return;
      }

      if (
        docuWraiteWorkflow?.fieldId === fieldId &&
        docuWraiteWorkflow?.workflowId === "behavior-support"
      ) {
        setDocuWraiteAssist(null);
        setDocuWraiteWorkflow(null);
        setDocuWraiteExpanded(false);
      }
      openDocuWraiteWorkflow(fieldId, fieldContext, value);
    },
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
          assignedDraftGuidelineWarning: "",
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
    onWorkflowGenerateDraft: () => {
      setDocuWraiteWorkflow((current) => {
        if (!current || current.fieldId !== fieldId || current.workflowId !== "assigned-nodes") {
          return current;
        }

        const next = {
          ...current,
          assignedDraftLoading: true,
          assignedDraftError: "",
          assignedDraftGuidelineWarning: "",
          draftContextToggles: normalizeDraftContextToggles(current.draftContextToggles),
          answers: {
            ...current.answers,
            aiDraftNote: "",
            clarifyingAnswer: "",
          },
          assignedDraftFollowUp: "",
        };
        queueMicrotask(() => generateAssignedNodesDraft(withWorkflowSnapshot(next)));
        return next;
      });
      setDocuWraiteExpanded(true);
    },
    onWorkflowClearGuidelineWarning: () => {
      setDocuWraiteWorkflow((current) => {
        if (!current || current.fieldId !== fieldId || current.workflowId !== "assigned-nodes") {
          return current;
        }

        return {
          ...current,
          assignedDraftGuidelineWarning: "",
        };
      });
    },
    onWorkflowDraftContextToggle: (toggleKey, nextValue) => {
      setDocuWraiteWorkflow((current) => {
        if (!current || current.fieldId !== fieldId) {
          return current;
        }

        const priorResponses = current.answers?.draftContextResponses || {};
        const draftContextResponses = nextValue
          ? priorResponses
          : clearDraftContextResponsesForToggle(priorResponses, toggleKey);
        const nextToggles = {
          ...normalizeDraftContextToggles(current.draftContextToggles),
          [toggleKey]: nextValue,
        };
        const treeKeys = getDraftContextTogglesNeedingQuestions(nextToggles);

        return {
          ...current,
          draftContextToggles: nextToggles,
          draftContextQuestionMode:
            nextValue && treeKeys.includes(toggleKey) ? "modal" : current.draftContextQuestionMode || "modal",
          answers: {
            ...current.answers,
            draftContextResponses,
            aiDraftNote: "",
          },
          assignedDraftFollowUp: "",
          assignedDraftGuidelineWarning: "",
        };
      });
    },
    onWorkflowDraftContextQuestionModeChange: (mode) => {
      runDraftContextQuestionLayoutAnimation();
      setDocuWraiteWorkflow((current) => {
        if (!current || current.fieldId !== fieldId || current.workflowId !== "assigned-nodes") {
          return current;
        }

        return {
          ...current,
          draftContextQuestionMode: mode === "inline" ? "inline" : "modal",
        };
      });
    },
    onWorkflowDraftContextSaveResponse: (responseKey, value) => {
      setDocuWraiteWorkflow((current) => {
        if (!current || current.fieldId !== fieldId || current.workflowId !== "assigned-nodes") {
          return current;
        }

        return {
          ...current,
          answers: {
            ...current.answers,
            draftContextResponses: {
              ...(current.answers?.draftContextResponses || {}),
              [responseKey]: value,
            },
          },
          assignedDraftGuidelineWarning: "",
        };
      });
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
          workflowId: getTimeBlockWorkflowId(block, clientProfile),
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
    const plan = (clientProfile || getMaryBetProfile()).actionPlans?.[0];
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
                  {getTimeBlockPrompt(block, clientProfile)}
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
                    description: getTimeBlockPrompt(block, clientProfile),
                    source: getTimeBlockSource(block, clientProfile),
                    workflowId: getTimeBlockWorkflowId(block, clientProfile),
                    shiftIntelligence: runtimeShiftIntelligence,
                    assignedNodes: block.assignedNodes || [],
                    assignedNodeSummary: block.assignedNodeSummary || "",
                    assignedWorkflowSteps: createAssignedWorkflowSteps(block.assignedNodes || []),
                  }}
                  value={block.comment}
                  onChange={(comment) => updateTimeBlock(block.id, { comment })}
                  expanded={!!expandedAreas[`time-${block.id}`]}
                  onToggleExpanded={() => toggleExpanded(`time-${block.id}`)}
                  {...getCommentAssistProps(`time-${block.id}`, {
                    fieldKind: "time",
                    score: block.score,
                    label: block.label,
                    description: getTimeBlockPrompt(block, clientProfile),
                    source: getTimeBlockSource(block, clientProfile),
                    workflowId: getTimeBlockWorkflowId(block, clientProfile),
                    shiftIntelligence: runtimeShiftIntelligence,
                    assignedNodes: block.assignedNodes || [],
                    assignedNodeSummary: block.assignedNodeSummary || "",
                    assignedWorkflowSteps: createAssignedWorkflowSteps(block.assignedNodes || []),
                  }, block.comment)}
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
              {...getCommentAssistProps("summary", {
                fieldKind: "summary",
                score: "",
                description: isCaseNoteSession ? "Final Case Note" : "End of Shift Summary",
                source: isCaseNoteSession ? "Case Note Final" : "Shift Summary",
                workflowId: isCaseNoteSession ? "case-note-final" : null,
                shiftIntelligence: runtimeShiftIntelligence,
                sourceEntries: isCaseNoteSession ? buildCaseNoteFinalFieldContext().sourceEntries : undefined,
              }, session.shiftSummary)}
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

      {docuWraiteWorkflow?.workflowId === "assigned-nodes" ? (
        <DocuWraiteDraftContextQuestionModal
          visible={
            docuWraiteWorkflow.draftContextQuestionMode !== "inline" &&
            Boolean(
              getFirstIncompleteDraftContextQuestion(
                normalizeDraftContextToggles(docuWraiteWorkflow.draftContextToggles),
                docuWraiteWorkflow.answers?.draftContextResponses || {},
                {
                  ...(docuWraiteWorkflow.fieldContext || {}),
                  shiftIntelligence:
                    docuWraiteWorkflow.fieldContext?.shiftIntelligence ||
                    getShiftIntelligenceRuntime(clientProfile || getMaryBetProfile(), session),
                }
              )
            )
          }
          toggles={normalizeDraftContextToggles(docuWraiteWorkflow.draftContextToggles)}
          fieldContext={{
            ...(docuWraiteWorkflow.fieldContext || {}),
            shiftIntelligence:
              docuWraiteWorkflow.fieldContext?.shiftIntelligence ||
              getShiftIntelligenceRuntime(clientProfile || getMaryBetProfile(), session),
          }}
          responses={docuWraiteWorkflow.answers?.draftContextResponses || {}}
          onSaveResponse={(responseKey, value) => {
            setDocuWraiteWorkflow((current) => {
              if (!current || current.workflowId !== "assigned-nodes") {
                return current;
              }

              return {
                ...current,
                answers: {
                  ...current.answers,
                  draftContextResponses: {
                    ...(current.answers?.draftContextResponses || {}),
                    [responseKey]: value,
                  },
                },
              };
            });
          }}
          onMoveInline={() => {
            runDraftContextQuestionLayoutAnimation();
            setDocuWraiteWorkflow((current) => {
              if (!current || current.workflowId !== "assigned-nodes") {
                return current;
              }

              return { ...current, draftContextQuestionMode: "inline" };
            });
          }}
        />
      ) : null}
    </View>
  );
}

function ShiftIntelligencePanel({ documentationSession, clientProfile = null }) {
  const { width, height } = useWindowDimensions();
  const runtimeShiftIntelligence = getShiftIntelligenceRuntime(
    clientProfile || getMaryBetProfile(),
    documentationSession
  );
  const cardRefs = useRef({});
  const [activeIntelKey, setActiveIntelKey] = useState("");
  const [activeIntelFrame, setActiveIntelFrame] = useState(null);

  const getIntelItemParts = (item) => {
    const text = String(item || "").trim();
    const parenMatch = text.match(/\(([^)]+)\)/);
    if (parenMatch) {
      const title = text.replace(parenMatch[0], "").trim();
      return {
        title: title || text,
        meta: parenMatch[1].trim(),
      };
    }

    const timeMatch = text.match(/(.+?)\s+(\d{1,2}:\d{2}\s?[AP]M)$/i);
    if (timeMatch) {
      return {
        title: timeMatch[1].trim(),
        meta: timeMatch[2].trim(),
      };
    }

    return { title: text, meta: "" };
  };

  const parseClockLabelToMinutes = (value) => {
    const match = String(value || "")
      .trim()
      .match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
    if (!match) {
      return Number.POSITIVE_INFINITY;
    }

    let hours = Number(match[1]) % 12;
    const minutes = Number(match[2]);
    const meridiem = match[3].toUpperCase();
    if (meridiem === "PM") {
      hours += 12;
    }
    return hours * 60 + minutes;
  };

  const parseDateLabelToValue = (value) => {
    const match = String(value || "")
      .trim()
      .match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) {
      return Number.POSITIVE_INFINITY;
    }

    return Number(`${match[3]}${match[1]}${match[2]}`);
  };

  const getSeverityRank = (value) => {
    const normalized = String(value || "").toLowerCase();
    if (normalized.includes("high")) {
      return 0;
    }
    if (normalized.includes("medium")) {
      return 1;
    }
    if (normalized.includes("low")) {
      return 2;
    }
    return 3;
  };

  const buildIntelGroups = (section) => {
    const items = Array.isArray(section?.items) ? section.items : [];
    if (!items.length) {
      return [];
    }

    if (section.key === "appointments" || section.key === "medications") {
      const sorted = [...items].sort((left, right) => {
        const leftMeta = getIntelItemParts(left).meta;
        const rightMeta = getIntelItemParts(right).meta;
        return parseClockLabelToMinutes(leftMeta) - parseClockLabelToMinutes(rightMeta);
      });
      return [{ label: "Sorted by time", items: sorted }];
    }

    if (section.key === "overdue") {
      const dated = [];
      const open = [];
      items.forEach((item) => {
        const meta = getIntelItemParts(item).meta;
        if (Number.isFinite(parseDateLabelToValue(meta))) {
          dated.push(item);
        } else {
          open.push(item);
        }
      });
      dated.sort((left, right) => {
        const leftMeta = getIntelItemParts(left).meta;
        const rightMeta = getIntelItemParts(right).meta;
        return parseDateLabelToValue(leftMeta) - parseDateLabelToValue(rightMeta);
      });

      return [
        ...(dated.length ? [{ label: "Dated overdue items", items: dated }] : []),
        ...(open.length ? [{ label: "Open follow-ups", items: open }] : []),
      ];
    }

    if (section.key === "risks") {
      const sorted = [...items].sort((left, right) => {
        const leftMeta = getIntelItemParts(left).meta;
        const rightMeta = getIntelItemParts(right).meta;
        return getSeverityRank(leftMeta) - getSeverityRank(rightMeta);
      });
      return [{ label: "By severity", items: sorted }];
    }

    if (section.key === "alerts") {
      return [{ label: "Standing alerts", items }];
    }

    if (section.key === "goals") {
      return [{ label: "Needs follow-up", items }];
    }

    return [{ label: "Current items", items }];
  };

  const renderList = (items, accentColor = colors.headerText) =>
    items.length ? (
      items.map((item, index) => {
        const parts = getIntelItemParts(item);
        return (
          <View key={`${item}-${index}`} style={styles.intelDetailRow}>
            <View style={[styles.intelDetailBullet, { backgroundColor: accentColor }]} />
            <View style={styles.intelDetailTextWrap}>
              <View style={styles.intelDetailTitleRow}>
                <Text style={styles.intelDetailTitle}>{parts.title}</Text>
                {parts.meta ? (
                  <View style={styles.intelDetailMetaChip}>
                    <Text style={[styles.intelDetailMetaText, { color: accentColor }]}>{parts.meta}</Text>
                  </View>
                ) : null}
              </View>
              {!parts.meta && parts.title.length > 78 ? (
                <Text style={styles.intelDetailSubtle}>Open item requiring follow-up</Text>
              ) : null}
            </View>
          </View>
        );
      })
    ) : (
      <Text style={styles.intelEmpty}>Nothing found to display</Text>
    );

  const intelligenceSections = [
    {
      key: "overdue",
      title: "Overdue",
      icon: "alertTriangle",
      badgeStyle: styles.intelBadgeOverdue,
      items: runtimeShiftIntelligence.overdue,
      accentColor: "#d32f2f",
    },
    {
      key: "risks",
      title: "Active Risks",
      icon: "shield",
      badgeStyle: styles.intelBadgeRisks,
      items: runtimeShiftIntelligence.activeRisks,
      accentColor: "#b45309",
    },
    {
      key: "appointments",
      title: "Today's Appointments",
      icon: "calendar",
      badgeStyle: styles.intelBadgeAppointments,
      items: runtimeShiftIntelligence.appointments,
      accentColor: "#2563eb",
    },
    {
      key: "medications",
      title: "Medications Due",
      icon: "clock",
      badgeStyle: styles.intelBadgeMedications,
      items: runtimeShiftIntelligence.medicationsDue,
      accentColor: "#059669",
    },
    {
      key: "alerts",
      title: "Alerts",
      icon: "bell",
      badgeStyle: styles.intelBadgeAlerts,
      items: runtimeShiftIntelligence.alerts,
      accentColor: "#ea580c",
    },
    {
      key: "goals",
      title: "Incomplete Goals",
      icon: "target",
      badgeStyle: styles.intelBadgeGoals,
      items: runtimeShiftIntelligence.incompleteGoals.slice(0, 3),
      accentColor: docuWraiteColors.primary,
    },
  ];

  const activeSection = intelligenceSections.find((section) => section.key === activeIntelKey) || null;
  const activeIntelGroups = activeSection ? buildIntelGroups(activeSection) : [];
  const getIntelPreviewItems = (section) => {
    const groups = buildIntelGroups(section);
    return groups.flatMap((group) => group.items).slice(0, 2);
  };

  const openIntelCard = (sectionKey) => {
    const node = cardRefs.current[sectionKey];
    if (!node?.measureInWindow) {
      setActiveIntelFrame(null);
      setActiveIntelKey(sectionKey);
      return;
    }

    node.measureInWindow((x, y, measuredWidth, height) => {
      setActiveIntelFrame({
        x,
        y,
        width: measuredWidth,
        height,
      });
      setActiveIntelKey(sectionKey);
    });
  };

  const closeIntelCard = () => {
    setActiveIntelKey("");
    setActiveIntelFrame(null);
  };

  const popoverViewportPadding = 12;
  const popoverGap = 8;
  const popoverWidth = Math.min(340, Math.max(260, width - popoverViewportPadding * 2));
  const popoverMaxHeight = Math.min(320, Math.max(220, height - popoverViewportPadding * 2));
  const popoverBodyMaxHeight = Math.max(120, popoverMaxHeight - 80);
  const useCenteredIntelModal = width < 700 || !activeIntelFrame;
  const popoverLeft = activeIntelFrame
    ? Math.max(popoverViewportPadding, Math.min(activeIntelFrame.x, width - popoverWidth - popoverViewportPadding))
    : popoverViewportPadding;
  const popoverTop = (() => {
    if (!activeIntelFrame) {
      return Math.max(popoverViewportPadding, Math.min(120, height - popoverMaxHeight - popoverViewportPadding));
    }

    const belowTop = activeIntelFrame.y + activeIntelFrame.height + popoverGap;
    const aboveTop = activeIntelFrame.y - popoverMaxHeight - popoverGap;
    const maxTop = height - popoverMaxHeight - popoverViewportPadding;

    if (belowTop + popoverMaxHeight <= height - popoverViewportPadding) {
      return belowTop;
    }

    if (aboveTop >= popoverViewportPadding) {
      return aboveTop;
    }

    return Math.max(popoverViewportPadding, maxTop);
  })();

  return (
    <>
      {intelligenceSections.map((section) => (
        (() => {
          const previewItems = getIntelPreviewItems(section);
          return (
            <View
              key={section.key}
              ref={(node) => {
                cardRefs.current[section.key] = node;
              }}
              collapsable={false}
            >
              <Pressable onPress={() => openIntelCard(section.key)} style={styles.intelCardPressable}>
                <Card
                  title={section.title}
                  titleAccessoryContainerStyle={section.badgeStyle}
                  titleAccessory={<Icon name={section.icon} size={18} color={colors.headerText} />}
                  bodyStyle={styles.intelCompactBody}
                  containerStyle={styles.intelCompactCard}
                >
                  <View style={styles.intelCompactHeaderRow}>
                    <Text style={[styles.intelCompactCount, { color: section.accentColor }]}>
                      {section.items.length ? `${section.items.length} item${section.items.length === 1 ? "" : "s"}` : "Clear"}
                    </Text>
                    <Text style={styles.intelCompactHint}>Tap for details</Text>
                  </View>
                  {previewItems.length ? (
                    previewItems.map((item) => (
                      <Text key={item} style={styles.intelCompactPreview} numberOfLines={1} ellipsizeMode="tail">
                        {item}
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.intelCompactEmpty}>Nothing urgent right now</Text>
                  )}
                </Card>
              </Pressable>
            </View>
          );
        })()
      ))}
      <Modal transparent visible={!!activeSection} animationType="fade" onRequestClose={closeIntelCard}>
        <View style={styles.intelPopoverRoot}>
          <Pressable style={styles.intelPopoverBackdrop} onPress={closeIntelCard} />
          {activeSection ? (
            <View
              style={[
                styles.intelPopoverCard,
                useCenteredIntelModal
                  ? [styles.intelPopoverCardCentered, { maxHeight: popoverMaxHeight }]
                  : {
                      position: "absolute",
                      top: popoverTop,
                      left: popoverLeft,
                      width: popoverWidth,
                      maxHeight: popoverMaxHeight,
                    },
              ]}
            >
              <View style={styles.intelPopoverHeader}>
                <View style={styles.intelPopoverTitleRow}>
                  <View style={[styles.cardHeaderTitleIcon, activeSection.badgeStyle]}>
                    <Icon name={activeSection.icon} size={18} color={colors.headerText} />
                  </View>
                  <View style={styles.intelPopoverTitleTextWrap}>
                    <Text style={styles.intelPopoverTitle}>{activeSection.title}</Text>
                    <Text style={styles.intelPopoverSubtitle}>
                      {activeSection.items.length
                        ? `${activeSection.items.length} detail${activeSection.items.length === 1 ? "" : "s"}`
                        : "No current items"}
                    </Text>
                  </View>
                </View>
                <Pressable onPress={closeIntelCard} style={styles.intelPopoverCloseButton}>
                  <Icon name="x" size={16} color={colors.headerText} />
                </Pressable>
              </View>
              <ScrollView
                style={[styles.intelPopoverBody, { maxHeight: popoverBodyMaxHeight }]}
                contentContainerStyle={styles.intelPopoverBodyContent}
              >
                {activeIntelGroups.length ? (
                  activeIntelGroups.map((group) => (
                    <View key={group.label} style={styles.intelGroup}>
                      <Text style={styles.intelGroupLabel}>{group.label}</Text>
                      {renderList(group.items, activeSection.accentColor)}
                    </View>
                  ))
                ) : (
                  renderList(activeSection.items, activeSection.accentColor)
                )}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

const DECISION_MODE_OPTIONS = [
  { label: "Full branch/depth", value: "full-branch" },
  { label: "Selective branch", value: "selective-branch" },
];

const DECISION_DEPTH_OPTIONS = Array.from({ length: 10 }, (_, index) => {
  const value = String(index + 1);
  return { label: value, value };
});

const DECISION_TARGET_TYPE_OPTIONS = [
  { label: "Time block", value: "time-block" },
  { label: "Case-note row", value: "case-note-row" },
];

const PROMPT_POPOVER_IDLE_MS = 10000;

function getDecisionOptionLabel(options = [], value = "") {
  return options.find((option) => String(option.value) === String(value))?.label || "";
}

function DecisionEngineScreen({
  isPhone,
  onStageAssignment,
  stagedAssignments = [],
  finalizedAssignments = [],
  onEditStagedAssignment,
  onDeleteStagedAssignment,
  onEditFinalizedAssignment,
  onDeleteFinalizedAssignment,
  onFinalizeAssignments,
  timeBlocks = [],
  rowTargets = [],
  initialTargetKey = "",
  initialSelectionState = null,
  onScheduleChange,
  onRowsChange,
  onSelectionStateChange,
  externalAssignmentHint = "",
}) {
  const availableDecisionLibraries = getAvailableDecisionLibraries();
  const [selectedLibrary, setSelectedLibrary] = useState(
    initialSelectionState?.selectedLibrary || getDefaultDecisionLibrarySlug()
  );
  const [showLibraryHelp, setShowLibraryHelp] = useState(false);
  const [libraryHelpFrame, setLibraryHelpFrame] = useState(null);
  const [selectedNoteType, setSelectedNoteType] = useState(
    normalizeDecisionNoteType(initialSelectionState?.selectedNoteType)
  );
  const [selectedDepth, setSelectedDepth] = useState(initialSelectionState?.selectedDepth || 2);
  const [includeMode, setIncludeMode] = useState(initialSelectionState?.includeMode || "full-branch");
  const [selectedBranchKey, setSelectedBranchKey] = useState(initialSelectionState?.selectedBranchKey || "");
  const [activeDecisionDropdown, setActiveDecisionDropdown] = useState(null);
  const [expandedDecisionPanel, setExpandedDecisionPanel] = useState(initialSelectionState?.collapsedSections || {});
  const [targetType, setTargetType] = useState(
    initialSelectionState?.targetType || (initialTargetKey.startsWith("row:") ? "case-note-row" : "time-block")
  );
  const [checkedNodes, setCheckedNodes] = useState(initialSelectionState?.checkedNodes || {});
  const [includeInFinalMap, setIncludeInFinalMap] = useState(initialSelectionState?.includeInFinalMap || {});
  const [choiceSelections, setChoiceSelections] = useState(initialSelectionState?.choiceSelections || {});
  const initialBuilderSeed = initialSelectionState?.builderDraftSeed || null;
  const initialBlockDraftState = buildInitialBlockDraftState(initialBuilderSeed);
  const initialRowDraftState = buildInitialRowDraftState(
    initialBuilderSeed,
    rowTargets[0]?.workflowId || "behavior-support"
  );
  const [newBlockStartHour, setNewBlockStartHour] = useState(initialBuilderSeed?.blockStartHour ?? 7);
  const [newBlockEndHour, setNewBlockEndHour] = useState(initialBuilderSeed?.blockEndHour ?? 8);
  const [newBlockWorkflowId, setNewBlockWorkflowId] = useState(initialBlockDraftState.workflowId);
  const [blockDraftsByWorkflow, setBlockDraftsByWorkflow] = useState(initialBlockDraftState.drafts);
  const [scheduleBuilderHint, setScheduleBuilderHint] = useState("");
  const [scheduleBuilderGuideNote, setScheduleBuilderGuideNote] = useState("");
  const [rowBuilderGuideNote, setRowBuilderGuideNote] = useState("");
  const [blockBuilderHint, setBlockBuilderHint] = useState("");
  const [newRowWorkflowId, setNewRowWorkflowId] = useState(initialRowDraftState.workflowId);
  const [rowDraftsByWorkflow, setRowDraftsByWorkflow] = useState(initialRowDraftState.drafts);
  const [rowBuilderHint, setRowBuilderHint] = useState("");
  const [blockPromptPopoverVisible, setBlockPromptPopoverVisible] = useState(false);
  const [blockPromptSuggestions, setBlockPromptSuggestions] = useState([]);
  const [blockPromptLoading, setBlockPromptLoading] = useState(false);
  const [blockPromptError, setBlockPromptError] = useState("");
  const [rowPromptPopoverVisible, setRowPromptPopoverVisible] = useState(false);
  const [rowPromptSuggestions, setRowPromptSuggestions] = useState([]);
  const [rowPromptLoading, setRowPromptLoading] = useState(false);
  const [rowPromptError, setRowPromptError] = useState("");
  const [assignmentHint, setAssignmentHint] = useState("");
  const [stagedAssignmentsExpandAll, setStagedAssignmentsExpandAll] = useState(false);
  const [finalizedAssignmentsExpandAll, setFinalizedAssignmentsExpandAll] = useState(false);
  const libraryHelpButtonRef = useRef(null);
  const rowWorkflowTouchedRef = useRef(false);
  const blockPromptRequestRef = useRef(0);
  const rowPromptRequestRef = useRef(0);
  const blockPromptEngagedRef = useRef(false);
  const rowPromptEngagedRef = useRef(false);
  const blockPromptIdleTimerRef = useRef(null);
  const rowPromptIdleTimerRef = useRef(null);
  const suppressBuilderHydrationRef = useRef({ block: false, row: false });
  const workflowOptions = [
    { workflowId: "behavior-support", label: "Behavior", theme: "behavior", promptCategory: "behavior" },
    { workflowId: "morning-adl", label: "ADL", theme: "hygiene", promptCategory: "adl" },
    { workflowId: "feeding-support", label: "Meal", theme: "meal", promptCategory: "meal" },
    { workflowId: "communication-support", label: "Communication", theme: "communication", promptCategory: "communication" },
    { workflowId: "community-outing", label: "Community", theme: "outing", promptCategory: "community" },
    { workflowId: "medication-support", label: "Medication", theme: "medication", promptCategory: "medication" },
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
  const [selectedTargetKey, setSelectedTargetKey] = useState(
    initialSelectionState?.selectedTargetKey || initialTargetKey || assignmentTargets[0]?.key || ""
  );
  const newBlockDescription = blockDraftsByWorkflow[newBlockWorkflowId] || "";
  const newRowDescription = rowDraftsByWorkflow[newRowWorkflowId] || "";

  useEffect(() => {
    if (initialTargetKey && assignmentTargets.some((target) => target.key === initialTargetKey)) {
      setSelectedTargetKey(initialTargetKey);
      setTargetType(initialTargetKey.startsWith("row:") ? "case-note-row" : "time-block");
    }
  }, [initialTargetKey, assignmentTargets]);

  useEffect(() => {
    const fallbackLabel =
      targetType === "case-note-row"
        ? rowTargets.find((row) => `row:${row.id}` === selectedTargetKey)?.description || ""
        : "";
    const seed = buildBuilderDraftSeedFromTarget(
      selectedTargetKey,
      timeBlocks,
      rowTargets,
      fallbackLabel
    );

    if (!seed) {
      return;
    }

    if (seed.blockDescription) {
      const workflowId = seed.blockWorkflowId || "behavior-support";
      setNewBlockWorkflowId(workflowId);
      if (suppressBuilderHydrationRef.current.block) {
        suppressBuilderHydrationRef.current.block = false;
      } else {
        setBlockDraftsByWorkflow((prev) => {
          if (prev[workflowId] === seed.blockDescription) {
            return prev;
          }
          return { ...prev, [workflowId]: seed.blockDescription };
        });
      }
      if (Number.isFinite(seed.blockStartHour)) {
        setNewBlockStartHour(seed.blockStartHour);
      }
      if (Number.isFinite(seed.blockEndHour)) {
        setNewBlockEndHour(seed.blockEndHour);
      }
    }

    if (seed.rowDescription) {
      const workflowId = seed.rowWorkflowId || "behavior-support";
      setNewRowWorkflowId(workflowId);
      if (suppressBuilderHydrationRef.current.row) {
        suppressBuilderHydrationRef.current.row = false;
      } else {
        setRowDraftsByWorkflow((prev) => {
          if (prev[workflowId] === seed.rowDescription) {
            return prev;
          }
          return { ...prev, [workflowId]: seed.rowDescription };
        });
      }
    }
  }, [selectedTargetKey, targetType, timeBlocks, rowTargets]);

  useEffect(() => {
    if (
      !rowWorkflowTouchedRef.current &&
      rowTargets.length === 1 &&
      rowTargets[0]?.workflowId &&
      newRowWorkflowId !== rowTargets[0].workflowId
    ) {
      setNewRowWorkflowId(rowTargets[0].workflowId);
    }
  }, [newRowWorkflowId, rowTargets]);

  useEffect(() => {
    if (newBlockEndHour <= newBlockStartHour) {
      setNewBlockEndHour(newBlockStartHour + 1);
    }
  }, [newBlockStartHour, newBlockEndHour]);

  useEffect(() => {
    if (!scheduleBuilderHint) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setScheduleBuilderHint("");
    }, 2200);

    return () => clearTimeout(timeoutId);
  }, [scheduleBuilderHint]);

  useEffect(() => {
    if (!blockBuilderHint) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setBlockBuilderHint("");
    }, 2200);

    return () => clearTimeout(timeoutId);
  }, [blockBuilderHint]);

  useEffect(() => {
    if (!rowBuilderHint) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setRowBuilderHint("");
    }, 2200);

    return () => clearTimeout(timeoutId);
  }, [rowBuilderHint]);

  useEffect(() => {
    if (!assignmentHint) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setAssignmentHint("");
    }, 2400);

    return () => clearTimeout(timeoutId);
  }, [assignmentHint]);

  useEffect(() => {
    const uniqueBlocks = [];
    const seenLabels = new Set();

    timeBlocks.forEach((block) => {
      const key = String(block?.label || "");
      if (seenLabels.has(key)) {
        return;
      }
      seenLabels.add(key);
      uniqueBlocks.push(block);
    });

    if (uniqueBlocks.length !== timeBlocks.length) {
      onScheduleChange?.(uniqueBlocks);
    }
  }, [onScheduleChange, timeBlocks]);

  const loadBlockPromptSuggestions = useCallback((workflowId = newBlockWorkflowId) => {
    const selectedWorkflow = workflowOptions.find((option) => option.workflowId === workflowId);
    const categoryKey = selectedWorkflow?.promptCategory;
    const requestId = blockPromptRequestRef.current + 1;
    blockPromptRequestRef.current = requestId;

    if (!categoryKey) {
      setBlockPromptSuggestions([]);
      setBlockPromptError("");
      setBlockPromptLoading(false);
      return;
    }

    setBlockPromptLoading(true);
    setBlockPromptError("");

    fetch(`${docuWraiteApiBaseUrl}/api/row-prompts/${categoryKey}`)
      .then((response) => response.json())
      .then((payload) => {
        if (blockPromptRequestRef.current !== requestId) {
          return;
        }
        setBlockPromptSuggestions(Array.isArray(payload?.prompts) ? payload.prompts : []);
        setBlockPromptLoading(false);
        if (!blockPromptEngagedRef.current) {
          scheduleBlockPromptIdleClose();
        }
      })
      .catch(() => {
        if (blockPromptRequestRef.current !== requestId) {
          return;
        }
        setBlockPromptSuggestions([]);
        setBlockPromptError("Suggestions unavailable right now.");
        setBlockPromptLoading(false);
        if (!blockPromptEngagedRef.current) {
          scheduleBlockPromptIdleClose();
        }
      });
  }, [newBlockWorkflowId]);

  const loadRowPromptSuggestions = useCallback((workflowId = newRowWorkflowId) => {
    const selectedWorkflow = workflowOptions.find((option) => option.workflowId === workflowId);
    const categoryKey = selectedWorkflow?.promptCategory;
    const requestId = rowPromptRequestRef.current + 1;
    rowPromptRequestRef.current = requestId;

    if (!categoryKey) {
      setRowPromptSuggestions([]);
      setRowPromptError("");
      setRowPromptLoading(false);
      return;
    }

    setRowPromptLoading(true);
    setRowPromptError("");

    fetch(`${docuWraiteApiBaseUrl}/api/row-prompts/${categoryKey}`)
      .then((response) => response.json())
      .then((payload) => {
        if (rowPromptRequestRef.current !== requestId) {
          return;
        }
        setRowPromptSuggestions(Array.isArray(payload?.prompts) ? payload.prompts : []);
        setRowPromptLoading(false);
        if (!rowPromptEngagedRef.current) {
          scheduleRowPromptIdleClose();
        }
      })
      .catch(() => {
        if (rowPromptRequestRef.current !== requestId) {
          return;
        }
        setRowPromptSuggestions([]);
        setRowPromptError("Suggestions unavailable right now.");
        setRowPromptLoading(false);
        if (!rowPromptEngagedRef.current) {
          scheduleRowPromptIdleClose();
        }
      });
  }, [newRowWorkflowId]);

  const clearBlockPromptIdleTimer = () => {
    if (blockPromptIdleTimerRef.current) {
      clearTimeout(blockPromptIdleTimerRef.current);
      blockPromptIdleTimerRef.current = null;
    }
  };

  const clearRowPromptIdleTimer = () => {
    if (rowPromptIdleTimerRef.current) {
      clearTimeout(rowPromptIdleTimerRef.current);
      rowPromptIdleTimerRef.current = null;
    }
  };

  const closeBlockPromptPopover = () => {
    clearBlockPromptIdleTimer();
    blockPromptEngagedRef.current = false;
    setBlockPromptPopoverVisible(false);
  };

  const closeRowPromptPopover = () => {
    clearRowPromptIdleTimer();
    rowPromptEngagedRef.current = false;
    setRowPromptPopoverVisible(false);
  };

  const markBlockPromptEngaged = () => {
    blockPromptEngagedRef.current = true;
    clearBlockPromptIdleTimer();
  };

  const markRowPromptEngaged = () => {
    rowPromptEngagedRef.current = true;
    clearRowPromptIdleTimer();
  };

  const scheduleBlockPromptIdleClose = () => {
    clearBlockPromptIdleTimer();
    blockPromptIdleTimerRef.current = setTimeout(() => {
      blockPromptIdleTimerRef.current = null;
      if (!blockPromptEngagedRef.current) {
        setBlockPromptPopoverVisible(false);
      }
    }, PROMPT_POPOVER_IDLE_MS);
  };

  const scheduleRowPromptIdleClose = () => {
    clearRowPromptIdleTimer();
    rowPromptIdleTimerRef.current = setTimeout(() => {
      rowPromptIdleTimerRef.current = null;
      if (!rowPromptEngagedRef.current) {
        setRowPromptPopoverVisible(false);
      }
    }, PROMPT_POPOVER_IDLE_MS);
  };

  useEffect(
    () => () => {
      clearBlockPromptIdleTimer();
      clearRowPromptIdleTimer();
    },
    []
  );

  const toggleBlockPromptHelp = () => {
    if (blockPromptPopoverVisible) {
      closeBlockPromptPopover();
      return;
    }

    blockPromptEngagedRef.current = false;
    setBlockPromptPopoverVisible(true);
    loadBlockPromptSuggestions(newBlockWorkflowId);
    scheduleBlockPromptIdleClose();
  };

  const toggleRowPromptHelp = () => {
    if (rowPromptPopoverVisible) {
      closeRowPromptPopover();
      return;
    }

    rowPromptEngagedRef.current = false;
    setRowPromptPopoverVisible(true);
    loadRowPromptSuggestions(newRowWorkflowId);
    scheduleRowPromptIdleClose();
  };

  useEffect(() => {
    const libraryIsAvailable = availableDecisionLibraries.some((lib) => lib.library === selectedLibrary);
    if (!libraryIsAvailable) {
      setSelectedLibrary(getDefaultDecisionLibrarySlug());
    }
  }, [availableDecisionLibraries, selectedLibrary]);

  const selectedLibraryData =
    availableDecisionLibraries.find((lib) => lib.library === selectedLibrary) ??
    availableDecisionLibraries[0];
  const selectedLibraryLabel = getDecisionLibraryDisplayName(selectedLibraryData?.library);
  const selectedLibraryHelp =
    DECISION_LIBRARY_HELP[selectedLibraryData?.library] ||
    "Choose which decision rule set to browse for this assignment.";
  const timeBlockTargets = assignmentTargets.filter((target) => target.type === "time-block");
  const rowAssignmentTargets = assignmentTargets.filter((target) => target.type === "case-note-row");
  const scopedTargets = targetType === "case-note-row" ? rowAssignmentTargets : timeBlockTargets;
  const selectedTarget = assignmentTargets.find((target) => target.key === selectedTargetKey);
  const libraryDropdownOptions = availableDecisionLibraries.map((lib) => ({
    value: lib.library,
    label: getDecisionLibraryDisplayName(lib.library),
  }));
  const startHourDropdownOptions = SCHEDULE_START_HOUR_OPTIONS.map((hour) => ({
    value: String(hour),
    label: formatScheduleHourLabel(hour),
  }));
  const endHourDropdownOptions = SCHEDULE_HOUR_OPTIONS.filter((hour) => hour > newBlockStartHour).map((hour) => ({
    value: String(hour),
    label: formatScheduleHourLabel(hour),
  }));
  const targetDropdownOptions = scopedTargets.map((target) => ({
    value: target.key,
    label: target.type === "time-block" ? target.label : `Row: ${target.label}`,
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

  const libraryNodes = selectedLibraryData.nodes.filter((node) => !isDecisionConditionalNode(node));
  const noteTypeDropdownOptions = DECISION_NOTE_TYPE_OPTIONS;
  const activeNoteType = normalizeDecisionNoteType(selectedNoteType);
  const noteTypeScopedLibraryNodes = libraryNodes.filter((node) =>
    nodeMatchesDecisionNoteType(node, activeNoteType, selectedLibrary)
  );
  const branchDropdownOptions = getDecisionBranchOptions(noteTypeScopedLibraryNodes);
  const depthDropdownOptions = DECISION_DEPTH_OPTIONS;

  const visibleLibraryNodes = noteTypeScopedLibraryNodes.filter((node) => {
    if (includeMode === "full-branch") {
      return true;
    }

    const branchKey = getDecisionNodeBranchKey(node.id);
    const nodeDepth = getDecisionNodeDepth(node.id);
    const matchesBranch = !selectedBranchKey || branchKey === String(selectedBranchKey);
    const matchesDepth = !selectedDepth || nodeDepth <= Number(selectedDepth);
    return matchesBranch && matchesDepth;
  });

  useEffect(() => {
    const normalized = normalizeDecisionNoteType(selectedNoteType);
    if (normalized !== selectedNoteType) {
      setSelectedNoteType(normalized);
    }
  }, [selectedNoteType]);

  const sections = visibleLibraryNodes.reduce((acc, node) => {
    const sectionKey = node.section || "Uncategorized";
    if (!acc[sectionKey]) {
      acc[sectionKey] = [];
    }
    acc[sectionKey].push(node);
    return acc;
  }, {});
  const decisionSectionKeys = Object.keys(sections).sort().join("|");

  const allNodes = visibleLibraryNodes;
  const allNodesByKey = new Map(allNodes.map((node) => [buildDecisionNodeSelectionKey(node), node]));
  const selectedCount = allNodes.filter((node) => checkedNodes[buildDecisionNodeSelectionKey(node)]).length;

  useEffect(() => {
    if (!branchDropdownOptions.length) {
      setSelectedBranchKey("");
      return;
    }

    if (!branchDropdownOptions.some((option) => option.value === selectedBranchKey)) {
      setSelectedBranchKey(branchDropdownOptions[0].value);
    }
    if (!depthDropdownOptions.some((option) => Number(option.value) === selectedDepth)) {
      setSelectedDepth(Number(depthDropdownOptions[0]?.value || 1));
    }
  }, [branchDropdownOptions, depthDropdownOptions, includeMode, selectedBranchKey, selectedDepth]);

  useEffect(() => {
    setExpandedDecisionPanel(() => {
      const next = {};
      Object.keys(sections).forEach((sectionKey) => {
        next[sectionKey] = true;
      });
      return next;
    });
  }, [selectedLibrary, activeNoteType, decisionSectionKeys]);

  useEffect(() => {
    const fallbackLabel =
      targetType === "case-note-row"
        ? rowTargets.find((row) => `row:${row.id}` === selectedTargetKey)?.description || ""
        : "";
    onSelectionStateChange?.({
      selectedLibrary,
      selectedNoteType,
      selectedDepth,
      includeMode,
      selectedBranchKey,
      targetType,
      selectedTargetKey,
      checkedNodes,
      includeInFinalMap,
      choiceSelections,
      builderDraftSeed: buildBuilderDraftSeedFromTarget(
        selectedTargetKey,
        timeBlocks,
        rowTargets,
        fallbackLabel
      ),
      stagedAssignments,
      finalizedAssignments,
      collapsedSections: expandedDecisionPanel,
    });
  }, [
    checkedNodes,
    choiceSelections,
    expandedDecisionPanel,
    finalizedAssignments,
    includeInFinalMap,
    includeMode,
    onSelectionStateChange,
    rowTargets,
    selectedBranchKey,
    selectedDepth,
    selectedLibrary,
    selectedNoteType,
    selectedTargetKey,
    stagedAssignments,
    targetType,
    timeBlocks,
  ]);

  const toggleNode = (nodeKey) => {
    setCheckedNodes((prev) => ({
      ...prev,
      [nodeKey]: !prev[nodeKey],
    }));
  };

  const toggleNodeChoice = (node, choice) => {
    const nodeKey = buildDecisionNodeSelectionKey(node);
    const isMultiSelect = inferDecisionNodeMultiSelect(getDecisionNodeDisplayQuestion(node), getDecisionNodeDisplayChoices(node));
    const isExclusiveStatusChoice = isDecisionExclusiveStatusChoice(choice);

    setCheckedNodes((prev) => ({
      ...prev,
      [nodeKey]: true,
    }));

    setChoiceSelections((prev) => {
      const currentChoices = prev[nodeKey] || [];
      const alreadySelected = currentChoices.includes(choice);
      let nextChoices;

      if (isExclusiveStatusChoice) {
        nextChoices = alreadySelected ? [] : [choice];
      } else if (isMultiSelect) {
        const nonExclusiveChoices = currentChoices.filter((item) => !isDecisionExclusiveStatusChoice(item));
        nextChoices = alreadySelected
          ? nonExclusiveChoices.filter((item) => item !== choice)
          : [...nonExclusiveChoices, choice];
      } else {
        nextChoices = alreadySelected ? [] : [choice];
      }

      return {
        ...prev,
        [nodeKey]: nextChoices,
      };
    });
  };

  const toggleSection = (sectionKey) => {
    const sectionNodes = sections[sectionKey] || [];
    const selectableNodes = sectionNodes.filter((node) => !isDecisionConditionalNode(node));
    const sectionSelected = selectableNodes.every((node) => checkedNodes[buildDecisionNodeSelectionKey(node)]);
    setCheckedNodes((prev) => {
      const next = { ...prev };
      selectableNodes.forEach((node) => {
        next[buildDecisionNodeSelectionKey(node)] = !sectionSelected;
      });
      return next;
    });
  };

  const toggleSectionCollapse = (sectionKey) => {
    setExpandedDecisionPanel((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const addScheduleBlock = () => {
    if (!String(newBlockDescription).trim()) {
      setBlockBuilderHint("Add a block description before adding this time block.");
      return;
    }

    if (newBlockEndHour <= newBlockStartHour) {
      return;
    }

    const nextLabel = buildScheduleBlockLabel(newBlockStartHour, newBlockEndHour);
    if (timeBlocks.some((block) => block.label === nextLabel)) {
      setScheduleBuilderHint("That timeline block already exists.");
      setScheduleBuilderGuideNote("");
      return;
    }

    let nextIndex = timeBlocks.length;
    let nextId = buildScheduleBlockId(newBlockStartHour, newBlockEndHour, nextIndex);
    const existingIds = new Set(timeBlocks.map((block) => block.id));

    while (existingIds.has(nextId)) {
      nextIndex += 1;
      nextId = buildScheduleBlockId(newBlockStartHour, newBlockEndHour, nextIndex);
    }

    const selectedWorkflow = workflowOptions.find((option) => option.workflowId === newBlockWorkflowId);
    const nextBlock = {
      id: nextId,
      label: nextLabel,
      description: String(newBlockDescription).trim(),
      source: "Shift Timeline",
      workflowId: newBlockWorkflowId,
      theme: selectedWorkflow?.theme || "behavior",
    };
    onScheduleChange?.([...timeBlocks, nextBlock]);
    suppressBuilderHydrationRef.current.block = true;
    setSelectedTargetKey(`time:${nextBlock.id}`);
    setScheduleBuilderHint("");
    setScheduleBuilderGuideNote(
      `Added ${nextLabel}. Next: add more time blocks with different hours, add row notes in Row Builder, select work from the library, then scroll down to lock this block and stage for Final Assign.`
    );
    setBlockDraftsByWorkflow((prev) => ({
      ...prev,
      [newBlockWorkflowId]: "",
    }));
    setBlockBuilderHint("");
    closeBlockPromptPopover();
  };

  const removeScheduleBlock = (blockId) => {
    const nextBlocks = timeBlocks.filter((block) => block.id !== blockId);
    onScheduleChange?.(nextBlocks);
    if (selectedTargetKey === `time:${blockId}`) {
      setSelectedTargetKey(nextBlocks[0] ? `time:${nextBlocks[0].id}` : "");
    }
    if (!nextBlocks.length) {
      setScheduleBuilderGuideNote("");
    }
  };

  const handleBlockWorkflowOptionPress = (workflowId) => {
    setNewBlockWorkflowId(workflowId);
    closeBlockPromptPopover();
    setBlockPromptSuggestions([]);
    setBlockPromptError("");
    setBlockPromptLoading(false);
    const nextDraft = blockDraftsByWorkflow[workflowId] || "";
    if (!String(nextDraft).trim()) {
      setBlockBuilderHint("Tap the help bubble to load suggestions, or type your own block description.");
    } else {
      setBlockBuilderHint("");
    }
  };

  const applyBlockPromptSuggestion = (promptText) => {
    if (!String(promptText).trim()) {
      return;
    }

    markBlockPromptEngaged();

    setBlockDraftsByWorkflow((prev) => {
      const current = String(prev[newBlockWorkflowId] || "").trim();
      return {
        ...prev,
        [newBlockWorkflowId]: current ? `${current} ${promptText}` : promptText,
      };
    });
    setBlockBuilderHint("");
  };

  const addRowTarget = () => {
    if (!String(newRowDescription).trim()) {
      setRowBuilderHint("Add a row description first.");
      return;
    }

    const selectedWorkflow = workflowOptions.find((option) => option.workflowId === newRowWorkflowId);
    let nextIndex = rowTargets.length;
    let nextId = `case-note-custom-${nextIndex}`;
    const existingIds = new Set(rowTargets.map((row) => row.id));

    while (existingIds.has(nextId)) {
      nextIndex += 1;
      nextId = `case-note-custom-${nextIndex}`;
    }

    const nextRow = {
      id: nextId,
      description: String(newRowDescription).trim(),
      source: "Case Note",
      linkedFromCarePlan: true,
      workflowId: newRowWorkflowId,
      theme: selectedWorkflow?.theme || "behavior",
      score: "",
      comment: "",
    };
    onRowsChange?.([...rowTargets, nextRow]);
    suppressBuilderHydrationRef.current.row = true;
    setSelectedTargetKey(`row:${nextRow.id}`);
    setRowDraftsByWorkflow((prev) => ({
      ...prev,
      [newRowWorkflowId]: "",
    }));
    setRowBuilderGuideNote(
      `Added row "${String(newRowDescription).trim()}". Next: add more rows, add time blocks above, select work from the library, then scroll down to lock this row and stage for Final Assign.`
    );
    setRowBuilderHint("");
    closeRowPromptPopover();
  };

  const handleWorkflowOptionPress = (workflowId) => {
    rowWorkflowTouchedRef.current = true;
    setNewRowWorkflowId(workflowId);
    closeRowPromptPopover();
    setRowPromptSuggestions([]);
    setRowPromptError("");
    setRowPromptLoading(false);
    const nextDraft = rowDraftsByWorkflow[workflowId] || "";
    if (!String(nextDraft).trim()) {
      setRowBuilderHint("Tap the help bubble to load suggestions, or type your own row description.");
    } else {
      setRowBuilderHint("");
    }
  };

  const applyRowPromptSuggestion = (promptText) => {
    if (!String(promptText).trim()) {
      return;
    }

    markRowPromptEngaged();

    setRowDraftsByWorkflow((prev) => {
      const current = String(prev[newRowWorkflowId] || "").trim();
      return {
        ...prev,
        [newRowWorkflowId]: current ? `${current} ${promptText}` : promptText,
      };
    });
    setRowBuilderHint("");
  };

  const removeRowTarget = (rowId) => {
    const nextRows = rowTargets.filter((row) => row.id !== rowId);
    onRowsChange?.(nextRows);
    if (selectedTargetKey === `row:${rowId}`) {
      setSelectedTargetKey(nextRows[0] ? `row:${nextRows[0].id}` : "");
    }
    if (!nextRows.length) {
      setRowBuilderGuideNote("");
    }
  };

  const openLibraryHelp = useCallback(() => {
    const node = libraryHelpButtonRef.current;
    if (!node?.measureInWindow) {
      setShowLibraryHelp(true);
      return;
    }

    node.measureInWindow((x, y, width, height) => {
      setLibraryHelpFrame({ x, y, width, height });
      setShowLibraryHelp(true);
    });
  }, []);

  const closeLibraryHelp = useCallback(() => {
    setShowLibraryHelp(false);
  }, []);

  const handleStageCurrentSelection = () => {
    const selectedKeys = Object.keys(checkedNodes).filter((key) => checkedNodes[key]);
    if (!selectedKeys.length) {
      setAssignmentHint("Select at least one question before locking this library.");
      return;
    }

    const selectedTargetOption = assignmentTargets.find((target) => target.key === selectedTargetKey);
    if (!selectedTargetOption) {
      setAssignmentHint("Choose a target before locking this library.");
      return;
    }

    const matchedBlock =
      selectedTargetOption.type === "time-block"
        ? timeBlocks.find((block) => block.id === selectedTargetOption.targetId)
        : null;
    const matchedRow =
      selectedTargetOption.type === "case-note-row"
        ? rowTargets.find((row) => row.id === selectedTargetOption.targetId)
        : null;

    const payload = selectedKeys.map((key) => ({
      key,
      includeInFinal: Boolean(includeInFinalMap[key]),
      selectedChoices: choiceSelections[key] || [],
    }));
    onStageAssignment?.({
      id: `staged-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      selectedLibrary,
      selectedNoteType,
      selectedDepth,
      includeMode,
      selectedBranchKey,
      selectedCount: payload.length,
      selectedNodesPayload: payload,
      target: {
        ...selectedTargetOption,
        description: String(matchedBlock?.description || matchedRow?.description || "").trim(),
        workflowId: matchedBlock?.workflowId || matchedRow?.workflowId || "",
      },
      summary: `${selectedLibraryLabel} • ${buildDecisionTargetDisplayLabel(selectedTargetOption)}`,
      displayLibrary: selectedLibraryLabel,
      createdAt: new Date().toISOString(),
    });

    setCheckedNodes((prev) => {
      const next = { ...prev };
      payload.forEach(({ key }) => {
        delete next[key];
      });
      return next;
    });
    setIncludeInFinalMap((prev) => {
      const next = { ...prev };
      payload.forEach(({ key }) => {
        delete next[key];
      });
      return next;
    });
    setChoiceSelections((prev) => {
      const next = { ...prev };
      payload.forEach(({ key }) => {
        delete next[key];
      });
      return next;
    });
    setAssignmentHint(`Locked ${selectedLibraryLabel} for ${buildDecisionTargetDisplayLabel(selectedTargetOption)}.`);
  };

  return (
    <Card title="Decision Engine Library" containerStyle={styles.decisionCard} bodyStyle={styles.decisionCardBody}>
      <View
        style={[
          styles.decisionScheduleEditor,
          (rowPromptPopoverVisible || blockPromptPopoverVisible) && styles.decisionScheduleEditorOverlayActive,
        ]}
      >
        <Text style={styles.decisionScheduleTitle}>Schedule Builder</Text>
        <Text style={styles.decisionScheduleLead}>
          Define the case-note timeline here, then assign questions to each block.
        </Text>
        <View style={[styles.decisionScheduleBuilderRow, isPhone && styles.decisionToolbarPhone]}>
          <View style={styles.decisionToolbarGroup}>
            <Text style={styles.decisionToolbarLabel}>Start</Text>
            <DecisionDropdown
              value={formatScheduleHourLabel(newBlockStartHour)}
              options={startHourDropdownOptions}
              placeholder="Select start"
              dropdownId="schedule-start-hour"
              activeDropdown={activeDecisionDropdown}
              onToggleDropdown={setActiveDecisionDropdown}
              onChange={(value) => setNewBlockStartHour(Number(value))}
              fieldStyle={styles.decisionDropdownScheduleHour}
            />
          </View>
          <View style={styles.decisionToolbarGroup}>
            <Text style={styles.decisionToolbarLabel}>End</Text>
            <DecisionDropdown
              value={formatScheduleHourLabel(newBlockEndHour)}
              options={endHourDropdownOptions}
              placeholder="Select end"
              dropdownId="schedule-end-hour"
              activeDropdown={activeDecisionDropdown}
              onToggleDropdown={setActiveDecisionDropdown}
              onChange={(value) => setNewBlockEndHour(Number(value))}
              fieldStyle={styles.decisionDropdownScheduleHour}
            />
          </View>
          <Pressable style={styles.decisionAssignButton} onPress={addScheduleBlock}>
            <Text style={styles.decisionAssignButtonText}>Add Block</Text>
          </Pressable>
        </View>
        <View style={styles.rowPromptAnchor}>
          <View style={styles.decisionPromptInputWrap}>
            <TextInput
              value={newBlockDescription}
              onChangeText={(text) => {
                setBlockDraftsByWorkflow((prev) => ({
                  ...prev,
                  [newBlockWorkflowId]: text,
                }));
                if (String(text).trim()) {
                  setBlockBuilderHint("");
                }
              }}
              placeholder="Describe what DSP should document in this time block."
              placeholderTextColor="#888888"
              style={[styles.decisionRowInput, styles.decisionRowInputInPromptWrap, styles.decisionRowInputWithAssist]}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Show suggested block prompts"
              onPress={toggleBlockPromptHelp}
              style={styles.docuWraiteWrap}
            >
              <DocuWraiteBubbleGlyph />
            </Pressable>
          </View>
          {blockPromptPopoverVisible ? (
            <Pressable
              style={[styles.rowPromptPopover, isPhone && styles.rowPromptPopoverPhone]}
              onPressIn={markBlockPromptEngaged}
            >
              <Text style={styles.rowPromptTitle}>Suggested prompts</Text>
              <Text style={styles.rowPromptLead}>Tap a suggestion to insert it, or keep typing your own custom block note.</Text>
              {blockPromptLoading ? <Text style={styles.rowPromptStatus}>Loading suggestions...</Text> : null}
              {!blockPromptLoading && blockPromptError ? <Text style={styles.rowPromptStatus}>{blockPromptError}</Text> : null}
              {!blockPromptLoading && !blockPromptError && !blockPromptSuggestions.length ? (
                <Text style={styles.rowPromptStatus}>No suggestions available for this workflow.</Text>
              ) : null}
              {!blockPromptLoading && !blockPromptError && blockPromptSuggestions.length ? (
                <ScrollView
                  style={styles.rowPromptPopoverScroll}
                  nestedScrollEnabled
                  onScrollBeginDrag={markBlockPromptEngaged}
                  onTouchStart={markBlockPromptEngaged}
                >
                  <View style={styles.rowPromptSuggestionList}>
                    {blockPromptSuggestions.map((prompt) => (
                      <Pressable
                        key={prompt.id || prompt.prompt_key || prompt.prompt_text}
                        onPress={() => applyBlockPromptSuggestion(prompt.prompt_text)}
                        style={styles.rowPromptSuggestionCard}
                      >
                        <Text style={styles.rowPromptSuggestionText}>{prompt.prompt_text}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              ) : null}
            </Pressable>
          ) : null}
        </View>
        {blockBuilderHint ? <Text style={styles.decisionInlineHint}>{blockBuilderHint}</Text> : null}
        <View style={styles.decisionWorkflowChipRow}>
          {workflowOptions.map((option) => (
            <Pressable
              key={`block-${option.workflowId}`}
              onPress={() => handleBlockWorkflowOptionPress(option.workflowId)}
              style={[
                styles.decisionOptionButton,
                newBlockWorkflowId === option.workflowId && styles.decisionOptionButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.decisionOptionText,
                  newBlockWorkflowId === option.workflowId && styles.decisionOptionTextActive,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
        {scheduleBuilderHint ? <Text style={styles.decisionInlineHint}>{scheduleBuilderHint}</Text> : null}
        {scheduleBuilderGuideNote ? (
          <View style={styles.decisionGuideNote}>
            <Text style={styles.decisionGuideNoteTitle}>What&apos;s next?</Text>
            <Text style={styles.decisionGuideNoteText}>{scheduleBuilderGuideNote}</Text>
          </View>
        ) : null}
        <Text style={styles.decisionBuilderListLabel}>Timeline blocks</Text>
        {timeBlocks.length ? (
          <View style={styles.decisionTimelineBlockList}>
            {timeBlocks.map((block) => {
              const workflowLabel =
                workflowOptions.find((option) => option.workflowId === block.workflowId)?.label || "";
              const blockDescription = String(block.description || "").trim();

              return (
                <View key={block.id} style={styles.decisionTimelineBlockCard}>
                  <View style={styles.decisionTimelineBlockHeader}>
                    <View style={styles.decisionTimelineBlockHeaderMain}>
                      <Text style={styles.decisionTimelineBlockTime}>{block.label}</Text>
                      {workflowLabel ? (
                        <Text style={styles.decisionTimelineBlockCategory}>{workflowLabel}</Text>
                      ) : null}
                    </View>
                    <Pressable
                      style={styles.decisionScheduleChipAction}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${block.label} timeline block`}
                      onPress={() => removeScheduleBlock(block.id)}
                    >
                      <Text style={styles.decisionScheduleChipRemove}>×</Text>
                    </Pressable>
                  </View>
                  {blockDescription ? (
                    <Text style={styles.decisionTimelineBlockDetail}>{blockDescription}</Text>
                  ) : (
                    <Text style={styles.decisionTimelineBlockDetailMuted}>No block description added.</Text>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.decisionTimelineBlockEmpty}>No timeline blocks yet. Add a time range and description above.</Text>
        )}
      </View>
      <View style={styles.decisionScheduleEditor}>
        <Text style={styles.decisionScheduleTitle}>Row Builder</Text>
        <Text style={styles.decisionScheduleLead}>
          Create the case-note rows themselves here, then assign markdown questions to them.
        </Text>
        <View style={styles.rowPromptAnchor}>
          <View style={styles.decisionPromptInputWrap}>
            <TextInput
              value={newRowDescription}
              onChangeText={(text) => {
                setRowDraftsByWorkflow((prev) => ({
                  ...prev,
                  [newRowWorkflowId]: text,
                }));
                if (String(text).trim()) {
                  setRowBuilderHint("");
                }
              }}
              placeholder="Describe the row, e.g. Document toileting support and observed response for Mary Bet."
              placeholderTextColor="#888888"
              style={[styles.decisionRowInput, styles.decisionRowInputInPromptWrap, styles.decisionRowInputWithAssist]}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Show suggested row prompts"
              onPress={toggleRowPromptHelp}
              style={styles.docuWraiteWrap}
            >
              <DocuWraiteBubbleGlyph />
            </Pressable>
          </View>
          {rowPromptPopoverVisible ? (
            <Pressable
              style={[styles.rowPromptPopover, isPhone && styles.rowPromptPopoverPhone]}
              onPressIn={markRowPromptEngaged}
            >
              <Text style={styles.rowPromptTitle}>Suggested prompts</Text>
              <Text style={styles.rowPromptLead}>Tap a suggestion to insert it, or keep typing your own custom row.</Text>
              {rowPromptLoading ? <Text style={styles.rowPromptStatus}>Loading suggestions...</Text> : null}
              {!rowPromptLoading && rowPromptError ? <Text style={styles.rowPromptStatus}>{rowPromptError}</Text> : null}
              {!rowPromptLoading && !rowPromptError && !rowPromptSuggestions.length ? (
                <Text style={styles.rowPromptStatus}>No suggestions available for this workflow.</Text>
              ) : null}
              {!rowPromptLoading && !rowPromptError && rowPromptSuggestions.length ? (
                <ScrollView
                  style={styles.rowPromptPopoverScroll}
                  nestedScrollEnabled
                  onScrollBeginDrag={markRowPromptEngaged}
                  onTouchStart={markRowPromptEngaged}
                >
                  <View style={styles.rowPromptSuggestionList}>
                    {rowPromptSuggestions.map((prompt) => (
                      <Pressable
                        key={prompt.id || prompt.prompt_key || prompt.prompt_text}
                        onPress={() => applyRowPromptSuggestion(prompt.prompt_text)}
                        style={styles.rowPromptSuggestionCard}
                      >
                        <Text style={styles.rowPromptSuggestionText}>{prompt.prompt_text}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              ) : null}
            </Pressable>
          ) : null}
        </View>
        {rowBuilderHint ? <Text style={styles.decisionInlineHint}>{rowBuilderHint}</Text> : null}
        {rowBuilderGuideNote ? (
          <View style={styles.decisionGuideNote}>
            <Text style={styles.decisionGuideNoteTitle}>What&apos;s next?</Text>
            <Text style={styles.decisionGuideNoteText}>{rowBuilderGuideNote}</Text>
          </View>
        ) : null}
        <View style={styles.decisionWorkflowChipRow}>
          {workflowOptions.map((option) => (
            <Pressable
              key={option.workflowId}
              onPress={() => handleWorkflowOptionPress(option.workflowId)}
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
          <Pressable style={[styles.decisionAssignButton, styles.decisionWorkflowAddRowButton]} onPress={addRowTarget}>
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
      <View style={styles.decisionExplainerCard}>
        <Text style={styles.decisionExplainerTitle}>How selections work</Text>
        <Text style={styles.decisionExplainerText}>
          Choose a library, select the questions and choices you want, then lock that selection to a block or note row.
          You can stage multiple library selections, review or edit them later, and use Final Assign to send that setup
          into the DSP Case Note.
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.decisionAssignForm,
          activeDecisionDropdown ? styles.decisionAssignFormActive : null,
        ]}
        style={styles.decisionAssignFormScroll}
      >
        <View style={[styles.decisionFormField, styles.decisionFormFieldLibrary]}>
          <View style={styles.decisionLabelRow}>
            <Text style={styles.decisionToolbarLabel}>Library</Text>
            <Pressable
              ref={libraryHelpButtonRef}
              collapsable={false}
              accessibilityRole="button"
              accessibilityLabel="Explain decision library"
              onHoverIn={openLibraryHelp}
              onPress={() => (showLibraryHelp ? closeLibraryHelp() : openLibraryHelp())}
              style={styles.decisionInfoButton}
            >
              <Icon name="helpCircle" size={14} color={colors.muted} />
            </Pressable>
          </View>
          <DecisionDropdown
            value={selectedLibraryLabel}
            options={libraryDropdownOptions}
            placeholder="Select library"
            dropdownId="decision-library"
            activeDropdown={activeDecisionDropdown}
            onToggleDropdown={setActiveDecisionDropdown}
            onChange={setSelectedLibrary}
            fieldStyle={styles.decisionDropdownLibrary}
          />
        </View>

        <View style={[styles.decisionFormField, styles.decisionFormFieldMode]}>
          <Text style={styles.decisionToolbarLabel}>Note Type</Text>
          <DecisionDropdown
            value={getDecisionOptionLabel(noteTypeDropdownOptions, activeNoteType)}
            options={noteTypeDropdownOptions}
            placeholder="Select note type"
            dropdownId="decision-note-type"
            activeDropdown={activeDecisionDropdown}
            onToggleDropdown={setActiveDecisionDropdown}
            onChange={setSelectedNoteType}
            fieldStyle={styles.decisionDropdownNoteType}
          />
        </View>

        <View style={[styles.decisionFormField, styles.decisionFormFieldMode]}>
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
          <Text style={styles.decisionToolbarLabel}>Branch</Text>
          <DecisionDropdown
            value={getDecisionOptionLabel(branchDropdownOptions, selectedBranchKey)}
            options={branchDropdownOptions}
            placeholder="Select branch"
            dropdownId="decision-branch"
            activeDropdown={activeDecisionDropdown}
            onToggleDropdown={setActiveDecisionDropdown}
            onChange={setSelectedBranchKey}
            fieldStyle={styles.decisionDropdownBranch}
            disabled={includeMode === "full-branch"}
          />
        </View>

        <View style={styles.decisionFormFieldDepth}>
          <Text style={styles.decisionToolbarLabel}>Depth</Text>
          <DecisionDropdown
            value={getDecisionOptionLabel(depthDropdownOptions, selectedDepth)}
            options={depthDropdownOptions}
            placeholder="Select depth"
            dropdownId="decision-depth"
            activeDropdown={activeDecisionDropdown}
            onToggleDropdown={setActiveDecisionDropdown}
            onChange={(value) => setSelectedDepth(Number(value))}
            fieldStyle={styles.decisionDropdownDepth}
            disabled={includeMode === "full-branch"}
          />
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
      </ScrollView>

      <Modal transparent visible={showLibraryHelp} animationType="fade" onRequestClose={closeLibraryHelp}>
        <View style={styles.decisionLibraryHelpModalRoot}>
          <Pressable style={styles.decisionLibraryHelpBackdrop} onPress={closeLibraryHelp} />
          {libraryHelpFrame ? (
            <View
              style={[
                styles.decisionLibraryTooltipModal,
                {
                  top: libraryHelpFrame.y + libraryHelpFrame.height + 8,
                  left: Math.max(16, libraryHelpFrame.x - 8),
                },
              ]}
            >
              <Text style={styles.decisionLibraryTooltipTitle}>{selectedLibraryLabel}</Text>
              <Text style={styles.decisionLibraryTooltipText}>{selectedLibraryHelp}</Text>
            </View>
          ) : null}
        </View>
      </Modal>

      <View style={styles.decisionQuestionList}>
        <View style={styles.decisionSummaryRow}>
          <Text style={styles.decisionSummaryText}>{`${selectedLibraryLabel} • ${allNodes.length} nodes`}</Text>
          <Text style={styles.decisionSummaryText}>{`${selectedCount} selected`}</Text>
        </View>

        {!allNodes.length ? (
          <Text style={styles.decisionInlineHint}>
            {`No questions match ${getDecisionNoteTypeLabel(activeNoteType)} for ${selectedLibraryLabel}. Try Block time, open the section headers below, or switch libraries.`}
          </Text>
        ) : null}

        {Object.entries(sections).map(([sectionKey, sectionNodes]) => (
          <View key={sectionKey} style={styles.decisionSectionCard}>
          <Pressable onPress={() => toggleSectionCollapse(sectionKey)} style={styles.decisionSectionHeader}>
            <View style={styles.decisionSectionHeaderContent}>
              <Icon
                name={expandedDecisionPanel[sectionKey] ? "chevronRight" : "chevronDown"}
                size={16}
                color={colors.headerText}
              />
              <Text style={styles.decisionSectionTitle}>{sectionKey}</Text>
            </View>
            <View style={styles.decisionSectionHeaderActions}>
              <Text style={styles.decisionSectionMeta}>{`${sectionNodes.length} questions`}</Text>
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  toggleSection(sectionKey);
                }}
                style={styles.decisionSectionAction}
              >
                <Text style={styles.decisionSectionActionText}>
                  {sectionNodes.filter((node) => !isDecisionConditionalNode(node)).every((node) => checkedNodes[buildDecisionNodeSelectionKey(node)]) ? "Clear" : "Select all"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
          {!expandedDecisionPanel[sectionKey] ? (
            sectionNodes.map((node) => (
              <Pressable
                key={buildDecisionNodeSelectionKey(node)}
                onPress={() => {
                  if (isDecisionConditionalNode(node)) {
                    return;
                  }
                  toggleNode(buildDecisionNodeSelectionKey(node));
                }}
                style={styles.decisionNodeRow}
              >
                <View
                  style={[
                    styles.decisionNodeCheckbox,
                    (checkedNodes[buildDecisionNodeSelectionKey(node)] || isDecisionConditionalNode(node)) &&
                      styles.decisionNodeCheckboxActive,
                    (checkedNodes[buildDecisionNodeSelectionKey(node)] || isDecisionConditionalNode(node)) &&
                      isDecisionConditionalNode(node) &&
                      styles.decisionNodeCheckboxConditionalActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.decisionNodeCheckboxLabel,
                      (checkedNodes[buildDecisionNodeSelectionKey(node)] || isDecisionConditionalNode(node)) &&
                        isDecisionConditionalNode(node) &&
                        styles.decisionNodeCheckboxConditionalLabel,
                    ]}
                  >
                    {checkedNodes[buildDecisionNodeSelectionKey(node)] || isDecisionConditionalNode(node) ? "✓" : ""}
                  </Text>
                </View>
                <View style={styles.decisionNodeContent}>
                  <Text style={styles.decisionNodeTitle}>{getDecisionNodeDisplayTitle(node)}</Text>
                  {getDecisionNodeDisplayQuestion(node) ? (
                    <Text style={styles.decisionNodeQuestion}>{getDecisionNodeDisplayQuestion(node)}</Text>
                  ) : null}
                  {getDecisionConditionalNote(node) ? (
                    <Text style={styles.decisionConditionalNote}>{getDecisionConditionalNote(node)}</Text>
                  ) : null}
                  {getDecisionNodeDisplayChoices(node).length ? (
                    <View style={styles.decisionChoiceBlock}>
                      <Text style={styles.decisionChoiceLabel}>DSP answer options</Text>
                      <Text style={styles.decisionChoiceHelper}>
                        Leave these unselected to keep all options for the DSP. Select only if you want to narrow the options shown later.
                      </Text>
                      <View style={styles.decisionChoiceList}>
                        {getDecisionNodeDisplayChoices(node).map((choice) => (
                          <Pressable
                            key={`${buildDecisionNodeSelectionKey(node)}-${choice}`}
                            onPress={() => toggleNodeChoice(node, choice)}
                            style={[
                              styles.decisionChoiceChip,
                              getDecisionNodeSelectedChoices(node, choiceSelections).includes(choice) &&
                                styles.decisionChoiceChipActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.decisionChoiceChipText,
                                getDecisionNodeSelectedChoices(node, choiceSelections).includes(choice) &&
                                  styles.decisionChoiceChipTextActive,
                              ]}
                            >
                              {choice}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  ) : null}
                  {node.conditions?.length ? (
                    <View style={styles.decisionConditionList}>
                      {node.conditions.map((condition) => (
                        <Text key={condition} style={styles.decisionConditionBadge}>
                          {getDecisionConditionDisplayText(condition)}
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
      {assignmentHint || externalAssignmentHint ? (
        <Text style={styles.decisionInlineHint}>{assignmentHint || externalAssignmentHint}</Text>
      ) : null}
      <View style={styles.decisionAssignRow}>
        <Pressable
          onPress={handleStageCurrentSelection}
          style={styles.decisionAssignButton}
        >
          <Text style={styles.decisionAssignButtonText}>Lock Library Assignment</Text>
        </Pressable>
      </View>
      <View style={styles.decisionStagedPanel}>
        <DecisionAssignmentPanelHeader
          title="Staged assignments"
          countLabel={`${stagedAssignments.length} staged`}
          assignments={stagedAssignments}
          expandAll={stagedAssignmentsExpandAll}
          onToggleExpandAll={() => setStagedAssignmentsExpandAll((current) => !current)}
        />
        {stagedAssignments.length ? (
          <>
            {stagedAssignments.length > 1 ? (
              <Text style={styles.decisionStagedCompactLegend}>
                Compact view: F = in final, X = excluded. Tap a row or Expand all for full detail.
              </Text>
            ) : null}
            {stagedAssignments.map((assignment) => (
              <DecisionAssignmentCard
                key={assignment.id}
                assignment={assignment}
                expandAll={stagedAssignmentsExpandAll}
                onEdit={onEditStagedAssignment}
                onDelete={onDeleteStagedAssignment}
                deleteLabel="Delete"
              />
            ))}
          </>
        ) : (
          <Text style={styles.decisionStagedEmpty}>Lock each library here first. Final assign will send all staged items to the Case Note together.</Text>
        )}
      </View>
      <View style={styles.decisionAssignRow}>
        <Pressable
          onPress={() => onFinalizeAssignments?.()}
          style={[
            styles.decisionAssignButton,
            !stagedAssignments.length && styles.decisionAssignButtonDisabled,
          ]}
          disabled={!stagedAssignments.length}
        >
          <Text style={styles.decisionAssignButtonText}>Final Assign to Case Note</Text>
        </Pressable>
      </View>
      <View style={styles.decisionStagedPanel}>
        <DecisionAssignmentPanelHeader
          title="Finalized assignments"
          countLabel={`${finalizedAssignments.length} final`}
          assignments={finalizedAssignments}
          expandAll={finalizedAssignmentsExpandAll}
          onToggleExpandAll={() => setFinalizedAssignmentsExpandAll((current) => !current)}
        />
        {finalizedAssignments.length ? (
          <>
            {finalizedAssignments.length > 1 ? (
              <Text style={styles.decisionStagedCompactLegend}>
                Compact view: F = in final, X = excluded. Tap a row or Expand all for full detail.
              </Text>
            ) : null}
            {finalizedAssignments.map((assignment) => (
              <DecisionAssignmentCard
                key={assignment.id}
                assignment={assignment}
                expandAll={finalizedAssignmentsExpandAll}
                onEdit={onEditFinalizedAssignment}
                onDelete={onDeleteFinalizedAssignment}
                deleteLabel="To Staged"
              />
            ))}
          </>
        ) : (
          <Text style={styles.decisionStagedEmpty}>
            After final assign, saved selections live here. Use To Staged to move one back for editing, or Edit to load it in the library.
          </Text>
        )}
      </View>
    </Card>
  );
}

function Card({
  title,
  titleAccessory,
  titleAccessoryContainerStyle,
  rightAccessory,
  children,
  bodyStyle,
  containerStyle,
}) {
  return (
    <View style={[styles.card, containerStyle]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderTitleRow}>
          {titleAccessory ? (
            <View style={[styles.cardHeaderTitleIcon, titleAccessoryContainerStyle]}>{titleAccessory}</View>
          ) : null}
          <Text style={styles.cardHeaderText}>{title}</Text>
        </View>
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

function getRiskPresentation(item) {
  const severityColor =
    item.severity === "High" ? "#e15d67" : item.severity === "Medium" ? "#f2a947" : "#6eaf71";

  const iconByTitle = {
    Falls: "alertTriangle",
    "Aspiration / Choking": "alertTriangle",
    "Inability to communicate basic needs": "messageCircle",
    "Medical procedure intolerance": "clipboard",
    "Elopement / self-injury / aggression": "shield",
  };

  return {
    severityColor,
    iconName: item.icon || iconByTitle[item.title] || "alertTriangle",
  };
}

function RiskCard({ item, expanded, onToggle }) {
  const { severityColor, iconName } = getRiskPresentation(item);
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
          <View style={[styles.riskSeverityIconWrap, severityStyle]}>
            <Icon name={iconName} size={14} color="#ffffff" />
          </View>
          <Text style={styles.riskCardTitle}>{item.title}</Text>
        </View>
        <Text style={[styles.riskSeverityText, { color: severityColor }]}>{item.severity}</Text>
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

function buildCarePlanEditorDraft(profile = {}) {
  return {
    carePlanHeader: { ...(profile.carePlanHeader || {}) },
    aboutMeCards: (profile.aboutMeCards || []).map((card) => ({ ...card })),
    riskCards: (profile.riskCards || []).map((card) => ({ ...card })),
    supportCards: (profile.supportCards || []).map((card) => ({ ...card })),
    serviceCards: (profile.serviceCards || []).map((card) => ({ ...card })),
    rightsCards: (profile.rightsCards || []).map((card) => ({ ...card })),
    activityCards: (profile.activityCards || []).map((card) => ({ ...card })),
    actionPlans: (profile.actionPlans || []).map((plan) => ({
      ...plan,
      steps: (plan.steps || []).map((step) => ({ ...step })),
    })),
    documentChecklist: [...(profile.documentChecklist || [])],
    documentFiles: [...(profile.documentFiles || [])],
    participants: (profile.participants || []).map((item) => ({ ...item })),
    signatureLogs: [...(profile.signatureLogs || [])],
    carePlanTextPages: (profile.carePlanTextPages || []).map((page) => ({ ...page })),
  };
}

function buildCarePlanEditorContentPayload(draft = {}) {
  return {
    carePlanHeader: { ...(draft.carePlanHeader || {}) },
    aboutMeCards: (draft.aboutMeCards || []).map((card) => ({ ...card })),
    supportCards: (draft.supportCards || []).map((card) => ({ ...card })),
    serviceCards: (draft.serviceCards || []).map((card) => ({ ...card })),
    rightsCards: (draft.rightsCards || []).map((card) => ({ ...card })),
    activityCards: (draft.activityCards || []).map((card) => ({ ...card })),
    documentChecklist: [...(draft.documentChecklist || [])],
    documentFiles: [...(draft.documentFiles || [])],
    participants: (draft.participants || []).map((item) => ({ ...item })),
    signatureLogs: [...(draft.signatureLogs || [])],
    carePlanTextPages: (draft.carePlanTextPages || []).map((page) => ({ ...page })),
  };
}

function mergeCarePlanDraftWithExtraction(currentDraft = {}, extraction = {}) {
  const editorContent = extraction?.editorContent || {};
  return {
    ...currentDraft,
    carePlanHeader: {
      ...(currentDraft.carePlanHeader || {}),
      ...(editorContent.carePlanHeader || {}),
    },
    aboutMeCards: editorContent.aboutMeCards || currentDraft.aboutMeCards || [],
    supportCards: editorContent.supportCards || currentDraft.supportCards || [],
    rightsCards: editorContent.rightsCards || currentDraft.rightsCards || [],
    activityCards: editorContent.activityCards || currentDraft.activityCards || [],
    documentChecklist: editorContent.documentChecklist || currentDraft.documentChecklist || [],
    documentFiles: editorContent.documentFiles || currentDraft.documentFiles || [],
    participants: editorContent.participants || currentDraft.participants || [],
    signatureLogs: editorContent.signatureLogs || currentDraft.signatureLogs || [],
    carePlanTextPages: editorContent.carePlanTextPages || currentDraft.carePlanTextPages || [],
  };
}

function CarePlanEditorField({ value, onChangeText, multiline = false, style, placeholder }) {
  return (
    <TextInput
      value={String(value ?? "")}
      onChangeText={onChangeText}
      multiline={multiline}
      placeholder={placeholder}
      placeholderTextColor="#8c82a8"
      style={[styles.carePlanEditorInput, multiline && styles.carePlanEditorInputMultiline, style]}
    />
  );
}

function CarePlanEditorSectionLabel({ children }) {
  return <Text style={styles.carePlanEditorLabel}>{children}</Text>;
}

function CarePlanEditorRowActions({ onAdd, addLabel, onDelete, deleteLabel = "Delete row" }) {
  return (
    <View style={styles.carePlanEditorRowActions}>
      {onAdd ? (
        <Pressable style={styles.carePlanEditorActionButton} onPress={onAdd}>
          <Text style={styles.carePlanEditorActionText}>{addLabel}</Text>
        </Pressable>
      ) : null}
      {onDelete ? (
        <Pressable
          style={[styles.carePlanEditorActionButton, styles.carePlanEditorDeleteButton]}
          onPress={onDelete}
        >
          <Text style={[styles.carePlanEditorActionText, styles.carePlanEditorDeleteText]}>{deleteLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function CarePlanDocument({
  isPhone,
  onOpenDocumentation,
  documentationSession,
  onDocumentationUpdate,
  onDocumentationCancel,
  onSaveCarePlan,
  onExtractCarePlanFromSource,
  clientProfile = null,
  clientPhoto,
}) {
  const profile = clientProfile || getMaryBetProfile();
  const [isEditingCarePlan, setIsEditingCarePlan] = useState(false);
  const [carePlanDraft, setCarePlanDraft] = useState(() => buildCarePlanEditorDraft(profile));
  const [carePlanSaveState, setCarePlanSaveState] = useState({ saving: false, message: "", error: "" });
  const [activeTab, setActiveTab] = useState("Overview");
  const [expandedRisk, setExpandedRisk] = useState(profile.riskCards[0]?.title ?? "Falls");
  const [expandedSourcePage, setExpandedSourcePage] = useState(1);
  const [expandedActionRow, setExpandedActionRow] = useState(null);
  const scrollRef = useRef(null);
  const sectionPositions = useRef({});

  useEffect(() => {
    if (!isEditingCarePlan) {
      setCarePlanDraft(buildCarePlanEditorDraft(profile));
      setExpandedRisk(profile.riskCards[0]?.title ?? "Falls");
    }
  }, [isEditingCarePlan, profile]);

  const setDraftValue = useCallback((path, value) => {
    setCarePlanDraft((current) => {
      const next = { ...current };
      let cursor = next;
      for (let index = 0; index < path.length - 1; index += 1) {
        const key = path[index];
        const source = cursor[key];
        cursor[key] = Array.isArray(source)
          ? [...source]
          : source && typeof source === "object"
            ? { ...source }
            : {};
        cursor = cursor[key];
      }
      cursor[path[path.length - 1]] = value;
      return next;
    });
  }, []);

  const addDraftRow = useCallback((listKey, template) => {
    setCarePlanDraft((current) => ({
      ...current,
      [listKey]: [...(current[listKey] || []), JSON.parse(JSON.stringify(template))],
    }));
  }, []);

  const removeDraftRow = useCallback((listKey, index) => {
    setCarePlanDraft((current) => ({
      ...current,
      [listKey]: (current[listKey] || []).filter((_, itemIndex) => itemIndex !== index),
    }));
  }, []);

  const addActionPlanStep = useCallback((planIndex) => {
    setCarePlanDraft((current) => ({
      ...current,
      actionPlans: (current.actionPlans || []).map((plan, index) =>
        index === planIndex
          ? {
              ...plan,
              steps: [
                ...(plan.steps || []),
                { step: "", responsible: "", frequency: "", record: "", notes: "" },
              ],
            }
          : plan
      ),
    }));
  }, []);

  const removeActionPlanStep = useCallback((planIndex, stepIndex) => {
    setCarePlanDraft((current) => ({
      ...current,
      actionPlans: (current.actionPlans || []).map((plan, index) =>
        index === planIndex
          ? {
              ...plan,
              steps: (plan.steps || []).filter((_, innerIndex) => innerIndex !== stepIndex),
            }
          : plan
      ),
    }));
  }, []);

  const startEditingCarePlan = () => {
    setCarePlanDraft(buildCarePlanEditorDraft(profile));
    setCarePlanSaveState({ saving: false, message: "", error: "" });
    setIsEditingCarePlan(true);
  };

  const cancelEditingCarePlan = () => {
    setCarePlanDraft(buildCarePlanEditorDraft(profile));
    setCarePlanSaveState({ saving: false, message: "", error: "" });
    setIsEditingCarePlan(false);
  };

  const saveCarePlanEdits = async () => {
    if (!onSaveCarePlan) {
      return;
    }

    setCarePlanSaveState({ saving: true, message: "", error: "" });
    try {
      await onSaveCarePlan(carePlanDraft);
      setCarePlanSaveState({ saving: false, message: "Care plan saved.", error: "" });
      setIsEditingCarePlan(false);
    } catch (error) {
      setCarePlanSaveState({
        saving: false,
        message: "",
        error: error?.message || "Care plan could not be saved.",
      });
    }
  };

  const extractCarePlanFromSource = async () => {
    if (!onExtractCarePlanFromSource) {
      return;
    }

    setCarePlanSaveState({ saving: true, message: "", error: "" });
    try {
      const extraction = await onExtractCarePlanFromSource();
      setCarePlanDraft((current) => mergeCarePlanDraftWithExtraction(current, extraction));
      setCarePlanSaveState({
        saving: false,
        message: `Imported ${extraction?.pageCount || 0} source pages from the care-plan document.`,
        error: "",
      });
      setIsEditingCarePlan(true);
    } catch (error) {
      setCarePlanSaveState({
        saving: false,
        message: "",
        error: error?.message || "Source document could not be extracted.",
      });
    }
  };

  const header = isEditingCarePlan ? carePlanDraft.carePlanHeader : profile.carePlanHeader ?? carePlanHeader;
  const aboutCards = isEditingCarePlan ? carePlanDraft.aboutMeCards : profile.aboutMeCards;
  const risks = isEditingCarePlan ? carePlanDraft.riskCards : profile.riskCards;
  const supports = isEditingCarePlan ? carePlanDraft.supportCards : profile.supportCards;
  const services = isEditingCarePlan ? carePlanDraft.serviceCards : profile.serviceCards;
  const rights = isEditingCarePlan ? carePlanDraft.rightsCards : profile.rightsCards;
  const activities = isEditingCarePlan ? carePlanDraft.activityCards : profile.activityCards;
  const plans = isEditingCarePlan ? carePlanDraft.actionPlans : profile.actionPlans;
  const checklist = isEditingCarePlan ? carePlanDraft.documentChecklist : profile.documentChecklist;
  const files = isEditingCarePlan ? carePlanDraft.documentFiles : profile.documentFiles;
  const roster = isEditingCarePlan ? carePlanDraft.participants : profile.participants;
  const signatures = isEditingCarePlan ? carePlanDraft.signatureLogs : profile.signatureLogs;
  const sourcePages = isEditingCarePlan ? carePlanDraft.carePlanTextPages : profile.carePlanTextPages ?? carePlanText;

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
            {isEditingCarePlan ? (
              <>
                <CarePlanEditorSectionLabel>Full name</CarePlanEditorSectionLabel>
                <CarePlanEditorField
                  value={header.fullName}
                  onChangeText={(value) => setDraftValue(["carePlanHeader", "fullName"], value)}
                  style={styles.carePlanHeroEditorInput}
                />
                <CarePlanEditorSectionLabel>Medicaid ID</CarePlanEditorSectionLabel>
                <CarePlanEditorField
                  value={header.medicaidId}
                  onChangeText={(value) => setDraftValue(["carePlanHeader", "medicaidId"], value)}
                />
                <CarePlanEditorSectionLabel>Date of birth</CarePlanEditorSectionLabel>
                <CarePlanEditorField
                  value={header.dob}
                  onChangeText={(value) => setDraftValue(["carePlanHeader", "dob"], value)}
                />
                <CarePlanEditorSectionLabel>Oversight ID</CarePlanEditorSectionLabel>
                <CarePlanEditorField
                  value={header.oversightId}
                  onChangeText={(value) => setDraftValue(["carePlanHeader", "oversightId"], value)}
                />
              </>
            ) : (
              <>
                <Text style={styles.carePlanHeroName}>{header.fullName}</Text>
                <Text style={styles.carePlanHeroMeta}>{`Medicaid ID: ${header.medicaidId}`}</Text>
                <Text style={styles.carePlanHeroMeta}>{`DOB: ${header.dob}`}</Text>
                <Text style={styles.carePlanHeroMeta}>{`Oversight ID: ${header.oversightId}`}</Text>
              </>
            )}
          </View>
        </View>
        <View style={styles.carePlanHeroRight}>
          {isEditingCarePlan ? (
            <>
              <CarePlanEditorSectionLabel>Status</CarePlanEditorSectionLabel>
              <CarePlanEditorField
                value={header.status}
                onChangeText={(value) => setDraftValue(["carePlanHeader", "status"], value)}
              />
              <CarePlanEditorSectionLabel>Guardian</CarePlanEditorSectionLabel>
              <CarePlanEditorField
                value={header.guardian}
                onChangeText={(value) => setDraftValue(["carePlanHeader", "guardian"], value)}
              />
              <CarePlanEditorSectionLabel>Plan start</CarePlanEditorSectionLabel>
              <CarePlanEditorField
                value={header.planStart}
                onChangeText={(value) => setDraftValue(["carePlanHeader", "planStart"], value)}
              />
              <CarePlanEditorSectionLabel>Plan end</CarePlanEditorSectionLabel>
              <CarePlanEditorField
                value={header.planEnd}
                onChangeText={(value) => setDraftValue(["carePlanHeader", "planEnd"], value)}
              />
            </>
          ) : (
            <>
              <Text style={styles.carePlanStatus}>{header.status}</Text>
              <Text style={styles.carePlanHeroMeta}>{`Guardian: ${header.guardian}`}</Text>
              <Text style={styles.carePlanHeroMeta}>{`Plan: ${header.planStart} to ${header.planEnd}`}</Text>
            </>
          )}
          <View style={styles.quickActions}>
            {isEditingCarePlan ? (
              <>
                <Pressable
                  style={[styles.quickActionButton, carePlanSaveState.saving && styles.quickActionButtonDisabled]}
                  onPress={extractCarePlanFromSource}
                  disabled={carePlanSaveState.saving}
                >
                  <Text style={styles.quickActionText}>Extract from Source</Text>
                </Pressable>
                <Pressable
                  style={[styles.quickActionButton, carePlanSaveState.saving && styles.quickActionButtonDisabled]}
                  onPress={saveCarePlanEdits}
                  disabled={carePlanSaveState.saving}
                >
                  <Text style={styles.quickActionText}>{carePlanSaveState.saving ? "Saving..." : "Save Care Plan"}</Text>
                </Pressable>
                <Pressable style={styles.quickActionButton} onPress={cancelEditingCarePlan}>
                  <Text style={styles.quickActionText}>Cancel</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable style={styles.quickActionButton} onPress={extractCarePlanFromSource}>
                  <Text style={styles.quickActionText}>Extract from Source</Text>
                </Pressable>
                <Pressable style={styles.quickActionButton} onPress={startEditingCarePlan}>
                  <Text style={styles.quickActionText}>Edit Care Plan</Text>
                </Pressable>
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
              </>
            )}
          </View>
          {carePlanSaveState.message ? <Text style={styles.carePlanEditorSuccess}>{carePlanSaveState.message}</Text> : null}
          {carePlanSaveState.error ? <Text style={styles.carePlanEditorError}>{carePlanSaveState.error}</Text> : null}
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
            {isEditingCarePlan ? (
              <CarePlanEditorRowActions
                onAdd={() => addDraftRow("aboutMeCards", { title: "", body: "" })}
                addLabel="Add row"
              />
            ) : null}
            <View style={styles.narrativeGrid}>
              {aboutCards.map((card, index) => (
                <View key={card.title} style={styles.narrativeCard}>
                  {isEditingCarePlan ? (
                    <>
                      <CarePlanEditorSectionLabel>Title</CarePlanEditorSectionLabel>
                      <CarePlanEditorField
                        value={card.title}
                        onChangeText={(value) => setDraftValue(["aboutMeCards", index, "title"], value)}
                      />
                      <CarePlanEditorSectionLabel>Body</CarePlanEditorSectionLabel>
                      <CarePlanEditorField
                        value={card.body}
                        onChangeText={(value) => setDraftValue(["aboutMeCards", index, "body"], value)}
                        multiline
                      />
                      <CarePlanEditorRowActions
                        onDelete={() => removeDraftRow("aboutMeCards", index)}
                      />
                    </>
                  ) : (
                    <>
                      <Text style={styles.narrativeCardTitle}>{card.title}</Text>
                      <Text style={styles.narrativeCardBody}>{card.body}</Text>
                    </>
                  )}
                </View>
              ))}
            </View>
          </SectionCard>
        </View>

        <View onLayout={(event) => registerSection("Risks", event.nativeEvent.layout.y)}>
          <SectionCard title="Risks" subtitle="Collapsible clinical risk cards with staff guidance">
            {isEditingCarePlan ? (
              <CarePlanEditorRowActions
                onAdd={() => addDraftRow("riskCards", { title: "", severity: "", notes: "", guidance: "" })}
                addLabel="Add row"
              />
            ) : null}
            <View style={styles.riskGrid}>
              {risks.map((item, index) =>
                isEditingCarePlan ? (
                  <View key={`${item.title}-${index}`} style={styles.riskCard}>
                    <CarePlanEditorSectionLabel>Risk title</CarePlanEditorSectionLabel>
                    <CarePlanEditorField
                      value={item.title}
                      onChangeText={(value) => setDraftValue(["riskCards", index, "title"], value)}
                    />
                    <CarePlanEditorSectionLabel>Severity</CarePlanEditorSectionLabel>
                    <CarePlanEditorField
                      value={item.severity}
                      onChangeText={(value) => setDraftValue(["riskCards", index, "severity"], value)}
                    />
                    <CarePlanEditorSectionLabel>Notes</CarePlanEditorSectionLabel>
                    <CarePlanEditorField
                      value={item.notes}
                      onChangeText={(value) => setDraftValue(["riskCards", index, "notes"], value)}
                      multiline
                    />
                    <CarePlanEditorSectionLabel>Guidance</CarePlanEditorSectionLabel>
                    <CarePlanEditorField
                      value={item.guidance}
                      onChangeText={(value) => setDraftValue(["riskCards", index, "guidance"], value)}
                      multiline
                    />
                    <CarePlanEditorRowActions
                      onDelete={() => removeDraftRow("riskCards", index)}
                    />
                  </View>
                ) : (
                  <RiskCard
                    key={item.title}
                    item={item}
                    expanded={expandedRisk === item.title}
                    onToggle={() => setExpandedRisk(expandedRisk === item.title ? null : item.title)}
                  />
                )
              )}
            </View>
          </SectionCard>
        </View>

        <View onLayout={(event) => registerSection("Supports", event.nativeEvent.layout.y)}>
          <SectionCard title="Supports" subtitle="Home, community, ADLs, and communication supports">
            {isEditingCarePlan ? (
              <CarePlanEditorRowActions
                onAdd={() => addDraftRow("supportCards", { title: "", body: "" })}
                addLabel="Add row"
              />
            ) : null}
            <View style={styles.narrativeGrid}>
              {supports.map((card, index) => (
                <View key={card.title} style={styles.narrativeCard}>
                  {isEditingCarePlan ? (
                    <>
                      <CarePlanEditorSectionLabel>Title</CarePlanEditorSectionLabel>
                      <CarePlanEditorField
                        value={card.title}
                        onChangeText={(value) => setDraftValue(["supportCards", index, "title"], value)}
                      />
                      <CarePlanEditorSectionLabel>Body</CarePlanEditorSectionLabel>
                      <CarePlanEditorField
                        value={card.body}
                        onChangeText={(value) => setDraftValue(["supportCards", index, "body"], value)}
                        multiline
                      />
                      <CarePlanEditorRowActions
                        onDelete={() => removeDraftRow("supportCards", index)}
                      />
                    </>
                  ) : (
                    <>
                      <Text style={styles.narrativeCardTitle}>{card.title}</Text>
                      <Text style={styles.narrativeCardBody}>{card.body}</Text>
                    </>
                  )}
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
            {isEditingCarePlan ? (
              <CarePlanEditorRowActions
                onAdd={() =>
                  addDraftRow("serviceCards", {
                    title: "",
                    status: "",
                    provider: "",
                    funding: "",
                    dateRange: "",
                    detail: "",
                  })
                }
                addLabel="Add row"
              />
            ) : null}
            <View style={styles.serviceGrid}>
              {services.map((item, index) =>
                isEditingCarePlan ? (
                  <View key={`${item.title}-${index}`} style={styles.serviceCard}>
                    {[
                      ["Title", "title"],
                      ["Status", "status"],
                      ["Provider", "provider"],
                      ["Funding", "funding"],
                      ["Date range", "dateRange"],
                      ["Detail", "detail"],
                    ].map(([label, key]) => (
                      <View key={key} style={styles.carePlanEditorGroup}>
                        <CarePlanEditorSectionLabel>{label}</CarePlanEditorSectionLabel>
                        <CarePlanEditorField
                          value={item[key]}
                          onChangeText={(value) => setDraftValue(["serviceCards", index, key], value)}
                          multiline={key === "detail"}
                        />
                      </View>
                    ))}
                    <CarePlanEditorRowActions
                      onDelete={() => removeDraftRow("serviceCards", index)}
                    />
                  </View>
                ) : (
                  <ServiceCard key={`${item.title}-${item.dateRange}`} item={item} />
                )
              )}
            </View>
          </SectionCard>
        </View>

        <View onLayout={(event) => registerSection("Rights", event.nativeEvent.layout.y)}>
          <SectionCard title="Rights & Decision Making" subtitle="Decision authority, ANE education, and directives">
            {isEditingCarePlan ? (
              <CarePlanEditorRowActions
                onAdd={() => addDraftRow("rightsCards", { title: "", body: "" })}
                addLabel="Add row"
              />
            ) : null}
            <View style={styles.narrativeGrid}>
              {rights.map((card, index) => (
                <View key={card.title} style={styles.narrativeCard}>
                  {isEditingCarePlan ? (
                    <>
                      <CarePlanEditorSectionLabel>Title</CarePlanEditorSectionLabel>
                      <CarePlanEditorField
                        value={card.title}
                        onChangeText={(value) => setDraftValue(["rightsCards", index, "title"], value)}
                      />
                      <CarePlanEditorSectionLabel>Body</CarePlanEditorSectionLabel>
                      <CarePlanEditorField
                        value={card.body}
                        onChangeText={(value) => setDraftValue(["rightsCards", index, "body"], value)}
                        multiline
                      />
                      <CarePlanEditorRowActions
                        onDelete={() => removeDraftRow("rightsCards", index)}
                      />
                    </>
                  ) : (
                    <>
                      <Text style={styles.narrativeCardTitle}>{card.title}</Text>
                      <Text style={styles.narrativeCardBody}>{card.body}</Text>
                    </>
                  )}
                </View>
              ))}
            </View>
          </SectionCard>
        </View>

        <View onLayout={(event) => registerSection("Activities", event.nativeEvent.layout.y)}>
          <SectionCard title="Community Activities" subtitle="Current activities and support needs in the community">
            {isEditingCarePlan ? (
              <CarePlanEditorRowActions
                onAdd={() => addDraftRow("activityCards", { title: "", body: "" })}
                addLabel="Add row"
              />
            ) : null}
            <View style={styles.narrativeGrid}>
              {activities.map((card, index) => (
                <View key={card.title} style={styles.narrativeCard}>
                  {isEditingCarePlan ? (
                    <>
                      <CarePlanEditorSectionLabel>Title</CarePlanEditorSectionLabel>
                      <CarePlanEditorField
                        value={card.title}
                        onChangeText={(value) => setDraftValue(["activityCards", index, "title"], value)}
                      />
                      <CarePlanEditorSectionLabel>Body</CarePlanEditorSectionLabel>
                      <CarePlanEditorField
                        value={card.body}
                        onChangeText={(value) => setDraftValue(["activityCards", index, "body"], value)}
                        multiline
                      />
                      <CarePlanEditorRowActions
                        onDelete={() => removeDraftRow("activityCards", index)}
                      />
                    </>
                  ) : (
                    <>
                      <Text style={styles.narrativeCardTitle}>{card.title}</Text>
                      <Text style={styles.narrativeCardBody}>{card.body}</Text>
                    </>
                  )}
                </View>
              ))}
            </View>
          </SectionCard>
        </View>

        <View onLayout={(event) => registerSection("Action Plans", event.nativeEvent.layout.y)}>
          <SectionCard title="Action Plans" subtitle="Measurable outcomes, exact compliance structure, improved usability">
            {isEditingCarePlan ? (
              <CarePlanEditorRowActions
                onAdd={() =>
                  addDraftRow("actionPlans", {
                    title: "",
                    outcome: "",
                    issue: "",
                    steps: [{ step: "", responsible: "", frequency: "", record: "", notes: "" }],
                  })
                }
                addLabel="Add row"
              />
            ) : null}
            <View style={styles.actionPlanStack}>
              {plans.map((plan, planIndex) =>
                isEditingCarePlan ? (
                  <View key={`${plan.title}-${planIndex}`} style={styles.actionPlanCard}>
                    <CarePlanEditorSectionLabel>Plan title</CarePlanEditorSectionLabel>
                    <CarePlanEditorField
                      value={plan.title}
                      onChangeText={(value) => setDraftValue(["actionPlans", planIndex, "title"], value)}
                    />
                    <CarePlanEditorSectionLabel>Desired outcome</CarePlanEditorSectionLabel>
                    <CarePlanEditorField
                      value={plan.outcome}
                      onChangeText={(value) => setDraftValue(["actionPlans", planIndex, "outcome"], value)}
                      multiline
                    />
                    <CarePlanEditorSectionLabel>Need / Issue</CarePlanEditorSectionLabel>
                    <CarePlanEditorField
                      value={plan.issue}
                      onChangeText={(value) => setDraftValue(["actionPlans", planIndex, "issue"], value)}
                      multiline
                    />
                    <CarePlanEditorRowActions
                      onDelete={() => removeDraftRow("actionPlans", planIndex)}
                    />
                    {(plan.steps || []).map((step, stepIndex) => (
                      <View key={`${plan.title}-step-${stepIndex}`} style={styles.carePlanEditorBlock}>
                        <Text style={styles.carePlanEditorBlockTitle}>{`Step ${stepIndex + 1}`}</Text>
                        {[
                          ["Step", "step", true],
                          ["Responsible", "responsible", true],
                          ["Frequency", "frequency", false],
                          ["Record", "record", false],
                          ["Notes", "notes", true],
                        ].map(([label, key, multiline]) => (
                          <View key={key} style={styles.carePlanEditorGroup}>
                            <CarePlanEditorSectionLabel>{label}</CarePlanEditorSectionLabel>
                            <CarePlanEditorField
                              value={step[key]}
                              onChangeText={(value) => setDraftValue(["actionPlans", planIndex, "steps", stepIndex, key], value)}
                              multiline={multiline}
                            />
                          </View>
                        ))}
                        <CarePlanEditorRowActions
                          onAdd={() => addActionPlanStep(planIndex)}
                          addLabel="Add step"
                          onDelete={() => removeActionPlanStep(planIndex, stepIndex)}
                          deleteLabel="Delete step"
                        />
                      </View>
                    ))}
                  </View>
                ) : (
                  <ActionPlanCard
                    key={plan.title}
                    plan={plan}
                    expandedRowKey={expandedActionRow}
                    onToggleRow={setExpandedActionRow}
                    isPhone={isPhone}
                    onOpenDocumentation={onOpenDocumentation}
                  />
                )
              )}
            </View>
          </SectionCard>
        </View>

        <View onLayout={(event) => registerSection("Documents", event.nativeEvent.layout.y)}>
          <SectionCard title="Documents" subtitle="Documentation checklists and referenced files">
            <View style={styles.documentGrid}>
              <View style={styles.documentChecklistCard}>
                <Text style={styles.documentSubhead}>Documentation Checklists</Text>
                {isEditingCarePlan ? (
                  <CarePlanEditorRowActions
                    onAdd={() => addDraftRow("documentChecklist", "")}
                    addLabel="Add row"
                  />
                ) : null}
                {checklist.map((item, index) =>
                  isEditingCarePlan ? (
                    <View key={`${item}-${index}`}>
                      <CarePlanEditorField
                        value={item}
                        onChangeText={(value) => setDraftValue(["documentChecklist", index], value)}
                      />
                      <CarePlanEditorRowActions
                        onDelete={() => removeDraftRow("documentChecklist", index)}
                      />
                    </View>
                  ) : (
                    <View key={item} style={styles.documentChecklistRow}>
                      <View style={styles.documentCheckbox} />
                      <Text style={styles.documentChecklistText}>{item}</Text>
                    </View>
                  )
                )}
              </View>
              <View style={styles.documentChecklistCard}>
                <Text style={styles.documentSubhead}>Referenced Attachments</Text>
                {isEditingCarePlan ? (
                  <CarePlanEditorRowActions
                    onAdd={() => addDraftRow("documentFiles", "")}
                    addLabel="Add row"
                  />
                ) : null}
                {files.map((item, index) =>
                  isEditingCarePlan ? (
                    <View key={`${item}-${index}`}>
                      <CarePlanEditorField
                        value={item}
                        onChangeText={(value) => setDraftValue(["documentFiles", index], value)}
                      />
                      <CarePlanEditorRowActions
                        onDelete={() => removeDraftRow("documentFiles", index)}
                      />
                    </View>
                  ) : (
                    <Text key={item} style={styles.documentFileText}>
                      {item}
                    </Text>
                  )
                )}
              </View>
            </View>
          </SectionCard>
        </View>

        <View onLayout={(event) => registerSection("Participants", event.nativeEvent.layout.y)}>
          <SectionCard title="Participants & Signature Logs" subtitle="Plan participants and acknowledgement trail">
            {isEditingCarePlan ? (
              <CarePlanEditorRowActions
                onAdd={() => addDraftRow("participants", { name: "", relationship: "", copy: "" })}
                addLabel="Add participant"
              />
            ) : null}
            <View style={styles.participantTable}>
              <View style={styles.participantHeader}>
                <Text style={[styles.participantHeaderCell, { flex: 1.3 }]}>Participant</Text>
                <Text style={[styles.participantHeaderCell, { flex: 1.4 }]}>Relationship</Text>
                <Text style={[styles.participantHeaderCell, { flex: 0.7 }]}>Copy</Text>
              </View>
              {roster.map((item, index) => (
                <View key={`${item.name}-${index}`} style={styles.participantRow}>
                  {isEditingCarePlan ? (
                    <>
                      <CarePlanEditorField
                        value={item.name}
                        onChangeText={(value) => setDraftValue(["participants", index, "name"], value)}
                        style={[styles.participantCell, styles.carePlanEditorTableInput, { flex: 1.3 }]}
                      />
                      <CarePlanEditorField
                        value={item.relationship}
                        onChangeText={(value) => setDraftValue(["participants", index, "relationship"], value)}
                        style={[styles.participantCell, styles.carePlanEditorTableInput, { flex: 1.4 }]}
                      />
                      <CarePlanEditorField
                        value={item.copy}
                        onChangeText={(value) => setDraftValue(["participants", index, "copy"], value)}
                        style={[styles.participantCell, styles.carePlanEditorTableInput, { flex: 0.7 }]}
                      />
                      <CarePlanEditorRowActions
                        onDelete={() => removeDraftRow("participants", index)}
                      />
                    </>
                  ) : (
                    <>
                      <Text style={[styles.participantCell, { flex: 1.3 }]}>{item.name}</Text>
                      <Text style={[styles.participantCell, { flex: 1.4 }]}>{item.relationship}</Text>
                      <Text style={[styles.participantCell, { flex: 0.7 }]}>{item.copy}</Text>
                    </>
                  )}
                </View>
              ))}
            </View>
            <View style={styles.signatureList}>
              {isEditingCarePlan ? (
                <CarePlanEditorRowActions
                  onAdd={() => addDraftRow("signatureLogs", "")}
                  addLabel="Add row"
                />
              ) : null}
              {signatures.map((item, index) =>
                isEditingCarePlan ? (
                  <View key={`${item}-${index}`}>
                    <CarePlanEditorField
                      value={item}
                      onChangeText={(value) => setDraftValue(["signatureLogs", index], value)}
                    />
                    <CarePlanEditorRowActions
                      onDelete={() => removeDraftRow("signatureLogs", index)}
                    />
                  </View>
                ) : (
                  <Text key={item} style={styles.signatureItem}>
                    {`• ${item}`}
                  </Text>
                )
              )}
            </View>
          </SectionCard>
        </View>

        <View onLayout={(event) => registerSection("Source Pages", event.nativeEvent.layout.y)}>
          <SectionCard title="Full Source Pages" subtitle="Complete OCR extract retained so all PDF content remains available">
            {isEditingCarePlan ? (
              <CarePlanEditorRowActions
                onAdd={() => addDraftRow("carePlanTextPages", { page: "", text: "" })}
                addLabel="Add page"
              />
            ) : null}
            <View style={styles.sourcePageStack}>
              {sourcePages.map((page, index) => {
                const isExpanded = expandedSourcePage === page.page;
                return (
                  <View key={`source-page-${page.page}`} style={styles.sourcePageCard}>
                    {isEditingCarePlan ? (
                      <>
                        <Pressable
                          onPress={() => setExpandedSourcePage(isExpanded ? null : page.page)}
                          style={styles.sourcePageHeader}
                        >
                          <Text style={styles.sourcePageTitle}>{`Source Page ${page.page || index + 1}`}</Text>
                          <Text style={styles.sourcePageToggle}>{isExpanded ? "Hide" : "Show"}</Text>
                        </Pressable>
                        {isExpanded ? (
                          <>
                            <CarePlanEditorSectionLabel>Page</CarePlanEditorSectionLabel>
                            <CarePlanEditorField
                              value={String(page.page)}
                              onChangeText={(value) => setDraftValue(["carePlanTextPages", index, "page"], value)}
                            />
                            <CarePlanEditorSectionLabel>Text</CarePlanEditorSectionLabel>
                            <CarePlanEditorField
                              value={page.text}
                              onChangeText={(value) => setDraftValue(["carePlanTextPages", index, "text"], value)}
                              multiline
                              style={styles.carePlanSourceEditorInput}
                            />
                            <CarePlanEditorRowActions
                              onDelete={() => removeDraftRow("carePlanTextPages", index)}
                            />
                          </>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <Pressable
                          onPress={() => setExpandedSourcePage(isExpanded ? null : page.page)}
                          style={styles.sourcePageHeader}
                        >
                          <Text style={styles.sourcePageTitle}>{`Source Page ${page.page}`}</Text>
                          <Text style={styles.sourcePageToggle}>{isExpanded ? "Hide" : "Show"}</Text>
                        </Pressable>
                        {isExpanded ? <Text style={styles.sourcePageText}>{page.text}</Text> : null}
                      </>
                    )}
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

function DocumentationGuideScreen({ expandedDocumentationGuide, onToggleGuide }) {
  return (
    <Card title="Documentation Guide">
      <View style={styles.documentationGuide}>
        <Text style={styles.documentationGuideIntro}>
          Click any how-to below to open the steps for that part of documentation.
        </Text>

        {documentationHowToGuides.map((guide) => {
          const isExpanded = expandedDocumentationGuide === guide.title;

          return (
            <Pressable
              key={guide.title}
              onPress={() => onToggleGuide(isExpanded ? null : guide.title)}
              style={[
                styles.documentationGuideSection,
                isExpanded && styles.documentationGuideSectionExpanded,
              ]}
            >
              <View style={styles.documentationGuideSectionHeader}>
                <View style={styles.documentationGuideSectionTextWrap}>
                  <Text style={styles.documentationGuideSectionTitle}>{guide.title}</Text>
                  <Text style={styles.documentationGuideSectionSummary}>{guide.summary}</Text>
                </View>
                <Icon
                  name={isExpanded ? "chevronDown" : "chevronRight"}
                  size={16}
                  color={colors.headerText}
                />
              </View>
              {isExpanded ? (
                <View style={styles.documentationGuideSteps}>
                  {guide.steps.map((step, index) => (
                    <View key={step} style={styles.documentationGuideStepRow}>
                      <View style={styles.documentationGuideStepIndex}>
                        <Text style={styles.documentationGuideStepIndexText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.documentationGuideStepText}>{step}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

export default function App() {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      return;
    }
    const scale = docuWraiteWebInitialScale;
    if (!Number.isFinite(scale) || scale <= 0 || scale === 1) {
      return;
    }
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      meta.setAttribute(
        "content",
        `width=device-width, initial-scale=${scale}, maximum-scale=1`
      );
    }
  }, []);

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
  const [expandedDocumentationGuide, setExpandedDocumentationGuide] = useState(
    documentationHowToGuides[0]?.title ?? null
  );
  const [documentationSession, setDocumentationSession] = useState(null);
  const [activeClientId, setActiveClientId] = useState("mary-bet");
  const [individualQuery, setIndividualQuery] = useState("Mary Bet");
  const [showIndividualSuggestions, setShowIndividualSuggestions] = useState(false);
  const [hoveredClientSuggestionId, setHoveredClientSuggestionId] = useState(null);
  const [pendingDecisionAssignmentTarget, setPendingDecisionAssignmentTarget] = useState(null);
  const [persistedClientShift, setPersistedClientShift] = useState(null);
  const [persistedClientCarePlan, setPersistedClientCarePlan] = useState(null);
  const activeClientProfile = useMemo(
    () =>
      mergeResolvedClientProfile(getClientById(activeClientId) || getMaryBetProfile(), {
        clientShift: persistedClientShift,
        clientCarePlan: persistedClientCarePlan,
      }),
    [activeClientId, persistedClientShift, persistedClientCarePlan]
  );
  const activeClientPhoto = activeClientId === "mark-brent" ? markBrentProfilePhoto : maryBetProfilePhoto;
  const activeDisplayName = activeClientProfile.displayName;
  const activeIspRows = activeClientProfile.ispRows ?? ispRows;
  const clientSuggestions = searchClients(individualQuery);
  const showCarePlan = selectedModule === "Care Plan";
  const showDecisionEngine = selectedModule === "Decision Engine";
  const showDocumentationGuide = selectedModule === "Documentation Guide";
  const defaultCaseNoteTemplate = createDocumentationSession({
    title: "Case Note (Decision Engine)",
    program: "Case Note",
    sessionType: "case-note",
    clientProfile: activeClientProfile,
    rowsOverride: [],
  });
  const [decisionEngineTimeBlocks, setDecisionEngineTimeBlocks] = useState(defaultCaseNoteTemplate.timeBlocks);
  const [decisionEngineRows, setDecisionEngineRows] = useState(defaultCaseNoteTemplate.rows);
  const [decisionEngineSelectionState, setDecisionEngineSelectionState] = useState({
    selectedLibrary: getDefaultDecisionLibrarySlug(),
    selectedNoteType: "block-time",
    selectedDepth: 2,
    includeMode: "full-branch",
    selectedBranchKey: "",
    targetType: "time-block",
    selectedTargetKey: "",
    checkedNodes: {},
    includeInFinalMap: {},
    choiceSelections: {},
    builderDraftSeed: null,
    stagedAssignments: [],
    finalizedAssignments: [],
    collapsedSections: {},
  });
  const [decisionEngineHint, setDecisionEngineHint] = useState("");
  const [decisionStateHydrated, setDecisionStateHydrated] = useState(false);
  const [decisionEngineSelectionLoadToken, setDecisionEngineSelectionLoadToken] = useState(0);
  const lastLoadedStateRef = useRef(null);
  const workspaceStatus = documentationSession
    ? documentationSession.title
    : showCarePlan
      ? activeClientProfile?.carePlanHeader?.status ?? "Plan Approved"
      : activeClientProfile?.workspaceStatus ?? "Admitted";
  const workspaceTab = documentationSession
    ? documentationSession.sessionType === "case-note"
      ? "Case Note"
      : "Documentation"
    : showCarePlan
      ? "Care Plan"
      : showDecisionEngine
        ? "Decision Engine"
        : "Home";
  const topTabs = [
    ...(documentationSession?.sessionType === "case-note" ? ["Case Note"] : []),
    "Profile",
    "Plans",
    "Case Status",
    "About Me",
  ];

  useEffect(() => {
    if (!showIndividualSuggestions) {
      setHoveredClientSuggestionId(null);
    }
  }, [showIndividualSuggestions]);

  useEffect(() => {
    if (!decisionEngineHint) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setDecisionEngineHint("");
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [decisionEngineHint]);

  useEffect(() => {
    let cancelled = false;
    const defaultTemplate = createDocumentationSession({
      title: "Case Note (Decision Engine)",
      program: "Case Note",
      sessionType: "case-note",
      clientProfile: activeClientProfile,
      rowsOverride: [],
    });

    setDecisionStateHydrated(false);
    setPersistedClientShift(null);
    setPersistedClientCarePlan(null);

    const applyDefaultState = () => {
      if (cancelled) {
        return;
      }

      setDecisionEngineTimeBlocks(defaultTemplate.timeBlocks);
      setDecisionEngineRows(defaultTemplate.rows);
      setDocumentationSession(null);
      setDecisionEngineSelectionState({
        selectedLibrary: getDefaultDecisionLibrarySlug(),
        selectedNoteType: "block-time",
        selectedDepth: 2,
        includeMode: "full-branch",
        selectedBranchKey: "",
        targetType: "time-block",
        selectedTargetKey: "",
        checkedNodes: {},
        includeInFinalMap: {},
        choiceSelections: {},
        builderDraftSeed: null,
        stagedAssignments: [],
        finalizedAssignments: [],
        collapsedSections: {},
      });
      lastLoadedStateRef.current = JSON.stringify({
        clientId: activeClientId,
        timeBlocks: defaultTemplate.timeBlocks,
        rows: defaultTemplate.rows,
        documentationSession: null,
          selectionState: {
          selectedLibrary: getDefaultDecisionLibrarySlug(),
          selectedNoteType: "block-time",
          selectedDepth: 2,
          includeMode: "full-branch",
          selectedBranchKey: "",
          targetType: "time-block",
          selectedTargetKey: "",
          checkedNodes: {},
          includeInFinalMap: {},
          choiceSelections: {},
          builderDraftSeed: null,
          stagedAssignments: [],
          finalizedAssignments: [],
          collapsedSections: {},
        },
      });
      setDecisionStateHydrated(true);
    };

    fetch(
      `${docuWraiteApiBaseUrl}/api/workspace-state/${activeClientId}?syncTherap=true&syncCarePlan=false`
    )
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled) {
          return;
        }

        if (payload?.clientShift) {
          setPersistedClientShift(payload.clientShift);
        }
        if (payload?.clientCarePlan) {
          setPersistedClientCarePlan(payload.clientCarePlan);
        }

        const state = payload?.state;
        if (!state) {
          applyDefaultState();
          return;
        }

        const nextTimeBlocks = Array.isArray(state.timeBlocks) && state.timeBlocks.length
          ? state.timeBlocks
          : defaultTemplate.timeBlocks;
        const sanitizedRows = Array.isArray(state.rows)
          ? stripLegacyDecisionEngineSeedRows(state.rows)
          : [];
        const nextRows = sanitizedRows.length
          ? sanitizedRows
          : defaultTemplate.rows;
        const nextSession = state.documentationSession || null;
        const nextSelectionState = {
          selectedLibrary: state.selectionState?.selectedLibrary || getDefaultDecisionLibrarySlug(),
          selectedNoteType: normalizeDecisionNoteType(state.selectionState?.selectedNoteType),
          selectedDepth: state.selectionState?.selectedDepth || 2,
          includeMode: state.selectionState?.includeMode || "full-branch",
          selectedBranchKey: state.selectionState?.selectedBranchKey || "",
          targetType: state.selectionState?.targetType || "time-block",
          selectedTargetKey: state.selectionState?.selectedTargetKey || "",
          checkedNodes: state.selectionState?.checkedNodes || {},
          includeInFinalMap: state.selectionState?.includeInFinalMap || {},
          choiceSelections: state.selectionState?.choiceSelections || {},
          builderDraftSeed: state.selectionState?.builderDraftSeed || null,
          stagedAssignments: state.selectionState?.stagedAssignments || [],
          finalizedAssignments: state.selectionState?.finalizedAssignments || [],
          collapsedSections: state.selectionState?.collapsedSections || {},
        };

        setDecisionEngineTimeBlocks(nextTimeBlocks);
        setDecisionEngineRows(nextRows);
        setDocumentationSession(nextSession);
        setDecisionEngineSelectionState(nextSelectionState);
        lastLoadedStateRef.current = JSON.stringify({
          clientId: activeClientId,
          timeBlocks: nextTimeBlocks,
          rows: nextRows,
          documentationSession: nextSession,
          selectionState: nextSelectionState,
        });
        setDecisionStateHydrated(true);
      })
      .catch(() => {
        applyDefaultState();
      });

    return () => {
      cancelled = true;
    };
  }, [activeClientId]);

  useEffect(() => {
    if (!decisionStateHydrated) {
      return undefined;
    }

    const nextState = {
      clientId: activeClientId,
      timeBlocks: decisionEngineTimeBlocks,
      rows: decisionEngineRows,
      documentationSession,
      selectionState: decisionEngineSelectionState,
    };
    const serialized = JSON.stringify(nextState);

    if (serialized === lastLoadedStateRef.current) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      fetch(`${docuWraiteApiBaseUrl}/api/workspace-state/${activeClientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeBlocks: decisionEngineTimeBlocks,
          rows: decisionEngineRows,
          documentationSession,
          selectedLibrary: decisionEngineSelectionState.selectedLibrary,
          selectedNoteType: decisionEngineSelectionState.selectedNoteType,
          selectedDepth: decisionEngineSelectionState.selectedDepth,
          includeMode: decisionEngineSelectionState.includeMode,
          selectedBranchKey: decisionEngineSelectionState.selectedBranchKey,
          selectedTargetType: decisionEngineSelectionState.targetType,
          selectedTargetId: decisionEngineSelectionState.selectedTargetKey
            ? decisionEngineSelectionState.selectedTargetKey.split(":").slice(1).join(":")
            : null,
          checkedNodes: decisionEngineSelectionState.checkedNodes,
          includeInFinalMap: decisionEngineSelectionState.includeInFinalMap,
          choiceSelections: decisionEngineSelectionState.choiceSelections,
          stagedAssignments: decisionEngineSelectionState.stagedAssignments,
          finalizedAssignments: decisionEngineSelectionState.finalizedAssignments,
          collapsedSections: decisionEngineSelectionState.collapsedSections,
          updatedAt: new Date().toISOString(),
        }),
      })
        .then(() => {
          lastLoadedStateRef.current = serialized;
        })
        .catch(() => {});
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [
    activeClientId,
    decisionEngineRows,
    decisionEngineSelectionState,
    decisionEngineTimeBlocks,
    decisionStateHydrated,
    documentationSession,
  ]);

  const handleSelectClient = (clientId) => {
    setActiveClientId(clientId);
    const selectedClient = CLIENT_ROSTER.find((client) => client.id === clientId);
    setIndividualQuery(selectedClient?.displayName ?? "");
    setShowIndividualSuggestions(false);
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

  const handleSaveCarePlan = async (draft) => {
    const existingOptions =
      persistedClientCarePlan?.intelligenceOptions || activeClientProfile.shiftIntelligenceOptions || {};
    const payload = {
      riskCards: draft.riskCards || [],
      actionPlans: draft.actionPlans || [],
      intelligenceOptions: {
        ...existingOptions,
        editorContent: buildCarePlanEditorContentPayload(draft),
      },
    };

    const response = await fetch(`${docuWraiteApiBaseUrl}/api/clients/${activeClientId}/care-plan`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Care plan could not be saved.");
    }

    if (data?.clientCarePlan) {
      setPersistedClientCarePlan(data.clientCarePlan);
    }

    return data?.clientCarePlan || null;
  };

  const handleExtractCarePlanFromSource = async () => {
    const response = await fetch(`${docuWraiteApiBaseUrl}/api/clients/${activeClientId}/care-plan/extract-source`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Care plan source extraction failed.");
    }

    return data.extraction || null;
  };

  const buildCaseNoteDocumentationSession = (config = {}) => {
    let session = createDocumentationSession({
      title: config.title || "Case Note Entry",
      program: config.program || "Case Note",
      sessionType: "case-note",
      clientProfile: activeClientProfile,
      timeBlocksOverride: decisionEngineTimeBlocks,
      rowsOverride: decisionEngineRows,
    });
    const finalizedAssignments = decisionEngineSelectionState.finalizedAssignments || [];

    if (finalizedAssignments.length) {
      session = applyFinalizedAssignmentsToDocumentationSession(session, finalizedAssignments);
    }

    return session;
  };

  const openDocumentation = (config) => {
    if (config.sessionType === "case-note") {
      if (documentationSession?.sessionType === "case-note") {
        const finalizedAssignments = decisionEngineSelectionState.finalizedAssignments || [];
        if (finalizedAssignments.length) {
          setDocumentationSession((current) =>
            applyFinalizedAssignmentsToDocumentationSession(current, finalizedAssignments)
          );
        }
        return;
      }

      setDocumentationSession(buildCaseNoteDocumentationSession(config));
      return;
    }

    setDocumentationSession(
      createDocumentationSession({
        ...config,
        clientProfile: activeClientProfile,
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

  const handleOpenDocumentationGuide = () => {
    setSelectedModule("Documentation Guide");
    setDocumentationSession(null);
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

  const handleStageAssignment = (stagedAssignment) => {
    if (!stagedAssignment?.target?.targetId || !stagedAssignment?.selectedNodesPayload?.length) {
      return;
    }

    const nextKey = buildDecisionAssignmentUniquenessKey(stagedAssignment);
    setDecisionEngineSelectionState((prev) => ({
      ...prev,
      stagedAssignments: [
        ...(prev.stagedAssignments || []).filter(
          (assignment) => buildDecisionAssignmentUniquenessKey(assignment) !== nextKey
        ),
        stagedAssignment,
      ],
      finalizedAssignments: (prev.finalizedAssignments || []).filter(
        (assignment) => buildDecisionAssignmentUniquenessKey(assignment) !== nextKey
      ),
    }));
  };

  const handleDeleteStagedAssignment = (assignmentId) => {
    const assignment = (decisionEngineSelectionState.stagedAssignments || []).find(
      (entry) => entry.id === assignmentId
    );
    if (!assignment) {
      return;
    }

    const targetLabel = buildDecisionTargetDisplayLabel(assignment.target);
    const libraryLabel = getDecisionLibraryDisplayName(assignment.selectedLibrary);

    runDecisionEngineConfirmAction({
      title: "Delete staged assignment?",
      message: `This will remove ${libraryLabel} from staged and clear its assigned questions from the DSP Case Note for ${targetLabel}.`,
      confirmLabel: "Delete",
      onConfirm: () => {
        const nextFinalizedAssignments = decisionEngineSelectionState.finalizedAssignments || [];

        setDecisionEngineSelectionState((prev) => ({
          ...prev,
          stagedAssignments: (prev.stagedAssignments || []).filter((entry) => entry.id !== assignmentId),
        }));

        if (documentationSession?.sessionType === "case-note") {
          setDocumentationSession((prev) =>
            applyFinalizedAssignmentsToDocumentationSession(prev, nextFinalizedAssignments)
          );
        }

        setDecisionEngineHint(
          `Deleted staged assignment for ${targetLabel} and removed it from the DSP Case Note.`
        );
      },
    });
  };

  const handleDeleteFinalizedAssignment = (assignmentId) => {
    const assignment = (decisionEngineSelectionState.finalizedAssignments || []).find(
      (entry) => entry.id === assignmentId
    );
    if (!assignment) {
      return;
    }

    const targetLabel = buildDecisionTargetDisplayLabel(assignment.target);
    const libraryLabel = getDecisionLibraryDisplayName(assignment.selectedLibrary);
    const assignmentKey = buildDecisionAssignmentUniquenessKey(assignment);
    const nextFinalizedAssignments = (decisionEngineSelectionState.finalizedAssignments || []).filter(
      (entry) => entry.id !== assignmentId
    );

    setDecisionEngineSelectionState((prev) => ({
      ...prev,
      finalizedAssignments: nextFinalizedAssignments,
      stagedAssignments: [
        ...(prev.stagedAssignments || []).filter(
          (entry) => buildDecisionAssignmentUniquenessKey(entry) !== assignmentKey
        ),
        assignment,
      ],
    }));

    if (documentationSession?.sessionType === "case-note") {
      setDocumentationSession((prev) =>
        applyFinalizedAssignmentsToDocumentationSession(prev, nextFinalizedAssignments)
      );
    }

    const message = `${libraryLabel} for ${targetLabel} was moved back to staged and removed from the DSP Case Note. Final assign again when you are ready.`;
    if (Platform.OS === "web" && typeof window !== "undefined" && typeof window.alert === "function") {
      window.alert(message);
    } else {
      Alert.alert("Moved back to staged", message, [{ text: "OK" }]);
    }
    setDecisionEngineHint(message);
  };

  const loadAssignmentIntoDecisionEngine = (assignment, sourceListKey = "stagedAssignments") => {
    if (!assignment) {
      return;
    }

    const nextCheckedNodes = {};
    const nextIncludeInFinalMap = {};
    const nextChoiceSelections = {};
    (assignment.selectedNodesPayload || []).forEach((node) => {
      nextCheckedNodes[node.key] = true;
      nextIncludeInFinalMap[node.key] = Boolean(node.includeInFinal);
      nextChoiceSelections[node.key] = node.selectedChoices || [];
    });

    const restoredTargetKey =
      assignment.target?.key ||
      (assignment.target?.type === "case-note-row" && assignment.target?.targetId
        ? `row:${assignment.target.targetId}`
        : assignment.target?.targetId
          ? `time:${assignment.target.targetId}`
          : "");
    const builderDraftSeed = buildBuilderDraftSeedFromTarget(
      restoredTargetKey,
      decisionEngineTimeBlocks,
      decisionEngineRows,
      assignment.target?.type === "case-note-row" ? assignment.target?.label || "" : "",
      assignment.target?.description || ""
    );

    setDecisionEngineSelectionState((prev) => ({
      ...prev,
      selectedLibrary: assignment.selectedLibrary || prev.selectedLibrary,
      selectedNoteType: normalizeDecisionNoteType(assignment.selectedNoteType || prev.selectedNoteType),
      selectedDepth: assignment.selectedDepth || prev.selectedDepth,
      includeMode: assignment.includeMode || prev.includeMode,
      selectedBranchKey: assignment.selectedBranchKey || prev.selectedBranchKey,
      targetType: assignment.target?.type || prev.targetType,
      selectedTargetKey: restoredTargetKey || prev.selectedTargetKey,
      checkedNodes: nextCheckedNodes,
      includeInFinalMap: nextIncludeInFinalMap,
      choiceSelections: nextChoiceSelections,
      builderDraftSeed: builderDraftSeed || null,
      stagedAssignments:
        sourceListKey === "stagedAssignments"
          ? (prev.stagedAssignments || []).filter((item) => item.id !== assignment.id)
          : prev.stagedAssignments || [],
      finalizedAssignments:
        sourceListKey === "finalizedAssignments"
          ? (prev.finalizedAssignments || []).filter((item) => item.id !== assignment.id)
          : prev.finalizedAssignments || [],
    }));
    setDecisionEngineSelectionLoadToken((token) => token + 1);
    setDecisionEngineHint(
      `Loaded ${sourceListKey === "finalizedAssignments" ? "finalized" : "staged"} assignment into the library. Update selections and lock again.`
    );
  };

  const handleEditStagedAssignment = (assignment) => {
    loadAssignmentIntoDecisionEngine(assignment, "stagedAssignments");
  };

  const handleEditFinalizedAssignment = (assignment) => {
    loadAssignmentIntoDecisionEngine(assignment, "finalizedAssignments");
  };

  const handleFinalizeAssignments = () => {
    const stagedAssignments = decisionEngineSelectionState.stagedAssignments || [];
    if (!stagedAssignments.length) {
      return;
    }

    const assignedTimeBlockIds = Array.from(
      new Set(
        stagedAssignments
          .filter((assignment) => assignment?.target?.type === "time-block" && assignment?.target?.targetId)
          .map((assignment) => assignment.target.targetId)
      )
    );
    const scopedTimeBlocks = decisionEngineTimeBlocks.filter((block) => assignedTimeBlockIds.includes(block.id));
    const scopedRows = decisionEngineRows.filter((row) => Boolean(row?.id));

    const baseSession = createDocumentationSession({
      title: "Case Note Entry",
      program: "Case Note",
      sessionType: "case-note",
      clientProfile: activeClientProfile,
      timeBlocksOverride: scopedTimeBlocks,
      rowsOverride: scopedRows,
    });

    const nextFinalizedAssignments = [...(decisionEngineSelectionState.finalizedAssignments || [])];
    stagedAssignments.forEach((assignment) => {
      const nextKey = buildDecisionAssignmentUniquenessKey(assignment);
      const filteredAssignments = nextFinalizedAssignments.filter(
        (item) => buildDecisionAssignmentUniquenessKey(item) !== nextKey
      );
      filteredAssignments.push(assignment);
      nextFinalizedAssignments.length = 0;
      nextFinalizedAssignments.push(...filteredAssignments);
    });

    const session = applyFinalizedAssignmentsToDocumentationSession(
      {
        ...baseSession,
        statusMessage: "Decision Engine assignments loaded into the DSP Case Note.",
      },
      nextFinalizedAssignments
    );

    setDocumentationSession(session);
    setSelectedModule("Decision Engine");
    setDecisionEngineHint("Case Note is ready to be used by DSP.");
    setPendingDecisionAssignmentTarget(null);
    setDecisionEngineSelectionState((prev) => ({
      ...prev,
      selectedLibrary: getDefaultDecisionLibrarySlug(),
      selectedNoteType: "block-time",
      selectedDepth: 2,
      includeMode: "full-branch",
      selectedBranchKey: "",
      targetType: "time-block",
      selectedTargetKey: decisionEngineTimeBlocks[0] ? `time:${decisionEngineTimeBlocks[0].id}` : "",
      checkedNodes: {},
      includeInFinalMap: {},
      choiceSelections: {},
      builderDraftSeed: null,
      stagedAssignments: [],
      finalizedAssignments: nextFinalizedAssignments,
      collapsedSections: {},
    }));
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
              <Text style={[styles.logo, { fontSize: topTitleSize }]}>Docuwraite</Text>
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
                          <Icon name="chevronRight" size={14} color={moduleColor} style={styles.moduleIcon} />
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
                rightAccessory={<Icon name="chevronDown" size={18} color={colors.headerText} />}
              />

              <Card
                title="Reference PDFs"
                rightAccessory={<Icon name="maximize" size={16} color={colors.headerText} />}
              >
                <View style={styles.pdfList}>
                  {pdfs.map((item) => (
                    <Pressable key={item} style={styles.pdfRow} onPress={handleOpenDocumentationGuide}>
                      <Text style={styles.pdfItem}>{item}</Text>
                      <Icon name="externalLink" size={15} color={colors.link} style={styles.pdfLinkIcon} />
                    </Pressable>
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
                        <Icon name="arrowRightCircle" size={18} color="#ffffff" />
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
                  {topTabs.map((tab) => (
                    <Text key={tab} style={styles.tabText}>
                      {tab}
                    </Text>
                  ))}
                </View>
              </View>

              {showDecisionEngine && decisionStateHydrated ? (
                <DecisionEngineScreen
                  key={`decision-engine-${activeClientId}-${decisionEngineSelectionLoadToken}`}
                  isPhone={isPhone}
                  onStageAssignment={handleStageAssignment}
                  stagedAssignments={decisionEngineSelectionState.stagedAssignments || []}
                  finalizedAssignments={decisionEngineSelectionState.finalizedAssignments || []}
                  onEditStagedAssignment={handleEditStagedAssignment}
                  onDeleteStagedAssignment={handleDeleteStagedAssignment}
                  onEditFinalizedAssignment={handleEditFinalizedAssignment}
                  onDeleteFinalizedAssignment={handleDeleteFinalizedAssignment}
                  onFinalizeAssignments={handleFinalizeAssignments}
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
                  initialSelectionState={decisionEngineSelectionState}
                  onScheduleChange={setDecisionEngineTimeBlocks}
                  onRowsChange={setDecisionEngineRows}
                  onSelectionStateChange={setDecisionEngineSelectionState}
                  externalAssignmentHint={decisionEngineHint}
                />
              ) : showCarePlan ? (
                <CarePlanDocument
                  key={activeClientId}
                  isPhone={isPhone}
                  onOpenDocumentation={openDocumentation}
                  documentationSession={documentationSession}
                  onDocumentationUpdate={setDocumentationSession}
                  onDocumentationCancel={() => setDocumentationSession(null)}
                  onSaveCarePlan={handleSaveCarePlan}
                  onExtractCarePlanFromSource={handleExtractCarePlanFromSource}
                  clientProfile={activeClientProfile}
                  clientPhoto={activeClientPhoto}
                />
              ) : showDocumentationGuide ? (
                <DocumentationGuideScreen
                  expandedDocumentationGuide={expandedDocumentationGuide}
                  onToggleGuide={setExpandedDocumentationGuide}
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
    zIndex: 5,
  },
  rightColumn: {
    rowGap: 16,
    flexShrink: 0,
    overflow: "visible",
    zIndex: 1,
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
  cardHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  cardHeaderTitleIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(124, 58, 237, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  intelBadgeOverdue: {
    backgroundColor: "rgba(211, 47, 47, 0.12)",
    borderColor: "rgba(211, 47, 47, 0.22)",
  },
  intelBadgeRisks: {
    backgroundColor: "rgba(245, 158, 11, 0.16)",
    borderColor: "rgba(245, 158, 11, 0.24)",
  },
  intelBadgeAppointments: {
    backgroundColor: "rgba(59, 130, 246, 0.14)",
    borderColor: "rgba(59, 130, 246, 0.22)",
  },
  intelBadgeMedications: {
    backgroundColor: "rgba(16, 185, 129, 0.14)",
    borderColor: "rgba(16, 185, 129, 0.22)",
  },
  intelBadgeAlerts: {
    backgroundColor: "rgba(249, 115, 22, 0.14)",
    borderColor: "rgba(249, 115, 22, 0.22)",
  },
  intelBadgeGoals: {
    backgroundColor: "rgba(139, 92, 246, 0.14)",
    borderColor: "rgba(139, 92, 246, 0.22)",
  },
  intelCardPressable: {
    borderRadius: 4,
  },
  intelCompactCard: {
    minHeight: 0,
  },
  intelCompactBody: {
    paddingTop: 10,
    paddingBottom: 12,
  },
  intelCompactHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 10,
  },
  intelCompactCount: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  intelCompactHint: {
    fontSize: 11,
    color: colors.placeholder,
  },
  intelCompactPreview: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
    marginBottom: 6,
  },
  intelCompactEmpty: {
    fontSize: 13,
    color: colors.placeholder,
    lineHeight: 18,
  },
  intelPopoverRoot: {
    flex: 1,
  },
  intelPopoverBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  intelPopoverCard: {
    backgroundColor: "#f7f4ff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d9d1f0",
    shadowColor: "#2f1f52",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    maxHeight: 320,
    overflow: "hidden",
  },
  intelPopoverCardCentered: {
    position: "absolute",
    top: "20%",
    left: 12,
    right: 12,
  },
  intelPopoverHeader: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: "#efe9ff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd4f3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  intelPopoverTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
    minWidth: 0,
  },
  intelPopoverTitleTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  intelPopoverTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  intelPopoverSubtitle: {
    fontSize: 12,
    color: colors.placeholder,
    marginTop: 2,
  },
  intelPopoverCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2ebff",
  },
  intelPopoverBody: {
    maxHeight: 240,
  },
  intelPopoverBodyContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: "#f7f4ff",
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
    zIndex: 20,
    elevation: 20,
  },
  decisionCardBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    overflow: "visible",
    zIndex: 20,
  },
  decisionAssignForm: {
    minWidth: "100%",
    marginBottom: 18,
    paddingRight: 24,
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    gap: 12,
    overflow: "visible",
    position: "relative",
  },
  decisionAssignFormScroll: {
    marginBottom: 18,
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
    alignItems: "center",
    gap: 8,
    overflow: "visible",
    flexShrink: 0,
  },
  decisionTargetRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    gap: 8,
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
    flexShrink: 0,
  },
  decisionFormFieldGrow: {
    flexShrink: 1,
    gap: 8,
    overflow: "visible",
  },
  decisionFormFieldDepth: {
    alignItems: "flex-start",
    gap: 8,
    flexShrink: 0,
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
    position: "relative",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    backgroundColor: "#fcfbff",
    marginBottom: 18,
    overflow: "visible",
    zIndex: 1,
  },
  decisionScheduleEditorOverlayActive: {
    zIndex: 120,
    elevation: 24,
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
  decisionPromptInputWrap: {
    position: "relative",
    marginBottom: 12,
    overflow: "visible",
  },
  decisionRowInputInPromptWrap: {
    marginBottom: 0,
  },
  decisionRowInputWithAssist: {
    paddingTop: 42,
    paddingRight: 46,
  },
  decisionInlineHint: {
    alignSelf: "flex-start",
    marginTop: -2,
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#fff3f1",
    color: colors.red,
    fontSize: 12,
    fontWeight: "700",
  },
  decisionGuideNote: {
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#fce7f3",
    borderWidth: 1,
    borderColor: "#f9a8d4",
  },
  decisionGuideNoteTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: "#9d174d",
    marginBottom: 4,
  },
  decisionGuideNoteText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#831843",
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
    alignItems: "center",
    marginBottom: 14,
  },
  rowPromptAnchor: {
    position: "relative",
    marginBottom: 12,
    overflow: "visible",
    zIndex: 30,
  },
  rowPromptPopover: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 10,
    maxHeight: 360,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.lightBorder,
    borderRadius: 12,
    backgroundColor: docuWraiteColors.surface,
    shadowColor: "#2f184f",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
    zIndex: 80,
  },
  rowPromptPopoverPhone: {
    left: 0,
    right: 0,
  },
  rowPromptTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.headerText,
    marginBottom: 4,
  },
  rowPromptLead: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
    marginBottom: 10,
  },
  rowPromptStatus: {
    fontSize: 12,
    color: colors.muted,
  },
  rowPromptPopoverScroll: {
    maxHeight: 260,
  },
  rowPromptSuggestionList: {
    gap: 8,
  },
  rowPromptSuggestionCard: {
    borderWidth: 1,
    borderColor: colors.rowBorder,
    borderRadius: 4,
    backgroundColor: "#fcfbff",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowPromptSuggestionText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  decisionWorkflowAddRowButton: {
    marginLeft: "auto",
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
    borderRadius: 4,
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
    borderRadius: 3,
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
  decisionTimelineBlockList: {
    gap: 10,
  },
  decisionTimelineBlockCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  decisionTimelineBlockHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  decisionTimelineBlockHeaderMain: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  decisionTimelineBlockTime: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.headerText,
  },
  decisionTimelineBlockCategory: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
    textTransform: "uppercase",
    color: colors.link,
    backgroundColor: "#f4f0ff",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: "hidden",
  },
  decisionTimelineBlockDetail: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.text,
  },
  decisionTimelineBlockDetailMuted: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
    fontStyle: "italic",
  },
  decisionTimelineBlockEmpty: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
  },
  decisionExplainerCard: {
    marginBottom: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.lightBorder,
    borderRadius: 12,
    backgroundColor: "#fffdfd",
  },
  decisionExplainerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.headerText,
    marginBottom: 6,
  },
  decisionExplainerText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.text,
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
    textAlign: "center",
  },
  decisionLabelRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    overflow: "visible",
    zIndex: 50,
  },
  decisionInfoButton: {
    marginTop: -6,
    padding: 2,
    borderRadius: 999,
    ...(Platform.OS === "web" ? { cursor: "help" } : {}),
  },
  decisionLibraryHelpModalRoot: {
    flex: 1,
  },
  decisionLibraryHelpBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(49, 36, 71, 0.08)",
  },
  decisionLibraryTooltipModal: {
    position: "absolute",
    width: 280,
    maxWidth: "86%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.lightBorder,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    shadowColor: "#2f184f",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 18,
    zIndex: 120,
  },
  decisionLibraryTooltipTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.headerText,
    marginBottom: 4,
    textTransform: "none",
  },
  decisionLibraryTooltipText: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.text,
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
    backgroundColor: "#ffffff",
  },
  decisionDropdownWrapOpen: {
    zIndex: 40,
  },
  decisionDropdownWrapDisabled: {
    opacity: 0.55,
  },
  decisionDropdownLibrary: {
    width: 174,
    maxWidth: "100%",
  },
  decisionDropdownMode: {
    width: 156,
    maxWidth: "100%",
  },
  decisionDropdownNoteType: {
    width: 164,
    maxWidth: "100%",
  },
  decisionDropdownDepth: {
    width: 60,
  },
  decisionDropdownBranch: {
    width: 88,
    maxWidth: "100%",
  },
  decisionDropdownScheduleHour: {
    width: 120,
    maxWidth: "100%",
  },
  decisionDropdownTargetType: {
    width: 126,
    maxWidth: "100%",
  },
  decisionDropdownTargetValue: {
    width: 150,
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
  decisionDropdownDisabled: {
    backgroundColor: "#f4f1fb",
  },
  decisionDropdownValue: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: "600",
    color: colors.headerText,
  },
  decisionDropdownValueDisabled: {
    color: "#9b90c2",
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
  decisionDropdownModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  decisionDropdownMenu: {
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
    borderRadius: 4,
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
    gap: 8,
  },
  decisionSummaryTitleGroup: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  decisionSummaryText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "600",
  },
  decisionExpandAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  decisionExpandAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b21a8",
  },
  decisionStagedCompactLegend: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.muted,
    marginBottom: 8,
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
  decisionSectionHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
    flex: 1,
    paddingRight: 12,
  },
  decisionSectionHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 10,
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
  decisionSectionAction: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.border,
  },
  decisionSectionActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.headerText,
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
  decisionNodeCheckboxConditionalActive: {
    borderColor: "#d7a400",
    backgroundColor: "#ffe082",
  },
  decisionNodeCheckboxLabel: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  decisionNodeCheckboxConditionalLabel: {
    color: "#5f4700",
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
  decisionConditionalNote: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
    marginTop: -2,
    marginBottom: 8,
  },
  decisionChoiceBlock: {
    marginBottom: 8,
  },
  decisionChoiceLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.headerText,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  decisionChoiceHelper: {
    marginBottom: 8,
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
  },
  decisionChoiceList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  decisionChoiceChip: {
    backgroundColor: "#f7f3ff",
    borderWidth: 1,
    borderColor: colors.lightBorder,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
  },
  decisionChoiceChipActive: {
    backgroundColor: colors.topPurple,
    borderColor: colors.topPurple,
  },
  decisionChoiceChipText: {
    fontSize: 11,
    color: colors.text,
  },
  decisionChoiceChipTextActive: {
    color: "#ffffff",
    fontWeight: "700",
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
  decisionNodeFinalRow: {
    marginTop: 4,
    alignItems: "flex-start",
  },
  includeFinalToggle: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 4,
    backgroundColor: "#f4efff",
    borderWidth: 1,
    borderColor: "#d8c8fb",
  },
  includeFinalToggleActive: {
    backgroundColor: "#e6f6ea",
    borderColor: "#8dc8a1",
  },
  includeFinalToggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.headerText,
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
    borderRadius: 4,
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  decisionAssignButtonDisabled: {
    backgroundColor: "#b9abd9",
  },
  decisionAssignButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  decisionStagedPanel: {
    marginTop: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: "#fcfbff",
  },
  decisionStagedCard: {
    padding: 12,
    borderWidth: 1,
    borderColor: colors.lightBorder,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    marginBottom: 10,
  },
  decisionStagedCardCompact: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  decisionStagedCardTop: {
    marginBottom: 10,
    gap: 4,
  },
  decisionStagedCardTopCompact: {
    marginBottom: 6,
  },
  decisionStagedCompactLine: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    color: colors.headerText,
  },
  decisionStagedCompactQuestions: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.muted,
  },
  decisionStagedDetailsToggle: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "700",
    color: "#6b21a8",
  },
  decisionStagedQuestionScroll: {
    maxHeight: 140,
  },
  decisionStagedTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.headerText,
  },
  decisionStagedMeta: {
    fontSize: 12,
    color: colors.muted,
  },
  decisionStagedStats: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.headerText,
  },
  decisionStagedDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.headerText,
  },
  decisionStagedScheduleTag: {
    fontSize: 11,
    color: colors.muted,
    fontStyle: "italic",
  },
  decisionStagedLockedAt: {
    fontSize: 11,
    color: colors.muted,
  },
  decisionStagedQuestionList: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.lightBorder,
    gap: 8,
  },
  decisionStagedQuestionHeading: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: "#6b21a8",
  },
  decisionStagedQuestionItem: {
    gap: 2,
  },
  decisionStagedQuestionText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
    color: colors.headerText,
  },
  decisionStagedQuestionDetail: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.muted,
    paddingLeft: 8,
  },
  decisionStagedActionRow: {
    flexDirection: "row",
    gap: 8,
  },
  decisionStagedAction: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#f6f0ff",
  },
  decisionStagedActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.headerText,
  },
  decisionStagedDelete: {
    backgroundColor: "#fff3f1",
    borderColor: "#f1c3bd",
  },
  decisionStagedDeleteText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.red,
  },
  decisionStagedEmpty: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
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
  profileHead: {
    position: "relative",
    zIndex: 60,
    overflow: "visible",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: 12,
    position: "relative",
    zIndex: 60,
    overflow: "visible",
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
    overflow: "visible",
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
    borderRadius: 4,
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
    zIndex: 200,
    elevation: 20,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    maxHeight: 280,
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
    columnGap: 8,
    rowGap: 8,
    alignItems: "center",
  },
  quickActionButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#f7f4ff",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 0,
    minHeight: 32,
    justifyContent: "center",
  },
  quickActionButtonDisabled: {
    opacity: 0.55,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.headerText,
  },
  carePlanEditorSuccess: {
    fontSize: 12,
    lineHeight: 18,
    color: "#2d7a46",
    marginTop: 2,
  },
  carePlanEditorError: {
    fontSize: 12,
    lineHeight: 18,
    color: "#b33a3a",
    marginTop: 2,
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
  carePlanEditorLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.35,
    color: "#6f6290",
    marginBottom: 4,
  },
  carePlanEditorRowActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
    marginBottom: 8,
    alignItems: "center",
  },
  carePlanEditorActionButton: {
    borderWidth: 1,
    borderColor: "#d9cff0",
    backgroundColor: "#f7f4ff",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 0,
  },
  carePlanEditorDeleteButton: {
    borderColor: "#efc0c0",
    backgroundColor: "#fff5f5",
  },
  carePlanEditorActionText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.headerText,
  },
  carePlanEditorDeleteText: {
    color: "#a33b3b",
  },
  carePlanEditorInput: {
    minHeight: 40,
    borderWidth: 1,
    borderColor: "#d9cff0",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    lineHeight: 18,
    color: "#2d2144",
    marginBottom: 8,
  },
  carePlanEditorInputMultiline: {
    minHeight: 84,
    textAlignVertical: "top",
  },
  carePlanHeroEditorInput: {
    fontSize: 15,
  },
  carePlanEditorGroup: {
    marginBottom: 6,
  },
  carePlanEditorBlock: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#ece3fa",
  },
  carePlanEditorBlockTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.headerText,
    marginBottom: 8,
  },
  carePlanEditorTableInput: {
    marginBottom: 0,
    minHeight: 36,
    borderRadius: 6,
  },
  carePlanSourceEditorInput: {
    minHeight: 180,
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
  riskSeverityIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 999,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
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
  documentationGuide: {
    rowGap: 12,
  },
  documentationGuideIntro: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
  },
  documentationGuideSection: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: docuWraiteColors.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    rowGap: 10,
  },
  documentationGuideSectionExpanded: {
    backgroundColor: "#f4f0ff",
  },
  documentationGuideSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: 10,
  },
  documentationGuideSectionTextWrap: {
    flex: 1,
    rowGap: 3,
  },
  documentationGuideSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.headerText,
  },
  documentationGuideSectionSummary: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
  },
  documentationGuideSteps: {
    rowGap: 8,
  },
  documentationGuideStepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    columnGap: 10,
  },
  documentationGuideStepIndex: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.headerText,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  documentationGuideStepIndexText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },
  documentationGuideStepText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: colors.text,
  },
  documentationGuidePdfBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.rowBorder,
    paddingTop: 12,
    rowGap: 10,
  },
  documentationGuidePdfTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: colors.placeholder,
  },
  pdfList: {
    rowGap: 10,
  },
  pdfRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  pdfItem: {
    fontSize: 13,
    fontWeight: "600",
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
    backgroundColor: docuWraiteColors.surfaceAccent,
    borderWidth: 1,
    borderColor: docuWraiteColors.border,
    paddingTop: 4,
    paddingBottom: 6,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: docuWraiteColors.primary,
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
    color: docuWraiteColors.textStrong,
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
    backgroundColor: docuWraiteColors.surfaceAccent,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: docuWraiteColors.border,
    transform: [{ rotate: "45deg" }],
  },
  docuWraiteCard: {
    width: 248,
    marginTop: 6,
    borderWidth: 1,
    borderColor: docuWraiteColors.border,
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
    borderColor: docuWraiteColors.border,
    borderRadius: 8,
    backgroundColor: docuWraiteColors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 4,
  },
  docuWraiteAssistModalRoot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  docuWraiteAssistModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(32, 23, 56, 0.28)",
  },
  docuWraiteAssistModalSheet: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "88%",
    zIndex: 1,
  },
  docuWraiteAssistDock: {
    width: "100%",
    maxWidth: 300,
    marginTop: 2,
    alignSelf: "flex-end",
  },
  docuWraiteWorkflowCard: {
    width: "100%",
    maxHeight: 640,
    borderWidth: 1,
    borderColor: docuWraiteColors.border,
    borderRadius: 10,
    backgroundColor: docuWraiteColors.surface,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 5,
  },
  docuWraiteWorkflowCardScroll: {
    maxHeight: 572,
  },
  docuWraiteWorkflowCardScrollCompact: {
    maxHeight: 420,
  },
  docuWraiteWorkflowCardScrollContent: {
    rowGap: 2,
    paddingBottom: 4,
  },
  docuWraiteWorkflowEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: docuWraiteColors.primary,
    marginBottom: 6,
  },
  docuWraiteWorkflowProgress: {
    fontSize: 11,
    fontWeight: "600",
    color: docuWraiteColors.primaryMuted,
    marginBottom: 4,
  },
  docuWraiteWorkflowMetaLine: {
    fontSize: 11,
    color: docuWraiteColors.primaryMuted,
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
    color: docuWraiteColors.primary,
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
    borderColor: docuWraiteColors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: docuWraiteColors.surface,
    alignItems: "center",
  },
  docuWraiteWorkflowChoiceActive: {
    backgroundColor: docuWraiteColors.primary,
    borderColor: docuWraiteColors.primary,
  },
  docuWraiteWorkflowChoiceText: {
    fontSize: 13,
    fontWeight: "700",
    color: docuWraiteColors.textStrong,
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
    alignSelf: "stretch",
    width: "100%",
    borderWidth: 1,
    borderColor: docuWraiteColors.borderSoft,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: docuWraiteColors.surface,
  },
  docuWraiteWorkflowSuggestionActive: {
    borderColor: docuWraiteColors.primary,
    backgroundColor: docuWraiteColors.surfaceAccent,
  },
  docuWraiteWorkflowSuggestionText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#4b3d66",
    flexShrink: 1,
  },
  docuWraiteWorkflowSuggestionTextActive: {
    color: docuWraiteColors.textStrong,
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
    borderColor: docuWraiteColors.borderSoft,
    borderRadius: 6,
    backgroundColor: docuWraiteColors.surface,
    paddingHorizontal: 10,
    paddingVertical: 8,
    rowGap: 4,
  },
  docuWraiteWorkflowContextItem: {
    fontSize: 12,
    lineHeight: 18,
    color: docuWraiteColors.primaryMuted,
  },
  docuWraiteWorkflowNext: {
    alignSelf: "flex-start",
    marginTop: 6,
    backgroundColor: docuWraiteColors.primary,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  docuWraiteWorkflowNextDisabled: {
    opacity: 0.45,
  },
  docuWraiteDraftContextToastRoot: {
    flex: 1,
    width: "100%",
    height: "100%",
    zIndex: 10000,
    elevation: 32,
    ...(Platform.OS === "web"
      ? {
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }
      : {}),
  },
  docuWraiteDraftContextToastBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 12, 36, 0.42)",
    zIndex: 1,
  },
  docuWraiteDraftContextToastCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
    zIndex: 2,
  },
  docuWraiteDraftContextToastCard: {
    width: "100%",
    maxWidth: 360,
    alignSelf: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: docuWraiteColors.border,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    shadowColor: "#2f184f",
    shadowOpacity: 0.32,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 30,
  },
  docuWraiteDraftContextQuestionBody: {
    rowGap: 8,
  },
  docuWraiteDraftContextQuestionTextInput: {
    minHeight: 56,
    maxHeight: 96,
    borderWidth: 1,
    borderColor: docuWraiteColors.border,
    borderRadius: 6,
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    lineHeight: 20,
    color: "#1a1a1a",
  },
  docuWraiteDraftContextQuestionOptionsScroll: {
    maxHeight: 200,
  },
  docuWraiteDraftContextQuestionOptionsContent: {
    rowGap: 6,
    paddingBottom: 2,
  },
  docuWraiteDraftContextQuestionInlineCard: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: docuWraiteColors.border,
    backgroundColor: docuWraiteColors.surface,
    width: "100%",
  },
  docuWraiteDraftContextInlineExpand: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
  },
  docuWraiteDraftContextInlineExpandText: {
    fontSize: 11,
    fontWeight: "700",
    color: docuWraiteColors.primary,
  },
  docuWraiteDraftContextQuestionsInlineMeta: {
    fontSize: 11,
    lineHeight: 16,
    color: "#6b5c80",
    marginTop: 4,
  },
  docuWraiteDraftContextToastTitleWrap: {
    flex: 1,
    rowGap: 2,
    paddingRight: 8,
  },
  docuWraiteDraftContextModalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    columnGap: 8,
    marginBottom: 4,
  },
  docuWraiteDraftContextModalClose: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
  },
  docuWraiteDraftContextModalCloseText: {
    fontSize: 16,
    lineHeight: 18,
    color: "#6b5c80",
    fontWeight: "700",
  },
  docuWraiteDraftContextModalScrollContent: {
    rowGap: 8,
    paddingBottom: 4,
  },
  docuWraiteDraftContextQuestionsHeading: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4b3d66",
    marginBottom: 4,
  },
  docuWraiteDraftContextQuestionsHint: {
    fontSize: 12,
    lineHeight: 18,
    color: "#6b5c80",
    marginBottom: 10,
  },
  docuWraiteDraftContextQuestionsSource: {
    fontSize: 11,
    fontWeight: "600",
    color: docuWraiteColors.primary,
    marginBottom: 4,
  },
  docuWraiteDraftContextQuestionsPrompt: {
    fontSize: 14,
    lineHeight: 20,
    color: "#2d1f45",
    marginBottom: 10,
  },
  docuWraiteDraftContextQuestionsDone: {
    fontSize: 13,
    color: "#3d7a4a",
    lineHeight: 18,
  },
  docuWraiteWorkflowNextText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  docuWraiteWorkflowRationale: {
    fontSize: 12,
    lineHeight: 18,
    color: docuWraiteColors.primaryMuted,
    marginBottom: 8,
  },
  docuWraiteWorkflowWhyBox: {
    borderWidth: 1,
    borderColor: docuWraiteColors.borderSoft,
    borderRadius: 8,
    backgroundColor: docuWraiteColors.surface,
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
    color: docuWraiteColors.textStrong,
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
  docuWraiteWorkflowDraftLead: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
    marginBottom: 10,
  },
  docuWraiteDraftToggleBox: {
    marginBottom: 12,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: docuWraiteColors.border,
    backgroundColor: docuWraiteColors.surface,
    gap: 6,
  },
  docuWraiteDraftToggleHeading: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.35,
    textTransform: "uppercase",
    color: "#6b21a8",
  },
  docuWraiteDraftTogglePrimaryRow: {
    width: "100%",
  },
  docuWraiteDraftToggleGridRow: {
    flexDirection: "column",
    gap: 6,
  },
  docuWraiteDraftToggleGridCell: {
    width: "100%",
    maxWidth: "100%",
  },
  docuWraiteDraftToggleChip: {
    minHeight: 52,
    paddingHorizontal: 7,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: docuWraiteColors.borderSoft,
    backgroundColor: "#ffffff",
  },
  docuWraiteDraftToggleChipActive: {
    borderColor: docuWraiteColors.primary,
    backgroundColor: docuWraiteColors.surfaceAccent,
  },
  docuWraiteDraftToggleChipLocked: {
    borderColor: docuWraiteColors.border,
    backgroundColor: docuWraiteColors.surfaceAccent,
  },
  docuWraiteDraftToggleChipTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  docuWraiteDraftToggleChipLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.headerText,
  },
  docuWraiteDraftToggleChipLabelActive: {
    color: docuWraiteColors.textStrong,
  },
  docuWraiteDraftToggleChipOn: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.4,
    color: docuWraiteColors.primary,
  },
  docuWraiteDraftToggleChipPreview: {
    fontSize: 9,
    lineHeight: 12,
    color: colors.muted,
  },
  docuWraiteDraftToggleChipWarn: {
    marginTop: 2,
    fontSize: 8,
    lineHeight: 11,
    color: "#b45309",
    fontWeight: "600",
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
  docuWraiteWorkflowGuidelineWarningBox: {
    marginTop: 2,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f2c47d",
    backgroundColor: "#fff7e8",
    rowGap: 8,
  },
  docuWraiteWorkflowGuidelineWarningText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#8a5a00",
  },
  docuWraiteWorkflowGuidelineWarningActions: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
  },
  docuWraiteWorkflowFollowUpBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: docuWraiteColors.border,
    backgroundColor: docuWraiteColors.surface,
  },
  docuWraiteWorkflowFollowUpLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: docuWraiteColors.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  docuWraiteWorkflowFollowUpQuestion: {
    fontSize: 14,
    lineHeight: 20,
    color: "#2d1f45",
    marginBottom: 8,
  },
  docuWraiteWorkflowFollowUpInput: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: docuWraiteColors.border,
    borderRadius: 6,
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    lineHeight: 20,
    color: "#1a1a1a",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: docuWraiteColors.borderSoft,
  },
  docuWraiteWorkflowBack: {
    fontSize: 12,
    fontWeight: "600",
    color: docuWraiteColors.textStrong,
    textDecorationLine: "underline",
  },
  docuWraiteWorkflowDismiss: {
    fontSize: 12,
    fontWeight: "600",
    color: docuWraiteColors.primaryMuted,
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
    backgroundColor: docuWraiteColors.primary,
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
    borderColor: docuWraiteColors.border,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: docuWraiteColors.surface,
  },
  docuWraiteCardSecondaryText: {
    fontSize: 12,
    fontWeight: "600",
    color: docuWraiteColors.textStrong,
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
    borderColor: docuWraiteColors.border,
    backgroundColor: docuWraiteColors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  docHandoverVitalChipActive: {
    backgroundColor: docuWraiteColors.surfaceAccent,
    borderColor: docuWraiteColors.primary,
  },
  docHandoverVitalChipText: {
    fontSize: 13,
    color: docuWraiteColors.textStrong,
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
    color: docuWraiteColors.textStrong,
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
  intelDetailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
  },
  intelDetailBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    flexShrink: 0,
  },
  intelDetailTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  intelDetailTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  intelDetailTitle: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: colors.text,
  },
  intelDetailMetaChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#f6f0ff",
    borderWidth: 1,
    borderColor: colors.rowBorder,
    flexShrink: 0,
  },
  intelDetailMetaText: {
    fontSize: 11,
    fontWeight: "700",
  },
  intelDetailSubtle: {
    marginTop: 4,
    fontSize: 11,
    color: colors.placeholder,
  },
  intelGroup: {
    marginBottom: 14,
  },
  intelGroupLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.placeholder,
    marginBottom: 10,
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
