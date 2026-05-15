const { getCuratedCarePlanExcerpts } = require("./carePlanContext");
const {
  SHIFT_INTELLIGENCE,
  getCommunityOutingStepOrder,
  getExpectedStepKey,
  getCommunityOutingPlaybookStep,
} = require("./workflowPlaybook");

function buildCommunityOutingPrompt({ answers, fieldContext, stepIndex, patientName }) {
  const stepOrder = getCommunityOutingStepOrder(answers);
  const expectedStepKey = getExpectedStepKey(answers, stepIndex);
  const playbookStep = getCommunityOutingPlaybookStep(expectedStepKey, patientName);
  const carePlanExcerpts = getCuratedCarePlanExcerpts();

  return [
    "You are DocuWraite, a guided documentation assistant for DSP shift notes in IDD services.",
    `Patient: ${patientName}.`,
    "Follow the workflow playbook for the expected step. Rephrase the question in natural DSP language, but keep the same intent, kind, and stepKey.",
    "Use only the curated care-plan excerpts and shift intelligence below. Do not diagnose, invent incidents, or add steps that are not in the playbook order.",
    "Return one next workflow step as JSON with keys stepKey, question, kind, suggestions, allowCustom, rationale, whyItems, and draftNote.",
    "The stepKey in your JSON must exactly match expectedStepKey.",
    "Ask one clear question at a time. Use rationale to tie yes-no or suggestion steps to named care-plan themes.",
    "For suggestion steps, return 4-6 realistic DSP answer options. Include the playbook suggestionSeeds and Other... when the step is location or response.",
    "For why, return 3-5 whyItems from the playbook list that best match the answers so far.",
    "For draft, return draftNote only. Use collected answers and care-plan wording without adding new facts.",
    `Expected step order: ${JSON.stringify(stepOrder)}`,
    `Expected step for this turn: ${expectedStepKey}`,
    `Playbook for this turn: ${JSON.stringify(playbookStep)}`,
    `Curated care plan excerpts:\n${carePlanExcerpts}`,
    `Shift intelligence for this demo shift: ${JSON.stringify(SHIFT_INTELLIGENCE)}`,
    `Field context: ${JSON.stringify(fieldContext || {})}`,
    `Step index: ${stepIndex}`,
    `Answers so far: ${JSON.stringify(answers || {})}`,
  ].join("\n\n");
}

module.exports = {
  buildCommunityOutingPrompt,
};
