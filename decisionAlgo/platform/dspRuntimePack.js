/**
 * Layer 7 — DSP runtime: deterministic packs from locked assignments only (never full library).
 */

import { inferNodeDocumentationCategory } from "../workflowCatalog.js";

export const DSP_RUNTIME_ROLE =
  "Guided, focused documentation — only assigned nodes/branching for the opened workflow block.";

export function buildDspRuntimePack({
  targetKey = "",
  workflowId = "",
  assignments = [],
  expandNodes = (payload) => payload,
} = {}) {
  const matching = assignments.filter((assignment) => {
    const target = assignment.target || {};
    const assignmentKey =
      target.key || (target.targetId ? `${target.type === "case-note-row" ? "row" : "time"}:${target.targetId}` : "");
    if (targetKey && assignmentKey !== targetKey) {
      return false;
    }
    if (workflowId && target.workflowId && target.workflowId !== workflowId) {
      return false;
    }
    return (assignment.selectedNodesPayload || []).length > 0;
  });

  const nodes = [];
  matching.forEach((assignment) => {
    const expanded = expandNodes(assignment.selectedNodesPayload || [], assignment);
    expanded.forEach((node) => {
      nodes.push({
        ...node,
        workflowId: assignment.target?.workflowId || workflowId,
        category: inferNodeDocumentationCategory(node, assignment.target?.workflowId || workflowId),
        assignmentId: assignment.id,
      });
    });
  });

  return {
    targetKey,
    workflowId,
    assignmentIds: matching.map((row) => row.id).filter(Boolean),
    nodeCount: nodes.length,
    nodes,
    deterministic: true,
  };
}

export function dspPackIncludesOnlyWorkflow(pack = {}, expectedWorkflowId = "") {
  if (!expectedWorkflowId) {
    return true;
  }
  return pack.nodes.every(
    (node) =>
      !node.workflowId ||
      node.workflowId === expectedWorkflowId ||
      node.library !== "baseplan"
  );
}
