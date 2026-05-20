/**
 * Assignment scope facade — delegates to enterprise platform layers.
 * @see decisionAlgo/platform/filteringArchitecture.js
 * @see decisionAlgo/platform/assignmentEngine.js
 */

export {
  ASSIGNMENT_SCOPE_TARGET,
  ASSIGNMENT_SCOPE_FULL,
  BLOCK_TIME_SHARED_LIBRARIES,
  buildAssignmentTargetContext,
  collectNodeKeysOnOtherTimeBlocks,
  getBaseplanSectionForWorkflowId,
  filterNodesForAssignmentTarget,
  applyCrossBlockDedupe,
  resolveNodesForAssignmentScope,
  resolveCatalogForAssignment,
  formatAssignmentTargetScopeLabel,
  getAssignmentScopeHint,
  filterNodesForTimeBlockSelection,
  FILTER_TIERS,
} from "./platform/filteringArchitecture.js";

export {
  buildAssignmentContract,
  assignmentContractFromStaged,
  isAssignmentLocked,
} from "./platform/assignmentEngine.js";

export { extractCrossSystemsFromClientProfile } from "./platform/crossSystemEngine.js";
