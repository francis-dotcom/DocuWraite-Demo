/**
 * Maps Decision Engine libraries + sections → note types and assign-once rules.
 */

import {
  INTELLIDRAFT_NOTE_TYPES,
  INTELLIDRAFT_SHARED_SECTION,
  INTELLIDRAFT_SECTIONS,
  getIntelliDraftDefaultTargetType,
  getIntelliDraftTemplateForNoteType,
  intelliDraftNoteTypeMatches,
  resolveIntelliDraftNoteType,
} from "./aidraft/noteTypeTemplate.js";

export const DECISION_NOTE_TYPE_KEYS = [
  "block-time",
  "row-note",
  "final-note",
  "handover-note",
  "orders",
];

/** baseplan A–J + I = block workflows */
const BASEPLAN_BLOCK_SECTIONS = new Set([
  "A. morning-adl",
  "B. afternoon-adl",
  "C. feeding-support",
  "D. in-home-leisure",
  "E. community-outing",
  "F. return-home",
  "G. behavior-support",
  "H. communication-support",
  "I. medication-support",
  "J. night-adl",
]);

const BASEPLAN_SECTION_NOTE_TYPES = {
  "K. case-note-final": "final-note",
  "L. row-note-support": "row-note",
  "M. handover-note-support": "handover-note",
};

const RUNTIME_SECTION_NOTE_TYPES = {
  "F. Shift Handoff and Follow-Up": "handover-note",
  "C. Medications and Due Health Tasks": "orders",
};

/**
 * assignOnce:
 * - session: only one target (any) may hold this section for the shift / case note
 * - target: only one assignment per target (default)
 * warnAcrossTargets: show advisory if same section is already on another target
 */
export const SECTION_ASSIGN_RULES = {
  "K. case-note-final": {
    assignOnce: "session",
    label: "Once per case note",
  },
  "M. handover-note-support": {
    assignOnce: "session",
    label: "Once per shift",
  },
  "L. row-note-support": {
    assignOnce: "target",
    label: "Once per row",
  },
  [INTELLIDRAFT_SHARED_SECTION.section]: {
    assignOnce: "session",
    label: "Once per shift (all drafts)",
  },
  "F. Orders and Medication Draft": {
    assignOnce: "session",
    label: "Once per shift",
  },
  "C. Final Case Note Draft": {
    assignOnce: "session",
    label: "Once per shift (IntelliDraft)",
  },
  "D. Handoff Summary Draft": {
    assignOnce: "session",
    label: "Once per shift (IntelliDraft)",
  },
};

const DEFAULT_BLOCK_RULE = {
  assignOnce: "target",
  warnAcrossTargets: true,
  label: "Per block (can repeat on other blocks)",
};

export function getSectionAssignRule(library = "", section = "") {
  if (SECTION_ASSIGN_RULES[section]) {
    return SECTION_ASSIGN_RULES[section];
  }
  if (library === "baseplan" && BASEPLAN_BLOCK_SECTIONS.has(section)) {
    return DEFAULT_BLOCK_RULE;
  }
  return { assignOnce: "target", warnAcrossTargets: false, label: "Per target" };
}

export function resolveDecisionNoteType(nodeOrSection = {}, librarySlug = "") {
  const library =
    librarySlug ||
    (typeof nodeOrSection === "object" ? nodeOrSection?.library || nodeOrSection?.sourceLibrary : "");

  if (library === "aidraft") {
    return resolveIntelliDraftNoteType(nodeOrSection);
  }

  const section =
    typeof nodeOrSection === "string"
      ? nodeOrSection
      : String(nodeOrSection?.section || nodeOrSection?.title || "").trim();

  if (library === "baseplan" && BASEPLAN_SECTION_NOTE_TYPES[section]) {
    return BASEPLAN_SECTION_NOTE_TYPES[section];
  }

  if (library === "baseplan" && BASEPLAN_BLOCK_SECTIONS.has(section)) {
    return "block-time";
  }

  if (library === "runtime" && RUNTIME_SECTION_NOTE_TYPES[section]) {
    return RUNTIME_SECTION_NOTE_TYPES[section];
  }

  const normalized = section.toLowerCase();

  if (normalized.includes("row note") || normalized.includes("row-note")) {
    return "row-note";
  }
  if (normalized.includes("final case") || normalized.includes("case-note-final")) {
    return "final-note";
  }
  if (normalized.includes("handoff") || normalized.includes("handover")) {
    return "handover-note";
  }
  if (normalized.includes("orders and medication")) {
    return "orders";
  }

  if (["baseplan", "careplan", "branching", "readiness", "playbookR", "runtime"].includes(library)) {
    return "block-time";
  }

  return "block-time";
}

