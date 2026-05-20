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
  formatClientNameLastFirstInitials,
  getClientById,
  getMaryBetProfile,
  getMarkBrentProfile,
  searchClients,
} from "./clientProfiles";
import { getShiftIntelligenceRuntime, mergeResolvedClientProfile } from "./shiftIntelligence";
import {
  BRANCHING_FOLLOW_UP_BRANCHES,
  decisionNoteTypeMatches,
  getBranchingFollowUpNodes,
  getDefaultTargetTypeForNoteType,
  getNodeAssignmentStatus,
  getNoteTypeSelectionGuidance,
  getNoteTypeTemplateHint,
  getRecommendedNoteTypeForTarget,
  getSectionAssignRule,
  getSectionAssignmentStatus,
  resolveDecisionNoteType,
} from "./decisionAlgo/noteTypeRegistry";
import {
  ASSIGNMENT_SCOPE_FULL,
  ASSIGNMENT_SCOPE_TARGET,
  buildAssignmentContract,
  buildAssignmentTargetContext,
  collectNodeKeysOnOtherTimeBlocks,
  extractCrossSystemsFromClientProfile,
  filterNodesForAssignmentTarget,
  getAssignmentScopeHint,
  resolveNodesForAssignmentScope,
} from "./decisionAlgo/decisionAssignmentScope";
import { SMART_SELECT_PRESETS, buildSmartSelection } from "./decisionAlgo/smartSelection";
import {
  WORKFLOW_SCHEDULE_OPTIONS,
  getCategoriesForWorkflow,
  groupNodesByDocumentationCategory,
} from "./decisionAlgo/workflowCatalog";
const { composeDecisionRuntime } = require("./decisionAlgo/runtimeComposer");

const decisionNodes = require("./decisionAlgo/nodes.json");
const dspIntakeSchema = require("./decisionAlgo/dspIntakeSchema.json");
const adlInputSection = require("./decisionAlgo/adlInputSection.json");
const behavioralInputSection = require("./decisionAlgo/behavioralInputSection.json");
const behavioralRuntimeMap = require("./decisionAlgo/behavioralRuntimeMap.json");
const iadlInputSection = require("./decisionAlgo/iadlInputSection.json");
const iadlRuntimeMap = require("./decisionAlgo/iadlRuntimeMap.json");
const medicationInputSection = require("./decisionAlgo/medicationInputSection.json");
const medicationRuntimeMap = require("./decisionAlgo/medicationRuntimeMap.json");
const mealSupportInputSection = require("./decisionAlgo/mealSupportInputSection.json");
const mealSupportRuntimeMap = require("./decisionAlgo/mealSupportRuntimeMap.json");
const communicationInputSection = require("./decisionAlgo/communicationInputSection.json");
const communicationRuntimeMap = require("./decisionAlgo/communicationRuntimeMap.json");
const communityInputSection = require("./decisionAlgo/communityInputSection.json");
const communityRuntimeMap = require("./decisionAlgo/communityRuntimeMap.json");
const healthSafetyInputSection = require("./decisionAlgo/healthSafetyInputSection.json");
const healthSafetyRuntimeMap = require("./decisionAlgo/healthSafetyRuntimeMap.json");
const sleepSupportInputSection = require("./decisionAlgo/sleepSupportInputSection.json");
const sleepSupportRuntimeMap = require("./decisionAlgo/sleepSupportRuntimeMap.json");
const safetyMonitoringInputSection = require("./decisionAlgo/safetyMonitoringInputSection.json");
const safetyMonitoringRuntimeMap = require("./decisionAlgo/safetyMonitoringRuntimeMap.json");
const mobilityInputSection = require("./decisionAlgo/mobilityInputSection.json");
const mobilityRuntimeMap = require("./decisionAlgo/mobilityRuntimeMap.json");
const documentationCoordinationInputSection = require("./decisionAlgo/documentationCoordinationInputSection.json");
const documentationCoordinationRuntimeMap = require("./decisionAlgo/documentationCoordinationRuntimeMap.json");
const moduleCatalog = require("./decisionAlgo/moduleCatalog.json");
const ruleMappingTable = require("./decisionAlgo/ruleMappingTable.json");
const noteOutputTemplate = require("./decisionAlgo/noteOutputTemplate.json");
const bPhaganBathingContext = require("./AILogic/clientContexts/BPhagan.bathingContext.json");
const bPhaganDressingContext = require("./AILogic/clientContexts/BPhagan.dressingContext.json");
const bPhaganGroomingContext = require("./AILogic/clientContexts/BPhagan.groomingContext.json");
const bPhaganHygieneContext = require("./AILogic/clientContexts/BPhagan.hygieneContext.json");
const bPhaganToiletingContext = require("./AILogic/clientContexts/BPhagan.toiletingContext.json");
const bPhaganTransfersContext = require("./AILogic/clientContexts/BPhagan.transfersContext.json");
const { resolveAiLogicPath, aiLogicExists } = require("./AILogic/engine/aiLogicResolver");
const { loadAiLogic } = require("./AILogic/engine/aiLogicLoader");
const { evaluateAiSafety } = require("./AILogic/engine/aiSafetyEngine");
const { buildAiSystemPrompt, buildAiUserPrompt } = require("./AILogic/engine/aiPromptBuilder");

const WORKFLOW_INPUT_SECTION_CONFIGS = {
  behavioral: behavioralInputSection,
  adl: adlInputSection,
  iadl: iadlInputSection,
  medication: medicationInputSection,
  "meal-support": mealSupportInputSection,
  communication: communicationInputSection,
  community: communityInputSection,
  "health-safety": healthSafetyInputSection,
  "sleep-support": sleepSupportInputSection,
  "safety-monitoring": safetyMonitoringInputSection,
  mobility: mobilityInputSection,
  "documentation-coordination": documentationCoordinationInputSection,
};

const WORKFLOW_RUNTIME_MAPS = {
  behavioral: behavioralRuntimeMap,
  iadl: iadlRuntimeMap,
  medication: medicationRuntimeMap,
  "meal-support": mealSupportRuntimeMap,
  communication: communicationRuntimeMap,
  community: communityRuntimeMap,
  "health-safety": healthSafetyRuntimeMap,
  "sleep-support": sleepSupportRuntimeMap,
  "safety-monitoring": safetyMonitoringRuntimeMap,
  mobility: mobilityRuntimeMap,
  "documentation-coordination": documentationCoordinationRuntimeMap,
};

const aiLogicCache = new Map();
const CLIENT_WORKFLOW_CONTEXT_MAP = [
  {
    workflowTag: "#bathing",
    clientNames: ["barbara c phagan", "phagan b", "phagan, b.", "barbara phagan"],
    context: bPhaganBathingContext,
  },
  {
    workflowTag: "#dressing",
    clientNames: ["barbara c phagan", "phagan b", "phagan, b.", "barbara phagan"],
    context: bPhaganDressingContext,
  },
  {
    workflowTag: "#grooming",
    clientNames: ["barbara c phagan", "phagan b", "phagan, b.", "barbara phagan"],
    context: bPhaganGroomingContext,
  },
  {
    workflowTag: "#hygiene",
    clientNames: ["barbara c phagan", "phagan b", "phagan, b.", "barbara phagan"],
    context: bPhaganHygieneContext,
  },
  {
    workflowTag: "#toileting",
    clientNames: ["barbara c phagan", "phagan b", "phagan, b.", "barbara phagan"],
    context: bPhaganToiletingContext,
  },
  {
    workflowTag: "#transfers",
    clientNames: ["barbara c phagan", "phagan b", "phagan, b.", "barbara phagan"],
    context: bPhaganTransfersContext,
  },
];

const ADL_GUIDED_TASK_OPTIONS = [
  { value: "bathing", label: "Bathing" },
  { value: "toileting", label: "Toileting" },
  { value: "dressing", label: "Dressing" },
  { value: "grooming", label: "Grooming" },
  { value: "hygiene", label: "Hygiene" },
  { value: "transfers", label: "Transfers" },
];

const ADL_GUIDED_OUTCOME_OPTIONS = [
  { value: "completed", label: "Completed" },
  { value: "partially_completed", label: "Partially completed" },
  { value: "refused", label: "Refused" },
  { value: "not_needed", label: "Not needed" },
  { value: "safety_prevented_completion", label: "Safety prevented completion" },
];

const ADL_GUIDED_ASSISTANCE_OPTIONS = [
  { value: "independent", label: "Independent" },
  { value: "verbal_prompt", label: "Verbal prompt" },
  { value: "partial_assist", label: "Partial assist" },
  { value: "full_assist", label: "Full assist" },
];

const ADL_GUIDED_ENGAGEMENT_OPTIONS = [
  { value: "engaged", label: "Engaged" },
  { value: "hesitant", label: "Hesitant" },
  { value: "distracted", label: "Distracted" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "re_engaged", label: "Re-engaged" },
];

const ADL_GUIDED_RISK_OPTIONS = [
  { value: "fall_risk", label: "Fall risk" },
  { value: "skin_breakdown_risk", label: "Skin breakdown risk" },
  { value: "aggression_risk", label: "Aggression risk" },
  { value: "environmental_hazard", label: "Environmental hazard" },
];

function uniqueValues(values = []) {
  return [...new Set((values || []).filter(Boolean))];
}

function getPromptTemplateText(template) {
  if (typeof template === "string") {
    return template.trim();
  }
  return String(template?.prompt_text || template?.promptText || template?.text || "").trim();
}

function rankPromptTemplates(templates = [], draftText = "", categoryKey = "") {
  const normalizedDraft = normalizeInferenceText(draftText);
  const draftTokens = normalizedDraft.split(" ").filter((token) => token.length > 1);
  const categoryTokensByKey = {
    adl: ["toileting", "toilet", "bath", "bathing", "shower", "dress", "dressing", "groom", "grooming", "hygiene", "transfer", "mobility", "prompt", "assist", "response", "safety"],
    behavioral: ["behavior", "redirection", "response", "support"],
    communication: ["communication", "hearing", "prompt", "cueing", "response"],
    medication: ["medication", "oxygen", "timing", "prompt", "response"],
    meal: ["meal", "fluids", "aspiration", "response"],
    safety: ["safety", "monitoring", "fall", "observation", "response"],
    community: ["community", "outing", "mobility", "response"],
    sleep: ["sleep", "night", "bedtime", "toileting", "monitoring"],
  };
  const categoryTokens = categoryTokensByKey[categoryKey] || [];

  const scored = templates
    .map((template, index) => {
      const text = getPromptTemplateText(template);
      const normalizedText = normalizeInferenceText(text);
      if (!text) {
        return null;
      }

      const tokenMatches = draftTokens.filter((token) => normalizedText.includes(token)).length;
      const categoryMatches = categoryTokens.filter((token) => normalizedText.includes(token)).length;
      const startsWithDocument = normalizedText.startsWith("document ") ? 2 : 0;
      const score = tokenMatches * 4 + categoryMatches + startsWithDocument - index * 0.01;

      return { text, score };
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score);

  return uniqueValues(scored.map((item) => item.text)).slice(0, 5);
}

function buildModuleCatalogById() {
  return Object.fromEntries((moduleCatalog.modules || []).map((item) => [item.moduleId, item]));
}

const moduleCatalogById = buildModuleCatalogById();

function matchRuleExpression(expression = "", activeTokens = []) {
  const normalized = String(expression || "").trim();
  if (!normalized) {
    return false;
  }
  const requiredTokens = normalized
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);
  return requiredTokens.every((token) => activeTokens.includes(token));
}

function collectActivatedModuleIds({ activeTokens = [], runtimeRuleMap = null, extraRuleMappings = [] } = {}) {
  const runtimeActivated = (runtimeRuleMap?.moduleRules || [])
    .filter((rule) => matchRuleExpression(rule.when, activeTokens))
    .flatMap((rule) => rule.activate || []);
  const mappedActivated = (extraRuleMappings || [])
    .filter((mapping) => matchRuleExpression(mapping.when, activeTokens))
    .flatMap((mapping) => mapping.activate || []);
  return uniqueValues([...runtimeActivated, ...mappedActivated]);
}

function getModuleObjects(moduleIds = []) {
  return uniqueValues(moduleIds).map((moduleId) => moduleCatalogById[moduleId]).filter(Boolean);
}

function buildInitialGuidedAdlPromptState() {
  return {
    task: "bathing",
    outcome: "completed",
    assistance: "",
    engagement: "",
    risks: [],
  };
}

function buildGuidedAdlPromptText({
  task = "",
  outcome = "",
  assistance = "",
  engagement = "",
  risks = [],
} = {}) {
  const taskLabel =
    ADL_GUIDED_TASK_OPTIONS.find((option) => option.value === task)?.label?.toLowerCase() || "ADL support";
  const parts = [`Document ${taskLabel} support`];

  if (assistance) {
    const assistanceLabel =
      ADL_GUIDED_ASSISTANCE_OPTIONS.find((option) => option.value === assistance)?.label?.toLowerCase() ||
      assistance.replace(/_/g, " ");
    parts.push(`${assistanceLabel} provided`);
  }

  if (engagement) {
    const engagementLabel =
      ADL_GUIDED_ENGAGEMENT_OPTIONS.find((option) => option.value === engagement)?.label?.toLowerCase() ||
      engagement.replace(/_/g, " ");
    if (engagement === "hesitant" || engagement === "distracted" || engagement === "withdrawn") {
      parts.push(`${engagementLabel} engagement and re-engagement support`);
    } else {
      parts.push(`${engagementLabel} participation`);
    }
  }

  if (Array.isArray(risks) && risks.length) {
    const riskLabels = risks
      .map((risk) => ADL_GUIDED_RISK_OPTIONS.find((option) => option.value === risk)?.label?.toLowerCase() || risk.replace(/_/g, " "))
      .join(", ");
    parts.push(`${riskLabels} precautions`);
  }

  if (outcome) {
    const outcomeLabel =
      ADL_GUIDED_OUTCOME_OPTIONS.find((option) => option.value === outcome)?.label?.toLowerCase() ||
      outcome.replace(/_/g, " ");
    if (outcome === "completed" || outcome === "partially_completed") {
      parts.push(`how the person tolerated the task and ${outcomeLabel} status`);
    } else if (outcome === "refused") {
      parts.push("refusal response and follow-up");
    } else if (outcome === "safety_prevented_completion") {
      parts.push("why safety prevented completion");
    } else {
      parts.push(`${outcomeLabel} outcome`);
    }
  }

  return `${parts.join(", ")}.`;
}

const DECISION_LIBRARY_HELP = {
  aidraft: "AI draft rules for when notes are generated, what they must include, and which safety guardrails apply.",
  baseplan: "Core documentation questions that shape the base note structure.",
  branching: "Follow-up rules (refusal, fatigue, risk) — use Selective branch + Branch/Depth, not this library picker.",
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
  "Behavior Plan",
  "Care Plan",
  "Supervisor Setup",
  "Case Note",
  "Document Storage",
  "Drug Count",
  "General Event Reports (GER)",
  "Health Tracking",
  "Individual Plan",
  "Individual Plan Agenda",
];

const pdfs = ["Emergency Data Form", "Face Sheet", "Medical Information", "Glossary"];

const documentationHowToGuides = [
  {
    title: "How to start a note",
    summary: "Open the correct documentation block before writing.",
    steps: [
      "Confirm the correct individual, module, and time block.",
      "If the same time appears more than once, use the workflow label inside that time cell (for example Behavior or ADL) to pick the correct support entry.",
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
    title: "Decision Algo Glossary",
    summary: "Plain-English definitions for the main Decision Engine libraries and helpers.",
    steps: [
      "**Baseplan:** Core documentation questions for standard workflow sections like ADLs, meals, outings, behavior, medications, and night support.",
      "**Branching:** Follow-up and escalation questions for refusal, fatigue, risk and safety, protocol failure, and incidents.",
      "**Careplan:** Client-specific questions driven by the care plan, including risks, goals, supports, and interventions.",
      "**Runtime:** Live shift questions for overdue work, due tasks, handoff items, and other active conditions.",
      "**Readiness:** Completion and quality checks that decide whether documentation is clear, safe, and ready to draft or finalize.",
      "**PlaybookR:** The rulebook for how the engine should assemble, inject, branch, dedupe, order, and block questions.",
      "**AIDraft / IntelliDraft:** AI drafting rules for row notes, block summaries, final notes, handoff notes, and orders documentation.",
      "**Note Type Registry:** Mapping logic that decides which sections belong to block time, row note, final note, handover note, or orders.",
      "**Smart Selection:** Rule-based auto-selection presets like Essential, Default, Supervisor focus, and Complete.",
      "**Parse MD to Nodes:** The parser that converts markdown question libraries into structured runtime data.",
      "**Nodes JSON:** The compiled machine-readable output of the question libraries, not the authored source of truth.",
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
    summary: "Supervisors set up the DSP case-note timeline, rows, and workflow categories here.",
    steps: [
      "Open the Decision Engine module and define the timeline blocks and case-note rows the DSP will document.",
      "Schedule Builder can use the same time range more than once when the workflow is different, such as 8am-9am Behavior and 8am-9am ADL.",
      "Choose the workflow category for each block or row so DocuWraite opens the correct modal questions later.",
      "Review the descriptions and prompts so the DSP sees the right documentation context during the shift.",
    ],
  },
  {
    title: "How branch, depth, and sections work",
    summary: "Topic folders, question levels, and storyline lanes in the Decision Engine.",
    steps: [
      "Section is the topic folder in the question list (for example morning ADL, Row Note Draft, Protocol Failure Branching). It groups related questions; it is not the same as Branch or Depth.",
      "Depth is how many levels down the tree you see. Depth 1 is the main question (node id letter a), depth 2 is the next level under it (b), depth 3 is under that (c), and so on — like main question, then children, then sub-children.",
      "The Depth control caps how far down the chain is included. Depth 3 shows the main question plus two levels of follow-ups; a lower depth shows only the opening layers.",
      "Branch is which class or lane you are on at those levels. In most libraries, branch 1 and branch 2 are parallel paths in the same section (for example a trigger path versus a content path). Baseplan can use branches 1 through 5 for different lanes inside a section.",
      "In Selective branch mode, Branch means one of five escalation classes only: Refusal, Fatigue, Risk and safety, Protocol failure, Incident or emergency. Those five are the full set for that branching guide; there is no sixth class unless the guide is extended.",
      "Full branch mode shows every question in the library for the selected note type. Selective branch mode narrows the main library by branch and depth and adds matching follow-up questions from the branching guide for the class you picked.",
      "Use Library and Note type for what you are documenting. Use Mode, Branch, and Depth when you want a focused slice instead of the whole library.",
    ],
  },
  {
    title: "Which libraries and depths each note type has",
    summary: "Not every library has every note type — pick the note type that matches what you are charting.",
    steps: [
      "The five note types are Block time, Row note, Final note, Handover note, and Orders. Note type controls which sections appear when you filter the Decision Engine list — it is not just a label.",
      "Block time is the fullest set: Baseplan sections A–J (morning ADL, outing, behavior, medication-support, and similar), plus Careplan, Runtime, Readiness, Playbook R, IntelliDraft block drafts, and branching follow-ups. Baseplan block-time questions can run up to depth 5; most other libraries use depths 1–3.",
      "Row note uses Baseplan section L (row-note-support), IntelliDraft row-note drafts, shared AI safety section E, and branching. It does not show the big Careplan or Runtime block-time libraries.",
      "Final note uses Baseplan section K (case-note-final), IntelliDraft final-case-note drafts, section E, and branching — typically depths 1–5 in Baseplan K and 1–3 elsewhere.",
      "Handover note uses Baseplan section M (handover-note-support), Runtime handoff section, IntelliDraft handoff drafts, section E, and branching.",
      "Orders uses Runtime medications and due health tasks, IntelliDraft orders and medication drafts, section E, and branching. Baseplan medication-support (section I) is Block time only, not Orders — do not expect orders questions under Baseplan.",
      "Branching (Refusal through Incident) is available for all five note types in Selective branch mode. The Depth dropdown caps how many levels you see; it does not auto-add every child question — you still check each question you want, then Final Assign. The purple bubble on Scores/Comments asks only what you assigned to that block or row.",
    ],
  },
  {
    title: "Which note type to pick",
    summary: "Match note type to what you are assigning — block, row, or whole shift.",
    steps: [
      "Block time — timeline / time-block work (morning ADL, outing, behavior, feeding). Use Target: Time block. This is the default and the largest question set (Baseplan A–J, Careplan, Runtime, and more). If two block-time entries share the same hour range, the DSP page groups them under one time cell and labels each workflow separately.",
      "Row note — one DSP case-note row. Use Target: Case-note row and Note type Row note (the app sets this when you pick a row).",
      "Final note — end-of-shift final case note paragraph. Use once per shift (Baseplan K, IntelliDraft final). Target is usually a time block; assign only one final pack per case note.",
      "Handover note — next-shift handoff. Baseplan M, Runtime handoff, IntelliDraft handoff.",
      "Orders — MAR and medication documentation. Runtime + IntelliDraft orders — not Baseplan medication-support (that stays under Block time).",
      "Rule of thumb: pick Target first; Note type follows the row vs block. Use Smart select after Note type and Branch/Depth are set.",
    ],
  },
  {
    title: "How to assign questions (Workflow → Category → Depth)",
    summary: "Legacy assignment tooling for advanced admin use only.",
    steps: [
      "The current DSP note flow does not depend on manual assignment for supported categories.",
      "Use Schedule Builder and Row Builder to define block time, case-note rows, and workflow categories.",
      "Keep this section only if you still need advanced admin-only assignment experiments later.",
      "See decisionAlgo/documentationArchitecture.md for the full model.",
    ],
  },
  {
    title: "How to use Smart select (supervisor quick pick)",
    summary: "Legacy helper for advanced admin assignment only.",
    steps: [
      "Smart select is no longer required for the supervisor setup flow used by DSP note bubbles.",
      "The supported categories now open their question flow automatically from the row or block workflow.",
      "Keep Smart select only if you still need the advanced admin assignment library later.",
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

const AI_ASSISTANCE_SCORE_OPTIONS = [
  "Independent",
  "Standby assist",
  "Supervision only",
  "Verbal prompt",
  "Visual prompt",
  "Redirection required",
  "Partial assist",
  "Full assist",
  "Two-person assist",
  "Dependent",
  "Refused",
  "Not needed",
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

function groupTimeBlocksByLabel(blocks = []) {
  const groups = [];
  const byLabel = new Map();

  blocks.forEach((block) => {
    const label = String(block?.label || "Unscheduled");
    if (!byLabel.has(label)) {
      const group = { label, blocks: [] };
      byLabel.set(label, group);
      groups.push(group);
    }
    byLabel.get(label).blocks.push(block);
  });

  return groups;
}

function timeBlockHasAssignedQuestions(assignments = [], blockId = "") {
  if (!blockId) {
    return false;
  }

  return assignments.some(
    (assignment) =>
      assignment?.target?.type === "time-block" &&
      String(assignment.target.targetId) === String(blockId) &&
      (Number(assignment.selectedCount) > 0 || (assignment.selectedNodesPayload || []).length > 0)
  );
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

function getCachedAiLogic(logicPath = "") {
  if (!logicPath) {
    return null;
  }
  if (aiLogicCache.has(logicPath)) {
    return aiLogicCache.get(logicPath);
  }
  const loaded = loadAiLogic(logicPath);
  aiLogicCache.set(logicPath, loaded);
  return loaded;
}

function normalizeLookupName(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getWorkflowTagForFieldContext(fieldContext = {}) {
  const explicit = String(fieldContext.workflowTag || "").trim();
  if (explicit) {
    return explicit.startsWith("#") ? explicit : `#${explicit}`;
  }

  const aiLogicTask = String(inferAiLogicSelection(fieldContext)?.task || "")
    .trim()
    .toLowerCase();
  if (aiLogicTask) {
    return `#${aiLogicTask}`;
  }

  return "";
}

function getDocumentationScoreConfig(fieldContext = {}) {
  const aiSelection = inferAiLogicSelection(fieldContext);
  if (aiSelection?.category === "ADL") {
    return {
      placeholder: "Select Support Level",
      options: AI_ASSISTANCE_SCORE_OPTIONS,
    };
  }

  return {
    placeholder: "Select Score",
    options: supportLevelOptions,
  };
}

function resolveClientCarePlanContext({ workflowTag = "", clientProfile = null, activePatientName = "" } = {}) {
  const normalizedWorkflowTag = String(workflowTag || "").trim().toLowerCase();
  if (!normalizedWorkflowTag) {
    return null;
  }

  const candidateNames = [
    clientProfile?.displayName,
    clientProfile?.fullName,
    clientProfile?.name,
    activePatientName,
  ]
    .map((item) => normalizeLookupName(item))
    .filter(Boolean);

  return (
    CLIENT_WORKFLOW_CONTEXT_MAP.find(
      (entry) =>
        entry.workflowTag.toLowerCase() === normalizedWorkflowTag &&
        entry.clientNames.some((name) => candidateNames.includes(normalizeLookupName(name)))
    )?.context || null
  );
}

function attachClientCarePlanContext(fieldContext = {}, options = {}) {
  if (!fieldContext || typeof fieldContext !== "object") {
    return fieldContext;
  }

  if (fieldContext.carePlanContext) {
    return fieldContext;
  }

  const workflowTag = getWorkflowTagForFieldContext(fieldContext);
  if (!workflowTag) {
    return fieldContext;
  }

  const carePlanContext = resolveClientCarePlanContext({
    workflowTag,
    clientProfile: options.clientProfile || null,
    activePatientName: options.activePatientName || "",
  });

  if (!carePlanContext) {
    return {
      ...fieldContext,
      workflowTag,
    };
  }

  return {
    ...fieldContext,
    workflowTag,
    carePlanContext,
  };
}

function inferAiLogicSelection(fieldContext = {}) {
  const workflowId = String(fieldContext.baseWorkflowId || fieldContext.workflowId || "").trim();
  const haystack = normalizeInferenceText(
    [fieldContext.label, fieldContext.description, fieldContext.source, fieldContext.assignedNodeSummary]
      .filter(Boolean)
      .join(" ")
  );

  if (workflowId === "case-note-final") {
    return {
      category: "Final Case Note",
      task: "Summary",
    };
  }

  if (workflowId === "handover-note") {
    return {
      category: "Handover Note",
      task: "Shift Handoff",
    };
  }

  if (["adl", "morning-adl", "assigned-nodes", ""].includes(workflowId)) {
    const taskSignals = [
      {
        task: "Toileting",
        signals: ["toileting", "toilet", "brief change", "perineal care", "incontinence", "continence"],
      },
      {
        task: "Bathing",
        signals: ["bathing", "bath", "shower", "tub bath", "bath setup"],
      },
      {
        task: "Dressing",
        signals: ["dressing", "dress", "clothing", "fastener", "shirt", "pants"],
      },
      {
        task: "Grooming",
        signals: ["grooming", "groom", "hair care", "shaving", "nail care"],
      },
      {
        task: "Hygiene",
        signals: ["hygiene", "wash up", "clean up", "handwashing", "oral hygiene", "deodorant"],
      },
      {
        task: "Transfers",
        signals: ["transfers", "transfer", "bed to chair", "chair to toilet", "standing transfer"],
      },
    ];

    for (const candidate of taskSignals) {
      if (candidate.signals.some((signal) => haystack.includes(normalizeInferenceText(signal)))) {
        return {
          category: "ADL",
          task: candidate.task,
        };
      }
    }
  }

  return null;
}

function mapAiLogicQuestionToWorkflowStep(question = {}, logic = null) {
  const questionType = String(question.type || "").trim().toLowerCase();
  const isMultiSelect = questionType === "multi_select";
  const isFreeText = questionType === "free_text";

  return {
    stepKey: question.id,
    kind: isFreeText ? "input" : "suggestions",
    question: question.label || question.id,
    suggestions: isFreeText ? [] : (question.options || []).map((option) => String(option)),
    multiSelect: isMultiSelect,
    allowCustom: false,
    requiredWhen: question.requiredWhen || null,
    requiredWhenIncludes: question.requiredWhenIncludes || null,
    rationale: isFreeText
      ? "Provide the specific detail needed for this documentation path."
      : "Answer within the configured care-documentation options for this workflow.",
    sourceAiLogicPath: logic?.path || "",
    sourceAiLogicWorkflowId: logic?.raw?.workflowId || "",
    sourceAiLogicTask: logic?.meta?.task || "",
  };
}

function buildAiLogicWorkflowBundle(fieldContext = {}) {
  const selection = inferAiLogicSelection(fieldContext);
  if (!selection) {
    return null;
  }

  const logicPath = resolveAiLogicPath({
    category: selection.category,
    task: selection.task,
    workflowId: fieldContext.workflowId,
    fieldContext,
  });
  if (!logicPath || !aiLogicExists(logicPath)) {
    return null;
  }

  try {
    const logic = getCachedAiLogic(logicPath);
    const sequence = logic?.rules?.sequence || [];
    const questionsById = logic?.rules?.questionsById || {};
    const steps = sequence
      .map((questionId) => questionsById[questionId])
      .filter(Boolean)
      .map((question) => mapAiLogicQuestionToWorkflowStep(question, logic));

    if (!steps.length) {
      return null;
    }

    return {
      category: selection.category,
      task: selection.task,
      logic,
      steps: [
        ...steps,
        {
          stepKey: "assigned-nodes-draft",
          kind: "draft",
          question: "Review and generate note",
          sourceAiLogicPath: logic.path,
        },
      ],
    };
  } catch (error) {
    console.warn("Failed to load AI logic bundle", error);
    return null;
  }
}

function includesWorkflowSelection(answerValue, targetValue) {
  if (Array.isArray(answerValue)) {
    return answerValue.includes(targetValue);
  }
  return answerValue === targetValue;
}

function shouldPresentLocalWorkflowStep(step = {}, answers = {}) {
  if (!step || !step.stepKey || ["draft", "affirm", "readiness", "why", "context-action"].includes(step.kind)) {
    return true;
  }

  if (step.requiredWhen) {
    return getWorkflowAnswer(answers, step.requiredWhen.questionId || "") === step.requiredWhen.equals;
  }

  if (step.requiredWhenIncludes) {
    return includesWorkflowSelection(
      getWorkflowAnswer(answers, step.requiredWhenIncludes.questionId || ""),
      step.requiredWhenIncludes.value
    );
  }

  return true;
}

function getNextVisibleLocalWorkflowStepIndex(localSteps = [], answers = {}, startIndex = 0, direction = 1) {
  if (!localSteps.length) {
    return 0;
  }

  if (direction < 0) {
    for (let index = Math.min(startIndex, localSteps.length - 1); index >= 0; index -= 1) {
      if (shouldPresentLocalWorkflowStep(localSteps[index], answers)) {
        return index;
      }
    }
    return 0;
  }

  for (let index = Math.max(startIndex, 0); index < localSteps.length; index += 1) {
    if (shouldPresentLocalWorkflowStep(localSteps[index], answers)) {
      return index;
    }
  }

  return Math.max(localSteps.length - 1, 0);
}

function buildAiLogicDraftPayload(workflowSnapshot = {}, shiftContext = {}) {
  const aiLogicPath = (workflowSnapshot.localSteps || []).find((step) => step?.sourceAiLogicPath)?.sourceAiLogicPath || "";
  if (!aiLogicPath) {
    return null;
  }

  const logic = getCachedAiLogic(aiLogicPath);
  const answers = workflowSnapshot.answers || {};
  const safety = evaluateAiSafety(logic, answers);
  const carePlan = workflowSnapshot.fieldContext?.carePlanContext || {};

  return {
    logicPath: aiLogicPath,
    workflowId: logic?.raw?.workflowId || "",
    safety,
    systemPrompt: buildAiSystemPrompt(logic, safety),
    userPrompt: buildAiUserPrompt(logic, answers, carePlan, shiftContext, safety),
  };
}

function getAssignedWorkflowStepsForField(fieldContext = {}) {
  if (fieldContext.assignedWorkflowSteps?.length) {
    return fieldContext.assignedWorkflowSteps;
  }
  const aiLogicBundle = buildAiLogicWorkflowBundle(fieldContext);
  if (aiLogicBundle?.steps?.length) {
    return aiLogicBundle.steps;
  }
  if (fieldContext.workflowId === "case-note-final") {
    return buildCaseNoteFinalWorkflowSteps();
  }
  if (fieldContext.workflowId === "handover-note") {
    return buildHandoverWorkflowSteps();
  }
  if (fieldContext.workflowId) {
    const configDrivenSteps = buildConfigDrivenRowWorkflowSteps(fieldContext.workflowId);
    if (configDrivenSteps.length) {
      return configDrivenSteps;
    }
  }
  return createAssignedWorkflowSteps(fieldContext.assignedNodes || []);
}

function buildPrecomputedAssignedWorkflowSteps(fieldContext = {}) {
  const aiLogicBundle = buildAiLogicWorkflowBundle(fieldContext);
  if (aiLogicBundle?.steps?.length) {
    return aiLogicBundle.steps;
  }

  const configWorkflowId = String(fieldContext.baseWorkflowId || fieldContext.workflowId || "").trim();
  if (configWorkflowId) {
    const configDrivenSteps = buildConfigDrivenRowWorkflowSteps(configWorkflowId);
    if (configDrivenSteps.length) {
      return configDrivenSteps;
    }
  }

  return createAssignedWorkflowSteps(fieldContext.assignedNodes || []);
}

function workflowStepsContainAiLogic(steps = []) {
  return steps.some((step) => Boolean(step?.sourceAiLogicPath));
}

function areWorkflowStepsEquivalent(leftSteps = [], rightSteps = []) {
  if (leftSteps.length !== rightSteps.length) {
    return false;
  }

  return leftSteps.every((leftStep, index) => {
    const rightStep = rightSteps[index] || {};
    return (
      String(leftStep?.stepKey || "") === String(rightStep?.stepKey || "") &&
      String(leftStep?.kind || "") === String(rightStep?.kind || "") &&
      String(leftStep?.question || "") === String(rightStep?.question || "") &&
      String(leftStep?.sourceAiLogicPath || "") === String(rightStep?.sourceAiLogicPath || "")
    );
  });
}

function fieldHasAssignedDecisionWorkflow(fieldContext = {}) {
  if ((fieldContext.assignedNodes || []).length) {
    return true;
  }

  const steps = getAssignedWorkflowStepsForField(fieldContext);
  return steps.some((step) => step.kind !== "draft");
}

function getTimeBlockWorkflowTagLabel(blockOrLabel = {}, workflowOptions = []) {
  const workflowId =
    typeof blockOrLabel === "object"
      ? String(blockOrLabel?.workflowId || "").trim()
      : "";
  if (!workflowId) {
    return "";
  }
  return workflowOptions.find((option) => option.workflowId === workflowId)?.label || "";
}

function buildTimeBlockAssignmentTargetLabel(block = {}, workflowOptions = []) {
  const baseLabel = getTimeBlockLabelValue(block) || block.label || "Time block";
  const workflowTag = getTimeBlockWorkflowTagLabel(block, workflowOptions);
  return workflowTag ? `${baseLabel} · ${workflowTag}` : baseLabel;
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
    case "adl":
      return "ADL";
    case "morning-adl":
      return "ADL";
    case "mobility":
      return "Mobility";
    case "iadl":
      return "IADL";
    case "feeding-support":
      return "Meal Support";
    case "in-home-leisure":
      return "Safety Monitoring";
    case "community":
      return "Community";
    case "community-outing":
      return "Community Outing";
    case "return-home":
      return "Return-home transition";
    case "behavior-support":
      return "Behavior Support";
    case "communication-support":
      return "Communication";
    case "medication-support":
      return "Medication";
    case "health-safety":
      return "Health and Safety";
    case "documentation-coordination":
      return "Documentation and Coordination";
    case "night-adl":
      return "Sleep Support";
    case "case-note-final":
      return "Final case note";
    case "handover-note":
      return "Handover note";
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

function titleCase(value = "") {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function getDecisionSectionFilterLabel(sectionKey = "") {
  const normalized = String(sectionKey || "").trim();
  if (!normalized) {
    return "Uncategorized";
  }

  return normalized.replace(/^[A-Z]\.\s+/, "");
}

function getDecisionNoteTypeKey(nodeOrSection = "", librarySlug = "") {
  return resolveDecisionNoteType(nodeOrSection, librarySlug);
}

function nodeMatchesDecisionNoteType(node, noteType, librarySlug = "") {
  return decisionNoteTypeMatches(node, noteType, librarySlug || node?.library);
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
      question: "Review and generate note",
    },
  ];
}

function buildCaseNoteFinalWorkflowSteps() {
  return [
    ...(buildAiLogicWorkflowBundle({ workflowId: "case-note-final" })?.steps || [
      {
        stepKey: "assigned-nodes-draft",
        kind: "draft",
        question: "Review and generate note",
      },
    ]),
    {
      stepKey: "final-note-affirm",
      kind: "affirm",
      question: "Review final case note",
    },
  ];
}

function buildHandoverWorkflowSteps() {
  return [
    ...(buildAiLogicWorkflowBundle({ workflowId: "handover-note" })?.steps || [
      {
        stepKey: "assigned-nodes-draft",
        kind: "draft",
        question: "Review and generate note",
      },
    ]),
    {
      stepKey: "handover-note-affirm",
      kind: "affirm",
      question: "Review handover note",
    },
  ];
}

function buildBehaviorSupportRowWorkflowSteps() {
  const behaviorOptions = (behavioralInputSection.behaviorOptions || []).map((item) => item.label);
  const interventionOptions = (behavioralInputSection.interventionOptions || []).map((item) => item.label);
  const responseOptions = (behavioralInputSection.responseOptions || []).map((item) => item.label);
  const engagementOptions = (behavioralInputSection.engagementOptions || []).map((item) => item.label);
  const riskOptions = (behavioralInputSection.riskOptions || []).map((item) => titleCase(item));
  const planOptions = (behavioralInputSection.planOptions || []).map((item) => titleCase(item));
  const alertOptions = (behavioralInputSection.alertOptions || []).map((item) => titleCase(item));

  return [
    {
      stepKey: "behavior-observed",
      kind: "suggestions",
      question: behavioralInputSection.questionSteps?.[0] || "What behavior or support need was observed?",
      suggestions: [...behaviorOptions, "Other..."],
      allowCustom: true,
      rationale: "Identify the target behavior or support need observed in this row.",
    },
    {
      stepKey: "behavior-intervention",
      kind: "suggestions",
      question: behavioralInputSection.questionSteps?.[1] || "What intervention was used?",
      suggestions: [...interventionOptions, "Other..."],
      allowCustom: true,
      rationale: "Select the actual intervention or staff support used.",
    },
    {
      stepKey: "behavior-response",
      kind: "suggestions",
      question: behavioralInputSection.questionSteps?.[2] || "How did the person respond?",
      suggestions: [...responseOptions, "Other..."],
      allowCustom: true,
      rationale: "Capture the observed response to the intervention.",
    },
    {
      stepKey: "behavior-engagement",
      kind: "suggestions",
      question:
        behavioralInputSection.questionSteps?.[3] ||
        "How did the person engage during the behavioral support?",
      suggestions: [...engagementOptions, "Other..."],
      allowCustom: true,
      rationale: "Document engagement because it affects support quality and note strength.",
    },
    {
      stepKey: "behavior-risks-plans",
      kind: "suggestions",
      question:
        behavioralInputSection.questionSteps?.[4] ||
        "Were any behavioral risks or plans active?",
      suggestions: [...riskOptions, ...planOptions],
      multiSelect: true,
      rationale: "Select all risk or plan overlays that were active during this support.",
    },
    {
      stepKey: "behavior-alerts",
      kind: "suggestions",
      question:
        behavioralInputSection.questionSteps?.[5] ||
        "Were any alerts or follow-up needs present?",
      suggestions: [...alertOptions, "None"],
      multiSelect: true,
      rationale: "Document only real alerts or follow-up needs tied to this row.",
    },
    {
      stepKey: "assigned-nodes-draft",
      kind: "draft",
      question: "Review and generate note",
    },
  ];
}

function getInputSectionDomainForWorkflow(workflowId = "") {
  switch (String(workflowId || "").trim()) {
    case "behavior-support":
      return "behavioral";
    case "adl":
    case "morning-adl":
      return "adl";
    case "night-adl":
      return "sleep-support";
    case "mobility":
      return "mobility";
    case "iadl":
      return "iadl";
    case "feeding-support":
      return "meal-support";
    case "medication-support":
      return "medication";
    case "communication-support":
      return "communication";
    case "community":
    case "community-outing":
    case "return-home":
      return "community";
    case "health-safety":
      return "health-safety";
    case "in-home-leisure":
      return "safety-monitoring";
    case "documentation-coordination":
      return "documentation-coordination";
    default:
      return "";
  }
}

function getWorkflowInputSectionConfig(workflowId = "") {
  const domain = getInputSectionDomainForWorkflow(workflowId);
  return WORKFLOW_INPUT_SECTION_CONFIGS[domain] || null;
}

function getWorkflowInputSectionRuntimeMap(workflowId = "") {
  const domain = getInputSectionDomainForWorkflow(workflowId);
  return WORKFLOW_RUNTIME_MAPS[domain] || null;
}

function getGenericInputTaskLabel(config = {}, taskValue = "") {
  return (config.tasks || []).find((item) => item.value === taskValue)?.label || titleCase(taskValue);
}

function getGenericInputTaskDetail(config = {}, taskValue = "") {
  return config.taskDetails?.[taskValue] || null;
}

function buildConfigDrivenRowWorkflowSteps(workflowId = "") {
  if (workflowId === "behavior-support") {
    return buildBehaviorSupportRowWorkflowSteps();
  }

  const config = getWorkflowInputSectionConfig(workflowId);
  if (!config) {
    return [];
  }

  const taskSuggestions = (config.tasks || []).map((item) => item.label);
  const subtaskSuggestions = Array.from(
    new Set(
      (config.tasks || []).flatMap((task) =>
        (getGenericInputTaskDetail(config, task.value)?.subtasks || []).map((subtask) => subtask.label)
      )
    )
  );
  const outcomeSuggestions = (config.genericOutcomeOptions || []).map((item) => item.label);
  const assistanceSuggestions = (config.genericAssistanceOptions || []).map((item) => item.label);
  const engagementSuggestions = (config.engagementOptions || []).map((item) => item.label);

  const overlaySuggestions = Array.from(
    new Set(
      (config.tasks || []).flatMap((task) => {
        const detail = getGenericInputTaskDetail(config, task.value);
        return [...(detail?.risks || []), ...(detail?.protocols || [])];
      })
    )
  ).map((item) => titleCase(item));

  const alertSuggestions = Array.from(
    new Set(
      (config.tasks || []).flatMap((task) => {
        const detail = getGenericInputTaskDetail(config, task.value);
        return [...(detail?.alerts || [])];
      })
    )
  ).map((item) => titleCase(item));

  return [
    {
      stepKey: "domain-task",
      kind: "suggestions",
      question: config.questionSteps?.[0] || "What task was supported?",
      suggestions: [...taskSuggestions, "Other..."],
      allowCustom: true,
      rationale: "Identify the documented task for this row.",
    },
    {
      stepKey: "domain-subtask",
      kind: "suggestions",
      question: "Was there a subtask?",
      suggestions: subtaskSuggestions.length ? [...subtaskSuggestions, "No subtask", "Other..."] : ["No subtask"],
      allowCustom: subtaskSuggestions.length > 0,
      rationale: "Capture a more specific subtask when the row description makes it relevant.",
    },
    {
      stepKey: "domain-outcome",
      kind: "suggestions",
      question: config.questionSteps?.[1] || "What was the outcome?",
      suggestions: [...outcomeSuggestions, "Other..."],
      allowCustom: true,
      rationale: "Select the outcome that best matches what occurred.",
    },
    {
      stepKey: "domain-assistance",
      kind: "suggestions",
      question: config.questionSteps?.[2] || "What assistance was provided?",
      suggestions: [...assistanceSuggestions, "Other..."],
      allowCustom: true,
      rationale: "Document the support level actually rendered.",
    },
    {
      stepKey: "domain-engagement",
      kind: "suggestions",
      question: config.questionSteps?.[3] || "How did the person engage during the task?",
      suggestions: [...engagementSuggestions, "Other..."],
      allowCustom: true,
      rationale: "Capture participation or presentation during the support.",
    },
    {
      stepKey: "domain-overlays",
      kind: "suggestions",
      question: config.questionSteps?.[4] || "Were any risks or protocols active?",
      suggestions: overlaySuggestions.length ? overlaySuggestions : ["None"],
      multiSelect: true,
      rationale: "Select any active risks, requirements, or protocols that applied to this row.",
    },
    {
      stepKey: "domain-alerts",
      kind: "suggestions",
      question: config.questionSteps?.[5] || "Were any alerts present?",
      suggestions: [...alertSuggestions, "None"],
      multiSelect: true,
      rationale: "Capture follow-up needs or leave as None if nothing additional applied.",
    },
    {
      stepKey: "assigned-nodes-draft",
      kind: "draft",
      question: "Review and generate note",
    },
  ];
}

function normalizeInferenceText(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function inferTaskValueFromRowText(config = {}, text = "") {
  const haystack = normalizeInferenceText(text);
  if (!haystack) {
    return "";
  }

  const aliasesByTask = {
    toileting: ["toileting", "toilet", "brief change", "perineal care", "incontinence"],
    bathing: ["bathing", "bath", "shower", "tub bath"],
    dressing: ["dressing", "dress", "clothing"],
    grooming: ["grooming", "groom", "hair care", "shaving"],
    hygiene: ["hygiene", "wash up", "clean up"],
    transfers: ["transfer", "bed to chair", "chair to toilet", "standing transfer"],
    oral_care: ["oral care", "teeth", "brushing teeth"],
    feeding_assistance: ["feeding", "meal support", "eating support"],
    ambulation: ["ambulation", "ambulate", "walking", "mobility"],
    continence_care: ["continence", "incontinence care"],
    meal_preparation: ["meal preparation", "meal prep", "snack preparation", "beverage preparation"],
    medication_support: ["medication support", "medication prompt", "medication set up", "medication follow up", "medication"],
    laundry: ["laundry", "fold clothing", "washer"],
    housekeeping: ["housekeeping", "bed making", "surface cleaning", "dishwashing"],
    shopping: ["shopping", "grocery shopping", "checkout support", "supply pickup"],
    transportation_coordination: ["transportation coordination", "transport", "ride follow up", "appointment transport"],
    appointment_scheduling: ["appointment scheduling", "schedule appointment"],
    money_management_support: ["money management", "budget", "finances"],
    communication_support: ["communication support", "phone support", "communication"],
    community_outing: ["community outing", "outing", "store trip", "park visit", "walking activity"],
    appointment_support: ["appointment support", "check in support", "transport to visit"],
    social_participation: ["social participation", "peer interaction", "group participation"],
    recreational_activity: ["recreational activity", "recreation"],
    faith_based_activity: ["faith based activity", "church", "faith based"],
    errands: ["errands", "errand"],
    wellness_check: ["wellness check", "pain check", "fatigue check", "general observation"],
    fall_prevention: ["fall prevention", "fall risk", "environment check"],
    mobility_monitoring: ["mobility monitoring", "gait observation", "fatigue monitoring"],
    incident_response: ["incident response", "injury check", "near fall", "immediate follow up", "incident"],
    hydration_support: ["hydration support", "hydration prompt", "fluid monitoring", "fluids offered"],
    environmental_safety_check: ["environmental safety check", "safety check"],
    shift_handoff: ["shift handoff", "verbal handoff", "written handoff", "handoff"],
    family_communication: ["family communication", "update call", "message follow up", "guardian"],
    care_team_communication: ["care team communication", "nurse update", "provider update", "team follow up"],
    progress_documentation: ["progress documentation", "goal progress", "service summary", "documentation"],
    incident_documentation: ["incident documentation", "incident report"],
    supervisor_update: ["supervisor update", "supervisor notification"],
  };

  for (const task of config.tasks || []) {
    const candidates = new Set([
      normalizeInferenceText(task.label),
      normalizeInferenceText(String(task.value || "").replace(/_/g, " ")),
      ...(aliasesByTask[task.value] || []).map((item) => normalizeInferenceText(item)),
    ]);

    for (const candidate of candidates) {
      if (candidate && haystack.includes(candidate)) {
        return task.value;
      }
    }
  }

  return "";
}

function inferBehaviorValueFromRowText(text = "") {
  const haystack = normalizeInferenceText(text);
  if (!haystack) {
    return "";
  }

  const behaviorMatchers = [
    ["needed_redirection", ["redirection", "redirected"]],
    ["boundary_seeking_behavior", ["boundary seeking", "boundary"]],
    ["agitation", ["agitation", "agitated"]],
    ["anxiety", ["anxiety", "anxious"]],
    ["refusal_behavior", ["refusal", "refused"]],
    ["withdrawn_behavior", ["withdrawn", "shut down"]],
    ["verbal_escalation", ["verbal escalation", "escalation", "yelling"]],
  ];

  for (const [value, aliases] of behaviorMatchers) {
    if (aliases.some((alias) => haystack.includes(normalizeInferenceText(alias)))) {
      return value;
    }
  }

  return "";
}

function inferSubtaskValueFromRowText(config = {}, taskValue = "", text = "") {
  const haystack = normalizeInferenceText(text);
  if (!haystack) {
    return "";
  }

  const taskDetail = taskValue ? getGenericInputTaskDetail(config, taskValue) : null;
  const scopedSubtasks = taskDetail?.subtasks?.length
    ? taskDetail.subtasks
    : (config.tasks || []).flatMap((task) => getGenericInputTaskDetail(config, task.value)?.subtasks || []);

  for (const subtask of scopedSubtasks) {
    const candidates = new Set([
      normalizeInferenceText(subtask.label),
      normalizeInferenceText(String(subtask.value || "").replace(/_/g, " ")),
    ]);

    for (const candidate of candidates) {
      if (candidate && haystack.includes(candidate)) {
        return subtask.value;
      }
    }
  }

  return "";
}

function buildInitialLocalWorkflowAnswers(fieldContext = {}, localSteps = []) {
  const workflowId = String(fieldContext.workflowId || "").trim();
  const combinedText = [fieldContext.description, fieldContext.source, fieldContext.assignedNodeSummary]
    .filter(Boolean)
    .join(" ");
  const answers = {};

  if (!localSteps.length) {
    return { answers, stepIndex: 0 };
  }

  const aiLogicTask = String(localSteps.find((step) => step?.sourceAiLogicTask)?.sourceAiLogicTask || "").trim().toLowerCase();
  const normalizedScore = String(fieldContext.score || "").trim();
  const findMatchingSuggestion = (stepKey, value) =>
    (localSteps.find((step) => step.stepKey === stepKey)?.suggestions || []).find(
      (item) => normalizeInferenceText(item) === normalizeInferenceText(value)
    ) || "";

  if (aiLogicTask) {
    const assistanceMatch = normalizedScore ? findMatchingSuggestion("assistance_level", normalizedScore) : "";
    if (assistanceMatch) {
      answers["assistance_level"] = assistanceMatch;
    }

    const outcomeOverrideMap = {
      refused: "Refused",
      "not needed": "Not needed",
    };
    const mappedOutcome = outcomeOverrideMap[normalizeInferenceText(normalizedScore)] || "";
    if (mappedOutcome) {
      const outcomeMatch = findMatchingSuggestion("outcome", mappedOutcome);
      if (outcomeMatch) {
        answers["outcome"] = outcomeMatch;
      }
    }
  }

  if (aiLogicTask === "toileting") {
    const toiletingOptions = (localSteps.find((step) => step.stepKey === "toileting_task_type")?.suggestions || []).map(
      (item) => String(item)
    );
    const inferredToiletingTask =
      toiletingOptions.find((option) => normalizeInferenceText(combinedText).includes(normalizeInferenceText(option))) || "";
    if (inferredToiletingTask) {
      answers["toileting_task_type"] = inferredToiletingTask;
    }
  } else if (workflowId === "behavior-support") {
    const behaviorValue = inferBehaviorValueFromRowText(combinedText);
    if (behaviorValue) {
      const firstStep = localSteps.find((step) => step.stepKey === "behavior-observed");
      const match = (firstStep?.suggestions || []).find(
        (item) => normalizeInferenceText(item) === normalizeInferenceText(behavioralInputSection.behaviorOptions.find((opt) => opt.value === behaviorValue)?.label || "")
      );
      if (match) {
        answers["behavior-observed"] = match;
      }
    }
  } else {
    const config = getWorkflowInputSectionConfig(workflowId);
    const taskValue = inferTaskValueFromRowText(config || {}, combinedText);
    if (taskValue) {
      const label = getGenericInputTaskLabel(config || {}, taskValue);
      if (label) {
        answers["domain-task"] = label;
      }
    }
    const subtaskValue = inferSubtaskValueFromRowText(config || {}, taskValue, combinedText);
    if (subtaskValue) {
      const subtaskLabel =
        (getGenericInputTaskDetail(config || {}, taskValue)?.subtasks || [])
          .concat(
            taskValue
              ? []
              : (config?.tasks || []).flatMap((task) => getGenericInputTaskDetail(config || {}, task.value)?.subtasks || [])
          )
          .find((item) => item.value === subtaskValue)?.label || "";
      if (subtaskLabel) {
        answers["domain-subtask"] = subtaskLabel;
      }
    }
  }

  return {
    answers,
    stepIndex: getNextVisibleLocalWorkflowStepIndex(
      localSteps,
      answers,
      Math.max(
        localSteps.findIndex(
          (step) =>
            shouldPresentLocalWorkflowStep(step, answers) &&
            step.kind !== "draft" &&
            !Boolean(getWorkflowAnswer(answers, step.stepKey || ""))
        ),
        0
      )
    ),
  };
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
  label: "Workflow answers",
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
          {option.key === "assignedAnswers" ? "Your guided answers" : preview}
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

function runDecisionSectionLayoutAnimation() {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

const DECISION_SECTION_VIEW_OPTIONS = [
  { value: "open", label: "Open section" },
  { value: "close", label: "Close section" },
];

const DECISION_SECTION_BULK_OPTIONS = [
  { value: "expand-all", label: "Open all sections" },
  { value: "collapse-all", label: "Close all sections" },
];

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
  if (fieldContext.workflowId === "case-note-final") {
    const getFinalAnswer = (primaryKey, legacyKey = "") =>
      getWorkflowAnswer(answers, primaryKey) ?? (legacyKey ? getWorkflowAnswer(answers, legacyKey) : undefined);
    const sourceEntries = fieldContext.sourceEntries || [];
    const rowSummaries = sourceEntries
      .map((entry) => String(entry.comment || "").trim())
      .filter(Boolean);
    const noteStyle = [
      formatAssignedWorkflowAnswer(getFinalAnswer("final_note_style", "final-note-style")),
      String(getFinalAnswer("final_note_style_other", "finalNoteStyleOther") || "").trim(),
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
    const emphasisSelections = []
      .concat(getFinalAnswer("final_emphasis", "final-emphasis") || [])
      .map((item) => String(item || "").trim())
      .filter(Boolean);
    const emphasis = [
      emphasisSelections.join(", "),
      String(getFinalAnswer("final_emphasis_other") || "").trim(),
    ]
      .filter(Boolean)
      .join(", ");
    const concern = [
      formatAssignedWorkflowAnswer(getFinalAnswer("final_shift_concern", "final-shift-concern")),
      String(getFinalAnswer("final_shift_concern_other") || "").trim(),
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
    const outcome = [
      formatAssignedWorkflowAnswer(getFinalAnswer("final_shift_outcome", "final-shift-outcome")),
      String(getFinalAnswer("final_shift_outcome_other") || "").trim(),
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
    const followUp = [
      formatAssignedWorkflowAnswer(getFinalAnswer("final_follow_up", "final-follow-up")),
      String(getFinalAnswer("final_follow_up_other") || "").trim(),
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
    const guidance = [
      formatAssignedWorkflowAnswer(getFinalAnswer("final_guidance", "final-guidance")),
      String(getFinalAnswer("final_guidance_other") || "").trim(),
      String(answers.finalGuidanceNarration || "").trim(),
    ]
      .filter(Boolean)
      .join(" - ");
    const normalizedOutcome = String(outcome || "").trim().toLowerCase();
    const normalizedConcern = String(concern || "").trim().toLowerCase();
    const normalizedFollowUp = String(followUp || "").trim().toLowerCase();
    const normalizedNoteStyle = String(noteStyle || "").trim().toLowerCase();
    const normalizedEmphasisSelections = emphasisSelections.map((item) => item.toLowerCase());

    const leadByOutcome = {
      "stable shift":
        "Throughout the shift, the client remained generally stable and staff provided routine supports across scheduled activities.",
      "supported with minor issues":
        "Throughout the shift, the client participated in scheduled supports with minor barriers that were addressed by staff as they arose.",
      "supported with notable concerns":
        "Throughout the shift, the client required ongoing staff support and the note reflects notable concerns that affected participation, tolerance, or routine flow.",
      "partial completion of planned supports":
        "Throughout the shift, staff provided planned supports, although some activities were only partially completed due to the barriers noted below.",
      "follow-up needed":
        "Throughout the shift, staff provided required supports and identified follow-up items that should be carried forward for supervisor or clinical review.",
    };

    const emphasisLeadByType = {
      "behavior and interventions":
        "Behavioral presentation, staff intervention, and the person's response remained a primary focus of the shift.",
      "adl and personal care":
        "ADL and personal-care supports remained a primary focus of the shift, including staff assistance, prompting, and observed tolerance.",
      "meal support and medication":
        "Meal support, intake monitoring, and medication-related supports remained a primary focus of the shift.",
      "community and transitions":
        "Community participation and transition supports remained a primary focus of the shift.",
      "health and safety supports":
        "Health and safety supports remained a primary focus of the shift, including ongoing monitoring, precautions, and follow-up awareness.",
    };

    const concernSentenceByType = {
      "change in baseline":
        "A change from baseline was observed and should remain visible in supervisory review of the shift.",
      "repeated refusal":
        "Repeated refusal affected parts of the shift and required additional staff redirection, pacing, or alternate support approaches.",
      "safety concern":
        "Safety concerns remained relevant during the shift and required active staff monitoring and precaution-based support.",
      "medication concern":
        "Medication-related concerns were noted during the shift and should remain visible in the final supervisory summary.",
      "poor intake":
        "Intake concerns were observed during the shift and should remain visible in follow-up review.",
      "behavioral escalation":
        "Behavioral escalation affected the shift and required documented intervention and response tracking.",
      "follow-up required":
        "The shift included issues that require follow-up beyond routine end-of-shift review.",
    };

    const followUpSentenceByType = {
      "supervisor review":
        "Supervisor review should remain explicit in the final note.",
      "nurse follow-up":
        "Nursing follow-up should remain explicit in the final note.",
      "care team update":
        "A care-team update should be carried forward from this shift summary.",
      "family update":
        "A family update should be carried forward if appropriate and authorized.",
      "monitor next shift":
        "The next shift should continue monitoring the items summarized here.",
    };

    const styleLeadByType = {
      technical:
        "Technical summary style selected. Keep the note structured, precise, and defensible, with clear support actions, observed outcomes, and carry-forward items.",
      "clinical summary":
        "Clinical summary style selected. Keep the note clinically aware, highlight changes from baseline, safety findings, and follow-up needs without overstating conclusions.",
      "supervisor handoff":
        "Supervisor handoff style selected. Keep the note operational, easy to scan, and explicit about what needs review or follow-up on the next shift.",
      "concise narrative":
        "Concise narrative style selected. Keep the note short, readable, and focused on the most relevant shift events.",
      "family-safe summary":
        "Family-safe summary style selected. Keep the note plain-language, respectful, and free of unnecessary internal shorthand while preserving accuracy.",
    };

    const leadSentence =
      leadByOutcome[normalizedOutcome] ||
      "Throughout the shift, staff provided scheduled supports and documented the client's response across row-level activities.";

    const parts = [leadSentence];

    if (styleLeadByType[normalizedNoteStyle]) {
      parts.unshift(styleLeadByType[normalizedNoteStyle]);
    } else if (noteStyle && normalizedNoteStyle !== "other") {
      parts.unshift(`Final note style selected: ${noteStyle}.`);
    }

    const emphasisLeadParts = normalizedEmphasisSelections
      .filter((item) => item !== "overall shift summary")
      .map((item) => emphasisLeadByType[item] || `The final note should emphasize ${item}.`);
    if (emphasisLeadParts.length) {
      parts.push(emphasisLeadParts.join(" "));
    }

    if (rowSummaries.length) {
      parts.push(rowSummaries.join(" "));
    }

    if (concernSentenceByType[normalizedConcern]) {
      parts.push(concernSentenceByType[normalizedConcern]);
    } else if (normalizedConcern && normalizedConcern !== "none") {
      parts.push(`Shift-wide concern to highlight: ${concern}.`);
    }

    if (normalizedOutcome === "supported with notable concerns") {
      parts.push("Barriers, staff response, and follow-up considerations should remain prominent in the final summary.");
    }

    if (normalizedOutcome === "follow-up needed") {
      parts.push("Carry-forward needs should be stated clearly so the supervisor can review outstanding items without reconstructing the shift from row notes.");
    }

    if (followUpSentenceByType[normalizedFollowUp]) {
      parts.push(followUpSentenceByType[normalizedFollowUp]);
    } else if (normalizedFollowUp && normalizedFollowUp !== "none") {
      parts.push(`Follow-up to carry forward: ${followUp}.`);
    }

    if (guidance && guidance.toLowerCase() !== "no extra guidance") {
      parts.push(`Additional final-note guidance: ${guidance}.`);
    }

    return parts.length
      ? parts.join(" ")
      : "No row-level documentation was available to summarize into a final case note.";
  }

  if (fieldContext.workflowId === "handover-note") {
    const sourceEntries = fieldContext.sourceEntries || [];
    const nonEmptyEntries = sourceEntries
      .map((entry) => ({
        entryType: entry.entryType,
        comment: String(entry.comment || "").trim(),
      }))
      .filter((entry) => entry.comment);
    const finalSummaryEntry =
      nonEmptyEntries.find((entry) => entry.entryType === "final-summary")?.comment || "";
    const supportingEntries = nonEmptyEntries
      .filter((entry) => entry.entryType !== "final-summary")
      .map((entry) => entry.comment);
    const focus = formatAssignedWorkflowAnswer(getWorkflowAnswer(answers, "handover_focus"));
    const priority = formatAssignedWorkflowAnswer(getWorkflowAnswer(answers, "handover_priority"));
    const normalizedFocus = String(focus || "").trim().toLowerCase();
    const normalizedPriority = String(priority || "").trim().toLowerCase();
    const resolvedSupports = []
      .concat(getWorkflowAnswer(answers, "resolved_supports") || [])
      .map((item) => String(item || "").trim())
      .filter(Boolean);
    const carryForward = [
      []
        .concat(getWorkflowAnswer(answers, "carry_forward_items") || [])
        .map((item) => String(item || "").trim())
        .filter((item) => item && item !== "Other"),
      String(getWorkflowAnswer(answers, "carry_forward_items_other") || "").trim(),
    ]
      .flat()
      .filter(Boolean);
    const notifications = []
      .concat(getWorkflowAnswer(answers, "notifications_completed") || [])
      .map((item) => String(item || "").trim())
      .filter(Boolean);
    const nextShiftActions = [
      []
        .concat(getWorkflowAnswer(answers, "next_shift_actions") || [])
        .map((item) => String(item || "").trim())
        .filter((item) => item && item !== "Other"),
      String(getWorkflowAnswer(answers, "next_shift_actions_other") || "").trim(),
    ]
      .flat()
      .filter(Boolean);
    const vitals = [
      []
        .concat(getWorkflowAnswer(answers, "vitals_reviewed") || [])
        .map((item) => String(item || "").trim())
        .filter((item) => item && item !== "Other reading"),
      String(getWorkflowAnswer(answers, "vitals_reviewed_other") || "").trim(),
    ]
      .flat()
      .filter(Boolean);
    const freeNote = String(getWorkflowAnswer(answers, "free_note") || "").trim();

    const focusLeadByType = {
      "routine shift transition":
        "This handover reflects a routine shift transition with emphasis on continuity of supports and routine monitoring.",
      "clinical monitoring":
        "This handover is clinically focused and should guide the next shift toward close observation of health, symptoms, and follow-up needs.",
      "behavioral follow-up":
        "This handover centers behavioral presentation, intervention continuity, and what the next shift should continue monitoring.",
      "medication follow-up":
        "This handover emphasizes medication-related awareness, follow-up, and any related carry-forward monitoring.",
      "safety concern carry-forward":
        "This handover is safety-focused and should be treated as a carry-forward alert for the next shift.",
      "mixed handoff":
        "This handover includes multiple domains and should be reviewed as a mixed shift handoff with both routine and concern-based carry-forward items.",
    };

    const prioritySentenceByType = {
      routine:
        "Priority is routine, but the next shift should still review the summarized supports and ongoing expectations.",
      "watch closely next shift":
        "The next shift should watch the identified items closely and document any change from the current presentation.",
      "supervisor review needed":
        "Supervisor visibility is needed on the carry-forward items from this shift.",
      "clinical follow-up needed":
        "Clinical follow-up should remain explicit in handoff, and the next shift should maintain awareness of related observations or symptom changes.",
      "immediate carry-forward priority":
        "This handoff includes immediate carry-forward priorities that should be reviewed at the start of the next shift without delay.",
    };

    const parts = [];
    if (focusLeadByType[normalizedFocus]) {
      parts.push(focusLeadByType[normalizedFocus]);
    } else if (focus) {
      parts.push(`Handover focus: ${focus}.`);
    }
    if (prioritySentenceByType[normalizedPriority]) {
      parts.push(prioritySentenceByType[normalizedPriority]);
    } else if (priority) {
      parts.push(`Priority level: ${priority}.`);
    }
    if (resolvedSupports.length) {
      parts.push(`Completed supports acknowledged in handoff: ${resolvedSupports.join(", ")}.`);
    }
    if (finalSummaryEntry) {
      parts.push(`Shift summary for handoff: ${finalSummaryEntry}`);
    }
    if (supportingEntries.length) {
      parts.push(`Supporting note details: ${supportingEntries.join(" ")}`);
    }
    if (carryForward.length && !(carryForward.length === 1 && carryForward[0].toLowerCase() === "none")) {
      parts.push(`Carry-forward items for the next shift: ${carryForward.join(", ")}.`);
    }
    if (notifications.length) {
      parts.push(`Notifications already completed this shift: ${notifications.join(", ")}.`);
    }
    if (nextShiftActions.length) {
      parts.push(`Next-shift actions should include: ${nextShiftActions.join(", ")}.`);
    }
    if (vitals.length && !(vitals.length === 1 && vitals[0].toLowerCase() === "no vitals reviewed")) {
      parts.push(`Vitals or readings reviewed for handoff: ${vitals.join(", ")}.`);
    }
    if (freeNote) {
      parts.push(`Additional handover guidance: ${freeNote}.`);
    }

    return parts.length
      ? parts.join(" ")
      : "No handover details were captured for this shift.";
  }

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
  const restoredWorkflowId =
    String(target.workflowId || "").trim() === "assigned-nodes" && String(target.baseWorkflowId || "").trim()
      ? String(target.baseWorkflowId).trim()
      : target.workflowId;

  return {
    ...target,
    workflowId: restoredWorkflowId,
    baseWorkflowId: undefined,
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

      const baseWorkflowId = String(block.baseWorkflowId || block.workflowId || "").trim();
      return {
        ...block,
        comment: "",
        baseWorkflowId,
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

      const baseWorkflowId = String(row.baseWorkflowId || row.workflowId || "").trim();
      return {
        ...row,
        comment: "",
        baseWorkflowId,
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
  return decisionNodes.libraries.filter((lib) => {
    const slug = String(lib.library || "").toLowerCase();
    return slug !== "readme" && slug !== "branching";
  });
}

function getBranchingBranchDropdownOptions() {
  return BRANCHING_FOLLOW_UP_BRANCHES.map((row) => ({
    value: row.key,
    label: row.label,
  }));
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
    dspValidationQuizPassed: false,
    review: {
      reviewedBy: "",
      signStatus: "Awaiting DSP Signature",
      qaStatus: "Pending QA Review",
      validationTimestamp: "",
    },
    handover: {
      required: false,
      submitted: false,
      generatedNote: "",
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

function shuffleArray(items = []) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function buildValidationQuizQuestions(session, clientProfile = null) {
  const questions = [];
  const timeBlocks = session.timeBlocks || [];
  const rows = session.rows || [];
  const supportChoices = AI_ASSISTANCE_SCORE_OPTIONS.filter((item) => item !== "Refused" && item !== "Not needed");
  const styleOptions = ["Technical", "Clinical summary", "Supervisor handoff", "Concise narrative", "Family-safe summary"];
  const summaryText = String(session.shiftSummary || "").trim();
  const finalStyle = String(session.caseNoteAttestation?.style || "").trim();

  const scoredBlocks = timeBlocks.filter(
    (block) => String(block.comment || "").trim() && String(block.score || "").trim()
  );
  const notedRows = rows.filter(
    (row) => String(row.comment || "").trim() && String(row.description || "").trim()
  );

  scoredBlocks.forEach((block) => {
    const distractors = shuffleArray(
      [...new Set(scoredBlocks.map((block) => String(block.score || "").trim()).filter(Boolean).concat(supportChoices))]
        .filter((item) => item && item !== block.score)
    ).slice(0, 3);
    questions.push({
      id: `quiz-block-${block.id}`,
      source: "Time block note",
      prompt: `For the ${block.label} block, what support level or status was documented?`,
      noteExcerpt: String(block.comment || "").trim(),
      correctAnswer: String(block.score || "").trim(),
      choices: shuffleArray([String(block.score || "").trim(), ...distractors]).slice(0, 4),
    });
  });

  notedRows.forEach((row) => {
    const rowLabel = getWorkflowEyebrow(String(row.baseWorkflowId || row.workflowId || "").trim());
    const rowScore = String(row.score || "").trim();
    if (rowScore) {
      const distractors = shuffleArray(
        [...new Set(notedRows.map((row) => String(row.score || "").trim()).filter(Boolean).concat(supportChoices))]
          .filter((item) => item && item !== rowScore)
      ).slice(0, 3);
      questions.push({
        id: `quiz-row-score-${row.id}`,
        source: "Row note",
        prompt: "What support level or status was documented for this row note?",
        noteExcerpt: String(row.comment || "").trim(),
        correctAnswer: rowScore,
        choices: shuffleArray([rowScore, ...distractors]).slice(0, 4),
      });
      return;
    }

    const workflowChoices = shuffleArray(
      [
        ...new Set(
          notedRows
            .map((row) => getWorkflowEyebrow(String(row.baseWorkflowId || row.workflowId || "").trim()))
            .filter(Boolean)
            .concat(["ADL", "Behavior Support", "Meal Support", "Medication", "Communication"])
        ),
      ].filter((item) => item && item !== rowLabel)
    ).slice(0, 3);
    if (rowLabel) {
      questions.push({
        id: `quiz-row-${row.id}`,
        source: "Row note",
        prompt: `Which workflow area does this row note belong to?`,
        noteExcerpt: String(row.comment || "").trim(),
        correctAnswer: rowLabel,
        choices: shuffleArray([rowLabel, ...workflowChoices]).slice(0, 4),
      });
    }
  });

  if (summaryText && finalStyle) {
    const styleChoices = shuffleArray(
      styleOptions.filter(
        (item) => item !== finalStyle
      )
    ).slice(0, 3);
    questions.push({
      id: "quiz-summary-style",
      source: "Final summary",
      prompt: "What final note style was selected for this case note?",
      noteExcerpt: summaryText,
      correctAnswer: finalStyle,
      choices: shuffleArray([finalStyle, ...styleChoices]).slice(0, 4),
    });
  }

  return questions;
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
  const generatedHandoverNote =
    String(session.handover?.generatedNote || "").trim() || "No generated handover note entered.";
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
      <h2>Generated Handover Note</h2>
      <p>${escapeHtml(generatedHandoverNote).replace(/\n/g, "<br />")}</p>
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
        question: "Review and generate note",
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
  valueTextStyle,
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
            value ? valueTextStyle : null,
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
          <Text style={styles.docuWraiteSparkle}>✦</Text>
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
  const [assignedDraftReviewExpanded, setAssignedDraftReviewExpanded] = useState(false);
  const workflowEyebrow =
    workflowState?.fieldContext?.localWorkflowEyebrow || getWorkflowEyebrow(workflowId);
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
  const aiLogicQuestionFlow = useAssignedNodeWorkflow && assignedNodeSteps.some((step) => step?.sourceAiLogicPath);
  const progressLabel =
    stepMeta?.kind === "draft" || stepMeta?.kind === "why" || stepMeta?.kind === "readiness" || stepMeta?.kind === "affirm"
      ? null
      : stepMeta?.softCheck && /^dsp-understanding-/.test(stepKey || "")
        ? `Quick check ${stepKey.replace("dsp-understanding-", "")} of 3`
      : useAiWorkflow
        ? `Question ${stepIndex + 1}`
        : useAssignedNodeWorkflow
          ? `${aiLogicQuestionFlow ? "Workflow question" : "Assigned question"} ${Math.min(stepIndex + 1, assignedNodeSteps.length)} of ${assignedNodeSteps.length}`
          : `Question ${Math.min(stepIndex + 1, Math.max(ruleSteps.length, stepIndex + 1))}`;
  const prefilledTask = String(getWorkflowAnswer(answers, "domain-task") || "").trim();
  const prefilledSubtask = String(getWorkflowAnswer(answers, "domain-subtask") || "").trim();
  const prefilledBehavior = String(getWorkflowAnswer(answers, "behavior-observed") || "").trim();
  const prefilledSummary = prefilledBehavior
    ? `Prefilled: ${prefilledBehavior}`
    : prefilledTask && prefilledSubtask && prefilledSubtask !== "No subtask"
      ? `Prefilled: ${prefilledTask} -> ${prefilledSubtask}`
      : prefilledTask
        ? `Prefilled: ${prefilledTask}`
        : "";
  const isFinalCaseNoteWorkflow = fieldContextForDraft?.workflowId === "case-note-final" || workflowId === "case-note-final";
  const reviewDraftNote = answers.finalDraftNote || generatedNote;
  const narrationValue = answers[stepMeta?.narrationField || `${stepKey}Narration`] || "";
  const canGoBack =
    stepIndex > 0 || Boolean(workflowState?.remediationStepKey || workflowState?.forcedStepKey);

  useEffect(() => {
    if (stepMeta?.kind !== "readiness") {
      setActiveReadinessRemediationKey(null);
    }
  }, [stepMeta?.kind, stepMeta?.stepKey]);

  useEffect(() => {
    if (!(useAssignedNodeWorkflow && stepMeta?.kind === "draft" && generatedNote)) {
      setAssignedDraftReviewExpanded(false);
      return;
    }

    setAssignedDraftReviewExpanded(false);
  }, [useAssignedNodeWorkflow, stepMeta?.kind, generatedNote]);

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
    const emptyWorkflowMessage = useAssignedNodeWorkflow
      ? assignedNodeSteps.length
        ? "DocuWraite could not load the next assigned question. Try Back or Dismiss, then open the bubble again."
        : "No assigned questions loaded for this field. In Decision Engine, lock your library to this block or row, then tap Final Assign to Case Note."
      : useAiWorkflow
        ? aiError || "DocuWraite could not load the next question. Confirm the API server is running and EXPO_PUBLIC_DOCUWRAITE_API_URL is set."
        : workflowId === "community-outing"
          ? "DocuWraite could not load the next community outing question."
          : "This guided workflow needs the DocuWraite API (set EXPO_PUBLIC_DOCUWRAITE_RULE_FALLBACK=false and point EXPO_PUBLIC_DOCUWRAITE_API_URL at your server).";

    return (
      <View style={styles.docuWraiteWorkflowCard}>
        <Text style={styles.docuWraiteWorkflowEyebrow}>{workflowEyebrow}</Text>
        <Text style={styles.docuWraiteWorkflowAiNotice}>{emptyWorkflowMessage}</Text>
        <View style={styles.docuWraiteWorkflowFooter}>
          <View />
          <Pressable onPress={onDismiss}>
            <Text style={styles.docuWraiteWorkflowDismiss}>Dismiss</Text>
          </Pressable>
        </View>
      </View>
    );
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
      !stepMeta.manualContinue &&
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
      {prefilledSummary ? <Text style={styles.docuWraiteWorkflowMetaLine}>{prefilledSummary}</Text> : null}
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

      {stepMeta.kind === "input" ? (
        <View style={styles.docuWraiteWorkflowSuggestionList}>
          <TextInput
            value={String(answers[stepKey] || "")}
            onChangeText={(entry) => onAnswer({ [stepKey]: entry })}
            placeholder="Type answer"
            placeholderTextColor="#888888"
            multiline
            style={[styles.docuWraiteWorkflowInput, styles.docuWraiteWorkflowNarrationInput]}
          />
          {String(answers[stepKey] || "").trim() ? (
            <Pressable style={styles.docuWraiteWorkflowNext} onPress={() => onAnswer({}, { advance: true })}>
              <Text style={styles.docuWraiteWorkflowNextText}>Continue</Text>
            </Pressable>
          ) : null}
        </View>
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
                Review the guided answers, choose what DocuWraite may use for context, generate the note, then insert it
                into this field.
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
              <Text style={styles.docuWraiteWorkflowLoading}>Generating note with DocuWraite...</Text>
            </View>
          ) : null}
          {!showAssignedGenerateStep && !assignedDraftLoading && generatedNote ? (
            <>
              {useAssignedNodeWorkflow && assignedDraftReviewExpanded ? (
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
              {useAssignedNodeWorkflow && assignedDraftReviewExpanded && assignedDraftGuidelineWarning ? (
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
              {useAssignedNodeWorkflow && assignedDraftReviewExpanded && assignedDraftFollowUp ? (
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
              {(!useAssignedNodeWorkflow || assignedDraftReviewExpanded) ? (
                <>
                  <Text style={styles.docuWraiteWorkflowExtraLabel}>Additional notes (optional)</Text>
                  <TextInput
                    value={answers.extraNotes || ""}
                    onChangeText={(extraNotes) => onAnswer({ extraNotes })}
                    placeholder="Add any extra details the DSP wants in the note"
                    placeholderTextColor="#888888"
                    multiline
                    style={styles.docuWraiteWorkflowExtraInput}
                  />
                </>
              ) : null}
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
                      if (isFinalCaseNoteWorkflow) {
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
                      : isFinalCaseNoteWorkflow
                        ? "Continue to quick check"
                        : "Insert into note"}
                  </Text>
                </Pressable>
                {useAssignedNodeWorkflow && !assignedDraftReviewExpanded ? (
                  <Pressable
                    style={styles.docuWraiteCardSecondary}
                    onPress={() => setAssignedDraftReviewExpanded(true)}
                  >
                    <Text style={styles.docuWraiteCardSecondaryText}>Review</Text>
                  </Pressable>
                ) : null}
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
  onWorkflowClearGuidelineWarning = () => {},
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
        const rowWorkflowId = String(row.workflowId || "").trim();
        const rowBaseWorkflowId = String(row.baseWorkflowId || rowWorkflowId).trim();
        const rowFieldContextBase = {
          fieldKind: "row",
          score: row.score,
          description: row.description,
          source: row.source,
          workflowId: rowWorkflowId,
          baseWorkflowId: rowBaseWorkflowId,
          theme: row.theme,
          shiftIntelligence: runtimeShiftIntelligence,
          assignedNodes: row.assignedNodes || [],
          assignedNodeSummary: row.assignedNodeSummary || "",
        };
        const rowAssignedWorkflowSteps = buildPrecomputedAssignedWorkflowSteps(rowFieldContextBase);
        const rowConfig = getWorkflowInputSectionConfig(rowBaseWorkflowId);
        const rowFieldContext = {
          ...rowFieldContextBase,
          assignedWorkflowSteps: rowAssignedWorkflowSteps,
          localWorkflowEyebrow: rowConfig ? getWorkflowEyebrow(rowBaseWorkflowId) : "",
        };
        const rowScoreConfig = getDocumentationScoreConfig(rowFieldContext);

        return (
          <View key={row.id} style={[styles.docTableRow, isPhone && styles.docTableRowStacked]}>
            <View style={[styles.docDescriptionColumn, styles.docDescriptionCell]}>
              {row.source ? <Text style={styles.docRowSource}>{row.source}</Text> : null}
              <Text style={styles.docRowDescription}>{row.description}</Text>
            </View>
            <View style={[styles.docScoresColumn, styles.docScoresCell]}>
              <DocumentationDropdown
                value={row.score}
                options={rowScoreConfig.options}
                placeholder={rowScoreConfig.placeholder || scorePlaceholder}
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
  const activePatientName = formatClientNameLastFirstInitials(
    clientProfile?.displayName ?? patientDisplayName
  );
  const previousShiftData = clientProfile?.previousShiftSnapshot ?? getMaryBetProfile().previousShiftSnapshot;
  const isCaseNoteSession = session.sessionType === "case-note";
  const runtimeShiftIntelligence = getShiftIntelligenceRuntime(clientProfile || getMaryBetProfile(), session);
  const [expandedAreas, setExpandedAreas] = useState({});
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [docuWraiteAssist, setDocuWraiteAssist] = useState(null);
  const [docuWraiteExpanded, setDocuWraiteExpanded] = useState(false);
  const [docuWraiteWorkflow, setDocuWraiteWorkflow] = useState(null);
  const [submitHandoverPromptVisible, setSubmitHandoverPromptVisible] = useState(false);
  const [validationQuizState, setValidationQuizState] = useState({
    visible: false,
    questions: [],
    currentIndex: 0,
    feedback: "",
    requireCorrectRetry: false,
    showCorrect: false,
    trigger: "validate",
  });
  const validationQuizSuccessScale = useRef(new Animated.Value(0.88)).current;
  const validationQuizAdvanceTimer = useRef(null);
  const docuWraitePauseTimers = useRef({});
  const docuWraiteDismissed = useRef(new Set());
  const docuWraiteWorkflowRequestId = useRef(0);
  const groupedTimeBlocks = useMemo(() => {
    const groups = [];
    const groupsByLabel = new Map();

    (session.timeBlocks || []).forEach((block) => {
      const label = String(block?.label || "");
      if (!groupsByLabel.has(label)) {
        const nextGroup = { label, blocks: [] };
        groupsByLabel.set(label, nextGroup);
        groups.push(nextGroup);
      }
      groupsByLabel.get(label).blocks.push(block);
    });

    return groups;
  }, [session.timeBlocks]);

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

  useEffect(() => {
    if (validationQuizState.showCorrect) {
      validationQuizSuccessScale.setValue(0.88);
      Animated.spring(validationQuizSuccessScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 7,
        tension: 110,
      }).start();
      return;
    }

    validationQuizSuccessScale.setValue(0.88);
  }, [validationQuizState.showCorrect, validationQuizSuccessScale]);

  const getWorkflowFieldNote = (fieldId) => {
    if (fieldId === "summary") {
      return session.shiftSummary || "";
    }
    if (fieldId === "handover") {
      return session.handover?.generatedNote || "";
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

  const buildHandoverFieldContext = () => ({
    fieldKind: "handover",
    workflowId: "handover-note",
    description: "Handover Note",
    source: "Shift Handoff",
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
      {
        entryType: "final-summary",
        description: "Final Case Note",
        source: "Case Note Final",
        comment: session.shiftSummary,
        workflowId: "case-note-final",
      },
    ],
    finalSummary: session.shiftSummary,
    generatedHandoverNote: session.handover?.generatedNote || "",
    manualHandoverNotes: session.handover?.additionalNotes || "",
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
          const readinessIndex = meta?.stepOrder?.indexOf("readiness") ?? -1;
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
      const aiLogicDraftPayload = buildAiLogicDraftPayload(workflowSnapshot, {
        clientName: activePatientName,
        date: session?.selectedDateLabel || session?.serviceDate || "",
        shiftType: fieldContextForDraft.label || fieldContextForDraft.source || "",
        staffName: session?.staffName || session?.dspName || session?.enteredBy || "",
      });
      const enabledDraftSections = buildEnabledDraftSections(
        draftContextToggles,
        fieldContextForDraft,
        currentNote,
        {
          ...mappedAnswers,
          aiLogicDraftPayload,
        },
        workflowSnapshot.answers?.draftContextResponses || {}
      );

      const { step, meta } = await fetchAssignedNodesDraft({
        answers: {
          ...mappedAnswers,
          aiLogicDraftPayload,
        },
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
        throw new Error("DocuWraite did not return a draft note.");
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
            "DocuWraite could not generate a note. Confirm the API server and note-generation key are set.",
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

  const closeValidationQuiz = () => {
    if (validationQuizAdvanceTimer.current) {
      clearTimeout(validationQuizAdvanceTimer.current);
      validationQuizAdvanceTimer.current = null;
    }
    setValidationQuizState({
      visible: false,
      questions: [],
      currentIndex: 0,
      feedback: "",
      requireCorrectRetry: false,
      showCorrect: false,
      trigger: "validate",
    });
  };

  const openValidationQuiz = (trigger = "validate") => {
    const questions = buildValidationQuizQuestions(session, clientProfile);
    if (!questions.length) {
      patchSession({
        validationWarnings: [],
        dspValidationQuizPassed: true,
        statusMessage: "Validation complete. No DSP awareness quiz items were available, so validation was marked complete.",
        review: {
          ...session.review,
          validationTimestamp: "05/14/2026 1:06 AM",
        },
      });
      return;
    }

    setValidationQuizState({
      visible: true,
      questions,
      currentIndex: 0,
      feedback:
        trigger === "submit"
          ? "Answer all quiz questions before submission."
          : "Answer all quiz questions to complete validation.",
      requireCorrectRetry: false,
      showCorrect: false,
      trigger,
    });
  };

  const handleValidationQuizAnswer = (choice) => {
    const currentQuestion = validationQuizState.questions[validationQuizState.currentIndex];
    if (!currentQuestion) {
      return;
    }

    if (String(choice) !== String(currentQuestion.correctAnswer)) {
      if (validationQuizAdvanceTimer.current) {
        clearTimeout(validationQuizAdvanceTimer.current);
        validationQuizAdvanceTimer.current = null;
      }
      setValidationQuizState((current) => ({
        ...current,
        feedback: `Incorrect. Correct answer: ${currentQuestion.correctAnswer}. Select the correct answer to continue.`,
        requireCorrectRetry: true,
        showCorrect: false,
      }));
      return;
    }

    if (validationQuizAdvanceTimer.current) {
      clearTimeout(validationQuizAdvanceTimer.current);
    }

    setValidationQuizState((current) => ({
      ...current,
      feedback: "Correct",
      requireCorrectRetry: false,
      showCorrect: true,
    }));

    validationQuizAdvanceTimer.current = setTimeout(() => {
      validationQuizAdvanceTimer.current = null;
      if (validationQuizState.currentIndex >= validationQuizState.questions.length - 1) {
        const submitAfterPass = validationQuizState.trigger === "submit";
        patchSession({
          validationWarnings: [],
          dspValidationQuizPassed: true,
          statusMessage: submitAfterPass
            ? "DSP awareness quiz passed. Submitting documentation."
            : "Validation complete. DSP awareness quiz passed.",
          review: {
            ...session.review,
            validationTimestamp: "05/14/2026 1:06 AM",
          },
        });
        closeValidationQuiz();
        if (submitAfterPass) {
          setSubmitHandoverPromptVisible(true);
        }
        return;
      }

      setValidationQuizState((current) => ({
        ...current,
        currentIndex: current.currentIndex + 1,
        feedback: "",
        requireCorrectRetry: false,
        showCorrect: false,
      }));
    }, 700);
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

    const normalizedFieldContext = attachClientCarePlanContext(assist.fieldContext || {}, {
      clientProfile,
      activePatientName,
    });
    assist = {
      ...assist,
      fieldContext: normalizedFieldContext,
    };

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
        const localSteps = assist.localWorkflowSteps?.length
          ? assist.localWorkflowSteps
          : getAssignedWorkflowStepsForField(assist.fieldContext || {});

        const shouldReuseCurrentWorkflow =
          current?.fieldId === assist.fieldId &&
          current.workflowId === assist.workflowId &&
          areWorkflowStepsEquivalent(current.localSteps || [], localSteps);

        if (shouldReuseCurrentWorkflow) {
          return current;
        }
        const hasAssignedNodes = (assist.fieldContext?.assignedNodes || []).length > 0;
        const useLocalWorkflow =
          assist.workflowId === "assigned-nodes" &&
          localSteps.some((step) => step.kind !== "draft");
        const initialLocalWorkflowState = useLocalWorkflow
          ? buildInitialLocalWorkflowAnswers(assist.fieldContext || {}, localSteps)
          : { answers: {}, stepIndex: 0 };

        const startingWorkflow = {
          fieldId: assist.fieldId,
          workflowId: assist.workflowId,
          stepIndex: initialLocalWorkflowState.stepIndex,
          answers: initialLocalWorkflowState.answers,
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
    fieldContext = attachClientCarePlanContext(fieldContext, {
      clientProfile,
      activePatientName,
    });
    const hasAssignedNodes = (fieldContext.assignedNodes || []).length > 0;
    const localWorkflowSteps = getAssignedWorkflowStepsForField(fieldContext);
    const hasLocalWorkflowSteps = localWorkflowSteps.some((step) => step.kind !== "draft");
    const workflowId = hasAssignedNodes
      ? "assigned-nodes"
      : hasLocalWorkflowSteps
        ? "assigned-nodes"
      : detectDocuWraiteGuidedWorkflow(fieldContext, value, clientProfile);

    if (!workflowId) {
      return false;
    }

    const useAssignedWorkflow =
      workflowId === "assigned-nodes" && hasLocalWorkflowSteps;

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
      workflowId: "assigned-nodes",
      fieldContext: buildCaseNoteFinalFieldContext(),
      localWorkflowSteps: buildCaseNoteFinalWorkflowSteps(),
      title: getWorkflowEyebrow("case-note-final"),
      message: "DocuWraite will summarize the row notes into a final case note.",
      trigger: "manual",
    });
  };

  const openHandoverWorkflow = () => {
    showDocuWraiteAssist({
      fieldId: "handover",
      id: "workflow-handover-note",
      mode: "workflow",
      workflowId: "assigned-nodes",
      fieldContext: buildHandoverFieldContext(),
      localWorkflowSteps: buildHandoverWorkflowSteps(),
      title: getWorkflowEyebrow("handover-note"),
      message: "DocuWraite will guide a detailed handover note for the next shift.",
      trigger: "manual",
    });
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
      dspValidationQuizPassed: false,
    });
  };

  const updateTimeBlock = (id, changes) => {
    patchSession({
      timeBlocks: session.timeBlocks.map((block) => (block.id === id ? { ...block, ...changes } : block)),
      dspValidationQuizPassed: false,
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
      const nextLocalWorkflowSteps = hasAssignedNodes ? getAssignedWorkflowStepsForField(fieldContext) : [];
      const shouldRefreshCurrentAssignedWorkflow =
        hasAssignedNodes &&
        docuWraiteWorkflow?.fieldId === fieldId &&
        docuWraiteWorkflow?.workflowId === "assigned-nodes" &&
        workflowStepsContainAiLogic(nextLocalWorkflowSteps) &&
        !workflowStepsContainAiLogic(docuWraiteWorkflow?.localSteps || []);

      if (isCurrentFieldActive && !shouldRefreshCurrentAssignedWorkflow) {
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
            stepIndex = getNextVisibleLocalWorkflowStepIndex(
              current.localSteps || [],
              answers,
              current.stepIndex + 1
            );
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

        const next = {
          ...current,
          stepIndex: getNextVisibleLocalWorkflowStepIndex(
            current.localSteps || [],
            current.answers || {},
            Math.max(0, current.stepIndex - 1),
            -1
          ),
        };
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
        const isFinalCaseNoteWorkflow =
          docuWraiteWorkflow?.fieldContext?.workflowId === "case-note-final" ||
          docuWraiteWorkflow?.workflowId === "case-note-final";

        patchSession({
          shiftSummary: session.shiftSummary.trim() ? `${session.shiftSummary.trim()}\n${note}` : note,
          caseNoteAttestationComplete: isFinalCaseNoteWorkflow,
          dspValidationQuizPassed: false,
          caseNoteAttestation: isFinalCaseNoteWorkflow
            ? {
                style:
                  docuWraiteWorkflow?.answers?.["final_note_style"] ||
                  docuWraiteWorkflow?.answers?.["final-note-style"] ||
                  "",
                emphasis:
                  docuWraiteWorkflow?.answers?.["final_emphasis"] ||
                  docuWraiteWorkflow?.answers?.["final-emphasis"] ||
                  "",
                concern:
                  docuWraiteWorkflow?.answers?.["final_shift_concern"] ||
                  docuWraiteWorkflow?.answers?.["final-shift-concern"] ||
                  "",
                outcome:
                  docuWraiteWorkflow?.answers?.["final_shift_outcome"] ||
                  docuWraiteWorkflow?.answers?.["final-shift-outcome"] ||
                  "",
                followUp:
                  docuWraiteWorkflow?.answers?.["final_follow_up"] ||
                  docuWraiteWorkflow?.answers?.["final-follow-up"] ||
                  "",
              }
            : null,
        });
      } else if (fieldId === "handover") {
        patchSession({
          handover: {
            ...(session.handover || {}),
            required: true,
            generatedNote: note,
            generatedAt: "05/14/2026 1:06 AM",
            submitted: false,
          },
          statusMessage: "Handover note generated. Review and open it when ready.",
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
    const hasCaseNoteSummary = Boolean(String(session.shiftSummary || "").trim());
    const hasCaseNoteSourceNotes = Boolean(
      (session.timeBlocks || []).some((block) => String(block.comment || "").trim()) ||
      (session.rows || []).some((row) => String(row.comment || "").trim())
    );
    if (isCaseNoteSession && warnings.length === 0 && hasCaseNoteSummary && hasCaseNoteSourceNotes) {
      openValidationQuiz("validate");
      return;
    }
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

  const finalizeDocumentationSubmission = ({ requireHandover = false } = {}) => {
    patchSession({
      validationWarnings: [],
      statusMessage: requireHandover
        ? "Documentation submitted. Complete the detailed handover note next."
        : "Documentation submitted for compliance review.",
      review: {
        ...session.review,
        signStatus: "Submitted for QA Review",
        validationTimestamp: "05/14/2026 1:06 AM",
      },
      handover: {
        ...(session.handover || {}),
        required: requireHandover,
        submitted: requireHandover ? session.handover?.submitted || false : false,
      },
    });
    runDocuWraiteReview("submit");
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

    if (isCaseNoteSession && warnings.length === 0 && !session.dspValidationQuizPassed) {
      openValidationQuiz("submit");
      patchSession({
        validationWarnings: warnings,
        statusMessage: "Complete the DSP awareness quiz before submitting documentation.",
      });
      return;
    }

    if (isCaseNoteSession && warnings.length === 0) {
      setSubmitHandoverPromptVisible(true);
      return;
    }

    patchSession({
      validationWarnings: warnings,
      statusMessage: "Submission blocked until validation warnings are resolved.",
      review: {
        ...session.review,
        validationTimestamp: "05/14/2026 1:06 AM",
      },
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
      action: openCaseNoteFinalWorkflow,
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
          {groupedTimeBlocks.map((group) => (
            <View key={group.label} style={[styles.docTableRow, isPhone && styles.docTableRowStacked]}>
              <View style={[styles.docDescriptionColumn, styles.docDescriptionCell]}>
                <Text style={styles.docTimeLabel}>{group.label}</Text>
                <View style={styles.docGroupedList}>
                  {group.blocks.map((block, index) => {
                    const workflowLabel = getWorkflowEyebrow(getTimeBlockWorkflowId(block, clientProfile));
                    return (
                      <View
                        key={block.id}
                        style={[
                          styles.docGroupedItem,
                          index < group.blocks.length - 1 ? styles.docGroupedItemWithDivider : null,
                        ]}
                      >
                        {workflowLabel ? <Text style={styles.docWorkflowTag}>{workflowLabel}</Text> : null}
                        <Text style={styles.docRowDescription}>{getTimeBlockPrompt(block, clientProfile)}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
              <View style={[styles.docScoresColumn, styles.docScoresCell]}>
                <View style={styles.docGroupedList}>
                  {group.blocks.map((block, index) => {
                    const workflowId = getTimeBlockWorkflowId(block, clientProfile);
                    const baseWorkflowId = String(block.baseWorkflowId || block.workflowId || workflowId).trim();
                    const fieldContextBase = {
                      fieldKind: "time",
                      score: block.score,
                      label: block.label,
                      description: getTimeBlockPrompt(block, clientProfile),
                      source: getTimeBlockSource(block, clientProfile),
                      workflowId,
                      baseWorkflowId,
                      shiftIntelligence: runtimeShiftIntelligence,
                      assignedNodes: block.assignedNodes || [],
                      assignedNodeSummary: block.assignedNodeSummary || "",
                    };
                    const assignedWorkflowSteps = buildPrecomputedAssignedWorkflowSteps(fieldContextBase);
                    const blockConfig = getWorkflowInputSectionConfig(baseWorkflowId);
                    const fieldContext = {
                      ...fieldContextBase,
                      assignedWorkflowSteps,
                      localWorkflowEyebrow: blockConfig ? getWorkflowEyebrow(baseWorkflowId) : "",
                    };
                    const blockScoreConfig = getDocumentationScoreConfig(fieldContext);

                    return (
                      <View
                        key={block.id}
                        style={[
                          styles.docGroupedItem,
                          index < group.blocks.length - 1 ? styles.docGroupedItemWithDivider : null,
                        ]}
                      >
                        <Text style={styles.docWorkflowTag}>{getWorkflowEyebrow(workflowId)}</Text>
                        <DocumentationDropdown
                          value={block.score}
                          options={blockScoreConfig.options}
                          placeholder={blockScoreConfig.placeholder || "Select Score"}
                          onChange={(score) => updateTimeBlock(block.id, { score })}
                          dropdownId={`time-${block.id}-score`}
                          activeDropdown={activeDropdown}
                          onToggleDropdown={setActiveDropdown}
                        />
                        <DocumentationCommentField
                          fieldId={`time-${block.id}`}
                          fieldContext={fieldContext}
                          value={block.comment}
                          onChange={(comment) => updateTimeBlock(block.id, { comment })}
                          expanded={!!expandedAreas[`time-${block.id}`]}
                          onToggleExpanded={() => toggleExpanded(`time-${block.id}`)}
                          {...getCommentAssistProps(`time-${block.id}`, fieldContext, block.comment)}
                          onAssistActivity={handleCommentAssistActivity}
                        />
                      </View>
                    );
                  })}
                </View>
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
              onChange={(shiftSummary) => patchSession({ shiftSummary, dspValidationQuizPassed: false })}
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
                Generate a detailed handover note for the next shift, then add any extra transition details and mark
                which vital signs were addressed before opening the handover print view.
              </Text>
              {session.handover?.generatedNote ? (
                <>
                  <Text style={styles.docReviewInputLabel}>Generated handover note</Text>
                  <Text style={styles.docValidationQuizExcerpt}>{session.handover.generatedNote}</Text>
                </>
              ) : null}
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
                <Pressable style={[styles.docActionButton, styles.docActionPrimary]} onPress={openHandoverWorkflow}>
                  <Text style={styles.docActionPrimaryText}>Generate Handover Note</Text>
                </Pressable>
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

      <Modal transparent visible={submitHandoverPromptVisible} animationType="fade" onRequestClose={() => setSubmitHandoverPromptVisible(false)}>
        <View style={styles.docValidationQuizRoot}>
          <Pressable style={styles.docValidationQuizBackdrop} onPress={() => setSubmitHandoverPromptVisible(false)} />
          <View style={styles.docValidationQuizCard}>
            <Text style={styles.docValidationQuizEyebrow}>Generate Handover Note?</Text>
            <Text style={styles.docValidationQuizPrompt}>
              Do you want DocuWraite to generate a detailed handover note for the next shift?
            </Text>
            <Text style={styles.docValidationQuizExcerpt}>
              Choosing Yes will submit the documentation, mark handover as required, and open the handover workflow next.
            </Text>
            <View style={styles.docCommentToolActions}>
              <Pressable
                style={styles.docCommentToolPrimary}
                onPress={() => {
                  setSubmitHandoverPromptVisible(false);
                  finalizeDocumentationSubmission({ requireHandover: true });
                  openHandoverWorkflow();
                }}
              >
                <Text style={styles.docCommentToolPrimaryText}>Yes, generate it</Text>
              </Pressable>
              <Pressable
                style={styles.docCommentToolSecondary}
                onPress={() => {
                  setSubmitHandoverPromptVisible(false);
                  finalizeDocumentationSubmission({ requireHandover: false });
                }}
              >
                <Text style={styles.docCommentToolSecondaryText}>No, submit only</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={validationQuizState.visible} animationType="fade" onRequestClose={closeValidationQuiz}>
        <View style={styles.docValidationQuizRoot}>
          <Pressable style={styles.docValidationQuizBackdrop} onPress={closeValidationQuiz} />
          <View style={styles.docValidationQuizCard}>
            <Text style={styles.docValidationQuizEyebrow}>DSP Awareness Check</Text>
            <Text style={styles.docValidationQuizProgress}>
              {`Question ${Math.min(validationQuizState.currentIndex + 1, validationQuizState.questions.length)} of ${validationQuizState.questions.length}`}
            </Text>
            {validationQuizState.questions[validationQuizState.currentIndex] ? (
              <>
                <Text style={styles.docValidationQuizSource}>
                  {validationQuizState.questions[validationQuizState.currentIndex].source}
                </Text>
                <Text style={styles.docValidationQuizPrompt}>
                  {validationQuizState.questions[validationQuizState.currentIndex].prompt}
                </Text>
                {validationQuizState.showCorrect ? (
                  <Animated.View
                    style={[
                      styles.docValidationQuizSuccessBadge,
                      { transform: [{ scale: validationQuizSuccessScale }] },
                    ]}
                  >
                    <Text style={styles.docValidationQuizSuccessCheck}>✓</Text>
                    <Text style={styles.docValidationQuizSuccessText}>Correct</Text>
                  </Animated.View>
                ) : null}
                {validationQuizState.feedback ? (
                  <Text
                    style={[
                      styles.docValidationQuizFeedback,
                      validationQuizState.showCorrect ? styles.docValidationQuizFeedbackCorrect : null,
                    ]}
                  >
                    {validationQuizState.feedback}
                  </Text>
                ) : null}
                <View style={styles.docValidationQuizChoiceList}>
                  {validationQuizState.questions[validationQuizState.currentIndex].choices.map((choice) => {
                    const isCorrectChoice =
                      String(choice) ===
                      String(validationQuizState.questions[validationQuizState.currentIndex].correctAnswer);
                    return (
                      <Pressable
                        key={`${validationQuizState.questions[validationQuizState.currentIndex].id}-${choice}`}
                        style={[
                          styles.docValidationQuizChoice,
                          validationQuizState.requireCorrectRetry && isCorrectChoice
                            ? styles.docValidationQuizChoiceCorrect
                            : null,
                        ]}
                        onPress={() => handleValidationQuizAnswer(choice)}
                      >
                        <Text
                          style={[
                            styles.docValidationQuizChoiceText,
                            validationQuizState.requireCorrectRetry && isCorrectChoice
                              ? styles.docValidationQuizChoiceTextCorrect
                              : null,
                          ]}
                        >
                          {choice}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}
            <View style={styles.docValidationQuizFooter}>
              <Pressable onPress={closeValidationQuiz}>
                <Text style={styles.docValidationQuizClose}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
                  titleTextStyle={styles.intelCompactTitleText}
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

function DecisionWhatsNextGuide({ guide, onDismiss, onAction }) {
  if (!guide) {
    return null;
  }

  const steps =
    guide.type === "block-added"
      ? [
          ...(guide.canAddSiblingJob
            ? [{ action: "sibling", label: `Optional: add another job at ${guide.slotLabel}` }]
            : []),
          { action: "target", label: `Review target — ${guide.targetLabel}` },
          ...(guide.siblingJobCount > 1
            ? [
                {
                  action: "target",
                  label: `${guide.slotLabel} has ${guide.siblingJobCount} jobs — review each job and confirm the note prompt is correct`,
                },
              ]
            : []),
          { action: "schedule", label: "Return to Schedule when you are ready to add or edit more blocks" },
        ]
      : guide.type === "row-added"
        ? [
            { action: "target", label: `Review row — ${guide.targetLabel}` },
            { action: "schedule", label: "Optional: add timeline blocks in Schedule above" },
            { action: "schedule", label: "Return to setup when you are ready to add or edit more rows" },
          ]
        : [];

  return (
    <View style={styles.decisionGuideNote}>
      <View style={styles.decisionGuideNoteHeader}>
        <Text style={styles.decisionGuideNoteTitle}>What&apos;s next?</Text>
        <Pressable onPress={onDismiss} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.decisionGuideNoteDismiss}>Dismiss</Text>
        </Pressable>
      </View>
      {guide.lead ? <Text style={styles.decisionGuideNoteLead}>{guide.lead}</Text> : null}
      {steps.map((step, index) => (
        <Pressable
          key={`${guide.type}-${step.action}-${index}`}
          onPress={() => onAction(step.action, guide)}
          accessibilityRole="button"
          style={styles.decisionGuideNoteStepPress}
        >
          <Text style={styles.decisionGuideNoteStep}>
            {`${index + 1}. `}
            <Text style={styles.decisionGuideNoteStepLink}>{step.label}</Text>
          </Text>
        </Pressable>
      ))}
    </View>
  );
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
  clientProfile = null,
  initialTargetKey = "",
  initialSelectionState = null,
  onScheduleChange,
  onRowsChange,
  onSelectionStateChange,
  externalAssignmentHint = "",
}) {
  const { width } = useWindowDimensions();
  const showLegacyAssignmentTools = false;
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
  const [assignmentScopeMode, setAssignmentScopeMode] = useState(ASSIGNMENT_SCOPE_TARGET);
  const [selectedDocCategoryIds, setSelectedDocCategoryIds] = useState([]);
  const [activeWorkflowLink, setActiveWorkflowLink] = useState("schedule");

  const decisionWorkflowLinks = [
    {
      id: "schedule",
      title: "Schedule",
      detail: "Timeline blocks and rows set the supervisor-defined documentation structure.",
      anchorId: "decision-workflow-schedule",
    },
    {
      id: "target",
      title: "Target",
      detail: "Review the block or row you are configuring for the DSP.",
      anchorId: "decision-workflow-target",
    },
  ];

  const scrollToWorkflowAnchor = (anchorId, linkId) => {
    setActiveWorkflowLink(linkId);
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  const [collapsedDecisionSections, setCollapsedDecisionSections] = useState(
    initialSelectionState?.collapsedSections || {}
  );
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
  const [builderGuide, setBuilderGuide] = useState(null);
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
  const [blockGuidedAdlPrompt, setBlockGuidedAdlPrompt] = useState(buildInitialGuidedAdlPromptState);
  const [rowGuidedAdlPrompt, setRowGuidedAdlPrompt] = useState(buildInitialGuidedAdlPromptState);
  const [assignmentHint, setAssignmentHint] = useState("");
  const [lastSmartSelect, setLastSmartSelect] = useState(null);
  const [stagedAssignmentsExpandAll, setStagedAssignmentsExpandAll] = useState(false);
  const [finalizedAssignmentsExpandAll, setFinalizedAssignmentsExpandAll] = useState(false);
  const libraryHelpButtonRef = useRef(null);
  const rowWorkflowTouchedRef = useRef(false);
  const blockPromptRequestRef = useRef(0);
  const rowPromptRequestRef = useRef(0);
  const blockPromptEngagedRef = useRef(false);
  const rowPromptEngagedRef = useRef(false);
  const suppressBlockPromptAutoOpenRef = useRef(false);
  const blockPromptTypedRef = useRef(false);
  const blockPromptIdleTimerRef = useRef(null);
  const rowPromptIdleTimerRef = useRef(null);
  const suppressBuilderHydrationRef = useRef({ block: false, row: false });
  const workflowOptions = WORKFLOW_SCHEDULE_OPTIONS;
  const blockPromptCategory =
    workflowOptions.find((option) => option.workflowId === newBlockWorkflowId)?.promptCategory || "";
  const rowPromptCategory =
    workflowOptions.find((option) => option.workflowId === newRowWorkflowId)?.promptCategory || "";
  const blockUsesGuidedAdlPrompt = blockPromptCategory === "adl";
  const rowUsesGuidedAdlPrompt = rowPromptCategory === "adl";
  const assignmentTargets = [
    ...timeBlocks.map((block) => ({
      key: `time:${block.id}`,
      label: buildTimeBlockAssignmentTargetLabel(block, workflowOptions),
      type: "time-block",
      targetId: block.id,
      workflowId: String(block.workflowId || "").trim(),
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
  const liveBlockPromptSuggestions = useMemo(
    () => rankPromptTemplates(blockPromptSuggestions, newBlockDescription, blockPromptCategory),
    [blockPromptCategory, blockPromptSuggestions, newBlockDescription]
  );

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
    const seenBlockKeys = new Set();

    timeBlocks.forEach((block) => {
      const key = [String(block?.label || ""), String(block?.workflowId || "")].join("::");
      if (seenBlockKeys.has(key)) {
        return;
      }
      seenBlockKeys.add(key);
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
  }, [newBlockWorkflowId, workflowOptions]);

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

  useEffect(() => {
    if (suppressBlockPromptAutoOpenRef.current) {
      return;
    }
    if (!blockPromptTypedRef.current || !String(newBlockDescription).trim()) {
      return;
    }
    if (blockPromptLoading || blockPromptSuggestions.length || blockPromptError) {
      return;
    }
    loadBlockPromptSuggestions(newBlockWorkflowId);
  }, [
    blockPromptError,
    blockPromptLoading,
    blockPromptSuggestions.length,
    loadBlockPromptSuggestions,
    newBlockDescription,
    newBlockWorkflowId,
  ]);

  useEffect(() => {
    if (suppressBlockPromptAutoOpenRef.current) {
      return;
    }
    const shouldShow =
      blockPromptTypedRef.current &&
      String(newBlockDescription).trim() &&
      (blockPromptLoading || Boolean(blockPromptError) || liveBlockPromptSuggestions.length > 0);
    if (shouldShow) {
      setBlockPromptPopoverVisible(true);
    }
  }, [
    blockPromptError,
    blockPromptLoading,
    blockPromptPopoverVisible,
    liveBlockPromptSuggestions.length,
    newBlockDescription,
  ]);

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
  const libraryTooltipWidth = Math.min(280, Math.max(220, width - 32));
  const libraryTooltipLeft = libraryHelpFrame
    ? Math.max(16, Math.min(libraryHelpFrame.x - 8, width - libraryTooltipWidth - 16))
    : 16;
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
  const targetDropdownOptions = scopedTargets.map((target) => {
    if (target.type === "time-block") {
      const block = timeBlocks.find((entry) => entry.id === target.targetId);
      const description = String(block?.description || "").trim();
      return {
        value: target.key,
        label: target.label,
        meta: description.length > 72 ? `${description.slice(0, 69)}…` : description,
      };
    }
    return {
      value: target.key,
      label: target.label,
      meta: "",
    };
  });

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
  const branchDropdownOptions =
    includeMode === "selective-branch"
      ? getBranchingBranchDropdownOptions()
      : getDecisionBranchOptions(noteTypeScopedLibraryNodes);
  const depthDropdownOptions = DECISION_DEPTH_OPTIONS;

  const primaryFilteredNodes = noteTypeScopedLibraryNodes.filter((node) => {
    if (includeMode === "full-branch") {
      return true;
    }

    const branchKey = getDecisionNodeBranchKey(node.id);
    const nodeDepth = getDecisionNodeDepth(node.id);
    const matchesBranch = !selectedBranchKey || branchKey === String(selectedBranchKey);
    const matchesDepth = !selectedDepth || nodeDepth <= Number(selectedDepth);
    return matchesBranch && matchesDepth;
  });

  const branchingFollowUpNodes =
    includeMode === "selective-branch"
      ? getBranchingFollowUpNodes(decisionNodes.libraries, {
          noteType: activeNoteType,
          branchKey: selectedBranchKey,
          depth: selectedDepth,
          includeMode,
        })
      : [];

  const visibleLibraryNodes = [...primaryFilteredNodes, ...branchingFollowUpNodes];

  useEffect(() => {
    if (includeMode === "selective-branch" && !selectedBranchKey && branchDropdownOptions.length) {
      setSelectedBranchKey(branchDropdownOptions[0].value);
    }
  }, [includeMode, selectedBranchKey, branchDropdownOptions]);

  useEffect(() => {
    const normalized = normalizeDecisionNoteType(selectedNoteType);
    if (normalized !== selectedNoteType) {
      setSelectedNoteType(normalized);
    }
  }, [selectedNoteType]);

  useEffect(() => {
    const normalizedNoteType = normalizeDecisionNoteType(selectedNoteType);
    setTargetType(getDefaultTargetTypeForNoteType(normalizedNoteType, selectedLibrary));
    if (selectedLibrary !== "aidraft" && normalizedNoteType === "orders") {
      setSelectedNoteType("block-time");
    }
  }, [selectedLibrary, selectedNoteType]);

  const noteTypeTemplateHint = getNoteTypeTemplateHint(selectedLibrary, activeNoteType);
  const noteTypeSelectionGuidance = getNoteTypeSelectionGuidance(targetType, activeNoteType);

  const handleTargetTypeChange = (nextTargetType) => {
    setTargetType(nextTargetType);
    setSelectedNoteType((current) => {
      if (nextTargetType === "case-note-row") {
        return "row-note";
      }
      return current === "row-note" ? getRecommendedNoteTypeForTarget("time-block") : current;
    });
  };

  const handleTargetKeyChange = (nextTargetKey) => {
    setSelectedTargetKey(nextTargetKey);
    if (String(nextTargetKey).startsWith("row:")) {
      setTargetType("case-note-row");
      setSelectedNoteType("row-note");
      return;
    }
    if (String(nextTargetKey).startsWith("time:")) {
      setTargetType("time-block");
      setSelectedNoteType((current) => (current === "row-note" ? "block-time" : current));
    }
  };
  const decisionAssignments = useMemo(
    () => [...stagedAssignments, ...finalizedAssignments],
    [stagedAssignments, finalizedAssignments]
  );

  const timeBlocksWithAssignedQuestions = useMemo(() => {
    const assignedIds = new Set();
    timeBlocks.forEach((block) => {
      if (timeBlockHasAssignedQuestions(decisionAssignments, block.id)) {
        assignedIds.add(block.id);
      }
    });
    return assignedIds;
  }, [decisionAssignments, timeBlocks]);

  const profileForTargets = clientProfile || getMaryBetProfile();

  const assignmentTargetContext = useMemo(
    () =>
      buildAssignmentTargetContext({
        selectedTargetKey,
        targetType,
        timeBlocks,
        workflowOptions,
        resolveWorkflowId: (block) => getTimeBlockWorkflowId(block, profileForTargets),
        resolveBlockLabel: (block) => getTimeBlockLabelValue(block),
        resolveWorkflowLabel: (block) => getTimeBlockWorkflowTagLabel(block, workflowOptions),
      }),
    [selectedTargetKey, targetType, timeBlocks, profileForTargets]
  );

  const nodeKeysOnOtherTimeBlocks = useMemo(() => {
    if (targetType !== "time-block" || !selectedTargetKey) {
      return new Set();
    }
    return collectNodeKeysOnOtherTimeBlocks(decisionAssignments, selectedTargetKey);
  }, [decisionAssignments, selectedTargetKey, targetType]);

  const crossSystemOverlays = useMemo(
    () => extractCrossSystemsFromClientProfile(clientProfile),
    [clientProfile]
  );

  const selectableNodes = useMemo(
    () =>
      resolveNodesForAssignmentScope(visibleLibraryNodes, {
        targetContext: assignmentTargetContext,
        scopeMode: assignmentScopeMode,
        keysOnOtherTimeBlocks: nodeKeysOnOtherTimeBlocks,
        buildKey: buildDecisionNodeSelectionKey,
        selectedCategoryIds: selectedDocCategoryIds,
        crossSystemOverlays,
      }),
    [
      visibleLibraryNodes,
      assignmentTargetContext,
      assignmentScopeMode,
      nodeKeysOnOtherTimeBlocks,
      selectedDocCategoryIds,
      crossSystemOverlays,
    ]
  );

  const workflowCategoryOptions = useMemo(() => {
    if (
      assignmentTargetContext?.targetType !== "time-block" ||
      !assignmentTargetContext?.workflowId
    ) {
      return [];
    }
    return getCategoriesForWorkflow(assignmentTargetContext.workflowId);
  }, [assignmentTargetContext]);

  const workflowScopedNodes = useMemo(
    () => filterNodesForAssignmentTarget(visibleLibraryNodes, assignmentTargetContext),
    [visibleLibraryNodes, assignmentTargetContext]
  );

  const assignmentScopeStats = useMemo(() => {
    const hiddenByTarget =
      assignmentScopeMode === ASSIGNMENT_SCOPE_TARGET && assignmentTargetContext
        ? Math.max(0, visibleLibraryNodes.length - workflowScopedNodes.length)
        : 0;
    const hiddenByDedupe = Math.max(0, workflowScopedNodes.length - selectableNodes.length);
    return { hiddenByTarget, hiddenByDedupe };
  }, [
    assignmentScopeMode,
    assignmentTargetContext,
    visibleLibraryNodes.length,
    workflowScopedNodes.length,
    selectableNodes.length,
  ]);

  const assignmentScopeHint = getAssignmentScopeHint(assignmentTargetContext, assignmentScopeMode, {
    ...assignmentScopeStats,
    selectedCategoryIds: selectedDocCategoryIds,
    crossSystemCount: crossSystemOverlays.length,
  });

  const sections = useMemo(() => {
    const useCategoryGroups =
      assignmentTargetContext?.targetType === "time-block" &&
      assignmentTargetContext?.workflowId &&
      assignmentScopeMode === ASSIGNMENT_SCOPE_TARGET;

    if (useCategoryGroups) {
      return groupNodesByDocumentationCategory(
        selectableNodes,
        assignmentTargetContext.workflowId
      ).reduce((acc, group) => {
        acc[group.label] = group.nodes;
        return acc;
      }, {});
    }

    return selectableNodes.reduce((acc, node) => {
      const sectionKey = node.section || "Uncategorized";
      if (!acc[sectionKey]) {
        acc[sectionKey] = [];
      }
      acc[sectionKey].push(node);
      return acc;
    }, {});
  }, [selectableNodes, assignmentTargetContext, assignmentScopeMode]);
  const decisionSectionKeys = Object.keys(sections).sort().join("|");

  const allNodes = selectableNodes;
  const allNodesByKey = new Map(allNodes.map((node) => [buildDecisionNodeSelectionKey(node), node]));
  const selectedCount = allNodes.filter((node) => checkedNodes[buildDecisionNodeSelectionKey(node)]).length;

  useEffect(() => {
    setAssignmentScopeMode(ASSIGNMENT_SCOPE_TARGET);
  }, [selectedTargetKey, targetType]);

  useEffect(() => {
    setSelectedDocCategoryIds([]);
  }, [selectedTargetKey, assignmentTargetContext?.workflowId]);

  useEffect(() => {
    if (!assignmentTargetContext) {
      return;
    }
    const allowed = new Set(allNodes.map((node) => buildDecisionNodeSelectionKey(node)));
    setCheckedNodes((prev) => {
      let changed = false;
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (next[key] && !allowed.has(key)) {
          delete next[key];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [selectedTargetKey, decisionSectionKeys, assignmentScopeMode]);

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

  const isDecisionSectionExpanded = (sectionKey) => collapsedDecisionSections[sectionKey] === false;

  const decisionSectionBulkLabel = useMemo(() => {
    const keys = Object.keys(sections);
    if (!keys.length) {
      return "";
    }
    const openCount = keys.filter((sectionKey) => isDecisionSectionExpanded(sectionKey)).length;
    if (openCount === 0) {
      return "All closed";
    }
    if (openCount === keys.length) {
      return "All open";
    }
    return `${openCount} open`;
  }, [sections, collapsedDecisionSections]);

  useEffect(() => {
    setCollapsedDecisionSections((prev) => {
      const next = { ...prev };
      Object.keys(sections).forEach((sectionKey) => {
        if (!(sectionKey in next)) {
          next[sectionKey] = true;
        }
      });
      return Object.fromEntries(Object.entries(next).filter(([key]) => key in sections));
    });
  }, [decisionSectionKeys]);

  useEffect(() => {
    setCollapsedDecisionSections(() => {
      const next = {};
      Object.keys(sections).forEach((sectionKey) => {
        next[sectionKey] = true;
      });
      return next;
    });
  }, [selectedLibrary, activeNoteType]);

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
      collapsedSections: collapsedDecisionSections,
    });
  }, [
    checkedNodes,
    choiceSelections,
    collapsedDecisionSections,
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

  const tryToggleDecisionNode = (node) => {
    if (isDecisionConditionalNode(node)) {
      return;
    }
    const nodeKey = buildDecisionNodeSelectionKey(node);
    if (targetType === "time-block" && nodeKeysOnOtherTimeBlocks.has(nodeKey)) {
      setAssignmentHint("This question is already assigned on another time block.");
      return;
    }
    const assignStatus = getNodeAssignmentStatus(node, decisionAssignments, selectedTargetKey);
    if (assignStatus.status === "blocked") {
      setAssignmentHint(assignStatus.message);
      return;
    }
    toggleNode(nodeKey);
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
    const sectionStatus = getSectionAssignmentStatus(
      selectedLibrary,
      sectionKey,
      decisionAssignments,
      selectedTargetKey
    );
    if (sectionStatus.status === "blocked") {
      setAssignmentHint(sectionStatus.message);
      return;
    }

    const sectionNodes = sections[sectionKey] || [];
    const selectableNodes = sectionNodes.filter(
      (node) =>
        !isDecisionConditionalNode(node) &&
        getNodeAssignmentStatus(node, decisionAssignments, selectedTargetKey).status !== "blocked"
    );
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
    runDecisionSectionLayoutAnimation();
    setCollapsedDecisionSections((prev) => ({
      ...prev,
      [sectionKey]: prev[sectionKey] === false,
    }));
  };

  const setDecisionSectionView = (sectionKey, viewValue) => {
    runDecisionSectionLayoutAnimation();
    setCollapsedDecisionSections((prev) => ({
      ...prev,
      [sectionKey]: viewValue !== "open",
    }));
  };

  const expandAllDecisionSections = () => {
    runDecisionSectionLayoutAnimation();
    setCollapsedDecisionSections((prev) => {
      const next = { ...prev };
      Object.keys(sections).forEach((sectionKey) => {
        next[sectionKey] = false;
      });
      return next;
    });
  };

  const collapseAllDecisionSections = () => {
    runDecisionSectionLayoutAnimation();
    setCollapsedDecisionSections((prev) => {
      const next = { ...prev };
      Object.keys(sections).forEach((sectionKey) => {
        next[sectionKey] = true;
      });
      return next;
    });
  };

  const handleDecisionSectionBulkView = (value) => {
    if (value === "expand-all") {
      expandAllDecisionSections();
      return;
    }
    if (value === "collapse-all") {
      collapseAllDecisionSections();
    }
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
    const duplicateWorkflowBlock = timeBlocks.some(
      (block) => block.label === nextLabel && String(block.workflowId || "") === String(newBlockWorkflowId || "")
    );
    if (duplicateWorkflowBlock) {
      const selectedWorkflowLabel =
        workflowOptions.find((option) => option.workflowId === newBlockWorkflowId)?.label || "workflow";
      setScheduleBuilderHint(`That ${selectedWorkflowLabel} timeline block already exists for ${nextLabel}.`);
      setBuilderGuide(null);
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
    const blocksAtSlot = [...timeBlocks, nextBlock].filter((block) => block.label === nextLabel);
    const siblingJobCount = blocksAtSlot.length;
    const usedWorkflowIdsAtSlot = new Set(
      blocksAtSlot.map((block) => String(block.workflowId || "")).filter(Boolean)
    );
    const canAddSiblingJob = workflowOptions.some((option) => !usedWorkflowIdsAtSlot.has(option.workflowId));
    const targetLabel = buildTimeBlockAssignmentTargetLabel(nextBlock, workflowOptions);
    setBuilderGuide({
      type: "block-added",
      lead: `Added ${targetLabel}. Tap a step below or use the workflow links (Schedule → Target → Assign → Lock).`,
      targetKey: `time:${nextBlock.id}`,
      targetLabel,
      slotLabel: nextLabel,
      blockId: nextBlock.id,
      siblingJobCount,
      canAddSiblingJob,
    });
    setBlockDraftsByWorkflow((prev) => ({
      ...prev,
      [newBlockWorkflowId]: "",
    }));
    setBlockBuilderHint("");
    closeBlockPromptPopover();
  };

  const groupedScheduleBlocks = useMemo(() => groupTimeBlocksByLabel(timeBlocks), [timeBlocks]);

  const prepareSameTimeAnotherJob = (sourceBlock) => {
    const { startHour, endHour } = parseScheduleBlockHours(sourceBlock);
    const slotLabel = sourceBlock.label || buildScheduleBlockLabel(startHour, endHour);
    setNewBlockStartHour(startHour);
    setNewBlockEndHour(endHour);

    const usedWorkflowIds = new Set(
      timeBlocks
        .filter((block) => block.label === slotLabel)
        .map((block) => String(block.workflowId || ""))
        .filter(Boolean)
    );
    const nextOption = workflowOptions.find((option) => !usedWorkflowIds.has(option.workflowId));
    if (nextOption) {
      setNewBlockWorkflowId(nextOption.workflowId);
    }

    const usedLabels = workflowOptions
      .filter((option) => usedWorkflowIds.has(option.workflowId))
      .map((option) => option.label)
      .join(", ");

    setScheduleBuilderHint(
      nextOption
        ? `Same time (${slotLabel}): describe ${nextOption.label}, then tap Add Block. Already scheduled: ${usedLabels || "none"}.`
        : `Every job type is already on ${slotLabel}. Use a different time range or remove a block.`
    );
    setBuilderGuide(null);
    scrollToWorkflowAnchor("decision-workflow-schedule", "schedule");
  };

  const handleBuilderGuideAction = (action, guide) => {
    if (!guide) {
      return;
    }

    switch (action) {
      case "target":
        if (guide.targetKey) {
          setSelectedTargetKey(guide.targetKey);
          setTargetType(guide.targetKey.startsWith("row:") ? "case-note-row" : "time-block");
        }
        scrollToWorkflowAnchor("decision-workflow-target", "target");
        break;
      case "assign":
        scrollToWorkflowAnchor("decision-workflow-assign", "assign");
        break;
      case "lock":
        scrollToWorkflowAnchor("decision-workflow-lock", "lock");
        break;
      case "final":
        scrollToWorkflowAnchor("decision-workflow-final", "lock");
        break;
      case "schedule":
        scrollToWorkflowAnchor("decision-workflow-schedule", "schedule");
        break;
      case "sibling": {
        const block = timeBlocks.find((entry) => entry.id === guide.blockId);
        if (block) {
          prepareSameTimeAnotherJob(block);
        }
        break;
      }
      default:
        break;
    }
  };

  const removeScheduleBlock = (blockId) => {
    const nextBlocks = timeBlocks.filter((block) => block.id !== blockId);
    onScheduleChange?.(nextBlocks);
    if (selectedTargetKey === `time:${blockId}`) {
      setSelectedTargetKey(nextBlocks[0] ? `time:${nextBlocks[0].id}` : "");
    }
    if (!nextBlocks.length || builderGuide?.blockId === blockId) {
      setBuilderGuide(null);
    }
  };

  const handleBlockWorkflowOptionPress = (workflowId) => {
    suppressBlockPromptAutoOpenRef.current = false;
    blockPromptTypedRef.current = false;
    setNewBlockWorkflowId(workflowId);
    setBlockGuidedAdlPrompt(buildInitialGuidedAdlPromptState());
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

    suppressBlockPromptAutoOpenRef.current = true;
    blockPromptTypedRef.current = false;
    markBlockPromptEngaged();
    setBlockPromptPopoverVisible(false);

    setBlockDraftsByWorkflow((prev) => {
      return {
        ...prev,
        [newBlockWorkflowId]: String(promptText).trim(),
      };
    });
    setBlockBuilderHint("");
    closeBlockPromptPopover();
  };

  const toggleGuidedAdlRisk = (value, setter) => {
    setter((current) => ({
      ...current,
      risks: current.risks.includes(value)
        ? current.risks.filter((item) => item !== value)
        : [...current.risks, value],
    }));
  };

  const applyBlockGuidedAdlPrompt = () => {
    applyBlockPromptSuggestion(buildGuidedAdlPromptText(blockGuidedAdlPrompt));
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
    const rowDescription = String(newRowDescription).trim();
    const rowTargetLabel =
      rowDescription.length > 72 ? `${rowDescription.slice(0, 72)}…` : rowDescription;
    setBuilderGuide({
      type: "row-added",
      lead: `Added row "${rowDescription}". Tap a step below to jump to Target, Assign, or Lock.`,
      targetKey: `row:${nextRow.id}`,
      targetLabel: rowTargetLabel || "Case-note row",
    });
    setRowBuilderHint("");
    closeRowPromptPopover();
  };

  const handleWorkflowOptionPress = (workflowId) => {
    rowWorkflowTouchedRef.current = true;
    setNewRowWorkflowId(workflowId);
    setRowGuidedAdlPrompt(buildInitialGuidedAdlPromptState());
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
    closeRowPromptPopover();
  };

  const applyRowGuidedAdlPrompt = () => {
    applyRowPromptSuggestion(buildGuidedAdlPromptText(rowGuidedAdlPrompt));
  };

  const removeRowTarget = (rowId) => {
    const nextRows = rowTargets.filter((row) => row.id !== rowId);
    onRowsChange?.(nextRows);
    if (selectedTargetKey === `row:${rowId}`) {
      setSelectedTargetKey(nextRows[0] ? `row:${nextRows[0].id}` : "");
    }
    if (!nextRows.length || builderGuide?.targetKey === `row:${rowId}`) {
      setBuilderGuide(null);
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

  const isNodeSelectableForAssignment = (node) =>
    !isDecisionConditionalNode(node) &&
    getNodeAssignmentStatus(node, decisionAssignments, selectedTargetKey).status !== "blocked";

  const buildSmartSelectSummaryItems = (keys = []) => {
    const nodesByKey = new Map(allNodes.map((node) => [buildDecisionNodeSelectionKey(node), node]));

    return keys.map((key) => {
      const node = nodesByKey.get(key);
      const question = node ? getDecisionNodeDisplayQuestion(node) || node.title || node.id : key;
      const section = node?.section ? String(node.section).replace(/^[A-Z]\.\s*/, "") : "";
      return {
        key,
        question,
        section,
        label: section ? `${section}: ${question}` : question,
      };
    });
  };

  const applySmartSelect = (presetId) => {
    const { keys, message, preset } = buildSmartSelection(allNodes, presetId, {
      isSelectable: isNodeSelectableForAssignment,
      capDepth: Number(selectedDepth) || 99,
      buildKey: buildDecisionNodeSelectionKey,
      targetContext: assignmentTargetContext,
      clientProfile,
      crossSystemOverlays,
    });

    setCheckedNodes((prev) => {
      const next = { ...prev };
      allNodes.forEach((node) => {
        delete next[buildDecisionNodeSelectionKey(node)];
      });
      keys.forEach((key) => {
        next[key] = true;
      });
      return next;
    });

    if (keys.length) {
      setLastSmartSelect({
        presetId: preset.id,
        presetLabel: preset.label,
        keys,
        items: buildSmartSelectSummaryItems(keys),
      });
    } else {
      setLastSmartSelect(null);
    }

    let hint = message;
    if (
      presetId === "complete" &&
      includeMode === "selective-branch" &&
      keys.length > 0 &&
      keys.length < 15
    ) {
      hint += " Only a few refusal/branch questions are visible — switch to Full branch, Block time, and Baseplan or Careplan for a full shift pack.";
    }
    setAssignmentHint(hint);
  };

  const cancelSmartSelect = () => {
    if (!lastSmartSelect?.keys?.length) {
      setLastSmartSelect(null);
      return;
    }

    const removedCount = lastSmartSelect.keys.length;
    setCheckedNodes((prev) => {
      const next = { ...prev };
      lastSmartSelect.keys.forEach((key) => {
        delete next[key];
      });
      return next;
    });
    setLastSmartSelect(null);
    setAssignmentHint(`Removed Smart select (${lastSmartSelect.presetLabel}): ${removedCount} question(s) unchecked.`);
  };

  const clearVisibleSelection = () => {
    setCheckedNodes((prev) => {
      const next = { ...prev };
      allNodes.forEach((node) => {
        delete next[buildDecisionNodeSelectionKey(node)];
      });
      return next;
    });
    setLastSmartSelect(null);
    setAssignmentHint("Cleared selection for visible questions.");
  };

  useEffect(() => {
    setLastSmartSelect(null);
  }, [selectedLibrary, activeNoteType, includeMode, selectedBranchKey, selectedDepth]);

  const handleStageCurrentSelection = () => {
    const selectedKeys = Object.keys(checkedNodes).filter(
      (key) => checkedNodes[key] && allNodesByKey.has(key)
    );
    if (!selectedKeys.length) {
      setAssignmentHint("Select at least one question before locking this library. Try Smart select if you need a quick starting set.");
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
    const stageTarget = {
      ...selectedTargetOption,
      description: String(matchedBlock?.description || matchedRow?.description || "").trim(),
      workflowId: matchedBlock?.workflowId || matchedRow?.workflowId || "",
    };
    onStageAssignment?.({
      id: `staged-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      selectedLibrary,
      selectedNoteType,
      selectedDepth,
      includeMode,
      selectedBranchKey,
      selectedCount: payload.length,
      selectedNodesPayload: payload,
      target: stageTarget,
      assignmentContract: buildAssignmentContract({
        targetContext: assignmentTargetContext,
        categoryIds: selectedDocCategoryIds,
        maxDepth: Number(selectedDepth) || 2,
        selectedNodeKeys: selectedKeys,
        librarySlug: selectedLibrary,
        noteType: selectedNoteType,
        includeMode,
        branchingBranchKey: selectedBranchKey,
        status: "locked",
      }),
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
    <Card title="Decision Engine Supervisor Setup" containerStyle={styles.decisionCard} bodyStyle={styles.decisionCardBody}>
      <View
        nativeID="decision-workflow-schedule"
        collapsable={false}
        style={[
          styles.decisionScheduleEditor,
          styles.decisionScheduleEditorBlockBuilder,
          (rowPromptPopoverVisible || blockPromptPopoverVisible) && styles.decisionScheduleEditorOverlayActive,
        ]}
      >
        <Text style={styles.decisionScheduleTitle}>Schedule Builder</Text>
        <Text style={styles.decisionScheduleLead}>
          Supervisors define the case-note timeline here. The same hour can have multiple jobs — for example 7am–8am Behavior and 7am–8am
          Communication are two separate blocks for the DSP to document.
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
          <Pressable style={[styles.decisionAssignButton, styles.decisionAssignButtonBlock]} onPress={addScheduleBlock}>
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
                suppressBlockPromptAutoOpenRef.current = false;
                blockPromptTypedRef.current = Boolean(String(text).trim());
                if (String(text).trim()) {
                  setBlockBuilderHint("");
                }
                if (String(text).trim()) {
                  markBlockPromptEngaged();
                } else {
                  setBlockPromptPopoverVisible(false);
                }
              }}
              onFocus={() => {
                blockPromptEngagedRef.current = false;
              }}
              onBlur={() => {
                blockPromptEngagedRef.current = false;
                scheduleBlockPromptIdleClose();
              }}
              placeholder="Describe what DSP should document in this time block."
              placeholderTextColor="#888888"
              style={[styles.decisionRowInput, styles.decisionRowInputInPromptWrap]}
            />
            {blockPromptPopoverVisible ? (
              <View style={styles.decisionPromptSuggestionCard}>
                <View style={styles.decisionPromptSuggestionHeader}>
                  <Text style={styles.decisionPromptSuggestionTitle}>Suggestions</Text>
                  {blockPromptLoading ? (
                    <Text style={styles.decisionPromptSuggestionMeta}>Loading...</Text>
                  ) : blockPromptCategory ? (
                    <Text style={styles.decisionPromptSuggestionMeta}>{blockPromptCategory.toUpperCase()}</Text>
                  ) : null}
                </View>
                {blockPromptError ? (
                  <Text style={styles.decisionPromptSuggestionError}>{blockPromptError}</Text>
                ) : null}
                {liveBlockPromptSuggestions.length ? (
                  <View style={styles.decisionPromptSuggestionList}>
                    {liveBlockPromptSuggestions.map((suggestion) => (
                      <Pressable
                        key={suggestion}
                        accessibilityRole="button"
                        onPressIn={() => {
                          markBlockPromptEngaged();
                        }}
                        onPress={() => applyBlockPromptSuggestion(suggestion)}
                        style={styles.decisionPromptSuggestionItem}
                      >
                        <Text style={styles.decisionPromptSuggestionText}>{suggestion}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : !blockPromptLoading && !blockPromptError ? (
                  <Text style={styles.decisionPromptSuggestionEmpty}>
                    Keep typing or switch categories to refine suggestions.
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>
        {blockBuilderHint ? <Text style={styles.decisionInlineHint}>{blockBuilderHint}</Text> : null}
        <View style={styles.decisionWorkflowChipRow}>
          {workflowOptions.map((option) => (
            <Pressable
              key={`block-${option.workflowId}`}
              onPress={() => handleBlockWorkflowOptionPress(option.workflowId)}
              style={[
                styles.decisionOptionButton,
                newBlockWorkflowId === option.workflowId && styles.decisionOptionButtonActiveBlock,
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
        <Text style={styles.decisionScheduleSameTimeHint}>
          Same time, different job? Keep Start and End, tap another category (ADL, Communication, …), write the description, then Add Block again.
        </Text>
        {scheduleBuilderHint ? <Text style={styles.decisionInlineHint}>{scheduleBuilderHint}</Text> : null}
        {builderGuide?.type === "block-added" ? (
          <DecisionWhatsNextGuide
            guide={builderGuide}
            onDismiss={() => setBuilderGuide(null)}
            onAction={handleBuilderGuideAction}
          />
        ) : null}
        <Text style={styles.decisionBuilderListLabel}>Timeline blocks</Text>
        {timeBlocks.length ? (
          <View style={styles.decisionTimelineBlockList}>
            {groupedScheduleBlocks.map((group) => {
              const assignedJobsInGroup = group.blocks.filter((entry) =>
                timeBlocksWithAssignedQuestions.has(entry.id)
              ).length;
              const highlightMultiJobAssignments =
                group.blocks.length > 1 && assignedJobsInGroup > 1;

              return (
              <View key={group.label} style={styles.decisionTimelineGroup}>
                <View style={styles.decisionTimelineGroupHeader}>
                  <Text style={styles.decisionTimelineGroupTime}>{group.label}</Text>
                  {group.blocks.length > 1 ? (
                    <Text style={styles.decisionTimelineGroupCount}>{`${group.blocks.length} jobs`}</Text>
                  ) : null}
                </View>
                {group.blocks.map((block) => {
                  const workflowLabel =
                    workflowOptions.find((option) => option.workflowId === block.workflowId)?.label || "";
                  const blockDescription = String(block.description || "").trim();
                  const usedWorkflowIds = new Set(
                    group.blocks.map((entry) => String(entry.workflowId || "")).filter(Boolean)
                  );
                  const canAddSiblingJob = workflowOptions.some(
                    (option) => !usedWorkflowIds.has(option.workflowId)
                  );
                  const blockHasAssignedQuestions = timeBlocksWithAssignedQuestions.has(block.id);
                  const shouldHighlightBlock =
                    highlightMultiJobAssignments && blockHasAssignedQuestions;

                  return (
                    <View
                      key={block.id}
                      style={[
                        styles.decisionTimelineBlockCard,
                        shouldHighlightBlock && styles.decisionTimelineBlockCardMultiAssigned,
                      ]}
                    >
                      <View style={styles.decisionTimelineBlockHeader}>
                        <View style={styles.decisionTimelineBlockHeaderMain}>
                          {workflowLabel ? (
                            <Text style={styles.decisionTimelineBlockCategory}>{workflowLabel}</Text>
                          ) : null}
                          {shouldHighlightBlock ? (
                            <Text style={styles.decisionTimelineBlockAssignedBadge}>Questions assigned</Text>
                          ) : null}
                        </View>
                        <Pressable
                          style={styles.decisionScheduleChipAction}
                          accessibilityRole="button"
                          accessibilityLabel={`Remove ${group.label} ${workflowLabel} block`}
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
                      <View style={styles.decisionTimelineBlockActions}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => {
                            setSelectedTargetKey(`time:${block.id}`);
                            scrollToWorkflowAnchor("decision-workflow-target", "target");
                          }}
                          style={styles.decisionTimelineBlockLink}
                        >
                          <Text style={styles.decisionTimelineBlockLinkText}>Assign questions</Text>
                        </Pressable>
                        {canAddSiblingJob ? (
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => prepareSameTimeAnotherJob(block)}
                            style={styles.decisionTimelineBlockLink}
                          >
                            <Text style={styles.decisionTimelineBlockLinkText}>Add another job at this time</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.decisionTimelineBlockEmpty}>No timeline blocks yet. Add a time range and description above.</Text>
        )}
      </View>
      <View style={[styles.decisionScheduleEditor, styles.decisionScheduleEditorRowBuilder]}>
        <Text style={styles.decisionScheduleTitle}>Row Builder</Text>
        <Text style={styles.decisionScheduleLead}>
          Create the case-note rows the DSP will document. The row workflow itself now drives the DocuWraite question flow.
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
              style={[styles.decisionRowInput, styles.decisionRowInputInPromptWrap]}
            />
          </View>
        </View>
        {rowBuilderHint ? <Text style={styles.decisionInlineHint}>{rowBuilderHint}</Text> : null}
        {builderGuide?.type === "row-added" ? (
          <DecisionWhatsNextGuide
            guide={builderGuide}
            onDismiss={() => setBuilderGuide(null)}
            onAction={handleBuilderGuideAction}
          />
        ) : null}
        <View style={styles.decisionWorkflowChipRow}>
          {workflowOptions.map((option) => (
            <Pressable
              key={option.workflowId}
              onPress={() => handleWorkflowOptionPress(option.workflowId)}
              style={[
                styles.decisionOptionButton,
                newRowWorkflowId === option.workflowId && styles.decisionOptionButtonActiveRow,
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
          <Pressable
            style={[
              styles.decisionAssignButton,
              styles.decisionAssignButtonRow,
              styles.decisionWorkflowAddRowButton,
            ]}
            onPress={addRowTarget}
          >
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
      {showLegacyAssignmentTools ? (
      <View style={styles.decisionExplainerCard}>
        <Text style={styles.decisionExplainerTitle}>Assign workflow</Text>
        <View style={[styles.decisionWorkflowLinkRow, isPhone && styles.decisionWorkflowLinkRowPhone]}>
          {decisionWorkflowLinks.map((item, index) => (
            <React.Fragment key={item.id}>
              {index > 0 ? (
                <Text style={styles.decisionWorkflowLinkSep} accessibilityElementsHidden>
                  →
                </Text>
              ) : null}
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Go to ${item.title}: ${item.detail}`}
                onPress={() => scrollToWorkflowAnchor(item.anchorId, item.id)}
                style={styles.decisionWorkflowLinkHit}
              >
                <Text
                  style={[
                    styles.decisionWorkflowLink,
                    activeWorkflowLink === item.id && styles.decisionWorkflowLinkActive,
                  ]}
                >
                  {item.title}
                </Text>
              </Pressable>
            </React.Fragment>
          ))}
        </View>
        <Text style={styles.decisionWorkflowLinkDetail}>
          {decisionWorkflowLinks.find((item) => item.id === activeWorkflowLink)?.detail || ""}
        </Text>
      </View>
      ) : null}
      {showLegacyAssignmentTools ? (
      <View
        nativeID="decision-workflow-target"
        collapsable={false}
        style={[
          styles.decisionAssignForm,
          isPhone && styles.decisionAssignFormPhone,
          activeDecisionDropdown ? styles.decisionAssignFormActive : null,
        ]}
      >
        <View
          style={[
            styles.decisionToolbarColumn,
            styles.decisionToolbarColumnLibrary,
            isPhone && styles.decisionToolbarColumnPhone,
          ]}
        >
          <View style={styles.decisionToolbarLabelRow}>
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
            fieldStyle={styles.decisionDropdownToolbar}
          />
        </View>

        <View style={[styles.decisionToolbarColumn, isPhone && styles.decisionToolbarColumnPhone]}>
          <Text style={styles.decisionToolbarLabel}>Note Type</Text>
          <DecisionDropdown
            value={getDecisionOptionLabel(noteTypeDropdownOptions, activeNoteType)}
            options={noteTypeDropdownOptions}
            placeholder="Select note type"
            dropdownId="decision-note-type"
            activeDropdown={activeDecisionDropdown}
            onToggleDropdown={setActiveDecisionDropdown}
            onChange={setSelectedNoteType}
            fieldStyle={styles.decisionDropdownToolbar}
          />
        </View>

        <View style={[styles.decisionToolbarColumn, isPhone && styles.decisionToolbarColumnPhone]}>
          <Text style={styles.decisionToolbarLabel}>Mode</Text>
          <DecisionDropdown
            value={getDecisionOptionLabel(DECISION_MODE_OPTIONS, includeMode)}
            options={DECISION_MODE_OPTIONS}
            placeholder="Select mode"
            dropdownId="decision-mode"
            activeDropdown={activeDecisionDropdown}
            onToggleDropdown={setActiveDecisionDropdown}
            onChange={setIncludeMode}
            fieldStyle={styles.decisionDropdownToolbar}
          />
        </View>

        <View
          style={[
            styles.decisionToolbarColumn,
            styles.decisionToolbarColumnBranch,
            isPhone && styles.decisionToolbarColumnPhone,
          ]}
        >
          <Text style={styles.decisionToolbarLabel}>Branch</Text>
          <DecisionDropdown
            value={getDecisionOptionLabel(branchDropdownOptions, selectedBranchKey)}
            options={branchDropdownOptions}
            placeholder="Select branch"
            dropdownId="decision-branch"
            activeDropdown={activeDecisionDropdown}
            onToggleDropdown={setActiveDecisionDropdown}
            onChange={setSelectedBranchKey}
            fieldStyle={styles.decisionDropdownToolbar}
            disabled={includeMode === "full-branch"}
          />
        </View>

        <View
          style={[
            styles.decisionToolbarColumn,
            styles.decisionToolbarColumnDepth,
            isPhone && styles.decisionToolbarColumnPhone,
          ]}
        >
          <Text style={styles.decisionToolbarLabel}>Depth</Text>
          <DecisionDropdown
            value={getDecisionOptionLabel(depthDropdownOptions, selectedDepth)}
            options={depthDropdownOptions}
            placeholder="Select depth"
            dropdownId="decision-depth"
            activeDropdown={activeDecisionDropdown}
            onToggleDropdown={setActiveDecisionDropdown}
            onChange={(value) => setSelectedDepth(Number(value))}
            fieldStyle={styles.decisionDropdownToolbar}
            disabled={includeMode === "full-branch"}
          />
        </View>

        <View
          style={[
            styles.decisionToolbarColumn,
            styles.decisionToolbarColumnTarget,
            isPhone && styles.decisionToolbarColumnPhone,
          ]}
        >
          <Text style={styles.decisionToolbarLabel}>Target</Text>
          <View style={styles.decisionTargetRow}>
            <DecisionDropdown
              value={getDecisionOptionLabel(DECISION_TARGET_TYPE_OPTIONS, targetType)}
              options={DECISION_TARGET_TYPE_OPTIONS}
              placeholder="Select target type"
              dropdownId="decision-target-type"
              activeDropdown={activeDecisionDropdown}
              onToggleDropdown={setActiveDecisionDropdown}
              onChange={handleTargetTypeChange}
              fieldStyle={[styles.decisionDropdownToolbar, styles.decisionDropdownToolbarHalf]}
            />
            <DecisionDropdown
              value={
                selectedTarget && selectedTarget.type === targetType
                  ? selectedTarget.label
                  : ""
              }
              options={targetDropdownOptions}
              placeholder={targetType === "time-block" ? "Select schedule block" : "Select case-note row"}
              dropdownId="decision-target"
              activeDropdown={activeDecisionDropdown}
              onToggleDropdown={setActiveDecisionDropdown}
              onChange={handleTargetKeyChange}
              fieldStyle={[styles.decisionDropdownToolbar, styles.decisionDropdownToolbarHalf]}
              valueTextStyle={styles.decisionDropdownTargetValueText}
            />
          </View>
        </View>
      </View>
      ) : null}

      {showLegacyAssignmentTools && (noteTypeSelectionGuidance || noteTypeTemplateHint || includeMode) ? (
        <View style={styles.decisionToolbarHints}>
          {noteTypeSelectionGuidance ? (
            <Text style={styles.decisionToolbarHintLine}>{noteTypeSelectionGuidance}</Text>
          ) : null}
          {noteTypeTemplateHint ? (
            <Text style={styles.decisionToolbarHintLine}>
              {`${selectedLibraryLabel}: ${noteTypeTemplateHint.section} — ${noteTypeTemplateHint.summary}`}
            </Text>
          ) : null}
          <Text style={styles.decisionToolbarHintLine}>
            {includeMode === "selective-branch"
              ? "Selective branch adds follow-up rules (refusal, fatigue, risk…) for the Branch and Depth you pick."
              : "Full branch shows every question in this library for the selected note type."}
          </Text>
        </View>
      ) : null}

      {showLegacyAssignmentTools ? (
      <Modal transparent visible={showLibraryHelp} animationType="fade" onRequestClose={closeLibraryHelp}>
        <View style={styles.decisionLibraryHelpModalRoot}>
          <Pressable style={styles.decisionLibraryHelpBackdrop} onPress={closeLibraryHelp} />
          {libraryHelpFrame ? (
            <View
              style={[
                styles.decisionLibraryTooltipModal,
                {
                  top: libraryHelpFrame.y + libraryHelpFrame.height + 8,
                  left: libraryTooltipLeft,
                  width: libraryTooltipWidth,
                },
              ]}
            >
              <Text style={styles.decisionLibraryTooltipTitle}>{selectedLibraryLabel}</Text>
              <Text style={styles.decisionLibraryTooltipText}>{selectedLibraryHelp}</Text>
            </View>
          ) : null}
        </View>
      </Modal>
      ) : null}

      {showLegacyAssignmentTools ? (
      <View nativeID="decision-workflow-assign" collapsable={false} style={styles.decisionQuestionList}>
        <View style={styles.decisionSummaryRow}>
          <Text style={styles.decisionSummaryText}>
            {`${selectedLibraryLabel} • ${allNodes.length} in scope${visibleLibraryNodes.length !== allNodes.length ? ` (${visibleLibraryNodes.length} in filter)` : ""}`}
          </Text>
          <Text style={styles.decisionSummaryText}>{`${selectedCount} selected`}</Text>
        </View>

        <View style={styles.decisionScopeModeRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setAssignmentScopeMode(ASSIGNMENT_SCOPE_TARGET)}
            style={[
              styles.decisionScopeModeChip,
              assignmentScopeMode === ASSIGNMENT_SCOPE_TARGET && styles.decisionScopeModeChipActive,
            ]}
          >
            <Text
              style={[
                styles.decisionScopeModeChipText,
                assignmentScopeMode === ASSIGNMENT_SCOPE_TARGET && styles.decisionScopeModeChipTextActive,
              ]}
            >
              This block only
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setAssignmentScopeMode(ASSIGNMENT_SCOPE_FULL)}
            style={[
              styles.decisionScopeModeChip,
              assignmentScopeMode === ASSIGNMENT_SCOPE_FULL && styles.decisionScopeModeChipActive,
            ]}
          >
            <Text
              style={[
                styles.decisionScopeModeChipText,
                assignmentScopeMode === ASSIGNMENT_SCOPE_FULL && styles.decisionScopeModeChipTextActive,
              ]}
            >
              Full library filter (advanced)
            </Text>
          </Pressable>
        </View>

        {assignmentScopeHint ? (
          <Text
            style={[
              styles.decisionInlineHint,
              assignmentScopeMode === ASSIGNMENT_SCOPE_FULL && styles.decisionInlineHintWarn,
            ]}
          >
            {assignmentScopeHint}
          </Text>
        ) : null}

        {workflowCategoryOptions.length ? (
          <View style={styles.decisionCategoryFilterBlock}>
            <Text style={styles.decisionCategoryFilterLabel}>Category (within workflow)</Text>
            <View style={styles.decisionCategoryFilterRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setSelectedDocCategoryIds([])}
                style={[
                  styles.decisionCategoryChip,
                  !selectedDocCategoryIds.length && styles.decisionCategoryChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.decisionCategoryChipText,
                    !selectedDocCategoryIds.length && styles.decisionCategoryChipTextActive,
                  ]}
                >
                  All
                </Text>
              </Pressable>
              {workflowCategoryOptions.map((category) => {
                const isActive = selectedDocCategoryIds.includes(category.id);
                return (
                  <Pressable
                    key={category.id}
                    accessibilityRole="button"
                    onPress={() =>
                      setSelectedDocCategoryIds((current) =>
                        isActive
                          ? current.filter((entry) => entry !== category.id)
                          : [...current, category.id]
                      )
                    }
                    style={[styles.decisionCategoryChip, isActive && styles.decisionCategoryChipActive]}
                  >
                    <Text
                      style={[
                        styles.decisionCategoryChipText,
                        isActive && styles.decisionCategoryChipTextActive,
                      ]}
                    >
                      {category.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {allNodes.length ? (
          <View style={styles.decisionSmartSelectBlock}>
            <Text style={styles.decisionSmartSelectLabel}>Smart select</Text>
            <View style={styles.decisionSmartSelectActions}>
              {(() => {
                const defaultPreset = SMART_SELECT_PRESETS.find((preset) => preset.id === "standard");
                const otherPresets = SMART_SELECT_PRESETS.filter((preset) => preset.id !== "standard");

                return (
                  <>
                    {defaultPreset ? (
                      <Pressable
                        key={defaultPreset.id}
                        accessibilityRole="button"
                        accessibilityLabel={`Smart select ${defaultPreset.label}`}
                        onPress={() => applySmartSelect(defaultPreset.id)}
                        style={[
                          styles.decisionSmartSelectAction,
                          styles.decisionSmartSelectDefault,
                        ]}
                      >
                        <Text
                          style={[
                            styles.decisionSmartSelectActionText,
                            styles.decisionSmartSelectDefaultText,
                          ]}
                        >
                          {defaultPreset.label}
                        </Text>
                      </Pressable>
                    ) : null}
                    <View style={styles.decisionSmartSelectActionGroup}>
                      {otherPresets.map((preset) => (
                        <Pressable
                          key={preset.id}
                          accessibilityRole="button"
                          accessibilityLabel={`Smart select ${preset.label}`}
                          onPress={() => applySmartSelect(preset.id)}
                          style={styles.decisionSmartSelectAction}
                        >
                          <Text style={styles.decisionSmartSelectActionText}>{preset.label}</Text>
                        </Pressable>
                      ))}
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Clear visible question selection"
                        onPress={clearVisibleSelection}
                        style={styles.decisionSmartSelectClear}
                      >
                        <Text style={styles.decisionSmartSelectClearText}>Clear visible</Text>
                      </Pressable>
                    </View>
                  </>
                );
              })()}
            </View>
            <Text style={styles.decisionSmartSelectHint}>
              {assignmentTargetContext
                ? `Fills the scoped list below (${assignmentTargetContext.blockLabel || "target"}). Adjust boxes, then lock and Final Assign.`
                : "Pick a Target first, then use Default for this block's question pack."}
            </Text>

            {lastSmartSelect?.keys?.length ? (
              <View style={styles.decisionSmartSelectResult}>
                <View style={styles.decisionSmartSelectResultHeader}>
                  <Text style={styles.decisionSmartSelectResultTitle}>
                    {`${lastSmartSelect.presetLabel} — ${lastSmartSelect.keys.length} selected`}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Cancel smart select and uncheck those questions"
                    onPress={cancelSmartSelect}
                    style={styles.decisionSmartSelectResultDismiss}
                  >
                    <Text style={styles.decisionSmartSelectResultDismissText}>×</Text>
                  </Pressable>
                </View>
                <ScrollView
                  style={styles.decisionSmartSelectResultScroll}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                >
                  {(lastSmartSelect.items || []).map((item) => (
                    <Text key={item.key} style={styles.decisionSmartSelectResultItem} numberOfLines={2}>
                      {`• ${item.label}`}
                    </Text>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>
        ) : null}

        {!allNodes.length ? (
          <Text style={styles.decisionInlineHint}>
            {assignmentTargetContext?.targetType === "time-block"
              ? `No questions for ${assignmentTargetContext.blockLabel || "this block"} in scope. Use Baseplan + Block time, widen Depth, or switch branch mode.`
              : includeMode === "selective-branch"
                ? `No questions for ${getDecisionNoteTypeLabel(activeNoteType)} at branch ${selectedBranchKey || "?"}, depth ${selectedDepth}. Try another Branch, Full branch mode, or Block time.`
                : `No questions match ${getDecisionNoteTypeLabel(activeNoteType)} for ${selectedLibraryLabel}. Try Block time or switch libraries.`}
          </Text>
        ) : null}

        {includeMode === "selective-branch" && branchingFollowUpNodes.length ? (
          <Text style={styles.decisionInlineHint}>
            {`Including ${branchingFollowUpNodes.length} branching follow-up question(s) for branch ${selectedBranchKey}.`}
          </Text>
        ) : null}

        {Object.keys(sections).length ? (
          <View style={styles.decisionSectionBulkRow}>
            <Text style={styles.decisionSectionBulkLabel}>Section list</Text>
            <DecisionDropdown
              dropdownId="decision-section-bulk"
              placeholder="Open or close"
              value={decisionSectionBulkLabel}
              options={DECISION_SECTION_BULK_OPTIONS}
              activeDropdown={activeDecisionDropdown}
              onToggleDropdown={setActiveDecisionDropdown}
              onChange={handleDecisionSectionBulkView}
              fieldStyle={styles.decisionSectionBulkDropdown}
            />
          </View>
        ) : null}

        {Object.entries(sections).map(([sectionKey, sectionNodes]) => {
          const sectionAssignRule = getSectionAssignRule(selectedLibrary, sectionKey);
          const sectionAssignStatus = getSectionAssignmentStatus(
            selectedLibrary,
            sectionKey,
            decisionAssignments,
            selectedTargetKey
          );
          const sectionBlocked = sectionAssignStatus.status === "blocked";
          const sectionExpanded = isDecisionSectionExpanded(sectionKey);

          return (
          <View
            key={sectionKey}
            style={[
              styles.decisionSectionCard,
              sectionBlocked && styles.decisionSectionCardBlocked,
            ]}
          >
          <View
            style={[
              styles.decisionSectionHeader,
              !sectionExpanded && styles.decisionSectionHeaderCollapsed,
            ]}
          >
            <Pressable
              onPress={() => toggleSectionCollapse(sectionKey)}
              accessibilityRole="button"
              accessibilityState={{ expanded: sectionExpanded }}
              style={styles.decisionSectionHeaderToggle}
            >
              <Icon
                name={sectionExpanded ? "chevronDown" : "chevronRight"}
                size={16}
                color={colors.headerText}
              />
              <View style={styles.decisionSectionTitleWrap}>
                <Text style={styles.decisionSectionTitle}>{sectionKey}</Text>
                <Text style={styles.decisionSectionAssignRule}>{sectionAssignRule.label}</Text>
                {sectionAssignStatus.status !== "available" ? (
                  <Text
                    style={[
                      styles.decisionSectionAssignStatus,
                      sectionAssignStatus.status === "blocked" && styles.decisionSectionAssignStatusBlocked,
                    ]}
                  >
                    {sectionAssignStatus.message}
                  </Text>
                ) : null}
              </View>
            </Pressable>
            <View style={styles.decisionSectionHeaderActions}>
              <DecisionDropdown
                dropdownId={`decision-section-view:${sectionKey}`}
                placeholder="View"
                value={sectionExpanded ? "Open" : "Closed"}
                options={DECISION_SECTION_VIEW_OPTIONS}
                activeDropdown={activeDecisionDropdown}
                onToggleDropdown={setActiveDecisionDropdown}
                onChange={(value) => setDecisionSectionView(sectionKey, value)}
                fieldStyle={styles.decisionSectionViewDropdown}
              />
              <Text style={styles.decisionSectionMeta}>{`${sectionNodes.length} questions`}</Text>
              <Pressable
                onPress={() => toggleSection(sectionKey)}
                style={styles.decisionSectionAction}
                disabled={sectionBlocked}
              >
                <Text
                  style={[
                    styles.decisionSectionActionText,
                    sectionBlocked && styles.decisionSectionActionTextDisabled,
                  ]}
                >
                  {sectionNodes.filter((node) => !isDecisionConditionalNode(node)).every((node) => checkedNodes[buildDecisionNodeSelectionKey(node)]) ? "Clear" : "Select all"}
                </Text>
              </Pressable>
            </View>
          </View>
          {sectionExpanded ? (
            <View style={styles.decisionSectionBody}>
            {sectionNodes.map((node) => {
              const nodeAssignStatus = getNodeAssignmentStatus(
                node,
                decisionAssignments,
                selectedTargetKey
              );
              const nodeBlocked = nodeAssignStatus.status === "blocked";

              return (
              <Pressable
                key={buildDecisionNodeSelectionKey(node)}
                onPress={() => tryToggleDecisionNode(node)}
                style={[
                  styles.decisionNodeRow,
                  nodeBlocked && styles.decisionNodeRowBlocked,
                ]}
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
                  {nodeAssignStatus.status === "warn" ? (
                    <Text style={styles.decisionNodeAssignWarn}>{nodeAssignStatus.message}</Text>
                  ) : null}
                  {nodeBlocked ? (
                    <Text style={styles.decisionNodeAssignBlocked}>{nodeAssignStatus.message}</Text>
                  ) : null}
                  <View style={styles.decisionNodeFinalRow}>
                    <Pressable
                      onPress={() =>
                        setIncludeInFinalMap((p) => ({
                          ...p,
                          [buildDecisionNodeSelectionKey(node)]: !p[buildDecisionNodeSelectionKey(node)],
                        }))
                      }
                      disabled={nodeBlocked}
                      style={[
                        styles.includeFinalToggle,
                        includeInFinalMap[buildDecisionNodeSelectionKey(node)] && styles.includeFinalToggleActive,
                        nodeBlocked && styles.includeFinalToggleDisabled,
                      ]}
                    >
                      <Text style={styles.includeFinalToggleText}>
                        {includeInFinalMap[buildDecisionNodeSelectionKey(node)] ? "Included in final" : "Exclude from final"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
            })}
            </View>
          ) : null}
        </View>
        );
        })}
      </View>
      ) : null}
      {showLegacyAssignmentTools && (assignmentHint || externalAssignmentHint) ? (
        <Text style={styles.decisionInlineHint}>{assignmentHint || externalAssignmentHint}</Text>
      ) : null}
      {showLegacyAssignmentTools ? (
      <View nativeID="decision-workflow-lock" collapsable={false} style={styles.decisionAssignRow}>
        <Pressable
          onPress={handleStageCurrentSelection}
          style={styles.decisionAssignButton}
        >
          <Text style={styles.decisionAssignButtonText}>Lock Library Assignment</Text>
        </Pressable>
      </View>
      ) : null}
      {showLegacyAssignmentTools ? (
      <View style={styles.decisionAssignmentsCard}>
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
        <View nativeID="decision-workflow-final" collapsable={false} style={styles.decisionAssignRow}>
          <Pressable
            onPress={() => onFinalizeAssignments?.()}
            style={[
              styles.decisionAssignButton,
              styles.decisionAssignButtonAssignments,
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
      </View>
      ) : (
        <View style={styles.decisionAssignmentsCard}>
          <Text style={styles.decisionStagedEmpty}>
            Supervisor setup mode is active. Use Schedule Builder and Row Builder above to define the DSP documentation structure.
          </Text>
          <Text style={styles.decisionStagedEmpty}>
            The DSP note bubbles now use the row and block workflow automatically, so manual question assignment is hidden.
          </Text>
        </View>
      )}
    </Card>
  );
}

function Card({
  title,
  titleAccessory,
  titleAccessoryContainerStyle,
  titleTextStyle,
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
          <Text style={[styles.cardHeaderText, titleTextStyle]}>{title}</Text>
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

function buildDefaultExpandedCarePlanSections() {
  return Object.fromEntries(
    carePlanTabs.map((tab) => [tab, tab === "Overview"])
  );
}

function OverviewStatTile({ item }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      accessibilityRole="summary"
      accessibilityLabel={`${item.label}: ${item.count} ${item.detail}`}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[styles.overviewStat, hovered && styles.overviewStatActive]}
    >
      <View style={[styles.overviewStatIconBadge, { backgroundColor: item.iconBg }]}>
        <Icon name={item.icon} size={16} color={item.iconTint} />
      </View>
      <Text style={styles.overviewStatCount}>{item.count}</Text>
      <View style={styles.overviewStatDetailBlock}>
        <Text style={styles.overviewStatLabel}>{item.label}</Text>
        <Text style={styles.overviewStatDetail}>{item.detail}</Text>
      </View>
    </Pressable>
  );
}

function SectionCard({ title, subtitle, children, expanded = true, onToggle = null }) {
  const isCollapsible = typeof onToggle === "function";
  const headInner = (
    <>
      <View style={styles.carePlanSectionHeadText}>
        <Text style={styles.carePlanSectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.carePlanSectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {isCollapsible ? (
        <Icon
          name={expanded ? "chevronDown" : "chevronRight"}
          size={18}
          color={colors.headerText}
        />
      ) : null}
    </>
  );

  return (
    <View style={styles.carePlanSectionCard}>
      {isCollapsible ? (
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          style={[styles.carePlanSectionHead, !expanded && styles.carePlanSectionHeadCollapsed]}
        >
          {headInner}
        </Pressable>
      ) : (
        <View style={styles.carePlanSectionHead}>{headInner}</View>
      )}
      {expanded ? <View style={styles.carePlanSectionBody}>{children}</View> : null}
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

function carePlanDraftSignature(draft = {}) {
  return JSON.stringify(buildCarePlanEditorDraft(draft));
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

function CarePlanEditorRowActions({ onAdd, addLabel, onDelete, deleteLabel = "Delete row", style = null }) {
  return (
    <View style={[styles.carePlanEditorRowActions, style]}>
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
  const [sourcePagesExpanded, setSourcePagesExpanded] = useState(false);
  const [showAllSourcePages, setShowAllSourcePages] = useState(false);
  const [expandedActionRow, setExpandedActionRow] = useState(null);
  const [expandedCarePlanSections, setExpandedCarePlanSections] = useState(
    buildDefaultExpandedCarePlanSections
  );
  const scrollRef = useRef(null);
  const sectionPositions = useRef({});
  const carePlanEditBaselineRef = useRef(carePlanDraftSignature(buildCarePlanEditorDraft(profile)));

  const carePlanHasUnsavedChanges =
    isEditingCarePlan && carePlanDraftSignature(carePlanDraft) !== carePlanEditBaselineRef.current;

  useEffect(() => {
    if (!isEditingCarePlan) {
      setCarePlanDraft(buildCarePlanEditorDraft(profile));
      setExpandedRisk(profile.riskCards[0]?.title ?? "Falls");
      carePlanEditBaselineRef.current = carePlanDraftSignature(buildCarePlanEditorDraft(profile));
    }
  }, [isEditingCarePlan, profile]);

  useEffect(() => {
    if (!sourcePagesExpanded) {
      setShowAllSourcePages(false);
    }
  }, [sourcePagesExpanded]);

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
    const draft = buildCarePlanEditorDraft(profile);
    setCarePlanDraft(draft);
    carePlanEditBaselineRef.current = carePlanDraftSignature(draft);
    setCarePlanSaveState({ saving: false, message: "", error: "" });
    setIsEditingCarePlan(true);
  };

  const cancelEditingCarePlan = () => {
    const draft = buildCarePlanEditorDraft(profile);
    setCarePlanDraft(draft);
    carePlanEditBaselineRef.current = carePlanDraftSignature(draft);
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
      carePlanEditBaselineRef.current = carePlanDraftSignature(carePlanDraft);
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
  const visibleSourcePages = (showAllSourcePages ? sourcePages : sourcePages.slice(0, 3)).map((page) => ({
    page,
    index: sourcePages.indexOf(page),
  }));

  const registerSection = (key, y) => {
    sectionPositions.current[key] = y;
  };

  const toggleCarePlanSection = (key) => {
    setExpandedCarePlanSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const carePlanSectionCollapseProps = (key) => ({
    expanded: Boolean(expandedCarePlanSections[key]),
    onToggle: () => toggleCarePlanSection(key),
  });

  const jumpToSection = (key) => {
    setActiveTab(key);
    setExpandedCarePlanSections((prev) => ({
      ...prev,
      [key]: true,
    }));
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
                <Text style={styles.carePlanHeroName}>
                  {formatClientNameLastFirstInitials(header.fullName)}
                </Text>
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

      {isEditingCarePlan ? (
        <View
          style={[
            styles.carePlanUnsavedBanner,
            carePlanHasUnsavedChanges ? styles.carePlanUnsavedBannerActive : styles.carePlanUnsavedBannerIdle,
          ]}
        >
          <Text
            style={[
              styles.carePlanUnsavedBannerText,
              carePlanHasUnsavedChanges ? styles.carePlanUnsavedBannerTextActive : null,
            ]}
          >
            {carePlanHasUnsavedChanges
              ? "Unsaved changes — one Save Care Plan writes the whole plan to the server."
              : "Editing care plan — no changes yet."}
          </Text>
        </View>
      ) : null}

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
        contentContainerStyle={[
          styles.carePlanContentScrollerInner,
          isEditingCarePlan && styles.carePlanContentScrollerInnerEditing,
        ]}
        nestedScrollEnabled
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View onLayout={(event) => registerSection("Overview", event.nativeEvent.layout.y)}>
          <SectionCard
            title="Overview"
            subtitle="Modern AI-enhanced Therap-style care plan viewer"
            {...carePlanSectionCollapseProps("Overview")}
          >
            <View style={styles.overviewGridWrap}>
              <View style={styles.overviewGrid}>
                {[
                  {
                    key: "narrative",
                    label: "Narrative sections",
                    count: aboutCards.length,
                    detail: "person-centered summaries",
                    icon: "clipboard",
                    iconTint: "#5b5bd6",
                    iconBg: "rgba(91, 91, 214, 0.12)",
                  },
                  {
                    key: "risks",
                    label: "Risk profiles",
                    count: risks.length,
                    detail: "active risk cards",
                    icon: "shield",
                    iconTint: "#d26a32",
                    iconBg: "rgba(210, 106, 50, 0.14)",
                  },
                  {
                    key: "services",
                    label: "Service supports",
                    count: services.length,
                    detail: "approved services",
                    icon: "heart",
                    iconTint: "#1f8a70",
                    iconBg: "rgba(31, 138, 112, 0.14)",
                  },
                  {
                    key: "plans",
                    label: "Action plans",
                    count: plans.length,
                    detail: "measurable plan sets",
                    icon: "target",
                    iconTint: "#7c3aed",
                    iconBg: "rgba(124, 58, 237, 0.14)",
                  },
                ].map((item) => (
                  <View key={item.key} style={styles.overviewStatCell}>
                    <OverviewStatTile item={item} />
                  </View>
                ))}
              </View>
            </View>
          </SectionCard>
        </View>

        <View onLayout={(event) => registerSection("About Me", event.nativeEvent.layout.y)}>
          <SectionCard
            title="About Me"
            subtitle="Narrative support information from the care plan"
            {...carePlanSectionCollapseProps("About Me")}
          >
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
          <SectionCard
            title="Risks"
            subtitle="Collapsible clinical risk cards with staff guidance"
            {...carePlanSectionCollapseProps("Risks")}
          >
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
          <SectionCard
            title="Supports"
            subtitle="Home, community, ADLs, and communication supports"
            {...carePlanSectionCollapseProps("Supports")}
          >
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
          <SectionCard
            title="Services"
            subtitle="Service supports transformed from authorization tables"
            {...carePlanSectionCollapseProps("Services")}
          >
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
          <SectionCard
            title="Rights & Decision Making"
            subtitle="Decision authority, ANE education, and directives"
            {...carePlanSectionCollapseProps("Rights")}
          >
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
          <SectionCard
            title="Community Activities"
            subtitle="Current activities and support needs in the community"
            {...carePlanSectionCollapseProps("Activities")}
          >
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
          <SectionCard
            title="Action Plans"
            subtitle="Measurable outcomes, exact compliance structure, improved usability"
            {...carePlanSectionCollapseProps("Action Plans")}
          >
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
          <SectionCard
            title="Documents"
            subtitle="Documentation checklists and referenced files"
            {...carePlanSectionCollapseProps("Documents")}
          >
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
          <SectionCard
            title="Participants & Signature Logs"
            subtitle="Plan participants and acknowledgement trail"
            {...carePlanSectionCollapseProps("Participants")}
          >
            {isEditingCarePlan ? (
              <CarePlanEditorRowActions
                onAdd={() => addDraftRow("participants", { name: "", relationship: "", copy: "" })}
                addLabel="Add participant"
              />
            ) : null}
            <View style={styles.participantTable}>
              <View style={styles.participantHeader}>
                <Text style={[styles.participantHeaderCell, styles.participantNameCol]}>Participant</Text>
                <Text style={[styles.participantHeaderCell, styles.participantRelationshipCol]}>Relationship</Text>
                <Text style={[styles.participantHeaderCell, styles.participantCopyCol]}>Copy</Text>
                {isEditingCarePlan ? <View style={styles.participantActionsCol} /> : null}
              </View>
              {roster.map((item, index) => (
                <View key={`${item.name}-${index}`} style={styles.participantRow}>
                  {isEditingCarePlan ? (
                    <>
                      <CarePlanEditorField
                        value={item.name}
                        onChangeText={(value) => setDraftValue(["participants", index, "name"], value)}
                        style={[styles.participantCell, styles.carePlanEditorTableInput, styles.participantNameCol]}
                      />
                      <CarePlanEditorField
                        value={item.relationship}
                        onChangeText={(value) =>
                          setDraftValue(["participants", index, "relationship"], value)
                        }
                        style={[
                          styles.participantCell,
                          styles.carePlanEditorTableInput,
                          styles.participantRelationshipCol,
                        ]}
                      />
                      <CarePlanEditorField
                        value={item.copy}
                        onChangeText={(value) => setDraftValue(["participants", index, "copy"], value)}
                        style={[styles.participantCell, styles.carePlanEditorTableInput, styles.participantCopyCol]}
                      />
                      <View style={styles.participantActionsCol}>
                        <CarePlanEditorRowActions
                          style={styles.carePlanEditorRowActionsCompact}
                          deleteLabel="Delete"
                          onDelete={() => removeDraftRow("participants", index)}
                        />
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.participantCell, styles.participantNameCol]}>{item.name}</Text>
                      <Text style={[styles.participantCell, styles.participantRelationshipCol]}>
                        {item.relationship}
                      </Text>
                      <Text style={[styles.participantCell, styles.participantCopyCol]}>{item.copy}</Text>
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
          <SectionCard
            title="Full Source Pages"
            subtitle="Complete OCR extract retained so all PDF content remains available"
            {...carePlanSectionCollapseProps("Source Pages")}
          >
            <Pressable
              onPress={() => setSourcePagesExpanded((current) => !current)}
              style={styles.sourcePagesSectionToggle}
            >
              <Text style={styles.sourcePagesSectionToggleText}>
                {sourcePagesExpanded ? "Hide full source pages" : "Show full source pages"}
              </Text>
              <Text style={styles.sourcePagesSectionToggleMeta}>
                {sourcePagesExpanded
                  ? `${Math.min(sourcePages.length, showAllSourcePages ? sourcePages.length : 3)} of ${sourcePages.length}`
                  : `${sourcePages.length} pages available`}
              </Text>
            </Pressable>
            {sourcePagesExpanded ? (
              <>
                {isEditingCarePlan ? (
                  <CarePlanEditorRowActions
                    onAdd={() => addDraftRow("carePlanTextPages", { page: "", text: "" })}
                    addLabel="Add page"
                  />
                ) : null}
                <View style={styles.sourcePageStack}>
                  {visibleSourcePages.map(({ page, index: actualIndex }) => {
                    const isExpanded = expandedSourcePage === page.page;
                    return (
                      <View key={`source-page-${page.page}-${actualIndex}`} style={styles.sourcePageCard}>
                        {isEditingCarePlan ? (
                          <>
                            <Pressable
                              onPress={() => setExpandedSourcePage(isExpanded ? null : page.page)}
                              style={styles.sourcePageHeader}
                            >
                              <Text style={styles.sourcePageTitle}>{`Source Page ${page.page || actualIndex + 1}`}</Text>
                              <Text style={styles.sourcePageToggle}>{isExpanded ? "Hide" : "Show"}</Text>
                            </Pressable>
                            {isExpanded ? (
                              <>
                                <CarePlanEditorSectionLabel>Page</CarePlanEditorSectionLabel>
                                <CarePlanEditorField
                                  value={String(page.page)}
                                  onChangeText={(value) => setDraftValue(["carePlanTextPages", actualIndex, "page"], value)}
                                />
                                <CarePlanEditorSectionLabel>Text</CarePlanEditorSectionLabel>
                                <CarePlanEditorField
                                  value={page.text}
                                  onChangeText={(value) => setDraftValue(["carePlanTextPages", actualIndex, "text"], value)}
                                  multiline
                                  style={styles.carePlanSourceEditorInput}
                                />
                                <CarePlanEditorRowActions
                                  onDelete={() => removeDraftRow("carePlanTextPages", actualIndex)}
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
                {sourcePages.length > 3 ? (
                  <Pressable
                    onPress={() => setShowAllSourcePages((current) => !current)}
                    style={styles.sourcePagesShowMoreButton}
                  >
                    <Text style={styles.sourcePagesShowMoreText}>
                      {showAllSourcePages ? "Show fewer pages" : `Show more pages (${sourcePages.length - 3} more)`}
                    </Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}
          </SectionCard>
        </View>
      </ScrollView>
      )}

      {isEditingCarePlan ? (
        <View style={styles.carePlanStickyEditBar}>
          <Text style={styles.carePlanStickyEditBarText}>
            {carePlanHasUnsavedChanges ? "Unsaved changes" : "Care plan edit mode"}
          </Text>
          <View style={styles.carePlanStickyEditBarActions}>
            <Pressable
              style={[
                styles.carePlanStickyEditPrimary,
                carePlanSaveState.saving && styles.quickActionButtonDisabled,
              ]}
              onPress={saveCarePlanEdits}
              disabled={carePlanSaveState.saving}
            >
              <Text style={styles.carePlanStickyEditPrimaryText}>
                {carePlanSaveState.saving ? "Saving..." : "Save Care Plan"}
              </Text>
            </Pressable>
            <Pressable
              style={styles.carePlanStickyEditSecondary}
              onPress={cancelEditingCarePlan}
              disabled={carePlanSaveState.saving}
            >
              <Text style={styles.carePlanStickyEditSecondaryText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
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

function DspInputFlowScreen({ isPhone }) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [categoryId, setCategoryId] = useState(adlInputSection.tasks?.[0]?.value || "");
  const [subtask, setSubtask] = useState("");
  const [outcome, setOutcome] = useState("");
  const [assistance, setAssistance] = useState("");
  const [engagement, setEngagement] = useState("");
  const [selectedRisks, setSelectedRisks] = useState([]);
  const [selectedProtocols, setSelectedProtocols] = useState([]);
  const [selectedAlerts, setSelectedAlerts] = useState([]);
  const [note, setNote] = useState("");

  const formatLabel = useCallback((value) => value.replace(/_/g, " "), []);
  const titleCase = useCallback(
    (value) => formatLabel(value).replace(/\b\w/g, (char) => char.toUpperCase()),
    [formatLabel]
  );

  const categoryOptions = useMemo(() => adlInputSection.tasks || [], []);
  const selectedTaskConfig = useMemo(
    () => adlInputSection.taskDetails?.[categoryId] || {},
    [categoryId]
  );

  useEffect(() => {
    if (!categoryOptions.length) {
      setCategoryId("");
      return;
    }
    if (!categoryOptions.some((option) => option.value === categoryId)) {
      setCategoryId(categoryOptions[0].value);
    }
  }, [categoryId, categoryOptions]);

  const subtaskOptions = useMemo(() => selectedTaskConfig.subtasks || [], [selectedTaskConfig]);

  useEffect(() => {
    setSubtask("");
    setOutcome("");
    setAssistance("");
    setEngagement("");
    setSelectedRisks([]);
    setSelectedProtocols([]);
    setSelectedAlerts([]);
    setNote("");
  }, [categoryId]);

  useEffect(() => {
    if (!subtaskOptions.some((option) => option.value === subtask)) {
      setSubtask("");
    }
  }, [subtask, subtaskOptions]);

  const runtime = useMemo(
    () =>
      composeDecisionRuntime({
        workflowId: "adl",
        categoryId,
        outcome,
        assistance,
      }),
    [categoryId, outcome, assistance]
  );

  const outcomeOptions = useMemo(() => {
    const runtimeOptions = (runtime.allowedOutcomes || []).map((item) => ({ value: item, label: titleCase(item) }));
    return runtimeOptions.length ? runtimeOptions : adlInputSection.genericOutcomeOptions || [];
  }, [runtime.allowedOutcomes, titleCase]);

  const assistanceOptions = useMemo(() => {
    if (adlInputSection.assistanceOverrides?.[categoryId]) {
      return adlInputSection.assistanceOverrides[categoryId];
    }
    const runtimeOptions = (runtime.allowedAssistance || []).map((item) => ({ value: item, label: titleCase(item) }));
    return runtimeOptions.length ? runtimeOptions : adlInputSection.genericAssistanceOptions || [];
  }, [categoryId, runtime.allowedAssistance, titleCase]);

  useEffect(() => {
    if (!outcomeOptions.some((option) => option.value === outcome)) {
      setOutcome("");
    }
  }, [outcome, outcomeOptions]);

  useEffect(() => {
    if (!assistanceOptions.some((option) => option.value === assistance)) {
      setAssistance("");
    }
  }, [assistance, assistanceOptions]);

  const engagementOptions = adlInputSection.engagementOptions || [];
  const riskOptions = selectedTaskConfig.risks || [];
  const protocolOptions = selectedTaskConfig.protocols || [];
  const alertOptions = selectedTaskConfig.alerts || [];
  const bathingExampleActive = categoryId === "bathing";
  const transferExampleActive = categoryId === "transfers";

  const matchedRuleMappings = useMemo(() => {
    return (ruleMappingTable.mappings || []).filter((mapping) => {
      if (mapping.when === "fall_risk") {
        return selectedRisks.includes("fall_risk");
      }
      if (mapping.when === "hesitant") {
        return engagement === "hesitant";
      }
      if (mapping.when === "incident_occurred") {
        return outcome === "incident_occurred";
      }
      if (mapping.when === "bathing + safety_prevented_completion") {
        return categoryId === "bathing" && outcome === "safety_prevented_completion";
      }
      if (mapping.when === "toileting + full_assist") {
        return categoryId === "toileting" && assistance === "full_assist";
      }
      return false;
    });
  }, [assistance, categoryId, engagement, outcome, selectedRisks]);

  const activeCatalogModules = useMemo(() => {
    const mappedModuleIds = matchedRuleMappings.flatMap((mapping) => mapping.activate || []);
    const runtimeModuleIds = runtime.activeModules || [];
    const manualTaskModules = [];
    if (bathingExampleActive) {
      manualTaskModules.push("privacy_setup", "bathing_support");
    }
    if (transferExampleActive) {
      manualTaskModules.push("transfer_safety", "fall_prevention");
    }
    const allModuleIds = [...new Set([...runtimeModuleIds, ...mappedModuleIds, ...manualTaskModules])];
    return (moduleCatalog.modules || []).filter((item) => allModuleIds.includes(item.moduleId));
  }, [bathingExampleActive, matchedRuleMappings, runtime.activeModules, transferExampleActive]);

  const generatedPreview = useMemo(() => {
    const categoryLabel = categoryOptions.find((item) => item.value === categoryId)?.label || titleCase(categoryId || "task");
    const subtaskLabel = subtaskOptions.find((item) => item.value === subtask)?.label || "";
    if (!categoryId) {
      return "Select an ADL task to build the runtime note.";
    }

    const lines = [];
    if (bathingExampleActive) {
      lines.push(`Staff supported the client with ${subtaskLabel ? `${subtaskLabel.toLowerCase()} bathing` : "bathing"}.`);
      if (engagement === "hesitant") {
        lines.push("Client was hesitant at the start and responded to support.");
      } else if (engagement) {
        lines.push(`Client presentation was ${formatLabel(engagement)} during the task.`);
      }
      if (assistance) {
        if (assistance === "partial_assist" || assistance === "full_assist") {
          lines.push(`${titleCase(assistance)} was provided during bathing.`);
        } else {
          lines.push(`${titleCase(assistance)} support was used.`);
        }
      }
      if (selectedRisks.includes("fall_risk")) {
        lines.push("Fall precautions were maintained.");
      }
      if (selectedProtocols.includes("gait_belt_required")) {
        lines.push("Gait belt protocol was followed.");
      }
      if (selectedProtocols.includes("two_person_transfer_required")) {
        lines.push("Two-person transfer protocol was followed.");
      }
      if (outcome === "completed") {
        lines.push("Bathing task was completed.");
      } else if (outcome === "partially_completed") {
        lines.push("Bathing task was partially completed.");
      } else if (outcome === "refused") {
        lines.push("Bathing task was refused.");
      } else if (outcome === "safety_prevented_completion") {
        lines.push("Bathing was not completed due to safety concerns.");
      } else if (outcome) {
        lines.push(`Task outcome: ${formatLabel(outcome)}.`);
      }
    } else if (transferExampleActive) {
      lines.push(`Staff provided support with ${subtaskLabel ? subtaskLabel.toLowerCase() : "transfers"}.`);
      if (engagement) {
        lines.push(`Client was ${formatLabel(engagement)} during the transfer task.`);
      }
      if (assistance) {
        lines.push(`${titleCase(assistance)} was provided during transfers.`);
      }
      if (selectedRisks.includes("fall_risk")) {
        lines.push("Fall precautions were maintained during transfer support.");
      }
      if (selectedProtocols.includes("gait_belt_required")) {
        lines.push("Gait belt protocol was followed.");
      }
      if (selectedProtocols.includes("two_person_transfer_required")) {
        lines.push("Two-person transfer protocol was followed.");
      }
      if (outcome) {
        lines.push(`Transfer outcome: ${formatLabel(outcome)}.`);
      }
    } else if (categoryId === "toileting") {
      lines.push(`Staff supported the client with ${subtaskLabel ? subtaskLabel.toLowerCase() : "toileting"}.`);
      if (assistance) {
        lines.push(`${titleCase(assistance)} was provided during toileting support.`);
      }
      if (selectedRisks.includes("fall_risk")) {
        lines.push("Fall precautions were maintained during toileting.");
      }
      if (selectedProtocols.includes("universal_precautions")) {
        lines.push("Universal precautions were followed.");
      }
      if (outcome) {
        lines.push(`Toileting outcome: ${formatLabel(outcome)}.`);
      }
    } else if (categoryId === "dressing") {
      lines.push(`Staff supported the client with ${subtaskLabel ? subtaskLabel.toLowerCase() : "dressing"}.`);
      if (assistance) {
        lines.push(`${titleCase(assistance)} was provided during dressing support.`);
      }
      if (engagement) {
        lines.push(`Client was ${formatLabel(engagement)} during the dressing task.`);
      }
      if (outcome) {
        lines.push(`Dressing outcome: ${formatLabel(outcome)}.`);
      }
    } else if (categoryId === "grooming") {
      lines.push(`Staff supported the client with ${subtaskLabel ? subtaskLabel.toLowerCase() : "grooming"}.`);
      if (assistance) {
        lines.push(`${titleCase(assistance)} was provided during grooming support.`);
      }
      if (engagement) {
        lines.push(`Client was ${formatLabel(engagement)} during grooming support.`);
      }
      if (outcome) {
        lines.push(`Grooming outcome: ${formatLabel(outcome)}.`);
      }
    } else if (categoryId === "hygiene") {
      lines.push(`Staff supported the client with ${subtaskLabel ? subtaskLabel.toLowerCase() : "hygiene"}.`);
      if (assistance) {
        lines.push(`${titleCase(assistance)} was provided during hygiene support.`);
      }
      if (selectedProtocols.includes("universal_precautions")) {
        lines.push("Universal precautions were followed.");
      }
      if (outcome) {
        lines.push(`Hygiene outcome: ${formatLabel(outcome)}.`);
      }
    } else {
      lines.push(`ADL task documented: ${categoryLabel}.`);
      if (subtaskLabel) {
        lines.push(`Subtask: ${subtaskLabel}.`);
      }
      if (outcome) {
        lines.push(`Outcome: ${titleCase(outcome)}.`);
      }
      if (assistance) {
        lines.push(`Assistance: ${titleCase(assistance)}.`);
      }
      if (engagement) {
        lines.push(`Engagement: ${titleCase(engagement)}.`);
      }
    }
    if (selectedAlerts.length) {
      lines.push(`Alerts/follow-up: ${selectedAlerts.map((item) => titleCase(item)).join(", ")}.`);
    }
    if (note.trim()) {
      lines.push(note.trim());
    }
    return lines.join(" ");
  }, [
    assistance,
    bathingExampleActive,
    categoryId,
    categoryOptions,
    engagement,
    formatLabel,
    note,
    outcome,
    selectedAlerts,
    selectedProtocols,
    selectedRisks,
    subtask,
    subtaskOptions,
    titleCase,
    transferExampleActive,
  ]);

  const followUpFlags = useMemo(() => {
    const flags = [];
    if (selectedAlerts.includes("nurse_notification_needed")) {
      flags.push("Nurse review");
    }
    if (selectedAlerts.includes("supervisor_notification_needed") || outcome === "incident_occurred") {
      flags.push("Supervisor review");
    }
    if (selectedAlerts.includes("change_in_baseline")) {
      flags.push("Change in baseline follow-up");
    }
    if (outcome === "safety_prevented_completion") {
      flags.push("Safety review");
    }
    return [...new Set(flags)];
  }, [outcome, selectedAlerts]);

  const toggleMultiSelect = (value, setter) => {
    setter((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  };

  const questionSteps = adlInputSection.questionSteps || [];

  const StepCard = ({ index, title, hint, locked, children }) => (
    <View style={[styles.dspStepCard, locked && styles.dspStepCardLocked]}>
      <View style={styles.dspStepHeader}>
        <View style={styles.dspStepNumber}>
          <Text style={styles.dspStepNumberText}>{index}</Text>
        </View>
        <View style={styles.dspStepHeaderCopy}>
          <Text style={styles.dspStepTitle}>{title}</Text>
          {hint ? <Text style={styles.dspStepHint}>{hint}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );

  return (
    <Card title={adlInputSection.title || "ADL Input Section"} containerStyle={styles.dspInputCard} bodyStyle={styles.dspInputCardBody}>
      <Text style={styles.dspInputLead}>{adlInputSection.description || dspIntakeSchema.description}</Text>
      <View style={styles.dspQuestionFlowCard}>
        {questionSteps.map((step, index) => (
          <View key={step} style={styles.dspQuestionFlowRow}>
            <View style={styles.dspQuestionFlowIndex}>
              <Text style={styles.dspQuestionFlowIndexText}>{index + 1}</Text>
            </View>
            <Text style={styles.dspQuestionFlowText}>{step}</Text>
          </View>
        ))}
      </View>
      <View style={styles.dspBathingExampleCard}>
        <Text style={styles.dspRuntimeHeading}>Build order</Text>
        <Text style={styles.dspRuntimeMeta}>
          {adlInputSection.buildOrderMessage}
        </Text>
      </View>
      <View style={styles.dspStepStack}>
        <StepCard
          index={1}
          title="What ADL task was supported?"
          hint={bathingExampleActive || transferExampleActive ? "This task has ADL-specific prompts, overlays, and note output." : "Select the ADL task, then narrow to an optional subtask."}
        >
          <View style={[styles.dspInputGrid, isPhone && styles.dspInputGridPhone]}>
            <View style={styles.dspInputField}>
              <Text style={styles.dspInputLabel}>Task</Text>
              <DecisionDropdown
                value={categoryOptions.find((item) => item.value === categoryId)?.label || ""}
                options={categoryOptions}
                placeholder="Select task"
                dropdownId="dsp-task"
                activeDropdown={activeDropdown}
                onToggleDropdown={setActiveDropdown}
                onChange={setCategoryId}
                fieldStyle={styles.dspInputDropdown}
              />
            </View>
            <View style={styles.dspInputField}>
              <Text style={styles.dspInputLabel}>Subtask</Text>
              <DecisionDropdown
                value={subtaskOptions.find((item) => item.value === subtask)?.label || ""}
                options={subtaskOptions}
                placeholder={subtaskOptions.length ? "Optional subtask" : "No subtasks for this task yet"}
                dropdownId="dsp-subtask"
                activeDropdown={activeDropdown}
                onToggleDropdown={setActiveDropdown}
                onChange={setSubtask}
                fieldStyle={styles.dspInputDropdown}
              />
            </View>
          </View>
        </StepCard>
        <StepCard index={2} title="What was the outcome?" hint="Outcome sets the note direction and rule triggers." locked={!categoryId}>
          <DecisionDropdown
            value={outcomeOptions.find((item) => item.value === outcome)?.label || ""}
            options={outcomeOptions}
            placeholder="Select outcome"
            dropdownId="dsp-outcome"
            activeDropdown={activeDropdown}
            onToggleDropdown={setActiveDropdown}
            onChange={setOutcome}
            fieldStyle={styles.dspInputDropdown}
          />
        </StepCard>
        <StepCard index={3} title="What assistance was provided?" hint="Use the ADL assistance states before rules fire." locked={!outcome}>
          <DecisionDropdown
            value={assistanceOptions.find((item) => item.value === assistance)?.label || ""}
            options={assistanceOptions}
            placeholder="Select assistance"
            dropdownId="dsp-assistance"
            activeDropdown={activeDropdown}
            onToggleDropdown={setActiveDropdown}
            onChange={setAssistance}
            fieldStyle={styles.dspInputDropdown}
          />
        </StepCard>
        <StepCard index={4} title="How did the person engage during the ADL task?" hint="Engagement drives cueing, re-engagement, and redirection logic." locked={!assistance}>
          <DecisionDropdown
            value={engagementOptions.find((item) => item.value === engagement)?.label || ""}
            options={engagementOptions}
            placeholder="Select engagement"
            dropdownId="dsp-engagement"
            activeDropdown={activeDropdown}
            onToggleDropdown={setActiveDropdown}
            onChange={setEngagement}
            fieldStyle={styles.dspInputDropdown}
          />
        </StepCard>
        <StepCard
          index={5}
          title="Were any ADL risks or protocols active?"
          hint="Leave unselected if none were active."
          locked={!engagement && !assistance}
        >
          <View style={styles.dspInputSection}>
            <Text style={styles.dspInputLabel}>Risks</Text>
            <View style={styles.dspInputChipRow}>
              {riskOptions.length ? (
                riskOptions.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => toggleMultiSelect(item, setSelectedRisks)}
                    style={[styles.dspInputChip, selectedRisks.includes(item) && styles.dspInputChipActive]}
                  >
                    <Text style={[styles.dspInputChipText, selectedRisks.includes(item) && styles.dspInputChipTextActive]}>
                      {titleCase(item)}
                    </Text>
                  </Pressable>
                ))
              ) : (
                <Text style={styles.dspRuntimeMeta}>No task-specific risks configured yet.</Text>
              )}
            </View>
          </View>
          <View style={styles.dspInputSection}>
            <Text style={styles.dspInputLabel}>Protocols</Text>
            <View style={styles.dspInputChipRow}>
              {protocolOptions.length ? (
                protocolOptions.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => toggleMultiSelect(item, setSelectedProtocols)}
                    style={[styles.dspInputChip, selectedProtocols.includes(item) && styles.dspInputChipActive]}
                  >
                    <Text style={[styles.dspInputChipText, selectedProtocols.includes(item) && styles.dspInputChipTextActive]}>
                      {titleCase(item)}
                    </Text>
                  </Pressable>
                ))
              ) : (
                <Text style={styles.dspRuntimeMeta}>No task-specific protocols configured yet.</Text>
              )}
            </View>
          </View>
        </StepCard>
        <StepCard index={6} title="Were any alerts present?" hint="Use only real follow-up items." locked={!categoryId}>
          <View style={styles.dspInputChipRow}>
            {alertOptions.length ? (
              alertOptions.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => toggleMultiSelect(item, setSelectedAlerts)}
                  style={[styles.dspInputChip, selectedAlerts.includes(item) && styles.dspInputChipAlertActive]}
                >
                  <Text style={[styles.dspInputChipText, selectedAlerts.includes(item) && styles.dspInputChipTextActive]}>
                    {titleCase(item)}
                  </Text>
                </Pressable>
              ))
            ) : (
              <Text style={styles.dspRuntimeMeta}>No task-specific alerts configured yet.</Text>
            )}
          </View>
        </StepCard>
        <StepCard index={7} title="Add an ADL note" hint="Use this only for context that the structured choices do not already capture." locked={!categoryId}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="ADL note"
            placeholderTextColor={colors.placeholder}
            multiline
            style={[styles.decisionRowInput, styles.dspInputNote]}
          />
        </StepCard>
      </View>
      <View style={[styles.dspRuntimeSummaryCard, isPhone && styles.dspRuntimeSummaryCardPhone]}>
        <View style={styles.dspRuntimeColumn}>
          <Text style={styles.dspRuntimeHeading}>Runtime Summary</Text>
          <Text style={styles.dspRuntimeSummaryText}>{runtime.summary}</Text>
          <Text style={styles.dspRuntimeMeta}>{`Allowed outcomes: ${(outcomeOptions || []).map((item) => item.label).join(", ") || "None"}`}</Text>
          <Text style={styles.dspRuntimeMeta}>{`Allowed assistance: ${(assistanceOptions || []).map((item) => item.label).join(", ") || "None"}`}</Text>
        </View>
        <View style={styles.dspRuntimeColumn}>
          <Text style={styles.dspRuntimeHeading}>Active Modules</Text>
          <View style={styles.dspInputChipRow}>
            {activeCatalogModules.length ? (
              activeCatalogModules.map((module) => (
                <View key={module.moduleId} style={styles.dspRuntimeModulePill}>
                  <Text style={styles.dspRuntimeModulePillText}>{module.label}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.dspRuntimeMeta}>Select outcome and assistance to activate modules.</Text>
            )}
          </View>
        </View>
      </View>
      <View style={styles.dspRuntimeSummaryCard}>
        <Text style={styles.dspRuntimeHeading}>Automatic Rules</Text>
        {runtime.matchedRules.length || matchedRuleMappings.length ? (
          <>
            {runtime.matchedRules.map((rule) => (
              <Text key={rule.ruleId} style={styles.dspRuntimeMeta}>{`${rule.ruleId} -> ${rule.thenActivate.join(", ")}`}</Text>
            ))}
            {matchedRuleMappings.map((mapping) => (
              <Text key={mapping.when} style={styles.dspRuntimeMeta}>{`${mapping.when} -> ${mapping.activate.join(", ")}`}</Text>
            ))}
          </>
        ) : (
          <Text style={styles.dspRuntimeMeta}>Choose outcome, assistance, and any active overlays to trigger rules.</Text>
        )}
      </View>
      <View style={styles.dspRuntimeSummaryCard}>
        <Text style={styles.dspRuntimeHeading}>Structured Output</Text>
        <Text style={styles.dspRuntimeMeta}>{`Output sections: ${(noteOutputTemplate.sections || []).map((item) => item.label).join(" | ")}`}</Text>
        <Text style={styles.dspRuntimeMeta}>{`Follow-up flags: ${followUpFlags.join(", ") || "None"}`}</Text>
      </View>
      <View style={styles.dspRuntimeSummaryCard}>
        <Text style={styles.dspRuntimeHeading}>Generated Note Output</Text>
        <Text style={styles.dspRuntimeSummaryText}>{generatedPreview}</Text>
      </View>
    </Card>
  );
}

function CommunityInputFlowScreen({ isPhone }) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [categoryId, setCategoryId] = useState(communityInputSection.tasks?.[0]?.value || "");
  const [subtask, setSubtask] = useState("");
  const [outcome, setOutcome] = useState("");
  const [assistance, setAssistance] = useState("");
  const [engagement, setEngagement] = useState("");
  const [selectedRisks, setSelectedRisks] = useState([]);
  const [selectedProtocols, setSelectedProtocols] = useState([]);
  const [selectedAlerts, setSelectedAlerts] = useState([]);
  const [note, setNote] = useState("");

  const formatLabel = useCallback((value) => value.replace(/_/g, " "), []);
  const titleCase = useCallback(
    (value) => formatLabel(value).replace(/\b\w/g, (char) => char.toUpperCase()),
    [formatLabel]
  );

  const categoryOptions = useMemo(() => communityInputSection.tasks || [], []);
  const selectedTaskConfig = useMemo(() => communityInputSection.taskDetails?.[categoryId] || {}, [categoryId]);

  useEffect(() => {
    if (!categoryOptions.length) {
      setCategoryId("");
      return;
    }
    if (!categoryOptions.some((option) => option.value === categoryId)) {
      setCategoryId(categoryOptions[0].value);
    }
  }, [categoryId, categoryOptions]);

  const subtaskOptions = useMemo(() => selectedTaskConfig.subtasks || [], [selectedTaskConfig]);

  useEffect(() => {
    setSubtask("");
    setOutcome("");
    setAssistance("");
    setEngagement("");
    setSelectedRisks([]);
    setSelectedProtocols([]);
    setSelectedAlerts([]);
    setNote("");
  }, [categoryId]);

  useEffect(() => {
    if (!subtaskOptions.some((option) => option.value === subtask)) {
      setSubtask("");
    }
  }, [subtask, subtaskOptions]);

  const outcomeOptions = useMemo(() => communityInputSection.genericOutcomeOptions || [], []);
  const assistanceOptions = useMemo(() => communityInputSection.genericAssistanceOptions || [], []);
  const engagementOptions = communityInputSection.engagementOptions || [];
  const riskOptions = selectedTaskConfig.risks || [];
  const protocolOptions = selectedTaskConfig.protocols || [];
  const alertOptions = selectedTaskConfig.alerts || [];

  const activeCommunityTokens = useMemo(
    () =>
      uniqueValues([
        categoryId,
        outcome,
        assistance,
        engagement,
        ...selectedRisks,
        ...selectedProtocols,
        ...selectedAlerts,
      ]),
    [assistance, categoryId, engagement, outcome, selectedAlerts, selectedProtocols, selectedRisks]
  );

  const matchedRuleMappings = useMemo(
    () => (ruleMappingTable.mappings || []).filter((mapping) => matchRuleExpression(mapping.when, activeCommunityTokens)),
    [activeCommunityTokens]
  );

  const activeCatalogModules = useMemo(() => {
    const manualModules = [];
    if (categoryId === "community_outing") {
      manualModules.push("community_supervision");
    }
    if (categoryId === "appointment_support") {
      manualModules.push("appointment_support_module");
    }
    const activatedModuleIds = collectActivatedModuleIds({
      activeTokens: activeCommunityTokens,
      runtimeRuleMap: communityRuntimeMap,
      extraRuleMappings: matchedRuleMappings,
    });
    return getModuleObjects([...manualModules, ...activatedModuleIds]);
  }, [activeCommunityTokens, categoryId, matchedRuleMappings]);

  const generatedPreview = useMemo(() => {
    const categoryLabel = categoryOptions.find((item) => item.value === categoryId)?.label || titleCase(categoryId || "task");
    const subtaskLabel = subtaskOptions.find((item) => item.value === subtask)?.label || "";
    if (!categoryId) {
      return "Select a community task to build the runtime note.";
    }
    const lines = [];
    if (categoryId === "community_outing") {
      lines.push(`Staff supported the client with ${subtaskLabel ? subtaskLabel.toLowerCase() : "a community outing"}.`);
      if (selectedRisks.includes("elopement_risk")) {
        lines.push("Elopement risk precautions were maintained.");
      }
      if (selectedProtocols.includes("line_of_sight_required")) {
        lines.push("Line-of-sight supervision was maintained.");
      }
    } else if (categoryId === "appointment_support") {
      lines.push(`Staff supported the client with ${subtaskLabel ? subtaskLabel.toLowerCase() : "appointment support"}.`);
      if (selectedProtocols.includes("appointment_supervision_required")) {
        lines.push("Appointment supervision requirements were maintained.");
      }
      if (selectedProtocols.includes("line_of_sight_required")) {
        lines.push("Line-of-sight supervision was maintained.");
      }
      if (selectedAlerts.includes("missed_appointment_window")) {
        lines.push("Appointment timing follow-up was required.");
      }
      if (selectedRisks.includes("fall_risk")) {
        lines.push("Fall-risk precautions were maintained during appointment support.");
      }
    } else if (categoryId === "social_participation") {
      lines.push(`Staff supported the client with ${subtaskLabel ? subtaskLabel.toLowerCase() : "social participation"}.`);
      if (selectedRisks.includes("behavioral_escalation_risk")) {
        lines.push("Behavioral escalation risk was monitored during community participation.");
      }
      if (selectedProtocols.includes("community_supervision_required")) {
        lines.push("Community supervision requirements were maintained.");
      }
    } else {
      lines.push(`Community task documented: ${categoryLabel}.`);
    }
    if (assistance) {
      lines.push(`${titleCase(assistance)} was provided during the community task.`);
    }
    if (engagement) {
      lines.push(`Client was ${formatLabel(engagement)} during the activity.`);
    }
    if (outcome) {
      lines.push(`Community outcome: ${formatLabel(outcome)}.`);
    }
    if (selectedAlerts.length) {
      lines.push(`Alerts/follow-up: ${selectedAlerts.map((item) => titleCase(item)).join(", ")}.`);
    }
    if (note.trim()) {
      lines.push(note.trim());
    }
    return lines.join(" ");
  }, [assistance, categoryId, categoryOptions, engagement, formatLabel, note, outcome, selectedAlerts, selectedProtocols, selectedRisks, subtask, subtaskOptions, titleCase]);

  const StepCard = ({ index, title, hint, locked, children }) => (
    <View style={[styles.dspStepCard, locked && styles.dspStepCardLocked]}>
      <View style={styles.dspStepHeader}>
        <View style={styles.dspStepNumber}>
          <Text style={styles.dspStepNumberText}>{index}</Text>
        </View>
        <View style={styles.dspStepHeaderCopy}>
          <Text style={styles.dspStepTitle}>{title}</Text>
          {hint ? <Text style={styles.dspStepHint}>{hint}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );

  const toggleMultiSelect = (value, setter) => {
    setter((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  };

  return (
    <Card title={communityInputSection.title || "Community Input Section"} containerStyle={styles.dspInputCard} bodyStyle={styles.dspInputCardBody}>
      <Text style={styles.dspInputLead}>{communityInputSection.description}</Text>
      <View style={styles.dspQuestionFlowCard}>
        {(communityInputSection.questionSteps || []).map((step, index) => (
          <View key={step} style={styles.dspQuestionFlowRow}>
            <View style={styles.dspQuestionFlowIndex}>
              <Text style={styles.dspQuestionFlowIndexText}>{index + 1}</Text>
            </View>
            <Text style={styles.dspQuestionFlowText}>{step}</Text>
          </View>
        ))}
      </View>
      <View style={styles.dspBathingExampleCard}>
        <Text style={styles.dspRuntimeHeading}>Build order</Text>
        <Text style={styles.dspRuntimeMeta}>{communityInputSection.buildOrderMessage}</Text>
      </View>
      <View style={styles.dspStepStack}>
        <StepCard index={1} title="What community task was supported?" hint="Select the community task, then narrow to an optional subtask.">
          <View style={[styles.dspInputGrid, isPhone && styles.dspInputGridPhone]}>
            <View style={styles.dspInputField}>
              <Text style={styles.dspInputLabel}>Task</Text>
              <DecisionDropdown value={categoryOptions.find((item) => item.value === categoryId)?.label || ""} options={categoryOptions} placeholder="Select task" dropdownId="community-task" activeDropdown={activeDropdown} onToggleDropdown={setActiveDropdown} onChange={setCategoryId} fieldStyle={styles.dspInputDropdown} />
            </View>
            <View style={styles.dspInputField}>
              <Text style={styles.dspInputLabel}>Subtask</Text>
              <DecisionDropdown value={subtaskOptions.find((item) => item.value === subtask)?.label || ""} options={subtaskOptions} placeholder={subtaskOptions.length ? "Optional subtask" : "No subtasks for this task yet"} dropdownId="community-subtask" activeDropdown={activeDropdown} onToggleDropdown={setActiveDropdown} onChange={setSubtask} fieldStyle={styles.dspInputDropdown} />
            </View>
          </View>
        </StepCard>
        <StepCard index={2} title="What was the outcome?" hint="Outcome sets the note direction and follow-up." locked={!categoryId}>
          <DecisionDropdown value={outcomeOptions.find((item) => item.value === outcome)?.label || ""} options={outcomeOptions} placeholder="Select outcome" dropdownId="community-outcome" activeDropdown={activeDropdown} onToggleDropdown={setActiveDropdown} onChange={setOutcome} fieldStyle={styles.dspInputDropdown} />
        </StepCard>
        <StepCard index={3} title="What assistance was provided?" hint="Use the community assistance states before rules fire." locked={!outcome}>
          <DecisionDropdown value={assistanceOptions.find((item) => item.value === assistance)?.label || ""} options={assistanceOptions} placeholder="Select assistance" dropdownId="community-assistance" activeDropdown={activeDropdown} onToggleDropdown={setActiveDropdown} onChange={setAssistance} fieldStyle={styles.dspInputDropdown} />
        </StepCard>
        <StepCard index={4} title="How did the person engage during the community task?" hint="Engagement helps explain participation and redirection needs." locked={!assistance}>
          <DecisionDropdown value={engagementOptions.find((item) => item.value === engagement)?.label || ""} options={engagementOptions} placeholder="Select engagement" dropdownId="community-engagement" activeDropdown={activeDropdown} onToggleDropdown={setActiveDropdown} onChange={setEngagement} fieldStyle={styles.dspInputDropdown} />
        </StepCard>
        <StepCard index={5} title="Were any community risks or protocols active?" hint="Leave unselected if none were active." locked={!engagement && !assistance}>
          <View style={styles.dspInputSection}>
            <Text style={styles.dspInputLabel}>Risks</Text>
            <View style={styles.dspInputChipRow}>
              {riskOptions.map((item) => (
                <Pressable key={item} onPress={() => toggleMultiSelect(item, setSelectedRisks)} style={[styles.dspInputChip, selectedRisks.includes(item) && styles.dspInputChipActive]}>
                  <Text style={[styles.dspInputChipText, selectedRisks.includes(item) && styles.dspInputChipTextActive]}>{titleCase(item)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.dspInputSection}>
            <Text style={styles.dspInputLabel}>Protocols</Text>
            <View style={styles.dspInputChipRow}>
              {protocolOptions.map((item) => (
                <Pressable key={item} onPress={() => toggleMultiSelect(item, setSelectedProtocols)} style={[styles.dspInputChip, selectedProtocols.includes(item) && styles.dspInputChipActive]}>
                  <Text style={[styles.dspInputChipText, selectedProtocols.includes(item) && styles.dspInputChipTextActive]}>{titleCase(item)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </StepCard>
        <StepCard index={6} title="Were any alerts present?" hint="Use only real follow-up items." locked={!categoryId}>
          <View style={styles.dspInputChipRow}>
            {alertOptions.map((item) => (
              <Pressable key={item} onPress={() => toggleMultiSelect(item, setSelectedAlerts)} style={[styles.dspInputChip, selectedAlerts.includes(item) && styles.dspInputChipAlertActive]}>
                <Text style={[styles.dspInputChipText, selectedAlerts.includes(item) && styles.dspInputChipTextActive]}>{titleCase(item)}</Text>
              </Pressable>
            ))}
          </View>
        </StepCard>
        <StepCard index={7} title="Add a community note" hint="Use this only for context that the structured choices do not already capture." locked={!categoryId}>
          <TextInput value={note} onChangeText={setNote} placeholder="Community note" placeholderTextColor={colors.placeholder} multiline style={[styles.decisionRowInput, styles.dspInputNote]} />
        </StepCard>
      </View>
      <View style={[styles.dspRuntimeSummaryCard, isPhone && styles.dspRuntimeSummaryCardPhone]}>
        <View style={styles.dspRuntimeColumn}>
          <Text style={styles.dspRuntimeHeading}>Runtime Summary</Text>
          <Text style={styles.dspRuntimeSummaryText}>{categoryId ? `${categoryOptions.find((item) => item.value === categoryId)?.label || titleCase(categoryId)} community support flow is active.` : "Select a community task to begin."}</Text>
        </View>
        <View style={styles.dspRuntimeColumn}>
          <Text style={styles.dspRuntimeHeading}>Active Modules</Text>
          <View style={styles.dspInputChipRow}>
            {activeCatalogModules.length ? activeCatalogModules.map((module) => (
              <View key={module.moduleId} style={styles.dspRuntimeModulePill}>
                <Text style={styles.dspRuntimeModulePillText}>{module.label}</Text>
              </View>
            )) : <Text style={styles.dspRuntimeMeta}>Select community inputs to activate modules.</Text>}
          </View>
        </View>
      </View>
      <View style={styles.dspRuntimeSummaryCard}>
        <Text style={styles.dspRuntimeHeading}>Automatic Rules</Text>
        {uniqueValues([
          ...(communityRuntimeMap.moduleRules || []).filter((rule) => matchRuleExpression(rule.when, activeCommunityTokens)).map((rule) => `${rule.when} -> ${(rule.activate || []).join(", ")}`),
          ...matchedRuleMappings.map((mapping) => `${mapping.when} -> ${(mapping.activate || []).join(", ")}`)
        ]).length ? uniqueValues([
          ...(communityRuntimeMap.moduleRules || []).filter((rule) => matchRuleExpression(rule.when, activeCommunityTokens)).map((rule) => `${rule.when} -> ${(rule.activate || []).join(", ")}`),
          ...matchedRuleMappings.map((mapping) => `${mapping.when} -> ${(mapping.activate || []).join(", ")}`)
        ]).map((rule) => <Text key={rule} style={styles.dspRuntimeMeta}>{rule}</Text>) : <Text style={styles.dspRuntimeMeta}>Choose community context to trigger rules.</Text>}
      </View>
      <View style={styles.dspRuntimeSummaryCard}>
        <Text style={styles.dspRuntimeHeading}>Generated Note Output</Text>
        <Text style={styles.dspRuntimeSummaryText}>{generatedPreview}</Text>
      </View>
    </Card>
  );
}

function HealthSafetyInputFlowScreen({ isPhone }) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [categoryId, setCategoryId] = useState(healthSafetyInputSection.tasks?.[0]?.value || "");
  const [subtask, setSubtask] = useState("");
  const [outcome, setOutcome] = useState("");
  const [assistance, setAssistance] = useState("");
  const [engagement, setEngagement] = useState("");
  const [selectedRisks, setSelectedRisks] = useState([]);
  const [selectedProtocols, setSelectedProtocols] = useState([]);
  const [selectedAlerts, setSelectedAlerts] = useState([]);
  const [note, setNote] = useState("");

  const formatLabel = useCallback((value) => value.replace(/_/g, " "), []);
  const titleCase = useCallback(
    (value) => formatLabel(value).replace(/\b\w/g, (char) => char.toUpperCase()),
    [formatLabel]
  );

  const categoryOptions = useMemo(() => healthSafetyInputSection.tasks || [], []);
  const selectedTaskConfig = useMemo(() => healthSafetyInputSection.taskDetails?.[categoryId] || {}, [categoryId]);

  useEffect(() => {
    if (!categoryOptions.length) {
      setCategoryId("");
      return;
    }
    if (!categoryOptions.some((option) => option.value === categoryId)) {
      setCategoryId(categoryOptions[0].value);
    }
  }, [categoryId, categoryOptions]);

  const subtaskOptions = useMemo(() => selectedTaskConfig.subtasks || [], [selectedTaskConfig]);

  useEffect(() => {
    setSubtask("");
    setOutcome("");
    setAssistance("");
    setEngagement("");
    setSelectedRisks([]);
    setSelectedProtocols([]);
    setSelectedAlerts([]);
    setNote("");
  }, [categoryId]);

  useEffect(() => {
    if (!subtaskOptions.some((option) => option.value === subtask)) {
      setSubtask("");
    }
  }, [subtask, subtaskOptions]);

  const outcomeOptions = useMemo(() => healthSafetyInputSection.genericOutcomeOptions || [], []);
  const assistanceOptions = useMemo(() => healthSafetyInputSection.genericAssistanceOptions || [], []);
  const engagementOptions = healthSafetyInputSection.engagementOptions || [];
  const riskOptions = selectedTaskConfig.risks || [];
  const protocolOptions = selectedTaskConfig.protocols || [];
  const alertOptions = selectedTaskConfig.alerts || [];

  const activeHealthTokens = useMemo(
    () =>
      uniqueValues([
        categoryId,
        outcome,
        assistance,
        engagement,
        ...selectedRisks,
        ...selectedProtocols,
        ...selectedAlerts,
      ]),
    [assistance, categoryId, engagement, outcome, selectedAlerts, selectedProtocols, selectedRisks]
  );

  const matchedRuleMappings = useMemo(
    () => (ruleMappingTable.mappings || []).filter((mapping) => matchRuleExpression(mapping.when, activeHealthTokens)),
    [activeHealthTokens]
  );

  const activeCatalogModules = useMemo(() => {
    const manualModules = [];
    if (categoryId === "wellness_check") {
      manualModules.push("wellness_observation");
    }
    if (categoryId === "incident_response") {
      manualModules.push("incident_documentation");
    }
    const activatedModuleIds = collectActivatedModuleIds({
      activeTokens: activeHealthTokens,
      runtimeRuleMap: healthSafetyRuntimeMap,
      extraRuleMappings: matchedRuleMappings,
    });
    return getModuleObjects([...manualModules, ...activatedModuleIds]);
  }, [activeHealthTokens, categoryId, matchedRuleMappings]);

  const generatedPreview = useMemo(() => {
    const categoryLabel = categoryOptions.find((item) => item.value === categoryId)?.label || titleCase(categoryId || "task");
    const subtaskLabel = subtaskOptions.find((item) => item.value === subtask)?.label || "";
    if (!categoryId) {
      return "Select a health and safety task to build the runtime note.";
    }
    const lines = [];
    if (categoryId === "wellness_check") {
      lines.push(`Staff completed ${subtaskLabel ? subtaskLabel.toLowerCase() : "a wellness check"}.`);
      if (selectedAlerts.includes("pain_reported")) {
        lines.push("Pain was reported during the wellness check.");
      }
      if (selectedAlerts.includes("change_in_baseline")) {
        lines.push("A change in baseline was observed.");
      }
    } else if (categoryId === "fall_prevention") {
      lines.push(`Staff provided ${subtaskLabel ? subtaskLabel.toLowerCase() : "fall prevention support"}.`);
      if (selectedRisks.includes("fall_risk")) {
        lines.push("Fall-risk precautions were maintained.");
      }
      if (selectedProtocols.includes("gait_belt_required")) {
        lines.push("Gait belt protocol was followed.");
      }
    } else if (categoryId === "incident_response") {
      lines.push(`Staff responded to ${subtaskLabel ? subtaskLabel.toLowerCase() : "a health or safety incident"}.`);
      if (selectedAlerts.includes("incident_follow_up_needed")) {
        lines.push("Incident follow-up was required.");
      }
    } else if (categoryId === "mobility_monitoring") {
      lines.push(`Staff provided ${subtaskLabel ? subtaskLabel.toLowerCase() : "mobility monitoring"}.`);
      if (selectedProtocols.includes("gait_belt_required")) {
        lines.push("Gait belt protocol was followed.");
      }
    } else if (categoryId === "hydration_support") {
      lines.push(`Staff provided ${subtaskLabel ? subtaskLabel.toLowerCase() : "hydration support"}.`);
      if (selectedProtocols.includes("thickened_liquids_required")) {
        lines.push("Required liquid-consistency precautions were followed.");
      }
    } else {
      lines.push(`Health and safety task documented: ${categoryLabel}.`);
    }
    if (assistance) {
      lines.push(`${titleCase(assistance)} was provided during the task.`);
    }
    if (engagement) {
      lines.push(`Client was ${formatLabel(engagement)} during the task.`);
    }
    if (outcome) {
      lines.push(`Health and safety outcome: ${formatLabel(outcome)}.`);
    }
    if (selectedAlerts.length) {
      lines.push(`Alerts/follow-up: ${selectedAlerts.map((item) => titleCase(item)).join(", ")}.`);
    }
    if (note.trim()) {
      lines.push(note.trim());
    }
    return lines.join(" ");
  }, [assistance, categoryId, categoryOptions, engagement, formatLabel, note, outcome, selectedAlerts, selectedProtocols, selectedRisks, subtask, subtaskOptions, titleCase]);

  const toggleMultiSelect = (value, setter) => {
    setter((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  };

  const activeRules = uniqueValues([
    ...(healthSafetyRuntimeMap.moduleRules || []).filter((rule) => matchRuleExpression(rule.when, activeHealthTokens)).map((rule) => `${rule.when} -> ${(rule.activate || []).join(", ")}`),
    ...matchedRuleMappings.map((mapping) => `${mapping.when} -> ${(mapping.activate || []).join(", ")}`)
  ]);

  const StepCard = ({ index, title, hint, locked, children }) => (
    <View style={[styles.dspStepCard, locked && styles.dspStepCardLocked]}>
      <View style={styles.dspStepHeader}>
        <View style={styles.dspStepNumber}>
          <Text style={styles.dspStepNumberText}>{index}</Text>
        </View>
        <View style={styles.dspStepHeaderCopy}>
          <Text style={styles.dspStepTitle}>{title}</Text>
          {hint ? <Text style={styles.dspStepHint}>{hint}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );

  return (
    <Card title={healthSafetyInputSection.title || "Health and Safety Input Section"} containerStyle={styles.dspInputCard} bodyStyle={styles.dspInputCardBody}>
      <Text style={styles.dspInputLead}>{healthSafetyInputSection.description}</Text>
      <View style={styles.dspQuestionFlowCard}>
        {(healthSafetyInputSection.questionSteps || []).map((step, index) => (
          <View key={step} style={styles.dspQuestionFlowRow}>
            <View style={styles.dspQuestionFlowIndex}>
              <Text style={styles.dspQuestionFlowIndexText}>{index + 1}</Text>
            </View>
            <Text style={styles.dspQuestionFlowText}>{step}</Text>
          </View>
        ))}
      </View>
      <View style={styles.dspBathingExampleCard}>
        <Text style={styles.dspRuntimeHeading}>Build order</Text>
        <Text style={styles.dspRuntimeMeta}>{healthSafetyInputSection.buildOrderMessage}</Text>
      </View>
      <View style={styles.dspStepStack}>
        <StepCard index={1} title="What health and safety task was supported?" hint="Select the task, then narrow to an optional subtask.">
          <View style={[styles.dspInputGrid, isPhone && styles.dspInputGridPhone]}>
            <View style={styles.dspInputField}>
              <Text style={styles.dspInputLabel}>Task</Text>
              <DecisionDropdown value={categoryOptions.find((item) => item.value === categoryId)?.label || ""} options={categoryOptions} placeholder="Select task" dropdownId="health-task" activeDropdown={activeDropdown} onToggleDropdown={setActiveDropdown} onChange={setCategoryId} fieldStyle={styles.dspInputDropdown} />
            </View>
            <View style={styles.dspInputField}>
              <Text style={styles.dspInputLabel}>Subtask</Text>
              <DecisionDropdown value={subtaskOptions.find((item) => item.value === subtask)?.label || ""} options={subtaskOptions} placeholder={subtaskOptions.length ? "Optional subtask" : "No subtasks for this task yet"} dropdownId="health-subtask" activeDropdown={activeDropdown} onToggleDropdown={setActiveDropdown} onChange={setSubtask} fieldStyle={styles.dspInputDropdown} />
            </View>
          </View>
        </StepCard>
        <StepCard index={2} title="What was the outcome?" hint="Outcome sets the note direction and follow-up." locked={!categoryId}>
          <DecisionDropdown value={outcomeOptions.find((item) => item.value === outcome)?.label || ""} options={outcomeOptions} placeholder="Select outcome" dropdownId="health-outcome" activeDropdown={activeDropdown} onToggleDropdown={setActiveDropdown} onChange={setOutcome} fieldStyle={styles.dspInputDropdown} />
        </StepCard>
        <StepCard index={3} title="What assistance was provided?" hint="Use the health and safety assistance states before rules fire." locked={!outcome}>
          <DecisionDropdown value={assistanceOptions.find((item) => item.value === assistance)?.label || ""} options={assistanceOptions} placeholder="Select assistance" dropdownId="health-assistance" activeDropdown={activeDropdown} onToggleDropdown={setActiveDropdown} onChange={setAssistance} fieldStyle={styles.dspInputDropdown} />
        </StepCard>
        <StepCard index={4} title="How did the person present during the health and safety task?" hint="Use presentation to support observation quality and escalation logic." locked={!assistance}>
          <DecisionDropdown value={engagementOptions.find((item) => item.value === engagement)?.label || ""} options={engagementOptions} placeholder="Select presentation" dropdownId="health-engagement" activeDropdown={activeDropdown} onToggleDropdown={setActiveDropdown} onChange={setEngagement} fieldStyle={styles.dspInputDropdown} />
        </StepCard>
        <StepCard index={5} title="Were any health or safety risks or protocols active?" hint="Leave unselected if none were active." locked={!engagement && !assistance}>
          <View style={styles.dspInputSection}>
            <Text style={styles.dspInputLabel}>Risks</Text>
            <View style={styles.dspInputChipRow}>
              {riskOptions.map((item) => (
                <Pressable key={item} onPress={() => toggleMultiSelect(item, setSelectedRisks)} style={[styles.dspInputChip, selectedRisks.includes(item) && styles.dspInputChipActive]}>
                  <Text style={[styles.dspInputChipText, selectedRisks.includes(item) && styles.dspInputChipTextActive]}>{titleCase(item)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.dspInputSection}>
            <Text style={styles.dspInputLabel}>Protocols</Text>
            <View style={styles.dspInputChipRow}>
              {protocolOptions.map((item) => (
                <Pressable key={item} onPress={() => toggleMultiSelect(item, setSelectedProtocols)} style={[styles.dspInputChip, selectedProtocols.includes(item) && styles.dspInputChipActive]}>
                  <Text style={[styles.dspInputChipText, selectedProtocols.includes(item) && styles.dspInputChipTextActive]}>{titleCase(item)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </StepCard>
        <StepCard index={6} title="Were any alerts present?" hint="Use only real follow-up items." locked={!categoryId}>
          <View style={styles.dspInputChipRow}>
            {alertOptions.map((item) => (
              <Pressable key={item} onPress={() => toggleMultiSelect(item, setSelectedAlerts)} style={[styles.dspInputChip, selectedAlerts.includes(item) && styles.dspInputChipAlertActive]}>
                <Text style={[styles.dspInputChipText, selectedAlerts.includes(item) && styles.dspInputChipTextActive]}>{titleCase(item)}</Text>
              </Pressable>
            ))}
          </View>
        </StepCard>
        <StepCard index={7} title="Add a health and safety note" hint="Use this only for context that the structured choices do not already capture." locked={!categoryId}>
          <TextInput value={note} onChangeText={setNote} placeholder="Health and safety note" placeholderTextColor={colors.placeholder} multiline style={[styles.decisionRowInput, styles.dspInputNote]} />
        </StepCard>
      </View>
      <View style={[styles.dspRuntimeSummaryCard, isPhone && styles.dspRuntimeSummaryCardPhone]}>
        <View style={styles.dspRuntimeColumn}>
          <Text style={styles.dspRuntimeHeading}>Runtime Summary</Text>
          <Text style={styles.dspRuntimeSummaryText}>{categoryId ? `${categoryOptions.find((item) => item.value === categoryId)?.label || titleCase(categoryId)} health and safety flow is active.` : "Select a health and safety task to begin."}</Text>
        </View>
        <View style={styles.dspRuntimeColumn}>
          <Text style={styles.dspRuntimeHeading}>Active Modules</Text>
          <View style={styles.dspInputChipRow}>
            {activeCatalogModules.length ? activeCatalogModules.map((module) => (
              <View key={module.moduleId} style={styles.dspRuntimeModulePill}>
                <Text style={styles.dspRuntimeModulePillText}>{module.label}</Text>
              </View>
            )) : <Text style={styles.dspRuntimeMeta}>Select health and safety inputs to activate modules.</Text>}
          </View>
        </View>
      </View>
      <View style={styles.dspRuntimeSummaryCard}>
        <Text style={styles.dspRuntimeHeading}>Automatic Rules</Text>
        {activeRules.length ? activeRules.map((rule) => <Text key={rule} style={styles.dspRuntimeMeta}>{rule}</Text>) : <Text style={styles.dspRuntimeMeta}>Choose health and safety context to trigger rules.</Text>}
      </View>
      <View style={styles.dspRuntimeSummaryCard}>
        <Text style={styles.dspRuntimeHeading}>Generated Note Output</Text>
        <Text style={styles.dspRuntimeSummaryText}>{generatedPreview}</Text>
      </View>
    </Card>
  );
}

function DocumentationCoordinationInputFlowScreen({ isPhone }) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [categoryId, setCategoryId] = useState(documentationCoordinationInputSection.tasks?.[0]?.value || "");
  const [subtask, setSubtask] = useState("");
  const [outcome, setOutcome] = useState("");
  const [assistance, setAssistance] = useState("");
  const [engagement, setEngagement] = useState("");
  const [selectedRisks, setSelectedRisks] = useState([]);
  const [selectedProtocols, setSelectedProtocols] = useState([]);
  const [selectedAlerts, setSelectedAlerts] = useState([]);
  const [note, setNote] = useState("");

  const formatLabel = useCallback((value) => value.replace(/_/g, " "), []);
  const titleCase = useCallback(
    (value) => formatLabel(value).replace(/\b\w/g, (char) => char.toUpperCase()),
    [formatLabel]
  );

  const categoryOptions = useMemo(() => documentationCoordinationInputSection.tasks || [], []);
  const selectedTaskConfig = useMemo(() => documentationCoordinationInputSection.taskDetails?.[categoryId] || {}, [categoryId]);

  useEffect(() => {
    if (!categoryOptions.length) {
      setCategoryId("");
      return;
    }
    if (!categoryOptions.some((option) => option.value === categoryId)) {
      setCategoryId(categoryOptions[0].value);
    }
  }, [categoryId, categoryOptions]);

  const subtaskOptions = useMemo(() => selectedTaskConfig.subtasks || [], [selectedTaskConfig]);

  useEffect(() => {
    setSubtask("");
    setOutcome("");
    setAssistance("");
    setEngagement("");
    setSelectedRisks([]);
    setSelectedProtocols([]);
    setSelectedAlerts([]);
    setNote("");
  }, [categoryId]);

  useEffect(() => {
    if (!subtaskOptions.some((option) => option.value === subtask)) {
      setSubtask("");
    }
  }, [subtask, subtaskOptions]);

  const outcomeOptions = useMemo(() => documentationCoordinationInputSection.genericOutcomeOptions || [], []);
  const assistanceOptions = useMemo(() => documentationCoordinationInputSection.genericAssistanceOptions || [], []);
  const engagementOptions = documentationCoordinationInputSection.engagementOptions || [];
  const riskOptions = selectedTaskConfig.risks || [];
  const protocolOptions = selectedTaskConfig.protocols || [];
  const alertOptions = selectedTaskConfig.alerts || [];

  const activeTokens = useMemo(
    () =>
      uniqueValues([
        categoryId,
        outcome,
        assistance,
        engagement,
        ...selectedRisks,
        ...selectedProtocols,
        ...selectedAlerts,
      ]),
    [assistance, categoryId, engagement, outcome, selectedAlerts, selectedProtocols, selectedRisks]
  );

  const matchedRuleMappings = useMemo(
    () => (ruleMappingTable.mappings || []).filter((mapping) => matchRuleExpression(mapping.when, activeTokens)),
    [activeTokens]
  );

  const activeCatalogModules = useMemo(() => {
    const manualModules = [];
    if (categoryId === "shift_handoff") {
      manualModules.push("handoff_documentation");
    }
    if (categoryId === "family_communication") {
      manualModules.push("family_update_support");
    }
    if (categoryId === "care_team_communication") {
      manualModules.push("care_team_update_support");
    }
    if (categoryId === "progress_documentation") {
      manualModules.push("progress_summary_support");
    }
    const activatedModuleIds = collectActivatedModuleIds({
      activeTokens,
      runtimeRuleMap: documentationCoordinationRuntimeMap,
      extraRuleMappings: matchedRuleMappings,
    });
    return getModuleObjects([...manualModules, ...activatedModuleIds]);
  }, [activeTokens, categoryId, matchedRuleMappings]);

  const activeRules = uniqueValues([
    ...(documentationCoordinationRuntimeMap.moduleRules || []).filter((rule) => matchRuleExpression(rule.when, activeTokens)).map((rule) => `${rule.when} -> ${(rule.activate || []).join(", ")}`),
    ...matchedRuleMappings.map((mapping) => `${mapping.when} -> ${(mapping.activate || []).join(", ")}`)
  ]);

  const generatedPreview = useMemo(() => {
    const categoryLabel = categoryOptions.find((item) => item.value === categoryId)?.label || titleCase(categoryId || "task");
    const subtaskLabel = subtaskOptions.find((item) => item.value === subtask)?.label || "";
    if (!categoryId) {
      return "Select a documentation and coordination task to build the note.";
    }
    const lines = [];
    if (categoryId === "shift_handoff") {
      lines.push(`Staff completed ${subtaskLabel ? subtaskLabel.toLowerCase() : "shift handoff communication"}.`);
      if (selectedProtocols.includes("handoff_required")) {
        lines.push("Required handoff communication was completed.");
      }
    } else if (categoryId === "family_communication") {
      lines.push(`Staff completed ${subtaskLabel ? subtaskLabel.toLowerCase() : "family communication"}.`);
      if (selectedProtocols.includes("approved_update_only")) {
        lines.push("Only approved update content was communicated.");
      }
    } else if (categoryId === "care_team_communication") {
      lines.push(`Staff completed ${subtaskLabel ? subtaskLabel.toLowerCase() : "care team communication"}.`);
      if (selectedProtocols.includes("time_sensitive_update")) {
        lines.push("A time-sensitive update was communicated.");
      }
    } else if (categoryId === "progress_documentation") {
      lines.push(`Staff completed ${subtaskLabel ? subtaskLabel.toLowerCase() : "progress documentation"}.`);
    } else {
      lines.push(`Documentation and coordination task completed: ${categoryLabel}.`);
    }
    if (assistance) {
      lines.push(`${titleCase(assistance)} was used during the coordination task.`);
    }
    if (engagement) {
      lines.push(`Task context was ${formatLabel(engagement)}.`);
    }
    if (outcome) {
      lines.push(`Documentation outcome: ${formatLabel(outcome)}.`);
    }
    if (selectedAlerts.length) {
      lines.push(`Alerts/follow-up: ${selectedAlerts.map((item) => titleCase(item)).join(", ")}.`);
    }
    if (note.trim()) {
      lines.push(note.trim());
    }
    return lines.join(" ");
  }, [assistance, categoryId, categoryOptions, engagement, formatLabel, note, outcome, selectedAlerts, subtask, subtaskOptions, titleCase, selectedProtocols]);

  const toggleMultiSelect = (value, setter) => {
    setter((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  };

  const StepCard = ({ index, title, hint, locked, children }) => (
    <View style={[styles.dspStepCard, locked && styles.dspStepCardLocked]}>
      <View style={styles.dspStepHeader}>
        <View style={styles.dspStepNumber}>
          <Text style={styles.dspStepNumberText}>{index}</Text>
        </View>
        <View style={styles.dspStepHeaderCopy}>
          <Text style={styles.dspStepTitle}>{title}</Text>
          {hint ? <Text style={styles.dspStepHint}>{hint}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );

  return (
    <Card title={documentationCoordinationInputSection.title || "Documentation and Coordination Input Section"} containerStyle={styles.dspInputCard} bodyStyle={styles.dspInputCardBody}>
      <Text style={styles.dspInputLead}>{documentationCoordinationInputSection.description}</Text>
      <View style={styles.dspQuestionFlowCard}>
        {(documentationCoordinationInputSection.questionSteps || []).map((step, index) => (
          <View key={step} style={styles.dspQuestionFlowRow}>
            <View style={styles.dspQuestionFlowIndex}>
              <Text style={styles.dspQuestionFlowIndexText}>{index + 1}</Text>
            </View>
            <Text style={styles.dspQuestionFlowText}>{step}</Text>
          </View>
        ))}
      </View>
      <View style={styles.dspBathingExampleCard}>
        <Text style={styles.dspRuntimeHeading}>Build order</Text>
        <Text style={styles.dspRuntimeMeta}>{documentationCoordinationInputSection.buildOrderMessage}</Text>
      </View>
      <View style={styles.dspStepStack}>
        <StepCard index={1} title="What documentation or coordination task was completed?" hint="Select the task, then narrow to an optional subtask.">
          <View style={[styles.dspInputGrid, isPhone && styles.dspInputGridPhone]}>
            <View style={styles.dspInputField}>
              <Text style={styles.dspInputLabel}>Task</Text>
              <DecisionDropdown value={categoryOptions.find((item) => item.value === categoryId)?.label || ""} options={categoryOptions} placeholder="Select task" dropdownId="doccoord-task" activeDropdown={activeDropdown} onToggleDropdown={setActiveDropdown} onChange={setCategoryId} fieldStyle={styles.dspInputDropdown} />
            </View>
            <View style={styles.dspInputField}>
              <Text style={styles.dspInputLabel}>Subtask</Text>
              <DecisionDropdown value={subtaskOptions.find((item) => item.value === subtask)?.label || ""} options={subtaskOptions} placeholder={subtaskOptions.length ? "Optional subtask" : "No subtasks for this task yet"} dropdownId="doccoord-subtask" activeDropdown={activeDropdown} onToggleDropdown={setActiveDropdown} onChange={setSubtask} fieldStyle={styles.dspInputDropdown} />
            </View>
          </View>
        </StepCard>
        <StepCard index={2} title="What was the outcome?" hint="Outcome sets the note direction and follow-up." locked={!categoryId}>
          <DecisionDropdown value={outcomeOptions.find((item) => item.value === outcome)?.label || ""} options={outcomeOptions} placeholder="Select outcome" dropdownId="doccoord-outcome" activeDropdown={activeDropdown} onToggleDropdown={setActiveDropdown} onChange={setOutcome} fieldStyle={styles.dspInputDropdown} />
        </StepCard>
        <StepCard index={3} title="What level of support or coordination was provided?" hint="Use the coordination support states before rules fire." locked={!outcome}>
          <DecisionDropdown value={assistanceOptions.find((item) => item.value === assistance)?.label || ""} options={assistanceOptions} placeholder="Select support" dropdownId="doccoord-assistance" activeDropdown={activeDropdown} onToggleDropdown={setActiveDropdown} onChange={setAssistance} fieldStyle={styles.dspInputDropdown} />
        </StepCard>
        <StepCard index={4} title="How did the person or team context present during this task?" hint="Use this to capture clarity, urgency, and escalation context." locked={!assistance}>
          <DecisionDropdown value={engagementOptions.find((item) => item.value === engagement)?.label || ""} options={engagementOptions} placeholder="Select context" dropdownId="doccoord-engagement" activeDropdown={activeDropdown} onToggleDropdown={setActiveDropdown} onChange={setEngagement} fieldStyle={styles.dspInputDropdown} />
        </StepCard>
        <StepCard index={5} title="Were any communication risks, requirements, or protocols active?" hint="Leave unselected if none were active." locked={!engagement && !assistance}>
          <View style={styles.dspInputSection}>
            <Text style={styles.dspInputLabel}>Risks</Text>
            <View style={styles.dspInputChipRow}>
              {riskOptions.map((item) => (
                <Pressable key={item} onPress={() => toggleMultiSelect(item, setSelectedRisks)} style={[styles.dspInputChip, selectedRisks.includes(item) && styles.dspInputChipActive]}>
                  <Text style={[styles.dspInputChipText, selectedRisks.includes(item) && styles.dspInputChipTextActive]}>{titleCase(item)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.dspInputSection}>
            <Text style={styles.dspInputLabel}>Protocols</Text>
            <View style={styles.dspInputChipRow}>
              {protocolOptions.map((item) => (
                <Pressable key={item} onPress={() => toggleMultiSelect(item, setSelectedProtocols)} style={[styles.dspInputChip, selectedProtocols.includes(item) && styles.dspInputChipActive]}>
                  <Text style={[styles.dspInputChipText, selectedProtocols.includes(item) && styles.dspInputChipTextActive]}>{titleCase(item)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </StepCard>
        <StepCard index={6} title="Were any alerts or follow-up needs present?" hint="Use only real follow-up items." locked={!categoryId}>
          <View style={styles.dspInputChipRow}>
            {alertOptions.map((item) => (
              <Pressable key={item} onPress={() => toggleMultiSelect(item, setSelectedAlerts)} style={[styles.dspInputChip, selectedAlerts.includes(item) && styles.dspInputChipAlertActive]}>
                <Text style={[styles.dspInputChipText, selectedAlerts.includes(item) && styles.dspInputChipTextActive]}>{titleCase(item)}</Text>
              </Pressable>
            ))}
          </View>
        </StepCard>
        <StepCard index={7} title="Add a documentation and coordination note" hint="Use this only for context that the structured choices do not already capture." locked={!categoryId}>
          <TextInput value={note} onChangeText={setNote} placeholder="Documentation and coordination note" placeholderTextColor={colors.placeholder} multiline style={[styles.decisionRowInput, styles.dspInputNote]} />
        </StepCard>
      </View>
      <View style={[styles.dspRuntimeSummaryCard, isPhone && styles.dspRuntimeSummaryCardPhone]}>
        <View style={styles.dspRuntimeColumn}>
          <Text style={styles.dspRuntimeHeading}>Runtime Summary</Text>
          <Text style={styles.dspRuntimeSummaryText}>{categoryId ? `${categoryOptions.find((item) => item.value === categoryId)?.label || titleCase(categoryId)} documentation flow is active.` : "Select a documentation task to begin."}</Text>
        </View>
        <View style={styles.dspRuntimeColumn}>
          <Text style={styles.dspRuntimeHeading}>Active Modules</Text>
          <View style={styles.dspInputChipRow}>
            {activeCatalogModules.length ? activeCatalogModules.map((module) => (
              <View key={module.moduleId} style={styles.dspRuntimeModulePill}>
                <Text style={styles.dspRuntimeModulePillText}>{module.label}</Text>
              </View>
            )) : <Text style={styles.dspRuntimeMeta}>Select documentation inputs to activate modules.</Text>}
          </View>
        </View>
      </View>
      <View style={styles.dspRuntimeSummaryCard}>
        <Text style={styles.dspRuntimeHeading}>Automatic Rules</Text>
        {activeRules.length ? activeRules.map((rule) => <Text key={rule} style={styles.dspRuntimeMeta}>{rule}</Text>) : <Text style={styles.dspRuntimeMeta}>Choose documentation context to trigger rules.</Text>}
      </View>
      <View style={styles.dspRuntimeSummaryCard}>
        <Text style={styles.dspRuntimeHeading}>Generated Note Output</Text>
        <Text style={styles.dspRuntimeSummaryText}>{generatedPreview}</Text>
      </View>
    </Card>
  );
}

function BehavioralInputFlowScreen({ isPhone }) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [behaviorObserved, setBehaviorObserved] = useState(
    behavioralInputSection.behaviorOptions?.[0]?.value || ""
  );
  const [interventionUsed, setInterventionUsed] = useState("");
  const [response, setResponse] = useState("");
  const [engagement, setEngagement] = useState("");
  const [selectedRisks, setSelectedRisks] = useState([]);
  const [selectedPlans, setSelectedPlans] = useState([]);
  const [selectedAlerts, setSelectedAlerts] = useState([]);
  const [note, setNote] = useState("");

  const formatLabel = useCallback((value) => value.replace(/_/g, " "), []);
  const titleCase = useCallback(
    (value) => formatLabel(value).replace(/\b\w/g, (char) => char.toUpperCase()),
    [formatLabel]
  );

  const toggleMultiSelect = (value, setter) => {
    setter((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  };

  const activeBehaviorTokens = useMemo(
    () =>
      uniqueValues([
        behaviorObserved,
        interventionUsed,
        response,
        engagement,
        ...selectedRisks,
        ...selectedPlans,
        ...selectedAlerts,
      ]),
    [behaviorObserved, engagement, interventionUsed, response, selectedAlerts, selectedPlans, selectedRisks]
  );

  const behavioralMatchedRuleMappings = useMemo(
    () => (ruleMappingTable.mappings || []).filter((mapping) => matchRuleExpression(mapping.when, activeBehaviorTokens)),
    [activeBehaviorTokens]
  );

  const activeModules = useMemo(() => {
    const manualModules = ["behavioral_observation_support"];
    const activatedModuleIds = collectActivatedModuleIds({
      activeTokens: activeBehaviorTokens,
      runtimeRuleMap: behavioralRuntimeMap,
      extraRuleMappings: behavioralMatchedRuleMappings,
    });
    return getModuleObjects([...manualModules, ...activatedModuleIds]);
  }, [activeBehaviorTokens, behavioralMatchedRuleMappings]);

  const automaticRules = useMemo(
    () =>
      uniqueValues([
        ...(behavioralRuntimeMap.moduleRules || [])
          .filter((rule) => matchRuleExpression(rule.when, activeBehaviorTokens))
          .map((rule) => `${rule.when} -> ${(rule.activate || []).join(", ")}`),
        ...behavioralMatchedRuleMappings.map((mapping) => `${mapping.when} -> ${(mapping.activate || []).join(", ")}`),
      ]),
    [activeBehaviorTokens, behavioralMatchedRuleMappings]
  );

  const generatedPreview = useMemo(() => {
    const behaviorLabel =
      behavioralInputSection.behaviorOptions?.find((item) => item.value === behaviorObserved)?.label || titleCase(behaviorObserved || "behavior");
    const interventionLabel =
      behavioralInputSection.interventionOptions?.find((item) => item.value === interventionUsed)?.label || titleCase(interventionUsed || "");
    const responseLabel =
      behavioralInputSection.responseOptions?.find((item) => item.value === response)?.label || titleCase(response || "");

    const lines = [];
    if (behaviorObserved) {
      if (behaviorObserved === "no_target_behavior_observed") {
        lines.push("No target behavior was observed during this support period.");
      } else if (behaviorObserved === "needed_redirection") {
        lines.push("Staff provided behavior support after redirection was needed.");
      } else if (behaviorObserved === "boundary_seeking_behavior") {
        lines.push("Staff observed boundary-seeking behavior during the support period.");
      } else if (behaviorObserved === "verbal_escalation") {
        lines.push("Staff observed verbal escalation and responded with behavioral support.");
      } else {
        lines.push(`Staff observed ${behaviorLabel.toLowerCase()}.`);
      }
    }
    if (interventionUsed) {
      if (interventionUsed === "verbal_redirection") {
        lines.push("Verbal redirection was provided.");
      } else if (interventionUsed === "cueing_and_reassurance") {
        lines.push("Cueing and reassurance were provided.");
      } else if (interventionUsed === "de_escalation_support") {
        lines.push("De-escalation support was implemented.");
      } else if (interventionUsed === "behavior_plan_followed") {
        lines.push("The active behavior support plan was followed.");
      } else {
        lines.push(`${interventionLabel} was used.`);
      }
    }
    if (response) {
      if (response === "accepted_redirection") {
        lines.push("Client accepted redirection.");
      } else if (response === "calmed_with_support") {
        lines.push("Client calmed with support.");
      } else if (response === "needed_repeated_prompts") {
        lines.push("Client required repeated prompts.");
      } else if (response === "behavior_continued") {
        lines.push("Behavior continued despite intervention.");
      } else if (response === "partial_improvement") {
        lines.push("Client showed partial improvement with support.");
      } else {
        lines.push(`Client ${responseLabel.toLowerCase()}.`);
      }
    }
    if (engagement) {
      lines.push(`Client presentation was ${formatLabel(engagement)} during behavioral support.`);
    }
    if (selectedRisks.includes("behavioral_escalation_risk")) {
      lines.push("Behavioral escalation risk was monitored.");
    }
    if (selectedPlans.includes("line_of_sight_required")) {
      lines.push("Line-of-sight supervision was maintained.");
    }
    if (selectedPlans.includes("behavior_support_plan_active")) {
      lines.push("Behavior support plan interventions remained active during support.");
    }
    if (selectedAlerts.length) {
      lines.push(`Alerts/follow-up: ${selectedAlerts.map((item) => titleCase(item)).join(", ")}.`);
    }
    if (note.trim()) {
      lines.push(note.trim());
    }
    return lines.join(" ") || "Select behavioral inputs to build the note preview.";
  }, [behaviorObserved, engagement, formatLabel, interventionUsed, note, response, selectedAlerts, selectedPlans, selectedRisks, titleCase]);

  const StepCard = ({ index, title, hint, locked, children }) => (
    <View style={[styles.dspStepCard, locked && styles.dspStepCardLocked]}>
      <View style={styles.dspStepHeader}>
        <View style={styles.dspStepNumber}>
          <Text style={styles.dspStepNumberText}>{index}</Text>
        </View>
        <View style={styles.dspStepHeaderCopy}>
          <Text style={styles.dspStepTitle}>{title}</Text>
          {hint ? <Text style={styles.dspStepHint}>{hint}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );

  return (
    <Card title={behavioralInputSection.title || "Behavioral Input Section"} containerStyle={styles.dspInputCard} bodyStyle={styles.dspInputCardBody}>
      <Text style={styles.dspInputLead}>{behavioralInputSection.description}</Text>
      <View style={styles.dspQuestionFlowCard}>
        {(behavioralInputSection.questionSteps || []).map((step, index) => (
          <View key={step} style={styles.dspQuestionFlowRow}>
            <View style={styles.dspQuestionFlowIndex}>
              <Text style={styles.dspQuestionFlowIndexText}>{index + 1}</Text>
            </View>
            <Text style={styles.dspQuestionFlowText}>{step}</Text>
          </View>
        ))}
      </View>
      <View style={styles.dspBathingExampleCard}>
        <Text style={styles.dspRuntimeHeading}>Build order</Text>
        <Text style={styles.dspRuntimeMeta}>{behavioralInputSection.buildOrderMessage}</Text>
      </View>
      <View style={styles.dspStepStack}>
        <StepCard index={1} title="What behavior or support need was observed?" hint="Start with the target behavior or support concern.">
          <DecisionDropdown
            value={behavioralInputSection.behaviorOptions?.find((item) => item.value === behaviorObserved)?.label || ""}
            options={behavioralInputSection.behaviorOptions || []}
            placeholder="Select behavior"
            dropdownId="behavioral-observed"
            activeDropdown={activeDropdown}
            onToggleDropdown={setActiveDropdown}
            onChange={setBehaviorObserved}
            fieldStyle={styles.dspInputDropdown}
          />
        </StepCard>
        <StepCard index={2} title="What intervention was used?" hint="Choose the least restrictive support used." locked={!behaviorObserved}>
          <DecisionDropdown
            value={behavioralInputSection.interventionOptions?.find((item) => item.value === interventionUsed)?.label || ""}
            options={behavioralInputSection.interventionOptions || []}
            placeholder="Select intervention"
            dropdownId="behavioral-intervention"
            activeDropdown={activeDropdown}
            onToggleDropdown={setActiveDropdown}
            onChange={setInterventionUsed}
            fieldStyle={styles.dspInputDropdown}
          />
        </StepCard>
        <StepCard index={3} title="How did the person respond?" hint="Observed response is required for defensible behavior documentation." locked={!interventionUsed}>
          <DecisionDropdown
            value={behavioralInputSection.responseOptions?.find((item) => item.value === response)?.label || ""}
            options={behavioralInputSection.responseOptions || []}
            placeholder="Select response"
            dropdownId="behavioral-response"
            activeDropdown={activeDropdown}
            onToggleDropdown={setActiveDropdown}
            onChange={setResponse}
            fieldStyle={styles.dspInputDropdown}
          />
        </StepCard>
        <StepCard index={4} title="How did the person engage during the behavioral support?" hint="Engagement helps explain participation and re-engagement needs." locked={!response}>
          <DecisionDropdown
            value={behavioralInputSection.engagementOptions?.find((item) => item.value === engagement)?.label || ""}
            options={behavioralInputSection.engagementOptions || []}
            placeholder="Select engagement"
            dropdownId="behavioral-engagement"
            activeDropdown={activeDropdown}
            onToggleDropdown={setActiveDropdown}
            onChange={setEngagement}
            fieldStyle={styles.dspInputDropdown}
          />
        </StepCard>
        <StepCard index={5} title="Were any behavioral risks or plans active?" hint="Leave unselected if none were active." locked={!engagement && !response}>
          <View style={styles.dspInputSection}>
            <Text style={styles.dspInputLabel}>Risks</Text>
            <View style={styles.dspInputChipRow}>
              {(behavioralInputSection.riskOptions || []).map((item) => (
                <Pressable
                  key={item}
                  onPress={() => toggleMultiSelect(item, setSelectedRisks)}
                  style={[styles.dspInputChip, selectedRisks.includes(item) && styles.dspInputChipActive]}
                >
                  <Text style={[styles.dspInputChipText, selectedRisks.includes(item) && styles.dspInputChipTextActive]}>
                    {titleCase(item)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.dspInputSection}>
            <Text style={styles.dspInputLabel}>Plans / Protocols</Text>
            <View style={styles.dspInputChipRow}>
              {(behavioralInputSection.planOptions || []).map((item) => (
                <Pressable
                  key={item}
                  onPress={() => toggleMultiSelect(item, setSelectedPlans)}
                  style={[styles.dspInputChip, selectedPlans.includes(item) && styles.dspInputChipActive]}
                >
                  <Text style={[styles.dspInputChipText, selectedPlans.includes(item) && styles.dspInputChipTextActive]}>
                    {titleCase(item)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </StepCard>
        <StepCard index={6} title="Were any alerts or follow-up needs present?" hint="Use only real follow-up items." locked={!behaviorObserved}>
          <View style={styles.dspInputChipRow}>
            {(behavioralInputSection.alertOptions || []).map((item) => (
              <Pressable
                key={item}
                onPress={() => toggleMultiSelect(item, setSelectedAlerts)}
                style={[styles.dspInputChip, selectedAlerts.includes(item) && styles.dspInputChipAlertActive]}
              >
                <Text style={[styles.dspInputChipText, selectedAlerts.includes(item) && styles.dspInputChipTextActive]}>
                  {titleCase(item)}
                </Text>
              </Pressable>
            ))}
          </View>
        </StepCard>
        <StepCard index={7} title="Add a behavioral note" hint="Use this for context not already captured by the structured choices." locked={!behaviorObserved}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Behavioral note"
            placeholderTextColor={colors.placeholder}
            multiline
            style={[styles.decisionRowInput, styles.dspInputNote]}
          />
        </StepCard>
      </View>
      <View style={[styles.dspRuntimeSummaryCard, isPhone && styles.dspRuntimeSummaryCardPhone]}>
        <View style={styles.dspRuntimeColumn}>
          <Text style={styles.dspRuntimeHeading}>Behavior Summary</Text>
          <Text style={styles.dspRuntimeSummaryText}>
            {behaviorObserved
              ? `Behavior selected: ${behavioralInputSection.behaviorOptions?.find((item) => item.value === behaviorObserved)?.label || titleCase(behaviorObserved)}.`
              : "Select the target behavior to start the behavioral runtime."}
          </Text>
          <Text style={styles.dspRuntimeMeta}>{`Interventions: ${(behavioralInputSection.interventionOptions || []).map((item) => item.label).join(", ")}`}</Text>
        </View>
        <View style={styles.dspRuntimeColumn}>
          <Text style={styles.dspRuntimeHeading}>Active Modules</Text>
          <View style={styles.dspInputChipRow}>
            {activeModules.length ? (
              activeModules.map((module) => (
                <View key={module.moduleId} style={styles.dspRuntimeModulePill}>
                  <Text style={styles.dspRuntimeModulePillText}>{module.label}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.dspRuntimeMeta}>Select behavioral inputs to activate modules.</Text>
            )}
          </View>
        </View>
      </View>
      <View style={styles.dspRuntimeSummaryCard}>
        <Text style={styles.dspRuntimeHeading}>Automatic Rules</Text>
        {automaticRules.length ? (
          automaticRules.map((rule) => (
            <Text key={rule} style={styles.dspRuntimeMeta}>{rule}</Text>
          ))
        ) : (
          <Text style={styles.dspRuntimeMeta}>Choose behavior, response, or follow-up items to trigger rules.</Text>
        )}
      </View>
      <View style={styles.dspRuntimeSummaryCard}>
        <Text style={styles.dspRuntimeHeading}>Generated Note Output</Text>
        <Text style={styles.dspRuntimeSummaryText}>{generatedPreview}</Text>
      </View>
    </Card>
  );
}

function IadlInputFlowScreen({ isPhone }) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [categoryId, setCategoryId] = useState(iadlInputSection.tasks?.[0]?.value || "");
  const [subtask, setSubtask] = useState("");
  const [outcome, setOutcome] = useState("");
  const [assistance, setAssistance] = useState("");
  const [engagement, setEngagement] = useState("");
  const [selectedRisks, setSelectedRisks] = useState([]);
  const [selectedProtocols, setSelectedProtocols] = useState([]);
  const [selectedAlerts, setSelectedAlerts] = useState([]);
  const [note, setNote] = useState("");

  const formatLabel = useCallback((value) => value.replace(/_/g, " "), []);
  const titleCase = useCallback(
    (value) => formatLabel(value).replace(/\b\w/g, (char) => char.toUpperCase()),
    [formatLabel]
  );

  const categoryOptions = useMemo(() => iadlInputSection.tasks || [], []);
  const selectedTaskConfig = useMemo(
    () => iadlInputSection.taskDetails?.[categoryId] || {},
    [categoryId]
  );

  useEffect(() => {
    if (!categoryOptions.length) {
      setCategoryId("");
      return;
    }
    if (!categoryOptions.some((option) => option.value === categoryId)) {
      setCategoryId(categoryOptions[0].value);
    }
  }, [categoryId, categoryOptions]);

  const subtaskOptions = useMemo(() => selectedTaskConfig.subtasks || [], [selectedTaskConfig]);

  useEffect(() => {
    setSubtask("");
    setOutcome("");
    setAssistance("");
    setEngagement("");
    setSelectedRisks([]);
    setSelectedProtocols([]);
    setSelectedAlerts([]);
    setNote("");
  }, [categoryId]);

  useEffect(() => {
    if (!subtaskOptions.some((option) => option.value === subtask)) {
      setSubtask("");
    }
  }, [subtask, subtaskOptions]);

  const runtime = useMemo(
    () =>
      composeDecisionRuntime({
        workflowId: "generic",
        categoryId,
        outcome,
        assistance,
      }),
    [categoryId, outcome, assistance]
  );

  const outcomeOptions = useMemo(
    () => iadlInputSection.genericOutcomeOptions || [],
    []
  );

  const assistanceOptions = useMemo(() => {
    if (iadlInputSection.assistanceOverrides?.[categoryId]) {
      return iadlInputSection.assistanceOverrides[categoryId];
    }
    return iadlInputSection.genericAssistanceOptions || [];
  }, [categoryId]);

  useEffect(() => {
    if (!outcomeOptions.some((option) => option.value === outcome)) {
      setOutcome("");
    }
  }, [outcome, outcomeOptions]);

  useEffect(() => {
    if (!assistanceOptions.some((option) => option.value === assistance)) {
      setAssistance("");
    }
  }, [assistance, assistanceOptions]);

  const engagementOptions = iadlInputSection.engagementOptions || [];
  const riskOptions = selectedTaskConfig.risks || [];
  const protocolOptions = selectedTaskConfig.protocols || [];
  const alertOptions = selectedTaskConfig.alerts || [];
  const medicationSupportActive = categoryId === "medication_support";
  const mealPreparationActive = categoryId === "meal_preparation";

  const activeIadlTokens = useMemo(
    () =>
      uniqueValues([
        categoryId,
        outcome,
        assistance,
        engagement,
        ...selectedRisks,
        ...selectedProtocols,
        ...selectedAlerts,
      ]),
    [assistance, categoryId, engagement, outcome, selectedAlerts, selectedProtocols, selectedRisks]
  );

  const matchedRuleMappings = useMemo(
    () => (ruleMappingTable.mappings || []).filter((mapping) => matchRuleExpression(mapping.when, activeIadlTokens)),
    [activeIadlTokens]
  );

  const activeCatalogModules = useMemo(() => {
    const manualTaskModules = [];
    if (mealPreparationActive) {
      manualTaskModules.push("meal_preparation_support");
    }
    if (medicationSupportActive) {
      manualTaskModules.push("medication_reminder");
    }
    const activatedModuleIds = collectActivatedModuleIds({
      activeTokens: activeIadlTokens,
      runtimeRuleMap: iadlRuntimeMap,
      extraRuleMappings: matchedRuleMappings,
    });
    return getModuleObjects([...runtime.activeModules, ...manualTaskModules, ...activatedModuleIds]);
  }, [activeIadlTokens, matchedRuleMappings, mealPreparationActive, medicationSupportActive, runtime.activeModules]);

  const generatedPreview = useMemo(() => {
    const categoryLabel = categoryOptions.find((item) => item.value === categoryId)?.label || titleCase(categoryId || "task");
    const subtaskLabel = subtaskOptions.find((item) => item.value === subtask)?.label || "";
    if (!categoryId) {
      return "Select an IADL task to build the runtime note.";
    }

    const lines = [];
    if (medicationSupportActive) {
      lines.push(`Staff supported the client with ${subtaskLabel ? subtaskLabel.toLowerCase() : "medication support"}.`);
      if (assistance) {
        lines.push(`${titleCase(assistance)} was provided during medication support.`);
      }
      if (engagement) {
        lines.push(`Client was ${formatLabel(engagement)} during the task.`);
      }
      if (selectedProtocols.includes("medication_prompt_only")) {
        lines.push("Medication prompt-only protocol was followed.");
      }
      if (selectedRisks.includes("medication_risk")) {
        lines.push("Medication risk precautions were maintained.");
      }
      if (selectedAlerts.includes("missed_medication_window")) {
        lines.push("Medication timing follow-up was required.");
      }
      if (outcome) {
        lines.push(`Medication support outcome: ${formatLabel(outcome)}.`);
      }
    } else if (mealPreparationActive) {
      lines.push(`Staff supported the client with ${subtaskLabel ? subtaskLabel.toLowerCase() : "meal preparation"}.`);
      if (assistance) {
        lines.push(`${titleCase(assistance)} was provided during meal preparation.`);
      }
      if (engagement) {
        lines.push(`Client was ${formatLabel(engagement)} during the task.`);
      }
      if (selectedRisks.includes("choking_risk")) {
        lines.push("Choking precautions were maintained.");
      }
      if (selectedProtocols.includes("dietary_restrictions_active")) {
        lines.push("Dietary restrictions were followed.");
      }
      if (selectedProtocols.includes("thickened_liquids_required")) {
        lines.push("Required liquid consistency precautions were followed.");
      }
      if (outcome) {
        lines.push(`Meal preparation outcome: ${formatLabel(outcome)}.`);
      }
    } else if (categoryId === "shopping") {
      lines.push(`Staff supported the client with ${subtaskLabel ? subtaskLabel.toLowerCase() : "shopping"}.`);
      if (assistance) {
        lines.push(`${titleCase(assistance)} was provided during shopping support.`);
      }
      if (selectedRisks.includes("elopement_risk")) {
        lines.push("Elopement risk precautions were maintained in the community.");
      }
      if (selectedProtocols.includes("line_of_sight_required")) {
        lines.push("Line-of-sight supervision was maintained.");
      }
      if (outcome) {
        lines.push(`Shopping outcome: ${formatLabel(outcome)}.`);
      }
    } else if (categoryId === "transportation_coordination") {
      lines.push(`Staff supported the client with ${subtaskLabel ? subtaskLabel.toLowerCase() : "transportation coordination"}.`);
      if (assistance) {
        lines.push(`${titleCase(assistance)} was provided during transportation coordination.`);
      }
      if (selectedAlerts.includes("missed_transport_window")) {
        lines.push("Transport timing follow-up was required.");
      }
      if (outcome) {
        lines.push(`Transportation coordination outcome: ${formatLabel(outcome)}.`);
      }
    } else {
      lines.push(`IADL task documented: ${categoryLabel}.`);
      if (subtaskLabel) {
        lines.push(`Subtask: ${subtaskLabel}.`);
      }
      if (outcome) {
        lines.push(`Outcome: ${titleCase(outcome)}.`);
      }
      if (assistance) {
        lines.push(`Assistance: ${titleCase(assistance)}.`);
      }
      if (engagement) {
        lines.push(`Engagement: ${titleCase(engagement)}.`);
      }
    }
    if (!medicationSupportActive && !mealPreparationActive && engagement) {
      lines.push(`Client was ${formatLabel(engagement)} during the task.`);
    }
    if (selectedAlerts.length) {
      lines.push(`Alerts/follow-up: ${selectedAlerts.map((item) => titleCase(item)).join(", ")}.`);
    }
    if (note.trim()) {
      lines.push(note.trim());
    }
    return lines.join(" ");
  }, [
    assistance,
    categoryId,
    categoryOptions,
    engagement,
    formatLabel,
    mealPreparationActive,
    medicationSupportActive,
    note,
    outcome,
    selectedAlerts,
    selectedProtocols,
    selectedRisks,
    subtask,
    subtaskOptions,
    titleCase,
  ]);

  const followUpFlags = useMemo(() => {
    const flags = [];
    if (selectedAlerts.includes("nurse_notification_needed")) {
      flags.push("Nurse review");
    }
    if (selectedAlerts.includes("supervisor_notification_needed")) {
      flags.push("Supervisor review");
    }
    if (selectedAlerts.includes("change_in_baseline")) {
      flags.push("Change in baseline follow-up");
    }
    if (selectedAlerts.includes("missed_medication_window")) {
      flags.push("Medication timing follow-up");
    }
    if (selectedAlerts.includes("missed_transport_window")) {
      flags.push("Transport follow-up");
    }
    return [...new Set(flags)];
  }, [selectedAlerts]);

  const toggleMultiSelect = (value, setter) => {
    setter((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  };

  const questionSteps = iadlInputSection.questionSteps || [];

  const StepCard = ({ index, title, hint, locked, children }) => (
    <View style={[styles.dspStepCard, locked && styles.dspStepCardLocked]}>
      <View style={styles.dspStepHeader}>
        <View style={styles.dspStepNumber}>
          <Text style={styles.dspStepNumberText}>{index}</Text>
        </View>
        <View style={styles.dspStepHeaderCopy}>
          <Text style={styles.dspStepTitle}>{title}</Text>
          {hint ? <Text style={styles.dspStepHint}>{hint}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );

  return (
    <Card title={iadlInputSection.title || "IADL Input Section"} containerStyle={styles.dspInputCard} bodyStyle={styles.dspInputCardBody}>
      <Text style={styles.dspInputLead}>{iadlInputSection.description}</Text>
      <View style={styles.dspQuestionFlowCard}>
        {questionSteps.map((step, index) => (
          <View key={step} style={styles.dspQuestionFlowRow}>
            <View style={styles.dspQuestionFlowIndex}>
              <Text style={styles.dspQuestionFlowIndexText}>{index + 1}</Text>
            </View>
            <Text style={styles.dspQuestionFlowText}>{step}</Text>
          </View>
        ))}
      </View>
      <View style={styles.dspBathingExampleCard}>
        <Text style={styles.dspRuntimeHeading}>Build order</Text>
        <Text style={styles.dspRuntimeMeta}>{iadlInputSection.buildOrderMessage}</Text>
      </View>
      <View style={styles.dspStepStack}>
        <StepCard
          index={1}
          title="What IADL task was supported?"
          hint={mealPreparationActive || medicationSupportActive ? "This task has IADL-specific prompts, overlays, and note output." : "Select the IADL task, then narrow to an optional subtask."}
        >
          <View style={[styles.dspInputGrid, isPhone && styles.dspInputGridPhone]}>
            <View style={styles.dspInputField}>
              <Text style={styles.dspInputLabel}>Task</Text>
              <DecisionDropdown
                value={categoryOptions.find((item) => item.value === categoryId)?.label || ""}
                options={categoryOptions}
                placeholder="Select task"
                dropdownId="iadl-task"
                activeDropdown={activeDropdown}
                onToggleDropdown={setActiveDropdown}
                onChange={setCategoryId}
                fieldStyle={styles.dspInputDropdown}
              />
            </View>
            <View style={styles.dspInputField}>
              <Text style={styles.dspInputLabel}>Subtask</Text>
              <DecisionDropdown
                value={subtaskOptions.find((item) => item.value === subtask)?.label || ""}
                options={subtaskOptions}
                placeholder={subtaskOptions.length ? "Optional subtask" : "No subtasks for this task yet"}
                dropdownId="iadl-subtask"
                activeDropdown={activeDropdown}
                onToggleDropdown={setActiveDropdown}
                onChange={setSubtask}
                fieldStyle={styles.dspInputDropdown}
              />
            </View>
          </View>
        </StepCard>
        <StepCard index={2} title="What was the outcome?" hint="Outcome sets the note direction and follow-up." locked={!categoryId}>
          <DecisionDropdown
            value={outcomeOptions.find((item) => item.value === outcome)?.label || ""}
            options={outcomeOptions}
            placeholder="Select outcome"
            dropdownId="iadl-outcome"
            activeDropdown={activeDropdown}
            onToggleDropdown={setActiveDropdown}
            onChange={setOutcome}
            fieldStyle={styles.dspInputDropdown}
          />
        </StepCard>
        <StepCard index={3} title="What assistance was provided?" hint="Use the IADL assistance states before rules fire." locked={!outcome}>
          <DecisionDropdown
            value={assistanceOptions.find((item) => item.value === assistance)?.label || ""}
            options={assistanceOptions}
            placeholder="Select assistance"
            dropdownId="iadl-assistance"
            activeDropdown={activeDropdown}
            onToggleDropdown={setActiveDropdown}
            onChange={setAssistance}
            fieldStyle={styles.dspInputDropdown}
          />
        </StepCard>
        <StepCard index={4} title="How did the person engage during the IADL task?" hint="Engagement helps explain prompting, cueing, and follow-up." locked={!assistance}>
          <DecisionDropdown
            value={engagementOptions.find((item) => item.value === engagement)?.label || ""}
            options={engagementOptions}
            placeholder="Select engagement"
            dropdownId="iadl-engagement"
            activeDropdown={activeDropdown}
            onToggleDropdown={setActiveDropdown}
            onChange={setEngagement}
            fieldStyle={styles.dspInputDropdown}
          />
        </StepCard>
        <StepCard
          index={5}
          title="Were any IADL risks or protocols active?"
          hint="Leave unselected if none were active."
          locked={!engagement && !assistance}
        >
          <View style={styles.dspInputSection}>
            <Text style={styles.dspInputLabel}>Risks</Text>
            <View style={styles.dspInputChipRow}>
              {riskOptions.length ? (
                riskOptions.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => toggleMultiSelect(item, setSelectedRisks)}
                    style={[styles.dspInputChip, selectedRisks.includes(item) && styles.dspInputChipActive]}
                  >
                    <Text style={[styles.dspInputChipText, selectedRisks.includes(item) && styles.dspInputChipTextActive]}>
                      {titleCase(item)}
                    </Text>
                  </Pressable>
                ))
              ) : (
                <Text style={styles.dspRuntimeMeta}>No task-specific risks configured yet.</Text>
              )}
            </View>
          </View>
          <View style={styles.dspInputSection}>
            <Text style={styles.dspInputLabel}>Protocols</Text>
            <View style={styles.dspInputChipRow}>
              {protocolOptions.length ? (
                protocolOptions.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => toggleMultiSelect(item, setSelectedProtocols)}
                    style={[styles.dspInputChip, selectedProtocols.includes(item) && styles.dspInputChipActive]}
                  >
                    <Text style={[styles.dspInputChipText, selectedProtocols.includes(item) && styles.dspInputChipTextActive]}>
                      {titleCase(item)}
                    </Text>
                  </Pressable>
                ))
              ) : (
                <Text style={styles.dspRuntimeMeta}>No task-specific protocols configured yet.</Text>
              )}
            </View>
          </View>
        </StepCard>
        <StepCard index={6} title="Were any alerts present?" hint="Use only real follow-up items." locked={!categoryId}>
          <View style={styles.dspInputChipRow}>
            {alertOptions.length ? (
              alertOptions.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => toggleMultiSelect(item, setSelectedAlerts)}
                  style={[styles.dspInputChip, selectedAlerts.includes(item) && styles.dspInputChipAlertActive]}
                >
                  <Text style={[styles.dspInputChipText, selectedAlerts.includes(item) && styles.dspInputChipTextActive]}>
                    {titleCase(item)}
                  </Text>
                </Pressable>
              ))
            ) : (
              <Text style={styles.dspRuntimeMeta}>No task-specific alerts configured yet.</Text>
            )}
          </View>
        </StepCard>
        <StepCard index={7} title="Add an IADL note" hint="Use this only for context that the structured choices do not already capture." locked={!categoryId}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="IADL note"
            placeholderTextColor={colors.placeholder}
            multiline
            style={[styles.decisionRowInput, styles.dspInputNote]}
          />
        </StepCard>
      </View>
      <View style={[styles.dspRuntimeSummaryCard, isPhone && styles.dspRuntimeSummaryCardPhone]}>
        <View style={styles.dspRuntimeColumn}>
          <Text style={styles.dspRuntimeHeading}>Runtime Summary</Text>
          <Text style={styles.dspRuntimeSummaryText}>
            {categoryId
              ? `${categoryOptions.find((item) => item.value === categoryId)?.label || titleCase(categoryId)} IADL support flow is active.`
              : "Select an IADL task to begin."}
          </Text>
          <Text style={styles.dspRuntimeMeta}>{`Allowed outcomes: ${(outcomeOptions || []).map((item) => item.label).join(", ") || "None"}`}</Text>
          <Text style={styles.dspRuntimeMeta}>{`Allowed assistance: ${(assistanceOptions || []).map((item) => item.label).join(", ") || "None"}`}</Text>
        </View>
        <View style={styles.dspRuntimeColumn}>
          <Text style={styles.dspRuntimeHeading}>Active Modules</Text>
          <View style={styles.dspInputChipRow}>
            {activeCatalogModules.length ? (
              activeCatalogModules.map((module) => (
                <View key={module.moduleId} style={styles.dspRuntimeModulePill}>
                  <Text style={styles.dspRuntimeModulePillText}>{module.label}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.dspRuntimeMeta}>Select outcome and assistance to activate modules.</Text>
            )}
          </View>
        </View>
      </View>
      <View style={styles.dspRuntimeSummaryCard}>
        <Text style={styles.dspRuntimeHeading}>Automatic Rules</Text>
        {matchedRuleMappings.length || (iadlRuntimeMap.moduleRules || []).some((rule) => matchRuleExpression(rule.when, activeIadlTokens)) ? (
          uniqueValues([
            ...(iadlRuntimeMap.moduleRules || [])
              .filter((rule) => matchRuleExpression(rule.when, activeIadlTokens))
              .map((rule) => `${rule.when} -> ${(rule.activate || []).join(", ")}`),
            ...matchedRuleMappings.map((mapping) => `${mapping.when} -> ${mapping.activate.join(", ")}`),
          ]).map((rule) => (
            <Text key={rule} style={styles.dspRuntimeMeta}>{rule}</Text>
          ))
        ) : (
          <Text style={styles.dspRuntimeMeta}>Choose engagement or follow-up context to trigger rules.</Text>
        )}
      </View>
      <View style={styles.dspRuntimeSummaryCard}>
        <Text style={styles.dspRuntimeHeading}>Structured Output</Text>
        <Text style={styles.dspRuntimeMeta}>{`Output sections: ${(noteOutputTemplate.sections || []).map((item) => item.label).join(" | ")}`}</Text>
        <Text style={styles.dspRuntimeMeta}>{`Follow-up flags: ${followUpFlags.join(", ") || "None"}`}</Text>
      </View>
      <View style={styles.dspRuntimeSummaryCard}>
        <Text style={styles.dspRuntimeHeading}>Generated Note Output</Text>
        <Text style={styles.dspRuntimeSummaryText}>{generatedPreview}</Text>
      </View>
    </Card>
  );
}

function buildGenericWorkflowGeneratedPreview({
  workflowLabel = "",
  taskLabel = "",
  subtaskLabel = "",
  outcome = "",
  assistance = "",
  engagement = "",
  selectedRisks = [],
  selectedProtocols = [],
  selectedAlerts = [],
  note = "",
  titleCaseValue,
  formatValue,
}) {
  if (!taskLabel) {
    return `Select a ${workflowLabel.toLowerCase()} task to build the runtime note.`;
  }

  const lines = [`Staff supported the client with ${subtaskLabel ? subtaskLabel.toLowerCase() : taskLabel.toLowerCase()}.`];

  if (assistance) {
    lines.push(`${titleCaseValue(assistance)} was provided during ${taskLabel.toLowerCase()}.`);
  }
  if (engagement) {
    lines.push(`Client was ${formatValue(engagement)} during the task.`);
  }
  if (selectedRisks.length) {
    lines.push(`Active risks included ${selectedRisks.map((item) => titleCaseValue(item)).join(", ")}.`);
  }
  if (selectedProtocols.length) {
    lines.push(`Protocols followed: ${selectedProtocols.map((item) => titleCaseValue(item)).join(", ")}.`);
  }
  if (outcome) {
    lines.push(`${workflowLabel} outcome: ${formatValue(outcome)}.`);
  }
  if (selectedAlerts.length) {
    lines.push(`Alerts/follow-up: ${selectedAlerts.map((item) => titleCaseValue(item)).join(", ")}.`);
  }
  if (note.trim()) {
    lines.push(note.trim());
  }

  return lines.join(" ");
}

function GenericTaskInputFlowScreen({ isPhone, workflowId = "", moduleKey = "" }) {
  const config = getWorkflowInputSectionConfig(workflowId);
  const runtimeMap = getWorkflowInputSectionRuntimeMap(workflowId);
  const workflowLabel =
    WORKFLOW_SCHEDULE_OPTIONS.find((item) => item.workflowId === workflowId)?.label ||
    (config?.title || "Workflow").replace(/\s+Input Section$/, "");
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [categoryId, setCategoryId] = useState(config?.tasks?.[0]?.value || "");
  const [subtask, setSubtask] = useState("");
  const [outcome, setOutcome] = useState("");
  const [assistance, setAssistance] = useState("");
  const [engagement, setEngagement] = useState("");
  const [selectedRisks, setSelectedRisks] = useState([]);
  const [selectedProtocols, setSelectedProtocols] = useState([]);
  const [selectedAlerts, setSelectedAlerts] = useState([]);
  const [note, setNote] = useState("");

  const formatValue = useCallback((value) => String(value || "").replace(/_/g, " "), []);
  const titleCaseValue = useCallback(
    (value) => formatValue(value).replace(/\b\w/g, (char) => char.toUpperCase()),
    [formatValue]
  );

  const categoryOptions = useMemo(() => config?.tasks || [], [config]);
  const selectedTaskConfig = useMemo(() => config?.taskDetails?.[categoryId] || {}, [categoryId, config]);
  const subtaskOptions = useMemo(() => selectedTaskConfig.subtasks || [], [selectedTaskConfig]);
  const outcomeOptions = useMemo(() => config?.genericOutcomeOptions || [], [config]);
  const assistanceOptions = useMemo(() => {
    if (config?.assistanceOverrides?.[categoryId]) {
      return config.assistanceOverrides[categoryId];
    }
    return config?.genericAssistanceOptions || [];
  }, [categoryId, config]);
  const engagementOptions = config?.engagementOptions || [];
  const riskOptions = selectedTaskConfig.risks || [];
  const protocolOptions = selectedTaskConfig.protocols || [];
  const alertOptions = selectedTaskConfig.alerts || [];

  useEffect(() => {
    if (!categoryOptions.length) {
      setCategoryId("");
      return;
    }
    if (!categoryOptions.some((option) => option.value === categoryId)) {
      setCategoryId(categoryOptions[0].value);
    }
  }, [categoryId, categoryOptions]);

  useEffect(() => {
    setSubtask("");
    setOutcome("");
    setAssistance("");
    setEngagement("");
    setSelectedRisks([]);
    setSelectedProtocols([]);
    setSelectedAlerts([]);
    setNote("");
  }, [categoryId]);

  useEffect(() => {
    if (!subtaskOptions.some((option) => option.value === subtask)) {
      setSubtask("");
    }
  }, [subtask, subtaskOptions]);

  useEffect(() => {
    if (!outcomeOptions.some((option) => option.value === outcome)) {
      setOutcome("");
    }
  }, [outcome, outcomeOptions]);

  useEffect(() => {
    if (!assistanceOptions.some((option) => option.value === assistance)) {
      setAssistance("");
    }
  }, [assistance, assistanceOptions]);

  const activeTokens = useMemo(
    () =>
      uniqueValues([
        categoryId,
        outcome,
        assistance,
        engagement,
        ...selectedRisks,
        ...selectedProtocols,
        ...selectedAlerts,
      ]),
    [assistance, categoryId, engagement, outcome, selectedAlerts, selectedProtocols, selectedRisks]
  );

  const matchedRuleMappings = useMemo(
    () => (ruleMappingTable.mappings || []).filter((mapping) => matchRuleExpression(mapping.when, activeTokens)),
    [activeTokens]
  );

  const activeCatalogModules = useMemo(() => {
    const taskModules = runtimeMap?.taskModules?.[categoryId] || [];
    const activatedModuleIds = collectActivatedModuleIds({
      activeTokens,
      runtimeRuleMap: runtimeMap,
      extraRuleMappings: matchedRuleMappings,
    });
    return getModuleObjects([...taskModules, ...activatedModuleIds]);
  }, [activeTokens, categoryId, matchedRuleMappings, runtimeMap]);

  const activeRules = useMemo(
    () =>
      uniqueValues([
        ...((runtimeMap?.moduleRules || [])
          .filter((rule) => matchRuleExpression(rule.when, activeTokens))
          .map((rule) => `${rule.when} -> ${(rule.activate || []).join(", ")}`)),
        ...matchedRuleMappings.map((mapping) => `${mapping.when} -> ${(mapping.activate || []).join(", ")}`),
      ]),
    [activeTokens, matchedRuleMappings, runtimeMap]
  );

  const categoryLabel =
    categoryOptions.find((item) => item.value === categoryId)?.label || titleCaseValue(categoryId || "task");
  const subtaskLabel = subtaskOptions.find((item) => item.value === subtask)?.label || "";
  const generatedPreview = useMemo(
    () =>
      buildGenericWorkflowGeneratedPreview({
        workflowLabel,
        taskLabel: categoryLabel,
        subtaskLabel,
        outcome,
        assistance,
        engagement,
        selectedRisks,
        selectedProtocols,
        selectedAlerts,
        note,
        titleCaseValue,
        formatValue,
      }),
    [
      assistance,
      categoryLabel,
      engagement,
      formatValue,
      note,
      outcome,
      selectedAlerts,
      selectedProtocols,
      selectedRisks,
      subtaskLabel,
      titleCaseValue,
      workflowLabel,
    ]
  );

  const toggleMultiSelect = (value, setter) => {
    setter((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  };

  const StepCard = ({ index, title, hint, locked, children }) => (
    <View style={[styles.dspStepCard, locked && styles.dspStepCardLocked]}>
      <View style={styles.dspStepHeader}>
        <View style={styles.dspStepNumber}>
          <Text style={styles.dspStepNumberText}>{index}</Text>
        </View>
        <View style={styles.dspStepHeaderCopy}>
          <Text style={styles.dspStepTitle}>{title}</Text>
          {hint ? <Text style={styles.dspStepHint}>{hint}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );

  if (!config) {
    return (
      <Card title={workflowLabel} containerStyle={styles.dspInputCard} bodyStyle={styles.dspInputCardBody}>
        <Text style={styles.dspInputLead}>No workflow configuration is available yet.</Text>
      </Card>
    );
  }

  return (
    <Card title={config.title || `${workflowLabel} Input Section`} containerStyle={styles.dspInputCard} bodyStyle={styles.dspInputCardBody}>
      <Text style={styles.dspInputLead}>{config.description}</Text>
      <View style={styles.dspQuestionFlowCard}>
        {(config.questionSteps || []).map((step, index) => (
          <View key={step} style={styles.dspQuestionFlowRow}>
            <View style={styles.dspQuestionFlowIndex}>
              <Text style={styles.dspQuestionFlowIndexText}>{index + 1}</Text>
            </View>
            <Text style={styles.dspQuestionFlowText}>{step}</Text>
          </View>
        ))}
      </View>
      <View style={styles.dspBathingExampleCard}>
        <Text style={styles.dspRuntimeHeading}>Build order</Text>
        <Text style={styles.dspRuntimeMeta}>{config.buildOrderMessage}</Text>
      </View>
      <View style={styles.dspStepStack}>
        <StepCard index={1} title={config.questionSteps?.[0] || `What ${workflowLabel.toLowerCase()} task was supported?`} hint="Select the task, then narrow to an optional subtask.">
          <View style={[styles.dspInputGrid, isPhone && styles.dspInputGridPhone]}>
            <View style={styles.dspInputField}>
              <Text style={styles.dspInputLabel}>Task</Text>
              <DecisionDropdown
                value={categoryOptions.find((item) => item.value === categoryId)?.label || ""}
                options={categoryOptions}
                placeholder="Select task"
                dropdownId={`${moduleKey}-task`}
                activeDropdown={activeDropdown}
                onToggleDropdown={setActiveDropdown}
                onChange={setCategoryId}
                fieldStyle={styles.dspInputDropdown}
              />
            </View>
            <View style={styles.dspInputField}>
              <Text style={styles.dspInputLabel}>Subtask</Text>
              <DecisionDropdown
                value={subtaskOptions.find((item) => item.value === subtask)?.label || ""}
                options={subtaskOptions}
                placeholder={subtaskOptions.length ? "Optional subtask" : "No subtasks for this task yet"}
                dropdownId={`${moduleKey}-subtask`}
                activeDropdown={activeDropdown}
                onToggleDropdown={setActiveDropdown}
                onChange={setSubtask}
                fieldStyle={styles.dspInputDropdown}
              />
            </View>
          </View>
        </StepCard>
        <StepCard index={2} title={config.questionSteps?.[1] || "What was the outcome?"} hint="Outcome sets the note direction and follow-up." locked={!categoryId}>
          <DecisionDropdown
            value={outcomeOptions.find((item) => item.value === outcome)?.label || ""}
            options={outcomeOptions}
            placeholder="Select outcome"
            dropdownId={`${moduleKey}-outcome`}
            activeDropdown={activeDropdown}
            onToggleDropdown={setActiveDropdown}
            onChange={setOutcome}
            fieldStyle={styles.dspInputDropdown}
          />
        </StepCard>
        <StepCard index={3} title={config.questionSteps?.[2] || "What assistance was provided?"} hint="Use the structured assistance states before rules fire." locked={!outcome}>
          <DecisionDropdown
            value={assistanceOptions.find((item) => item.value === assistance)?.label || ""}
            options={assistanceOptions}
            placeholder="Select assistance"
            dropdownId={`${moduleKey}-assistance`}
            activeDropdown={activeDropdown}
            onToggleDropdown={setActiveDropdown}
            onChange={setAssistance}
            fieldStyle={styles.dspInputDropdown}
          />
        </StepCard>
        <StepCard index={4} title={config.questionSteps?.[3] || "How did the person engage during the task?"} hint="Engagement helps explain cueing, re-engagement, and tolerance." locked={!assistance}>
          <DecisionDropdown
            value={engagementOptions.find((item) => item.value === engagement)?.label || ""}
            options={engagementOptions}
            placeholder="Select engagement"
            dropdownId={`${moduleKey}-engagement`}
            activeDropdown={activeDropdown}
            onToggleDropdown={setActiveDropdown}
            onChange={setEngagement}
            fieldStyle={styles.dspInputDropdown}
          />
        </StepCard>
        <StepCard index={5} title={config.questionSteps?.[4] || "Were any risks or protocols active?"} hint="Leave unselected if none were active." locked={!engagement && !assistance}>
          <View style={styles.dspInputSection}>
            <Text style={styles.dspInputLabel}>Risks</Text>
            <View style={styles.dspInputChipRow}>
              {riskOptions.length ? riskOptions.map((item) => (
                <Pressable key={item} onPress={() => toggleMultiSelect(item, setSelectedRisks)} style={[styles.dspInputChip, selectedRisks.includes(item) && styles.dspInputChipActive]}>
                  <Text style={[styles.dspInputChipText, selectedRisks.includes(item) && styles.dspInputChipTextActive]}>{titleCaseValue(item)}</Text>
                </Pressable>
              )) : <Text style={styles.dspRuntimeMeta}>No task-specific risks configured yet.</Text>}
            </View>
          </View>
          <View style={styles.dspInputSection}>
            <Text style={styles.dspInputLabel}>Protocols</Text>
            <View style={styles.dspInputChipRow}>
              {protocolOptions.length ? protocolOptions.map((item) => (
                <Pressable key={item} onPress={() => toggleMultiSelect(item, setSelectedProtocols)} style={[styles.dspInputChip, selectedProtocols.includes(item) && styles.dspInputChipActive]}>
                  <Text style={[styles.dspInputChipText, selectedProtocols.includes(item) && styles.dspInputChipTextActive]}>{titleCaseValue(item)}</Text>
                </Pressable>
              )) : <Text style={styles.dspRuntimeMeta}>No task-specific protocols configured yet.</Text>}
            </View>
          </View>
        </StepCard>
        <StepCard index={6} title={config.questionSteps?.[5] || "Were any alerts present?"} hint="Use only real follow-up items." locked={!categoryId}>
          <View style={styles.dspInputChipRow}>
            {alertOptions.length ? alertOptions.map((item) => (
              <Pressable key={item} onPress={() => toggleMultiSelect(item, setSelectedAlerts)} style={[styles.dspInputChip, selectedAlerts.includes(item) && styles.dspInputChipAlertActive]}>
                <Text style={[styles.dspInputChipText, selectedAlerts.includes(item) && styles.dspInputChipTextActive]}>{titleCaseValue(item)}</Text>
              </Pressable>
            )) : <Text style={styles.dspRuntimeMeta}>No task-specific alerts configured yet.</Text>}
          </View>
        </StepCard>
        <StepCard index={7} title={config.questionSteps?.[6] || `Add a ${workflowLabel.toLowerCase()} note.`} hint="Use this only for context that the structured choices do not already capture." locked={!categoryId}>
          <TextInput value={note} onChangeText={setNote} placeholder={`${workflowLabel} note`} placeholderTextColor={colors.placeholder} multiline style={[styles.decisionRowInput, styles.dspInputNote]} />
        </StepCard>
      </View>
      <View style={[styles.dspRuntimeSummaryCard, isPhone && styles.dspRuntimeSummaryCardPhone]}>
        <View style={styles.dspRuntimeColumn}>
          <Text style={styles.dspRuntimeHeading}>Runtime Summary</Text>
          <Text style={styles.dspRuntimeSummaryText}>{categoryId ? `${categoryLabel} ${workflowLabel.toLowerCase()} flow is active.` : `Select a ${workflowLabel.toLowerCase()} task to begin.`}</Text>
        </View>
        <View style={styles.dspRuntimeColumn}>
          <Text style={styles.dspRuntimeHeading}>Active Modules</Text>
          <View style={styles.dspInputChipRow}>
            {activeCatalogModules.length ? activeCatalogModules.map((module) => (
              <View key={module.moduleId} style={styles.dspRuntimeModulePill}>
                <Text style={styles.dspRuntimeModulePillText}>{module.label}</Text>
              </View>
            )) : <Text style={styles.dspRuntimeMeta}>Select {workflowLabel.toLowerCase()} inputs to activate modules.</Text>}
          </View>
        </View>
      </View>
      <View style={styles.dspRuntimeSummaryCard}>
        <Text style={styles.dspRuntimeHeading}>Automatic Rules</Text>
        {activeRules.length ? activeRules.map((rule) => <Text key={rule} style={styles.dspRuntimeMeta}>{rule}</Text>) : <Text style={styles.dspRuntimeMeta}>Choose {workflowLabel.toLowerCase()} context to trigger rules.</Text>}
      </View>
      <View style={styles.dspRuntimeSummaryCard}>
        <Text style={styles.dspRuntimeHeading}>Generated Note Output</Text>
        <Text style={styles.dspRuntimeSummaryText}>{generatedPreview}</Text>
      </View>
    </Card>
  );
}

function CommunicationInputFlowScreen({ isPhone }) {
  return <GenericTaskInputFlowScreen isPhone={isPhone} workflowId="communication-support" moduleKey="communication" />;
}

function MedicationInputFlowScreen({ isPhone }) {
  return <GenericTaskInputFlowScreen isPhone={isPhone} workflowId="medication-support" moduleKey="medication" />;
}

function MealSupportInputFlowScreen({ isPhone }) {
  return <GenericTaskInputFlowScreen isPhone={isPhone} workflowId="feeding-support" moduleKey="meal-support" />;
}

function MobilityInputFlowScreen({ isPhone }) {
  return <GenericTaskInputFlowScreen isPhone={isPhone} workflowId="mobility" moduleKey="mobility" />;
}

function SafetyMonitoringInputFlowScreen({ isPhone }) {
  return <GenericTaskInputFlowScreen isPhone={isPhone} workflowId="in-home-leisure" moduleKey="safety-monitoring" />;
}

function SleepSupportInputFlowScreen({ isPhone }) {
  return <GenericTaskInputFlowScreen isPhone={isPhone} workflowId="night-adl" moduleKey="sleep-support" />;
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
  const [individualQuery, setIndividualQuery] = useState(
    formatClientNameLastFirstInitials("Mary Bet")
  );
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
  const activeDisplayName = formatClientNameLastFirstInitials(activeClientProfile.displayName);
  const activeIspRows = activeClientProfile.ispRows ?? ispRows;
  const clientSuggestions = searchClients(individualQuery);
  const showCarePlan = selectedModule === "Care Plan";
  const showCommunicationInputFlow = selectedModule === "Communication Input Flow";
  const showCommunityInputFlow = selectedModule === "Community Input Flow";
  const showDocumentationCoordinationInputFlow = selectedModule === "Documentation and Coordination Input Flow";
  const showDspInputFlow = selectedModule === "DSP Input Flow";
  const showHealthSafetyInputFlow = selectedModule === "Health and Safety Input Flow";
  const showBehavioralInputFlow = selectedModule === "Behavioral Input Flow";
  const showIadlInputFlow = selectedModule === "IADL Input Flow";
  const showMealSupportInputFlow = selectedModule === "Meal Support Input Flow";
  const showMedicationInputFlow = selectedModule === "Medication Input Flow";
  const showMobilityInputFlow = selectedModule === "Mobility Input Flow";
  const showSafetyMonitoringInputFlow = selectedModule === "Safety Monitoring Input Flow";
  const showSleepSupportInputFlow = selectedModule === "Sleep Support Input Flow";
  const showDecisionEngine = selectedModule === "Supervisor Setup";
  const showDocumentationGuide = selectedModule === "Documentation Guide";
  const defaultCaseNoteTemplate = createDocumentationSession({
    title: "Case Note (Supervisor Setup)",
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
      : showCommunicationInputFlow
        ? "Communication Input Flow"
      : showCommunityInputFlow
        ? "Community Input Flow"
      : showDocumentationCoordinationInputFlow
        ? "Documentation and Coordination Input Flow"
      : showDspInputFlow
        ? "DSP Input Flow"
      : showHealthSafetyInputFlow
        ? "Health and Safety Input Flow"
      : showBehavioralInputFlow
        ? "Behavioral Input Flow"
      : showIadlInputFlow
        ? "IADL Input Flow"
      : showMealSupportInputFlow
        ? "Meal Support Input Flow"
      : showMedicationInputFlow
        ? "Medication Input Flow"
      : showMobilityInputFlow
        ? "Mobility Input Flow"
      : showSafetyMonitoringInputFlow
        ? "Safety Monitoring Input Flow"
      : showSleepSupportInputFlow
        ? "Sleep Support Input Flow"
      : showDecisionEngine
        ? "Supervisor Setup"
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
      title: "Case Note (Supervisor Setup)",
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
    setIndividualQuery(
      formatClientNameLastFirstInitials(selectedClient?.displayName ?? "")
    );
    setShowIndividualSuggestions(false);
    setSelectedModule(null);
  };

  const handleGoToClient = () => {
    const normalized = individualQuery.trim().toLowerCase();
    if (!normalized) {
      return;
    }

    const exactMatch = CLIENT_ROSTER.find((client) => {
      const display = client.displayName.toLowerCase();
      const clinical = formatClientNameLastFirstInitials(client.displayName).toLowerCase();
      return display === normalized || clinical === normalized;
    });
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
    setIndividualQuery(formatClientNameLastFirstInitials(client.displayName));
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

    if (item === "Communication Input Flow") {
      setDocumentationSession(null);
      setPendingDecisionAssignmentTarget(null);
      return;
    }

    if (item === "Community Input Flow") {
      setDocumentationSession(null);
      setPendingDecisionAssignmentTarget(null);
      return;
    }

    if (item === "Documentation and Coordination Input Flow") {
      setDocumentationSession(null);
      setPendingDecisionAssignmentTarget(null);
      return;
    }

    if (item === "DSP Input Flow") {
      setDocumentationSession(null);
      setPendingDecisionAssignmentTarget(null);
      return;
    }

    if (item === "Health and Safety Input Flow") {
      setDocumentationSession(null);
      setPendingDecisionAssignmentTarget(null);
      return;
    }

    if (item === "Behavioral Input Flow") {
      setDocumentationSession(null);
      setPendingDecisionAssignmentTarget(null);
      return;
    }

    if (item === "IADL Input Flow") {
      setDocumentationSession(null);
      setPendingDecisionAssignmentTarget(null);
      return;
    }

    if (item === "Meal Support Input Flow") {
      setDocumentationSession(null);
      setPendingDecisionAssignmentTarget(null);
      return;
    }

    if (item === "Medication Input Flow") {
      setDocumentationSession(null);
      setPendingDecisionAssignmentTarget(null);
      return;
    }

    if (item === "Mobility Input Flow") {
      setDocumentationSession(null);
      setPendingDecisionAssignmentTarget(null);
      return;
    }

    if (item === "Safety Monitoring Input Flow") {
      setDocumentationSession(null);
      setPendingDecisionAssignmentTarget(null);
      return;
    }

    if (item === "Sleep Support Input Flow") {
      setDocumentationSession(null);
      setPendingDecisionAssignmentTarget(null);
      return;
    }

    if (item === "Supervisor Setup") {
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

  const handleOpenDocumentationGuide = (guideTitle = null) => {
    setSelectedModule("Documentation Guide");
    setDocumentationSession(null);
    if (guideTitle) {
      setExpandedDocumentationGuide(guideTitle);
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
                    <Pressable
                      key={item}
                      style={styles.pdfRow}
                      onPress={() =>
                        handleOpenDocumentationGuide(
                          item === "Glossary" ? "Decision Algo Glossary" : null
                        )
                      }
                    >
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
                              <Text style={styles.switchSuggestionText}>
                                {formatClientNameLastFirstInitials(client.displayName)}
                              </Text>
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
                  clientProfile={activeClientProfile}
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
              ) : showCommunicationInputFlow ? (
                <CommunicationInputFlowScreen
                  key={`communication-input-${activeClientId}`}
                  isPhone={isPhone}
                />
              ) : showCommunityInputFlow ? (
                <CommunityInputFlowScreen
                  key={`community-input-${activeClientId}`}
                  isPhone={isPhone}
                />
              ) : showDocumentationCoordinationInputFlow ? (
                <DocumentationCoordinationInputFlowScreen
                  key={`doccoord-input-${activeClientId}`}
                  isPhone={isPhone}
                />
              ) : showDspInputFlow ? (
                <DspInputFlowScreen
                  key={`dsp-input-${activeClientId}`}
                  isPhone={isPhone}
                />
              ) : showHealthSafetyInputFlow ? (
                <HealthSafetyInputFlowScreen
                  key={`health-safety-input-${activeClientId}`}
                  isPhone={isPhone}
                />
              ) : showBehavioralInputFlow ? (
                <BehavioralInputFlowScreen
                  key={`behavioral-input-${activeClientId}`}
                  isPhone={isPhone}
                />
              ) : showIadlInputFlow ? (
                <IadlInputFlowScreen
                  key={`iadl-input-${activeClientId}`}
                  isPhone={isPhone}
                />
              ) : showMealSupportInputFlow ? (
                <MealSupportInputFlowScreen
                  key={`meal-support-input-${activeClientId}`}
                  isPhone={isPhone}
                />
              ) : showMedicationInputFlow ? (
                <MedicationInputFlowScreen
                  key={`medication-input-${activeClientId}`}
                  isPhone={isPhone}
                />
              ) : showMobilityInputFlow ? (
                <MobilityInputFlowScreen
                  key={`mobility-input-${activeClientId}`}
                  isPhone={isPhone}
                />
              ) : showSafetyMonitoringInputFlow ? (
                <SafetyMonitoringInputFlowScreen
                  key={`safety-monitoring-input-${activeClientId}`}
                  isPhone={isPhone}
                />
              ) : showSleepSupportInputFlow ? (
                <SleepSupportInputFlowScreen
                  key={`sleep-support-input-${activeClientId}`}
                  isPhone={isPhone}
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

          <Text style={styles.footer}>ogigrid smart solutions</Text>
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
  intelCompactTitleText: {
    fontSize: 14,
    lineHeight: 18,
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
    borderColor: "#7fb0f0",
    backgroundColor: "#f4f9ff",
    overflow: "visible",
    zIndex: 20,
    elevation: 20,
  },
  decisionCardBody: {
    backgroundColor: "#f8fbff",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    overflow: "visible",
    zIndex: 20,
  },
  dspInputCard: {
    borderColor: "#8fc1f4",
    backgroundColor: "#f4f9ff",
  },
  dspInputCardBody: {
    backgroundColor: "#f8fbff",
  },
  dspInputLead: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
    marginBottom: 14,
  },
  dspQuestionFlowCard: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#c9def9",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    gap: 10,
    marginBottom: 14,
  },
  dspQuestionFlowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dspQuestionFlowIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eaf3ff",
    borderWidth: 1,
    borderColor: "#bed4f4",
  },
  dspQuestionFlowIndexText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2459a6",
  },
  dspQuestionFlowText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: colors.text,
  },
  dspBathingExampleCard: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#cfe0fb",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    marginBottom: 14,
    gap: 6,
  },
  dspStepStack: {
    gap: 12,
  },
  dspStepCard: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#cfe0fb",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    gap: 12,
  },
  dspStepCardLocked: {
    opacity: 0.72,
  },
  dspStepHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  dspStepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4b6ee8",
  },
  dspStepNumberText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#ffffff",
  },
  dspStepHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  dspStepTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.headerText,
  },
  dspStepHint: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
  },
  dspInputGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 14,
  },
  dspInputGridPhone: {
    flexDirection: "column",
  },
  dspInputField: {
    minWidth: 180,
    flex: 1,
    gap: 6,
  },
  dspInputLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: colors.muted,
  },
  dspInputDropdown: {
    width: "100%",
    alignSelf: "stretch",
    minWidth: 0,
  },
  dspInputSection: {
    marginBottom: 14,
    gap: 8,
  },
  dspInputChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dspInputChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#c9dbf7",
    backgroundColor: "#ffffff",
  },
  dspInputChipActive: {
    borderColor: "#3b82f6",
    backgroundColor: "#eaf3ff",
  },
  dspInputChipAlertActive: {
    borderColor: "#d9487a",
    backgroundColor: "#fff0f5",
  },
  dspInputChipText: {
    fontSize: 12,
    color: colors.headerText,
    fontWeight: "600",
  },
  dspInputChipTextActive: {
    color: colors.headerText,
  },
  dspInputNote: {
    minHeight: 92,
    textAlignVertical: "top",
    marginBottom: 0,
  },
  dspRuntimeSummaryCard: {
    marginTop: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#d7e6fb",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    gap: 12,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dspRuntimeSummaryCardPhone: {
    flexDirection: "column",
  },
  dspRuntimeColumn: {
    flex: 1,
    minWidth: 220,
    gap: 8,
  },
  dspRuntimeHeading: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.headerText,
  },
  dspRuntimeSummaryText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.text,
  },
  dspRuntimeMeta: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
  },
  dspRuntimeModulePill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#edf5ff",
    borderWidth: 1,
    borderColor: "#c8dbf8",
  },
  dspRuntimeModulePillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2459a6",
  },
  decisionAssignForm: {
    width: "100%",
    marginBottom: 10,
    paddingHorizontal: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
    justifyContent: "space-between",
    columnGap: 12,
    rowGap: 14,
    overflow: "visible",
    position: "relative",
  },
  decisionAssignFormPhone: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    columnGap: 0,
  },
  decisionToolbarColumnPhone: {
    flexBasis: "auto",
    maxWidth: "100%",
    minWidth: "100%",
    width: "100%",
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
  decisionToolbarColumn: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 118,
    maxWidth: 128,
    minWidth: 108,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    overflow: "visible",
    zIndex: 5,
  },
  decisionToolbarColumnLibrary: {
    zIndex: 6,
  },
  decisionToolbarColumnBranch: {
    flexBasis: 132,
    maxWidth: 148,
    minWidth: 124,
  },
  decisionToolbarColumnDepth: {
    flexBasis: 72,
    maxWidth: 80,
    minWidth: 64,
  },
  decisionToolbarColumnTarget: {
    flexGrow: 2,
    flexBasis: 260,
    maxWidth: 340,
    minWidth: 220,
    zIndex: 4,
  },
  decisionToolbarLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 4,
    width: "100%",
  },
  decisionTargetRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: 10,
    width: "100%",
    overflow: "visible",
  },
  decisionFormFieldGrow: {
    flexShrink: 1,
    gap: 8,
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
  decisionScheduleEditorBlockBuilder: {
    borderColor: "#f0b35f",
    backgroundColor: "#fff7eb",
  },
  decisionScheduleEditorRowBuilder: {
    borderColor: "#7bc9b6",
    backgroundColor: "#eefaf6",
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
  decisionPromptSuggestionCard: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#d8cfff",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    padding: 10,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  decisionPromptSuggestionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  decisionPromptSuggestionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.35,
    textTransform: "uppercase",
    color: colors.topPurple,
  },
  decisionPromptSuggestionMeta: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
  },
  decisionPromptSuggestionList: {
    gap: 8,
  },
  decisionPromptSuggestionItem: {
    borderWidth: 1,
    borderColor: "#e9ddff",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: "#faf7ff",
  },
  decisionPromptSuggestionText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
    fontWeight: "600",
  },
  decisionPromptSuggestionEmpty: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
  },
  decisionPromptSuggestionError: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.red,
    marginBottom: 8,
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
  decisionGuideNoteHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  decisionGuideNoteTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: "#9d174d",
  },
  decisionGuideNoteDismiss: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9d174d",
    textDecorationLine: "underline",
  },
  decisionGuideNoteLead: {
    fontSize: 12,
    lineHeight: 18,
    color: "#831843",
    marginBottom: 8,
  },
  decisionGuideNoteStepPress: {
    marginTop: 4,
  },
  decisionGuideNoteStep: {
    fontSize: 12,
    lineHeight: 18,
    color: "#831843",
  },
  decisionGuideNoteStepLink: {
    fontWeight: "600",
    textDecorationLine: "underline",
    color: "#701a40",
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
    maxHeight: 420,
  },
  guidedPromptBuilderCard: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#d6ddfb",
    borderRadius: 8,
    backgroundColor: "#fcfbff",
    gap: 10,
    marginBottom: 10,
  },
  guidedPromptBuilderTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.headerText,
  },
  guidedPromptBuilderLead: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.muted,
  },
  guidedPromptBuilderGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  guidedPromptBuilderField: {
    minWidth: 150,
    flex: 1,
    gap: 5,
  },
  guidedPromptBuilderLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: colors.muted,
  },
  guidedPromptDropdown: {
    width: "100%",
    alignSelf: "stretch",
    minWidth: 0,
  },
  guidedPromptBuilderChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  guidedPromptBuilderChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#d6ddfb",
    backgroundColor: "#ffffff",
  },
  guidedPromptBuilderChipActive: {
    borderColor: "#6c5ce7",
    backgroundColor: "#efeaff",
  },
  guidedPromptBuilderChipText: {
    fontSize: 11,
    color: colors.headerText,
    fontWeight: "600",
  },
  guidedPromptBuilderChipTextActive: {
    color: "#4a3ec7",
  },
  guidedPromptBuilderPreview: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.text,
  },
  guidedPromptBuilderButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: "#5a50d6",
  },
  guidedPromptBuilderButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
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
    lineHeight: 19,
    color: colors.text,
    fontWeight: "400",
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
  decisionScheduleSameTimeHint: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
    marginBottom: 10,
  },
  decisionTimelineBlockList: {
    gap: 14,
  },
  decisionTimelineGroup: {
    gap: 8,
  },
  decisionTimelineGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 2,
  },
  decisionTimelineGroupTime: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.headerText,
  },
  decisionTimelineGroupCount: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.topPurple,
    textTransform: "uppercase",
    letterSpacing: 0.3,
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
  decisionTimelineBlockCardMultiAssigned: {
    borderWidth: 2,
    borderColor: colors.topPurple,
    backgroundColor: "#f5f3ff",
    shadowColor: colors.topPurple,
    shadowOpacity: 0.14,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  decisionTimelineBlockAssignedBadge: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
    textTransform: "uppercase",
    color: colors.topPurple,
    backgroundColor: "#ede9fe",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
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
  decisionTimelineBlockActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 2,
  },
  decisionTimelineBlockLink: {
    paddingVertical: 2,
    ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
  },
  decisionTimelineBlockLinkText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.link,
    textDecorationLine: "underline",
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
  decisionWorkflowLinkRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 4,
  },
  decisionWorkflowLinkRowPhone: {
    rowGap: 6,
  },
  decisionWorkflowLinkHit: {
    paddingVertical: 2,
    paddingHorizontal: 2,
    ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
  },
  decisionWorkflowLink: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.link,
    textDecorationLine: "underline",
  },
  decisionWorkflowLinkActive: {
    color: colors.topPurple,
    fontWeight: "700",
  },
  decisionWorkflowLinkSep: {
    fontSize: 12,
    color: colors.muted,
    marginHorizontal: 2,
  },
  decisionWorkflowLinkDetail: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
  },
  decisionScopeModeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  decisionScopeModeChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.lightBorder,
    borderRadius: 0,
    backgroundColor: "#ffffff",
  },
  decisionScopeModeChipActive: {
    borderColor: colors.topPurple,
    backgroundColor: "rgba(124, 108, 240, 0.1)",
  },
  decisionScopeModeChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  decisionScopeModeChipTextActive: {
    color: colors.topPurple,
    fontWeight: "700",
  },
  decisionCategoryFilterBlock: {
    marginBottom: 10,
    gap: 6,
  },
  decisionCategoryFilterLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: colors.topPurple,
  },
  decisionCategoryFilterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  decisionCategoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#ffffff",
  },
  decisionCategoryChipActive: {
    borderColor: colors.topPurple,
    backgroundColor: "#ede9fe",
  },
  decisionCategoryChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.text,
  },
  decisionCategoryChipTextActive: {
    color: colors.topPurple,
  },
  decisionInlineHintWarn: {
    color: "#9a3412",
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
    fontSize: 11,
    color: colors.muted,
    fontWeight: "700",
    marginBottom: 0,
    letterSpacing: 0.35,
    textTransform: "uppercase",
    textAlign: "center",
    width: "100%",
  },
  decisionIntelliDraftNoteTypeHint: {
    fontSize: 11,
    lineHeight: 15,
    color: colors.muted,
    marginTop: 6,
    textAlign: "left",
    width: "100%",
  },
  decisionToolbarHints: {
    width: "100%",
    marginTop: 4,
    marginBottom: 14,
    paddingHorizontal: 4,
    rowGap: 4,
    alignItems: "center",
  },
  decisionToolbarHintLine: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.muted,
    textAlign: "center",
    width: "100%",
  },
  decisionSectionTitleWrap: {
    flex: 1,
    rowGap: 2,
  },
  decisionSectionAssignRule: {
    fontSize: 10,
    lineHeight: 14,
    color: colors.muted,
    fontWeight: "600",
  },
  decisionSectionAssignStatus: {
    fontSize: 10,
    lineHeight: 14,
    color: "#7a5c12",
    fontWeight: "600",
  },
  decisionSectionAssignStatusBlocked: {
    color: "#9b3d3d",
  },
  decisionSectionCardBlocked: {
    opacity: 0.72,
  },
  decisionSectionActionTextDisabled: {
    color: colors.muted,
  },
  decisionNodeRowBlocked: {
    opacity: 0.65,
  },
  decisionNodeAssignWarn: {
    fontSize: 11,
    lineHeight: 15,
    color: "#7a5c12",
    marginTop: 4,
  },
  decisionNodeAssignBlocked: {
    fontSize: 11,
    lineHeight: 15,
    color: "#9b3d3d",
    marginTop: 4,
    fontWeight: "600",
  },
  includeFinalToggleDisabled: {
    opacity: 0.5,
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
  decisionDropdownToolbar: {
    width: "100%",
    alignSelf: "stretch",
    minWidth: 0,
  },
  decisionDropdownToolbarHalf: {
    flex: 1,
    minWidth: 0,
    maxWidth: "48%",
  },
  decisionDropdownLibrary: {
    width: 132,
    maxWidth: "100%",
  },
  decisionDropdownMode: {
    width: 128,
    maxWidth: "100%",
  },
  decisionDropdownNoteType: {
    width: 108,
    maxWidth: "100%",
  },
  decisionDropdownDepth: {
    width: 52,
  },
  decisionDropdownBranch: {
    width: 148,
    minWidth: 148,
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
  decisionOptionButtonActiveBlock: {
    backgroundColor: "#d97706",
    borderColor: "#d97706",
  },
  decisionOptionButtonActiveRow: {
    backgroundColor: "#0f7a63",
    borderColor: "#0f7a63",
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
  decisionSmartSelectBlock: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#faf8ff",
    gap: 8,
  },
  decisionSmartSelectLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.headerText,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  decisionSmartSelectActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "stretch",
    gap: 10,
  },
  decisionSmartSelectActionGroup: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
    minWidth: 200,
  },
  decisionSmartSelectAction: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.lightBorder,
    backgroundColor: "#ffffff",
  },
  decisionSmartSelectDefault: {
    alignSelf: "flex-start",
    borderColor: "#d4c9f5",
    backgroundColor: "rgba(124, 108, 240, 0.1)",
    minWidth: 88,
  },
  decisionSmartSelectActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  decisionSmartSelectDefaultText: {
    fontWeight: "700",
    color: colors.topPurple,
  },
  decisionSmartSelectClear: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 0,
  },
  decisionSmartSelectClearText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },
  decisionSmartSelectHint: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.muted,
  },
  decisionSmartSelectResult: {
    marginTop: 4,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.topPurple,
    backgroundColor: "#ffffff",
    gap: 6,
  },
  decisionSmartSelectResultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  decisionSmartSelectResultTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: colors.topPurple,
  },
  decisionSmartSelectResultDismiss: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f0ff",
  },
  decisionSmartSelectResultDismissText: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: "600",
    color: colors.topPurple,
    marginTop: -1,
  },
  decisionSmartSelectResultScroll: {
    maxHeight: 120,
  },
  decisionSmartSelectResultItem: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.text,
    marginBottom: 4,
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
  decisionSectionBulkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  decisionSectionBulkLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },
  decisionSectionBulkDropdown: {
    minWidth: 168,
    maxWidth: 220,
  },
  decisionSectionViewDropdown: {
    minWidth: 96,
    maxWidth: 120,
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
    gap: 10,
  },
  decisionSectionHeaderToggle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
    minWidth: 0,
    paddingRight: 8,
    ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
  },
  decisionSectionHeaderCollapsed: {
    borderBottomWidth: 0,
  },
  decisionSectionBody: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
  decisionAssignButtonBlock: {
    backgroundColor: "#d97706",
  },
  decisionAssignButtonAssignments: {
    backgroundColor: "#c2416c",
  },
  decisionAssignButtonRow: {
    backgroundColor: "#0f7a63",
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
  decisionAssignmentsCard: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: "#efb3c9",
    borderRadius: 16,
    backgroundColor: "#fff2f7",
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
  carePlanContentScrollerInnerEditing: {
    paddingBottom: 96,
  },
  carePlanUnsavedBanner: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  carePlanUnsavedBannerActive: {
    borderColor: "#e8c96a",
    backgroundColor: "#fff9e8",
  },
  carePlanUnsavedBannerIdle: {
    borderColor: "#d9cff0",
    backgroundColor: "#f7f4ff",
  },
  carePlanUnsavedBannerText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
    fontWeight: "600",
  },
  carePlanUnsavedBannerTextActive: {
    color: "#7a5a12",
  },
  carePlanStickyEditBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
    ...(Platform.OS === "web"
      ? {
          position: "sticky",
          bottom: 0,
          zIndex: 30,
        }
      : {}),
  },
  carePlanStickyEditBarText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.headerText,
  },
  carePlanStickyEditBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  carePlanStickyEditPrimary: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: colors.topPurple,
  },
  carePlanStickyEditPrimaryText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  carePlanStickyEditSecondary: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#ffffff",
  },
  carePlanStickyEditSecondaryText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.headerText,
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
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: "#f4eeff",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  carePlanSectionHeadText: {
    flex: 1,
    minWidth: 0,
  },
  carePlanSectionHeadCollapsed: {
    borderBottomWidth: 0,
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
  carePlanEditorRowActionsCompact: {
    marginTop: 0,
    marginBottom: 0,
    gap: 4,
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
  overviewGridWrap: {
    gap: 10,
  },
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  overviewStatCell: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "22%",
    minWidth: 128,
    maxWidth: 200,
  },
  overviewStat: {
    width: "100%",
    minHeight: 148,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ebe2fb",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  overviewStatActive: {
    borderColor: "#7c6cf0",
  },
  overviewStatIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  overviewStatCount: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.headerText,
    lineHeight: 36,
  },
  overviewStatDetailBlock: {
    marginTop: 6,
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 4,
  },
  overviewStatLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.35,
    color: "#5b5bd6",
    textAlign: "center",
  },
  overviewStatDetail: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
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
    alignSelf: "flex-start",
    width: "100%",
    maxWidth: 640,
    borderWidth: 1,
    borderColor: "#e6ddf7",
    borderRadius: 12,
    overflow: "hidden",
  },
  participantHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1ebff",
  },
  participantHeaderCell: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: "700",
    color: colors.headerText,
  },
  participantNameCol: {
    flex: 1,
    minWidth: 120,
    maxWidth: 200,
  },
  participantRelationshipCol: {
    flex: 1.15,
    minWidth: 140,
    maxWidth: 260,
  },
  participantCopyCol: {
    width: 52,
    maxWidth: 52,
    flexGrow: 0,
    flexShrink: 0,
    paddingHorizontal: 6,
    textAlign: "center",
  },
  participantActionsCol: {
    width: 84,
    maxWidth: 84,
    flexGrow: 0,
    flexShrink: 0,
    justifyContent: "center",
    paddingVertical: 4,
  },
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#efe7fb",
    backgroundColor: "#ffffff",
  },
  participantCell: {
    paddingHorizontal: 8,
    paddingVertical: 10,
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
  sourcePagesSectionToggle: {
    borderWidth: 1,
    borderColor: "#e0d7f4",
    backgroundColor: "#faf8ff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  sourcePagesSectionToggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.headerText,
    marginBottom: 3,
  },
  sourcePagesSectionToggleMeta: {
    fontSize: 11,
    color: colors.muted,
  },
  sourcePagesShowMoreButton: {
    alignSelf: "flex-start",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#ddd3f2",
    backgroundColor: "#f8f4ff",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  sourcePagesShowMoreText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.headerText,
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
  docGroupedList: {
    rowGap: 12,
  },
  docGroupedItem: {
    rowGap: 8,
  },
  docGroupedItemWithDivider: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ece7f7",
  },
  docWorkflowTag: {
    alignSelf: "flex-start",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.35,
    color: "#6b4e00",
    backgroundColor: "#ffe45c",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
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
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  docuWraiteBubbleOuter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(92, 99, 229, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(92, 99, 229, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  docuWraiteBubbleBody: {
    width: 24,
    minHeight: 21,
    borderRadius: 9,
    backgroundColor: docuWraiteColors.primary,
    borderWidth: 1.5,
    borderColor: "#ffffff",
    paddingTop: 2,
    paddingBottom: 4,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: docuWraiteColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.24,
    shadowRadius: 6,
    elevation: 4,
  },
  docuWraiteBubbleSparkleRow: {
    position: "absolute",
    top: -5,
    right: -3,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d7dafe",
  },
  docuWraiteSparkle: {
    fontSize: 7,
    lineHeight: 7,
    color: docuWraiteColors.primary,
    fontWeight: "700",
  },
  docuWraiteBubbleDots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 2,
    marginTop: 5,
  },
  docuWraiteDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#ffffff",
  },
  docuWraiteBubbleTail: {
    position: "absolute",
    left: 8,
    bottom: 5,
    width: 7,
    height: 7,
    backgroundColor: docuWraiteColors.primary,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: "#ffffff",
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
  docValidationQuizRoot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  docValidationQuizBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(18, 16, 33, 0.62)",
  },
  docValidationQuizCard: {
    width: "100%",
    maxWidth: 540,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#cbc2ff",
    backgroundColor: "#fcfbff",
    paddingHorizontal: 18,
    paddingVertical: 18,
    rowGap: 10,
    shadowColor: "#000000",
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  docValidationQuizEyebrow: {
    fontSize: 16,
    fontWeight: "800",
    color: "#3c45c8",
    letterSpacing: -0.1,
  },
  docValidationQuizProgress: {
    fontSize: 12,
    fontWeight: "700",
    color: "#655dc0",
  },
  docValidationQuizSource: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#7f74dd",
  },
  docValidationQuizPrompt: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "700",
    color: "#17132f",
    letterSpacing: -0.1,
  },
  docValidationQuizFeedback: {
    fontSize: 13,
    lineHeight: 19,
    color: "#a32353",
    fontWeight: "700",
  },
  docValidationQuizFeedbackCorrect: {
    color: "#1f7a4f",
  },
  docValidationQuizSuccessBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#eaf8f0",
    borderWidth: 1,
    borderColor: "#b9e7cb",
  },
  docValidationQuizSuccessCheck: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1f7a4f",
  },
  docValidationQuizSuccessText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1f7a4f",
  },
  docValidationQuizChoiceList: {
    rowGap: 7,
  },
  docValidationQuizChoice: {
    borderWidth: 1,
    borderColor: "#d6cffd",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#1e1638",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 0,
  },
  docValidationQuizChoiceCorrect: {
    borderColor: "#4955da",
    backgroundColor: "#eef1ff",
  },
  docValidationQuizChoiceText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "400",
    color: "#262145",
  },
  docValidationQuizChoiceTextCorrect: {
    color: "#2f3dc8",
  },
  docValidationQuizFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e6e0ff",
  },
  docValidationQuizClose: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4d58d0",
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
