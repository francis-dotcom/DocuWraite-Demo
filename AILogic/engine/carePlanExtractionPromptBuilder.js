const { getWorkflowContextEntries } = require("./carePlanContextLoader");

function buildKeyInstructions(entries = []) {
  return entries.map((entry) => ({
    context_key: entry.context_key,
    label: entry.label,
    description: entry.description,
    data_type: entry.data_type,
    tags: entry.tags || [],
  }));
}

function buildCarePlanExtractionSystemPrompt({ workflowTag = "" } = {}) {
  const { label, requiredEntries, optionalEntries } = getWorkflowContextEntries(workflowTag);
  const requiredKeys = requiredEntries.map((entry) => entry.context_key);
  const optionalKeys = optionalEntries.map((entry) => entry.context_key);

  return [
    "You are DocuWraite's care-plan context extraction assistant.",
    `Target workflow: ${workflowTag}.`,
    `Target label: ${label}.`,
    "Extract only the care-plan facts relevant to the listed context keys.",
    "Do not invent values or infer facts that are not explicitly supported by the source document.",
    "If a value is not found, return null for that key.",
    "Return JSON only.",
    "Use concise extracted values, not long quoted passages unless necessary.",
    "Set confidence to one of: high, medium, low.",
    `Required keys: ${requiredKeys.join(", ") || "none"}.`,
    `Optional keys: ${optionalKeys.join(", ") || "none"}.`,
    "Include source_pages when the source document provides page locations or when page indexing is available.",
  ].join("\n");
}

function buildCarePlanExtractionUserPrompt({
  workflowTag = "",
  documentText = "",
  documentName = "care plan PDF",
} = {}) {
  const { label, requiredEntries, optionalEntries } = getWorkflowContextEntries(workflowTag);

  const responseShape = {
    workflow_tag: workflowTag,
    workflow_label: label,
    extracted_items: [
      {
        context_key: "example_key",
        label: "Example Label",
        value: "Extracted value or null",
        confidence: "high",
        source_pages: [1],
        evidence: "Short supporting phrase from the document, if available",
      },
    ],
  };

  return [
    `Extract care-plan context for ${workflowTag} (${label}) from the following document text.`,
    "",
    "Required context keys:",
    JSON.stringify(buildKeyInstructions(requiredEntries), null, 2),
    "",
    "Optional context keys:",
    JSON.stringify(buildKeyInstructions(optionalEntries), null, 2),
    "",
    "Return JSON in this shape:",
    JSON.stringify(responseShape, null, 2),
    "",
    `Source document: ${documentName}`,
    "",
    "Document text:",
    documentText || "[No document text provided]",
  ].join("\n");
}

module.exports = {
  buildCarePlanExtractionSystemPrompt,
  buildCarePlanExtractionUserPrompt,
};
