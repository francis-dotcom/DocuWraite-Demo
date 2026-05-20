/**
 * IntelliDraft note-type template — maps Decision Engine "Note type" to parser sections.
 * Source of truth for section titles: decisionAlgo/aidraft/parser.md
 */

export const INTELLIDRAFT_NOTE_TYPES = [
  {
    noteType: "row-note",
    label: "Row note",
    section: "A. Row Note Draft",
    defaultTargetType: "case-note-row",
    summary: "One DSP case-note row — when to draft, required content, guardrails.",
  },
  {
    noteType: "block-time",
    label: "Block time",
    section: "B. Block Summary Draft",
    defaultTargetType: "time-block",
    summary: "Time-block summary — when to draft, required content, guardrails.",
  },
  {
    noteType: "final-note",
    label: "Final note",
    section: "C. Final Case Note Draft",
    defaultTargetType: "time-block",
    summary: "Whole-shift final case note — triggers, content, guardrails.",
  },
  {
    noteType: "handover-note",
    label: "Handover note",
    section: "D. Handoff Summary Draft",
    defaultTargetType: "time-block",
    summary: "Shift handoff summary — triggers, content, guardrails.",
  },
  {
    noteType: "orders",
    label: "Orders",
    section: "F. Orders and Medication Draft",
    defaultTargetType: "time-block",
    summary: "MAR / medication and order documentation — triggers, content, guardrails.",
  },
];

export const INTELLIDRAFT_SHARED_SECTION = {
  section: "E. AI Language and Safety Controls",
  noteType: "*",
  summary: "Language policy, contradiction checks, and blocking rules for all drafts.",
};

export const INTELLIDRAFT_SECTIONS = [
  ...INTELLIDRAFT_NOTE_TYPES.map(({ section, noteType }) => ({ section, noteType })),
  INTELLIDRAFT_SHARED_SECTION,
];

const sectionToNoteType = new Map(
  INTELLIDRAFT_SECTIONS.map((row) => [row.section, row.noteType])
);

export function resolveIntelliDraftNoteType(nodeOrSection = {}) {
  const section =
    typeof nodeOrSection === "string"
      ? nodeOrSection
      : String(nodeOrSection?.section || nodeOrSection?.title || "").trim();

  if (!section) {
    return "block-time";
  }

  return sectionToNoteType.get(section) || "block-time";
}

export function intelliDraftNoteTypeMatches(node, activeNoteType) {
  const resolved = resolveIntelliDraftNoteType(node);
  if (resolved === "*") {
    return true;
  }
  const normalized = String(activeNoteType || "block-time").trim();
  return resolved === normalized;
}

export function getIntelliDraftDefaultTargetType(noteType) {
  const match = INTELLIDRAFT_NOTE_TYPES.find((row) => row.noteType === noteType);
  return match?.defaultTargetType || "time-block";
}

export function getIntelliDraftTemplateForNoteType(noteType) {
  return (
    INTELLIDRAFT_NOTE_TYPES.find((row) => row.noteType === noteType) ||
    INTELLIDRAFT_NOTE_TYPES.find((row) => row.noteType === "block-time")
  );
}
