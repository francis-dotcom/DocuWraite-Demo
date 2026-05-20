/**
 * Layer 3 — Categories: topics inside workflows (not time-based).
 */

export {
  inferNodeDocumentationCategory,
  filterNodesByDocumentationCategories,
  groupNodesByDocumentationCategory,
  getDocumentationCategoryHint,
  DOCUMENTATION_CATEGORY_LABELS,
  getCategoriesForWorkflow,
} from "../workflowCatalog.js";

export const CATEGORY_SYSTEM_ROLE =
  "Documentation topics within a workflow. Never structured as Morning Toileting or Evening Transfers.";

export function buildCategorySelection(contract = {}) {
  return {
    workflowId: contract.workflowId || "",
    categoryIds: Array.isArray(contract.categoryIds) ? contract.categoryIds : [],
    depthByCategory: contract.depthByCategory || {},
  };
}
