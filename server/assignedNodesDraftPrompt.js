const ASSIGNED_NODES_PROMPT_VERSION = "v2-prioritized";

const ASSIGNED_NODES_JSON_KEYS = [
  "stepKey",
  "question",
  "kind",
  "draftNote",
  "followUpQuestion",
  "prioritizedFacts",
  "usedSectionKeys",
].join(", ");

const ASSIGNED_NODES_SYSTEM_PROMPT = [
  "You write concise DSP shift notes for one time block.",
  `Prompt policy version: ${ASSIGNED_NODES_PROMPT_VERSION}.`,
  "Output only valid JSON.",
  `Required keys: ${ASSIGNED_NODES_JSON_KEYS}.`,
  'Use stepKey "draft", kind "draft", question "Generated documentation".',
  "Rules:",
  "1. Use ONLY facts from ENABLED SECTIONS (sorted by priority). Never invent incidents, meds, or times.",
  "2. draftNote: one paragraph, past tense, chronological when times exist.",
  "3. Lead with tier must and due-now items; then safety; then scheduled/goals; then context/reference.",
  "4. Every enabled section must contribute at least one concrete fact to draftNote.",
  "4b. When a section includes dspClarifications, treat those Q&A pairs as authoritative DSP facts for that section.",
  "5. prioritizedFacts: array of 3–8 short strings, highest urgency first, each citing a section key in parentheses, e.g. \"Oxygen check 7:00 AM (medicationsDue)\".",
  "6. usedSectionKeys: array of section keys actually used in draftNote.",
  "7. followUpQuestion: one short question the DSP should answer if the highest-priority due/safety item is NOT clearly confirmed in assignedAnswers; otherwise empty string.",
  "8. If clarifyingAnswer is provided in the user message, reflect it in draftNote and set followUpQuestion to \"\".",
].join(" ");

function buildAssignedNodesUserPrompt({
  patientName,
  fieldContext,
  enabledDraftSections,
  caregiverNarration,
  clarifyingAnswer = "",
}) {
  const sections = [
    `Patient: ${patientName}.`,
    `Time block: ${fieldContext.label || fieldContext.timeBlock || "this block"}.`,
    "Write draftNote following PRIORITY ORDER below.",
  ];

  if (String(fieldContext.finalNoteStyleInstruction || "").trim()) {
    sections.push(
      `Writing style instruction: ${String(fieldContext.finalNoteStyleInstruction).trim()}. Use this only to shape tone and structure. Do not mention that a style was selected or confirmed.`
    );
  }

  if (String(clarifyingAnswer || "").trim()) {
    sections.push(`DSP clarifying answer (use in draftNote): ${String(clarifyingAnswer).trim()}`);
  }

  if (Array.isArray(enabledDraftSections) && enabledDraftSections.length) {
    sections.push(
      `Enabled section keys (priority order): ${enabledDraftSections.map((entry) => entry.key).join(", ")}`,
      "PRIORITY ORDER — ENABLED SECTIONS:"
    );
    enabledDraftSections.forEach((entry, index) => {
      const header = [
        `SECTION ${index + 1}`,
        `key=${entry.key}`,
        `tier=${entry.tier}`,
        `priority=${entry.priority}`,
        entry.label,
        `— ${entry.instruction}`,
      ].join(" | ");
      if (entry.includeCarePlanExcerpt) {
        sections.push(`${header}:\n${entry.carePlanExcerpt || entry.content || ""}`);
        return;
      }
      sections.push(`${header}:\n${JSON.stringify(entry.content)}`);
    });
  }

  if (caregiverNarration?.length) {
    sections.push(`Caregiver narration fields: ${JSON.stringify(caregiverNarration)}`);
  }

  return sections.filter(Boolean).join("\n\n");
}

module.exports = {
  ASSIGNED_NODES_PROMPT_VERSION,
  ASSIGNED_NODES_SYSTEM_PROMPT,
  buildAssignedNodesUserPrompt,
};
