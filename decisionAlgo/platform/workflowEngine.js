/**
 * Layer 2 — Workflow engine: documentation domains (ADL, Communication, …).
 * Risks are NOT workflows — they attach via cross-system overlays.
 */

export {
  WORKFLOW_SCHEDULE_OPTIONS,
  WORKFLOW_DOCUMENTATION_CATEGORIES,
  DOCUMENTATION_CATEGORY_LABELS,
  getWorkflowLabel,
  getCategoriesForWorkflow,
} from "../workflowCatalog.js";

export const WORKFLOW_ENGINE_ROLE =
  "Primary documentation context — what the DSP is actively supporting. Categories live inside workflows.";

/** Workflows that must never be duplicated for a single risk type. */
export const FORBIDDEN_WORKFLOW_PATTERNS = [
  /fall-risk/i,
  /seizure-adl/i,
  /behavioral-toileting/i,
];

export function isValidWorkflowId(workflowId = "") {
  const normalized = String(workflowId || "").trim();
  if (!normalized) {
    return false;
  }
  return !FORBIDDEN_WORKFLOW_PATTERNS.some((pattern) => pattern.test(normalized));
}
