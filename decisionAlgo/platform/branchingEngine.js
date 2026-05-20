/**
 * Layer 5 — Branching: contextual, conditional, workflow/depth-aware follow-ups.
 */

import {
  BRANCHING_FOLLOW_UP_BRANCHES,
  getBranchingFollowUpNodes,
} from "../noteTypeRegistry.js";
import { getNodeDepthLevel } from "./depthSystem.js";

export { BRANCHING_FOLLOW_UP_BRANCHES, getBranchingFollowUpNodes };

export const BRANCHING_ENGINE_ROLE =
  "Escalation and follow-up trees — not giant static forms. Uses branching.md in selective mode.";

export function resolveBranchingPack({
  libraries = [],
  noteType = "",
  branchKey = "",
  depth = 2,
  includeMode = "selective-branch",
} = {}) {
  if (includeMode !== "selective-branch") {
    return [];
  }
  return getBranchingFollowUpNodes(libraries, {
    noteType,
    branchKey,
    depth,
    includeMode,
  });
}

export function nodeMatchesBranchingDepth(node = {}, maxDepth = 2) {
  return getNodeDepthLevel(node) <= Number(maxDepth || 2);
}
