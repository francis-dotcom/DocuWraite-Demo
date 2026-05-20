/**
 * Smart select facade — contextual assignment assistant (supervisor-owned lock).
 * @see decisionAlgo/platform/smartSelectAssistant.js
 */

import { formatAssignmentTargetScopeLabel } from "./platform/filteringArchitecture.js";
import {
  SMART_SELECT_PRESETS,
  recommendSmartSelectKeys,
  getSmartSelectPresetLabel,
} from "./platform/smartSelectAssistant.js";

export {
  collectNodeKeysOnOtherTimeBlocks,
  filterNodesForAssignmentTarget,
  filterNodesForTimeBlockSelection,
} from "./platform/filteringArchitecture.js";

export { SMART_SELECT_PRESETS, getSmartSelectPresetLabel };

export function getDecisionNodeDepthFromId(nodeId = "") {
  const match = String(nodeId).match(/^([a-z]+)/i);
  if (!match) {
    return 1;
  }
  return match[1].toLowerCase().charCodeAt(0) - 96;
}

function formatTargetScopeLabel(targetContext = null) {
  const label = formatAssignmentTargetScopeLabel(targetContext);
  if (!label) {
    return "";
  }
  if (targetContext?.targetType === "case-note-row") {
    return " for this case-note row";
  }
  return ` for ${label}`;
}

/**
 * @param {object[]} visibleNodes
 * @param {string} presetId
 * @param {object} options - targetContext, clientProfile, crossSystemOverlays, buildKey, capDepth, isSelectable
 */
export function buildSmartSelection(visibleNodes = [], presetId = "standard", options = {}) {
  const { keys, preset, overlays } = recommendSmartSelectKeys(visibleNodes, presetId, options);
  const targetContext = options.targetContext || null;
  const scopeLabel = formatTargetScopeLabel(targetContext);

  const emptyMessage = scopeLabel
    ? `No questions match this target${scopeLabel} in the current filter. Use Baseplan + Block time and widen Depth.`
    : "Pick a Target block first, or use full library filter (advanced).";

  const crossNote =
    overlays?.length && preset.id === "supervisor-focus"
      ? " Risk overlays from care plan applied."
      : "";

  if (preset.fullVisible) {
    if (preset.id === "complete") {
      return {
        keys,
        preset,
        message:
          keys.length > 0
            ? `Complete (target): checked ${keys.length} question(s)${scopeLabel}. Lock this block, then repeat for other timeline blocks.${crossNote}`
            : `Complete (target): ${emptyMessage}`,
      };
    }
    return {
      keys,
      preset,
      message:
        keys.length > 0
          ? `Smart select (${preset.label}): checked ${keys.length} question(s)${scopeLabel || ""}. Review, adjust, then lock and Final Assign.${crossNote}`
          : `Smart select (${preset.label}): ${emptyMessage}`,
    };
  }

  const message =
    keys.length > 0
      ? `Smart select (${preset.label}): checked ${keys.length} question(s)${scopeLabel || ""}. Review, adjust, then lock and Final Assign.${crossNote}`
      : scopeLabel
        ? `Smart select (${preset.label}): no questions matched${scopeLabel}. Widen Depth, use Baseplan + Block time, or pick another library.`
        : `Smart select (${preset.label}): no questions matched. Pick a Target block, widen Depth, or switch library.`;

  return { keys, preset, message };
}
