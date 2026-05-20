/**
 * Layer 4 — Depth: investigation detail inside documentation logic (not schedule/workflow identity).
 */

import { getDepthLevelFromNodeId } from "../workflowCatalog.js";

export { getDepthLevelFromNodeId };

export const DEPTH_LABELS = {
  1: "minimal / simple",
  2: "moderate branching",
  3: "full clinical detail",
};

export const DEPTH_SYSTEM_ROLE =
  "Controls branching intensity and follow-up granularity. Does not change workflow or schedule ownership.";

export function getNodeDepthLevel(node = {}) {
  if (Number.isFinite(node.depthLevel)) {
    return node.depthLevel;
  }
  if (Number.isFinite(node.depth)) {
    return node.depth;
  }
  return getDepthLevelFromNodeId(node.id);
}

export function filterNodesByMaxDepth(nodes = [], maxDepth = 99) {
  const cap = Number(maxDepth) || 99;
  return nodes.filter((node) => getNodeDepthLevel(node) <= cap);
}

export function buildDepthSelectionMap(categoryIds = [], defaultDepth = 2) {
  return categoryIds.reduce((acc, categoryId) => {
    acc[categoryId] = defaultDepth;
    return acc;
  }, {});
}