export function decisionNoteTypeMatches(node, activeNoteType, librarySlug = "") {
  const library = librarySlug || node?.library || "";
  if (library === "aidraft") {
    return intelliDraftNoteTypeMatches(node, activeNoteType);
  }
  // Branching follow-ups apply to any note type (refusal on a row, block, etc.).
  if (library === "branching") {
    return true;
  }
  const resolved = resolveDecisionNoteType(node, library);
  return resolved === String(activeNoteType || "block-time").trim();
}

/** Branching library sections A–E map to Branch dropdown 1–5 in selective mode. */
export const BRANCHING_FOLLOW_UP_BRANCHES = [
  { key: "1", label: "1 — Refusal", section: "A. Refusal Branching" },
  { key: "2", label: "2 — Fatigue", section: "B. Fatigue Branching" },
  { key: "3", label: "3 — Risk & safety", section: "C. Risk and Safety Branching" },
  { key: "4", label: "4 — Protocol failure", section: "D. Protocol Failure Branching" },
  { key: "5", label: "5 — Incident / emergency", section: "E. Incident and Emergency Branching" },
];

export function getBranchingSectionBranchKey(section = "") {
  const match = String(section).match(/^([A-Z])\./);
  if (!match) {
    return "";
  }
  return String(match[1].charCodeAt(0) - 64);
}

export function getBranchingFollowUpNodes(
  allLibraries = [],
  { noteType, branchKey, depth, includeMode } = {}
) {
  if (includeMode !== "selective-branch" || !branchKey) {
    return [];
  }

  const branchingLib = allLibraries.find((lib) => lib.library === "branching");
  if (!branchingLib?.nodes?.length) {
    return [];
  }

  const normalizedBranch = String(branchKey);
  const maxDepth = Number(depth) || 10;

  return branchingLib.nodes.filter((node) => {
    if (node?.conditions?.length && !node?.question) {
      return false;
    }
    if (!decisionNoteTypeMatches(node, noteType, "branching")) {
      return false;
    }
    if (getBranchingSectionBranchKey(node.section) !== normalizedBranch) {
      return false;
    }
    const nodeDepth = String(node.id || "").match(/^([a-z]+)/i);
    const depthIndex = nodeDepth
      ? nodeDepth[1].toLowerCase().charCodeAt(0) - 96
      : 1;
    return depthIndex <= maxDepth;
  });
}

export function getDefaultTargetTypeForNoteType(noteType, library = "") {
  if (library === "aidraft") {
    return getIntelliDraftDefaultTargetType(noteType);
  }
  if (noteType === "row-note") {
    return "case-note-row";
  }
  return "time-block";
}

/** Default note type when the user picks a block vs row target (supervisor / DSP setup). */
export function getRecommendedNoteTypeForTarget(targetType = "time-block") {
  return targetType === "case-note-row" ? "row-note" : "block-time";
}

/** Short hint under the Note type control — what to pick and when. */
export function getNoteTypeSelectionGuidance(targetType = "time-block", activeNoteType = "block-time") {
  const noteType = String(activeNoteType || "block-time").trim();

  if (targetType === "case-note-row") {
    if (noteType === "row-note") {
      return "Row target → use Row note (Baseplan L, IntelliDraft row draft, branching).";
    }
    return "This target is a case-note row — set Note type to Row note.";
  }

  switch (noteType) {
    case "final-note":
      return "Shift-level final case note — Baseplan K + IntelliDraft final (once per shift).";
    case "handover-note":
      return "Shift handoff — Baseplan M, Runtime handoff, IntelliDraft handoff.";
    case "orders":
      return "MAR / orders — Runtime meds + IntelliDraft orders (not Baseplan medication-support).";
    case "row-note":
      return "Row note on a time block is unusual — use Block time for timeline blocks, Row note for rows.";
    default:
      return "Time block → Block time (Baseplan A–J, Careplan, Runtime, etc.).";
  }
}

