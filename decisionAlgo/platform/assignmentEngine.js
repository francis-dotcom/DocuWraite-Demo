/**
 * Layer 6 — Assignment engine: locked documentation contracts per workflow block.
 */

import {
  BASEPLAN_SECTION_WORKFLOW_IDS,
  getWorkflowIdForBaseplanSection,
} from "../noteTypeRegistry.js";

export const ASSIGNMENT_ENGINE_ROLE =
  "Binds workflow block + categories + depth + branching into auditable packs. Separate from runtime responses and AI review.";

export const BLOCK_TIME_SHARED_LIBRARIES = new Set([
  "branching",
  "careplan",
  "runtime",
  "readiness",
  "playbookR",
  "aidraft",
]);

const ROW_NOTE_BASEPLAN_SECTION = "L. row-note-support";

export function getBaseplanSectionForWorkflowId(workflowId = "") {
  const normalized = String(workflowId || "").trim();
  if (!normalized) {
    return null;
  }
  return (
    Object.entries(BASEPLAN_SECTION_WORKFLOW_IDS).find(([, id]) => id === normalized)?.[0] || null
  );
}

export function collectNodeKeysOnOtherTimeBlocks(assignments = [], currentTargetKey = "") {
  const keys = new Set();
  assignments.forEach((assignment) => {
    const target = assignment?.target || {};
    if (target.type !== "time-block") {
      return;
    }
    const targetKey = target.key || (target.targetId ? `time:${target.targetId}` : "");
    if (!targetKey || targetKey === currentTargetKey) {
      return;
    }
    (assignment.selectedNodesPayload || []).forEach((payload) => {
      if (payload?.key) {
        keys.add(payload.key);
      }
    });
  });
  return keys;
}

export function buildAssignmentTargetContext({
  selectedTargetKey = "",
  targetType = "",
  timeBlocks = [],
  workflowOptions = [],
  resolveWorkflowId = () => "",
  resolveBlockLabel = () => "",
  resolveWorkflowLabel = () => "",
} = {}) {
  if (!selectedTargetKey) {
    return null;
  }

  if (targetType === "case-note-row" && String(selectedTargetKey).startsWith("row:")) {
    return {
      targetType: "case-note-row",
      targetKey: selectedTargetKey,
      baseplanSection: ROW_NOTE_BASEPLAN_SECTION,
    };
  }

  if (targetType === "time-block" && String(selectedTargetKey).startsWith("time:")) {
    const blockId = String(selectedTargetKey).replace(/^time:/, "");
    const block = timeBlocks.find((entry) => String(entry.id) === blockId);
    const workflowId = resolveWorkflowId(block);
    const workflowLabel = resolveWorkflowLabel(block) || workflowId.replace(/-/g, " ");
    return {
      targetType: "time-block",
      targetKey: selectedTargetKey,
      targetId: blockId,
      workflowId,
      workflowLabel,
      blockLabel: resolveBlockLabel(block),
      baseplanSection: getBaseplanSectionForWorkflowId(workflowId),
    };
  }

  return null;
}

/**
 * Locked assignment contract — supervisor-owned, deterministic for DSP runtime.
 */
export function buildAssignmentContract({
  targetContext = null,
  categoryIds = [],
  depthByCategory = {},
  maxDepth = 2,
  selectedNodeKeys = [],
  librarySlug = "baseplan",
  noteType = "block-time",
  includeMode = "full-branch",
  branchingBranchKey = "",
  status = "draft",
} = {}) {
  return {
    version: 1,
    status,
    locked: status === "locked" || status === "finalized",
    target: targetContext,
    workflowId: targetContext?.workflowId || "",
    categoryIds: [...categoryIds],
    depthByCategory: { ...depthByCategory },
    maxDepth: Number(maxDepth) || 2,
    librarySlug,
    noteType,
    includeMode,
    branchingBranchKey,
    selectedNodeKeys: [...selectedNodeKeys],
    createdAt: new Date().toISOString(),
  };
}

export function assignmentContractFromStaged(stagedAssignment = {}) {
  const payloads = stagedAssignment.selectedNodesPayload || [];
  return buildAssignmentContract({
    targetContext: {
      targetType: stagedAssignment.target?.type,
      targetKey: stagedAssignment.target?.key,
      targetId: stagedAssignment.target?.targetId,
      workflowId: stagedAssignment.target?.workflowId,
      workflowLabel: stagedAssignment.target?.label,
      blockLabel: stagedAssignment.target?.label,
    },
    maxDepth: stagedAssignment.selectedDepth,
    selectedNodeKeys: payloads.map((row) => row.key).filter(Boolean),
    librarySlug: stagedAssignment.selectedLibrary,
    noteType: stagedAssignment.selectedNoteType,
    includeMode: stagedAssignment.includeMode,
    branchingBranchKey: stagedAssignment.selectedBranchKey,
    status: "locked",
  });
}

export function isAssignmentLocked(assignment = {}) {
  return Boolean(
    assignment?.locked ||
      (assignment?.selectedNodesPayload || []).length > 0 ||
      assignment?.status === "locked" ||
      assignment?.status === "finalized"
  );
}

export function applyCrossBlockDedupe(nodes = [], keysOnOtherTimeBlocks = null, buildKey = null) {
  const resolveKey =
    buildKey || ((node) => `${node.library}::${node.section}::${node.id}`);
  if (!keysOnOtherTimeBlocks?.size) {
    return nodes;
  }
  return nodes.filter((node) => !keysOnOtherTimeBlocks.has(resolveKey(node)));
}

export function filterNodesForWorkflowHard(nodes = [], targetContext = null) {
  if (!targetContext?.targetType) {
    return nodes;
  }

  if (targetContext.targetType === "case-note-row") {
    return nodes.filter((node) => {
      if (node.library === "baseplan") {
        return node.section === ROW_NOTE_BASEPLAN_SECTION;
      }
      return true;
    });
  }

  if (targetContext.targetType === "time-block" && targetContext.workflowId) {
    const { workflowId } = targetContext;
    return nodes.filter((node) => {
      if (BLOCK_TIME_SHARED_LIBRARIES.has(node.library)) {
        return true;
      }
      if (node.library !== "baseplan") {
        return true;
      }
      const sectionWorkflow = getWorkflowIdForBaseplanSection(node.section || "");
      if (!sectionWorkflow) {
        return false;
      }
      return sectionWorkflow === workflowId;
    });
  }

  return nodes;
}
