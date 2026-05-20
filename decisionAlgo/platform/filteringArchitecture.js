/**
 * Layer 12 — Filtering hierarchy: Hard (workflow) → Medium (category) → Soft (time) → Cross (overlays).
 */

import { filterNodesByDocumentationCategories, getDocumentationCategoryHint, getWorkflowLabel } from "../workflowCatalog.js";
import {
  applyCrossBlockDedupe,
  collectNodeKeysOnOtherTimeBlocks,
  filterNodesForWorkflowHard,
  buildAssignmentTargetContext,
  getBaseplanSectionForWorkflowId,
  BLOCK_TIME_SHARED_LIBRARIES,
} from "./assignmentEngine.js";
import { filterNodesByMaxDepth } from "./depthSystem.js";
import { prioritizeNodesByCrossSystems } from "./crossSystemEngine.js";

export const FILTER_TIERS = {
  HARD: "workflow",
  MEDIUM: "category",
  SOFT: "time-of-day",
  CROSS: "cross-system",
};

export const ASSIGNMENT_SCOPE_TARGET = "target-scoped";
export const ASSIGNMENT_SCOPE_FULL = "full-filter";

export {
  buildAssignmentTargetContext,
  collectNodeKeysOnOtherTimeBlocks,
  getBaseplanSectionForWorkflowId,
  BLOCK_TIME_SHARED_LIBRARIES,
  applyCrossBlockDedupe,
};

export function resolveCatalogForAssignment(
  visibleNodes = [],
  {
    targetContext = null,
    scopeMode = ASSIGNMENT_SCOPE_TARGET,
    keysOnOtherTimeBlocks = null,
    buildKey = null,
    selectedCategoryIds = [],
    maxDepth = null,
    crossSystemOverlays = [],
    timeOfDayHint = null,
  } = {}
) {
  let nodes = visibleNodes;
  const audit = { hard: 0, medium: 0, soft: 0, cross: 0, dedupe: 0 };

  if (scopeMode === ASSIGNMENT_SCOPE_TARGET) {
    const before = nodes.length;
    nodes = filterNodesForWorkflowHard(nodes, targetContext);
    audit.hard = before - nodes.length;
  }

  if (targetContext?.targetType === "time-block" && targetContext.workflowId) {
    const before = nodes.length;
    nodes = filterNodesByDocumentationCategories(
      nodes,
      targetContext.workflowId,
      selectedCategoryIds
    );
    audit.medium = before - nodes.length;
  }

  if (maxDepth != null) {
    const before = nodes.length;
    nodes = filterNodesByMaxDepth(nodes, maxDepth);
    audit.soft = before - nodes.length;
  }

  if (targetContext?.targetType === "time-block") {
    const before = nodes.length;
    nodes = applyCrossBlockDedupe(nodes, keysOnOtherTimeBlocks, buildKey);
    audit.dedupe = before - nodes.length;
  }

  if (crossSystemOverlays?.length && targetContext?.workflowId) {
    nodes = prioritizeNodesByCrossSystems(nodes, crossSystemOverlays, targetContext.workflowId);
    audit.cross = crossSystemOverlays.length;
  }

  if (timeOfDayHint) {
    audit.softHint = timeOfDayHint;
  }

  return { nodes, audit };
}

/** @alias resolveCatalogForAssignment — backward compatible name */
export function resolveNodesForAssignmentScope(visibleNodes = [], options = {}) {
  return resolveCatalogForAssignment(visibleNodes, options).nodes;
}

export function filterNodesForAssignmentTarget(nodes = [], targetContext = null) {
  return filterNodesForWorkflowHard(nodes, targetContext);
}

export function formatAssignmentTargetScopeLabel(targetContext = null) {
  if (!targetContext?.targetType) {
    return "";
  }
  if (targetContext.targetType === "time-block" && targetContext.blockLabel) {
    const workflowLabel =
      targetContext.workflowLabel || String(targetContext.workflowId || "").replace(/-/g, " ");
    return workflowLabel
      ? `${targetContext.blockLabel} · ${workflowLabel}`
      : targetContext.blockLabel;
  }
  if (targetContext.targetType === "case-note-row") {
    return "this case-note row";
  }
  return "";
}

export function getAssignmentScopeHint(
  targetContext,
  scopeMode,
  { hiddenByTarget = 0, hiddenByDedupe = 0, selectedCategoryIds = [], crossSystemCount = 0 } = {}
) {
  const label = formatAssignmentTargetScopeLabel(targetContext);
  if (scopeMode === ASSIGNMENT_SCOPE_FULL) {
    return "Advanced: full library filter. Normal path: Schedule → Target → Workflow (hard) → Category → Depth → Lock.";
  }
  if (!targetContext) {
    return "Pick a Target block or row. Same hour can hold multiple workflow packs (e.g. ADL + Communication).";
  }
  if (targetContext.targetType === "time-block") {
    const workflowLabel = getWorkflowLabel(targetContext.workflowId);
    let hint = `This block only: ${label}. Hard filter: ${workflowLabel} workflow (dominant — not time-of-day).`;
    const categoryHint = getDocumentationCategoryHint(targetContext.workflowId, selectedCategoryIds);
    if (categoryHint) {
      hint += ` ${categoryHint}`;
    }
    if (crossSystemCount > 0) {
      hint += ` Cross-system: ${crossSystemCount} client overlay(s) prioritizing risk-aware prompts.`;
    }
    if (hiddenByDedupe > 0) {
      hint += ` ${hiddenByDedupe} question(s) hidden — already on another block.`;
    }
    return hint;
  }
  if (targetContext.targetType === "case-note-row") {
    return "This row only: row-note Baseplan + shared libraries.";
  }
  return "";
}

export function filterNodesForTimeBlockSelection(
  nodes = [],
  targetContext = null,
  keysOnOtherTimeBlocks = null,
  buildKey = null
) {
  return resolveNodesForAssignmentScope(nodes, {
    targetContext,
    scopeMode: ASSIGNMENT_SCOPE_TARGET,
    keysOnOtherTimeBlocks,
    buildKey,
  });
}