export function getNoteTypeTemplateHint(library, noteType) {
  if (library === "aidraft") {
    return getIntelliDraftTemplateForNoteType(noteType);
  }
  if (library === "baseplan") {
    const section = Object.entries(BASEPLAN_SECTION_NOTE_TYPES).find(([, t]) => t === noteType)?.[0];
    if (section) {
      return { section, summary: getSectionAssignRule("baseplan", section).label || "" };
    }
    if (noteType === "block-time") {
      return {
        section: "A. morning-adl … J. night-adl",
        summary: "Block workflows — repeat on other blocks; once per block",
      };
    }
  }
  if (library === "runtime" && noteType === "handover-note") {
    return {
      section: "F. Shift Handoff and Follow-Up",
      summary: getSectionAssignRule("runtime", "F. Shift Handoff and Follow-Up").label,
    };
  }
  return null;
}

export function parseDecisionSelectionKey(key = "") {
  const parts = String(key).split("::");
  return {
    library: parts[0] || "",
    section: parts[1] || "",
    nodeId: parts[2] || "",
  };
}

function getAssignmentTargetKey(assignment = {}) {
  const target = assignment?.target || {};
  return `${target.type || ""}:${target.targetId || ""}`;
}

function buildTargetLabel(assignment = {}) {
  const target = assignment?.target || {};
  if (target.type === "case-note-row") {
    return `Row: ${target.label || target.targetId || "row"}`;
  }
  return target.label || target.targetId || "target";
}

/** Collect section-level assignments from staged + finalized payloads. */
export function collectAssignedSections(assignments = []) {
  const bySection = new Map();

  assignments.forEach((assignment) => {
    const targetKey = getAssignmentTargetKey(assignment);
    const targetLabel = buildTargetLabel(assignment);
    const payloads = assignment.selectedNodesPayload || [];

    payloads.forEach((payload) => {
      const key = typeof payload === "string" ? payload : payload?.key;
      if (!key) {
        return;
      }
      const { library, section } = parseDecisionSelectionKey(key);
      if (!library || !section) {
        return;
      }
      const mapKey = `${library}::${section}`;
      if (!bySection.has(mapKey)) {
        bySection.set(mapKey, []);
      }
      bySection.get(mapKey).push({
        targetKey,
        targetLabel,
        assignmentId: assignment.id,
        noteType: assignment.selectedNoteType,
      });
    });
  });

  return bySection;
}

/**
 * @returns {{ status: 'available'|'warn'|'blocked', message: string, assignedTo?: string }}
 */
export function getSectionAssignmentStatus(library, section, assignments = [], currentTargetKey = "") {
  const rule = getSectionAssignRule(library, section);
  const mapKey = `${library}::${section}`;
  const hits = collectAssignedSections(assignments).get(mapKey) || [];
  const onOtherTargets = hits.filter((hit) => hit.targetKey && hit.targetKey !== currentTargetKey);
  const onSameTarget = hits.filter((hit) => hit.targetKey === currentTargetKey);

  if (rule.assignOnce === "session" && hits.length > 0) {
    const label = onSameTarget.length ? onSameTarget[0].targetLabel : hits[0].targetLabel;
    return {
      status: "blocked",
      message: `${rule.label} — already assigned (${label})`,
      assignedTo: label,
    };
  }

  if (rule.assignOnce === "target" && onSameTarget.length > 0) {
    return {
      status: "blocked",
      message: `${rule.label} — already on this target`,
      assignedTo: onSameTarget[0].targetLabel,
    };
  }

  if (rule.warnAcrossTargets && onOtherTargets.length > 0) {
    return {
      status: "warn",
      message: `Also on ${onOtherTargets.map((h) => h.targetLabel).join(", ")}`,
      assignedTo: onOtherTargets[0].targetLabel,
    };
  }

  return { status: "available", message: rule.label || "" };
}

export function getNodeAssignmentStatus(node, assignments = [], currentTargetKey = "") {
  return getSectionAssignmentStatus(
    node?.library || "",
    node?.section || "",
    assignments,
    currentTargetKey
  );
}

export {
  INTELLIDRAFT_NOTE_TYPES,
  INTELLIDRAFT_SHARED_SECTION,
  INTELLIDRAFT_SECTIONS,
};
