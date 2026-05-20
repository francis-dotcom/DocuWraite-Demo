/**
 * Layer 14 — AI QA/review (separate from workflow, assignment, and runtime execution).
 */

export const AI_REVIEW_RESPONSIBILITIES = [
  "contradiction-detection",
  "missing-observations",
  "incomplete-charting",
  "risk-omission-detection",
  "timeline-inconsistency",
  "escalation-validation",
  "narrative-quality",
];

export const AI_REVIEW_LAYER_ROLE =
  "Global QA layer — must not own workflow structure or assignment contracts.";

export function buildAiReviewContext({ assignments = [], responses = [], scheduleBlocks = [] } = {}) {
  return {
    assignmentCount: assignments.length,
    finalizedCount: assignments.filter((row) => row.finalized).length,
    blockCount: scheduleBlocks.length,
    responseCount: responses.length,
    responsibilities: AI_REVIEW_RESPONSIBILITIES,
  };
}

/** Stub hook for future AI review pipelines. */
export function validateAssignmentForAiReview(assignment = {}) {
  const nodeCount = assignment?.selectedNodesPayload?.length || 0;
  return {
    ready: nodeCount > 0,
    warnings: nodeCount ? [] : ["assignment-has-no-nodes"],
  };
}
