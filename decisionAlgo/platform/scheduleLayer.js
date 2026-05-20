/**
 * Layer 1 — Schedule: when/where documentation happens. No question logic.
 */

export const SCHEDULE_LAYER_ROLE =
  "Defines timeline blocks, time placement, and workflow placement — not prompts or branching.";

export function buildScheduleBlockRef(block = {}) {
  return {
    id: String(block.id || ""),
    label: String(block.label || ""),
    workflowId: String(block.workflowId || "").trim(),
    description: String(block.description || "").trim(),
    source: block.source || "Shift Timeline",
    theme: block.theme || "",
  };
}

/** Schedule refs must not carry assignment/catalog fields. */
export function sanitizeScheduleBlock(block = {}) {
  const ref = buildScheduleBlockRef(block);
  return {
    ...ref,
    assignedNodes: undefined,
    selectedNodesPayload: undefined,
    checkedNodes: undefined,
  };
}

export function groupBlocksByTimeLabel(blocks = []) {
  const groups = [];
  const byLabel = new Map();
  blocks.forEach((block) => {
    const label = String(block?.label || "Unscheduled");
    if (!byLabel.has(label)) {
      const group = { label, blocks: [] };
      byLabel.set(label, group);
      groups.push(group);
    }
    byLabel.get(label).blocks.push(buildScheduleBlockRef(block));
  });
  return groups;
}

export function assertSeparateWorkflowContexts(blocksAtSameTime = []) {
  const workflowIds = new Set(
    blocksAtSameTime.map((block) => block.workflowId).filter(Boolean)
  );
  return {
    valid: workflowIds.size === blocksAtSameTime.length || blocksAtSameTime.length <= 1,
    workflowCount: workflowIds.size,
    blockCount: blocksAtSameTime.length,
  };
}
