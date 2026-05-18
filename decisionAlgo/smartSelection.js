/**
 * Rule-based "smart select" for Decision Engine — helps supervisors pick a
 * reasonable subset without checking every visible node.
 */

export const SMART_SELECT_PRESETS = [
  {
    id: "essential",
    label: "Essential",
    summary: "Depth 1 only — opening question in each section (fast review).",
    maxDepth: 1,
    perSectionCap: 1,
    keywordBoost: false,
  },
  {
    id: "standard",
    label: "Standard",
    summary: "Depths 1–2 — triggers plus first follow-up layer.",
    maxDepth: 2,
    perSectionCap: null,
    keywordBoost: false,
  },
  {
    id: "supervisor-focus",
    label: "Supervisor focus",
    summary: "Essential plus risk, escalation, refusal, protocol, and supervisor-related prompts.",
    maxDepth: 2,
    perSectionCap: null,
    keywordBoost: true,
  },
  {
    id: "all-visible",
    label: "All visible",
    summary: "Everything in the current library filter (same as section Select all combined).",
    maxDepth: 99,
    perSectionCap: null,
    keywordBoost: false,
  },
];

const SUPERVISOR_KEYWORD_RE =
  /\b(supervisor|escalat|risk|refusal|incident|emergency|protocol|safety|compliance|injury|fall|aspiration|medication|hold|missed)\b/i;

export function getDecisionNodeDepthFromId(nodeId = "") {
  const match = String(nodeId).match(/^([a-z]+)/i);
  if (!match) {
    return 1;
  }
  return match[1].toLowerCase().charCodeAt(0) - 96;
}

function nodeText(node = {}) {
  return `${node.question || ""} ${node.title || ""} ${node.section || ""}`.trim();
}

function nodeMatchesSupervisorFocus(node = {}) {
  return SUPERVISOR_KEYWORD_RE.test(nodeText(node));
}

/**
 * @param {object[]} visibleNodes - nodes currently shown in Decision Engine
 * @param {string} presetId - SMART_SELECT_PRESETS id
 * @param {object} options
 * @param {(node: object) => boolean} options.isSelectable - not conditional / not blocked
 * @param {number} [options.capDepth] - optional extra cap from toolbar Depth control
 * @returns {{ keys: string[], preset: object, message: string }}
 */
export function buildSmartSelection(visibleNodes = [], presetId = "standard", options = {}) {
  const preset = SMART_SELECT_PRESETS.find((row) => row.id === presetId) || SMART_SELECT_PRESETS[1];
  const isSelectable = options.isSelectable || (() => true);
  const capDepth = Number.isFinite(options.capDepth) ? options.capDepth : preset.maxDepth;
  const effectiveMaxDepth = Math.min(preset.maxDepth, capDepth);

  const selectable = visibleNodes.filter((node) => isSelectable(node));
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

  if (preset.id === "all-visible") {
    selectable.forEach((node) => {
      const key = options.buildKey?.(node) || `${node.library}::${node.section}::${node.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        selectedKeys.push(key);
      }
    });
    return {
      keys: selectedKeys,
      preset,
      message:
        selectedKeys.length > 0
          ? `Smart select (${preset.label}): checked ${selectedKeys.length} question(s). Review, adjust, then lock and Final Assign.`
          : `Smart select (${preset.label}): no questions matched. Widen Depth, switch to Full branch, or pick another library / note type.`,
    };
  }

  const addNode = (node) => {
    const key = options.buildKey?.(node) || `${node.library}::${node.section}::${node.id}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    selectedKeys.push(key);
  };

  for (const [, sectionNodes] of bySection) {
    const sorted = [...sectionNodes].sort((left, right) => {
      const depthDelta =
        getDecisionNodeDepthFromId(left.id) - getDecisionNodeDepthFromId(right.id);
      if (depthDelta !== 0) {
        return depthDelta;
      }
      return String(left.id || "").localeCompare(String(right.id || ""));
    });

    let sectionCount = 0;

    for (const node of sorted) {
      const depth = getDecisionNodeDepthFromId(node.id);
      if (depth > effectiveMaxDepth) {
        continue;
      }

      if (preset.id === "supervisor-focus") {
        const essentialPick = depth === 1 && sectionCount === 0;
        const keywordPick = preset.keywordBoost && nodeMatchesSupervisorFocus(node);
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

  const message =
    selectedKeys.length > 0
      ? `Smart select (${preset.label}): checked ${selectedKeys.length} question(s). Review, adjust, then lock and Final Assign.`
      : `Smart select (${preset.label}): no questions matched. Widen Depth, switch to Full branch, or pick another library / note type.`;

  return { keys: selectedKeys, preset, message };
}

export function getSmartSelectPresetLabel(presetId = "") {
  return SMART_SELECT_PRESETS.find((row) => row.id === presetId)?.label || presetId;
}
