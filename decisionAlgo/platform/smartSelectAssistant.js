/**
 * Layer 11 — Smart Select: contextual assignment assistant only (supervisor owns final lock).
 */

import { filterNodesForAssignmentTarget } from "./filteringArchitecture.js";
import { getNodeDepthLevel } from "./depthSystem.js";
import {
  extractCrossSystemsFromClientProfile,
  nodeMatchesCrossSystemKeywords,
} from "./crossSystemEngine.js";
import { nodeTriggersEscalation } from "./escalationEngine.js";

export const SMART_SELECT_ROLE =
  "Recommends categories, depth, and risk-aware prompts — not autonomous assignment or runtime decisions.";

export const SMART_SELECT_PRESETS = [
  {
    id: "essential",
    label: "Essential",
    summary: "Depth 1 only — opening question per section (fast review).",
    maxDepth: 1,
    perSectionCap: 1,
    keywordBoost: false,
  },
  {
    id: "standard",
    label: "Default",
    summary: "Depths 1–2 — recommended default pack.",
    maxDepth: 2,
    perSectionCap: null,
    keywordBoost: false,
  },
  {
    id: "supervisor-focus",
    label: "Supervisor focus",
    summary: "Depths 1–2 plus risk, escalation, and cross-system-aware prompts.",
    maxDepth: 2,
    perSectionCap: null,
    keywordBoost: true,
  },
  {
    id: "complete",
    label: "Complete (target)",
    summary: "Every question in scope for this workflow block.",
    maxDepth: 99,
    perSectionCap: null,
    keywordBoost: false,
    fullVisible: true,
  },
  {
    id: "all-visible",
    label: "All in scope",
    summary: "Everything currently in scope for this target.",
    maxDepth: 99,
    perSectionCap: null,
    keywordBoost: false,
    fullVisible: true,
  },
];

const SUPERVISOR_KEYWORD_RE =
  /\b(supervisor|escalat|risk|refusal|incident|emergency|protocol|safety|compliance|injury|fall|aspiration|medication|hold|missed)\b/i;

function nodeText(node = {}) {
  return `${node.question || ""} ${node.title || ""} ${node.section || ""}`.trim();
}

function nodeMatchesSupervisorFocus(node = {}, overlays = [], workflowId = "") {
  if (SUPERVISOR_KEYWORD_RE.test(nodeText(node))) {
    return true;
  }
  if (nodeTriggersEscalation(node)) {
    return true;
  }
  return nodeMatchesCrossSystemKeywords(node, overlays, workflowId);
}

export function recommendSmartSelectKeys(visibleNodes = [], presetId = "standard", options = {}) {
  const preset = SMART_SELECT_PRESETS.find((row) => row.id === presetId) || SMART_SELECT_PRESETS[1];
  const isSelectable = options.isSelectable || (() => true);
  const capDepth = Number.isFinite(options.capDepth) ? options.capDepth : preset.maxDepth;
  const effectiveMaxDepth = Math.min(preset.maxDepth, capDepth);
  const targetContext = options.targetContext || null;
  const overlays =
    options.crossSystemOverlays ||
    extractCrossSystemsFromClientProfile(options.clientProfile);
  const workflowId = targetContext?.workflowId || "";
  const scopedNodes = filterNodesForAssignmentTarget(visibleNodes, targetContext);
  const selectable = scopedNodes.filter((node) => isSelectable(node));
  const bySection = new Map();

  selectable.forEach((node) => {
    const section = node.section || "Uncategorized";
    if (!bySection.has(section)) {
      bySection.set(section, []);
    }
    bySection.get(section).push(node);
  });

  const selectedKeys = [];
  const seen = new Set();
  const buildKey = options.buildKey || ((node) => `${node.library}::${node.section}::${node.id}`);

  const addNode = (node) => {
    const key = buildKey(node);
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    selectedKeys.push(key);
  };

  if (preset.fullVisible) {
    selectable.forEach(addNode);
    return { keys: selectedKeys, preset, overlays };
  }

  for (const [, sectionNodes] of bySection) {
    const sorted = [...sectionNodes].sort((left, right) => {
      const depthDelta = getNodeDepthLevel(left) - getNodeDepthLevel(right);
      if (depthDelta !== 0) {
        return depthDelta;
      }
      return String(left.id || "").localeCompare(String(right.id || ""));
    });

    let sectionCount = 0;

    for (const node of sorted) {
      const depth = getNodeDepthLevel(node);
      if (depth > effectiveMaxDepth) {
        continue;
      }

      if (preset.id === "supervisor-focus") {
        const essentialPick = depth === 1 && sectionCount === 0;
        const keywordPick =
          preset.keywordBoost && nodeMatchesSupervisorFocus(node, overlays, workflowId);
        if (!essentialPick && !keywordPick) {
          continue;
        }
      }

      if (preset.perSectionCap != null && sectionCount >= preset.perSectionCap) {
        continue;
      }

      addNode(node);
      sectionCount += 1;

      if (preset.perSectionCap != null && sectionCount >= preset.perSectionCap) {
        break;
      }
    }
  }

  return { keys: selectedKeys, preset, overlays };
}

export function getSmartSelectPresetLabel(presetId = "") {
  return SMART_SELECT_PRESETS.find((row) => row.id === presetId)?.label || presetId;
}
