const {
  getWorkflowContextEntries,
  getWorkflowContextRequirement,
  normalizeWorkflowTag,
} = require("./carePlanContextLoader");

function normalizeConfidence(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (["high", "medium", "low"].includes(normalized)) {
    return normalized;
  }
  return normalized ? "medium" : "low";
}

function normalizeValueByType(value, dataType = "string") {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (dataType === "boolean") {
    if (typeof value === "boolean") {
      return value;
    }
    const normalized = String(value).trim().toLowerCase();
    if (["true", "yes", "required", "present", "active"].includes(normalized)) {
      return true;
    }
    if (["false", "no", "not required", "not present", "inactive"].includes(normalized)) {
      return false;
    }
  }

  return value;
}

function normalizeSourcePages(sourcePages) {
  if (!Array.isArray(sourcePages)) {
    return [];
  }
  return sourcePages
    .map((page) => Number(page))
    .filter((page) => Number.isFinite(page) && page > 0);
}

function normalizeExtractedItems(extraction = {}) {
  if (Array.isArray(extraction)) {
    return extraction;
  }
  if (Array.isArray(extraction.extracted_items)) {
    return extraction.extracted_items;
  }

  if (extraction && typeof extraction === "object") {
    return Object.entries(extraction)
      .filter(([key]) => !["workflow_tag", "workflow_label"].includes(key))
      .map(([context_key, item]) => {
        if (item && typeof item === "object" && !Array.isArray(item)) {
          return {
            context_key,
            ...item,
          };
        }
        return {
          context_key,
          value: item,
        };
      });
  }

  return [];
}

function fitAiExtractionToWorkflowContext({ workflowTag = "", extraction = {} } = {}) {
  const normalizedTag = normalizeWorkflowTag(workflowTag || extraction.workflow_tag || "");
  const workflow = getWorkflowContextRequirement(normalizedTag);
  const { requiredEntries, optionalEntries, registry } = getWorkflowContextEntries(normalizedTag);
  const knownKeys = new Set([
    ...requiredEntries.map((entry) => entry.context_key),
    ...optionalEntries.map((entry) => entry.context_key),
  ]);

  const normalizedItems = normalizeExtractedItems(extraction);
  const extractedByKey = new Map();

  normalizedItems.forEach((item) => {
    const contextKey = String(item?.context_key || "").trim();
    if (!contextKey || !knownKeys.has(contextKey)) {
      return;
    }

    const registryEntry = registry.entriesByKey[contextKey];
    extractedByKey.set(contextKey, {
      context_key: contextKey,
      label: registryEntry?.label || item.label || contextKey,
      value: normalizeValueByType(item.value, registryEntry?.data_type),
      confidence: normalizeConfidence(item.confidence),
      source_pages: normalizeSourcePages(item.source_pages),
      evidence: item.evidence ? String(item.evidence).trim() : "",
      description: registryEntry?.description || "",
      data_type: registryEntry?.data_type || "string",
      tags: registryEntry?.tags || [],
    });
  });

  const buildSection = (entries) =>
    Object.fromEntries(
      entries.map((entry) => {
        const extracted = extractedByKey.get(entry.context_key);
        return [
          entry.context_key,
          extracted || {
            context_key: entry.context_key,
            label: entry.label,
            value: null,
            confidence: "low",
            source_pages: [],
            evidence: "",
            description: entry.description,
            data_type: entry.data_type,
            tags: entry.tags || [],
          },
        ];
      })
    );

  const requiredContext = buildSection(requiredEntries);
  const optionalContext = buildSection(optionalEntries);
  const missingRequiredKeys = workflow.requiredKeys.filter(
    (key) => requiredContext[key] && (requiredContext[key].value === null || requiredContext[key].value === "")
  );
  const unknownExtractedKeys = normalizedItems
    .map((item) => String(item?.context_key || "").trim())
    .filter(Boolean)
    .filter((key) => !knownKeys.has(key));

  return {
    workflow_tag: normalizedTag,
    workflow_label: workflow.label,
    required_context: requiredContext,
    optional_context: optionalContext,
    missing_required_keys: missingRequiredKeys,
    unknown_extracted_keys: [...new Set(unknownExtractedKeys)],
  };
}

module.exports = {
  fitAiExtractionToWorkflowContext,
};
